# Kyle - CV & Cover Letter Expert

**Version:** 2.1.0
**Specialization:** Career Documents & Application Materials
**Knowledge Domain:** H01 - CV & Cover Letters

---

## Overview

Kyle is an AI agent specialized in CV optimization, cover letter strategies, and complete application package creation. With deep expertise in career documents and personal branding, Kyle helps job seekers create compelling application materials that stand out.

### Core Expertise

- **CV Best Practices** - Structure, layout, ATS optimization, content strategy
- **Cover Letter Strategies** - Opening techniques, storytelling, compelling narratives
- **Bullet Point Formulas** - ARC method (Action + Result + Context)
- **Personal Branding** - Career positioning, value proposition, professional identity
- **Interview Preparation** - STAR method, question banks, interview strategy
- **Application Packages** - Complete coordinated CV + Cover Letter strategies

### Knowledge Base

Kyle draws from 18 curated documents in the H01 - CV & Cover Letters domain:
- CV best practices and optimization techniques
- Cover letter templates and strategies
- Resume structure and formatting guides
- ATS (Applicant Tracking System) optimization
- Bullet point formulas and achievement framing
- Career narratives and storytelling
- Personal branding strategies
- Interview preparation frameworks

---

## Key Features

### 1. CV Optimization

**Get CV Best Practices**
```python
kyle.get_cv_best_practices(
    role_type="HR Manager",
    experience_level="senior"
)
```
Returns comprehensive CV guidance including:
- Optimal structure and layout
- Section order and prioritization
- Content density and formatting
- ATS optimization strategies
- Industry-specific best practices

**Optimize CV Content**
```python
kyle.optimize_cv_content(
    current_cv_excerpt="Current experience section...",
    target_role="Senior HR Manager"
)
```
Analyzes and improves existing CV content with:
- Structure improvements
- Language enhancement (stronger action verbs)
- Achievement quantification
- Tailoring to target role

**Bullet Point Strategies**
```python
kyle.get_bullet_point_strategies(role_type="Manager")
```
Provides ARC formula guidance:
- **A**ction: Strong action verbs
- **R**esult: Quantified outcomes
- **C**ontext: Scope and impact
- Industry-specific examples and formulas

### 2. Cover Letter Expertise

**Cover Letter Best Practices**
```python
kyle.get_cover_letter_best_practices(
    role_type="Senior HR Manager",
    company_name="Sunbit Inc."
)
```
Returns comprehensive cover letter strategies:
- Structure and format
- Key elements to include
- Tone and style guidance
- Company-specific customization
- Examples and templates

**Opening Strategies**
```python
kyle.get_opening_strategies(
    tone="professional",
    industry="Technology"
)
```
Provides compelling opening techniques:
- Attention-grabbing first lines
- Tone calibration (professional, enthusiastic, creative)
- Industry-appropriate approaches
- Examples for different scenarios

**Storytelling Techniques**
```python
kyle.get_storytelling_techniques(career_stage="mid-career")
```
Guides narrative development:
- Career story frameworks
- Achievement narratives
- Value proposition articulation
- Transition explanations

### 3. Target Role Analysis

**Analyze Target Role** (New in v2.1.0)
```python
kyle.analyze_target_role(
    jd_text="Job description text...",
    role_title="Senior HR Manager",
    simon_brief=simon_analysis  # Optional
)
```
Creates positioning strategy with:
- **Key Themes**: 4-6 critical themes to emphasize
- **Positioning Statement**: How to present yourself for this role
- **Focus Areas**: Specific competencies to highlight
- **Application Approach**: Customized strategy based on role type and seniority

Works standalone or integrates with Simon's job analysis.

### 4. Interview Preparation

**Prepare Interview Strategy** (New in v2.1.0)
```python
kyle.prepare_interview_strategy(
    role_title="Senior HR Manager",
    role_type="Manager",
    simon_brief=simon_analysis,  # Optional
    save_to_file=True
)
```

Comprehensive interview preparation package:

**STAR Method Templates**
- 4-5 pre-built STAR scenarios
- Situation, Task, Action, Result format
- Tailored to role type (IC, Manager, Director, etc.)
- Applicable to multiple question types

