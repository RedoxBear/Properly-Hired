# Simon - Recruiting & HR Expert

**Version:** 2.1.0
**Specialization:** Recruiting, Talent Acquisition & HR Strategy
**Knowledge Domain:** H02 - Recruiting

---

## Overview

Simon is an AI agent specialized in recruiting, talent acquisition, and HR best practices. With deep expertise in candidate assessment, job market analysis, and ghost-job detection, Simon helps job seekers evaluate opportunities and provides strategic guidance for career decisions.

### Core Expertise

- **Recruiting Best Practices** - Sourcing, screening, assessment, hiring strategies
- **Candidate Assessment** - Evaluation criteria, competency frameworks, fit analysis
- **Job Market Intelligence** - Ghost-job detection, company research, market trends
- **Interview Frameworks** - Question design, behavioral assessment, STAR method
- **Role Classification** - Enhanced tier detection (IC, Manager, Director, VP, C-Suite)
- **Strategic Recommendations** - Opportunity scoring, priority ranking, brief to Kyle

### Knowledge Base

Simon draws from 22 curated documents in the H02 - Recruiting domain:
- Recruiting best practices and methodologies
- Talent acquisition strategies
- Candidate assessment frameworks
- Interview techniques and question banks
- Hiring strategies and processes
- Recruiting metrics and analytics
- Sourcing strategies and channels
- Candidate experience optimization
- Employer branding
- HR technology and tools

---

## Key Features

### 1. Ghost-Job Detection

**Calculate Ghost-Job Score** (Enhanced in v2.1.0)
```python
simon.calculate_ghost_job_score(
    jd_text="Job description text...",
    company_name="Sunbit Inc.",
    role_title="Senior HR Manager",
    posting_date="2024-01-15"  # Optional
)
```

Comprehensive ghost-job analysis with **100-point scoring system**:

**Scoring Breakdown:**
- **JD Quality (30 points)**: Structure, completeness, professionalism
- **Vagueness Indicators (20 points)**: Generic language, missing specifics
- **Missing Critical Info (30 points)**: Compensation, team info, reporting structure
- **Generic Language (10 points)**: Copy-paste phrases, template indicators
- **Company Stability (10 points)**: Online presence, recent news

**Risk Levels:**
- **0-20**: LOW - Likely legitimate
- **21-40**: MONITOR - Minor concerns
- **41-60**: MEDIUM - Significant red flags
- **61-80**: HIGH - Likely ghost job
- **81-100**: VERY HIGH - Almost certainly fake

**Returns:**
```python
{
    'ghost_job_score': 35,
    'risk_level': 'MONITOR',
    'recommendation': 'MONITOR - Minor concerns, likely legitimate',
    'indicators': [
        'Missing compensation information',
        'No team size mentioned'
    ],
    'positive_signals': [
        'Detailed JD length (500+ words)',
        'Specific role requirements',
        'Clear reporting structure'
    ],
    'company_research_notes': 'Company appears legitimate...'
}
```

### 2. Enhanced Role Classification

**Classify Role Level** (Enhanced in v2.1.0)
```python
simon._classify_role_level("Senior HR Manager")
```

**Enhanced Detection:**
- ✅ **Word Boundary Matching** - Prevents false positives (e.g., "director" in "directorate")
- ✅ **Deputy Detection** - Identifies deputy/associate/assistant roles
- ✅ **Compliance Detection** - Flags compliance-focused positions
- ✅ **Tier Classification** - 9 distinct tiers from IC to C-Suite

**Tier Levels:**
1. **Individual Contributor** - Analyst, Specialist, Coordinator
2. **Senior Individual Contributor** - Senior Analyst, Lead Specialist
3. **Manager** - Manager, Team Lead
4. **Senior Manager** - Senior Manager, Associate Director
5. **Director** - Director, Head of
6. **Senior Director** - Senior Director, Executive Director
7. **VP** - Vice President, SVP
8. **C-Suite** - CXO, Chief Officer
9. **Compliance** - Compliance Officer, Chief Compliance Officer

