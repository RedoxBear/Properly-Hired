# Integration Architecture & Flow Diagrams

**Visual guide to understanding the Simon & Kyle integration**

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Prague-Day Application                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend                             │   │
│  │                                                                │   │
│  │  src/pages/              src/components/                     │   │
│  │  ├── JobAnalysis.jsx     ├── AIIntegrationExamples.jsx      │   │
│  │  ├── ResumeOptimizer.jsx │   ├── GhostJobChecker             │   │
│  │  └── ...                 │   ├── JobAnalysisPanel            │   │
│  │                          │   ├── ResumeOptimizerPanel        │   │
│  │                          │   └── CompleteWorkflowPanel       │   │
│  │                                                                │   │
│  │  src/api/aiIntegrations.js                                  │   │
│  │  ├── AI.analyzeJob()         ← Simon Functions              │   │
│  │  ├── AI.checkGhostJob()                                      │   │
│  │  ├── AI.classifyRole()                                       │   │
│  │  ├── AI.optimizeResume()     ← Kyle Functions               │   │
│  │  ├── AI.prepareInterview()                                  │   │
│  │  ├── AI.getCVBestPractices()                                │   │
│  │  ├── AI.getCoverLetterBestPractices()                       │   │
│  │  └── AI.analyzeAndOptimize() ← Complete Workflow            │   │
│  │                                                                │   │
│  │  Performance Monitoring:                                     │   │
│  │  • Function duration tracking                                │   │
│  │  • Automatic caching (role, ghost scores)                    │   │
│  │  • Error handling and logging                                │   │
│  │                                                                │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                           │ HTTP/REST API Calls                      │
│                           ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Base44 Platform Integration                     │   │
│  │                                                                │   │
│  │  base44.integrations.Custom.JobAnalysis()                   │   │
│  │  base44.integrations.Custom.ResumeOptimizer()               │   │
│  │                                                                │   │
│  └────────────────────────┬──────────────────┬──────────────────┘   │
│                           │                  │                       │
│         ┌─────────────────▼─┐         ┌──────▼────────────────┐     │
│         │   Simon Agent     │         │   Kyle Agent          │     │
│         │  (JobAnalysis)    │         │ (ResumeOptimizer)     │     │
│         │                   │         │                       │     │
│         │ Processing:       │         │ Processing:           │     │
│         │ • Analysis        │         │ • Optimization        │     │
│         │ • Ghost Detection │         │ • Interview Prep      │     │
│         │ • Role Classify   │         │ • CV Strategy         │     │
│         │ • Quality Check   │         │ • Cover Letter        │     │
│         │ • Recommendation  │         │ • Positioning         │     │
│         │                   │         │                       │     │
│         └────────┬──────────┘         └──────┬────────────────┘     │
│                  │                           │                       │
│         ┌────────▼──────────┐         ┌──────▼────────────────┐     │
│         │  Simon Knowledge  │         │  Kyle Knowledge       │     │
│         │   Base (6 files)  │         │   Base (7 files)      │     │
│         │                   │         │                       │     │
│         │ • Ghost Signals   │         │ • CV Best Practices   │     │
│         │ • Role Classify   │         │ • Cover Letter        │     │
│         │ • Company Research│         │ • STAR Method         │     │
│         │ • JD Quality      │         │ • Interview Prep      │     │
│         │ • Application     │         │ • Positioning         │     │
│         │ • Industry        │         │ • Bullet Formulas     │     │
│         │                   │         │ • Application Package │     │
│         └───────────────────┘         └───────────────────────┘     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Simon → Kyle Workflow

```
User Input: Job Description, Company, Title
           ↓
    ┌──────────────────┐
    │  Simon Analyzes  │
    │  Job Opportunity │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │    Simon's Analysis Output:      │
    │  • Role: type, tier, seniority   │
    │  • Quality: score, rating        │
    │  • Ghost Job: score, risk_level  │
    │  • Recommendation: APPLY/SKIP    │
    │  • Confidence: percentage        │
    └────────┬─────────────────────────┘
             │
        Is it worth applying?
        /                    \
       /                      \
    SKIP                     APPLY/MONITOR
     │                          │
     ▼                          ▼
   STOP              ┌────────────────────┐
                     │  Kyle Optimizes    │
                     │  Application       │
                     └────────┬───────────┘
                              │
                              ▼
                    ┌────────────────────────────┐
                    │   Kyle's Optimization:     │
                    │ • Positioning Strategy     │
                    │ • CV Best Practices        │
                    │ • Cover Letter Strategy    │
                    │ • STAR Interview Method    │
                    │ • Interview Questions      │
                    │ • Bullet Point Formulas    │
                    └────────┬───────────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │  Ready to Apply!     │
                    │  Complete Package    │
                    └──────────────────────┘
```

---

## 🗂️ Directory Structure

