import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isAfter,
  parseISO,
} from "date-fns";
import { DAILY_STUDY_LIMIT, PLAN_MONTHS } from "../data/certifications";
import type {
  Certification,
  DashboardMetrics,
  Difficulty,
  PlannedCertification,
  StudyAlert,
  StudyLog,
} from "../types";
import { clamp } from "./utils";

export const difficultyWeights: Record<Difficulty, number> = {
  Baja: 1,
  Media: 1.5,
  Alta: 2,
  Avanzada: 2.5,
  Experta: 3,
};

export function getPlanWindow(planStartIso: string, today = new Date()) {
  const planStart = parseISO(planStartIso);
  const deadline = addMonths(planStart, PLAN_MONTHS);
  const totalDays = Math.max(1, differenceInCalendarDays(deadline, planStart));
  const elapsedDays = clamp(differenceInCalendarDays(today, planStart), 0, totalDays);
  const remainingDays = Math.max(1, differenceInCalendarDays(deadline, today));

  return { planStart, deadline, totalDays, elapsedDays, remainingDays };
}

export function getStudiedHours(certificationId: string, logs: StudyLog[]) {
  return logs
    .filter((log) => log.certificationId === certificationId)
    .reduce((sum, log) => sum + log.hours, 0);
}

export function getDailyLoggedHours(date: string, logs: StudyLog[]) {
  return logs
    .filter((log) => log.date === date)
    .reduce((sum, log) => sum + log.hours, 0);
}

export function buildStudyPlan(
  certifications: Certification[],
  logs: StudyLog[],
  planStartIso: string,
  today = new Date(),
) {
  const { deadline, totalDays, elapsedDays, remainingDays } = getPlanWindow(
    planStartIso,
    today,
  );

  const base = certifications.map((certification) => {
    const studiedHours = getStudiedHours(certification.id, logs);
    const remainingHours = Math.max(0, certification.estimatedHours - studiedHours);
    const weight = difficultyWeights[certification.difficulty];
    return { certification, studiedHours, remainingHours, weight };
  });

  const totalRemainingHours = base.reduce((sum, item) => sum + item.remainingHours, 0);
  const totalWeightedDemand = base.reduce(
    (sum, item) => sum + item.remainingHours * item.weight * item.certification.priority,
    0,
  );
  const requiredDailyHours = totalRemainingHours / remainingDays;
  const dailyBudget = Math.min(DAILY_STUDY_LIMIT, Math.max(0, requiredDailyHours));

  const planned = base.map<PlannedCertification>((item) => {
    const progress = clamp(
      (item.studiedHours / item.certification.estimatedHours) * 100 || 0,
      0,
      100,
    );
    const weightedShare =
      totalWeightedDemand > 0
        ? (item.remainingHours * item.weight * item.certification.priority) /
          totalWeightedDemand
        : 0;
    const dailyRecommendation =
      item.remainingHours === 0 ? 0 : Math.max(0.1, dailyBudget * weightedShare);
    const daysToFinishAtPlan =
      dailyRecommendation > 0
        ? Math.ceil(item.remainingHours / dailyRecommendation)
        : 0;
    const rawExamDate =
      item.remainingHours === 0 ? today : addDays(today, daysToFinishAtPlan);
    const suggestedExamDate = isAfter(rawExamDate, deadline) ? deadline : rawExamDate;
    const expectedHoursToday =
      item.certification.estimatedHours * (elapsedDays / totalDays);

    const status =
      progress >= 100
        ? "Completado"
        : item.studiedHours + 0.5 < expectedHoursToday ||
            requiredDailyHours > DAILY_STUDY_LIMIT
          ? "Retrasado"
          : item.studiedHours >= expectedHoursToday
            ? "Al día"
            : "En progreso";

    return {
      ...item.certification,
      studiedHours: item.studiedHours,
      remainingHours: item.remainingHours,
      progress,
      dailyRecommendation,
      suggestedExamDate: format(suggestedExamDate, "yyyy-MM-dd"),
      status,
      expectedHoursToday,
      daysToFinishAtPlan,
    };
  });

  return planned.sort((a, b) => b.priority - a.priority || b.remainingHours - a.remainingHours);
}

