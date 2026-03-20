# Properly-Hired — System Architecture

## Three-Tier Structure

```
TIER 1: React Frontend (src/)
  └── 45 JSX page components
  └── 49 Radix UI components (src/components/ui/)
  └── Agent chat components (src/components/agents/)
  └── Base44 SDK calls for all data

TIER 2: Deno Serverless Functions (functions/)
  └── 17 existing functions
  └── External API calls live here (O*NET, BLS, job boards)
  └── Heavy processing (file parsing, batch jobs)

TIER 3: Python Agents (agents/)
  └── simon/ — base + enhanced variants
  └── kyle/ — base + enhanced variants
  └── local_rag.py — file-based RAG fallback
  └── rag_client.py — RAG client with fallback
  └── Configured via simon.jsonc and kyle.jsonc
```

## Agent Architecture

### Simon — Recruiting & HR Expert
- Ghost job detection (100-point scoring system)
- Role classification (Executive / Director / Manager / Professional)
- JD quality evaluation and linguistic DNA extraction
- Company research and benchmarking
- Match scoring for job discovery
- Generates structured briefs passed to Kyle
- Config: agents/simon.jsonc
- Knowledge: knowledge/simon/ (11 files, ~6MB)

### Kyle — CV & Cover Letter Expert
- Resume positioning and optimization
- Cover letter generation (ARC formula)
- Interview prep (STAR method templates)
- Bullet point optimization
- Screening question answers
- Receives Simon's brief before working on applications
- Config: agents/kyle.jsonc
- Knowledge: knowledge/kyle/ (13 files, ~2.6MB)

### Simon → Kyle Handoff
Simon analyzes the opportunity first, generates a structured brief,
then Kyle uses that brief to tailor all application materials.
This handoff pattern must be preserved in all new features.

## RAG System (Fragile — Do Not Modify Without Asking)
- ragIngest: smart chunking, heading-aware splitting, LLM summarization
- ragRetrieve: 8 scoring signals, LLM query expansion, reranking
- RAG Monitor: admin dashboard in src/pages/
- Do not modify anything in the RAG pipeline without explicit discussion

## External Integrations (Existing)
| Function | Service | Location |
|----------|---------|----------|
| queryONetAPI | O*NET Web Services | functions/ |
| queryBLS | Bureau of Labor Statistics | functions/ |
| queryDOL | Department of Labor | functions/ |
| brightdataCollect | Bright Data | functions/ or integrations/ |
| firecrawlScrape | Firecrawl | integrations/ |
| notionSync | Notion API | integrations/ |
| githubQuery | GitHub API | integrations/ |

## New Integrations (Autonomous Feature — To Build)
| Function | Service | Location |
|----------|---------|----------|
| discoverJobs | JSearch + Adzuna + USAJobs | functions/discoverJobs.ts |
| fillApplication | Playwright browser automation | functions/fillApplication.ts |

## Key File Locations
```
src/
  pages/              # 45 page components — one .jsx per page
  components/
    agents/           # AgentChat, handoff logic, prompt builders
    builder/          # CV wizard, voice capture
    rag/              # RAG monitor panels
    ui/               # 49 Radix components — use these, don't create new ones
    utils/            # Access control, telemetry
  context/            # App-wide context provider
  api/                # Base44 client, entity imports, AI integration
  lib/                # O*NET schemas, debug tools
  Layout.jsx          # Sidebar nav — add new routes here

functions/            # Deno serverless — 17 existing + new ones here
agents/               # Python agent definitions
knowledge/            # RAG knowledge files — never auto-generate
integrations/         # External service integrations
tools/                # CV builder derived tools
```
