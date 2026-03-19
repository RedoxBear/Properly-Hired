# ProperlyHired — Session Notes 2026-03-19
## Autonomous Job Search + Application System — Build Session

---

## CURRENT STATE SNAPSHOT

- **Branch:** `feature/autonomous-job-pipeline` (off `main`)
- **Base44 App ID:** `68af4e866eafaf5bc320af8a`
- **Base44 account:** `reedxiong@gmail.com`
- **GitHub:** `RedoxBear/Properly-Hired`
- **Local repo:** `/mnt/f/Projects/AI_Projects/code/ProperlyHired`

---

## PRE-WORK — COMPLETED

### Pre-1 ✅ CLAUDE.md at repo root
- Copied from `docs/CLAUDE.md` → `CLAUDE.md` (repo root, same level as `package.json`)
- Required so Claude Code reads it automatically every VS Code session

### Pre-2 ✅ O*NET Entity Files Created
- Created `entities/` directory at repo root
- 8 JSON entity definition files written, field names derived directly from
  mapper functions in `functions/importONetCSV.ts` (NOT from the buggy
  `FIX_ONET_SCHEMA_MISMATCH.md` doc which pointed at the wrong file)
- Files: `ONetOccupation.json`, `ONetSkill.json`, `ONetAbility.json`,
  `ONetKnowledge.json`, `ONetTask.json`, `ONetWorkActivity.json`,
  `ONetWorkContext.json`, `ONetReference.json`

**CLI commands to push O*NET entities (run once, in order):**
```bash
cd /mnt/f/Projects/AI_Projects/code/ProperlyHired
base44 link -p 68af4e866eafaf5bc320af8a   # creates config.jsonc — one-time only
base44 entities push                        # pushes all 8 O*NET entity schemas
base44 functions deploy                     # redeploys importONetCSV with correct schemas
```

**Warning:** `entities push` is a full sync. If any entity has existing records and
you rename fields, it will return 428. Clear data first via ONetImport → "Clear All"
if needed.

