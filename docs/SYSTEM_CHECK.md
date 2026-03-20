# ProperlyHired — Autonomous Job Pipeline: System Check

This document defines the **canonical design** for Phases 1–3 of the autonomous job search and application system. Use it to audit whether all deployed functions, entities, and UI components are correctly wired. Each section lists what MUST be present, what MUST NOT be present, and the exact data flow between components.

---

## Architecture Overview

```
User → ReviewQueue (UI)
         │
         ├─ [Discover] → discoverJobs() → JobListing[] (status: discovered)
         │
         ├─ [Tailor]   → orchestrateTailoring() → ResumeVersion + JobListing (status: pending_review | needs_attention)
         │
         └─ [Submit]   → fillApplication() → Application + ApplicationEvent + JobListing (status: applied | manual_required | application_error)
```

**Entity write chain (no entity should be skipped):**
```
JobListing → ResumeVersion → Application → ApplicationEvent
```

---

## Phase 1: Job Discovery (`discoverJobs`)

### Must be present
- Reads `user_id` from authenticated user if not in body
- Calls at least one external job API (JSearch, Adzuna, or USAJobs)
- Creates `JobListing` records with `status: 'discovered'`
- Sets `dedup_hash` to prevent duplicate listings
- Sets `match_score` (0–100) on each listing
- Returns `{ listings_found, listings_saved }` count

### Must NOT be present
- No hardcoded API keys in function body (must use `Deno.env.get(...)`)
- No writes to `Application` or `ApplicationEvent` — those are Phase 3 only

### Entity fields written
| Entity | Fields set |
|--------|-----------|
| JobListing | `user_id`, `title`, `company`, `url`, `jd_text`, `source`, `external_id`, `match_score`, `match_breakdown`, `ghost_score`, `simon_summary`, `dedup_hash`, `status: 'discovered'`, `created_at` |

---

## Phase 2: Resume Tailoring (`orchestrateTailoring`)

### Must be present
- Reads master resume from `Resume` entity using `is_master_resume: true` flag, with fallback to first resume
- Resume text fallback chain: `content ?? resume_text ?? parsed_content ?? optimized_content`
- Runs keyword gap analysis (round 1 + round 2 if ATS score < 75)
- Runs `auditDocumentStructure()` and sets `audit.ats_score`
- Generates DOCX and cover letter text
- Creates `ResumeVersion` with all fields including `cover_letter_text`, `docx_base64`, `ats_score`, `keyword_gaps_filled`, `simon_audit_passed`, `audit_log`
- Sets `finalStatus = 'pending_review'` if audit passed AND ats_score >= 60, else `'needs_attention'`
- Sets `flagged_reason` on JobListing when: meta_issues exist, ghost_strings detected, or ats_score < 60
- Final `JobListing.update()` includes `status`, `simon_summary`, and conditionally `flagged_reason`

### Must NOT be present
- **NO** `await JobListing.update(job_listing_id, { status: 'tailoring' })` — this interim status update causes a race condition and leaves listings orphaned if the function crashes mid-run
- No writes to `Application` or `ApplicationEvent` — those are Phase 3 only

### Critical code pattern — `flagged_reason` block
This block MUST appear immediately before the final `JobListing.update()`:
```typescript
const flaggedReasonParts: string[] = [];
if (audit.meta_issues?.length > 0) flaggedReasonParts.push(`Structure: ${audit.meta_issues.join(', ')}`);
if (audit.ghost_strings?.length > 0) flaggedReasonParts.push('Ghost strings detected in resume');
if (atsScore < 60) flaggedReasonParts.push(`Low ATS score (${atsScore}/100)`);
const flaggedReason = flaggedReasonParts.join(' | ');

await JobListing.update(job_listing_id, {
  status: finalStatus,
  simon_summary: simonSummary,
  ...(flaggedReason && { flagged_reason: flaggedReason }),
});
```

### Entity fields written
| Entity | Fields set |
|--------|-----------|
| ResumeVersion | `user_id`, `job_listing_id`, `base_resume_id`, `resume_text`, `docx_base64`, `docx_filename`, `cover_letter_text`, `ats_score`, `keyword_gaps_filled`, `simon_audit_passed`, `audit_log`, `tailor_round`, `needs_manual_review`, `created_at` |
| JobListing | `status` (`pending_review` or `needs_attention`), `simon_summary`, `flagged_reason` (conditional) |

---

## Phase 3: Form Filling (`fillApplication`)

