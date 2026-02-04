# Knowledge Base Integration Guide

## Overview

The Simon and Kyle agents are powered by specialized knowledge bases that contain their expertise. This guide explains how to set up and manage the knowledge base integration.

## Directory Structure

```
knowledge/
├── simon/                          # Simon's Knowledge (Recruiting & HR)
│   ├── *.txt (long-form HR, recruiting, and talent sources)
│   └── *.md  (optional concise playbooks)
│
└── kyle/                           # Kyle's Knowledge (CV & Cover Letters)
    ├── *.txt (long-form resume, interview, and career sources)
    └── *.md  (optional concise playbooks)
```

## Mapping Knowledge to Agents

### Simon's Knowledge Base

Simon loads files from `knowledge/simon/`. The sources can be **long-form `.txt` references** or **concise `.md` playbooks** that cover:

1. **Ghost job signals**  
   - Indicators of ghost/fake postings  
   - Red flags and positive signals  
   - Risk assessment criteria  
   - Industry-specific patterns  

2. **Role classification**  
   - Role type classification (Manager, IC, etc.)  
   - Tier levels (Senior, Mid, Junior)  
   - Deputy role indicators  
   - Compliance role patterns  
   - Seniority level assessment  

3. **Company research**  
   - Company research methodology  
   - Financial health assessment  
   - Leadership structure analysis  
   - Company culture evaluation  
   - Industry position analysis  

4. **Job quality assessment**  
   - Job description quality scoring  
   - Clarity assessment  
   - Red flags identification  
   - Strengths identification  
   - Completeness evaluation  

5. **Application strategy**  
   - When to apply (APPLY decision)  
   - When to monitor (MONITOR decision)  
   - When to skip (SKIP decision)  
   - Priority setting logic  
   - Risk assessment  

6. **Industry insights**  
   - Industry-specific trends  
   - Job market insights  
   - Salary benchmarks  
   - Skill demand patterns  
   - Company-industry analysis  

### Kyle's Knowledge Base

Kyle loads files from `knowledge/kyle/`. The sources can be **long-form `.txt` references** or **concise `.md` playbooks** that cover:

1. **CV best practices**  
   - Resume formatting best practices  
   - Content optimization strategies  
   - Keyword optimization  
   - Achievement highlighting  
   - Professional summary writing  
   - Experience presentation  

2. **Cover letter strategies**  
   - Cover letter structure  
   - Tone and voice guidance  
   - Company research integration  
   - Skills alignment  
   - Achievement storytelling  
   - Closing strategy  

3. **STAR method**  
   - STAR method framework (Situation, Task, Action, Result)  
   - Template examples for different scenarios  
   - Story crafting techniques  
   - Outcome emphasis guidelines  
   - Follow-up question preparation  

4. **Interview preparation**  
   - Interview question categories  
   - Behavioral interview prep  
   - Technical interview prep  
   - Company-specific questions  
   - Answer formulation strategy  
   - Practice methodology  

5. **Positioning strategies**  
   - Role positioning techniques  
   - Skills gap analysis  
   - Strength highlighting  
   - Experience translation  
   - Achievement reframing  
   - Target company alignment  

6. **Bullet point formulas**  
   - Bullet point structure formulas  
   - Action verb usage  
   - Metric incorporation  
   - Impact statement structure  
   - Outcome emphasis patterns  
   - Achievement formats  

7. **Application package**  
   - Complete application strategy  
   - Resume + Cover Letter coordination  
   - Interview readiness checklist  
   - Timeline management  
   - Follow-up strategy  
   - Negotiation preparation  

## Loading Knowledge Base

### Automatic Loading

When Simon or Kyle are initialized, they automatically load their knowledge base:

```python
# JobAnalysis.py (Simon)
from agents.simon import Simon

# Simon automatically loads from knowledge/simon/
simon = Simon(knowledge_base_path='./knowledge/simon')

# ResumeOptimizer.py (Kyle)
from agents.kyle import Kyle

# Kyle automatically loads from knowledge/kyle/
kyle = Kyle(knowledge_base_path='./knowledge/kyle')
```

