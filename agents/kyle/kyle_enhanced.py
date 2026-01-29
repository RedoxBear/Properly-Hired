#!/usr/bin/env python3
"""
Kyle Enhanced - CV & Cover Letter Expert
Locked in with deep knowledge from H01 - CV & Cover Letters domain

Key Enhancements:
- Focused RAG queries on CV/Cover Letter best practices
- Access to 50+ CV and cover letter resources
- Domain expertise in career documents
- Interview preparation and positioning strategies
- File output management for CVs and cover letters
"""
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

# Add parent directory for rag_client
sys.path.insert(0, str(Path(__file__).parent.parent))
from rag_client import RAGClient


class KyleEnhanced:
    """
    Kyle - The CV & Cover Letter Expert

    Specialized knowledge domains:
    - H01 - CV & Cover Letters (primary expertise)
    - Career coaching best practices
    - Application materials optimization
    - Personal branding strategies
    - Interview preparation
    """

    # Output configuration
    OUTPUT_DIR = "/mnt/f/Projects/AI_Projects/code/career-coach/data/CVs"
    MASTER_CV_PATH = "/mnt/f/Projects/AI_Projects/code/career-coach/data/master_cv.txt"

    def __init__(self, llm_provider: Optional[str] = None):
        """
        Initialize Kyle with specialized CV/Cover Letter expertise

        Args:
            llm_provider: LLM provider (claude, openai, gemini, ollama)
        """
        self.name = "Kyle (CV & Cover Letter Expert)"
        self.rag = RAGClient(llm_provider=llm_provider)

        # Kyle's specialized domains
        self.expertise_domains = [
            "CV best practices",
            "Cover letter strategies",
            "Resume optimization",
            "Application materials",
            "Career branding",
            "Interview preparation"
        ]

        # Ensure output directory exists
        os.makedirs(self.OUTPUT_DIR, exist_ok=True)

        # Check RAG readiness
        if self.rag.is_ready():
            print(f"✓ {self.name} initialized")
            print(f"  → Expert access to CV & Cover Letter knowledge base")
            print(f"  → Specialized in: {', '.join(self.expertise_domains)}")
            print(f"  → Output directory: {self.OUTPUT_DIR}")
        else:
            print(f"⚠ {self.name} initialized WITHOUT RAG")
            print(f"  Run: cd /mnt/f/Projects/AI_Projects/rag-system && python ingest.py")

    # =====================================================================
    # CV EXPERTISE - DOMAIN-FOCUSED RAG QUERIES
    # =====================================================================

    def get_cv_best_practices(self, role_type: str, experience_level: str = "senior") -> Dict:
        """
        Get CV best practices with focus on H01 knowledge base

        Args:
            role_type: Type of role (e.g., "HR Manager", "Software Engineer")
            experience_level: Career level (junior, mid, senior, executive)

        Returns:
            Dict with best practices, structure, and examples
        """
        print(f"\n📄 [KYLE - CV EXPERT] Fetching best practices for {role_type}...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        # Domain-focused query targeting H01
        query = f"""
        CV and resume best practices for {experience_level} {role_type} positions.
        Focus on:
        - Optimal CV structure and layout
        - Section order and prioritization
        - Content density and formatting
        - ATS optimization strategies
        - Visual design principles
        - Common mistakes to avoid

        Include specific examples and templates.
        """

        result = self.rag.ask(query, k=8, show_sources=True)

        if result:
            sources = result.get('sources', [])
            # Filter for CV-specific sources
            cv_sources = [s for s in sources if any(term in s.get('source', '').lower()
                         for term in ['cv', 'resume', 'cover', 'application'])]

            return {
                'best_practices': result['answer'],
                'cv_specific_sources': [s['source'] for s in cv_sources],
                'all_sources': [s['source'] for s in sources],
                'confidence': 'HIGH' if len(cv_sources) >= 3 else 'MEDIUM'
            }

        return {'error': 'Query failed'}

    def get_bullet_point_strategies(self, role_type: str) -> Dict:
        """
        Get bullet point writing strategies from CV knowledge base

        Returns expert guidance on:
        - Action-Result format
        - Quantification strategies
        - Power verbs selection
        - Impact framing
        """
        print(f"\n✏️ [KYLE - CV EXPERT] Bullet point strategies for {role_type}...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        query = f"""
        Expert guidance on writing powerful CV bullet points for {role_type} positions.
        Cover:
        - Action-Result-Context (ARC) formula
        - Quantification techniques and metrics
        - Power verbs and strong action words
        - Achievement framing strategies
        - Before/after examples
        - Industry-specific best practices

        Provide specific examples with explanations.
        """

        result = self.rag.ask(query, k=6, show_sources=True)

        if result:
            return {
                'strategies': result['answer'],
                'sources': [s['source'] for s in result.get('sources', [])],
                'key_formulas': self._extract_formulas(result['answer'])
            }

        return {'error': 'Query failed'}

    def optimize_cv_content(self, current_cv_excerpt: str, target_role: str) -> Dict:
        """
        Optimize CV content using knowledge base insights

        Args:
            current_cv_excerpt: Current CV text to optimize
            target_role: Target role to optimize for

        Returns:
            Optimization recommendations
        """
        print(f"\n🔧 [KYLE - CV EXPERT] Optimizing CV for {target_role}...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        # Get structure advice
        structure_query = f"Optimal CV structure for {target_role} with examples"
        structure = self.rag.ask(structure_query, k=5, show_sources=False)

        # Get language patterns
        language_query = f"Effective language patterns and keywords for {target_role} CVs"
        language = self.rag.ask(language_query, k=4, show_sources=False)

        # Get achievement framing
        achievement_query = f"How to frame achievements and impact for {target_role}"
        achievements = self.rag.ask(achievement_query, k=4, show_sources=False)

        return {
            'structure_recommendations': structure.get('answer', '') if structure else '',
            'language_guidance': language.get('answer', '') if language else '',
            'achievement_framing': achievements.get('answer', '') if achievements else '',
            'optimization_summary': self._generate_optimization_summary(
                structure, language, achievements
            )
        }

    # =====================================================================
    # COVER LETTER EXPERTISE - DOMAIN-FOCUSED RAG QUERIES
    # =====================================================================

    def get_cover_letter_best_practices(self, role_type: str, company_name: str = None) -> Dict:
        """
        Get cover letter best practices from H01 knowledge base

        Returns expert guidance on:
        - Structure and format
        - Opening strategies
        - Storytelling techniques
        - Closing strategies
        - Tone and style
        """
        print(f"\n💌 [KYLE - COVER LETTER EXPERT] Best practices for {role_type}...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        query = f"""
        Cover letter best practices for {role_type} positions.
        Include:
        - Optimal structure (opening, body, closing)
        - High-impact opening strategies
        - Storytelling and narrative techniques
        - Company research integration
        - Value proposition framing
        - Call-to-action strategies
        - Tone and style guidelines
        - Length and formatting

        Provide specific examples and templates.
        """

        result = self.rag.ask(query, k=8, show_sources=True)

        if result:
            return {
                'best_practices': result['answer'],
                'sources': [s['source'] for s in result.get('sources', [])],
                'key_elements': self._extract_key_elements(result['answer'])
            }

        return {'error': 'Query failed'}

    def get_opening_strategies(self, tone: str = "professional", industry: str = None) -> Dict:
        """
        Get high-impact opening strategies for cover letters

        Args:
            tone: Desired tone (professional, casual, creative)
            industry: Target industry for context
        """
        print(f"\n🎣 [KYLE - COVER LETTER EXPERT] Opening strategies ({tone} tone)...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        query = f"""
        High-impact cover letter opening strategies with {tone} tone
        {f'for {industry} industry' if industry else ''}.

        Focus on:
        - Attention-grabbing first sentences
        - Avoiding clichés and overused phrases
        - Creating immediate connection
        - Demonstrating company research
        - Establishing value quickly

        Provide 5-7 specific examples with explanations.
        """

        result = self.rag.ask(query, k=6, show_sources=True)

        if result:
            return {
                'opening_strategies': result['answer'],
                'examples': self._extract_examples(result['answer']),
                'sources': [s['source'] for s in result.get('sources', [])]
            }

        return {'error': 'Query failed'}

    def get_storytelling_techniques(self, career_stage: str = "mid-career") -> Dict:
        """
        Get storytelling and narrative techniques for cover letters
        """
        print(f"\n📖 [KYLE - COVER LETTER EXPERT] Storytelling techniques...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        query = f"""
        Storytelling and narrative techniques for {career_stage} cover letters.

        Include:
        - Career narrative arc structure
        - Connecting past-present-future
        - Demonstrating career progression
        - Linking experiences to target role
        - Creating emotional connection
        - Authenticity and personal voice

        Provide frameworks and examples.
        """

        result = self.rag.ask(query, k=6, show_sources=False)

        if result:
            return {
                'storytelling_techniques': result['answer'],
                'frameworks': self._extract_frameworks(result['answer'])
            }

        return {'error': 'Query failed'}

    # =====================================================================
    # INTEGRATED WORKFLOW - FULL APPLICATION PACKAGE
    # =====================================================================

    def create_application_package_strategy(self, target_analysis: Dict) -> Dict:
        """
        Create complete application package strategy (CV + Cover Letter)

        Args:
            target_analysis: Role analysis (from Simon or self-analysis)

        Returns:
            Complete strategy for both CV and cover letter
        """
        print(f"\n📦 [KYLE - APPLICATION EXPERT] Creating complete package strategy...")

        role_type = target_analysis.get('role_type', 'Professional')
        tone = target_analysis.get('tone', 'professional')
        company = target_analysis.get('company_name', 'Target Company')

        # Get CV strategy
        cv_practices = self.get_cv_best_practices(role_type)
        bullet_strategies = self.get_bullet_point_strategies(role_type)

        # Get Cover Letter strategy
        cl_practices = self.get_cover_letter_best_practices(role_type, company)
        opening_strategies = self.get_opening_strategies(tone)
        storytelling = self.get_storytelling_techniques()

        return {
            'cv_strategy': {
                'best_practices': cv_practices,
                'bullet_strategies': bullet_strategies
            },
            'cover_letter_strategy': {
                'best_practices': cl_practices,
                'opening_strategies': opening_strategies,
                'storytelling': storytelling
            },
            'integrated_approach': self._create_integrated_strategy(
                cv_practices, cl_practices, target_analysis
            ),
            'timeline': self._create_timeline(),
            'quality_checklist': self._create_quality_checklist()
        }

    # =====================================================================
    # TARGET ROLE ANALYSIS - POSITIONING & STRATEGY
    # =====================================================================

    def analyze_target_role(self, jd_text: str = None, role_title: str = None,
                           simon_brief: Dict = None) -> Dict:
        """
        Analyze target role and create positioning summary

        Args:
            jd_text: Job description text (optional if simon_brief provided)
            role_title: Role title (optional if simon_brief provided)
            simon_brief: Brief from Simon with opportunity analysis (optional)

        Returns:
            Dict with positioning summary, key themes, and application strategy
        """
        print(f"\n🎯 [KYLE - POSITIONING EXPERT] Analyzing target role...")

        # Extract info from Simon's brief if provided
        if simon_brief:
            role_title = simon_brief.get('brief_metadata', {}).get('role_title', role_title)
            role_classification = simon_brief.get('role_classification', {})
            role_type = role_classification.get('role_type', 'Professional')
            seniority = role_classification.get('seniority_level', 'mid')
            strategy_guidance = simon_brief.get('strategy_for_kyle', {})

            print(f"  → Using Simon's brief for {role_title}")
            print(f"  → Role Type: {role_type}, Seniority: {seniority}")
        else:
            role_type = 'Professional'
            seniority = 'mid'
            strategy_guidance = {}
            print(f"  → Analyzing without Simon's brief")

        # Get positioning guidance from RAG
        positioning_summary = None
        if self.rag.is_ready():
            positioning_query = f"""
            Career positioning strategy for {role_title} ({role_type} level).

            How should a candidate position themselves for this role? Include:
            - Key value propositions to emphasize
            - Core competencies to highlight
            - Experience areas to feature prominently
            - Personal brand positioning
            - Differentiation strategies
            - Storytelling themes

            Provide specific positioning recommendations.
            """

            result = self.rag.ask(positioning_query, k=6, show_sources=True)
            positioning_summary = result if result else None

        # Identify key themes
        key_themes = self._identify_key_themes(jd_text, role_type, seniority)

        # Create positioning statement
        positioning_statement = self._create_positioning_statement(
            role_title, role_type, seniority, key_themes
        )

        # Load master CV if available
        master_cv_content = self._load_master_cv()

        return {
            'role_title': role_title,
            'role_type': role_type,
            'seniority_level': seniority,
            'positioning_statement': positioning_statement,
            'key_themes': key_themes,
            'positioning_guidance': positioning_summary.get('answer', '') if positioning_summary else '',
            'simon_strategy': strategy_guidance if simon_brief else None,
            'recommended_focus_areas': self._extract_focus_areas(
                positioning_summary.get('answer', '') if positioning_summary else ''
            ),
            'master_cv_available': master_cv_content is not None,
            'application_approach': self._create_application_approach(
                role_type, seniority, strategy_guidance
            )
        }

    # =====================================================================
    # INTERVIEW PREPARATION - STAR METHOD & QUESTION PREP
    # =====================================================================

    def prepare_interview_strategy(self, role_title: str, role_type: str = 'Professional',
                                   simon_brief: Dict = None, save_to_file: bool = True) -> Dict:
        """
        Prepare comprehensive interview strategy with STAR method guidance

        Args:
            role_title: Target role title
            role_type: Role type (Executive, Manager, Professional, etc.)
            simon_brief: Optional Simon brief with company/role analysis
            save_to_file: Whether to save artifacts to file

        Returns:
            Dict with interview prep artifacts, STAR examples, and question bank
        """
        print(f"\n💼 [KYLE - INTERVIEW PREP EXPERT] Preparing interview strategy for {role_title}...")

        company_name = "Target Company"
        if simon_brief:
            company_name = simon_brief.get('brief_metadata', {}).get('company_name', company_name)
            role_classification = simon_brief.get('role_classification', {})
            role_type = role_classification.get('role_type', role_type)
            print(f"  → Using Simon's brief for {company_name}")

        # Get STAR method guidance from RAG
        star_guidance = None
        if self.rag.is_ready():
            star_query = f"""
            STAR method (Situation, Task, Action, Result) interview preparation for {role_title} positions.

            Include:
            - STAR method framework and best practices
            - How to structure compelling STAR stories
            - Common interview questions for {role_type} roles
            - Strong action verbs for each STAR component
            - Tips for quantifying results
            - Examples of effective STAR responses
            - How to adapt stories to different questions

            Provide detailed guidance with examples.
            """

            result = self.rag.ask(star_query, k=8, show_sources=True)
            star_guidance = result if result else None

        # Get behavioral question frameworks
        behavioral_questions = None
        if self.rag.is_ready():
            behavioral_query = f"""
            Behavioral interview questions for {role_type} ({role_title}) positions.

            Provide:
            - Common behavioral questions by category (leadership, problem-solving, teamwork, etc.)
            - Competency-based questions
            - Situational questions
            - Questions about challenges and conflicts
            - Career motivation questions

            Include at least 20-30 specific questions.
            """

            result = self.rag.ask(behavioral_query, k=7, show_sources=True)
            behavioral_questions = result if result else None

        # Create STAR story templates
        star_templates = self._create_star_templates(role_type)

        # Generate question bank
        question_bank = self._generate_question_bank(
            behavioral_questions.get('answer', '') if behavioral_questions else '',
            role_type
        )

        # Create interview prep artifacts
        artifacts = {
            'role_title': role_title,
            'company_name': company_name,
            'role_type': role_type,
            'star_method_guidance': star_guidance.get('answer', '') if star_guidance else '',
            'star_templates': star_templates,
            'behavioral_questions': behavioral_questions.get('answer', '') if behavioral_questions else '',
            'question_bank': question_bank,
            'preparation_checklist': self._create_interview_checklist(),
            'company_research_prompts': self._create_company_research_prompts(company_name),
            'questions_to_ask_interviewer': self._create_questions_for_interviewer(role_type)
        }

        # Save to file if requested
        if save_to_file:
            filepath = self._save_interview_prep(artifacts, company_name, role_title)
            artifacts['saved_to'] = filepath
            print(f"  ✓ Interview prep saved to: {filepath}")

        return artifacts

    # =====================================================================
    # FILE OUTPUT MANAGEMENT
    # =====================================================================

    def _save_to_file(self, content: str, company_name: str, position: str,
                     doc_type: str) -> str:
        """
        Save document to file with standardized naming

        Format: yymmddhhmm - company name - position - type.txt

        Args:
            content: Document content
            company_name: Company name
            position: Position title
            doc_type: Type (cv, cover_letter, interview_prep, etc.)

        Returns:
            File path
        """
        # Generate filename
        timestamp = datetime.now().strftime("%y%m%d%H%M")
        clean_company = company_name.replace(' ', '_').replace('/', '_')
        clean_position = position.replace(' ', '_').replace('/', '_')
        filename = f"{timestamp} - {clean_company} - {clean_position} - {doc_type}.txt"

        filepath = os.path.join(self.OUTPUT_DIR, filename)

        # Write content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        return filepath

    def _save_interview_prep(self, artifacts: Dict, company_name: str, role_title: str) -> str:
        """Save interview prep artifacts to file"""

        content = f"""
{'='*80}
INTERVIEW PREPARATION - {role_title} at {company_name}
{'='*80}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
Role Type: {artifacts['role_type']}

{'='*80}
STAR METHOD GUIDANCE
{'='*80}

{artifacts['star_method_guidance']}

{'='*80}
STAR STORY TEMPLATES
{'='*80}

{self._format_star_templates(artifacts['star_templates'])}

{'='*80}
BEHAVIORAL QUESTION BANK
{'='*80}

{artifacts['behavioral_questions']}

{'='*80}
INTERVIEW PREPARATION CHECKLIST
{'='*80}

{self._format_checklist(artifacts['preparation_checklist'])}

{'='*80}
COMPANY RESEARCH PROMPTS
{'='*80}

{self._format_research_prompts(artifacts['company_research_prompts'])}

{'='*80}
QUESTIONS TO ASK INTERVIEWER
{'='*80}

{self._format_questions_list(artifacts['questions_to_ask_interviewer'])}

{'='*80}
END OF INTERVIEW PREPARATION
{'='*80}
"""

        return self._save_to_file(content, company_name, role_title, 'interview_prep')

    def _load_master_cv(self) -> Optional[str]:
        """Load master CV if available"""
        if os.path.exists(self.MASTER_CV_PATH):
            with open(self.MASTER_CV_PATH, 'r', encoding='utf-8') as f:
                return f.read()
        return None

    # =====================================================================
    # HELPER METHODS
    # =====================================================================

    def _extract_formulas(self, text: str) -> List[str]:
        """Extract formulas and frameworks from text"""
        formulas = []
        # Look for formula patterns
        import re
        patterns = [
            r'[A-Z]+-[A-Z]+-[A-Z]+',  # ARC, CAR, STAR, etc.
            r'Action.*Result.*Context',
            r'Situation.*Task.*Action.*Result'
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            formulas.extend(matches)
        return list(set(formulas))[:5]

    def _extract_key_elements(self, text: str) -> List[str]:
        """Extract key elements from best practices"""
        # Simple extraction - look for numbered lists or bullet points
        elements = []
        lines = text.split('\n')
        for line in lines:
            if line.strip().startswith(('1.', '2.', '3.', '•', '-', '*')):
                elements.append(line.strip())
        return elements[:10]

    def _extract_examples(self, text: str) -> List[str]:
        """Extract examples from text"""
        examples = []
        # Look for example indicators
        import re
        example_pattern = r'Example[:\s]+(.{20,200})'
        matches = re.findall(example_pattern, text, re.IGNORECASE)
        examples.extend(matches)
        return examples[:5]

    def _extract_frameworks(self, text: str) -> List[str]:
        """Extract frameworks from text"""
        # Similar to formulas but broader
        frameworks = []
        lines = text.split('\n')
        for line in lines:
            if any(word in line.lower() for word in ['framework', 'model', 'approach', 'structure']):
                frameworks.append(line.strip())
        return frameworks[:5]

    def _generate_optimization_summary(self, structure, language, achievements) -> str:
        """Generate optimization summary"""
        return f"""
OPTIMIZATION SUMMARY:

Structure Recommendations:
{(structure.get('answer', '')[:200] + '...') if structure else 'N/A'}

Language Guidance:
{(language.get('answer', '')[:200] + '...') if language else 'N/A'}

Achievement Framing:
{(achievements.get('answer', '')[:200] + '...') if achievements else 'N/A'}

NEXT STEPS:
1. Review structure recommendations
2. Apply language patterns
3. Reframe achievements for impact
4. Optimize for ATS and human readers
"""

    def _create_integrated_strategy(self, cv_practices, cl_practices, target_analysis) -> str:
        """Create integrated CV + Cover Letter strategy"""
        return f"""
INTEGRATED APPLICATION STRATEGY:

Role: {target_analysis.get('role_type', 'N/A')}
Tone: {target_analysis.get('tone', 'N/A')}
Company: {target_analysis.get('company_name', 'N/A')}

CV APPROACH:
- Lead with strong, quantified achievements
- Emphasize {target_analysis.get('role_type', 'relevant')} competencies
- Use industry-specific keywords
- Optimize for ATS

COVER LETTER APPROACH:
- Open with compelling hook matching {target_analysis.get('tone', 'professional')} tone
- Tell cohesive career story
- Connect directly to company needs
- Demonstrate culture fit

SYNERGY:
- CV shows evidence; cover letter provides narrative
- Consistent personal brand across documents
- Complementary, not repetitive content
"""

    def _create_timeline(self) -> Dict:
        """Create application timeline"""
        return {
            'cv_optimization': '2-3 hours',
            'cover_letter_drafting': '1-2 hours',
            'review_and_refinement': '1 hour',
            'total_estimated_time': '4-6 hours',
            'recommended_breaks': 'Work in 45-min focused blocks'
        }

    def _create_quality_checklist(self) -> List[str]:
        """Create quality checklist"""
        return [
            "✓ CV is ATS-optimized with relevant keywords",
            "✓ Bullet points use Action-Result-Context formula",
            "✓ Achievements are quantified where possible",
            "✓ Cover letter has strong, unique opening",
            "✓ Career narrative is clear and compelling",
            "✓ Tone matches company culture",
            "✓ No typos or grammatical errors",
            "✓ Formatting is clean and professional",
            "✓ Contact information is current and professional",
            "✓ Documents are saved in correct format (PDF)"
        ]

    def _identify_key_themes(self, jd_text: str, role_type: str, seniority: str) -> List[str]:
        """Identify key themes from job description"""
        themes = []

        # Common themes by role type
        theme_map = {
            'Executive': ['Strategic Leadership', 'Vision & Strategy', 'Organizational Transformation',
                         'Stakeholder Management', 'P&L Responsibility'],
            'Director': ['Strategic Planning', 'Team Leadership', 'Cross-functional Collaboration',
                        'Business Growth', 'Performance Management'],
            'Manager': ['Team Management', 'Process Improvement', 'Project Delivery',
                       'Stakeholder Communication', 'Resource Management'],
            'Professional': ['Technical Expertise', 'Problem Solving', 'Collaboration',
                           'Continuous Learning', 'Results Delivery']
        }

        themes = theme_map.get(role_type, theme_map['Professional'])

        # Add seniority-specific themes
        if seniority in ['executive', 'senior director', 'director']:
            themes.append('Change Management')
        if seniority in ['senior', 'senior manager', 'senior director']:
            themes.append('Mentorship & Development')

        return themes[:6]

    def _create_positioning_statement(self, role_title: str, role_type: str,
                                     seniority: str, key_themes: List[str]) -> str:
        """Create positioning statement"""
        theme_text = ", ".join(key_themes[:3])
        return f"""
POSITIONING STATEMENT FOR {role_title}

Position yourself as a {seniority}-level {role_type} with deep expertise in {theme_text}.

Your core value proposition should emphasize:
1. Proven track record in {key_themes[0] if key_themes else 'your domain'}
2. Strategic thinking combined with execution excellence
3. Leadership capabilities appropriate for {seniority} level
4. Results-oriented approach with quantifiable impact

Differentiation Strategy:
- Highlight unique combinations of skills and experiences
- Emphasize both technical depth and business acumen
- Demonstrate cultural fit and values alignment
- Show progression and continuous growth
"""

    def _extract_focus_areas(self, positioning_text: str) -> List[str]:
        """Extract focus areas from positioning guidance"""
        focus_areas = []
        lines = positioning_text.split('\n')
        for line in lines:
            if line.strip().startswith(('•', '-', '*', '1.', '2.', '3.')):
                cleaned = line.strip().lstrip('•-*123456789. ')
                if len(cleaned) > 10:
                    focus_areas.append(cleaned)
        return focus_areas[:8] if focus_areas else [
            "Technical competencies and domain expertise",
            "Leadership and people management",
            "Strategic thinking and business acumen",
            "Results delivery and impact",
            "Collaboration and communication"
        ]

    def _create_application_approach(self, role_type: str, seniority: str,
                                    strategy_guidance: Dict) -> str:
        """Create application approach based on role and strategy"""
        approach = f"""
APPLICATION APPROACH for {role_type} ({seniority} level):

CV Strategy:
"""
        if strategy_guidance and 'cv_emphasis' in strategy_guidance:
            for point in strategy_guidance['cv_emphasis']:
                approach += f"  • {point}\n"
        else:
            approach += f"  • Emphasize {seniority}-level accomplishments\n"
            approach += f"  • Quantify impact and results\n"
            approach += f"  • Highlight relevant competencies\n"

        approach += "\nCover Letter Strategy:\n"
        if strategy_guidance and 'cover_letter_emphasis' in strategy_guidance:
            for point in strategy_guidance['cover_letter_emphasis']:
                approach += f"  • {point}\n"
        else:
            approach += f"  • Open with strong hook\n"
            approach += f"  • Tell cohesive career story\n"
            approach += f"  • Demonstrate cultural fit\n"

        if strategy_guidance and 'tone_recommendation' in strategy_guidance:
            approach += f"\nTone: {strategy_guidance['tone_recommendation']}\n"

        return approach

    def _create_star_templates(self, role_type: str) -> List[Dict]:
        """Create STAR story templates"""
        templates = [
            {
                'scenario': 'Leadership Challenge',
                'situation': f'Describe a situation where you led a team through a challenge',
                'task': 'What was your specific responsibility?',
                'action': 'What actions did you take? (Use strong action verbs)',
                'result': 'What was the measurable outcome? (Quantify if possible)',
                'applicable_to': 'Leadership, team management, problem-solving questions'
            },
            {
                'scenario': 'Process Improvement',
                'situation': 'Describe an inefficient process you encountered',
                'task': 'What was needed to improve it?',
                'action': 'What steps did you take to implement change?',
                'result': 'What were the measurable improvements? (%, $, time saved)',
                'applicable_to': 'Innovation, efficiency, continuous improvement questions'
            },
            {
                'scenario': 'Conflict Resolution',
                'situation': 'Describe a conflict situation (team, stakeholder, client)',
                'task': 'What was your role in resolving it?',
                'action': 'How did you approach the situation?',
                'result': 'What was the outcome? How did relationships improve?',
                'applicable_to': 'Collaboration, communication, interpersonal skills questions'
            },
            {
                'scenario': 'Achievement Under Pressure',
                'situation': 'Describe a high-pressure or deadline-driven situation',
                'task': 'What were you responsible for delivering?',
                'action': 'How did you manage priorities and resources?',
                'result': 'What did you achieve? Did you meet/exceed expectations?',
                'applicable_to': 'Time management, resilience, performance under pressure questions'
            }
        ]

        # Add role-specific template
        if role_type in ['Executive', 'Director']:
            templates.append({
                'scenario': 'Strategic Initiative',
                'situation': 'Describe a strategic initiative you led',
                'task': 'What was the business objective?',
                'action': 'How did you develop and execute the strategy?',
                'result': 'What was the business impact? (Revenue, cost savings, market share)',
                'applicable_to': 'Strategic thinking, business acumen, transformation questions'
            })

        return templates

    def _generate_question_bank(self, behavioral_text: str, role_type: str) -> Dict:
        """Generate categorized question bank"""
        question_bank = {
            'leadership': [],
            'problem_solving': [],
            'teamwork': [],
            'communication': [],
            'adaptability': [],
            'technical': []
        }

        # Extract questions from behavioral text if available
        if behavioral_text:
            import re
            questions = re.findall(r'["\']([^"\']+\?)["\']|^- (.+\?)$', behavioral_text, re.MULTILINE)
            for q in questions:
                q_text = q[0] if q[0] else q[1]
                if q_text:
                    # Categorize based on keywords
                    q_lower = q_text.lower()
                    if any(w in q_lower for w in ['lead', 'manage', 'team', 'direct']):
                        question_bank['leadership'].append(q_text)
                    elif any(w in q_lower for w in ['problem', 'challenge', 'difficult', 'conflict']):
                        question_bank['problem_solving'].append(q_text)
                    elif any(w in q_lower for w in ['collaborate', 'work with', 'team']):
                        question_bank['teamwork'].append(q_text)
                    elif any(w in q_lower for w in ['communicate', 'present', 'explain']):
                        question_bank['communication'].append(q_text)
                    elif any(w in q_lower for w in ['change', 'adapt', 'learn']):
                        question_bank['adaptability'].append(q_text)
                    else:
                        question_bank['technical'].append(q_text)

        # Add default questions if categories are empty
        if not question_bank['leadership']:
            question_bank['leadership'] = [
                "Tell me about a time you led a team through a significant challenge.",
                "Describe your leadership style and give an example of when it was effective.",
                "How do you motivate team members who are underperforming?"
            ]

        if not question_bank['problem_solving']:
            question_bank['problem_solving'] = [
                "Describe a complex problem you solved. What was your approach?",
                "Tell me about a time when you had to make a difficult decision with limited information.",
                "Give an example of when you had to think creatively to solve a problem."
            ]

        return question_bank

    def _create_interview_checklist(self) -> List[str]:
        """Create interview preparation checklist"""
        return [
            "□ Research company (mission, values, recent news, culture)",
            "□ Review job description and identify key requirements",
            "□ Prepare 5-7 STAR stories covering different competencies",
            "□ Practice answering common behavioral questions",
            "□ Prepare questions to ask the interviewer (5-7 questions)",
            "□ Research interviewer(s) on LinkedIn",
            "□ Prepare examples of your work/portfolio if relevant",
            "□ Review your resume and be ready to discuss any point",
            "□ Plan your outfit and test video/audio if virtual",
            "□ Prepare copies of resume, references, and notepad",
            "□ Practice 2-minute 'Tell me about yourself' pitch",
            "□ Plan arrival (15 min early for in-person, 5 min early for virtual)"
        ]

    def _create_company_research_prompts(self, company_name: str) -> List[str]:
        """Create company research prompts"""
        return [
            f"What is {company_name}'s mission and core values?",
            f"What are {company_name}'s main products/services?",
            f"Who are {company_name}'s key competitors?",
            f"What recent news or press releases has {company_name} published?",
            f"What is {company_name}'s company culture like? (Check Glassdoor, LinkedIn)",
            f"What are {company_name}'s growth plans or strategic initiatives?",
            f"Who are the key executives and what are their backgrounds?",
            f"What challenges is {company_name} currently facing?",
            f"What do employees say about working at {company_name}?",
            f"How does {company_name} differentiate itself in the market?"
        ]

    def _create_questions_for_interviewer(self, role_type: str) -> List[str]:
        """Create questions to ask the interviewer"""
        questions = [
            "What does success look like in this role after 6 months? After 1 year?",
            "What are the biggest challenges facing the team/department right now?",
            "How would you describe the team culture and working style?",
            "What opportunities are there for professional development and growth?",
            "How does this role contribute to the company's strategic objectives?",
            "What do you enjoy most about working here?",
            "How is performance measured and feedback provided?",
            "What is the typical career path for someone in this role?"
        ]

        # Add role-specific questions
        if role_type in ['Executive', 'Director']:
            questions.extend([
                "What are the key strategic priorities for this role in the first year?",
                "How does this role interact with other executive leadership?",
                "What is the budget and resource scope for this position?"
            ])
        elif role_type == 'Manager':
            questions.extend([
                "What is the current team structure and are there plans to expand?",
                "What are the key projects or initiatives I would be leading?",
                "How much autonomy does this role have in decision-making?"
            ])

        return questions

    def _format_star_templates(self, templates: List[Dict]) -> str:
        """Format STAR templates for output"""
        output = ""
        for i, template in enumerate(templates, 1):
            output += f"\n{i}. {template['scenario']}\n"
            output += f"   Situation: {template['situation']}\n"
            output += f"   Task: {template['task']}\n"
            output += f"   Action: {template['action']}\n"
            output += f"   Result: {template['result']}\n"
            output += f"   Use for: {template['applicable_to']}\n"
        return output

    def _format_checklist(self, checklist: List[str]) -> str:
        """Format checklist for output"""
        return "\n".join(checklist)

    def _format_research_prompts(self, prompts: List[str]) -> str:
        """Format research prompts for output"""
        output = ""
        for i, prompt in enumerate(prompts, 1):
            output += f"{i}. {prompt}\n"
        return output

    def _format_questions_list(self, questions: List[str]) -> str:
        """Format questions list for output"""
        output = ""
        for i, question in enumerate(questions, 1):
            output += f"{i}. {question}\n"
        return output


# =========================================================================
# QUICK TEST
# =========================================================================

if __name__ == "__main__":
    kyle = KyleEnhanced()

    # Test CV expertise
    print("\n" + "="*70)
    print("TEST: CV Best Practices")
    print("="*70)
    cv_practices = kyle.get_cv_best_practices("HR Manager", "senior")
    if 'best_practices' in cv_practices:
        print(f"\n{cv_practices['best_practices'][:500]}...")
        print(f"\nSources: {len(cv_practices.get('cv_specific_sources', []))} CV-specific sources")

    # Test Cover Letter expertise
    print("\n" + "="*70)
    print("TEST: Cover Letter Best Practices")
    print("="*70)
    cl_practices = kyle.get_cover_letter_best_practices("HR Manager", "Sunbit")
    if 'best_practices' in cl_practices:
        print(f"\n{cl_practices['best_practices'][:500]}...")
