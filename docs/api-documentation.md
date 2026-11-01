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

