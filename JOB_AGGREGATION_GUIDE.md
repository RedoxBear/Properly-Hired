# Job Aggregation & Multi-Source Matching Guide

## Overview

The enhanced JobMatcher component now integrates intelligent job aggregation from **9+ major job sources** and uses your background to intelligently rank and match opportunities.

## Features

### 1. Multi-Source Job Aggregation
- **LinkedIn** - Professional network jobs
- **Indeed** - Largest job board
- **Glassdoor** - Company reviews + jobs
- **ZipRecruiter** - Aggregator platform
- **Dice** - Tech/IT specialized jobs
- **FlexJobs** - Remote & flexible work
- **WellFound (AngelList)** - Startup opportunities
- **Upwork** - Freelance & contract work
- **Company Career Pages** - Direct company listings

### 2. Intelligent Background-Based Matching
The system analyzes your resume to create a background profile that includes:
- Current/latest job title
- Years of experience
- Top skills (extracted from resume)
- Industry experience
- Education and certifications
- Career trajectory and desired direction
- Seniority level
- Tech focus and remote preferences

Each aggregated job is scored against your background (0-100%) based on:
- **Skills Match (30%)** - How many required skills you have
- **Experience Level (25%)** - Is this a logical next step?
- **Industry Relevance (20%)** - Do you have domain knowledge?
- **Growth Opportunity (15%)** - Does this advance your career?
- **Location Fit (10%)** - Matches your location preferences

### 3. Job Deduplication
- Automatically detects duplicate listings across job boards
- Merges results to eliminate duplicates by URL and title+company combination
- Ensures you see unique opportunities only

### 4. Intelligent Ranking
Jobs are ranked by:
- **Match Score** - How well your background aligns with requirements (0-100)
- **Job Fit Score** - How well you match the specific role requirements (0-100)
- **Background Analysis** - Career progression, skills relevance, industry fit

## How to Use

### Step 1: Select Your Resume
```
1. Click "Auto-Search Jobs"
2. Select the resume you want to match against
3. Your background will be automatically analyzed
```

### Step 2: Configure Location & Search
```
- Location: Your current location (auto-detected or manually set)
- Search Radius: How far you're willing to travel (5-200 miles)
- Search Query: Job title, field, or keywords
  - Leave blank to search based on your current role
  - Or enter a specific title like "Senior Software Engineer"
```

### Step 3: Click Auto-Search Jobs
```
The system will:
1. Search all 9 job sources in parallel
2. Analyze your background against each job
3. Score jobs based on fit (0-100%)
4. Display results ranked by relevance
```

### Step 4: Filter & Analyze Results
Available filters:
- **Status** - New, Reviewed, Interested, Applied, Dismissed
- **Score Range** - Excellent (85+), Good (70-84), Fair (50-69), Poor (<50)
- **Min Score** - Set a minimum match score threshold
- **Location Type** - Remote, City, or State
- **Job Source** - Filter by specific job board (Indeed, LinkedIn, etc.)
- **Search Location** - Filter by city/state name

Sort options:
- **Score (High to Low)** - Best matches first
- **Background Fit (High)** - Best career progression
- **Date (Newest)** - Recently posted first
- **Date (Oldest)** - Older listings first

## Job Details & Analysis

For each job, you'll see:

### Match Scores
- **Job Fit Score (0-100)** - How well you match the requirements
  - 85+ = Excellent fit
  - 70-84 = Good fit
  - 50-69 = Fair fit (stretch role)
  - <50 = Poor fit

- **Background Fit Score (0-100)** - How this job aligns with your career
  - Shows as percentage in the job card
  - Considers your experience level, industry, and career trajectory

### Analysis Tabs
- **Strengths** - What you bring to the table
- **Gaps** - Skills or experience you might need
- **Improve** - How to better position yourself for this role

### Job Source Badge
Shows which platform the job came from (Indeed, LinkedIn, Glassdoor, etc.)

### Quick Actions
- **Mark Reviewed** - Mark as seen
- **Full Analysis** - Move to interested status
- **Quick Apply** - Add to Application Tracker immediately
- **Dismiss** - Hide from results
- **View Job** - Open in new tab
- **Optimize Resume** - Get ATS-optimized suggestions for this job

## Background Extraction

When you start an auto-search, the system analyzes your resume to extract:

```json
{
  "current_title": "Senior Software Engineer",
  "years_experience": 8,
  "skills": ["Python", "React", "Node.js", "AWS", "Docker", "PostgreSQL"],
  "industries": ["FinTech", "SaaS", "Enterprise"],
  "education": "B.S. Computer Science",
  "desired_direction": "Tech Leadership / Engineering Manager",
  "seniority_level": "Senior",
  "tech_focused": true,
  "remote_preference": "Flexible"
}
```

This profile is used to intelligently score jobs that best match your background.

## Job Scoring Algorithm

