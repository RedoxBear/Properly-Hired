# Prague-Day API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000` (Development)  
**Last Updated:** January 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [AI Endpoints](#ai-endpoints)
3. [Base44 Data Endpoints](#base44-data-endpoints)
4. [Health & Status](#health--status)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

**Current Status:** Not implemented  
**Planned:** JWT-based authentication

All endpoints are currently open for development. Production deployment will require authentication headers:

```http
Authorization: Bearer <token>
```

---

## AI Endpoints

### 1. Analyze Resume

Analyzes a resume against a job description using Kyle (Career Coach) and Simon (Recruiter) agents.

**Endpoint:** `POST /api/resume/analyze`

**Request Body:**
```json
{
  "resumeData": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "experience": [
      {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "duration": "2020-2023",
        "achievements": [
          "Led team of 5 engineers",
          "Reduced deployment time by 40%"
        ]
      }
    ],
    "skills": ["JavaScript", "React", "Node.js", "AWS"],
    "education": [
      {
        "degree": "BS Computer Science",
        "school": "University of Tech",
        "year": "2019"
      }
    ]
  },
  "jobDescription": "We are seeking a Senior Full Stack Engineer..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kyleAnalysis": {
      "strengths": ["Strong technical leadership", "Proven track record"],
      "improvements": ["Add more quantifiable metrics", "Highlight cloud expertise"],
      "optimizedBullets": [
        "Led cross-functional team of 5 engineers to deliver 12 features, reducing deployment time by 40% through CI/CD automation"
      ],
      "overallScore": 85
    },
    "simonAnalysis": {
      "hiringIntent": "Looking for technical leader with cloud experience",
      "mustHaves": ["5+ years experience", "Team leadership", "AWS"],
      "niceToHaves": ["Kubernetes", "Microservices"],
      "fitScore": 82,
      "verdict": "Strong Match"
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/resume/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "resumeData": {"name": "John Doe", "skills": ["JavaScript", "React"]},
    "jobDescription": "Senior Full Stack Engineer position..."
  }'
```

---

### 2. Optimize Resume

Optimizes a resume for a specific target role using Kyle agent.

**Endpoint:** `POST /api/resume/optimize`

**Request Body:**
```json
{
  "resumeData": {
    "name": "Jane Smith",
    "experience": [...],
    "skills": [...]
  },
  "jobDescription": "Full job posting text...",
  "targetRole": "Senior Product Manager"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "optimizedResume": {
      "summary": "Results-driven Product Manager with 8+ years...",
      "experience": [
        {
          "title": "Senior Product Manager",
          "company": "Tech Startup",
          "bullets": [
            "Launched 3 products generating $2M ARR, achieving 150% of revenue target",
            "Led cross-functional team of 12 (engineering, design, marketing) to deliver features used by 50K+ users"
          ]
        }
      ],
      "skills": ["Product Strategy", "Agile", "Data Analysis", "Stakeholder Management"]
    },
    "changes": [
      "Added quantifiable metrics to all achievements",
      "Reordered skills to match job requirements",
      "Strengthened action verbs in experience bullets"
    ],
    "improvementScore": 92
  }
}
```

---

### 3. Analyze Job Description

Analyzes a job posting to understand hiring intent and requirements using Simon agent.

**Endpoint:** `POST /api/job/analyze`

**Request Body:**
```json
{
  "jobDescription": "Full job posting text...",
  "candidateContext": {
    "currentRole": "Software Engineer",
    "yearsExperience": 5,
    "skills": ["Python", "Django", "PostgreSQL"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hiringIntent": "Company is scaling backend infrastructure and needs senior engineer with database expertise",
    "successProfile": {
      "technicalSkills": ["Python", "Django", "PostgreSQL", "Redis", "AWS"],
      "softSkills": ["Communication", "Mentorship", "Problem-solving"],
      "experience": "5-7 years backend development"
    },
    "mustHaves": [
      "5+ years Python experience",
      "Production database optimization",
      "API design experience"
    ],
    "niceToHaves": [
      "Kubernetes experience",
      "Open source contributions",
      "Startup experience"
    ],
    "redFlags": [
      "Frequent job hopping",
      "Lack of production experience"
    ],
    "kyleBrief": {
      "focusAreas": ["Database optimization projects", "Scalability achievements"],
      "talkingPoints": ["Highlight production database work", "Emphasize mentorship experience"],
      "interviewPrep": ["Be ready to discuss system design", "Prepare database optimization examples"]
    }
  }
}
```

---

### 4. Assess Candidate Fit

Assesses how well a candidate fits a specific job using Simon agent.

**Endpoint:** `POST /api/job/assess-fit`

**Request Body:**
```json
{
  "resumeData": {...},
  "jobDescription": "Full job posting..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallFit": 85,
    "verdict": "Strong Match",
    "strengths": [
      "Technical skills align perfectly with requirements",
      "Relevant industry experience",
      "Track record of similar projects"
    ],
    "gaps": [
      "Limited cloud infrastructure experience",
      "No mention of Kubernetes"
    ],
    "recommendations": [
      "Highlight transferable cloud skills from current role",
      "Take online Kubernetes course and add to resume",
      "Emphasize quick learning ability in cover letter"
    ],
    "interviewLikelihood": "High",
    "competitionLevel": "Medium"
  }
}
```

---

### 5. Generate Cover Letter

Generates a tailored cover letter using Kyle agent.

**Endpoint:** `POST /api/cover-letter/generate`

**Request Body:**
```json
{
  "resumeData": {...},
  "jobDescription": "Full job posting...",
  "companyName": "Tech Innovations Inc.",
  "additionalContext": {
    "whyCompany": "Passionate about AI and machine learning",
    "personalConnection": "Used your product for 2 years"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coverLetter": "Dear Hiring Manager,\n\nI am writing to express my strong interest...",
    "keyPoints": [
      "Highlighted relevant AI/ML projects",
      "Connected personal product usage to company mission",
      "Quantified achievements matching job requirements"
    ],
    "tone": "Professional yet enthusiastic",
    "wordCount": 342
  }
}
```

---

### 6. Prepare Interview Answers

Generates interview preparation materials using Kyle agent.

**Endpoint:** `POST /api/interview/prepare`

**Request Body:**
```json
{
  "resumeData": {...},
  "jobDescription": "Full job posting...",
  "questionType": "behavioral"
}
```

**Question Types:**
- `behavioral` - STAR method behavioral questions
- `technical` - Technical/coding questions
- `situational` - Hypothetical scenario questions
- `all` - Comprehensive preparation

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "question": "Tell me about a time you led a challenging project",
        "suggestedAnswer": "At Tech Corp, I led the migration of our monolithic application to microservices...",
        "starFramework": {
          "situation": "Legacy monolith causing deployment bottlenecks",
          "task": "Lead migration to microservices architecture",
          "action": "Created migration roadmap, led team of 5 engineers, implemented CI/CD",
          "result": "Reduced deployment time by 40%, improved system reliability to 99.9%"
        },
        "tipsForDelivery": [
          "Start with context about company scale",
          "Emphasize leadership and collaboration",
          "End with quantifiable business impact"
        ]
      }
    ],
    "generalTips": [
      "Research company's recent product launches",
      "Prepare questions about team structure",
      "Have examples ready for each STAR category"
    ]
  }
}
```

---

## Base44 Data Endpoints

### Job Applications

#### Get All Job Applications
```http
GET /api/data/job-applications
```

**Response:**
```json
[
  {
    "id": "68c9bd9cbea731824ad26d0a",
    "job_title": "Senior Software Engineer",
    "company_name": "Tech Corp",
    "job_posting_url": "https://...",
    "application_status": "applied",
    "optimization_score": 90,
    "created_date": "2025-01-15T10:30:00Z"
  }
]
```

#### Get Job Application by ID
```http
GET /api/data/job-applications/:id
```

#### Create Job Application
```http
POST /api/data/job-applications
Content-Type: application/json

