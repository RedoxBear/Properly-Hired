# How to Use These Files with Claude Code in VS Code

## What This Package Is
These files are the "brain" for Claude Code when it works on Properly-Hired.
CLAUDE.md at the repo root = Claude Code reads this automatically every session.
agent_docs/ = Claude Code reads these on demand when working on specific areas.

---

## Step 1: Install Claude Code in VS Code

1. Open VS Code
2. Press Ctrl+Shift+X (Windows) or Cmd+Shift+X (Mac)
3. Search: "Claude Code"
4. Install the official extension by Anthropic
5. Click the Spark icon (⚡) that appears in the top-right of the editor
6. Sign in with your Claude account (Pro plan required)

---

## Step 2: Add These Files to Your Repo

In VS Code, with the Properly-Hired folder open:

1. **CLAUDE.md** → drag to repo root (same level as package.json)
2. **Create agent_docs folder** → right-click in Explorer → New Folder → "agent_docs"
3. **All files from agent_docs/** → drag into that folder

Your repo root should look like:
```
Properly-Hired/
├── CLAUDE.md                          ← NEW
├── agent_docs/                        ← NEW FOLDER
│   ├── autonomous-job-search-application-spec.md
│   ├── architecture.md
│   ├── base44-patterns.md
│   ├── browser-automation-guide.md
│   ├── job-discovery-apis.md
│   ├── onet-schema-bug.md
│   └── review-queue-ux.md
├── src/
├── functions/
├── agents/
├── package.json
└── README.md (existing)
```

---

## Step 3: Commit via VS Code Git

1. Open Source Control panel: Ctrl+Shift+G
2. You'll see all new files staged as "Untracked"
3. Click the + next to each file to stage them
4. Type commit message: `feat: add Claude Code configuration and autonomous apply spec`
5. Click the checkmark to commit
6. Click "Sync Changes" (or the cloud icon) to push to GitHub

---

## Step 4: Fix the O*NET Bug First (20 minutes)

Before building anything new, fix the open schema bug:
1. Read agent_docs/onet-schema-bug.md
2. Go to https://app.base44.com → your app → Entities
3. Update the field names per the doc
4. Test with a small O*NET CSV import to confirm 422 errors are gone

---

## Step 5: Start Building with Claude Code

Open the Claude Code panel (Spark icon ⚡ in VS Code).

### Starting Prompt for Phase 1
Paste this exactly:

```
Read CLAUDE.md first, then read agent_docs/autonomous-job-search-application-spec.md.

I want to start Phase 1 of the Autonomous Job Search + Application feature.

Before writing any code:
1. Confirm you understand the Base44 architecture (entities must exist in Base44 admin first)
2. List the 4 entities that need to be created in Base44 admin
3. Show me the exact field definitions for each entity
4. Then show me a plan for the discoverJobs.ts Deno function

Use Plan Mode — show me the plan before touching any files.
```

### After Entities Are Created in Base44 Admin
```
The 4 entities are now created in Base44 admin:
JobListing, ResumeVersion, Application, ApplicationEvent.

Create a new branch: feature/autonomous-job-discovery

Build the discoverJobs.ts function in /functions/ that:
- Queries the JSearch API
- Scores results against user profile using Simon
- Creates JobListing records, skipping duplicates by dedup_hash
- Returns discovery stats

Show plan first.
```

### Building the Review Queue Page
```
Read agent_docs/review-queue-ux.md then build src/pages/ReviewQueue.jsx.

Follow the existing page component patterns in this codebase (JSX, Radix UI, Tailwind).
Use only existing components from src/components/ui/ — don't create new UI components.
Add the route to Layout.jsx under the Applications category.

Show plan first.
```

---

## Day-to-Day Claude Code Workflow

### Before Any Multi-File Task
- Enable Plan Mode: click the mode indicator at the bottom of the Claude Code panel
- Claude shows a full plan → you review → approve before any files change

### When Switching Tasks
- Type: `/clear` — resets context for a clean new task
- Start next session with: "Read CLAUDE.md then [new task]"

### When Context Gets Long (50%+ full)
- Type: `/compact` — compresses conversation history
- Or start fresh with `/clear` + a written handoff

### Reviewing Code Changes
- Claude Code shows inline diffs in VS Code
- Green = additions, Red = removals
- Click Accept or Reject on each change
- Never auto-accept for Base44 entity-related code — review carefully

### Committing After Claude Code Changes
- Ctrl+Shift+G → review what changed → stage → commit → push
- Commit message format: `feat:`, `fix:`, `refactor:` prefix
- Example: `feat: add JobListing entity calls to discoverJobs function`

---

## What Claude Code Can and Cannot Do Here

### CAN do in VS Code
- Write and edit .jsx pages
- Write and edit Deno .ts functions
- Write and edit Python agent files
- Read and analyze existing code
- Create new files in the correct locations
- Run npm commands in the terminal

### CANNOT do (you must do manually)
- Create entities in Base44 Admin (must be done in the browser at base44.com)
- Set environment variables (set in Base44 admin)
- Deploy (Base44 auto-deploys from GitHub — just push)
- Fix CAPTCHA issues in live applications (by design — user does this)

---

## Quick Reference — Key Prompts

| Task | Prompt to use |
|------|--------------|
| Start a session | "Read CLAUDE.md then [task]" |
| New feature | "Read [spec doc] — plan before coding" |
| Fix a bug | "Here's the error: [paste]. Read the relevant code and fix it." |
| Add a page | "Build [PageName].jsx following the pattern in [ExistingPage].jsx" |
| Add a function | "Add a Deno function in functions/ that does [X]. Check base44-patterns.md first." |
| Review what changed | "Summarize what you changed and why" |
