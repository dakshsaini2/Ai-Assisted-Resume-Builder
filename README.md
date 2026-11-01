# AI-Assisted Resume Builder

A full-stack web application that helps students and job seekers create professional resumes with AI-powered content improvement, analysis, and cover letter generation.

Developed as a Semester 7 CSE Mini-Project.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand, Lucide React
- **Backend:** Node.js, Express.js, TypeScript, Helmet, Zod, JWT, bcryptjs
- **Database:** PostgreSQL 16 with Prisma ORM
- **AI Engine:** Google Gemini API (Backend Orchestrated)
- **Document Generation:** Puppeteer for PDF export

## Prerequisites

- Node.js 22+ (v25 supported)
- Docker Desktop (for PostgreSQL container)
- Git

## Getting Started

### 1. Start the PostgreSQL Container

```bash
docker-compose up -d
```
*Note: PostgreSQL is mapped to host port `5433` to prevent conflicts with native local PostgreSQL instances.*

### 2. Set Up the Backend Server

```bash
cd server
cp .env.example .env
# Edit .env with your Gemini API key (optional for Phase 1 & 2)
npm install
npx prisma migrate dev
npm run dev
```
Backend runs on `http://localhost:5001`.

### 3. Verify Backend APIs (Automated Test Suite)

With the server running:
```bash
npx tsx src/utils/test-api.ts
```
Runs 23 automated end-to-end tests verifying registration, login, JWT validation, resume CRUD, multi-section sync, and cross-user authorization.

### 4. Set Up the Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` with proxy configured to `http://localhost:5001`.

---

## PDF Generation Architecture (Phase 5)

Server-side PDF generation is powered by headless Chrome managed by **Puppeteer** with pixel-accurate React template rendering.

```
┌──────────────┐       1. GET /api/resumes/:id/pdf (Bearer Auth)        ┌──────────────┐
│ React Client │ ─────────────────────────────────────────────────────> │ Express API  │
│  (Dashboard/ │                                                        │  (Port 5001) │
│   Editor)    │ <───────────────────────────────────────────────────── │              │
└──────────────┘       8. Binary PDF Stream (attachment)                └──────┬───────┘
                                                                               │
       ▲                                                                       │ 2. Issue 60s
       │ 4. Navigate:                                                          │    Export Token
       │    http://localhost:5173/render/:id?token=...                         ▼
┌──────┴───────┐                                                        ┌──────────────┐
│  Headless    │ ◄───────────────────────────────────────────────────── │  Puppeteer   │
│   Chrome     │                  3. Launch / Acquire Page              │  Browser     │
└──────┬───────┘                                                        └──────────────┘
       │
       │ 5. GET /api/resumes/:id/render-data?token=...
       ▼
┌──────────────┐
│ Express API  │ ──> 6. Return Resume Data
└──────────────┘
       │
       │ 7. React renders template -> awaits document.fonts.ready -> sets #resume-ready[data-status="ready"]
       ▼
┌──────────────┐
│ Puppeteer    │ ──> Captures A4 PDF (210mm x 297mm) with @media print CSS
└──────────────┘
```

### Architectural Highlights
- **Single-Source Templates**: The PDF pipeline renders the exact React template components (`ClassicTemplate`, `ModernTemplate`, `CreativeTemplate`) used in the live editor. No duplicate HTML or separate template engines.
- **Short-Lived Export Tokens**: Headless Chrome authenticates against `/api/resumes/:id/render-data` using an HMAC-SHA256 token valid for 60 seconds with strict `purpose: 'pdf-render'`. No user credentials or session cookies are shared.
- **Strict SSRF Defense**: Puppeteer only navigates to trusted internal origins (`http://localhost:5173`, `http://127.0.0.1:5173`, or the configured `CLIENT_URL`).
- **Resource Leak Prevention**: Every browser page is guaranteed to close in a `finally` block even on network timeouts or client render errors.
- **A4 Print CSS Rules**: Uses standard ISO A4 dimensions (210mm x 297mm) with `break-inside: avoid` on entries and `break-after: avoid` on section headings.

---

## Environment Variables

### Backend (`server/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Express server port | `5001` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5433/db` |
| `JWT_SECRET` | Secret key for JWT signing & export tokens | Secure 256-bit secret string |
| `JWT_EXPIRES_IN`| Bearer token validity | `7d` |
| `CLIENT_URL` | Trusted frontend origin for CORS & PDF render | `http://localhost:5173` |
| `GEMINI_API_KEY`| Google Gemini API key (AI features) | `your-gemini-api-key` |

### Frontend (`client/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Backend API base path | `http://localhost:5001/api` |

---

## How to Download a Resume PDF

### From Resume Editor (`/editor/:id`)
1. Click the **"Download PDF"** button in the top action bar.
2. If there are unsaved changes, the editor automatically auto-saves the resume first.
3. The button displays a spinning loader: *"Generating PDF..."* while the request is being processed.
4. Your browser automatically downloads the file as `[Candidate_Name]_Resume.pdf`.

### From Dashboard (`/dashboard`)
1. Locate the resume card and click the **"Download PDF"** icon button.
2. The card enters a loading state with a spinner while other cards remain active and interactive.
3. The PDF document is saved to your downloads folder upon completion.

---

## Puppeteer Browser Setup

Puppeteer downloads a compatible version of Chrome for Testing during `npm install` inside the `server/` folder.

If Chrome needs to be manually installed or verified:
```bash
cd server
npx puppeteer browsers install chrome
```

---