### Knowledge Base Indexing

Each knowledge file is indexed and available for RAG (Retrieval Augmented Generation):

1. Files are indexed at agent initialization
2. Queries automatically retrieve relevant knowledge
3. Agent responses are grounded in knowledge base
4. Citation information can be returned

## Adding Custom Knowledge

### Step 1: Create Knowledge File

Create a new markdown file in the appropriate agent's knowledge directory:

```markdown
# knowledge/simon/advanced_ghost_job_detection.md

## Advanced Ghost Job Detection

### Remote Position Red Flags

- [ ] No clear reporting structure mentioned
- [ ] Vague team composition details
- [ ] Unrealistic salary range
- [ ] Grammatical errors in description

### Follow-up Signal Checks

- [ ] Company research shows recent layoffs
- [ ] LinkedIn shows high turnover
- [ ] Job description recycles old postings
```

### Step 2: Update Agent Configuration

If using advanced configuration, update the agent's knowledge path:

```python
# Update path if using non-standard location
simon = Simon(knowledge_base_path='./knowledge/simon')

# Or add additional knowledge paths
simon.add_knowledge_source('./knowledge/simon/advanced')
```

### Step 3: Index the Knowledge

Knowledge files are automatically indexed on agent initialization:

```python
# Automatic indexing on init
simon = Simon(knowledge_base_path='./knowledge/simon')

# Or manually trigger indexing
simon.index_knowledge_base()
```

### Step 4: Commit to GitHub

```bash
git add knowledge/
git commit -m "Add advanced ghost job detection knowledge to Simon"
git push origin main
```

### Step 5: Verify in Base44

Knowledge updates are automatically picked up on next deployment:

1. Check Base44 deployment logs
2. Verify new knowledge is indexed
3. Test with queries that use new knowledge

## Knowledge Base Updates

### Updating Existing Knowledge

To update an existing knowledge file:

1. Edit the file directly
2. Maintain the markdown structure
3. Add version information if major update
4. Commit and push to GitHub

```markdown
# knowledge/simon/role_classification.md

## Role Classification
**Last Updated:** January 29, 2026
**Version:** 2.1.0

### Role Types
...
```

### Best Practices

**Structure:**
- Use clear headers (H1, H2, H3)
- Use bullet points for lists
- Include examples
- Add decision trees where relevant

**Content:**
- Keep information current
- Include citations/sources
- Add practical examples
- Include edge cases

**Maintenance:**
- Review quarterly for accuracy
- Update based on user feedback
- Archive outdated information
- Track version history

## Accessing Knowledge in Code

### From Simon

```python
# Simon automatically uses knowledge base
result = simon.analyze_job_opportunity(
    jd_text="...",
    company_name="...",
    role_title="..."
)
# Result includes insights from all knowledge files
```

### From Kyle

```python
# Kyle uses knowledge base for optimization
result = kyle.optimize_complete_package(
    simon_brief=simonAnalysis,
    resume_data=resumeData
)
# Result includes strategies from all knowledge files
```

### Direct Knowledge Queries

```python
# Query knowledge base directly
relevant_knowledge = simon.query_knowledge_base(
    query="ghost job detection red flags"
)

for doc in relevant_knowledge:
    print(f"Source: {doc.source}")
    print(f"Content: {doc.content}")
```

## Knowledge Base Performance

### Optimization Tips

1. **File Size**: Keep files under 50KB
   - Split large topics into multiple files
   - Archive old/deprecated information

2. **Indexing**: Reindex monthly
   ```python
   simon.index_knowledge_base()
   kyle.index_knowledge_base()
   ```

3. **Caching**: Knowledge is cached in Base44
   - Cache invalidation on new deployments
   - Manual cache clear if needed

### Monitoring Knowledge Usage