**Returns:**
```python
{
    'role_type': 'Manager',
    'tier': 'Senior Manager',
    'seniority_level': 'senior manager',
    'is_deputy': False,
    'is_compliance': False,
    'confidence': 'HIGH'
}
```

### 3. Job Description Analysis

**Comprehensive JD Analysis**
```python
simon.analyze_job_description_comprehensive(
    jd_text="Job description...",
    company_name="Sunbit Inc.",
    role_title="Senior HR Manager"
)
```

Multi-faceted analysis including:
- **Role Classification** - Type, tier, seniority, flags
- **JD Quality Assessment** - Score (0-100), rating, strengths, issues
- **Recruiting Insights** - Best practices, assessment criteria
- **Sourcing Strategy** - Channels, methods, timeline
- **Brief for Recruiter** - Actionable guidance

**JD Quality Scoring:**
- **90-100**: Excellent - Comprehensive, professional
- **75-89**: Good - Solid with minor improvements needed
- **60-74**: Fair - Adequate but missing key elements
- **Below 60**: Poor - Significant issues

### 4. Brief to Kyle (Complete Workflow)

**Create Brief to Kyle** (New in v2.1.0)
```python
simon.create_brief_to_kyle(
    jd_text="Job description...",
    company_name="Sunbit Inc.",
    role_title="Senior HR Manager",
    candidate_background="HR professional with 8+ years...",  # Optional
    posting_date="2024-01-15"  # Optional
)
```

**Complete opportunity analysis package for Kyle:**

```python
{
    'brief_metadata': {
        'created_at': '2024-01-28T14:30:00',
        'simon_version': '2.1.0',
        'role_title': 'Senior HR Manager',
        'company_name': 'Sunbit Inc.'
    },
    'role_classification': {
        'role_type': 'Manager',
        'tier': 'Senior Manager',
        'seniority_level': 'senior manager',
        'is_deputy': False,
        'is_compliance': False
    },
    'jd_quality_assessment': {
        'quality_score': 85,
        'quality_rating': 'Good',
        'strengths': [
            'Clear responsibilities',
            'Mentions compensation range',
            'Specific qualifications'
        ],
        'issues': [
            'Could include more team details',
            'Missing company culture info'
        ]
    },
    'ghost_job_analysis': {
        'ghost_job_score': 20,
        'risk_level': 'LOW',
        'recommendation': 'LOW - Likely legitimate',
        'indicators': ['Minor: No team size mentioned'],
        'positive_signals': [
            'Detailed JD',
            'Compensation included',
            'Specific requirements'
        ]
    },
    'overall_recommendation': {
        'decision': 'PURSUE',  # or STRONGLY PURSUE, CONSIDER, SKIP, DO NOT PURSUE
        'priority': 'HIGH',     # or MEDIUM, LOW
        'reasoning': 'High-quality opportunity with low ghost-job risk...',
        'confidence': 'HIGH'
    },
    'strategy_for_kyle': {
        'approach': 'Management positioning - balance leadership and execution',
        'tone_recommendation': 'Professional and results-oriented',
        'cv_emphasis': [
            'Team leadership experience',
            'Process improvement achievements',
            'Cross-functional collaboration'
        ],
        'cover_letter_emphasis': [
            'Alignment with role requirements',
            'Relevant industry experience',
            'Leadership philosophy'
        ],
        'warnings': [
            'Watch for: missing team details may indicate unclear structure'
        ]
    },
    'company_research': {
        'company_overview': 'Based on search...',
        'recent_news': [...],
        'industry_context': '...',
        'hiring_patterns': '...'
    },
    'recruiting_insights': {
        'assessment_criteria': [...],
        'likely_interview_focus': [...],
        'red_flags_to_watch': [...]
    }
}
```

**Decision Levels:**
- **STRONGLY PURSUE** - Excellent opportunity, high priority
- **PURSUE** - Good opportunity, worth pursuing
- **CONSIDER** - Acceptable, but evaluate carefully
- **SKIP** - Not recommended, low quality/high risk
- **DO NOT PURSUE** - Definite ghost job or major red flags

### 5. Company Research

**Research Company Online**
```python
simon.research_company_online(
    company_name="Sunbit Inc.",
    focus_areas=['recent_news', 'company_culture', 'hiring_trends']
)
```

