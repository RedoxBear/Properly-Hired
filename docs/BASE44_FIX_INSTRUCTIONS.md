# Base44 Fix Instructions — Autonomous Job Pipeline

You are the Base44 AI assistant. Execute every task in this document in order. Do not skip any step. Confirm each change before moving to the next.

---

## TASK 1 — Fix Entity: JobListing

Open the **JobListing** entity schema editor and make the following changes:

### 1a. Add field: `flagged_reason`
- Field name: `flagged_reason`
- Type: `String`
- Required: No (optional)
- Default: empty / null

### 1b. Add field: `applied_at`
- Field name: `applied_at`
- Type: `Date/Time`
- Required: No (optional)
- Default: null

### 1c. Update field: `status` — extend the enum
The `status` field enum must contain ALL of the following values. Add any that are missing:
```
discovered
pending_review
needs_attention
approved
applied
manual_required
application_error
rejected
manual
submitted
```
> Note: `tailoring` should be removed from the enum. It was deprecated — no function writes this value anymore.

---

## TASK 2 — Fix Entity: Application

Open the **Application** entity schema editor and make the following change:

### 2a. Add field: `cover_letter_text`
- Field name: `cover_letter_text`
- Type: `String` (long text / text area)
- Required: No (optional)
- Default: empty

> This field is required so the ReviewQueue page can display the generated cover letter inside the application detail panel.

---

## TASK 3 — Fix Entity: ApplicationEvent

Open the **ApplicationEvent** entity schema editor and make the following change:

### 3a. Update field: `event_type` — replace the enum
The `event_type` field must use exactly these enum values (replace the existing list entirely):
```
applied
manual_required
application_error
submitted
rejected
```
Remove any of these legacy values if present: `created`, `fill_started`, `fill_complete`, `flagged`, `approved`

> These legacy values were from an earlier design. The pipeline only writes: applied, manual_required, application_error. The values submitted and rejected are reserved for future phases.

---

## TASK 4 — Fix Function: orchestrateTailoring

Open the **orchestrateTailoring** function editor. Make the following three changes to the function code:

### 4a. REMOVE — Orphaned interim status update
Find and **delete** this line (it appears shortly after the resume text is loaded):
```typescript
await JobListing.update(job_listing_id, { status: 'tailoring' });
```
> This line causes a race condition. If the function crashes after this line, the listing gets stuck in 'tailoring' forever. The function sets the correct final status at the end instead.

### 4b. FIX — Resume text fallback chain
Find this line:
```typescript
const masterText = (masterResume.content ?? masterResume.resume_text ?? '');
```
Replace it with:
```typescript
const masterText = (masterResume.content ?? masterResume.resume_text ?? masterResume.parsed_content ?? masterResume.optimized_content ?? '');
```
> The Resume entity stores text in different fields depending on how it was created. The 4-field fallback chain ensures the function always finds the text regardless of which field was populated.

### 4c. ADD — flagged_reason block before final JobListing update
Find the final `JobListing.update()` call. It currently looks like this:
```typescript
await JobListing.update(job_listing_id, {
  status: finalStatus,
  simon_summary: simonSummary,
});
```
Replace it with this block:
```typescript
const flaggedReasonParts = [];
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
> The flagged_reason field is displayed in the ReviewQueue AttentionBanner so the user knows exactly why a listing needs attention before applying.

---

## TASK 5 — Fix Function: fillApplication

Open the **fillApplication** function editor. Make the following two changes:

### 5a. ADD — Application entity declaration
Find the block where entities are declared. It currently looks like this:
```typescript
const JobListing       = base44.asServiceRole.entities.JobListing;
const ResumeVersion    = base44.asServiceRole.entities.ResumeVersion;
const AutofillVault    = base44.asServiceRole.entities.AutofillVault;
const ApplicationEvent = base44.asServiceRole.entities.ApplicationEvent;
```
Add one line at the end of that block:
```typescript
const Application      = base44.asServiceRole.entities.Application;
```
> Without this declaration, the Application entity is never written to, meaning cover letter text and fill summary are lost after every submission.

### 5b. ADD — Application create/update block
Find the `JobListing.update()` call that sets the final status:
```typescript
await JobListing.update(job_listing_id, updatePayload).catch(...);
```
Insert the following block **immediately after** that line (before the `return Response.json(...)` call):
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
> This block persists the cover letter and autofill data to the Application entity so ReviewQueue can display it. It uses create-or-update to handle re-submissions cleanly.

---

## Verification

After completing all 5 tasks, confirm the following:

1. **JobListing entity** has fields: `flagged_reason` (string), `applied_at` (datetime). Status enum includes `manual_required` and `application_error`. Does NOT include `tailoring`.

2. **Application entity** has field: `cover_letter_text` (string).

3. **ApplicationEvent entity** `event_type` enum is exactly: `applied`, `manual_required`, `application_error`, `submitted`, `rejected`.

4. **orchestrateTailoring function** does NOT contain `status: 'tailoring'`. Does contain `flaggedReasonParts` array. Resume text line uses the 4-field fallback chain.

5. **fillApplication function** declares `const Application = base44.asServiceRole.entities.Application`. Contains `Application.create(...)` or `Application.update(...)` call after `JobListing.update(...)`.

All 5 checks passing = system is fully wired and ready for Phase 4.
