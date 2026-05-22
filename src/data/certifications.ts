import type { Certification } from "../types";

export const ACCESS_TOKEN = "Certificados2026!!";
export const DAILY_STUDY_LIMIT = 5;
export const PLAN_MONTHS = 4;

export const certifications: Certification[] = [
  {
    id: "atomic-red-team",
    name: "Emulate Adversarial Activity with Atomic Red Team",
    provider: "EC-Council - CodeRed",
    difficulty: "Media",
    priority: 4,
    estimatedHours: 5,
    sourceHours: "5hrs",
    examDurationHours: 1,
    examDurationLabel: "Evaluación corta / validación de curso",
    experienceRequired: "Bases de MITRE ATT&CK, PowerShell y operación blue/purple team.",
    studyRecommendation:
      "Completar módulos, ejecutar atomics controlados y documentar detecciones por técnica.",
    sourceUrl:
      "https://coderedpro.com/products/emulate-adversarial-activity-with-atomic-red-team",
    sourceNote:
      "CodeRed describe el curso como adversary emulation con Atomic Red Team; la matriz Excel aporta 5 horas.",
  },
  {
    id: "red-team-mastery",
    name: "Red Team Mastery: Advanced Offensive Security",
    provider: "EC-Council - CodeRed",
    difficulty: "Media",
    priority: 3,
    estimatedHours: 0.9,
    sourceHours: "54 min",
    examDurationHours: 0.5,
    examDurationLabel: "Quiz / validación de finalización",
    experienceRequired: "No requiere experiencia previa formal, pero ayuda conocer redes y Linux.",
    studyRecommendation:
      "Ver el contenido, rehacer comandos clave en laboratorio y cerrar con un mapa del kill chain.",
    sourceUrl:
      "https://coderedpro.com/products/red-team-mastery-advanced-offensive-security",
    sourceNote:
      "La página pública lo presenta como curso práctico de red teaming desde laboratorio hasta ataques reales.",
  },
  {
    id: "pen-200-oscp",
    name: "Penetration Testing with Kali Linux (PEN-200)",
    provider: "OffSec",
    difficulty: "Experta",
    priority: 10,
    estimatedHours: 321,
    sourceHours: "321 Horas",
    examDurationHours: 23.75,
    examDurationLabel: "23 h 45 min + 24 h para reporte",
    experienceRequired:
      "Fundamentos sólidos de TCP/IP, Linux, Windows, scripting y pentesting práctico.",
    studyRecommendation:
      "Seguir un plan de 12 semanas, resolver labs, practicar Active Directory y simular examen completo.",
    sourceUrl: "https://help.offsec.com/hc/en-us/articles/360040165632-OSCP-Exam-Guide",
    sourceNote:
      "OffSec publica guía de examen OSCP+ con 23 h 45 min y planes oficiales PEN-200 de 12/24 semanas.",
  },
  {
    id: "cpics-100",
    name: "CURSO DE PENTESTING CONTRA ICS/SCADA | (CPICS-100)",
    provider: "SPARTAN CYBERSECURITY",
    difficulty: "Avanzada",
    priority: 8,
    estimatedHours: 15,
    sourceHours: "15 HRS",
    examDurationHours: 2,
    examDurationLabel: "Laboratorio / reto práctico estimado",
    experienceRequired: "Pentesting básico, redes industriales, Modbus y fundamentos OT.",
    studyRecommendation:
      "Reservar bloques para laboratorio, captura de tráfico, Modbus y documentación de hallazgos.",
    sourceUrl: "https://academy.spartan-cybersec.com/p/curso-de-pentesting-contra-ics-scada",
    sourceNote:
      "Spartan lista contenidos CPICS-100 de OT, HMI, PLC, RTU, SCADA y prácticas de laboratorio.",
  },
  {
    id: "cpad-100",
    name: "CURSO DE PENTESTING CONTRA DIRECTORIO ACTIVO | (CPAD-100)",
    provider: "SPARTAN CYBERSECURITY",
    difficulty: "Alta",
    priority: 8,
    estimatedHours: 15,
    sourceHours: "15 hrs",
    examDurationHours: 3,
    examDurationLabel: "Examen práctico de laboratorio",
    experienceRequired: "Windows, Active Directory, redes y metodología ofensiva básica.",
    studyRecommendation:
      "Practicar enumeración AD, abuso de permisos, movimiento lateral y reporte técnico.",
    sourceUrl: "https://www.spartan-cybersec.com/pentesting-contra-active-directory/",
    sourceNote:
      "Spartan describe CPAD-100 como curso práctico con laboratorio y examen 100% práctico.",
  },
  {
    id: "c-apipen",
    name: "Certified API Pentester (C-APIPen)",
    provider: "The SecOps Group",
    difficulty: "Alta",
    priority: 7,
    estimatedHours: 4,
    sourceHours: "4HRS",
    examDurationHours: 4,
    examDurationLabel: "4 h",
    experienceRequired: "Recomendados 2 años de pentesting o bug bounty con foco en APIs.",
    studyRecommendation:
      "Repasar REST, GraphQL, auth, BOLA/BFLA, rate limits y explotación en escenarios reales.",
    sourceUrl:
      "https://pentestingexams.com/certifications/professional/certified-api-pentester/",
    sourceNote:
      "PentestingExams lo presenta como examen práctico intermedio de 4 horas y recomienda experiencia profesional.",
  },
  {
    id: "k8s-rta",
    name: "Kubernetes Red Team Analyst",
    provider: "CWL",
    difficulty: "Avanzada",
    priority: 7,
    estimatedHours: 37,
    sourceHours: "37 HRS",
    examDurationLabel: "Reto de 10 flags",
    experienceRequired: "Linux, YAML, contenedores, Kubernetes y ofensiva básica.",
    studyRecommendation:
      "Crear un cluster de práctica, repetir RBAC abuse, tokens, service accounts y pivoteo.",
    sourceUrl: "https://cyberwarfare.live/product/k8s-red-team-analyst-k8s-rta/",
    sourceNote:
      "CWL publica 4+ horas de video, 180+ páginas, 30 días de labs, 10 flags y estima 20-30 horas; la matriz indica 37.",
  },
  {
    id: "crt-id",
    name: "Certified Red Team Infra Dev (CRT-ID)",
    provider: "CWL",
    difficulty: "Avanzada",
    priority: 7,
    estimatedHours: 20,
    sourceHours: "20 HRS",
    examDurationHours: 6,
    examDurationLabel: "6 h CTF",
    experienceRequired: "Red teaming intermedio, cloud básico, C2, redirectores y OPSEC.",
    studyRecommendation:
      "Diseñar infra reproducible, practicar redirectores, dominios, payload hosting y evidencias.",
    sourceUrl: "https://certdb.cyberpath-hq.com/database/cyberwarfare/red-team-infra-dev/",
    sourceNote:
      "CWL publica CRT-ID con 3+ horas de video, PDF, enfoque intermedio-avanzado y examen CTF de 6 horas.",
  },
  {
    id: "bscp",
    name: "Burp Suite Certified Practitioner",
    provider: "PortSwigger - Hack4u",
    difficulty: "Experta",
    priority: 9,
    estimatedHours: 51,
    sourceHours: "51 HRS",
    examDurationHours: 4,
    examDurationLabel: "4 h",
    experienceRequired: "Web security avanzada, Burp Suite Professional y explotación manual.",
    studyRecommendation:
      "Completar labs clave de Web Security Academy, practicar examen demo y cronometrar explotación.",
    sourceUrl: "https://portswigger.net/web-security/certification/how-it-works",
    sourceNote:
      "PortSwigger define BSCP como examen práctico exigente de 4 horas con dos aplicaciones vulnerables.",
  },
];