### Background Fit Scoring (0-100%)

Each aggregated job is scored using:

1. **Skills Analysis** (30% weight)
   - Count of required skills you have
   - Familiarity with relevant technologies
   - Transferable skills recognition

2. **Experience Level Analysis** (25% weight)
   - Your years vs. job requirements
   - Career progression (step up, lateral, step down)
   - Seniority alignment

3. **Industry Relevance** (20% weight)
   - Prior industry experience
   - Domain knowledge match
   - Vertical specialization

4. **Growth Opportunity** (15% weight)
   - Does this advance your career?
   - New skills you'd learn
   - Salary progression potential

5. **Location Fit** (10% weight)
   - Matches your location preferences
   - Remote option availability
   - Relocation feasibility

### Job Fit Scoring (Resume vs. Job)

Uses AI analysis to evaluate:
- Skills match (fuzzy matching with transferable skills)
- Experience alignment
- Education requirements
- Required vs. optional qualifications
- Cultural fit indicators

## API Integration

### Job Aggregator API

**Aggregate Jobs:**
```javascript
import { jobAggregator } from "@/api/jobAggregator";

const jobs = await jobAggregator.aggregateJobs(
  query,           // "Senior Engineer"
  location,        // "San Francisco, CA"
  {
    sources: "all",      // or specific source names
    remote_only: false,
    timeout: 45000,
    cache: true
  }
);
```

**Score Against Background:**
```javascript
const scoredJobs = await jobAggregator.aggregateAndScoreJobs(
  query,
  location,
  userBackground,
  { ... }
);
```

**Extract User Background:**
```javascript
const background = await jobAggregator.extractUserBackground(
  resumeContent  // Raw resume text or parsed data
);
```

### Job Source Connectors

Individual connectors for each job source:

```javascript
import {
  linkedinConnector,
  indeedConnector,
  glassdoorConnector,
  // ... etc
} from "@/api/jobSourceConnectors";

const jobs = await indeedConnector.search(query, location, options);
```

## Caching & Performance

- Results are cached for 30 minutes by default
- Searches run in parallel across all job sources
- 45-60 second timeout prevents hanging
- Failed sources gracefully return empty results
- No single failure blocks other sources

## Data Privacy

- Job URLs are verified to be direct links only
- No credentials stored for job boards
- Searches use internet context via LLM only
- Results are stored locally in your database
- No data shared with external APIs

## Troubleshooting

### No jobs found
- Try a different search term
- Your background might be niche (consider broader searches)
- Location might have limited opportunities
- Try disabling the remote_only filter

### Low background fit scores
- Your background might not match common job requirements
- Consider which industries/roles align with your goals
- Use the "Get AI Suggestions" feature for career recommendations

### Missing job source
- Some sources may have API restrictions
- Fallback is direct web search for alternative sources
- Manual entry always available

## Performance Optimization

For better performance:
1. Start with specific job titles (improves relevance)
2. Set location to increase result quality
3. Use score filters to focus on best matches
4. Archive old matches to improve performance

## Future Enhancements

Planned features:
- Job alert notifications
- Saved searches and auto-apply
- Company research integration
- Salary prediction and negotiation guidance
- Interview preparation by job type
- Custom scoring weights per user
- Team/department compatibility analysis

## File Structure

```
src/
├── api/
│   ├── jobAggregator.js           # Main aggregation engine
│   ├── jobSourceConnectors.js      # Individual source adapters
│   └── base44Client.js             # Base44 integration
├── pages/
│   └── JobMatcher.jsx              # Enhanced matcher component
├── components/
│   └── utils/
│       └── retry.js                # Retry logic for API calls
└── lib/
    └── utils.js                    # Utility functions
```

## Database Schema

Jobs are stored with extended fields:

```javascript
{
  job_title: string,
  company_name: string,
  job_url: string,
  job_description: string,
  location: string,
  salary_range: string,
  resume_id: string,
  match_score: number (0-100),
  background_fit_score: number (0-100),
  job_source: string,               // "Indeed", "LinkedIn", etc.
  auto_matched: boolean,             // true if from aggregation
  fit_analysis: {
    overall_fit: string,
    strengths: string[],
    gaps: string[],
    required_skills_match: object[],
    improvement_suggestions: string[]
  },
  background_analysis: {
    skills_match: number,
    experience_fit: string,
    industry_relevance: string,
    career_alignment: string,
    reasons: string[]
  },
  status: "new" | "reviewed" | "interested" | "applied" | "dismissed"
}
```

## Getting Started

1. ✅ Select your resume
2. ✅ Allow location detection
3. ✅ Enter a job title or leave blank (uses your current role)
4. ✅ Click "Auto-Search Jobs"
5. ✅ Review results sorted by background fit
6. ✅ Filter, analyze, and take action on matches

The system will find the best opportunities aligned with your background and career goals!
