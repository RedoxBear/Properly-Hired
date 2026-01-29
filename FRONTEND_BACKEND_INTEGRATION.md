# Prague-Day Frontend-Backend Integration Guide

**Last Updated:** January 2025  
**Status:** Phase 8 Complete - Frontend Wired to Backend

---

## Overview

Prague-Day now supports **dual AI modes**:
1. **Base44 LLM** (Default) - Uses Base44's `InvokeLLM` integration
2. **Backend AI** (Kyle & Simon Agents) - Uses Node.js backend with OpenAI/Gemini

This guide explains how the integration works and how to switch between modes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Pages (Dashboard, JobAnalysis, CoverLetter, etc.)    │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │         AI Service Layer (aiService.js)                │ │
│  │  • Detects VITE_USE_BACKEND_AI environment variable   │ │
│  │  • Routes requests to Backend API or Base44 LLM       │ │
│  │  • Provides fallback if backend fails                 │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                       │
│         ┌─────────────┴─────────────┐                        │
│         │                           │                        │
│  ┌──────▼──────┐           ┌───────▼────────┐              │
│  │ Backend API │           │  Base44 LLM    │              │
│  │  (client.js)│           │ (InvokeLLM)    │              │
│  └──────┬──────┘           └────────────────┘              │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────────────────────┐
│              Backend API Server (Node.js)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express.js Routes                                   │  │
│  │  • /api/resume/analyze                               │  │
│  │  • /api/resume/optimize                              │  │
│  │  • /api/job/analyze                                  │  │
│  │  • /api/job/assess-fit                               │  │
│  │  • /api/cover-letter/generate                        │  │
│  │  • /api/interview/prepare                            │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │  AI Module (ai_module.js)                            │  │
│  │  • Kyle Agent (Career Coach + Headhunter)            │  │
│  │  • Simon Agent (Employer-side Recruiter)             │  │
│  │  • LLM Client (OpenAI/Gemini)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Configuration

### Frontend (.env)

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000

# Base44 Configuration
VITE_BASE44_API_KEY=your_base44_api_key
VITE_BASE44_APP_ID=your_base44_app_id

# AI Service Mode
# false = Use Base44 LLM (default)
# true = Use Backend AI (Kyle & Simon agents)
VITE_USE_BACKEND_AI=false
```

### Backend (.env)

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

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

# Base44 Database
BASE44_API_KEY=your_api_key
BASE44_APP_ID=your_app_id
BASE44_API_URL=https://api.base44.com

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## AI Service Layer

The `aiService.js` provides a unified interface that automatically routes requests based on the `VITE_USE_BACKEND_AI` environment variable.

### Usage Example

```javascript
import aiService from '@/services/aiService';

// Analyze resume (automatically uses correct backend)
const analysis = await aiService.analyzeResume(resumeData, jobDescription);

// Generate cover letter
const coverLetter = await aiService.generateCoverLetter(
  resumeData, 
  jobDescription, 
  companyName,
  { whyCompany: 'Passionate about AI' }
);

// Prepare interview
const interviewPrep = await aiService.prepareInterview(
  resumeData,
  jobDescription,
  'behavioral'
);
```

### Automatic Fallback

If the backend API fails, the service automatically falls back to Base44 LLM:

```javascript
async analyzeResume(resumeData, jobDescription) {
    if (USE_BACKEND_AI) {
        try {
            const response = await resumeAPI.analyze(resumeData, jobDescription);
            return response.data;
        } catch (error) {
            console.warn('Backend AI failed, falling back to Base44:', error);
            return await this.analyzeResumeBase44(resumeData, jobDescription);
        }
    }
    return await this.analyzeResumeBase44(resumeData, jobDescription);
}
```

---

## Integration Status by Page

### ✅ Fully Integrated Pages

| Page | Base44 Data | Backend AI | Status |
|------|-------------|------------|--------|
| **Dashboard** | ✅ JobApplication, Resume, AutofillVault | N/A | Complete |
| **MyResumes** | ✅ Resume CRUD | N/A | Complete |
| **JobLibrary** | ✅ JobApplication CRUD | N/A | Complete |
| **AutofillVault** | ✅ AutofillVault CRUD | N/A | Complete |

### 🔄 Ready for Backend AI Integration

These pages can now use backend AI by setting `VITE_USE_BACKEND_AI=true`:

| Page | AI Function | Backend Endpoint | Status |
|------|-------------|------------------|--------|
| **JobAnalysis** | Job analysis | `/api/job/analyze` | Ready |
| **ResumeOptimizer** | Resume optimization | `/api/resume/optimize` | Ready |
| **CoverLetter** | Cover letter generation | `/api/cover-letter/generate` | Ready |
| **QAAssistant** | Interview prep | `/api/interview/prepare` | Ready |
| **ResumeQuality** | Resume analysis | `/api/resume/analyze` | Ready |

### 📝 Implementation Notes

**JobAnalysis Page:**
- Currently uses Base44 `InvokeLLM` for job analysis
- Can switch to backend by setting `VITE_USE_BACKEND_AI=true`
- Backend provides Simon agent analysis (hiring intent, must-haves, fit assessment)

**CoverLetter Page:**
- Currently uses Base44 `InvokeLLM` for cover letter generation
- Can switch to backend by setting `VITE_USE_BACKEND_AI=true`
- Backend provides Kyle agent generation (personalized, de-AI humanization)

**ResumeOptimizer Page:**
- Currently uses Base44 `InvokeLLM` for resume optimization
- Can switch to backend by setting `VITE_USE_BACKEND_AI=true`
- Backend provides Kyle agent optimization (ATS-friendly, quantified achievements)

---

## Testing Both Modes

### Test Base44 Mode (Default)

```bash
# Frontend
cd prague-day
echo "VITE_USE_BACKEND_AI=false" > .env
npm run dev