Track which knowledge files are being used:

```python
# Get knowledge usage stats
simon.get_knowledge_stats()
# Returns: {
#   'ghost_job_signals.md': 245,  # queries
#   'role_classification.md': 189,
#   ...
# }
```

## Troubleshooting Knowledge Base

### Issue: "Knowledge file not found"

**Solutions:**
1. Verify file path: `knowledge/{agent}/filename.md`
2. Check file exists in GitHub repo
3. Verify Base44 deployment completed
4. Check Base44 logs for indexing errors

### Issue: "Outdated knowledge being returned"

**Solutions:**
1. Update knowledge file
2. Commit and push to GitHub
3. Trigger Base44 redeployment
4. Clear agent cache

### Issue: "Knowledge not being used in responses"

**Solutions:**
1. Verify file is properly indexed
2. Check query is specific enough
3. Add more relevant content to knowledge file
4. Test knowledge query directly

## Knowledge Base Content Examples

### Simon - Ghost Job Detection

```markdown
# knowledge/simon/ghost_job_signals.md

## Common Ghost Job Red Flags

### Posting History
- Job posted multiple times over 6+ months
- Nearly identical posting with different title
- Same job posted across many companies

### Description Quality
- Extremely vague role responsibilities
- Generic job description (could apply to any company)
- No mention of team or reporting structure
- Unrealistic expectations for compensation

### Company Indicators
- Company recently went through layoffs
- High turnover on LinkedIn (same role filled 3+ times)
- No recent company news or funding
- Negative Glassdoor reviews about role clarity

### Verification Checklist
- [ ] Google company name + "ghost job"
- [ ] Check LinkedIn for recent hiring
- [ ] Review Glassdoor reviews for role
- [ ] Search job boards for duplicate posting
- [ ] Contact current employees if possible
```

### Kyle - STAR Method

```markdown
# knowledge/kyle/star_method.md

## STAR Interview Method

**STAR = Situation, Task, Action, Result**

### Framework

**Situation:** Describe the context
- When did this happen?
- What was the environment?
- What was the challenge?

**Task:** What was your responsibility?
- What was expected of you?
- What was the goal?
- Why was this important?

**Action:** What specific steps did you take?
- What decisions did you make?
- What was your approach?
- How did you handle obstacles?

**Result:** What was the outcome?
- What was achieved?
- What metrics/impact?
- What did you learn?

### Template Example

**Situation:** "In my previous role as HR Manager at TechCorp, our team of 15 was struggling with..."

**Task:** "I was tasked with improving..."

**Action:** "I took the following steps:
1. Conducted interviews to understand...
2. Implemented new process...
3. Trained team on..."

**Result:** "As a result:
- Improved X by Y%
- Saved company $Z
- Led to promotion"
```

## Version Control

### Knowledge Base Versioning

```bash
# Each major update should be tagged
git tag -a knowledge-v2.1.0 -m "Knowledge base v2.1.0 - Simon & Kyle"

# Track changes
git log --follow knowledge/simon/
git log --follow knowledge/kyle/
```

### Version Updates

When agents are updated, update knowledge version:

```markdown
# knowledge/simon/role_classification.md

**Agent Version:** v2.1.0
**Knowledge Version:** v2.1.0
**Last Updated:** January 29, 2026

### Recent Updates
- Added Deputy role detection patterns
- Enhanced compliance role identification
- Improved tier classification accuracy
```

## Deployment Integration

### Automatic Knowledge Deployment

1. Push knowledge files to GitHub
2. Base44 auto-detects changes
3. Files are re-indexed on next deployment
4. Agents use updated knowledge immediately

### Manual Knowledge Update in Base44

If emergency update needed:

```bash
# Via Base44 CLI
base44 deploy integrations/ --force-reindex

# Or via dashboard:
# 1. Go to Integrations
# 2. Select JobAnalysis/ResumeOptimizer
# 3. Click "Reindex Knowledge"
```

---