Uses injected search tool (if available) to research:
- Company overview and mission
- Recent news and developments
- Industry position and competitors
- Company culture and values
- Hiring patterns and growth
- Employee reviews and sentiment

**Returns:**
```python
{
    'company_name': 'Sunbit Inc.',
    'research_results': {
        'recent_news': [...],
        'company_culture': '...',
        'hiring_trends': '...'
    },
    'insights': {
        'stability_score': 'HIGH',
        'growth_indicators': [...],
        'concerns': [...]
    }
}
```

### 6. Recruiting Best Practices

**Get Recruiting Best Practices**
```python
simon.get_recruiting_best_practices(
    role_type="HR Manager",
    experience_level="senior"
)
```

Domain-focused RAG queries for:
- Sourcing strategies
- Screening techniques
- Assessment methods
- Hiring process optimization
- Candidate experience
- Offer negotiation

**Get Interview Question Frameworks**
```python
simon.get_interview_question_frameworks(
    role_type="Manager",
    focus_areas=['leadership', 'decision_making', 'conflict_resolution']
)
```

Behavioral and competency-based questions:
- Categorized by competency
- STAR-method compatible
- Role-specific customization
- Follow-up question suggestions

### 7. Candidate Assessment

**Analyze Candidate Profile**
```python
simon.analyze_candidate_profile(
    candidate_background="8+ years HR experience...",
    target_role="Senior HR Manager"
)
```

Comprehensive fit analysis:
- Strengths and alignment
- Gap analysis
- Development needs
- Positioning recommendations

**Get Assessment Criteria**
```python
simon.get_candidate_assessment_criteria(
    role_type="Manager"
)
```

Returns evaluation frameworks:
- Core competencies
- Must-have qualifications
- Nice-to-have attributes
- Red flags and concerns
- Scoring rubrics

---

## Integration with Kyle

Simon provides strategic analysis that Kyle uses for application optimization:

### Complete Simon → Kyle Workflow

```python
from agents import Simon, Kyle

# Initialize both agents
simon = Simon(llm_provider="claude", search_tool=web_search)
kyle = Kyle(llm_provider="claude")

# Step 1: Simon analyzes opportunity
simon_analysis = simon.create_brief_to_kyle(
    jd_text=job_description,
    company_name="Sunbit Inc.",
    role_title="Senior HR Manager",
    candidate_background=your_background
)

# Step 2: Check Simon's recommendation
print(f"Decision: {simon_analysis['overall_recommendation']['decision']}")
print(f"Priority: {simon_analysis['overall_recommendation']['priority']}")
print(f"Ghost Score: {simon_analysis['ghost_job_analysis']['ghost_job_score']}/100")

if simon_analysis['overall_recommendation']['decision'] in ['PURSUE', 'STRONGLY PURSUE']:

    # Step 3: Kyle analyzes target role
    positioning = kyle.analyze_target_role(
        jd_text=job_description,
        role_title="Senior HR Manager",
        simon_brief=simon_analysis
    )

    # Step 4: Kyle prepares interview strategy
    interview_prep = kyle.prepare_interview_strategy(
        role_title="Senior HR Manager",
        role_type=simon_analysis['role_classification']['role_type'],
        simon_brief=simon_analysis,
        save_to_file=True
    )

    print(f"✅ Application package ready!")
    print(f"Positioning: {positioning['positioning']['statement']}")
    print(f"Interview prep saved: {interview_prep['file_saved']}")

else:
    print(f"⚠️ Not recommended: {simon_analysis['overall_recommendation']['reasoning']}")
```

### What Simon Provides to Kyle

**Strategic Guidance:**
- ✅ Role classification (type, tier, seniority)
- ✅ Quality assessment (JD quality score and rating)
- ✅ Risk analysis (ghost-job score and risk level)
- ✅ Recommendation (decision and priority)
- ✅ Application strategy (approach, tone, emphasis areas)
- ✅ Warnings (red flags and considerations)

**Company Intelligence:**
- ✅ Company research findings
- ✅ Industry context
- ✅ Hiring patterns
- ✅ Stability indicators