### Must be present
- Declares ALL FIVE entities: `JobListing`, `ResumeVersion`, `AutofillVault`, `ApplicationEvent`, **`Application`**
- Loads `ResumeVersion` — explicit ID first, then falls back to latest for the listing sorted by `created_at` descending
- Loads `AutofillVault` filtered by `user_id`
- Detects ATS type from job URL using pattern matching
- Attempts API submission for Greenhouse and Lever
- Sets `finalStatus` as: `'applied'` | `'manual_required'` | `'application_error'`
- Creates `ApplicationEvent` record for every invocation (audit trail)
- Updates `JobListing.status` to `finalStatus`; sets `applied_at` if `finalStatus === 'applied'`
- **Creates or updates `Application` entity** with `cover_letter_text`, `fill_summary`, `status`
- Returns `autofill_packet` in response (for manual fallback UI)
- Returns `cover_letter` separately in response (for ReviewQueue display)

### Must NOT be present
- Binary data (`docx_base64`) in the response — must be stripped before returning
- No `Application` entity declaration = **critical gap** (cover letter and fill summary are never persisted)

### Critical code pattern — Application entity declaration
This MUST appear alongside the other entity declarations:
```typescript
const JobListing       = base44.asServiceRole.entities.JobListing;
const ResumeVersion    = base44.asServiceRole.entities.ResumeVersion;
const AutofillVault    = base44.asServiceRole.entities.AutofillVault;
const ApplicationEvent = base44.asServiceRole.entities.ApplicationEvent;
const Application      = base44.asServiceRole.entities.Application;   // ← REQUIRED
```

### Critical code pattern — Application create/update block
This MUST appear after `JobListing.update()` and before the return statement:
```typescript
const { cover_letter: coverLetterForApp, ...fillSummaryPacket } = autofillPacket;
const existingApps = await Application.filter({ job_listing_id, user_id }).catch(() => []);
const existingApp = existingApps?.[0] ?? null;
if (existingApp) {
  await Application.update(existingApp.id, {
    cover_letter_text: coverLetterForApp ?? '',
    fill_summary:      fillSummaryPacket,
    status:            finalStatus,
  }).catch((e) => console.error('[fillApplication] Application update failed:', e));
} else {
  await Application.create({
    user_id,
    job_listing_id,
    resume_version_id: resumeVersion?.id ?? null,
    cover_letter_text: coverLetterForApp ?? '',
    fill_summary:      fillSummaryPacket,
    status:            finalStatus,
    created_at:        new Date().toISOString(),
  }).catch((e) => console.error('[fillApplication] Application create failed:', e));
}
```

### Entity fields written
| Entity | Fields set |
|--------|-----------|
| ApplicationEvent | `user_id`, `job_listing_id`, `resume_version_id`, `event_type` (applied/manual_required/application_error), `ats_type`, `notes`, `created_at` |
| JobListing | `status` (applied/manual_required/application_error), `applied_at` (if applied) |
| Application | `user_id`, `job_listing_id`, `resume_version_id`, `cover_letter_text`, `fill_summary`, `status`, `created_at` |

---

## Entity Schema Reference

### JobListing
Required fields: `user_id`, `title`, `company`, `url`, `status`
Phase-added fields: `jd_text`, `match_score`, `match_breakdown`, `ghost_score`, `simon_summary`, `flagged_reason`, `dedup_hash`, `applied_at`
Status enum: `discovered` → `pending_review` | `needs_attention` → `tailoring` *(deprecated — do not set)* → `approved` → `applied` | `manual_required` | `application_error` | `rejected`

### ResumeVersion
Fields: `user_id`, `job_listing_id`, `base_resume_id`, `version_type`, `resume_text`, `docx_base64`, `docx_filename`, `cover_letter_text`, `ats_score`, `keyword_gaps_filled`, `simon_audit_passed`, `audit_log`, `tailor_round`, `needs_manual_review`, `created_at`

### Application
Fields: `user_id`, `job_listing_id`, `resume_version_id`, `screening_answers`, `cover_letter_text`, `fill_summary`, `screenshot_url`, `status`, `submitted_at`, `created_at`

### ApplicationEvent
Fields: `user_id`, `job_listing_id`, `resume_version_id`, `event_type` (enum: applied/manual_required/application_error/submitted/rejected), `ats_type`, `notes`, `created_at`

### AutofillVault
Structure: `{ personal: { full_name, email, phone, location }, ats_profile: { linkedin, portfolio, github, work_authorization, sponsorship_needed, salary_expectation, remote_preference, notice_period, willing_to_travel, clearance_level }, work_history, education, qa_snippets }`

---

## ReviewQueue UI — Required Connections

### State variables that must exist
| Variable | Purpose |
|----------|---------|
| `listings` | Array of JobListing records |
| `fillingIds` (Set) | Tracks in-progress `fillApplication` calls |
| `fillResults` | Map of `job_listing_id → fillApplication response` |
| `autofillModal` | `{ open, listingId, packet }` for the autofill packet modal |