```
Prague-Day/
│
├── 📖 Documentation (NEW - 6 files)
│   ├── AI_AGENTS_README.md           ← START HERE
│   ├── QUICK_REFERENCE.md            ← Quick lookup
│   ├── INTEGRATION_GUIDE.md           ← Complete guide
│   ├── KNOWLEDGE_BASE_GUIDE.md        ← Knowledge setup
│   ├── DEPLOYMENT_CHECKLIST.md        ← Deployment steps
│   └── INTEGRATION_SUMMARY.md         ← Overview
│
├── 💻 Frontend Code (NEW - 2 files)
│   ├── src/api/
│   │   └── aiIntegrations.js         ← API Helper Module
│   │       ├── Simon Functions       (analyzeJob, checkGhostJob, classifyRole)
│   │       ├── Kyle Functions        (optimizeResume, prepareInterview, etc.)
│   │       ├── Complete Workflow     (analyzeAndOptimize)
│   │       ├── Performance Monitoring
│   │       └── Caching Logic
│   │
│   └── src/components/
│       └── AIIntegrationExamples.jsx ← React Components
│           ├── GhostJobChecker
│           ├── JobAnalysisPanel
│           ├── ResumeOptimizerPanel
│           └── CompleteWorkflowPanel
│
├── 🔌 Integrations (TO BE COPIED)
│   └── integrations/
│       ├── JobAnalysis.py            ← Simon Wrapper
│       ├── ResumeOptimizer.py        ← Kyle Wrapper
│       └── requirements.txt
│
├── 🤖 Agents (TO BE COPIED)
│   └── agents/
│       ├── simon/
│       │   ├── simon.py
│       │   └── simon_enhanced.py
│       ├── kyle/
│       │   ├── kyle.py
│       │   └── kyle_enhanced.py
│       └── rag_client.py
│
├── 🧠 Knowledge Base (TO BE COPIED)
│   └── knowledge/
│       ├── simon/                    ← 22 Knowledge Files
│       │   ├── ghost_job_signals.md
│       │   ├── role_classification.md
│       │   ├── company_research.md
│       │   ├── job_quality_assessment.md
│       │   ├── application_strategy.md
│       │   └── industry_insights.md
│       │
│       └── kyle/                     ← 18 Knowledge Files
│           ├── cv_best_practices.md
│           ├── cover_letter_strategies.md
│           ├── star_method.md
│           ├── interview_preparation.md
│           ├── positioning_strategies.md
│           ├── bullet_point_formulas.md
│           └── application_package.md
│
└── ... (other project files)
```

---

## 📞 API Call Flow

### Simon Full Analysis Flow

```
┌─────────────────────────┐
│ Frontend Component      │
│ (JobAnalysisPanel.jsx)  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ import { AI } from '@/api/aiIntegrations'          │
│ const result = await AI.analyzeJob({                │
│   description: jobDescription,                       │
│   company: company,                                  │
│   title: title                                       │
│ })                                                   │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ aiIntegrations.js                                   │
│ • Performance monitoring (start timer)              │
│ • Error handling wrapper                            │
│ • Call tracking                                      │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Base44 API                                          │
│ base44.integrations.Custom.JobAnalysis({            │
│   action: 'analyze_job_opportunity',               │
│   params: { jd_text, company_name, role_title }    │
│ })                                                   │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Simon Agent (JobAnalysis.py)                        │
│ • Load Simon agent                                  │
│ • Access knowledge base                             │
│ • Analyze job                                       │
│ • Generate recommendation                           │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Return Results                                      │
│ {                                                    │
│   success: true,                                    │
│   data: {                                            │
│     role: {...},                                     │
│     quality: {...},                                 │
│     ghost_job: {...},                               │
│     recommendation: {...}                           │
│   }                                                  │
│ }                                                    │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ aiIntegrations.js                                   │
│ • Stop timer                                        │
│ • Log performance metrics                           │
│ • Handle errors if any                              │
│ • Return result to component                        │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ React Component                                     │
│ • Display results                                   │
│ • Show recommendation card                          │
│ • Highlight ghost score                            │
│ • Display analysis details                         │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 User Journey: Complete Workflow

```
START: User finds a job posting
         │
         ▼
┌────────────────────────┐
│ Paste Job Description  │
│ Select Company         │
│ Enter Role Title       │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Click "Analyze Job" Button            │
│ Simon starts analyzing                │
└────────┬───────────────────────────────┘
         │
    ┌────┴──────────────┐
    │ Simon Processing  │
    │ • Ghost detection │
    │ • Role analysis   │
    │ • Quality check   │
    │ • Decision making │
    └────┬──────────────┘
         │
    ┌────▼─────────────────────┐
    │ Decision Made             │
    └────┬──────┬───────────────┘
    SKIP│      │APPLY/MONITOR
        │      │
        ▼      ▼
    Not Worth  ┌──────────────────────────┐
    Applying   │ Kyle Optimization Starts  │
              │ • Positioning strategy    │
              │ • CV recommendations      │
              │ • Cover letter tips       │
              │ • Interview prep          │
              └────┬─────────────────────┘
                   │
                   ▼
         ┌─────────────────────────┐
         │ Complete Package Ready! │
         │ • Resume optimized      │
         │ • Cover letter tips     │
         │ • Interview questions   │
         │ • STAR templates        │
         └────┬────────────────────┘
              │
              ▼
         Ready to Apply!
         User submits application
         with optimized materials
