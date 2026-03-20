# Review Queue — UX Specification

## Purpose
The single place where users approve or reject every queued application.
Nothing gets submitted without passing through here.
Design goal: make reviewing fast, informed, and safe.

## Page Layout

### Top Strip — Analytics
- Applications pending review (this week)
- Submitted this week
- Response rate (if user has logged outcomes)
- Average match score of submitted apps

### Filter Bar
- Status tabs: All | Pending Review | Needs Attention | Approved | Submitted
- Match score slider: min 60 default
- Sort: Newest | Highest Match | Company A-Z

### Application Card Structure

```
┌─────────────────────────────────────────────────────────┐
│ [Company Logo] COMPANY NAME          [Match: 87] [PENDING]│
│ Job Title · Location · $120k-$145k · Remote              │
│ Posted 2 days ago · Filled 4 minutes ago                 │
├─────────────────────────────────────────────────────────┤
│ Simon's Summary (3 lines)                                │
│ "Strong match. Role aligns with your Director-level      │
│  background in HR operations. Ghost job risk: Low."      │
├─────────────────────────────────────────────────────────┤
│ [Resume Used ▼]  [Form Fill ▼]  [Screening Answers ▼]   │
│ [Screenshot ▼]   [Cover Letter ▼]                        │
├─────────────────────────────────────────────────────────┤
│ [Approve & Submit]  [Edit First]  [Reject]  [Manual]     │
└─────────────────────────────────────────────────────────┘
```

### Expandable Sections
- **Resume Used**: Shows tailored resume with diff highlights vs master
- **Form Fill**: Every field name + value that was entered, color-coded by source
  (green = from profile, blue = from resume, purple = Kyle-generated)
- **Screening Answers**: All Q&A pairs, fully editable inline before approving
- **Screenshot**: Full-page form screenshot, scrollable
- **Cover Letter**: Kyle's generated cover letter, editable

## Action Behaviors

### Approve & Submit
1. Confirmation modal: "This will open your browser to submit the application to [Company]. Confirm?"
2. On confirm: opens application URL in default browser
3. Browser navigates to the completed form (using saved browser state)
4. User manually clicks Submit in their browser
5. User returns to app and marks as Submitted (or auto-detected if possible)

### Edit First
- Opens inline editing mode on the card
- User can modify any screening answer, cover letter text
- Save changes → card returns to Pending Review
- Approve from there

### Reject
- Confirmation optional (fast reject)
- Optional reason dropdown: Not interested | Bad fit | Already applied | Other
- Card moves to Rejected, stays visible in filtered view

### Flag for Manual
- Removes from automation queue
- Adds to manual reminder list
- Optional note: "Check back after networking event"

## Needs Attention Cards
These appear at the top of the queue, above Pending Review items.
Shown in orange/amber.

Types:
- LOGIN_REQUIRED: "Create account at [Company] first, then return here to complete"
- CAPTCHA_BLOCKED: "Complete CAPTCHA manually at [URL], then approve here"
- LOW_SCORE: "ATS score 61 — review resume match before approving"
- UPLOAD_FAILED: "Resume upload failed — try manual upload at [URL]"

## Mobile View
- Swipe right = quick approve (with confirmation tap)
- Swipe left = quick reject
- Tap card to expand full details
- Push notification: "5 applications ready to review"

## Empty States
- No items: "Simon is scanning for matches. Or add a job manually."
- All reviewed: "You're all caught up."
- Only needs-attention: "A few applications need your input before they can proceed."