{
  "job_title": "Product Manager",
  "company_name": "Startup Inc",
  "job_posting_url": "https://...",
  "job_description": "Full text...",
  "application_status": "pending"
}
```

#### Update Job Application
```http
PUT /api/data/job-applications/:id
Content-Type: application/json

{
  "application_status": "interview",
  "interview_status": "scheduled"
}
```

#### Delete Job Application
```http
DELETE /api/data/job-applications/:id
```

#### Filter by Status
```http
GET /api/data/job-applications/status/:status
```

**Status Values:** `pending`, `applied`, `interview`, `offer`, `rejected`, `withdrawn`

#### Quick Filters
```http
GET /api/data/job-applications/pending
GET /api/data/job-applications/applied
GET /api/data/job-applications/rejected
```

---

### Resumes

#### Get All Resumes
```http
GET /api/data/resumes
```

#### Get Resume by ID
```http
GET /api/data/resumes/:id
```

#### Create Resume
```http
POST /api/data/resumes
Content-Type: application/json

{
  "resume_name": "Software Engineer Resume",
  "resume_text": "Full resume text...",
  "is_master": true,
  "target_role": "Senior Software Engineer"
}
```

#### Update Resume
```http
PUT /api/data/resumes/:id
```

#### Delete Resume
```http
DELETE /api/data/resumes/:id
```

---

### Encouragement Quotes

#### Get All Quotes
```http
GET /api/data/quotes
```

#### Get Random Quote
```http
GET /api/data/quotes/random
```

**Response:**
```json
{
  "text": "Believe you can and you're halfway there.",
  "author": "Theodore Roosevelt",
  "source_url": "https://...",
  "tags": ["inspirational"],
  "approved": true
}
```

---

### Autofill Vault

Stores frequently used application form data.

#### Get All Autofill Data
```http
GET /api/data/autofill-vault
```

#### Get by ID
```http
GET /api/data/autofill-vault/:id
```

#### Create Autofill Entry
```http
POST /api/data/autofill-vault
Content-Type: application/json