## O*NET Data Management (Base44 + Versioned ETL)

If you plan to load O*NET data into Base44, use a **versioned, table-based approach**. This keeps your data auditable and makes updates repeatable.

### Decision Recap (Non‑Negotiables)

- **Runtime data lives in Base44 Data Tables**, not in `/knowledge/oNetData`.  
- **Importer runs browser‑side**, because Base44’s SDK bulk import works best in the client.  

### Recommended Data Setup

1. **Load O*NET into Base44 entities (tables)**  
   - Use the SDK to create/update tables for each O*NET dataset you need.
   - Import data via ETL scripts (CSV → table).

2. **Store ETL scripts + mapping config**  
   - Keep scripts in-repo so updates are traceable.
   - Include a mapping file that lists source files → Base44 tables → column mappings.

3. **Version your O*NET drops**  
   - Add a short version note file (e.g., `onet_version30.1.md`) explaining:
     - Source download date
     - Files imported
     - Tables updated
     - Any transformation rules

### Recommended O*NET Tables to Include

Use the “Individual Files” list from O*NET as your blueprint. In practice, it’s best to treat each item below as its own Base44 table (or table group):

**Core content model**
- Knowledge  
- Skills  
- Abilities  
- Education, Training, and Experience  
- Interests  
- Work Styles  
- Work Values (legacy; no longer updated)  

**Tasks**
- Task Statements  
- Task Ratings  
- Task Categories  
- Emerging Tasks  

**Technology & tools**
- Technology Skills  
- Tools Used (legacy; no longer updated)  
- UNSPSC Reference  

**Work activities**
- Work Activities  
- IWA Reference  
- DWA Reference  
- Tasks to DWAs  
- Abilities to Work Activities  
- Skills to Work Activities  

**Work context**
- Work Context  
- Work Context Categories  
- Abilities to Work Context  
- Skills to Work Context  

**Occupations & titles**
- Occupation Data (titles + descriptions)  
- Alternate Titles  
- Sample of Reported Titles  
- Related Occupations  
- Related Domains  

**Education / job zones**
- Job Zones  
- Job Zone Reference  
- Education, Training, and Experience Categories  

**Data collection & scales**
- Content Model Reference  
- Occupation Level Metadata  
- Level Scale Anchors  
- Scales Reference  
- Survey Booklet Locations  

**Competency frameworks**
- Knowledge Competency Framework (JSON‑LD + Excel)  
- Basic Skills Competency Framework (JSON‑LD + Excel)  
- Cross‑Functional Skills Competency Framework (JSON‑LD + Excel)  
- Abilities Competency Framework (JSON‑LD + Excel)  
- Technology Skills Competency Framework (JSON‑LD + Excel)  
- Work Activities Competency Framework (JSON‑LD + Excel)  

### Example Repository Layout

```
onet/
├── etl/
│   ├── load_onet_skills.py
│   ├── load_onet_tasks.py
│   └── ...
├── mappings/
│   ├── onet_mappings_v30.1.yml
│   └── ...
└── versions/
    ├── onet_version30.1.md
    └── ...
```

### Why this Matters (Business Value)

- **Trust**: You can show exactly where the data came from.  
- **Repeatability**: New O*NET releases are easy to ingest.  
- **Auditability**: Clear version history for compliance and analytics.  
- **Speed**: Faster troubleshooting when fields change or break.  

---

## Admin Importer Requirements (What to Ask Your Site Admin For)

### Admin‑Only Route
- Create a protected page (example: `/admin/import-onet`).  
- Restrict access to **site admins only**. No exceptions.  

### File Uploads
- Allow large CSV uploads (or pre‑split CSV parts).  
- If file size limits exist, **chunking** solves it.  

### Data Tables
- **One Base44 Data Table per CSV** (mirror O*NET “individual files”).  
- Field names must match CSV headers **or** you add a mapping layer.  

---

## Importer UI (Simple, Powerful)

