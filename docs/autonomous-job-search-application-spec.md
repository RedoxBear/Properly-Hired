# Autonomous Job Search + Application System
## Full Feature Spec — Get Hired, Properly!

**Status:** Approved for development
**Core principle:** APPLY, DO NOT SUBMIT.
The system does everything — finds jobs, tailors resumes, fills application forms —
then stops and queues everything for one human approval step before anything is submitted.

---

## How It Fits Into the Existing App

The existing app already has:
- Application Tracker (manual tracking)
- Application Q&A (portal answer prep)
- Autofill Vault (stored reusable responses)
- Simon (job analysis) + Kyle (resume/cover letter)

This feature EXTENDS those — it does not replace them.
The Autofill Vault feeds the autonomous filler.
The Application Tracker receives records from the autonomous system.
Simon and Kyle are the intelligence layer for matching and tailoring.

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER UPLOADS RESUME                   │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              MODULE 1: JOB DISCOVERY AGENT              │
│  Queries approved APIs → scores matches → ranks results  │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│           MODULE 2: RESUME TAILORING (SIMON)            │
│  Gap analysis → keyword optimization → versioned output  │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│         MODULE 3: APPLICATION FORM AGENT                │
│  Playwright fills form → screening Qs via Kyle →        │
│  STOPS before submit → screenshots → queues for review   │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│             MODULE 4: REVIEW QUEUE DASHBOARD            │
│  User reviews → approves → opens browser at submit btn  │
└─────────────────────────────────────────────────────────┘
```

---

## Module 1: Job Discovery Agent

### What It Does
Automatically finds relevant job listings from approved API sources,
scores them against the user's profile, and surfaces ranked matches.

### New Base44 Entities Required
```
JobListing
  - id (auto)
  - user_id (string, indexed)
  - source (enum: jsearch | adzuna | usajobs | manual)
  - external_id (string) — source's own job ID
  - title (string, required)
  - company (string, required)
  - location (string)
  - remote (boolean)
  - url (string, required)
  - jd_text (text) — full job description
  - salary_min (number)
  - salary_max (number)
  - posted_at (timestamp)
  - match_score (number) — 0-100, Simon's rating
  - match_breakdown (json) — score by dimension
  - status (enum: discovered | tailoring | filling | pending_review
                  | needs_attention | approved | submitted | rejected)
  - dedup_hash (string, indexed) — prevents duplicate listings
  - created_at (timestamp, indexed)
```

### New Deno Function: discoverJobs.ts
Location: functions/discoverJobs.ts

```typescript
// Called on schedule (daily) or on-demand by user
// Queries JSearch, Adzuna, USAJobs APIs
// Scores each result against user profile via Simon
// Creates JobListing records, skips duplicates by dedup_hash
// Returns: { discovered: number, new: number, duplicates_skipped: number }
```

### Approved Job Sources (use only these — no scraping)
| API | Coverage | Auth Env Var |
|-----|----------|-------------|
| JSearch (RapidAPI) | Indeed/LinkedIn/Glassdoor aggregated | JSEARCH_API_KEY |
| Adzuna | Strong salary data | ADZUNA_APP_ID, ADZUNA_API_KEY |
| USAJobs | All federal positions (free) | USAJOBS_EMAIL, USAJOBS_API_KEY |

**Hard rule:** LinkedIn direct scraping = never. Job board scraping = never.
Only official APIs or aggregators with proper licensing.

### Match Scoring (Simon's Logic)
Simon scores each listing 0-100 against the user's master resume:
- Job title alignment: 30%
- Required skills overlap: 35%
- Industry/domain match: 15%
- Location/remote fit: 10%
- Seniority level match: 10%

Score thresholds:
- 80+: Auto-add to Review Queue
- 60-79: Surface for user opt-in
- Below 60: Filter out (unless user changes threshold)

---

## Module 2: Resume Tailoring Agent (Simon)

### What It Does
For each matched job, Simon generates a tailored resume version optimized
for that specific role and ATS system.

### New Base44 Entity Required
```
ResumeVersion
  - id (auto)
  - user_id (string, indexed)
  - job_listing_id (string, indexed)
  - base_resume_id (string) — which master resume was used
  - resume_text (text) — tailored content
  - resume_file_url (string) — uploaded file URL via Base44 storage
  - ats_score (number) — estimated ATS pass score
  - keyword_gaps (json) — what was missing, what was added
  - version_number (number)
  - created_at (timestamp)