**Recruiting Insights:**
- ✅ Assessment criteria the company likely uses
- ✅ Interview focus areas
- ✅ Candidate fit analysis

---

## Method Reference

### Job Analysis Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `calculate_ghost_job_score()` | Ghost-job detection | Score (0-100), risk level, indicators |
| `_classify_role_level()` | Enhanced role classification | Type, tier, seniority, flags |
| `analyze_job_description_comprehensive()` | Complete JD analysis | Classification, quality, insights |
| `create_brief_to_kyle()` | Complete opportunity package | Full analysis + strategy for Kyle |

### Company Research Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `research_company_online()` | Web research via search tool | News, culture, trends, insights |
| `verify_job_posting_authenticity()` | Check if posting is legitimate | Authenticity score, signals |

### Recruiting Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `get_recruiting_best_practices()` | Sourcing, screening, hiring | Best practices, strategies |
| `get_candidate_assessment_criteria()` | Evaluation frameworks | Competencies, qualifications, rubrics |
| `get_interview_question_frameworks()` | Interview questions | Categorized questions, STAR format |
| `analyze_candidate_profile()` | Candidate fit analysis | Strengths, gaps, recommendations |

### HR Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `get_hr_best_practices()` | HR topic guidance | Best practices by topic |
| `get_compensation_benchmarks()` | Salary data | Compensation ranges by role/location |
| `get_employer_branding_strategies()` | Employer brand tactics | Branding strategies by company size |

---

## Ghost-Job Detection Details

### Scoring Methodology (100 Points Total)

**1. JD Quality Assessment (30 points)**
- Length: Is JD too short (<200 words) or suspiciously long?
- Structure: Professional formatting and organization?
- Completeness: All key sections present?
- Specificity: Concrete requirements vs. vague descriptions?

**2. Vagueness Indicators (20 points)**
- Generic phrases: "dynamic environment", "fast-paced"
- Unclear responsibilities: Missing specific duties
- Ambiguous requirements: "Strong communication skills" without context
- Copy-paste language: Template indicators

**3. Missing Critical Information (30 points)**
- Compensation: No salary range or "competitive pay"
- Team information: No team size, structure, or reporting
- Timeline: No start date or hiring urgency
- Contact: Missing recruiter name or company contact
- Company details: Vague company description

**4. Generic Language (10 points)**
- Overuse of buzzwords
- Cookie-cutter job descriptions
- Lack of company-specific details
- Template indicators

**5. Company Stability (10 points)**
- Online presence: Website, LinkedIn, reviews
- Recent news: Hiring freezes, layoffs, financial issues
- Posting patterns: Same role posted repeatedly
- Company age and reputation

### Interpretation Guidelines

**LOW (0-20)**
- ✅ Proceed with confidence
- ✅ Legitimate opportunity
- Minor improvements suggested

**MONITOR (21-40)**
- ⚠️ Proceed with awareness
- ✅ Likely legitimate but watch for red flags
- Some concerning indicators
- Research company before applying

**MEDIUM (41-60)**
- ⚠️ Significant concerns
- 🔍 Research thoroughly before applying
- Multiple red flags present
- Consider reaching out to verify

**HIGH (61-80)**
- 🚫 Likely ghost job
- Multiple major red flags
- Low probability of legitimate hire
- Recommend skip unless verified

**VERY HIGH (81-100)**
- 🚫 Almost certainly fake
- Critical information missing
- Company research shows issues
- Do not pursue

---

## Enhanced Role Classification

### Word Boundary Matching

Simon v2.1.0 uses enhanced pattern matching to prevent false positives:

```python
def has_word(text, word):
    pattern = r'\b' + re.escape(word) + r'\b'
    return bool(re.search(pattern, text))
```

**Prevents:**
- "director" matching in "directorate" ❌
- "cto" matching in "doctor" ❌
- "vp" matching in "svg" ❌

**Correctly identifies:**
- "Chief Technology Officer" → C-Suite ✅
- "VP of Engineering" → VP ✅
- "Senior Director" → Senior Director ✅

### Deputy Detection

Automatically identifies deputy/associate/assistant roles:

```python
deputy_indicators = ['deputy', 'associate', 'assistant to', 'vice']
```

**Examples:**
- "Deputy Director" → `is_deputy: True`
- "Associate VP" → `is_deputy: True`
- "Assistant to CEO" → `is_deputy: True`

### Compliance Detection

Flags compliance-focused positions:

```python
compliance_indicators = ['compliance', 'regulatory', 'audit', 'risk management']
```

**Examples:**
- "Compliance Officer" → `is_compliance: True`
- "Chief Compliance Officer" → `is_compliance: True, tier: C-Suite`
- "Regulatory Affairs Manager" → `is_compliance: True`

---

## Search Tool Integration

Simon can use an injected search tool for company research:

### Injecting Search Tool

```python
def web_search(query: str) -> str:
    """Your web search implementation"""
    # Call your search API
    results = your_search_api(query)
    return results

simon = Simon(llm_provider="claude", search_tool=web_search)
```

### Mock Search (Default)

If no search tool provided, Simon uses a mock:

```python
simon = Simon(llm_provider="claude")
# Uses built-in mock_search for demonstration
```

### Search Usage

Simon uses search for:
- Company research (`research_company_online()`)
- Job posting verification (`verify_job_posting_authenticity()`)
- Industry trends and news
- Hiring pattern analysis

---

## Usage Examples

### Example 1: Quick Ghost-Job Check

```python
from agents import Simon

simon = Simon(llm_provider="claude")

# Quick ghost-job check
result = simon.calculate_ghost_job_score(
    jd_text=job_description,
    company_name="Sunbit Inc.",
    role_title="Senior HR Manager"
)

print(f"Ghost Score: {result['ghost_job_score']}/100")
print(f"Risk Level: {result['risk_level']}")
print(f"Recommendation: {result['recommendation']}")

if result['ghost_job_score'] < 40:
    print("✅ Looks legitimate - proceed with application")
else:
    print(f"⚠️ Red flags detected: {result['indicators']}")
```

### Example 2: Complete Job Analysis

```python
simon = Simon(llm_provider="claude", search_tool=web_search)

# Complete analysis with company research
analysis = simon.create_brief_to_kyle(
    jd_text=job_description,
    company_name="Sunbit Inc.",
    role_title="Senior HR Manager",
    candidate_background="8+ years HR experience in tech industry..."
)

# Review Simon's recommendation
print(f"Decision: {analysis['overall_recommendation']['decision']}")
print(f"Priority: {analysis['overall_recommendation']['priority']}")
print(f"Reasoning: {analysis['overall_recommendation']['reasoning']}")

# Check role classification
role = analysis['role_classification']
print(f"\nRole Type: {role['role_type']}")
print(f"Tier: {role['tier']}")
print(f"Deputy Role: {role['is_deputy']}")

# Review ghost-job analysis
ghost = analysis['ghost_job_analysis']
print(f"\nGhost Score: {ghost['ghost_job_score']}/100")
print(f"Risk: {ghost['risk_level']}")
print(f"Red Flags: {ghost['indicators']}")
print(f"Positive Signals: {ghost['positive_signals']}")

# Get Kyle's strategy
strategy = analysis['strategy_for_kyle']
print(f"\nCV Emphasis: {strategy['cv_emphasis']}")
print(f"CL Emphasis: {strategy['cover_letter_emphasis']}")
print(f"Tone: {strategy['tone_recommendation']}")
```

### Example 3: Role Classification

```python
simon = Simon(llm_provider="claude")

# Test various role titles
roles = [
    "Senior HR Manager",
    "Deputy Director of Operations",
    "Chief Compliance Officer",
    "VP of Engineering",
    "Associate Director"
]

for role_title in roles:
    classification = simon._classify_role_level(role_title)
    print(f"\n{role_title}:")
    print(f"  Type: {classification['role_type']}")
    print(f"  Tier: {classification['tier']}")
    print(f"  Deputy: {classification['is_deputy']}")
    print(f"  Compliance: {classification['is_compliance']}")
```

### Example 4: Recruiting Insights