export function buildAlerts(
  planned: PlannedCertification[],
  logs: StudyLog[],
  planStartIso: string,
  today = new Date(),
): StudyAlert[] {
  const { remainingDays } = getPlanWindow(planStartIso, today);
  const totalRemaining = planned.reduce((sum, cert) => sum + cert.remainingHours, 0);
  const globalRequiredDaily = totalRemaining / remainingDays;
  const recentDates = Array.from({ length: 4 }, (_, index) =>
    format(addDays(today, -index), "yyyy-MM-dd"),
  );
  const recentLoggedHours = recentDates.reduce(
    (sum, date) =>
      sum + logs.filter((log) => log.date === date).reduce((inner, log) => inner + log.hours, 0),
    0,
  );

  const alerts = planned.flatMap<StudyAlert>((certification) => {
    if (certification.progress >= 100) {
      return [];
    }

    const certRequiredDaily = certification.remainingHours / remainingDays;
    const missingVsExpected = Math.max(
      0,
      certification.expectedHoursToday - certification.studiedHours,
    );
    const certAlerts: StudyAlert[] = [];

    if (missingVsExpected > 0.5) {
      certAlerts.push({
        id: `${certification.id}-behind`,
        certificationId: certification.id,
        certificationName: certification.name,
        reason: "Las horas registradas están por debajo de lo esperado para la fecha actual.",
        missingHours: missingVsExpected,
        newDailyRecommendation: certRequiredDaily,
        action: "Reasignar el siguiente bloque libre a esta certificación y cerrar el atraso semanal.",
        risk: missingVsExpected > 10 ? "Alto" : "Medio",
      });
    }

    if (certRequiredDaily > DAILY_STUDY_LIMIT) {
      certAlerts.push({
        id: `${certification.id}-impossible`,
        certificationId: certification.id,
        certificationName: certification.name,
        reason: "No puede completarse antes del plazo máximo con el ritmo disponible actual.",
        missingHours: certification.remainingHours,
        newDailyRecommendation: certRequiredDaily,
        action: "Reducir alcance, mover prioridad o extender fecha objetivo.",
        risk: "Crítico",
      });
    }

    if (recentLoggedHours < DAILY_STUDY_LIMIT * 2 && certification.dailyRecommendation > 0.4) {
      certAlerts.push({
        id: `${certification.id}-low-recent`,
        certificationId: certification.id,
        certificationName: certification.name,
        reason: "El registro reciente está por debajo del ritmo recomendado durante varios días.",
        missingHours: Math.max(0, certification.dailyRecommendation * 4 - recentLoggedHours),
        newDailyRecommendation: certification.dailyRecommendation,
        action: "Usar sesiones cortas de recuperación y registrar horas diariamente para recalcular.",
        risk: "Bajo",
      });
    }

    return certAlerts;
  });

  if (globalRequiredDaily > DAILY_STUDY_LIMIT) {
    alerts.unshift({
      id: "global-overload",
      certificationId: "global",
      certificationName: "Plan completo",
      reason: "La carga diaria necesaria supera las 5 horas disponibles.",
      missingHours: totalRemaining,
      newDailyRecommendation: globalRequiredDaily,
      action: "Priorizar certificaciones críticas o ampliar el plazo máximo.",
      risk: "Crítico",
    });
  }

  return alerts;
}

export function buildDashboardMetrics(
  planned: PlannedCertification[],
  planStartIso: string,
  today = new Date(),
): DashboardMetrics {
  const { deadline, remainingDays } = getPlanWindow(planStartIso, today);
  const totalEstimatedHours = planned.reduce((sum, cert) => sum + cert.estimatedHours, 0);
  const totalStudiedHours = planned.reduce((sum, cert) => sum + cert.studiedHours, 0);
  const totalRemainingHours = Math.max(0, totalEstimatedHours - totalStudiedHours);
  const upcoming = planned
    .filter((cert) => cert.status !== "Completado")
    .sort((a, b) => a.suggestedExamDate.localeCompare(b.suggestedExamDate))[0];

  return {
    totalCertifications: planned.length,
    totalEstimatedHours,
    totalStudiedHours,
    totalRemainingHours,
    globalProgress: clamp((totalStudiedHours / totalEstimatedHours) * 100 || 0, 0, 100),
    onTrack: planned.filter((cert) => cert.status === "Al día").length,
    delayed: planned.filter((cert) => cert.status === "Retrasado").length,
    completed: planned.filter((cert) => cert.status === "Completado").length,
    nextExam: upcoming,
    availableDailyHours: DAILY_STUDY_LIMIT,
    requiredDailyHours: totalRemainingHours / Math.max(1, remainingDays),
    deadline: format(deadline, "yyyy-MM-dd"),
  };
}