### Required UI Behaviors
- List all datasets (≈40 O*NET CSVs).  
- Each dataset shows:
  - “Choose file”  
  - “Import”  
  - Status (rows imported + success/fail)  
- A global **“Import All”** button runs in safe sequence.  

### Reliability Behaviors (Best Practice)
- **Sequential imports** (no parallel runs).  
- **Chunk support** for big CSVs (25k–50k rows per chunk).  
- **Retries with backoff** for failed uploads.  
- **Idempotency option**:
  - “Truncate then import” (clean reload), or  
  - “Upsert” if supported.  

---

## Import Order (Avoids Broken Joins)

Import reference tables first so later tables have keys you can join on.

**Safe order:**
1. Content Model Reference  
2. Occupation Data  
3. Scales / reference tables (define IDs + meanings)  
4. Large relational tables (Skills, Abilities, Knowledge, Tasks, Work Activities, Tech Skills, Tools, etc.)  
5. Crosswalks / supplemental tables  

---

## Gotchas + Fixes (Executive Summary)

**Gotcha 1: Import order mistakes**  
✅ Fix: Always import reference tables first (see order above).

**Gotcha 2: Large file failures**  
✅ Fix: Chunk large CSVs (e.g., `Abilities__part001.csv`).  

**Gotcha 3: “Imported but unusable” data**  
✅ Fix: Validate with join keys, not vibes.  
Checklist:
- Record counts match your manifest  
- Spot‑check: Occupation codes exist where expected  
- Spot‑check: Element IDs exist where expected  
- Test 1 occupation end‑to‑end (e.g., “Construction Supervisor”)  

**Gotcha 4: Slow runtime queries**  
✅ Fix: Query by keys (SOC, Element ID, Scale ID).  
Avoid “list everything” calls on huge tables.  

---

## Runtime Proof Test (Construction Supervisor)

Your test should prove the app can do this **without the live API**:

1. Search occupations for “Construction Supervisor.”  
2. Resolve to the SOC occupation code.  
3. Fetch related records:
   - Skills (importance/level)  
   - Tasks  
   - Tools / Tech Skills  
   - Work Activities / Work Context  

**Pass condition:** results appear fast and consistently.

---

## O*NET File Schema + Validation Snapshot

Use this as the **ready‑to‑import manifest** when uploading raw CSVs. It captures the column layouts and a size/row sanity check so your admin importer can validate completeness.

### Schema (CSV → Columns)

