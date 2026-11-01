# API Documentation — AI-Assisted Resume Builder

Base URL: `http://localhost:5001/api`

---

## 1. Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {}
}
```

---

## 2. Authentication Endpoints

### 2.1 Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "createdAt": "2026-11-01T..."
      },
      "token": "jwt.bearer.token"
    }
  }
  ```

### 2.2 Login User
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Logged in successfully.",
    "data": {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "createdAt": "2026-11-01T..."
      },
      "token": "jwt.bearer.token"
    }
  }
  ```

### 2.3 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: `Bearer <token>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "createdAt": "2026-11-01T..."
      }
    }
  }
  ```

---

## 3. Resume Endpoints

All resume endpoints require `Authorization: Bearer <token>`.

### 3.1 List Resumes
- **Method**: `GET`
- **Path**: `/api/resumes`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "resumes": [
        {
          "id": "uuid",
          "title": "Software Engineer Resume",
          "templateId": "classic",
          "fullName": "John Doe",
          "updatedAt": "2026-11-01T...",
          "createdAt": "2026-11-01T...",
          "_count": {
            "education": 1,
            "experiences": 2,
            "projects": 3,
            "skills": 8
          }
        }
      ]
    }
  }
  ```

### 3.2 Create Resume
- **Method**: `POST`
- **Path**: `/api/resumes`
- **Body**:
  ```json
  {
    "title": "Full Stack Engineer Resume",
    "templateId": "modern",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1 555-0199",
    "location": "San Francisco, CA",
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe",
    "website": "https://johndoe.dev",
    "summary": "Full Stack Developer with expertise in React and Node.js."
  }
  ```
- **Response** (`201 Created`): Full resume object with initialized relations.

### 3.3 Get Resume By ID
- **Method**: `GET`
- **Path**: `/api/resumes/:id`
- **Response** (`200 OK`):
  Full resume record including `education`, `experiences`, `projects`, `skills`, `certifications`, `achievements`, and `languages`. Returns `404` if not found or if the resume belongs to a different user.

### 3.4 Update Resume & Relations
- **Method**: `PUT`
- **Path**: `/api/resumes/:id`
- **Body**:
  ```json
  {
    "title": "Updated Title",
    "templateId": "creative",
    "summary": "Updated summary...",
    "education": [
      {
        "institution": "University of Tech",
        "degree": "B.S. in Computer Science",
        "startDate": "2020",
        "endDate": "2024",
        "gpa": "3.9"
      }
    ],
    "experiences": [
      {
        "company": "Tech Corp",
        "position": "Software Engineer",
        "startDate": "2024",
        "current": true,
        "description": "Building scalable web services."
      }
    ],
    "skills": [
      { "name": "TypeScript", "category": "Languages", "level": "Advanced" },
      { "name": "React", "category": "Frontend", "level": "Advanced" }
    ],
    "projects": [
      {
        "name": "AI Resume Builder",
        "description": "Full-stack resume builder with AI assistance.",
        "technologies": "React, Express, PostgreSQL"
      }
    ]
  }
  ```
- **Response** (`200 OK`): Full updated resume with synced relational child entities.

