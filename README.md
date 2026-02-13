# Properly Hired

AI-powered career navigation platform built on [Base44](https://base44.app). Combines dual AI agents, RAG-backed knowledge retrieval, and O*NET occupational data to help job seekers analyze opportunities, optimize resumes, and prepare for interviews.

## Features

### AI Agents

**Simon** — Recruiting & HR Expert
- Ghost job detection with 100-point scoring system
- Role classification (Executive / Director / Manager / Professional tiers)
- Job description quality evaluation and linguistic DNA extraction
- Company research and industry benchmarking
- Generates structured briefs for Kyle

**Kyle** — CV & Cover Letter Expert
- Resume positioning and optimization strategies
- Cover letter best practices with ARC formula
- Interview preparation with STAR method templates
- Bullet point optimization and achievement framing
- Receives Simon's analysis to tailor application materials

Both agents collaborate via handoff — Simon analyzes the opportunity, Kyle builds the application package.

### Core Pages

| Category | Pages | Description |
|----------|-------|-------------|
| **Job Tools** | Job Analysis, Job Matcher, Job Library, Job Details, Job Summary | Analyze postings, match against resume, track opportunities |
| **Resume** | My Resumes, Resume Builder, Resume Editor, Resume Optimizer, Resume Humanizer, Resume Quality, Resume Review, Resume Templates, Resume Viewer | Full resume lifecycle — build, edit, optimize, review, export |
| **Cover Letters** | Cover Letters, Cover Letter | Generate and manage cover letters |
| **Applications** | Application Tracker, Application Q&A, Autofill Vault | Track applications, prepare portal answers, store reusable responses |
| **Networking** | Networking Hub, Networking Messages, My Network, People Search, Recruiter Connect | Professional networking and outreach tools |
| **Intelligence** | Search Hub, External Resources, O*NET Insights, Activity Insights, Transferable Skills | Cross-platform search, skill analysis, labor market data |
| **Admin** | Agent Workspace, Agent Training, Agent Feedback Insights, Company Research Tool, Collaboration Dashboard, Users, O*NET Import, RAG Monitor | Agent management, data import, knowledge base monitoring |

### RAG System

- **ragIngest** — AI-powered knowledge ingestion with smart chunking, heading-aware splitting, and LLM summarization
- **ragRetrieve** — Multi-signal retrieval with 8 scoring signals, LLM query expansion, and reranking
- **RAG Monitor** — Admin dashboard for ingestion status, test queries, and knowledge base management
- **Knowledge Bases** — Simon: 11 recruiting/HR resources (~6 MB), Kyle: 13 career coaching resources (~2.6 MB)

### External Integrations

| Function | Service | Purpose |
|----------|---------|---------|
| queryONetAPI | O*NET Web Services | Occupational data and skill taxonomies |
| queryBLS | Bureau of Labor Statistics | Salary and employment data |
| queryDOL | Department of Labor | Compliance and labor regulations |
| queryLibraryOfCongress | Library of Congress | HR and talent management research |
| extractDocumentText | mammoth | Parse Word documents for resume import |
| brightdataCollect | Bright Data | Web data collection |
| firecrawlScrape | Firecrawl | Web scraping |
| githubQuery | GitHub API | Repository queries |
| notionSync | Notion API | Content synchronization |

## Project Structure

```
properly-hired/
├── src/
│   ├── pages/                  # 45 page components
│   ├── components/
│   │   ├── agents/             # AgentChat, handoff, prompts
│   │   ├── builder/            # CV wizard, voice capture, Q&A
│   │   ├── rag/                # RAG monitor panels
│   │   ├── ui/                 # 49 Radix-based UI components
│   │   └── utils/              # Access control, telemetry, device detection
│   ├── context/                # App context provider
│   ├── api/                    # Base44 client, AI integrations, job aggregator
│   ├── lib/                    # O*NET schemas, debug tools, query client
│   └── Layout.jsx              # Sidebar navigation, theming
├── functions/                  # 17 Deno serverless functions
├── agents/
│   ├── simon/                  # Simon base + enhanced Python agents
│   ├── kyle/                   # Kyle base + enhanced Python agents
│   ├── simon.jsonc             # Base44 agent config (Simon)
│   ├── kyle.jsonc              # Base44 agent config (Kyle)
│   ├── local_rag.py            # Local file-based RAG
│   └── rag_client.py           # RAG client with fallback
├── knowledge/
│   ├── simon/                  # 11 recruiting/HR knowledge files
│   └── kyle/                   # 13 CV/cover letter knowledge files
├── vite.config.js              # Vite + Base44 plugin
└── package.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ONET_API_KEY` | For O*NET features | O*NET Web Services API key |
| `KYLE_OUTPUT_DIR` | Optional | Override Kyle's CV output directory |
| `KYLE_MASTER_CV_PATH` | Optional | Override master CV file path |
| `RAG_INTEGRATION_PATH` | Optional | Override external RAG integration path |

## Tech Stack

- **Frontend:** React 18, React Router 7, Vite, Tailwind CSS, Radix UI, Framer Motion
- **Backend:** Base44 platform, Deno serverless functions
- **AI/RAG:** Base44 LLM integration, local keyword RAG, multi-signal retrieval
- **Agents:** Python (simon/kyle with enhanced variants), Base44 agent configs (.jsonc)
- **Data:** O*NET occupational database, BLS employment data, curated knowledge bases

## License

Proprietary
