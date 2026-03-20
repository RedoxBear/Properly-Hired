# V5 Pipeline Plan Edit Form

## 1) Scope Controls
- Keep entry point as `ResumeOptimizer`? (yes/no):
- If no, new entry point:
- Keep output target as `JSON + Rendered CV`? (yes/no):
- If no, choose: `Rendered only` / `JSON only`
- Keep Standard fallback as `skip Prompt 2/3`? (yes/no):
- If no, describe fallback behavior:

## 2) Prompt Contracts

### Prompt 1 (Simon)
- Tier labels to use (default: `Standard`, `Senior`):
- Pillar count (default: 4):
- DNA factor count (default: 3):
- Additional required keys in JSON:
- Any banned outputs:

### Prompt 2 (Kyle Mapping)
- Achievements per pillar (default: 3):
- ARC rule strictness (default: metric required in every bullet):
- 0-to-1 prioritization rules:
- Additional constraints:

### Prompt 3 (EDGE)
- Section title format (default: `[Company Name] EDGE`):
- Bullet count (default: 3):
- Must map to JD problem statements? (yes/no):
- Tone policy tied to DNA factors (describe):

### Prompt 4 (Formatter)
- Standard format header (default: `[Role] | [Company] | [Dates]`):
- Senior Page 1 sections:
- Senior Page 2 format (default: `CAREER REFERENCE` list):
- Metadata author (default: `Richard Xiong`):
- Any extra metadata fields:

## 3) Data Model / Persistence
- Store in existing `Resume` fields or separate `ResumeV5Artifact` entity?
- If separate entity, required fields:
- Keep `v5_version` field? (yes/no):
- Any retention/versioning policy:

## 4) Rendering Rules
- Primary renderer file(s) to update:
- Should legacy templates render V5, or use dedicated V5 template?
- Print/export requirements (`txt`/`md`/`json`/`pdf`):
- Any layout constraints (max pages, spacing, ATS-safe rules):

## 5) Validation & Error Policy
- Retry count per stage (default: 1 retry):
- Failure policy for Senior if Prompt 2 fails:
- Failure policy for Senior if Prompt 3 fails:
- Hard-stop conditions:
- Warning copy shown to user:

## 6) Access & Rollout
- Feature flag name (default: `V5_PIPELINE_ENABLED`):
- Initial audience (`admin`/`pro`/`premium`/`all`):
- Tier gating rules:
- Rollout phases and dates:

## 7) Telemetry / Monitoring
- Required events:
- Required payload fields per event:
- Dashboard KPIs:
- Alert thresholds (failure %, malformed JSON %, etc.):

## 8) Test Matrix Changes
- Add/remove unit tests:
- Add/remove integration tests:
- Acceptance criteria updates:

## 9) Open Decisions
- Decision 1:
- Decision 2:
- Decision 3:

## 10) Final Approval Block
- Approve unchanged sections? (yes/no):
- Approved with edits on:
- Target implementation order (1..N):