### 3.5 Delete Resume
- **Method**: `DELETE`
- **Path**: `/api/resumes/:id`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Resume deleted successfully.",
    "data": null
  }
  ```

---

## 4. PDF Generation & Export Endpoints

### 4.1 Download Resume PDF
Generates and streams a print-ready A4 PDF document using Puppeteer headless rendering.

- **Method**: `GET`
- **Path**: `/api/resumes/:id/pdf`
- **Auth**: `Bearer <token>` (User must own the resume)
- **Response Headers**:
  - `Content-Type`: `application/pdf`
  - `Content-Disposition`: `attachment; filename="<Candidate_Name>_Resume.pdf"`
  - `Access-Control-Expose-Headers`: `Content-Disposition`
  - `Content-Length`: `<size_in_bytes>`
  - `Cache-Control`: `no-store, no-cache, must-revalidate, proxy-revalidate`
  - `Pragma`: `no-cache`
  - `Expires`: `0`
- **Response** (`200 OK`): Binary PDF stream (`%PDF-1.4`)
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid Bearer token
  - `404 Not Found`: Resume does not exist or belongs to another user
  - `502 Bad Gateway`: Headless browser rendering or client server failure
  - `504 Gateway Timeout`: Rendering exceeded 25-second deadline

### 4.2 Get Resume Render Data
Internal endpoint used exclusively by the headless browser during PDF rendering. Authenticated via single-purpose, short-lived HMAC export tokens.

- **Method**: `GET`
- **Path**: `/api/resumes/:id/render-data?token=<exportToken>`
- **Auth**: Query parameter `token` containing 60-second HMAC token (`purpose: 'pdf-render'`)
- **Response Headers**:
  - `Content-Type`: `application/json`
  - `Cache-Control`: `no-store, no-cache, must-revalidate, proxy-revalidate`
  - `Pragma`: `no-cache`
  - `Expires`: `0`
- **Response** (`200 OK`): Full resume data object (including relations)
- **Error Responses**:
  - `401 Unauthorized`: Missing, expired, or invalid export token
  - `403 Forbidden`: Token resumeId does not match the URL parameter
  - `404 Not Found`: Resume not found


---

## 5. AI Assistance Endpoints

All AI endpoints require `Authorization: Bearer <token>` and operate under user privacy consent.

### 5.1 Generate Professional Summary
- **Method**: `POST`
- **Path**: `/api/ai/summary`
- **Auth**: `Bearer <token>`
- **Body**:
  ```json
  {
    "resumeId": "uuid",
    "preferences": {
      "experienceLevel": "mid",
      "tone": "confident",
      "targetRole": "Senior Full Stack Engineer"
    }
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "summary": "Full Stack Engineer with 4+ years of experience designing scalable microservices..."
    }
  }
  ```

### 5.2 Improve Bullet Point / Description
- **Method**: `POST`
- **Path**: `/api/ai/improve`
- **Auth**: `Bearer <token>`
- **Body**:
  ```json
  {
    "text": "Worked on backend APIs and made things faster.",
    "section": "experience",
    "options": {
      "tone": "impactful",
      "focus": "metrics"
    }
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "improved": "Architected and optimized RESTful microservices, reducing p99 API latency by 35%."
    }
  }
  ```

### 5.3 Analyze Resume Completeness & ATS Readability
- **Method**: `POST`
- **Path**: `/api/ai/analyze`
- **Auth**: `Bearer <token>`
- **Body**:
  ```json
  {
    "resumeId": "uuid"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "resumeId": "uuid",
      "overallScore": 88,
      "sectionScores": {
        "contact": 95,
        "summary": 85,
        "experience": 88,
        "education": 90,
        "skills": 82
      },
      "improvements": [
        "Include quantifiable metrics in work experience entries."
      ],
      "atsFeedback": {
        "readabilityScore": 92,
        "parseableStatus": "Optimal"
      },
      "disclaimer": "This analysis provides advisory feedback and does not guarantee specific hiring or ATS outcomes.",
      "createdAt": "2026-11-01T..."
    }
  }
  ```

### 5.4 Job Description Matcher
- **Method**: `POST`
- **Path**: `/api/ai/job-match`
- **Auth**: `Bearer <token>`
- **Body**:
  ```json
  {
    "resumeId": "uuid",
    "jobTitle": "Lead Backend Engineer",
    "jobDescription": "We are seeking a Lead Backend Engineer with deep expertise in Node.js, PostgreSQL, and distributed systems..."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "resumeId": "uuid",
      "jobTitle": "Lead Backend Engineer",
      "matchScore": 82,
      "matchedKeywords": ["Node.js", "PostgreSQL", "REST", "TypeScript"],
      "missingKeywords": ["Docker", "Kubernetes", "Redis"],
      "recommendations": [
        "Add experience with containerization tools in your project descriptions."
      ],
      "createdAt": "2026-11-01T..."
    }
  }
  ```

### 5.5 Generate Cover Letter Draft
- **Method**: `POST`
- **Path**: `/api/ai/cover-letter`
- **Auth**: `Bearer <token>`
- **Body**:
  ```json
  {
    "resumeId": "uuid",
    "companyName": "Acme Innovations",
    "jobRole": "Senior Software Engineer",
    "jobDescription": "Full stack engineer responsible for high-scale React and Node.js applications.",
    "tone": "enthusiastic"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "coverLetter": "Dear Hiring Team at Acme Innovations,\n\nI am writing to express my strong enthusiasm..."
    }
  }
  ```

### 5.6 Save and Manage Cover Letters
- **List Cover Letters**: `GET /api/ai/cover-letters`
- **Save Cover Letter**: `POST /api/ai/cover-letters`
- **Get Cover Letter**: `GET /api/ai/cover-letters/:id`
- **Update Cover Letter**: `PUT /api/ai/cover-letters/:id`
- **Delete Cover Letter**: `DELETE /api/ai/cover-letters/:id`