**Question Bank**
- Categorized by theme:
  - Leadership & People Management
  - Problem Solving & Decision Making
  - Teamwork & Collaboration
  - Technical/Functional Competencies
  - Cultural Fit & Values
  - Handling Challenges
- 15-30 common interview questions
- Role-specific customization

**Additional Prep Materials**
- Pre-interview checklist (12 items)
- Company research prompts
- Questions to ask interviewer (8-10 strategic questions)
- Preparation timeline

**File Output**
When `save_to_file=True`, creates:
```
{OUTPUT_DIR}/{YYMMDDhhmm} - {company} - {position} - Interview_Prep.txt
```

### 5. Complete Application Package

**Create Application Package Strategy**
```python
kyle.create_application_package_strategy(
    target_analysis={
        'role_title': 'Senior HR Manager',
        'role_type': 'Manager',
        'key_themes': [...],
        'positioning': {...}
    }
)
```
Comprehensive application strategy including:
- Integrated CV + Cover Letter approach
- Key themes and positioning
- Timeline and milestones
- Quality checklist
- Priority actions

---

## Integration with Simon

Kyle works seamlessly with Simon (Recruiting & HR Expert) for complete job opportunity analysis:

### Complete Workflow

```python
# Step 1: Simon analyzes job opportunity
simon_analysis = simon.create_brief_to_kyle(
    jd_text=job_description,
    company_name="Sunbit Inc.",
    role_title="Senior HR Manager"
)

# Step 2: Kyle analyzes target role positioning
positioning = kyle.analyze_target_role(
    jd_text=job_description,
    role_title="Senior HR Manager",
    simon_brief=simon_analysis
)

# Step 3: Kyle prepares interview strategy
interview_prep = kyle.prepare_interview_strategy(
    role_title="Senior HR Manager",
    role_type="Manager",
    simon_brief=simon_analysis,
    save_to_file=True
)

# Step 4: Get complete application package strategy
package_strategy = kyle.create_application_package_strategy(
    target_analysis=positioning
)
```

### Simon's Brief to Kyle

Simon provides Kyle with:
- **Role Classification**: Type, tier, seniority level
- **JD Quality Assessment**: Quality score, strengths, issues
- **Ghost-Job Analysis**: Risk level, red flags, positive signals
- **Overall Recommendation**: PURSUE/SKIP/CONSIDER + priority
- **Strategy for Kyle**:
  - Recommended approach
  - Tone recommendation
  - CV emphasis areas
  - Cover letter emphasis areas
  - Warnings and considerations

Kyle uses this to customize all recommendations.

---

## File Output Management

### Output Directory
```
/mnt/f/Projects/AI_Projects/code/career-coach/data/CVs/
```

### File Naming Convention
```
{YYMMDDhhmm} - {company_name} - {position} - {type}.txt
```

**Examples:**
- `2601281430 - Sunbit Inc - Senior HR Manager - CV.txt`
- `2601281430 - Sunbit Inc - Senior HR Manager - Cover_Letter.txt`
- `2601281430 - Sunbit Inc - Senior HR Manager - Interview_Prep.txt`

### Master CV Protocol

Kyle can reference your master CV for optimization:
```
/mnt/f/Projects/AI_Projects/code/career-coach/data/master_cv.txt
```

When available, Kyle uses master CV to:
- Extract relevant experience
- Identify transferable skills
- Suggest content improvements
- Maintain consistency

---

## Method Reference

### CV Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `get_cv_best_practices()` | CV structure and best practices | Structure, formatting, ATS tips |
| `get_bullet_point_strategies()` | ARC formula and examples | Formulas, action verbs, examples |
| `optimize_cv_content()` | Improve existing CV content | Structure, language, achievement suggestions |

### Cover Letter Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `get_cover_letter_best_practices()` | CL structure and strategies | Elements, tone, examples |
| `get_opening_strategies()` | Compelling opening lines | Techniques, examples by tone/industry |
| `get_storytelling_techniques()` | Career narrative frameworks | Story frameworks, examples |

