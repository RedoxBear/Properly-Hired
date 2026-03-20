# Properly-Hired — Claude Code Session Brief

## Project Identity
**Get Hired, Properly! LLC** — AI-powered career navigation SaaS
- Platform: ProperlyHired.com
- GitHub: RedoxBear/Properly-Hired
- Built on: Base44 (https://app.base44.com) — App ID: 68af4e866eafaf5bc320af8a
- Owner: Richard (founder, 20+ yrs HR/economics, U.S. veteran)

## Architecture — Read This First
This is a Base44-native app. Base44 handles entities (database), auth, file storage,
and LLM integration. The GitHub repo is the CODE layer; Base44 is the DATA/BACKEND layer.
Every new feature requires changes in BOTH places:

```
Base44 Admin (entities first) → src/pages/ (React JSX) → functions/ (Deno) → Git commit
```

Never write code that assumes a custom database or backend API.
All data calls go through the Base44 SDK: import { [Entity] } from '../api/entities'

## Language Stack
- Frontend: JavaScript (JSX) — NOT TypeScript. Files are .jsx and .js
- Styling: Tailwind CSS + Radix UI (49 components in src/components/ui/)
- State: React hooks + TanStack Query — no Zustand
- Routing: React Router 7
- Backend functions: Deno (TypeScript) in /functions/ — 17 existing functions
- Agents: Python in /agents/ (simon/, kyle/)
- Build: Vite + Base44 plugin

## Core Commands
```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # tsc against jsconfig.json
npm run preview    # Preview production build
```

## Active Features (Already Built — Do Not Break)
- Simon agent: ghost job detection, 100-pt scoring, role classification, JD analysis
- Kyle agent: resume positioning, cover letters (ARC formula), STAR interview prep
- Simon → Kyle handoff protocol (Simon briefs Kyle before application work)
- RAG system: ragIngest + ragRetrieve with 8 scoring signals (src/lib/rag/ area — fragile)
- 45 pages across Job Tools, Resume, Cover Letters, Applications, Networking, Intelligence, Admin
- Application Tracker, Application Q&A, Autofill Vault (existing — extend, don't replace)
- O*NET import system (Phase 1 complete, Phases 2-5 pending)
- External integrations: O*NET, BLS, DOL, Bright Data, Firecrawl, Notion, GitHub API

## Active New Feature: Autonomous Job Search + Application System
See agent_docs/autonomous-job-search-application-spec.md — PRIMARY active workstream.

Core principle: APPLY, DO NOT SUBMIT.
The system finds jobs, tailors resumes, fills application forms completely,
then stops before final submission. User reviews in the Review Queue and
clicks Submit only for applications they want.

## Open Bug — Fix Before New Feature Work
See agent_docs/onet-schema-bug.md
O*NET schema mismatch causing 422 errors (CSV column names ≠ Base44 entity fields).
Fix in Base44 Admin before building new entities. 20-minute fix.

## Base44 Entity Pattern
```javascript
// Always import entities this way
import { JobListing, Application, ReviewQueueItem } from '../api/entities';

// Create
const job = await JobListing.create({ title, company, url, match_score });

// Query
const jobs = await JobListing.filter({ status: 'pending_review' });

// Update
await Application.update(id, { status: 'approved' });
```

## Git Workflow (VS Code Source Control)
- Create branch for every feature: feature/autonomous-apply, fix/onet-schema
- Commit after each logical unit — small, frequent commits
- Never commit directly to main
- Push via VS Code Source Control panel (Ctrl+Shift+G)

## IMPORTANT: Never Touch These
- src/lib/ O*NET schemas and debug tools — ask before modifying
- knowledge/simon/ and knowledge/kyle/ — RAG knowledge files, never regenerate
- agents/simon.jsonc and agents/kyle.jsonc — Base44 agent configs, edit carefully
- Any existing Autofill Vault logic — the new autonomous system must coexist with it

## Progressive Disclosure — Read Before Working
- agent_docs/autonomous-job-search-application-spec.md — full feature spec (start here)
- agent_docs/architecture.md — system overview
- agent_docs/browser-automation-guide.md — Playwright ATS form-fill patterns
- agent_docs/job-discovery-apis.md — approved job board APIs
- agent_docs/review-queue-ux.md — Review Queue dashboard UX
- agent_docs/base44-patterns.md — Base44 entity and function patterns for this project
- agent_docs/onet-schema-bug.md — open bug reference
