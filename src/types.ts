export type Difficulty = "Baja" | "Media" | "Alta" | "Avanzada" | "Experta";

export type CertificationStatus =
  | "En progreso"
  | "Al día"
  | "Retrasado"
  | "Completado";

export type RiskLevel = "Bajo" | "Medio" | "Alto" | "Crítico";

export type Certification = {
  id: string;
  name: string;
  provider: string;
  difficulty: Difficulty;
  priority: number;
  estimatedHours: number;
  sourceHours: string;
  examDurationHours?: number;
  examDurationLabel: string;
  experienceRequired: string;
  studyRecommendation: string;
  sourceUrl: string;
  sourceNote: string;
};

export type StudyLog = {
  id: string;
  certificationId: string;
  date: string;
  hours: number;
  notes?: string;
};

export type PlannedCertification = Certification & {
  studiedHours: number;
  remainingHours: number;
  progress: number;
  dailyRecommendation: number;
  suggestedExamDate: string;
  status: CertificationStatus;
  expectedHoursToday: number;
  daysToFinishAtPlan: number;
};

export type StudyAlert = {
  id: string;
  certificationId: string;
  certificationName: string;
  reason: string;
  missingHours: number;
  newDailyRecommendation: number;
  action: string;
  risk: RiskLevel;
};

export type DashboardMetrics = {
  totalCertifications: number;
  totalEstimatedHours: number;
  totalStudiedHours: number;
  totalRemainingHours: number;
  globalProgress: number;
  onTrack: number;
  delayed: number;
  completed: number;
  nextExam?: PlannedCertification;
  availableDailyHours: number;
  requiredDailyHours: number;
  deadline: string;
};