### Application Strategy Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `analyze_target_role()` | Positioning analysis | Key themes, positioning statement, approach |
| `prepare_interview_strategy()` | Complete interview prep | STAR templates, questions, checklist |
| `create_application_package_strategy()` | Integrated CV + CL strategy | Timeline, quality checklist, priorities |

---

## Response Formats

### Target Role Analysis Response
```python
{
    'role': {
        'title': 'Senior HR Manager',
        'type': 'Manager',
        'seniority': 'senior manager'
    },
    'positioning': {
        'statement': 'Position as senior-level Manager with deep expertise in...',
        'key_themes': [
            'Team Management & Leadership',
            'Process Improvement',
            'Stakeholder Engagement',
            'Project Delivery'
        ],
        'focus_areas': [
            'Technical competencies',
            'Leadership experience',
            'Results delivery'
        ]
    },
    'application_approach': {
        'cv_strategy': 'Lead with management experience...',
        'cover_letter_strategy': 'Open with leadership impact...',
        'key_messages': [...]
    }
}
```

### Interview Preparation Response
```python
{
    'star_method': {
        'guidance': 'STAR framework explanation...',
        'templates': [
            {
                'scenario': 'Leadership Challenge',
                'situation': 'Context of the challenge...',
                'task': 'Your responsibility...',
                'action': 'What you did...',
                'result': 'Quantified outcome...',
                'applicable_to': 'Leadership, management, conflict questions'
            },
            # 3-4 more templates
        ]
    },
    'questions': {
        'by_category': {
            'leadership': ['Tell me about a time...', ...],
            'problem_solving': ['Describe a complex problem...', ...],
            'teamwork': ['How do you handle...', ...],
            # More categories
        },
        'total_count': 25
    },
    'preparation': {
        'checklist': [
            'Research company mission and values',
            'Prepare 3 STAR examples',
            # 10 more items
        ],
        'company_research': [
            'Recent company news',
            'Industry trends',
            # More prompts
        ],
        'questions_for_interviewer': [
            'What does success look like in this role?',
            'How does the team collaborate?',
            # 8 more questions
        ]
    },
    'file_saved': '/path/to/interview_prep.txt'  # If save_to_file=True
}
```

---

## Usage Examples

### Example 1: Standalone CV Optimization

```python
from agents import Kyle

kyle = Kyle(llm_provider="claude")

# Get CV best practices for target role
cv_practices = kyle.get_cv_best_practices(
    role_type="Senior HR Manager",
    experience_level="senior"
)

print(cv_practices['answer'])

# Get bullet point strategies
bullets = kyle.get_bullet_point_strategies("Manager")
print(bullets['formulas'])

# Optimize existing CV content
optimized = kyle.optimize_cv_content(
    current_cv_excerpt="""
    • Managed team
    • Improved processes
    • Led projects
    """,
    target_role="Senior HR Manager"
)

print(optimized['improved_content'])
```

### Example 2: Complete Application Package with Simon

```python
from agents import Simon, Kyle

simon = Simon(llm_provider="claude")
kyle = Kyle(llm_provider="claude")

# Step 1: Simon analyzes opportunity
job_analysis = simon.create_brief_to_kyle(
    jd_text=job_description,
    company_name="Sunbit Inc.",
    role_title="Senior HR Manager"
)

# Check Simon's recommendation
if job_analysis['overall_recommendation']['decision'] == 'PURSUE':

    # Step 2: Kyle analyzes positioning
    positioning = kyle.analyze_target_role(
        jd_text=job_description,
        role_title="Senior HR Manager",
        simon_brief=job_analysis
    )

    print("Positioning:", positioning['positioning']['statement'])
    print("Key Themes:", positioning['positioning']['key_themes'])

    # Step 3: Prepare for interview
    interview_prep = kyle.prepare_interview_strategy(
        role_title="Senior HR Manager",
        role_type=job_analysis['role_classification']['role_type'],
        simon_brief=job_analysis,
        save_to_file=True
    )

    print(f"Interview prep saved to: {interview_prep['file_saved']}")
    print(f"STAR templates: {len(interview_prep['star_method']['templates'])}")

    # Step 4: Get complete application strategy
    strategy = kyle.create_application_package_strategy(positioning)
    print(strategy['integrated_strategy'])
```

