import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Database,
  Gauge,
  KeyRound,
  ListChecks,
  LockKeyhole,
  LogOut,
  NotebookPen,
  Radar,
  Save,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ACCESS_TOKEN, certifications, DAILY_STUDY_LIMIT } from "./data/certifications";
import {
  buildAlerts,
  buildDashboardMetrics,
  buildStudyPlan,
  getDailyLoggedHours,
} from "./lib/planning";
import { useLocalStorage } from "./lib/storage";
import { cn, createId, formatHours, formatPercent, toDateInputValue } from "./lib/utils";
import type {
  CertificationStatus,
  PlannedCertification,
  RiskLevel,
  StudyAlert,
  StudyLog,
} from "./types";

const ACCESS_STORAGE_KEY = "cybercert-v1-access";
const LOGS_STORAGE_KEY = "cybercert-v1-study-logs";
const PLAN_START_STORAGE_KEY = "cybercert-v1-plan-start";

const statusStyles: Record<CertificationStatus, string> = {
  "Al día": "border-acid/30 bg-acid/12 text-acid",
  "En progreso": "border-cyan/30 bg-cyan/12 text-cyan",
  Retrasado: "border-ember/35 bg-ember/12 text-ember",
  Completado: "border-emerald-300/30 bg-emerald-300/12 text-emerald-200",
};

const riskStyles: Record<RiskLevel, string> = {
  Bajo: "border-cyan/25 bg-cyan/10 text-cyan",
  Medio: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  Alto: "border-ember/30 bg-ember/10 text-ember",
  Crítico: "border-red-400/35 bg-red-500/10 text-red-200",
};

function getCountdownParts(deadline: string) {
  const target = new Date(`${deadline}T23:59:59`).getTime();
  const remaining = Math.max(0, target - Date.now());
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return { days, hours, minutes, seconds };
}