```

---

## 📊 Integration Components Map

```
FRONTEND LAYER
├── React Pages
│   ├── JobAnalysis.jsx
│   ├── ResumeOptimizer.jsx
│   └── ... (other pages)
│
├── React Components (AIIntegrationExamples.jsx)
│   ├── GhostJobChecker
│   ├── JobAnalysisPanel
│   ├── ResumeOptimizerPanel
│   └── CompleteWorkflowPanel
│
└── API Helper (aiIntegrations.js)
    ├── Simon Functions
    │   ├── analyzeJob()
    │   ├── checkGhostJob()
    │   └── classifyRole()
    │
    ├── Kyle Functions
    │   ├── optimizeResume()
    │   ├── prepareInterview()
    │   ├── getCVBestPractices()
    │   └── getCoverLetterBestPractices()
    │
    ├── Complete Workflow
    │   └── analyzeAndOptimize()
    │
    ├── Performance Monitoring
    │   └── Duration tracking, caching, logging
    │
    └── Error Handling
        └── Custom error classes, recovery


BASE44 PLATFORM LAYER
├── JobAnalysis Integration
│   ├── action: analyze_job_opportunity
│   ├── action: calculate_ghost_job_score
│   └── action: classify_role
│
├── ResumeOptimizer Integration
│   ├── action: optimize_complete_package
│   ├── action: prepare_interview_strategy
│   ├── action: get_cv_best_practices
│   └── action: get_cover_letter_best_practices
│
└── Knowledge Base Indexing
    ├── Simon Knowledge (6 files)
    └── Kyle Knowledge (7 files)


AGENT LAYER
├── Simon Agent (JobAnalysis.py)
│   ├── Knowledge Base Access
│   ├── Analysis Engine
│   └── RAG Client
│
└── Kyle Agent (ResumeOptimizer.py)
    ├── Knowledge Base Access
    ├── Optimization Engine
    └── RAG Client
```

---

## ⚡ Performance Characteristics

```
┌──────────────────────────────────────────┐
│         Performance Metrics               │
├──────────────────────────────────────────┤
│                                          │
│ API Function               Target Time   │
│ ─────────────────────────────────────    │
│ classifyRole()             2 seconds     │
│ checkGhostJob()            3 seconds     │
│ analyzeJob()               10 seconds    │
│ prepareInterview()         5 seconds     │
│ optimizeResume()           8 seconds     │
│ analyzeAndOptimize()       20 seconds    │
│                                          │
├──────────────────────────────────────────┤
│ Optimization Features:                   │
│                                          │
│ ✓ Caching                               │
│   - Role classifications (unlimited)    │
│   - Ghost job scores (unlimited)        │
│                                          │
│ ✓ Performance Monitoring                │
│   - Function duration tracking           │
│   - Warning on slow responses           │
│                                          │
│ ✓ Error Handling                        │
│   - Graceful degradation                │
│   - User-friendly messages              │
│                                          │
│ ✓ Logging                               │
│   - Console logging with tags           │
│   - Performance metrics                 │
│                                          │
└──────────────────────────────────────────┘
```

---

## 📈 Integration Statistics

```
┌─────────────────────────────────────────┐
│        Integration by Numbers            │
├─────────────────────────────────────────┤
│                                         │
│ Documentation:                          │
│ • Files: 6                              │
│ • Total Size: ~78 KB                    │
│ • Sections: 30+                         │
│                                         │
│ Code:                                   │
│ • Files: 2                              │
│ • Total Size: ~30 KB                    │
│ • Functions: 8                          │
│ • Components: 4                         │
│                                         │
│ Agents:                                 │
│ • Total: 2 (Simon, Kyle)                │
│ • Version: 2.1.0 (both)                │
│                                         │
│ Knowledge Base:                         │
│ • Files: 13 (6 + 7)                    │
│ • Simon: 6 knowledge files             │
│ • Kyle: 7 knowledge files              │
│                                         │
│ API Functions:                          │
│ • Simon: 3 functions                   │
│ • Kyle: 4 functions                    │
│ • Workflow: 1 function                 │
│ • Total: 8 functions                   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
LOCAL DEVELOPMENT
├── integration Files (manual copy)
├── Agent Code (manual copy)
└── Knowledge Base (manual copy)
         │
         ├── Path Updates
         └── Testing
                │
                ▼
GITHUB REPOSITORY
├── integrations/ → Python wrappers
├── agents/ → Agent code
└── knowledge/ → Knowledge bases
         │
         ├─ Webhook Trigger
         │
         ▼
BASE44 PLATFORM
├── Sync from GitHub
├── Deploy Integrations
├── Index Knowledge Base
└── Activate APIs
         │
         ▼
PRODUCTION
└── Live API Endpoints
    ├── JobAnalysis
    └── ResumeOptimizer
```

---

**Version 2.1.0 | January 29, 2026**

These diagrams help visualize how Simon and Kyle integrate with Prague-Day. For more details, see the documentation files.
