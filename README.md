# AI-Assisted Resume Builder

A full-stack web application that helps students and job seekers create professional resumes with AI-powered content improvement, analysis, and cover letter generation.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **AI:** Google Gemini API
- **PDF Export:** Puppeteer

## Prerequisites

- Node.js 22+ (LTS recommended)
- Docker Desktop
- Git

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-resume-builder
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Set Up Backend

```bash
cd server
cp .env.example .env
# Edit .env with your Gemini API key
npm install
npm run db:migrate
npm run dev
```

### 4. Set Up Frontend

```bash
cd client
npm install
npm run dev
```

### 5. Open the App

Visit [http://localhost:5173](http://localhost:5173)

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── docs/            # Project documentation
└── docker-compose.yml
```

## Features

- User authentication (register, login, JWT)
- Resume CRUD with multi-section editor
- Three professional templates (Classic, Modern, Creative)
- Live resume preview
- PDF export
- AI content improvement (Gemini)
- AI professional summary generation
- AI resume analysis & scoring
- AI cover letter generation
- Job description matching

## Environment Variables

See `server/.env.example` and `client/.env.example` for required variables.

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key to `server/.env` as `GEMINI_API_KEY`

## License

MIT