**Root cause of O*NET 422 bug:**
The Base44 entity schemas didn't exist / had wrong field names. The fix was NOT in
`ONetImport.jsx` (frontend doesn't touch CSV data). The Deno function
`importONetCSV.ts` already has proper mappers — the entity schemas just needed to
match what those mappers output. Field name reference:

| Entity         | Key output fields from mapper                                          |
|----------------|------------------------------------------------------------------------|
| ONetOccupation | code, title, description, job_zone, tags                               |
| ONetSkill      | occupation_code, occupation_title, skill_name, skill_category, importance, level, description, keywords |
| ONetAbility    | occupation_code, occupation_title, ability_name, ability_category, importance, level, description, keywords |
| ONetKnowledge  | occupation_code, occupation_title, knowledge_name, knowledge_category, importance, level, description, keywords |
| ONetTask       | occupation_code, occupation_title, task_name, task_type, importance, frequency, description, keywords |
| ONetWorkActivity | occupation_code, occupation_title, activity_name, activity_category, importance, level, description, keywords |
| ONetWorkContext | occupation_code, occupation_title, context_name, context_category, value, description, keywords |
| ONetReference  | reference_type, reference_key, reference_name, version, import_date, status, notes, metadata |

### Pre-3 ✅ Git Branch Created
```bash
git checkout -b feature/autonomous-job-pipeline
# Branch is off main. All Phase 1 work goes here.
```

---

## PHASE 1 — FOUNDATION

### 1A ✅ Base44 Admin — 4 New Entities (COMPLETED BY USER)
Created manually in Base44 Admin UI at https://app.base44.com

**Entity schemas for reference:**

#### JobListing
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| user_id | string | yes | |
| source | string | yes | enum: jsearch, adzuna, usajobs, manual |
| external_id | string | no | |
| title | string | yes | |
| company | string | yes | |
| location | string | no | |
| remote | boolean | no | |
| url | string | yes | format: uri |
| jd_text | string | no | full job description |
| salary_min | number | no | |
| salary_max | number | no | |
| posted_at | string | no | format: date-time |
| match_score | number | no | 0–100 |
| match_breakdown | object | no | score by dimension |
| ghost_score | number | no | 0–100 |
| simon_summary | string | no | 3-line Simon analysis |
| status | string | yes | enum: discovered, tailoring, filling, pending_review, needs_attention, approved, submitted, rejected |
| dedup_hash | string | no | sha256 of company+title+location |
| created_at | string | no | format: date-time |

#### ResumeVersion
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| user_id | string | yes | |
| job_listing_id | string | yes | |
| base_resume_id | string | yes | |
| resume_text | string | no | tailored content |
| resume_file_url | string | no | format: uri |
| cover_letter_text | string | no | |
| ats_score | number | no | 0–100 |
| keyword_gaps | object | no | |
| version_number | integer | no | |
| created_at | string | no | format: date-time |

#### Application
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| user_id | string | yes | |
| job_listing_id | string | yes | |
| resume_version_id | string | no | |
| status | string | yes | enum: queued, filling, pending_review, needs_attention, approved, submitted, rejected, manual |
| ats_type | string | no | enum: workday, greenhouse, lever, icims, taleo, direct, unknown |
| fill_summary | object | no | field→value→source color coding |
| screening_answers | object | no | Q&A pairs, user-editable |
| screenshot_url | string | no | format: uri |
| flagged_reason | string | no | |
| browser_state | object | no | saved Playwright session |
| created_at | string | no | format: date-time |
| submitted_at | string | no | format: date-time |

#### ApplicationEvent
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| application_id | string | yes | |
| user_id | string | yes | |
| event_type | string | yes | enum: created, fill_started, fill_complete, flagged, approved, submitted, rejected |
| event_data | object | no | |
| created_at | string | no | format: date-time |

### 1B ✅ Entity Stub Files Created
Location: `src/entities/` (matches existing `JobApplication.js`, `Resume.js` pattern)

Files written:
- `src/entities/JobListing.js`
- `src/entities/ResumeVersion.js`
- `src/entities/Application.js`
- `src/entities/ApplicationEvent.js`

Each file is 3 lines:
```javascript
import { base44 } from '@/api/base44Client';
export const EntityName = base44.entities.EntityName;
```

Import pattern in pages:
```javascript
import { JobListing } from '@/entities/JobListing';
import { Application } from '@/entities/Application';
import { ResumeVersion } from '@/entities/ResumeVersion';
import { ApplicationEvent } from '@/entities/ApplicationEvent';
```

### 1C ✅ discoverJobs.ts Deno Function Written
Location: `functions/discoverJobs.ts` (410 lines)

**What it does:**
1. Auth check — 401 if not logged in
2. Rate limit — max 50 new JobListings per user per day (429 if exceeded)
3. Loads user's master resume for scoring
4. Queries JSearch + Adzuna + USAJobs in parallel (graceful degradation if key missing)
5. Deduplicates via sha256(company|title|location)
6. Scores each job 0–100 against resume (5 dimensions)
7. Filters out score < 60
8. Creates JobListing records (bulk, 50 per batch, fallback to individual)
9. Returns stats

**Request body:**
```json
{
  "user_id": "string (defaults to logged-in user)",
  "search_query": "HR Manager",
  "location": "Los Angeles, CA",
  "remote_only": false
}
```

**Response:**
```json
{
  "success": true,
  "discovered": 65,
  "new_listings": 12,
  "duplicates_skipped": 8,
  "below_threshold": 45,
  "high_match": 5,
  "sources": { "jsearch": 30, "adzuna": 20, "usajobs": 15 }
}
```

**Scoring dimensions (0–100 total):**
| Dimension | Weight | Logic |
|-----------|--------|-------|
| Job title alignment | 30 pts | query keyword overlap with job title |
| Skills overlap | 35 pts | JD keywords found in resume text |
| Industry/domain | 15 pts | HR-domain terms in both JD and resume |
| Location/remote fit | 10 pts | remote=10, on-site=7 |
| Seniority match | 10 pts | tier gap penalty (0=10pts, 1=8pts, 2=5pts, 3+=2pts) |

**Status assignment:**
- score >= 80 → `pending_review` (auto-queued for Review Queue)
- score 60–79 → `discovered` (surfaces for user opt-in)
- score < 60 → filtered out entirely

**Environment variables required (set in Base44 Admin → Settings → Environment Variables):**
| Variable | Source |
|----------|--------|
| JSEARCH_API_KEY | RapidAPI → JSearch subscription |
| ADZUNA_APP_ID | developer.adzuna.com |
| ADZUNA_API_KEY | developer.adzuna.com |
| USAJOBS_EMAIL | developer.usajobs.gov (your email) |
| USAJOBS_API_KEY | developer.usajobs.gov |

**Deploy command:**
```bash
cd /mnt/f/Projects/AI_Projects/code/ProperlyHired
base44 functions deploy
```

---

## PHASE 1 — REMAINING

### 1D — ReviewQueue.jsx (NEXT)
Location: `src/pages/ReviewQueue.jsx`

**Page structure:**
```
Top analytics strip (4 stat cards):
  - Applications pending review this week
  - Submitted this week
  - Needs attention count
  - Average match score

Filter bar:
  - Status tabs: All | Pending Review | Needs Attention | Approved | Submitted
  - Match score slider (default min: 60)
  - Sort: Newest | Highest Match | Company A-Z
  - Company search input

Application cards (Needs Attention first, then Pending Review):
  ┌─────────────────────────────────────────────────────────┐
  │ Company Name                    [Match: 87] [PENDING]    │
  │ Job Title · Location · $120k-$145k · Remote badge        │
  │ Posted 2 days ago · Filled 4 minutes ago                 │
  ├─────────────────────────────────────────────────────────┤
  │ Simon's 3-line summary (always visible)                  │
  ├─────────────────────────────────────────────────────────┤
  │ [Resume Used ▼] [Form Fill ▼] [Screening Answers ▼]      │
  │ [Screenshot ▼]  [Cover Letter ▼]                         │
  ├─────────────────────────────────────────────────────────┤
  │ [Approve & Submit] [Edit First] [Reject] [Manual]        │
  └─────────────────────────────────────────────────────────┘

Fill summary color coding (Phase 3 onwards):
  - Green: sourced from user profile
  - Blue: sourced from tailored resume
  - Purple: Kyle-generated answer
```

**Action behaviors:**
- Approve & Submit → confirmation modal → opens job URL in new tab → update status: approved
- Edit First → inline edit mode for screening answers + cover letter → save → back to pending_review
- Reject → optional reason dropdown → status: rejected
- Manual → status: manual, removes from auto-queue

**Needs Attention card types:**
- LOGIN_REQUIRED: "Create account at [Company] first, then return here"
- CAPTCHA_BLOCKED: "Complete CAPTCHA manually at [URL]"
- LOW_SCORE: "ATS score below threshold — review resume match"
- UPLOAD_FAILED: "Resume upload failed — try manual upload"

**Empty states:**
- No items: "Simon is scanning for matches. Or add a job manually."
- All reviewed: "You're all caught up."

**Manual "Add Job" button:**
- Opens modal → user pastes job URL
- Calls discoverJobs with source: 'manual'
- Creates JobListing immediately → shows in queue

**Imports to use:**
```javascript
import { JobListing } from '@/entities/JobListing';
import { Application } from '@/entities/Application';
import { ResumeVersion } from '@/entities/ResumeVersion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
// Icons from lucide-react: ClipboardList, CheckCircle2, AlertTriangle,
//   Clock, XCircle, ExternalLink, ChevronDown, ChevronUp, Plus,
//   Building2, MapPin, DollarSign, Wifi, RefreshCw
```

### 1E — "Add Job Manually" flow
Included as a modal inside ReviewQueue.jsx. User pastes URL → calls
`discoverJobs` function with `{ source: 'manual', url: pastedUrl }`.

### 1F — Layout.jsx Route Addition
Add to `allSections` under "Premium & Growth":
```javascript
{
  title: "Review Queue",
  url: createPageUrl("ReviewQueue"),
  icon: ClipboardList,
  description: "Review & approve applications",
  badge: "Pro"
}
```
Position: between "App Tracker" and "Interview Prep".

Add import at top of Layout.jsx:
```javascript
import { ClipboardList } from "lucide-react";
```

---

## PHASE 2 — RESUME TAILORING (AFTER PHASE 1 COMPLETE)

- Wire Simon agent into tailoring pipeline for each matched job
- Create ResumeVersion records via Base44 files storage
- Kyle generates cover letter alongside each resume version
- Resume diff view in Review Queue card (two-column, changed lines in amber)

Agent call pattern from Deno functions:
```typescript
// Call Simon for tailoring
const simonResult = await base44.agents.invoke('simon', {
  prompt: `Analyze this JD against the resume and generate a tailored version...`,
  context: { jobDescription: jd_text, masterResume: resume_text }
});
```

---

## PHASE 3 — BROWSER AUTOMATION (AFTER PHASE 2)

- `npm install playwright` — add to package.json
- New function: `functions/fillApplication.ts`
- ATS detector (URL + page content signatures)
- Build order: Greenhouse (P1) → Workday (P1) → Lever (P2) → Direct (P2)
- Hard rule: NEVER click Submit. Stop at submit button, screenshot, queue.
- CAPTCHA: detect and flag CAPTCHA_BLOCKED, never attempt to solve

ATS detection logic (from browser-automation-guide.md):
```javascript
function detectATS(url, pageContent) {
  if (url.includes('myworkdayjobs.com') || url.includes('workday.com')) return 'workday';
  if (url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) return 'greenhouse';
  if (url.includes('jobs.lever.co')) return 'lever';
  if (url.includes('icims.com')) return 'icims';
  if (url.includes('taleo.net')) return 'taleo';
  if (pageContent.includes('data-automation-id')) return 'workday';
  if (pageContent.includes('greenhouse-job-board')) return 'greenhouse';
  return 'direct';
}
```

---

## PHASE 4 — INTELLIGENCE LAYER

- Kyle screening question answers in fillApplication.ts
- Autofill Vault read-before-generate: check vault first, save new answers back
- Application Tracker auto-update on submission
- ApplicationEvent logging throughout all automation steps

---

## PHASE 5 — POLISH

- iCIMS + Taleo fill strategies
- Agent Workspace monitoring panel (active fills, queue depth, fill rate by ATS, API quota)
- Analytics strip on Review Queue (already specced in 1D, wire up in Phase 5)
- Mobile swipe gestures (approve/reject)

---

## BASE44 CLI QUICK REFERENCE

```bash
# Link project (one-time — creates config.jsonc)
cd /mnt/f/Projects/AI_Projects/code/ProperlyHired
base44 link -p 68af4e866eafaf5bc320af8a

# Push entity schemas
base44 entities push

# Push agent configs (simon.jsonc + kyle.jsonc)
base44 agents push

# Deploy Deno functions
base44 functions deploy

# Deploy everything at once
base44 deploy -y

# Open app dashboard in browser
base44 dashboard open

# Check who is logged in
base44 whoami
```

---

## AGENT CONFIG UPDATES NEEDED (after Phase 1 complete)

Add to `agents/simon.jsonc` → `tool_configs` array:
```jsonc
{ "entity_name": "JobListing",      "allowed_operations": ["create","read","update"] },
{ "entity_name": "ResumeVersion",   "allowed_operations": ["create","read"] },
{ "entity_name": "ApplicationEvent","allowed_operations": ["create","read"] },
{ "function_name": "discoverJobs",  "description": "Discover and score job listings from JSearch, Adzuna, USAJobs. Pass { user_id, search_query, location, remote_only }." }
```

Add to `agents/kyle.jsonc` → `tool_configs` array:
```jsonc
{ "entity_name": "ResumeVersion", "allowed_operations": ["create","read","update"] },
{ "entity_name": "Application",   "allowed_operations": ["read","update"] },
{ "entity_name": "JobListing",    "allowed_operations": ["read"] }
```

Then push:
```bash
base44 agents push
```

---

## GIT WORKFLOW

```bash
# All work is on feature/autonomous-job-pipeline
# Commit after each logical unit

# Stage new files
git add entities/ src/entities/JobListing.js src/entities/ResumeVersion.js \
        src/entities/Application.js src/entities/ApplicationEvent.js \
        functions/discoverJobs.ts CLAUDE.md docs/SESSION_NOTES_2026-03-19.md

# Commit
git commit -m "feat: Phase 1 foundation — entity schemas, stubs, discoverJobs function"

# Push to GitHub (triggers Base44 auto-deploy)
git push -u origin feature/autonomous-job-pipeline

# When Phase 1 complete, merge to main via PR
gh pr create --title "feat: Autonomous job pipeline — Phase 1 foundation" \
  --body "Adds JobListing/ResumeVersion/Application/ApplicationEvent entities,
entity stubs, discoverJobs Deno function, ReviewQueue page, and Layout route."
```

---

## FILES CHANGED THIS SESSION

| File | Action | Notes |
|------|--------|-------|
| `CLAUDE.md` | Created (copied from docs/) | Required at repo root for VS Code Claude Code |
| `entities/ONetOccupation.json` | Created | Base44 CLI entity definition |
| `entities/ONetSkill.json` | Created | |
| `entities/ONetAbility.json` | Created | |
| `entities/ONetKnowledge.json` | Created | |
| `entities/ONetTask.json` | Created | |
| `entities/ONetWorkActivity.json` | Created | |
| `entities/ONetWorkContext.json` | Created | |
| `entities/ONetReference.json` | Created | |
| `src/entities/JobListing.js` | Created | Base44 entity stub |
| `src/entities/ResumeVersion.js` | Created | |
| `src/entities/Application.js` | Created | |
| `src/entities/ApplicationEvent.js` | Created | |
| `functions/discoverJobs.ts` | Created | 410-line Deno function |
| `docs/SESSION_NOTES_2026-03-19.md` | Created | This file |

---

## SPEC DOCUMENTS (all in /docs/)

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code session brief — read first every session |
| `autonomous-job-search-application-spec.md` | Full feature spec for the pipeline |
| `architecture.md` | Three-tier system overview |
| `base44-patterns.md` | Base44 SDK patterns — entity access, file storage, agent calls |
| `browser-automation-guide.md` | Playwright ATS form-fill guide, CAPTCHA rules |
| `job-discovery-apis.md` | JSearch, Adzuna, USAJobs API reference |
| `review-queue-ux.md` | Review Queue page UX specification |
| `onet-schema-bug.md` | O*NET 422 bug reference (see Pre-2 above for actual fix) |
| `CLAUDE_CODE_SETUP.md` | VS Code Claude Code setup guide |

---

## IMPORTANT CONSTRAINTS (never violate)

- **APPLY, DO NOT SUBMIT** — the system fills forms and stops. User submits manually.
- **No CAPTCHA solving** — detect and flag CAPTCHA_BLOCKED, surface to user every time.
- **No LinkedIn scraping** — ToS violation. JSearch/Adzuna/USAJobs only.
- **No fabrication** — Simon cannot invent experience, credentials, or qualifications.
- **No bulk approve** — every application approval requires individual user confirmation.
- **Frontend is JSX/JS only** — no TypeScript in src/. Deno functions use TypeScript.
- **All data via Base44 SDK** — no custom database or direct API calls from frontend.
- **Never touch RAG pipeline** — `knowledge/`, `ragIngest.ts`, `ragRetrieve.ts` — fragile.
- **Never touch existing Autofill Vault logic** — new system must coexist with it.