```

### Simon's Tailoring Rules
1. Extract required skills, preferred skills, keywords from JD
2. Run gap analysis against master resume
3. Rewrite bullet points to align with role language
4. Inject missing keywords naturally — never fabricate experience
5. Preserve all factual content — no invented credentials
6. Flag when job requires credential user doesn't have
7. Score output: target 75+ ATS score before queuing

### Kyle Generates Cover Letter Alongside
Every tailored resume triggers Kyle to generate:
- Tailored cover letter (ARC formula)
- Answers to any visible screening questions

---

## Module 3: Application Form Agent

### What It Does
Navigates to the job application URL, fills every field, generates
screening question answers via Kyle, then STOPS before the final
Submit button. Screenshots the completed form and queues it for review.

### Technology Stack
```
Playwright (headless Chromium) — primary browser automation
  ↓
ATS detector → load strategy for that ATS system
  ↓
Fill all fields using user profile + tailored resume
  ↓
Screening questions → Kyle generates answers
  ↓
STOP at submit button — hard rule, never click submit
  ↓
Screenshot + fill summary → ReviewQueueItem record
```

### New Base44 Entity Required
```
Application
  - id (auto)
  - user_id (string, indexed)
  - job_listing_id (string, indexed)
  - resume_version_id (string)
  - status (enum: queued | filling | pending_review | needs_attention
                  | approved | submitted | rejected | manual)
  - ats_type (string) — workday | greenhouse | lever | icims | taleo | direct | unknown
  - fill_summary (json) — every field filled, value used, source (profile/resume/kyle)
  - screening_answers (json) — Q&A pairs, editable by user
  - screenshot_url (string) — full-page screenshot via Base44 storage
  - flagged_reason (string) — why it needs attention
  - browser_state (json) — saved session state for resuming
  - created_at (timestamp, indexed)
  - submitted_at (timestamp)

ApplicationEvent
  - id (auto)
  - application_id (string, indexed)
  - event_type (string) — created | fill_started | fill_complete | flagged
                           | approved | submitted | rejected
  - event_data (json)
  - created_at (timestamp)