### Example 3: Cover Letter Development

```python
kyle = Kyle(llm_provider="claude")

# Get cover letter best practices
cl_practices = kyle.get_cover_letter_best_practices(
    role_type="Senior HR Manager",
    company_name="Sunbit Inc."
)

print("Key Elements:", cl_practices['key_elements'])

# Get opening strategies
openings = kyle.get_opening_strategies(
    tone="professional",
    industry="FinTech"
)

print("Opening Techniques:", openings['techniques'])

# Get storytelling guidance
story = kyle.get_storytelling_techniques(career_stage="senior")
print("Story Frameworks:", story['frameworks'])
```

---

## Configuration

### LLM Provider Options

Kyle supports multiple LLM providers:
- `claude` (default, recommended)
- `openai`
- `gemini`
- `ollama` (local)

```python
kyle = Kyle(llm_provider="claude")
```

### RAG (Knowledge Base) Setup

Kyle requires RAG access for full functionality:

```bash
# Initialize knowledge base
cd /mnt/f/Projects/AI_Projects/rag-system
python ingest.py

# Verify RAG is ready
python -c "from agents.rag_client import RAGClient; print(RAGClient().is_ready())"
```

If RAG is not available, Kyle will indicate limited functionality.

---

## Best Practices

### 1. Always Use Simon's Analysis When Available

Simon provides valuable context that improves Kyle's recommendations:
- Role classification (type, tier, seniority)
- JD quality assessment
- Ghost-job risk analysis
- Strategic recommendations

### 2. Save Interview Prep to File

Interview preparation artifacts are comprehensive - save them:
```python
interview_prep = kyle.prepare_interview_strategy(
    role_title="Senior HR Manager",
    role_type="Manager",
    save_to_file=True  # Always True for interview prep
)
```

### 3. Use Master CV for Context

Maintain a master CV at:
```
/mnt/f/Projects/AI_Projects/code/career-coach/data/master_cv.txt
```

Kyle uses this to:
- Provide more relevant suggestions
- Extract applicable experience
- Maintain consistency across applications

### 4. Follow the Complete Workflow

For best results, use the complete Simon → Kyle workflow:
1. Simon analyzes job opportunity
2. Kyle analyzes target role positioning
3. Kyle prepares interview strategy
4. Kyle creates complete application package

### 5. Leverage Category-Specific Methods

Don't just use generic methods - leverage specialized ones:
- `get_bullet_point_strategies()` for achievement bullets
- `get_opening_strategies()` for cover letter starts
- `get_storytelling_techniques()` for career narratives

---

## Version History

### v2.1.0 (Current)
- ✅ Added `analyze_target_role()` - Positioning analysis with Simon integration
- ✅ Added `prepare_interview_strategy()` - STAR method + question bank
- ✅ File output management with standardized naming
- ✅ Master CV protocol support
- ✅ Enhanced Simon integration
- ✅ Expanded interview preparation frameworks

### v2.0.0
- ✅ Domain-focused RAG queries (H01 - CV & Cover Letters)
- ✅ CV optimization methods
- ✅ Cover letter strategies
- ✅ Application package creation
- ✅ Bullet point formulas (ARC method)

---

## Dependencies

**Python Modules:**
- `rag_client` - RAG knowledge base access
- Standard library: `os`, `sys`, `pathlib`, `datetime`, `typing`

**External:**
- RAG system with H01 knowledge base
- LLM provider (Claude, OpenAI, Gemini, or Ollama)

---

## Support

For issues or questions:
- Check RAG availability: `kyle.rag.is_ready()`
- Verify output directory exists: `/mnt/f/Projects/AI_Projects/code/career-coach/data/CVs/`
- Ensure master CV is available (optional but recommended)
- Review method docstrings for parameter details

---

**Kyle v2.1.0 - Your CV & Cover Letter Expert**
*Creating compelling career documents with AI-powered expertise*