| CSV File | # Columns | Column Headers |
| --- | --- | --- |
| Abilities.csv | 15 | O*NET-SOC Code, Title, Element ID, Element Name, Scale ID, Scale Name, Data Value, N, Standard Error, Lower CI Bound, Upper CI Bound, Recommend Suppress, Not Relevant, Date, Domain Source |
| Abilities_to_Work_Activities.csv | 4 | Abilities Element ID, Abilities Element Name, Work Activities Element ID, Work Activities Element Name |
| Abilities_to_Work_Context.csv | 4 | Abilities Element ID, Abilities Element Name, Work Context Element ID, Work Context Element Name |
| Alternate_Titles.csv | 5 | O*NET-SOC Code, Title, Alternate Title, Short Title, Source(s) |
| Basic_Interests_to_RIASEC.csv | 4 | Basic Interests Element ID, Basic Interests Element Name, RIASEC Element ID, RIASEC Element Name |
| Content_Model_Reference.csv | 3 | Element ID, Element Name, Description |
| DWA_Reference.csv | 6 | Element ID, Element Name, IWA ID, IWA Title, DWA ID, DWA Title |
| Education_Training_and_Experience.csv | 15 | O*NET-SOC Code, Title, Element ID, Element Name, Scale ID, Scale Name, Category, Data Value, N, Standard Error, Lower CI Bound, Upper CI Bound, Recommend Suppress, Date, Domain Source |
| Education_Training_and_Experience_Categories.csv | 6 | Element ID, Element Name, Scale ID, Scale Name, Category, Category Description |
| Emerging_Tasks.csv | 8 | O*NET-SOC Code, Title, Task, Category, Original Task ID, Original Task, Date, Domain Source |
| IWA_Reference.csv | 4 | Element ID, Element Name, IWA ID, IWA Title |
| Interests.csv | 9 | O*NET-SOC Code, Title, Element ID, Element Name, Scale ID, Scale Name, Data Value, Date, Domain Source |
| Interests_Illustrative_Activities.csv | 4 | Element ID, Element Name, Interest Type, Activity |
| Interests_Illustrative_Occupations.csv | 5 | Element ID, Element Name, Interest Type, O*NET-SOC Code, Title |
| Job_Zone_Reference.csv | 7 | Job Zone, Name, Experience, Education, Job Training, Examples, SVP Range |
| Job_Zones.csv | 5 | O*NET-SOC Code, Title, Job Zone, Date, Domain Source |
| Knowledge.csv | 15 | O*NET-SOC Code, Title, Element ID, Element Name, Scale ID, Scale Name, Data Value, N, Standard Error, Lower CI Bound, Upper CI Bound, Recommend Suppress, Not Relevant, Date, Domain Source |
| Level_Scale_Anchors.csv | 6 | Element ID, Element Name, Scale ID, Scale Name, Anchor Value, Anchor Description |
| Occupation_Data.csv | 3 | O*NET-SOC Code, Title, Description |
| Occupation_Level_Metadata.csv | 7 | O*NET-SOC Code, Title, Item, Response, N, Percent, Date |
| RIASEC_Keywords.csv | 4 | Element ID, Element Name, Keyword, Keyword Type |
| Related_Occupations.csv | 6 | O*NET-SOC Code, Title, Related O*NET-SOC Code, Related Title, Relatedness Tier, Index |
| Sample_of_Reported_Titles.csv | 4 | O*NET-SOC Code, Title, Reported Job Title, Shown in My Next Move |
| Scales_Reference.csv | 4 | Scale ID, Scale Name, Minimum, Maximum |
| Skills.csv | 15 | O*NET-SOC Code, Title, Element ID, Element Name, Scale ID, Scale Name, Data Value, N, Standard Error, Lower CI Bound, Upper CI Bound, Recommend Suppress, Not Relevant, Date, Domain Source |
| Skills_to_Work_Activities.csv | 4 | Skills Element ID, Skills Element Name, Work Activities Element ID, Work Activities Element Name |
| Skills_to_Work_Context.csv | 4 | Skills Element ID, Skills Element Name, Work Context Element ID, Work Context Element Name |
| Survey_Booklet_Locations.csv | 5 | Element ID, Element Name, Survey Item Number, Scale ID, Scale Name |
| Task_Categories.csv | 4 | Scale ID, Scale Name, Category, Category Description |
| Task_Ratings.csv | 15 | O*NET-SOC Code, Title, Task ID, Task, Scale ID, Scale Name, Category, Data Value, N, Standard Error, Lower CI Bound, Upper CI Bound, Recommend Suppress, Date, Domain Source |
| Task_Statements.csv | 8 | O*NET-SOC Code, Title, Task ID, Task, Task Type, Incumbents Responding, Date, Domain Source |
| Tasks_to_DWAs.csv | 8 | O*NET-SOC Code, Title, Task ID, Task, DWA ID, DWA Title, Date, Domain Source |
| Technology_Skills.csv | 7 | O*NET-SOC Code, Title, Example, Commodity Code, Commodity Title, Hot Technology, In Demand |
| Tools_Used.csv | 5 | O*NET-SOC Code, Title, Example, Commodity Code, Commodity Title |
| UNSPSC_Reference.csv | 8 | Commodity Code, Commodity Title, Class Code, Class Title, Family Code, Family Title, Segment Code, Segment Title |
| Work_Activities.csv | 15 | O*NET-SOC Code, Title, Element ID, Element Name, Scale ID, Scale Name, Data Value, N, Standard Error, Lower CI Bound, Upper CI Bound, Recommend Suppress, Not Relevant, Date, Domain Source |
| Work_Context.csv | 16 | O*NET-SOC Code, Title, Element ID, Element Name, Scale ID, Scale Name, Category, Data Value, N, Standard Error, Lower CI Bound, Upper CI Bound, Recommend Suppress, Not Relevant, Date, Domain Source |
| Work_Context_Categories.csv | 6 | Element ID, Element Name, Scale ID, Scale Name, Category, Category Description |
| Work_Styles.csv | 9 | O*NET-SOC Code, Title, Element ID, Element Name, Scale ID, Scale Name, Data Value, Date, Domain Source |
| Work_Values.csv | 9 | O*NET-SOC Code, Title, Element ID, Element Name, Scale ID, Scale Name, Data Value, Date, Domain Source |