function useCountdown(deadline: string) {
  const [parts, setParts] = useState(() => getCountdownParts(deadline));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setParts(getCountdownParts(deadline));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [deadline]);

  return parts;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function AccessGate({ onUnlock }: { onUnlock: () => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();

    if (token === ACCESS_TOKEN) {
      localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(true));
      onUnlock();
      return;
    }

    setError("Token incorrecto. Acceso denegado.");
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
            <ShieldCheck className="size-4 text-acid" />
            CyberCert Command Center
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-white md:text-6xl">
              Control táctico para certificaciones ofensivas.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Planeación de 4 meses, presupuesto diario de 5 horas, alertas de atraso y avance real por curso.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["9", "rutas"],
              ["468.9 h", "estimadas"],
              ["5 h", "diarias"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-line bg-white/[0.035] p-4">
                <div className="text-2xl font-semibold text-white">{value}</div>
                <div className="mt-1 text-sm text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="rounded-lg border border-line bg-panel/88 p-6 shadow-glow backdrop-blur"
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Acceso</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Token requerido</h2>
            </div>
            <div className="grid size-12 place-items-center rounded-lg border border-acid/20 bg-acid/10">
              <LockKeyhole className="size-6 text-acid" />
            </div>
          </div>
          <label className="text-sm font-medium text-slate-300" htmlFor="token">
            Token de acceso
          </label>
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-black/30 px-4 py-3 focus-within:border-acid/60">
            <KeyRound className="size-5 text-slate-500" />
            <input
              id="token"
              type="password"
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setError("");
              }}
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-600"
              placeholder="••••••••••••••"
              autoFocus
            />
          </div>
          {error ? (
            <p className="mt-3 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
          <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-acid px-4 py-3 font-semibold text-ink transition hover:bg-white">
            Ingresar
            <ShieldCheck className="size-4" />
          </button>
        </motion.form>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "text-acid",
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon className={cn("size-5", accent)} />
      </div>
      <div className="mt-4 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function DashboardHeader({
  metrics,
  onLogout,
}: {
  metrics: ReturnType<typeof buildDashboardMetrics>;
  onLogout: () => void;
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-slate-500">
            <Radar className="size-4 text-cyan" />
            CyberCert Command Center
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">
            Plan de certificaciones
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-line bg-white/[0.035] px-4 py-3 text-sm text-slate-300">
            Límite: <span className="font-semibold text-white">{metrics.deadline}</span>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/[0.035] px-4 py-3 text-sm text-slate-300 transition hover:border-white/25 hover:text-white"
          >
            <LogOut className="size-4" />
            Salir
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Certificaciones" value={`${metrics.totalCertifications}`} icon={Database} />
        <MetricCard
          label="Horas estimadas"
          value={formatHours(metrics.totalEstimatedHours)}
          icon={Clock3}
          accent="text-cyan"
        />
        <MetricCard
          label="Horas estudiadas"
          value={formatHours(metrics.totalStudiedHours)}
          icon={TrendingUp}
          accent="text-emerald-300"
        />
        <MetricCard
          label="Avance global"
          value={formatPercent(metrics.globalProgress)}
          icon={CircleGauge}
          accent="text-violet"
        />
      </div>
    </section>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full bg-[linear-gradient(90deg,#35D7FF,#B7F34C)]"
      />
    </div>
  );
}

function StrategicTimeline({
  planned,
  metrics,
  planStart,
  onPlanStartChange,
}: {
  planned: PlannedCertification[];
  metrics: ReturnType<typeof buildDashboardMetrics>;
  planStart: string;
  onPlanStartChange: (date: string) => void;
}) {
  const countdown = useCountdown(metrics.deadline);
  const recommended = metrics.nextExam ?? planned.find((cert) => cert.status !== "Completado");
  const sequence = [...planned]
    .filter((certification) => certification.status !== "Completado")
    .sort((a, b) => a.suggestedExamDate.localeCompare(b.suggestedExamDate));

  return (
    <section className="rounded-lg border border-line bg-panel/88 p-4 shadow-glow md:p-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Secuencia estratégica
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Ruta sugerida de cursos</h2>
            </div>
            {recommended ? (
              <div className="rounded-lg border border-acid/40 bg-acid px-4 py-3 text-sm font-semibold text-ink shadow-[0_0_34px_rgba(183,243,76,0.28)]">
                Recomendado ahora: {recommended.name}
              </div>
            ) : null}
          </div>

          <div className="mt-5 overflow-x-auto pb-2">
            <div className="flex min-w-max items-stretch gap-3">
              {sequence.map((certification, index) => {
                const isRecommended = certification.id === recommended?.id;

                return (
                  <div key={certification.id} className="flex items-center gap-3">
                    <article
                      className={cn(
                        "w-64 rounded-lg border p-4 transition",
                        isRecommended
                          ? "border-acid bg-acid text-ink shadow-[0_0_42px_rgba(183,243,76,0.32)]"
                          : "border-line bg-black/22 text-white",
                      )}
                    >
                      <div
                        className={cn(
                          "mb-3 inline-flex size-8 items-center justify-center rounded-full text-sm font-bold",
                          isRecommended ? "bg-ink text-acid" : "bg-white/10 text-slate-300",
                        )}
                      >
                        {index + 1}
                      </div>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                        {certification.name}
                      </h3>
                      <div
                        className={cn(
                          "mt-3 grid gap-1 text-xs",
                          isRecommended ? "text-ink/75" : "text-slate-400",
                        )}
                      >
                        <span>{certification.provider}</span>
                        <span>Examen: {certification.suggestedExamDate}</span>
                        <span>Carga: {formatHours(certification.dailyRecommendation)}/día</span>
                      </div>
                    </article>
                    {index < sequence.length - 1 ? (
                      <div className="h-px w-10 bg-gradient-to-r from-acid/70 to-cyan/60" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-black/24 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Cuenta regresiva</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Hasta el límite</h3>
            </div>
            <TimerReset className="size-6 text-acid" />
          </div>
          <label className="mt-5 grid gap-2 text-sm text-slate-300">
            Fecha de inicio del plan
            <input
              type="date"
              value={planStart}
              onChange={(event) => {
                if (event.target.value) {
                  onPlanStartChange(event.target.value);
                }
              }}
              className="rounded-lg border border-acid/35 bg-acid/10 px-3 py-3 font-semibold text-white outline-none transition focus:border-acid"
            />
            <span className="text-xs leading-5 text-slate-500">
              Al cambiarla se recalculan el límite, la carga diaria, las alertas y los exámenes.
            </span>
          </label>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ["Días", countdown.days],
              ["Horas", countdown.hours],
              ["Minutos", countdown.minutes],
              ["Segundos", countdown.seconds],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-white/[0.035] p-3">
                <div className="text-3xl font-semibold text-white">
                  {String(value).padStart(2, "0")}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {label}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-line bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
            Fecha límite: <span className="font-semibold text-white">{metrics.deadline}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CertificationCard({
  certification,
  recommended,
}: {
  certification: PlannedCertification;
  recommended?: boolean;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border bg-panel/82 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] md:p-5",
        recommended
          ? "border-acid/80 ring-2 ring-acid/40 shadow-[0_0_40px_rgba(183,243,76,0.18)]"
          : "border-line",
      )}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {recommended ? (
              <span className="rounded-full border border-acid bg-acid px-2.5 py-1 text-xs font-bold text-ink">
                Curso recomendado
              </span>
            ) : null}
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                statusStyles[certification.status],
              )}
            >
              {certification.status}
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 text-xs text-slate-400">
              {certification.difficulty}
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 text-xs text-slate-400">
              {certification.provider}
            </span>
          </div>

          <h3 className="mt-3 break-words text-lg font-semibold leading-snug text-white md:text-xl">
            {certification.name}
          </h3>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-slate-500">Estudiadas</div>
              <div className="font-semibold text-white">{formatHours(certification.studiedHours)}</div>
            </div>
            <div>
              <div className="text-slate-500">Restantes</div>
              <div className="font-semibold text-white">{formatHours(certification.remainingHours)}</div>
            </div>
            <div>
              <div className="text-slate-500">Recomendado</div>
              <div className="font-semibold text-white">
                {formatHours(certification.dailyRecommendation)}/día
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-black/18 p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-400">Progreso</span>
            <span className="font-semibold text-white">{formatPercent(certification.progress)}</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={certification.progress} />
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <div className="text-slate-500">Fecha sugerida</div>
              <div className="mt-1 inline-flex items-center gap-1.5 font-semibold text-white">
                <CalendarClock className="size-4 text-cyan" />
                {certification.suggestedExamDate}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Duración examen</div>
              <div className="mt-1 inline-flex items-center gap-1.5 font-semibold text-white">
                <TimerReset className="size-4 text-acid" />
                {certification.examDurationLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function CertificationsPanel({
  planned,
  recommendedId,
}: {
  planned: PlannedCertification[];
  recommendedId?: string;
}) {
  return (
    <section className="rounded-lg border border-line bg-white/[0.025] p-3 md:p-4">
      <div className="mb-4 flex flex-col justify-between gap-3 px-1 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Ruta principal</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Certificaciones</h2>
        </div>
        <div className="text-sm text-slate-400">{planned.length} elementos priorizados</div>
      </div>
      <div className="grid gap-3">
        {planned.map((certification) => (
          <CertificationCard
            key={certification.id}
            certification={certification}
            recommended={certification.id === recommendedId}
          />
        ))}
      </div>
    </section>
  );
}

function StudyLogForm({
  planned,
  logs,
  onAddLog,
}: {
  planned: PlannedCertification[];
  logs: StudyLog[];
  onAddLog: (log: StudyLog) => void;
}) {
  const [certificationId, setCertificationId] = useState(planned[0]?.id ?? "");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [hours, setHours] = useState("1");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const loggedToday = getDailyLoggedHours(date, logs);
  const remainingForDay = Math.max(0, DAILY_STUDY_LIMIT - loggedToday);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const numericHours = Number(hours);

    if (!certificationId) {
      setError("Selecciona una certificación.");
      return;
    }

    if (!Number.isFinite(numericHours) || numericHours <= 0) {
      setError("Registra un número de horas válido.");
      return;
    }

    if (loggedToday + numericHours > DAILY_STUDY_LIMIT) {
      setError(
        `El registro supera el límite de ${formatHours(DAILY_STUDY_LIMIT)} para ${date}. Disponible: ${formatHours(remainingForDay)}.`,
      );
      return;
    }

    onAddLog({
      id: createId("log"),
      certificationId,
      date,
      hours: numericHours,
      notes: notes.trim() || undefined,
    });
    setHours("1");
    setNotes("");
    setError("");
  }

  return (
    <section className="rounded-lg border border-line bg-panel/82 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Registro diario</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Horas de estudio</h2>
        </div>
        <NotebookPen className="size-6 text-acid" />
      </div>

      <form onSubmit={submit} className="grid gap-3" noValidate>
        <label className="grid gap-2 text-sm text-slate-300">
          Certificación
          <select
            value={certificationId}
            onChange={(event) => setCertificationId(event.target.value)}
            className="rounded-lg border border-line bg-black/30 px-3 py-3 text-white outline-none focus:border-acid/60"
          >
            {planned.map((certification) => (
              <option key={certification.id} value={certification.id} className="bg-panel">
                {certification.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-300">
            Fecha
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-lg border border-line bg-black/30 px-3 py-3 text-white outline-none focus:border-acid/60"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Horas
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              className="rounded-lg border border-line bg-black/30 px-3 py-3 text-white outline-none focus:border-acid/60"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm text-slate-300">
          Observación
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="resize-none rounded-lg border border-line bg-black/30 px-3 py-3 text-white outline-none focus:border-acid/60"
            placeholder="Lab, módulo o hallazgo trabajado"
          />
        </label>

        <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-[auto_1fr] sm:items-center">
          <span>Disponible el día: {formatHours(remainingForDay)}</span>
          {error ? (
            <span className="rounded-md border border-ember/25 bg-ember/10 px-3 py-2 text-ember">
              {error}
            </span>
          ) : null}
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-acid px-4 py-3 font-semibold text-ink transition hover:bg-white">
          <Save className="size-4" />
          Guardar registro
        </button>
      </form>
    </section>
  );
}

function AlertsPanel({ alerts }: { alerts: StudyAlert[] }) {
  return (
    <section className="rounded-lg border border-line bg-panel/82 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Alertas</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Riesgo del plan</h2>
        </div>
        <AlertTriangle className="size-6 text-ember" />
      </div>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-acid/20 bg-acid/10 p-4 text-sm text-acid">
            Plan al día con el ritmo actual.
          </div>
        ) : (
          alerts.slice(0, 6).map((alert) => (
            <article key={alert.id} className="rounded-lg border border-line bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-white">{alert.certificationName}</h3>
                <span className={cn("rounded-full border px-2.5 py-1 text-xs", riskStyles[alert.risk])}>
                  {alert.risk}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{alert.reason}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                <span>Faltan: {formatHours(alert.missingHours)}</span>
                <span>Nueva carga: {formatHours(alert.newDailyRecommendation)}/día</span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{alert.action}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function AnalyticsCharts({
  planned,
  logs,
  metrics,
}: {
  planned: PlannedCertification[];
  logs: StudyLog[];
  metrics: ReturnType<typeof buildDashboardMetrics>;
}) {
  const lastTwoWeeks = Array.from({ length: 14 }, (_, index) =>
    format(addDays(new Date(), index - 13), "yyyy-MM-dd"),
  );
  const dailyData = lastTwoWeeks.map((date) => {
    const dayLogs = logs.filter((log) => log.date === date);
    const hours = dayLogs.reduce((sum, log) => sum + log.hours, 0);

    return {
      date: date.slice(5),
      sesiones: dayLogs.length,
      horas: Number(hours.toFixed(1)),
    };
  });
  const activeDays = new Set(logs.filter((log) => log.hours > 0).map((log) => log.date)).size;
  const averageStudyHours = activeDays > 0 ? metrics.totalStudiedHours / activeDays : 0;
  const complianceData = planned.map((cert) => {
    const compliance =
      cert.expectedHoursToday > 0
        ? Math.min(120, (cert.studiedHours / cert.expectedHoursToday) * 100)
        : cert.progress;

    return {
      name: cert.name.replace("CURSO DE ", "").slice(0, 20),
      cumplimiento: Math.round(compliance || 0),
    };
  });
  const averageCompliance = average(complianceData.map((item) => item.cumplimiento));

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-white/[0.035] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Frecuencia de estudio</span>
            <Activity className="size-5 text-cyan" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">{activeDays} días</div>
          <div className="mt-1 text-sm text-slate-500">{logs.length} sesiones registradas</div>
        </div>
        <div className="rounded-lg border border-line bg-white/[0.035] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Promedio de cumplimiento</span>
            <CheckCircle2 className="size-5 text-acid" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">
            {formatPercent(averageCompliance)}
          </div>
          <div className="mt-1 text-sm text-slate-500">Contra avance esperado</div>
        </div>
        <div className="rounded-lg border border-line bg-white/[0.035] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Promedio de horas</span>
            <Gauge className="size-5 text-violet" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">
            {formatHours(averageStudyHours)}
          </div>
          <div className="mt-1 text-sm text-slate-500">Por día con actividad</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-line bg-panel/82 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Frecuencia</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Sesiones por día</h2>
            </div>
            <BarChart3 className="size-6 text-cyan" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    background: "#10151F",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <Bar dataKey="sesiones" fill="#35D7FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel/82 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Cumplimiento</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Avance contra plan</h2>
            </div>
            <CheckCircle2 className="size-6 text-acid" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} domain={[0, 120]} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    background: "#10151F",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <Bar dataKey="cumplimiento" fill="#B7F34C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-panel/82 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Promedio</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Horas de estudio por día</h2>
          </div>
          <Gauge className="size-6 text-violet" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#10151F",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  borderRadius: 8,
                  color: "#fff",
                }}
              />
              <Area type="monotone" dataKey="horas" stroke="#9A7CFF" fill="#9A7CFF33" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function StudyTimeline({
  logs,
  planned,
}: {
  logs: StudyLog[];
  planned: PlannedCertification[];
}) {
  const byId = new Map(planned.map((cert) => [cert.id, cert]));
  const rows = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

  return (
    <section className="rounded-lg border border-line bg-panel/82 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Timeline</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Registros recientes</h2>
        </div>
        <ListChecks className="size-6 text-violet" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-slate-500">
            <tr className="border-b border-line">
              <th className="py-3 font-medium">Fecha</th>
              <th className="py-3 font-medium">Certificación</th>
              <th className="py-3 font-medium">Horas</th>
              <th className="py-3 font-medium">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td className="py-5 text-slate-400" colSpan={4}>
                  Sin registros todavía.
                </td>
              </tr>
            ) : (
              rows.map((log) => (
                <tr key={log.id} className="text-slate-300">
                  <td className="py-3">{log.date}</td>
                  <td className="py-3 text-white">{byId.get(log.certificationId)?.name}</td>
                  <td className="py-3">{formatHours(log.hours)}</td>
                  <td className="py-3">{log.notes ?? "Sin nota"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AnalyticsTabs({
  planned,
  logs,
  metrics,
}: {
  planned: PlannedCertification[];
  logs: StudyLog[];
  metrics: ReturnType<typeof buildDashboardMetrics>;
}) {
  const [activeTab, setActiveTab] = useState<"charts" | "logs">("charts");

  return (
    <section className="rounded-lg border border-line bg-white/[0.025] p-3 md:p-4">
      <div className="mb-4 flex flex-col justify-between gap-3 px-1 md:flex-row md:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Analítica</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Seguimiento del estudio</h2>
        </div>
        <div className="inline-grid grid-cols-2 rounded-lg border border-line bg-black/24 p-1">
          <button
            onClick={() => setActiveTab("charts")}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
              activeTab === "charts"
                ? "bg-acid text-ink"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <BarChart3 className="size-4" />
            Gráficas
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
              activeTab === "logs"
                ? "bg-acid text-ink"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <ListChecks className="size-4" />
            Registros
          </button>
        </div>
      </div>

      {activeTab === "charts" ? (
        <AnalyticsCharts planned={planned} logs={logs} metrics={metrics} />
      ) : (
        <StudyTimeline logs={logs} planned={planned} />
      )}
    </section>
  );
}

function InsightStrip({
  metrics,
}: {
  metrics: ReturnType<typeof buildDashboardMetrics>;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-4">
      <div className="rounded-lg border border-line bg-white/[0.035] p-4">
        <div className="text-sm text-slate-500">Restantes</div>
        <div className="mt-2 text-xl font-semibold text-white">
          {formatHours(metrics.totalRemainingHours)}
        </div>
      </div>
      <div className="rounded-lg border border-line bg-white/[0.035] p-4">
        <div className="text-sm text-slate-500">Al día</div>
        <div className="mt-2 text-xl font-semibold text-acid">{metrics.onTrack}</div>
      </div>
      <div className="rounded-lg border border-line bg-white/[0.035] p-4">
        <div className="text-sm text-slate-500">Retrasadas</div>
        <div className="mt-2 text-xl font-semibold text-ember">{metrics.delayed}</div>
      </div>
      <div className="rounded-lg border border-line bg-white/[0.035] p-4">
        <div className="text-sm text-slate-500">Próximo examen</div>
        <div className="mt-2 truncate text-xl font-semibold text-white">
          {metrics.nextExam
            ? `${metrics.nextExam.suggestedExamDate} · ${metrics.nextExam.name}`
            : "Completado"}
        </div>
      </div>
    </section>
  );
}

function AppShell() {
  const [planStart, setPlanStart] = useLocalStorage<string>(
    PLAN_START_STORAGE_KEY,
    toDateInputValue(new Date()),
  );
  const [logs, setLogs] = useLocalStorage<StudyLog[]>(LOGS_STORAGE_KEY, []);
  const [, setUnlocked] = useLocalStorage(ACCESS_STORAGE_KEY, true);
  const today = useMemo(() => new Date(), []);
  const planned = useMemo(
    () => buildStudyPlan(certifications, logs, planStart, today),
    [logs, planStart, today],
  );
  const metrics = useMemo(
    () => buildDashboardMetrics(planned, planStart, today),
    [planned, planStart, today],
  );
  const alerts = useMemo(
    () => buildAlerts(planned, logs, planStart, today),
    [planned, logs, planStart, today],
  );
  const recommendedId = metrics.nextExam?.id;

  function logout() {
    localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(false));
    setUnlocked(false);
    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-6 lg:px-8">
        <DashboardHeader metrics={metrics} onLogout={logout} />
        <StrategicTimeline
          planned={planned}
          metrics={metrics}
          planStart={planStart}
          onPlanStartChange={setPlanStart}
        />
        <InsightStrip metrics={metrics} />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <StudyLogForm planned={planned} logs={logs} onAddLog={(log) => setLogs([...logs, log])} />
          <AlertsPanel alerts={alerts} />
        </section>

        <CertificationsPanel planned={planned} recommendedId={recommendedId} />
        <AnalyticsTabs planned={planned} logs={logs} metrics={metrics} />

        <footer className="flex flex-col gap-2 pb-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>Inicio del plan: {format(new Date(`${planStart}T00:00:00`), "yyyy-MM-dd")}</span>
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-4 text-acid" />
            Persistencia local lista para migrar a API.
          </span>
        </footer>
      </div>
    </main>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ACCESS_STORAGE_KEY) ?? "false") as boolean;
    } catch {
      return false;
    }
  });

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  return <AppShell />;
}