# No backend needed - uses Base44 directly
```

### Test Backend AI Mode

```bash
# Backend
cd prague-day/backend_api
echo "USE_MOCK_AI=true" > .env
npm start

# Frontend
cd prague-day
echo "VITE_USE_BACKEND_AI=true" > .env
echo "VITE_API_URL=http://localhost:3000" >> .env
npm run dev
```

### Test with Real LLM APIs

```bash
# Backend with OpenAI
cd prague-day/backend_api
cat > .env << EOF
USE_MOCK_AI=false
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4
BASE44_API_KEY=your_base44_key
BASE44_APP_ID=your_base44_app_id
EOF
npm start

# Frontend
cd prague-day
echo "VITE_USE_BACKEND_AI=true" > .env
npm run dev
```

---

## API Client Usage

### Direct API Calls (Without aiService)

If you need to bypass the aiService layer and call the backend directly:

```javascript
import { resumeAPI, jobAPI, coverLetterAPI, interviewAPI } from '@/api/client';

// Resume analysis
const analysis = await resumeAPI.analyze(resumeData, jobDescription);

// Job analysis
const jobAnalysis = await jobAPI.analyze(jobDescription, candidateContext);

// Cover letter generation
const coverLetter = await coverLetterAPI.generate(
  resumeData,
  jobDescription,
  companyName,
  { whyCompany: 'Passionate about AI' }
);

// Interview preparation
const interviewPrep = await interviewAPI.prepare(
  resumeData,
  jobDescription,
  'behavioral'
);
```

### Base44 Data Operations

```javascript
import { jobApplicationAPI, resumeAPI, quotesAPI } from '@/api/client';

// Job applications
const applications = await jobApplicationAPI.getAll();
const pending = await jobApplicationAPI.getPending();
await jobApplicationAPI.create({ job_title: 'Engineer', company_name: 'Tech Corp' });

// Resumes
const resumes = await resumeAPI.getAll();
await resumeAPI.create({ resume_name: 'Master Resume', resume_text: '...' });

// Quotes
const randomQuote = await quotesAPI.getRandom();
```

---

## Custom Hooks

### useBackendAI Hook

For React components that need AI functionality:

```javascript
import useBackendAI from '@/hooks/useBackendAI';

function MyComponent() {
  const { 
    isLoading, 
    error, 
    analyzeResume, 
    optimizeResume,
    generateCoverLetter 
  } = useBackendAI();

  const handleAnalyze = async () => {
    try {
      const result = await analyzeResume(resumeData, jobDescription);
      console.log('Analysis:', result);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleAnalyze}>Analyze</button>
    </div>
  );
}
```

---

## Migration Path

### Phase 1: Current State (Complete)
- ✅ All pages use Base44 entities for data persistence
- ✅ All pages use Base44 InvokeLLM for AI operations
- ✅ Backend API fully operational with Kyle & Simon agents
- ✅ Frontend API client created
- ✅ AI service layer with automatic fallback

### Phase 2: Gradual Migration (Optional)
1. Set `VITE_USE_BACKEND_AI=true` in frontend `.env`
2. Test each page individually
3. Monitor for errors and fallback behavior
4. Compare results between Base44 LLM and Backend AI

### Phase 3: Full Backend AI (Future)
1. Remove Base44 LLM dependency
2. Use only backend AI endpoints
3. Simplify aiService.js to remove fallback logic

---

## Troubleshooting

### Backend AI Not Working

**Check environment variables:**
```bash
# Frontend
cat prague-day/.env | grep VITE_USE_BACKEND_AI
cat prague-day/.env | grep VITE_API_URL

# Backend
cat prague-day/backend_api/.env | grep USE_MOCK_AI
cat prague-day/backend_api/.env | grep LLM_PROVIDER
```

**Check backend is running:**
```bash
curl http://localhost:3000/
```

**Check backend AI endpoints:**
```bash
curl -X POST http://localhost:3000/api/resume/analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeData": {"name": "Test"}, "jobDescription": "Test job"}'
```

### Fallback to Base44 LLM

If you see this warning in the console:
```
Backend AI failed, falling back to Base44: [error]
```

**Possible causes:**
1. Backend server not running
2. Wrong `VITE_API_URL` in frontend `.env`
3. CORS issues (check backend CORS_ORIGIN)
4. Backend API error (check backend logs)

**Solution:**
- The app will continue working with Base44 LLM
- Fix the backend issue and refresh the page
- Or set `VITE_USE_BACKEND_AI=false` to use Base44 only

---

## Performance Considerations

### Base44 LLM Mode
- **Pros:** No backend server needed, simpler deployment
- **Cons:** Limited control over prompts, no Kyle/Simon agents

### Backend AI Mode
- **Pros:** Full control, Kyle & Simon agents, better prompts, caching possible
- **Cons:** Requires backend server, more complex deployment

### Recommendation
- **Development:** Use Backend AI mode for testing Kyle & Simon agents
- **Production:** Choose based on deployment constraints and AI quality needs

---

## Next Steps

1. **Test Backend AI Mode:** Set `VITE_USE_BACKEND_AI=true` and test all pages
2. **Compare Results:** Evaluate Base44 LLM vs Backend AI quality
3. **Add File Upload:** Implement Phase 9 (multer + PDF parsing)
4. **Production Deployment:** Deploy backend API and configure environment variables

---

## Support

For integration issues:
- Check `API_DOCUMENTATION.md` for endpoint details
- Check `INTEGRATION_STATUS.md` for overall progress
- Review backend logs: `prague-day/backend_api/logs/`
- Test endpoints with `curl` examples in API docs