### Validation Snapshot (Size + Rows)

| CSV File | Bytes | Approx. Rows |
| --- | --- | --- |
| Abilities.csv | 11809190 | 92976 |
| Abilities_to_Work_Activities.csv | 31460 | 381 |
| Abilities_to_Work_Context.csv | 11797 | 139 |
| Alternate_Titles.csv | 4684892 | 56505 |
| Basic_Interests_to_RIASEC.csv | 2443 | 53 |
| Content_Model_Reference.csv | 92642 | 630 |
| DWA_Reference.csv | 361804 | 2087 |
| Education_Training_and_Experience.csv | 6194208 | 37125 |
| Education_Training_and_Experience_Categories.csv | 5748 | 41 |
| Emerging_Tasks.csv | 52759 | 328 |
| IWA_Reference.csv | 35336 | 332 |
| Interests.csv | 1070316 | 8307 |
| Interests_Illustrative_Activities.csv | 13523 | 188 |
| Interests_Illustrative_Occupations.csv | 13642 | 186 |
| Job_Zone_Reference.csv | 4399 | 5 |
| Job_Zones.csv | 60160 | 923 |
| Knowledge.csv | 7807673 | 59004 |
| Level_Scale_Anchors.csv | 45629 | 483 |
| Occupation_Data.csv | 268030 | 1016 |
| Occupation_Level_Metadata.csv | 3723260 | 32202 |
| RIASEC_Keywords.csv | 2706 | 75 |
| Related_Occupations.csv | 2051148 | 18460 |
| Sample_of_Reported_Titles.csv | 578817 | 7955 |
| Scales_Reference.csv | 919 | 31 |
| Skills.csv | 7891788 | 62580 |
| Skills_to_Work_Activities.csv | 18350 | 232 |
| Skills_to_Work_Context.csv | 7493 | 96 |
| Survey_Booklet_Locations.csv | 13365 | 211 |
| Task_Categories.csv | 446 | 7 |
| Task_Ratings.csv | 37898035 | 161559 |
| Task_Statements.csv | 3446784 | 18796 |
| Tasks_to_DWAs.csv | 5645667 | 23850 |
| Technology_Skills.csv | 3698120 | 32773 |
| Tools_Used.csv | 4080987 | 41662 |
| UNSPSC_Reference.csv | 810601 | 4264 |
| Work_Activities.csv | 11581171 | 73308 |
| Work_Context.csv | 51084523 | 297676 |
| Work_Context_Categories.csv | 30453 | 281 |
| Work_Styles.csv | 4270411 | 37422 |
| Work_Values.csv | 850064 | 7866 |

## Next Steps

1. ✅ Review knowledge base structure
2. ✅ Set up knowledge files
3. ✅ Deploy to GitHub
4. ✅ Verify indexing in Base44
5. 🔄 Test knowledge retrieval
6. 🔄 Add custom knowledge as needed
7. 🔄 Monitor knowledge usage
8. 🔄 Update based on user feedback

---

**Version 2.1.0 | January 29, 2026**
