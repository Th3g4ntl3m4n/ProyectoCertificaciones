# CyberCert Command Center

Aplicación web para planificar, registrar y visualizar el avance de certificaciones de ciberseguridad en una ventana máxima de 4 meses con 5 horas diarias disponibles.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Recharts
- Framer Motion
- Lucide React
- LocalStorage

## Ejecutar localmente

```bash
npm install
npm run dev
```

La app queda disponible en:

```text
http://localhost:5173/
```

Para compilar producción:

```bash
npm run build
```

## Ejecutar con Docker

### Docker Compose recomendado

Opcionalmente crea tu configuración local:

```bash
cp .env.example .env
```

Levantar la aplicación:

```bash
docker compose up --build -d
```

La app quedará disponible en:

```text
http://localhost:8080/
```

Consultar estado y salud:

```bash
docker compose ps
docker compose logs -f cybercert
```

Para detenerla:

```bash
docker compose down
```

Puedes cambiar el puerto publicado editando `.env`:

```env
APP_PORT=3000
```

### Docker CLI

Construir la imagen:

```bash
docker build -t cybercert-command-center .
```

Ejecutar el contenedor:

```bash
docker run --rm -p 8080:8080 cybercert-command-center
```

### Scripts disponibles

```bash
npm run docker:build
npm run docker:up
npm run docker:down
```

La imagen usa un build multi-stage: Node compila la aplicación y Nginx sin privilegios sirve los archivos estáticos de producción con fallback SPA, healthcheck, compresión, caché de assets y cabeceras de seguridad.

## Acceso

Token válido:

```text
Certificados2026!!
```

El control de acceso está encapsulado en frontend para esta primera versión y puede migrarse luego a autenticación real.

## Datos iniciales

La matriz base se extrajo de `MatrizdeCertificacionesCiberseguridad.xlsx`:

- Curso
- Proveedor
- Horas
- Fecha Examen
- Link Dashboard

Los datos normalizados viven en:

```text
src/data/certifications.ts
```

Cada certificación incluye dificultad, prioridad, duración de examen cuando está publicada, experiencia recomendada, recomendación de estudio y nota de fuente.

## Lógica de planificación

La planificación está en:

```text
src/lib/planning.ts
```

Reglas principales:

- `fecha_limite = fecha_inicio_plan + 4 meses`
- El usuario puede cambiar la fecha de inicio y el plan completo se recalcula automáticamente
- `horas_disponibles_dia = 5`
- `progreso = horas_estudiadas / horas_estimadas * 100`
- Reparto diario ponderado por dificultad y prioridad
- Pesos:
  - Baja: `1`
  - Media: `1.5`
  - Alta: `2`
  - Avanzada: `2.5`
  - Experta: `3`

La app genera alertas cuando hay atraso frente al plan esperado, cuando el ritmo reciente está bajo o cuando la carga requerida supera 5 horas diarias.

## Estructura

```text
src/
  App.tsx
  main.tsx
  styles.css
  data/
    certifications.ts
  lib/
    planning.ts
    storage.ts
    utils.ts
  types.ts
```

## Fuentes públicas usadas

- [OffSec OSCP Exam Guide](https://help.offsec.com/hc/en-us/articles/360040165632-OSCP-Exam-Guide)
- [PortSwigger BSCP exam process](https://portswigger.net/web-security/certification/how-it-works)
- [The SecOps Group C-APIPen](https://pentestingexams.com/certifications/professional/certified-api-pentester/)
- [CWL K8s-RTA](https://cyberwarfare.live/product/k8s-red-team-analyst-k8s-rta/)
- [CWL CRT-ID](https://cyberwarfare.live/product/red-team-infra-developer/)
- [Spartan CPICS-100](https://academy.spartan-cybersec.com/p/curso-de-pentesting-contra-ics-scada)
- [Spartan CPAD-100](https://books.spartan-cybersec.com/cpad/la-biblia-del-hacking-en-active-directory/conoce-a-tu-academia)
- [CodeRed Atomic Red Team](https://coderedpro.com/products/emulate-adversarial-activity-with-atomic-red-team)
- [Udemy Red Team Mastery](https://www.udemy.com/course/red-team-mastery-advanced-offensive-security/)

## Próximas mejoras

- Importador directo de Excel desde la UI.
- API para usuarios, sesiones y logs.
- Edición de prioridades por certificación.
- Calendario semanal con bloques sugeridos.
- Exportación de reportes a PDF/Excel.