### Status display config — must include all Phase 3 statuses
```javascript
tailoring:          { label: "Tailoring…",         icon: Loader2 }   // animated
pending_review:     { label: "Ready for Review",    icon: CheckCircle }
needs_attention:    { label: "Needs Attention",     icon: AlertTriangle }
applied:            { label: "Applied",             icon: CheckCircle }
manual_required:    { label: "Manual Required",     icon: ExternalLink }
application_error:  { label: "Application Error",   icon: XCircle }
```

### AttentionBanner — must read `flagged_reason`
```javascript
{listing.flagged_reason && (
  <AttentionBanner reason={listing.flagged_reason} />
)}
```

### handleFillApplication — must update local listings state
```javascript
if (result.status) {
  setListings(prev => prev.map(l =>
    l.id === listingId ? { ...l, status: result.status } : l
  ));
}
```

---

## Quick Audit Checklist

Run through each item and mark ✅ or ❌:

### orchestrateTailoring
- [ ] `status: 'tailoring'` interim update does NOT exist anywhere in the function
- [ ] `flaggedReasonParts` array is built from `audit.meta_issues`, `audit.ghost_strings`, and `atsScore < 60`
- [ ] `flagged_reason` is spread into the final `JobListing.update()` call
- [ ] `ResumeVersion.create()` includes `cover_letter_text` field
- [ ] Function never writes to `Application` or `ApplicationEvent`

### fillApplication
- [ ] `const Application = base44.asServiceRole.entities.Application` is declared (5th entity, not 4)
- [ ] After `JobListing.update()`, an `Application.filter({ job_listing_id, user_id })` is called
- [ ] `Application.create()` or `Application.update()` is called with `cover_letter_text` and `fill_summary`
- [ ] `docx_base64` is NOT included in the final `Response.json()` return
- [ ] `cover_letter` IS included separately in the final `Response.json()` return

### ReviewQueue UI
- [ ] `tailoring` statusConfig entry uses `Loader2` icon (not a static icon)
- [ ] `applied`, `manual_required`, `application_error` entries exist in statusConfig
- [ ] `handleFillApplication` calls `base44.functions.invoke("fillApplication", ...)`
- [ ] `handleFillApplication` updates `listings` state with `result.status`
- [ ] Autofill packet modal exists with per-field clipboard copy buttons
- [ ] `AttentionBanner` is rendered when `listing.flagged_reason` is truthy

---

## Known Issues (last audit 2026-03-19, fixes applied same day)

### Function Deployment Gaps
These are fixed in GitHub source but must be re-pasted into Base44 UI:

| # | Function | Issue | Source status |
|---|----------|-------|--------------|
| 1 | `orchestrateTailoring` | Interim `status: 'tailoring'` update still in deployed version | ✅ Removed in source |
| 2 | `orchestrateTailoring` | `flagged_reason` block missing from deployed version | ✅ Present in source |
| 3 | `orchestrateTailoring` | Resume fallback chain only uses `content ?? resume_text` | ✅ Fixed — now uses full 4-field chain |
| 4 | `fillApplication` | `Application` entity not declared in deployed version (only 4 entities) | ✅ Present in source |
| 5 | `fillApplication` | No `Application.create/update` block in deployed version | ✅ Present in source |

Source: `main` branch, commit `b652af0+` — paste `functions/orchestrateTailoring.ts` and `functions/fillApplication.ts` into Base44 UI.

---

### Base44 Entity Schema Gaps
These must be fixed in the Base44 entity editor (not just the local JSON reference files):

#### JobListing entity — add missing fields
Go to **Base44 → Data → JobListing → Edit Schema** and add:
```
flagged_reason   String (optional/nullable)
applied_at       DateTime (optional/nullable)
```
Update the `status` field enum to include:
```
manual_required, application_error
```
Mark `tailoring` as deprecated (keep in enum to avoid breaking existing records but do not write it from any function).

#### Application entity — add missing field
Go to **Base44 → Data → Application → Edit Schema** and add:
```
cover_letter_text   String (optional)
```
This field is required for ReviewQueue to display the cover letter in the application detail panel.

#### ApplicationEvent entity — update event_type enum
Go to **Base44 → Data → ApplicationEvent → Edit Schema** and update the `event_type` enum to:
```
applied, manual_required, application_error, submitted, rejected
```
Remove any legacy values that don't match this list (`created`, `fill_started`, `fill_complete`, `flagged`, `approved` — these were from an older design).

---

### Resume text fallback chain (canonical)
All functions that read resume text must use this fallback order:
```typescript
const masterText = masterResume.content
  ?? masterResume.resume_text
  ?? masterResume.parsed_content
  ?? masterResume.optimized_content
  ?? '';
```
