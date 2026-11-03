# AI-Assisted Online Resume Builder

A full-stack web application for creating, tailoring, and exporting professional, ATS-friendly resumes with Google Gemini AI assistance and server-side PDF generation. 

---

## Key Features

- **Interactive Resume Editor**: Real-time form synchronization with live preview across Personal Info, Summary, Experience, Education, Skills, Projects, Certifications, Achievements, and Languages.
- **Professional Templates**: Three ATS-optimized layouts (**Classic ATS**, **Modern Tech**, and **Creative Executive**) styled with Tailwind CSS and CSS print pagination rules.
- **AI-Powered Assistance**:
  - Executive summary generation and bullet point enhancement with action verbs.
  - ATS resume analyzer with section scores (0–100) and readability feedback.
  - Job description matcher calculating keyword alignment and missing competencies.
  - Customized cover letter generator with draft editing and persistence.
  - User privacy consent guard requiring confirmation before sending resume content to AI providers.
- **Server-Side PDF Export**: Headless Puppeteer rendering of exact React templates to ISO A4 PDFs using scoped, short-lived export tokens (`purpose: 'pdf-render'`) and SSRF protection.
- **Unsaved Changes Guard**: In-app navigation blocker and browser window protection against accidental data loss.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, React Router 7, Lucide Icons, Axios |
| **Backend** | Node.js 24 LTS, Express 5, TypeScript, Prisma ORM v6, Zod, JWT, bcryptjs, Helmet |
| **Database** | PostgreSQL 16 (Containerized via Docker Compose) |
| **Document Export** | Puppeteer (Headless Chromium) with ISO A4 `@media print` styling |
| **AI Integration** | Google Gemini API (`@google/genai`) with structured JSON schema output |

---

## System Architecture

```mermaid
flowchart TD
    Client["React 19 Frontend<br/>(Port 5173)"]
    API["Express 5 Backend<br/>(Port 5001)"]
    DB[("PostgreSQL 16<br/>(Port 5433)")]
    Gemini["Google Gemini AI<br/>(gemini-3.8-flash)"]
    Puppeteer["Puppeteer Chrome<br/>(Headless PDF Engine)"]

    Client -->|"REST Requests / JWT"| API
    API -->|"Prisma Queries"| DB
    API -->|"Structured Prompts"| Gemini
    API -->|"Trigger Render (Scoped Token)"| Puppeteer
    Puppeteer -->|"Fetch Render Data"| API
    Puppeteer -->|"Stream A4 PDF"| Client
```

---

## Getting Started

### Prerequisites
- **Node.js** 24 LTS
- **Docker Desktop** (for PostgreSQL)
- **Google Gemini API Key**

### 1. Database Setup (Docker)
```bash
docker-compose up -d
```
> PostgreSQL is mapped to port `5433` (`5433:5432`) to avoid conflicts with native PostgreSQL services.

### 2. Backend Setup
```bash
cd server
cp .env.example .env
# Configure GEMINI_API_KEY and JWT_SECRET in server/.env
npm install
npx prisma migrate dev
npm run dev
```
Backend starts on `http://localhost:5001`. Verify status at `http://localhost:5001/api/health`.

### 3. Frontend Setup
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Frontend starts on `http://localhost:5173`.

---

## Environment Variables

### Backend (`server/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend HTTP Port | `5001` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://resume_user:resume_pass_dev@localhost:5433/resume_builder?schema=public` |
| `JWT_SECRET` | Secret key for JWT & export tokens | Min 16-character secure string |
| `JWT_EXPIRES_IN` | Session token validity duration | `7d` |
| `CLIENT_URL` | Allowed frontend origin for CORS & Puppeteer | `http://localhost:5173` |
| `GEMINI_API_KEY` | Google Gemini API key | `your-gemini-api-key-here` |
| `GEMINI_MODEL` | Gemini model name | `gemini-3.8-flash` |

### Frontend (`client/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API URL | `http://localhost:5001/api` |

---

## PDF Generation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant API as Express API
    participant Chrome as Puppeteer (Headless Chrome)
    participant Renderer as React Render View

    User->>API: GET /api/resumes/:id/pdf (Bearer Session Token)
    API->>API: Verify Ownership & Issue Export Token (60s TTL)
    API->>Chrome: Navigate to /render/:id?token=exportToken
    Chrome->>API: GET /api/resumes/:id/render-data?token=exportToken
    API-->>Chrome: Return Resume Data (Token Validated)
    Chrome->>Renderer: Render Template & Wait for Fonts (#resume-ready)
    Chrome->>Chrome: Generate A4 PDF Buffer (@media print)
    Chrome-->>API: Return PDF Binary Buffer
    API-->>User: Stream PDF Attachment (Content-Disposition)
```

---

## API Overview

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new account | Public (Rate-limited) |
| `POST` | `/api/auth/login` | Authenticate & receive JWT | Public (Rate-limited) |
| `GET` | `/api/auth/me` | Get current user profile | Bearer Token |
| `GET` | `/api/resumes` | List user resumes | Bearer Token |
| `POST` | `/api/resumes` | Create resume | Bearer Token |
| `GET` | `/api/resumes/:id` | Get full resume with relations | Bearer Token |
| `PUT` | `/api/resumes/:id` | Update resume & sync child relations | Bearer Token |
| `DELETE`| `/api/resumes/:id` | Delete resume (cascade) | Bearer Token |
| `GET` | `/api/resumes/:id/pdf` | Download ISO A4 PDF | Bearer Token (Rate-limited) |
| `GET` | `/api/resumes/:id/render-data` | Headless render data | Export Token (`?token=`) |
| `POST` | `/api/ai/summary` | Generate executive summary | Bearer Token |
| `POST` | `/api/ai/improve` | Improve bullet points/text | Bearer Token |
| `POST` | `/api/ai/analyze` | ATS analysis & scoring | Bearer Token |
| `GET` | `/api/ai/analyses/:id` | Get ATS analysis record | Bearer Token |
| `POST` | `/api/ai/job-match` | Job match keyword scoring | Bearer Token |
| `GET` | `/api/ai/job-matches/:id` | Get job match record | Bearer Token |
| `POST` | `/api/ai/cover-letters/generate` | Generate cover letter draft | Bearer Token |
| `GET` | `/api/ai/cover-letters` | List saved cover letters | Bearer Token |
| `POST` | `/api/ai/cover-letters` | Save cover letter record | Bearer Token |
| `GET` | `/api/ai/cover-letters/:id` | Get single cover letter | Bearer Token |
| `PUT` | `/api/ai/cover-letters/:id` | Update cover letter | Bearer Token |
| `DELETE`| `/api/ai/cover-letters/:id` | Delete cover letter | Bearer Token |

---

## Build & Verification

```bash
# Build client and server
npm --prefix client run build
npm --prefix server run build

# Run automated tests
npx --prefix server tsx server/src/utils/test-api.ts
npx --prefix server tsx server/src/utils/test-security-hardening.ts
```

---

## License

This project is licensed under the MIT License.