```

### New Deno Function: fillApplication.ts
Location: functions/fillApplication.ts

```typescript
// Receives: job_listing_id, user_id
// 1. Loads user profile + tailored resume
// 2. Detects ATS type from URL and page structure
// 3. Loads appropriate fill strategy
// 4. Fills all form fields
// 5. Sends screening questions to Kyle via agents API
// 6. STOPS at submit button
// 7. Takes full-page screenshot → uploads to Base44 storage
// 8. Creates Application record with status: pending_review
// 9. Creates ApplicationEvent: fill_complete
```

### ATS Support — Build in This Order
| ATS | Market Share | Priority | Notes |
|-----|-------------|----------|-------|
| Workday | ~40% enterprise | P1 | Requires account creation — flag LOGIN_REQUIRED |
| Greenhouse | ~25% tech | P1 | No account required — most automation-friendly |
| Lever | ~15% startups | P2 | Very clean structure |
| iCIMS | ~10% enterprise | P3 | Always requires account |
| Taleo (Oracle) | ~8% | P3 | Legacy, fragile selectors |
| Direct pages | ~variable | P2 | Use AI-guided navigation |

### Failure States
| State | Trigger | Action |
|-------|---------|--------|
| LOGIN_REQUIRED | Site requires account | Flag card, provide URL, ask user to create account |
| CAPTCHA_BLOCKED | CAPTCHA detected | Flag card — NEVER attempt to solve, surface to user |
| FORM_ERROR | Fill attempt failed | Log error, save partial state, flag for review |
| UPLOAD_FAILED | Resume upload failed | Try alternate upload methods, flag if all fail |
| UNSUPPORTED_ATS | Unknown form structure | Log DOM snapshot, flag for manual |

**CAPTCHA hard rule:** Never integrate CAPTCHA solving services.
Flag and surface to user every time. No exceptions.

### Autofill Vault Integration
Before generating any answer via Kyle, check Autofill Vault first:
```javascript
// Check vault for existing answer to this question type
const vaultAnswer = await AutofillVault.filter({
  user_id,
  question_category: detectedCategory
});
if (vaultAnswer.length > 0) {
  useVaultAnswer(vaultAnswer[0]);
} else {
  useKyleToGenerate(question, jobContext);
  // Offer to save new answer to vault
}
```

### Rate Limits + Ethics
```
- Max 50 application fills per user per day
- Min 30 seconds between applications (same user)
- No concurrent fills for same user — sequential only
- Duplicate check: company + role + location before any fill attempt
- Log all automation activity to ApplicationEvent table
- Never auto-submit under any circumstance
```

---

## Module 4: Review Queue Dashboard

### New Page: ReviewQueue.jsx
Location: src/pages/ReviewQueue.jsx

This is the central control panel. Every filled application lands here
before anything is submitted. The user's only required action is the
final approval click.

### Application Card Shows
- Company name, job title, location, salary range
- Match score badge (color: green 80+, yellow 60-79, orange 40-59)
- Status badge
- Simon's 3-line job summary
- Tailored resume used — expandable diff vs master resume
- Fill summary — every field that was filled, expandable
- Screening answers — editable inline before approving
- Screenshot thumbnail — click to expand full form view
- Cover letter preview

### Application Status Flow
```
DISCOVERED      → job found, not yet processed
TAILORING       → Simon generating resume version
FILLING         → browser agent filling form
PENDING_REVIEW  → filled, waiting for user
NEEDS_ATTENTION → flagged (CAPTCHA, missing info, low score, login required)
APPROVED        → user approved, ready to submit
SUBMITTED       → user completed submission in browser
REJECTED        → user rejected, archived
MANUAL          → removed from automation, user handling manually
```

### User Actions on Each Card
| Action | Behavior |
|--------|----------|
| Approve & Submit | Opens application URL in browser at submit button. Confirmation modal required. |
| Edit Before Approving | Opens inline editor for any field or answer |
| Reject | Archives with optional reason |
| Flag for Manual | Removes from auto queue, adds to manual reminder list |

### Queue Filters
- Status (default: PENDING_REVIEW + NEEDS_ATTENTION)
- Match score range
- Date range
- Company name search
- Sort: by date, match score, company

### Bulk Actions (limited)
- Bulk reject allowed
- Bulk "flag for manual" allowed
- Bulk approve NOT allowed — each approval requires individual confirmation

### Analytics Strip (top of page)
- Applications in queue this week
- Submitted this week
- Awaiting review
- Response rate (if user logs outcomes in Application Tracker)

---

## Integration With Existing Pages

### Application Tracker
Every submitted application automatically creates/updates a record
in the existing Application Tracker. The autonomous system feeds it,
not replaces it.

### Autofill Vault
The form-fill agent reads from the vault before generating new answers.
New Kyle-generated answers can be saved back to the vault.

### My Resumes
Resume versions generated during tailoring appear in My Resumes,
tagged with the job they were tailored for.

### Agent Workspace (Admin)
Add monitoring panel showing:
- Active fill jobs
- Queue depth
- Fill success rate by ATS type
- API quota status (JSearch, Adzuna, USAJobs)

---

## Build Sequence

### Phase 1 — Foundation (Build First)
- [ ] Create JobListing entity in Base44 Admin
- [ ] Create ResumeVersion entity in Base44 Admin
- [ ] Create Application entity in Base44 Admin
- [ ] Create ApplicationEvent entity in Base44 Admin
- [ ] Build discoverJobs.ts Deno function (JSearch first, then Adzuna, then USAJobs)
- [ ] Build basic Review Queue page (display only, no automation yet)
- [ ] Manual "add job URL" flow — user pastes URL, system analyzes and queues

### Phase 2 — Resume Tailoring Integration
- [ ] Wire Simon into the tailoring pipeline for each matched job
- [ ] ResumeVersion creation and storage via Base44 files
- [ ] Kyle cover letter generation alongside each resume version
- [ ] Resume diff view in Review Queue card

### Phase 3 — Browser Automation Core
- [ ] Install Playwright in project
- [ ] Build ATS detector (URL + page structure)
- [ ] Workday fill strategy (P1)
- [ ] Greenhouse fill strategy (P1)
- [ ] Screenshot capture + upload to Base44 storage
- [ ] CAPTCHA detection and NEEDS_ATTENTION flagging
- [ ] fillApplication.ts Deno function

### Phase 4 — Intelligence Layer
- [ ] Kyle screening question agent integration
- [ ] Autofill Vault read/write integration
- [ ] Lever + direct page fill strategies
- [ ] Application Tracker auto-update on submission

### Phase 5 — Polish
- [ ] iCIMS + Taleo strategies
- [ ] Mobile Review Queue optimization
- [ ] Agent Workspace monitoring panel
- [ ] Analytics strip

---

## Legal + Ethical Boundaries

| Rule | Detail |
|------|--------|
| Never auto-submit | User must explicitly approve every single submission |
| Never fabricate | Simon cannot invent experience, credentials, or qualifications |
| Never bypass CAPTCHA | Flag every time, surface to user |
| Never touch LinkedIn | Explicit ToS prohibition on automation |
| No scraping | Only licensed APIs |
| Opt-out per company | User can flag companies to exclude from automation |
| Activity logs | All automation logged to ApplicationEvent, retained 90 days |
| ToS disclosure | Platform ToS must disclose automation tools used on user's behalf |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time from job discovery to queued application | < 5 minutes |
| Form fill success rate — Workday | > 75% |
| Form fill success rate — Greenhouse | > 85% |
| Review Queue approval rate | > 60% |
| User-rated resume quality | > 4/5 |
| Duplicate application rate | 0% |