## Testing & Quality Assurance

The codebase includes an extensive suite of automated tests covering backend CRUD, token security, PDF rendering, frontend download simulation, and visual document inspection.

### Running Test Suites

| Suite | Command (from project root) | Description |
|---|---|---|
| **Backend API CRUD** | `cd server && npx tsx src/utils/test-api.ts` | 23 E2E tests for auth, CRUD, ownership & validation |
| **PDF Service Lifecycle** | `cd server && npx tsx src/utils/test-pdf-service.ts` | Browser singleton, launch, page cleanup, SSRF protection |
| **Render-Route Security** | `cd server && npx tsx src/utils/test-render-route.ts` | Export tokens, 401/403 security, DOM readiness |
| **PDF Download Endpoint** | `cd server && npx tsx src/utils/test-pdf-endpoint.ts` | 27 tests: filename sanitization, headers, ownership, binary integrity |
| **Frontend Download Tests**| `npx --prefix server tsx client/src/utils/test-frontend-download.ts` | 23 tests: Content-Disposition parsing, Blob handling, UI states |
| **Template Scenarios** | `npx --prefix server tsx client/src/utils/test-templates.ts` | 29 tests: all 3 templates against 7 content edge cases |
| **PDF Quality Suite** | Windows (PowerShell): `$env:NODE_PATH="client/node_modules"; npx --prefix server tsx server/src/utils/test-pdf-quality.ts`<br>Linux/macOS: `NODE_PATH=client/node_modules npx --prefix server tsx server/src/utils/test-pdf-quality.ts` | 44 tests: A4 dimensions, margins, text extraction, searchability |
| **QA Diagnostics** | Windows (PowerShell): `$env:NODE_PATH="client/node_modules"; npx --prefix server tsx server/src/utils/test-qa-diagnostics.ts`<br>Linux/macOS: `NODE_PATH=client/node_modules npx --prefix server tsx server/src/utils/test-qa-diagnostics.ts` | 24 test matrix scenarios: overflow check, heading orphans |
| **PDF Structural Inspector**| `npx --prefix server tsx server/src/utils/test-pdf-inspector.ts` | Inspects binary `%PDF-1.4`, dimensions, non-blank pages |
| **Client Typecheck** | `cd client && npx tsc -b` | Full React TypeScript verification |
| **Server Typecheck** | `cd server && npx tsc --noEmit` | Full Node.js TypeScript verification |
| **Client Build** | `cd client && npm run build` | Production Vite build and bundle verification |
| **Server Build** | `cd server && npm run build` | Production TypeScript compilation to `server/dist` |

---

## Production Deployment Requirements

### 1. Separate Frontend & Backend Hosting
When frontend and backend are hosted on separate domains (e.g. `https://app.example.com` and `https://api.example.com`):
- Set `CLIENT_URL=https://app.example.com` on the server so CORS allows the client and Puppeteer navigates to the production render route.
- Set `VITE_API_URL=https://api.example.com/api` during frontend build.

### 2. Linux System Dependencies (Deployment Reference Guidance)
When deploying the Node.js backend to Linux environments or custom container hosts (e.g., Debian/Ubuntu), Chromium requires system font packages and shared libraries. The following package list serves as deployment reference guidance (note: the project repository does not include a pre-configured or tested backend production Docker image):
```dockerfile
# Debian / Ubuntu base
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
```

### 3. Memory & Concurrency Considerations
- **Memory Allocation**: Each concurrent Puppeteer page consumes ~80–120 MB RAM. Allocate at least 1 GB RAM for the backend container.
- **Process Reuse**: The singleton `PdfService` maintains a shared browser process across requests, eliminating the ~800ms overhead of launching a new Chrome process for each PDF.
- **Timeout Management**: Puppeteer enforces a 25,000ms navigation deadline (`page.goto`) and a 10,000ms selector deadline for `#resume-ready[data-status="ready"]`. The frontend Axios client uses default browser-managed HTTP timeouts.

---

## Troubleshooting Common PDF Errors

| Symptom / Error | Cause | Resolution |
|---|---|---|
| `502 Bad Gateway`: *Frontend rendering server is unavailable* | Backend attempted to navigate to `CLIENT_URL`, but frontend is not running or port is incorrect. | Ensure the Vite client server is running (`npm run dev`) or `CLIENT_URL` matches the running client. |
| `504 Gateway Timeout`: *Timed out waiting for resume template to complete rendering* | React render route didn't set `#resume-ready[data-status="ready"]` within 10s. | Check client console logs for runtime errors or unhandled exceptions in custom sections. |
| `401 Unauthorized`: *Export token has expired* | The 60-second export token expired before rendering completed. | Retry the download; check server clock synchronization if clocks differ. |
| `403 Forbidden`: *Export token does not match requested resume* | Token forged or requested for a different resume ID. | Re-request via the standard `GET /api/resumes/:id/pdf` endpoint. |
| Blank pages or strange fonts in Docker | Missing TrueType system fonts in minimal Linux containers. | Install `fonts-liberation` or `fonts-noto-color-emoji` in the Dockerfile. |
| Chrome launch fails: *Running as root without --no-sandbox* | Chrome sandboxing restriction in non-root Docker container. | The server already passes `--no-sandbox` and `--disable-setuid-sandbox` in `pdf.service.ts`. |

---

## Documentation

- [Project Synopsis](docs/project-synopsis.md)
- [Database Design & ERD](docs/database-design.md)
- [API Documentation](docs/api-documentation.md)

## License

MIT
