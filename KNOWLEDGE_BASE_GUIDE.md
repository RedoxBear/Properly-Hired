# Knowledge Base Integration Guide

## Overview

The Simon and Kyle agents are powered by specialized knowledge bases that contain their expertise. This guide explains how to set up and manage the knowledge base integration.

## Directory Structure

```
knowledge/
├── simon/                          # Simon's Knowledge (Recruiting & HR)
│   ├── ghost_job_signals.md
│   ├── role_classification.md
│   ├── company_research.md
│   ├── job_quality_assessment.md
│   ├── application_strategy.md
│   └── industry_insights.md
│
└── kyle/                           # Kyle's Knowledge (CV & Cover Letters)
    ├── cv_best_practices.md
    ├── cover_letter_strategies.md
    ├── star_method.md
    ├── interview_preparation.md
    ├── positioning_strategies.md
    ├── bullet_point_formulas.md
    └── application_package.md
```

## Mapping Knowledge to Agents

### Simon's Knowledge Base

The following knowledge files are loaded by Simon at initialization:

#### 1. **ghost_job_signals.md**
- Indicators of ghost/fake job postings
- Red flags and positive signals
- Risk assessment criteria
- Industry-specific patterns

#### 2. **role_classification.md**
- Role type classification (Manager, IC, etc.)
- Tier levels (Senior, Mid, Junior)
- Deputy role indicators
- Compliance role patterns
- Seniority level assessment

#### 3. **company_research.md**
- Company research methodology
- Financial health assessment
- Leadership structure analysis
- Company culture evaluation
- Industry position analysis

#### 4. **job_quality_assessment.md**
- Job description quality scoring
- Clarity assessment
- Red flags identification
- Strengths identification
- Completeness evaluation

#### 5. **application_strategy.md**
- When to apply (APPLY decision)
- When to monitor (MONITOR decision)
- When to skip (SKIP decision)
- Priority setting logic
- Risk assessment

#### 6. **industry_insights.md**
- Industry-specific trends
- Job market insights
- Salary benchmarks
- Skill demand patterns
- Company-industry analysis

### Kyle's Knowledge Base

The following knowledge files are loaded by Kyle at initialization:

#### 1. **cv_best_practices.md**
- Resume formatting best practices
- Content optimization strategies
- Keyword optimization
- Achievement highlighting
- Professional summary writing
- Experience presentation

#### 2. **cover_letter_strategies.md**
- Cover letter structure
- Tone and voice guidance
- Company research integration
- Skills alignment
- Achievement storytelling
- Closing strategy

#### 3. **star_method.md**
- STAR method framework (Situation, Task, Action, Result)
- Template examples for different scenarios
- Story crafting techniques
- Outcome emphasis guidelines
- Follow-up question preparation

#### 4. **interview_preparation.md**
- Interview question categories
- Behavioral interview prep
- Technical interview prep
- Company-specific questions
- Answer formulation strategy
- Practice methodology

#### 5. **positioning_strategies.md**
- Role positioning techniques
- Skills gap analysis
- Strength highlighting
- Experience translation
- Achievement reframing
- Target company alignment

#### 6. **bullet_point_formulas.md**
- Bullet point structure formulas
- Action verb usage
- Metric incorporation
- Impact statement structure
- Outcome emphasis patterns
- Achievement formats

#### 7. **application_package.md**
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
