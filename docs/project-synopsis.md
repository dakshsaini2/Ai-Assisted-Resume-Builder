# Project Synopsis — AI-Assisted Online Resume Builder

## 1. Project Title
**AI-Assisted Online Resume Builder** (Semester 7 CSE Mini-Project)

## 2. Problem Statement
Job seekers and students often struggle to create well-structured, professional resumes that pass Automated Applicant Tracking Systems (ATS) and clearly articulate their experience. Many either use generic static templates or lack the technical vocabulary to highlight their accomplishments effectively.

## 3. Project Objectives
1. **Interactive Multi-Section Editor**: Allow users to author and manage personal info, summaries, education, experience, technical skills, projects, certifications, achievements, and languages.
2. **Template Diversity**: Provide three distinct designs (Classic ATS, Modern, Creative) rendering live and exporting to pixel-perfect A4 PDFs.
3. **AI Enhancement**: Integrate Google Gemini to rewrite bullet points with action verbs, draft executive summaries, analyze completeness, generate tailored cover letters, and score match against job descriptions.
4. **Security & Persistence**: Secure REST APIs with JWT authentication, bcrypt hashing, Zod validation, user isolation, and PostgreSQL persistence with Prisma ORM.

## 4. System Architecture
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router, Zustand, Lucide React icons.
- **Backend**: Node.js, Express 5, TypeScript, Helmet, CORS, Zod, JWT, bcryptjs.
- **Database**: PostgreSQL 16 (Dockerized), Prisma ORM v6 with relational cascade handling.
- **AI Integration**: Google Gemini API via secure backend orchestration.
- **Document Export**: Headless Chromium (Puppeteer) generating standard A4 PDFs.