{
  "company_name": "Tech Corp",
  "job_title": "Software Engineer",
  "field_name": "years_experience",
  "field_value": "5",
  "field_type": "number"
}
```

#### Filter by Company
```http
GET /api/data/autofill-vault/company/:companyName
```

#### Filter by Job Title
```http
GET /api/data/autofill-vault/job/:jobTitle
```

---

### Job Matches

AI-generated job recommendations.

#### Get All Job Matches
```http
GET /api/data/job-matches
```

#### Get by ID
```http
GET /api/data/job-matches/:id
```

#### Create Job Match
```http
POST /api/data/job-matches
Content-Type: application/json

{
  "job_title": "Senior Engineer",
  "company_name": "Tech Startup",
  "match_score": 92,
  "match_reasons": ["Skills align", "Experience matches"],
  "resume_id": "68b7b831dc879f4f04937772"
}
```

#### Filter by Minimum Score
```http
GET /api/data/job-matches/score/:minScore
```

Example: `/api/data/job-matches/score/80` returns matches with score >= 80

---

### User Preferences

#### Get All Preferences
```http
GET /api/data/user-preferences
```

#### Get by ID
```http
GET /api/data/user-preferences/:id
```

#### Create/Update Preferences
```http
POST /api/data/user-preferences
Content-Type: application/json

{
  "preferred_job_titles": ["Software Engineer", "Full Stack Developer"],
  "preferred_locations": ["San Francisco", "Remote"],
  "salary_min": 120000,
  "salary_max": 180000,
  "work_type": "remote",
  "notification_settings": {
    "email": true,
    "push": false
  }
}
```

---

### Referrals

Track referral program participation.

#### Get All Referrals
```http
GET /api/data/referrals
```

#### Get by ID
```http
GET /api/data/referrals/:id
```

#### Create Referral
```http
POST /api/data/referrals
Content-Type: application/json

{
  "referrer_email": "john@example.com",
  "referred_email": "jane@example.com",
  "referral_code": "JOHN2025",
  "status": "pending"
}
```

#### Filter by Status
```http
GET /api/data/referrals/status/:status
```

**Status Values:** `pending`, `completed`, `rewarded`

---

## Health & Status

### Service Status
```http
GET /
```

**Response:**
```json
{
  "service": "Prague-Day Backend API",
  "status": "operational",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:00Z",
  "environment": "development",
  "ai": {
    "status": "mock",
    "provider": "none",
    "capabilities": ["resume_analysis", "job_analysis", "cover_letter", "interview_prep"]
  },
  "database": {
    "status": "connected",
    "provider": "Base44",
    "entities": ["JobApplication", "Resume", "Quote", "AutofillVault", "JobMatch", "UserPreferences", "Referral"]
  },
  "endpoints": {
    "ai": 6,
    "data": 30
  }
}
```

---

## Error Handling

All endpoints return consistent error responses:

### Error Response Format
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Common Error Codes

- `MISSING_REQUIRED_FIELD` - Required field not provided
- `INVALID_FORMAT` - Data format is invalid
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `AI_SERVICE_ERROR` - AI service encountered an error
- `DATABASE_ERROR` - Database operation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Rate Limiting

**Current Status:** Not implemented  
**Planned:** 100 requests per minute per IP

Rate limit headers will be included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

---

## Environment Variables

### Required for AI Features
```bash
# LLM Provider (openai or gemini)
LLM_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# OR Gemini Configuration
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-pro

# Mock Mode (for testing without API keys)
USE_MOCK_AI=true
```

### Required for Base44 Integration
```bash
BASE44_API_KEY=your_api_key
BASE44_APP_ID=your_app_id
BASE44_API_URL=https://api.base44.com
```

---

## Testing Examples

### Test AI Endpoints (Mock Mode)
```bash
# Set mock mode
export USE_MOCK_AI=true

# Test resume analysis
curl -X POST http://localhost:3000/api/resume/analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeData": {"name": "Test"}, "jobDescription": "Test job"}'

# Test cover letter generation
curl -X POST http://localhost:3000/api/cover-letter/generate \
  -H "Content-Type: application/json" \
  -d '{"resumeData": {"name": "Test"}, "jobDescription": "Test", "companyName": "TestCorp"}'
```

### Test Base44 Endpoints
```bash
# Get random quote
curl http://localhost:3000/api/data/quotes/random

# Get all job applications
curl http://localhost:3000/api/data/job-applications

# Get pending applications
curl http://localhost:3000/api/data/job-applications/pending

# Create job application
curl -X POST http://localhost:3000/api/data/job-applications \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Software Engineer",
    "company_name": "Tech Corp",
    "application_status": "pending"
  }'
```

---

## Changelog

### Version 1.0.0 (January 2025)
- Initial API release
- 6 AI endpoints (Kyle & Simon agents)
- 30+ Base44 data endpoints
- Mock mode for testing without API keys
- Comprehensive error handling

---

## Support

For API support or questions:
- Email: contact@pragueday.com
- Documentation: [Link to docs]
- GitHub Issues: [Link to repo]