```python
simon = Simon(llm_provider="claude")

# Get recruiting best practices
practices = simon.get_recruiting_best_practices(
    role_type="Manager",
    experience_level="senior"
)

print("Best Practices:", practices['answer'])

# Get assessment criteria
criteria = simon.get_candidate_assessment_criteria(
    role_type="Manager"
)

print("\nAssessment Criteria:", criteria['competencies'])

# Get interview questions
questions = simon.get_interview_question_frameworks(
    role_type="Manager",
    focus_areas=['leadership', 'problem_solving']
)

print("\nInterview Questions:", questions['questions'])
```

---

## Configuration

### LLM Provider Options

Simon supports multiple LLM providers:
- `claude` (default, recommended)
- `openai`
- `gemini`
- `ollama` (local)

```python
simon = Simon(llm_provider="claude", search_tool=web_search)
```

### RAG (Knowledge Base) Setup

Simon requires RAG access for full recruiting expertise:

```bash
# Initialize knowledge base
cd /mnt/f/Projects/AI_Projects/rag-system
python ingest.py

# Verify RAG is ready
python -c "from agents.rag_client import RAGClient; print(RAGClient().is_ready())"
```

---

## Best Practices

### 1. Always Run Ghost-Job Detection

Before investing time in an application, check ghost-job score:

```python
ghost_check = simon.calculate_ghost_job_score(
    jd_text=job_description,
    company_name=company,
    role_title=role
)

if ghost_check['ghost_job_score'] > 60:
    print("⚠️ High ghost-job risk - skip this opportunity")
    exit()
```

### 2. Use Complete Brief to Kyle Workflow

For best results, use `create_brief_to_kyle()` instead of individual methods:

```python
# ✅ Good - Complete analysis
brief = simon.create_brief_to_kyle(...)

# ⚠️ Less optimal - Individual methods
classification = simon._classify_role_level(...)
ghost_score = simon.calculate_ghost_job_score(...)
# ... manual assembly
```

### 3. Provide Candidate Background

When available, include candidate background for personalized insights:

```python
brief = simon.create_brief_to_kyle(
    jd_text=job_description,
    company_name="Sunbit Inc.",
    role_title="Senior HR Manager",
    candidate_background="8+ years HR experience..."  # Helps with fit analysis
)
```

### 4. Use Search Tool for Company Research

Inject a real search tool for better company research:

```python
def my_search(query: str) -> str:
    # Your search implementation
    return search_results

simon = Simon(llm_provider="claude", search_tool=my_search)
```

### 5. Review All Sections of Brief

Simon's brief contains valuable insights - review all sections:
- Role classification (understand seniority and expectations)
- Quality assessment (JD red flags)
- Ghost-job analysis (risk indicators)
- Recommendation (overall guidance)
- Strategy (how to approach)
- Company research (context and intelligence)

---

## Version History

### v2.1.0 (Current)
- ✅ Enhanced ghost-job detection (100-point scoring system)
- ✅ Enhanced role classification (word boundary matching, deputy detection)
- ✅ Added `create_brief_to_kyle()` - Complete opportunity analysis
- ✅ Compliance role detection
- ✅ 9-tier classification system
- ✅ Improved company research integration
- ✅ Strategic recommendations (PURSUE/SKIP/etc.)

### v2.0.0
- ✅ Domain-focused RAG queries (H02 - Recruiting)
- ✅ Basic ghost-job detection
- ✅ Company research capabilities
- ✅ Recruiting best practices methods
- ✅ Candidate assessment frameworks
- ✅ Interview question generation

---

## Dependencies

**Python Modules:**
- `rag_client` - RAG knowledge base access
- Standard library: `os`, `sys`, `pathlib`, `datetime`, `typing`, `re`

**External:**
- RAG system with H02 knowledge base
- LLM provider (Claude, OpenAI, Gemini, or Ollama)
- Optional: Web search tool for company research

---

## Support

For issues or questions:
- Check RAG availability: `simon.rag.is_ready()`
- Verify search tool is injected (if using company research)
- Review method docstrings for parameter details
- Check ghost-job score interpretation guidelines

---

**Simon v2.1.0 - Your Recruiting & HR Expert**
*Making informed career decisions with AI-powered job market intelligence*
