#!/usr/bin/env python3
"""
Kyle (RAG-Enhanced) - Career Coach + Headhunter
Production implementation for Career-Coach with hard-coded RAG integration

Usage:
    from agents.kyle.kyle import Kyle
    kyle = Kyle()
    analysis = kyle.analyze_target_role(jd_text, role_title, simon_brief)
"""
import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

# Add parent directory to path for rag_client import
sys.path.insert(0, str(Path(__file__).parent.parent))
from rag_client import RAGClient


class Kyle:
    """
    Enhanced Kyle with hard-coded RAG integration for Career-Coach
    """

    def __init__(self, llm_provider: Optional[str] = None):
        """
        Initialize Kyle with RAG client

        Args:
            llm_provider: LLM provider (claude, openai, gemini, ollama)
        """
        self.name = "Kyle"
        self.rag = RAGClient(llm_provider=llm_provider)

        # Check RAG readiness
        if self.rag.is_ready():
            print(f"✓ {self.name} initialized with RAG-powered career coaching")
            print(f"  → Access to 2.3M chunks for best practices, strategies, examples")
        else:
            print(f"⚠ {self.name} initialized WITHOUT RAG (knowledge base not ready)")
            print(f"  Run: cd /mnt/f/Projects/AI_Projects/rag-system && ./rag-check")

    # =====================================================================
    # PHASE 1: JD ANALYSIS (RAG-ENHANCED)
    # =====================================================================

    def analyze_target_role(self, jd_text: str, role_title: str,
                           simon_brief: Optional[Dict] = None) -> Dict:
        """
        Analyze target role using RAG for best practices

        Args:
            jd_text: Full job description
            role_title: Target role title
            simon_brief: Optional brief from Simon

        Returns:
            Role analysis with positioning strategy
        """
        print(f"\n{'='*70}")
        print(f"KYLE'S CAREER COACH ANALYSIS (Career-Coach)")
        print(f"{'='*70}")
        print(f"Target Role: {role_title}")

        # If Simon provided a brief, use it
        if simon_brief:
            print(f"✓ Using Simon's research brief")
            role_type = simon_brief['structured_data']['role_type']
            is_deputy = simon_brief['structured_data']['is_deputy']
            tone = simon_brief['structured_data']['tone']
        else:
            print(f"ℹ No Simon brief - performing own classification")
            role_type = self._classify_role(jd_text, role_title)
            is_deputy = 'deputy' in role_title.lower() or 'deputy' in jd_text.lower()
            tone = 'formal' if any(w in jd_text.lower() for w in ['ensure', 'maintain', 'oversight']) else 'casual'

        # Step 1: RAG-powered best practices
        print(f"\n📚 Step 1: Fetching best practices for {role_type}...")
        best_practices = self._get_resume_best_practices(role_type, is_deputy)

        # Step 2: RAG-powered positioning strategies
        print(f"\n🎯 Step 2: Determining positioning strategy...")
        positioning = self._get_positioning_strategy(role_type, is_deputy, tone)

        # Step 3: RAG-powered language patterns
        print(f"\n💬 Step 3: Getting role-appropriate language patterns...")
        language_guide = self._get_language_patterns(role_type, is_deputy)

        # Step 4: RAG-powered success examples
        print(f"\n⭐ Step 4: Finding success stories and examples...")
        success_examples = self._get_success_examples(role_type)

        analysis = {
            'role_type': role_type,
            'is_deputy': is_deputy,
            'tone': tone,
            'best_practices': best_practices,
            'positioning': positioning,
            'language_guide': language_guide,
            'success_examples': success_examples,
            'simon_brief': simon_brief
        }

        print(f"\n{'='*70}")
        print(f"✅ Analysis complete!")
        print(f"{'='*70}")

        return analysis

    # =====================================================================
    # RESUME OPTIMIZATION (RAG-ENHANCED)
    # =====================================================================

    def optimize_resume(self, current_resume: str, target_analysis: Dict,
                       candidate_background: str) -> Dict:
        """
        Optimize resume using RAG-powered best practices

        Args:
            current_resume: Current resume text
            target_analysis: Analysis from analyze_target_role()
            candidate_background: Brief candidate background

        Returns:
            Optimized resume with specific recommendations
        """
        print(f"\n{'='*70}")
        print(f"RESUME OPTIMIZATION (RAG-ENHANCED)")
        print(f"{'='*70}")

        role_type = target_analysis['role_type']

        # Step 1: RAG query for resume structure
        print(f"\n📋 Step 1: Resume structure optimization...")
        structure_advice = self._get_resume_structure_advice(role_type)

        # Step 2: RAG query for bullet strategies
        print(f"\n✏️ Step 2: Bullet point optimization strategies...")
        bullet_strategies = self._get_bullet_strategies(role_type)

        # Step 3: RAG query for achievement framing
        print(f"\n🏆 Step 3: Achievement framing guidance...")
        achievement_framing = self._get_achievement_framing(role_type)

        # Step 4: Generate recommendations
        print(f"\n💡 Step 4: Generating specific recommendations...")
        recommendations = self._generate_recommendations(
            current_resume=current_resume,
            target_analysis=target_analysis,
            structure_advice=structure_advice,
            bullet_strategies=bullet_strategies,
            achievement_framing=achievement_framing
        )

        print(f"\n{'='*70}")
        print(f"✅ Optimization complete!")
        print(f"{'='*70}")

        return {
            'structure_advice': structure_advice,
            'bullet_strategies': bullet_strategies,
            'achievement_framing': achievement_framing,
            'specific_recommendations': recommendations,
            'positioning_summary': target_analysis['positioning']['summary']
        }

    # =====================================================================
    # COVER LETTER (RAG-ENHANCED)
    # =====================================================================

    def create_cover_letter_strategy(self, target_analysis: Dict,
                                     candidate_story: str,
                                     company_name: str) -> Dict:
        """
        Create cover letter strategy using RAG insights

        Args:
            target_analysis: Analysis from analyze_target_role()
            candidate_story: Candidate's career narrative
            company_name: Target company name

        Returns:
            Cover letter strategy and template
        """
        print(f"\n{'='*70}")
        print(f"COVER LETTER STRATEGY (RAG-ENHANCED)")
        print(f"{'='*70}")

        tone = target_analysis['tone']
        role_type = target_analysis['role_type']

        # Step 1: Cover letter best practices
        print(f"\n📝 Step 1: Cover letter best practices...")
        cl_best_practices = self._get_cover_letter_best_practices(tone, role_type)

        # Step 2: Storytelling strategies
        print(f"\n📖 Step 2: Narrative and storytelling strategies...")
        storytelling = self._get_storytelling_strategies(role_type)

        # Step 3: Opening hooks
        print(f"\n🎣 Step 3: High-impact opening hooks...")
        opening_strategies = self._get_opening_hook_strategies(tone)

        # Compile strategy
        strategy = self._compile_cover_letter_strategy(
            best_practices=cl_best_practices,
            storytelling=storytelling,
            opening=opening_strategies,
            tone=tone,
            role_type=role_type,
            company_name=company_name
        )

        print(f"\n{'='*70}")
        print(f"✅ Strategy complete!")
        print(f"{'='*70}")

        return strategy

    # =====================================================================
    # INTERVIEW PREPARATION (RAG-ENHANCED)
    # =====================================================================

    def prepare_interview_strategy(self, target_analysis: Dict,
                                   candidate_background: str) -> Dict:
        """
        Create interview preparation strategy using RAG

        Args:
            target_analysis: Analysis from analyze_target_role()
            candidate_background: Candidate background

        Returns:
            Interview strategy with STAR stories and prep guide
        """
        print(f"\n{'='*70}")
        print(f"INTERVIEW PREPARATION (RAG-ENHANCED)")
        print(f"{'='*70}")

        role_type = target_analysis['role_type']

        # Step 1: Common interview questions
        print(f"\n❓ Step 1: Common questions for {role_type}...")
        common_questions = self._get_common_interview_questions(role_type)

        # Step 2: STAR method guidance
        print(f"\n⭐ Step 2: STAR method best practices...")
        star_guidance = self._get_star_method_guidance()

        # Step 3: Behavioral competencies
        print(f"\n🧠 Step 3: Key behavioral competencies...")
        behavioral_competencies = self._get_behavioral_competencies(role_type)

        # Step 4: Compile strategy
        strategy = self._compile_interview_strategy(
            common_questions=common_questions,
            star_guidance=star_guidance,
            behavioral_competencies=behavioral_competencies,
            role_type=role_type
        )

        print(f"\n{'='*70}")
        print(f"✅ Interview prep complete!")
        print(f"{'='*70}")

        return strategy

    # =====================================================================
    # RAG-POWERED HELPER METHODS
    # =====================================================================

    def _get_resume_best_practices(self, role_type: str, is_deputy: bool) -> Dict:
        """RAG query for resume best practices"""
        if not self.rag.is_ready():
            return {'advice': 'RAG not available', 'sources': []}

        deputy_context = " for deputy/operational roles" if is_deputy else ""

        query = f"""
        Resume best practices and strategies for {role_type} roles{deputy_context}.
        Include: structure, bullet point strategies, achievement framing,
        language patterns, and common mistakes to avoid.
        """
        result = self.rag.ask(query, k=6, show_sources=True)

        if result:
            return {
                'advice': result['answer'],
                'sources': [s['source'] for s in result.get('sources', [])]
            }
        return {'advice': 'No advice available', 'sources': []}

    def _get_positioning_strategy(self, role_type: str, is_deputy: bool,
                                  tone: str) -> Dict:
        """RAG query for positioning strategies"""
        if not self.rag.is_ready():
            return {'strategy': 'RAG not available', 'summary': 'RAG not available'}

        query = f"""
        How should a candidate position themselves for a {role_type} role?
        Include: key competencies to emphasize, language patterns, tone
        ({tone}), and differentiation strategies.
        """
        result = self.rag.ask(query, k=5, show_sources=False)

        if result:
            return {
                'strategy': result['answer'],
                'summary': result['answer'][:200] + '...'
            }
        return {'strategy': 'No strategy available', 'summary': 'N/A'}

    def _get_language_patterns(self, role_type: str, is_deputy: bool) -> Dict:
        """RAG query for language patterns"""
        if not self.rag.is_ready():
            return {'guidance': 'RAG not available'}

        query = f"""
        What language patterns and power verbs are most effective for
        {role_type} positions? Include action verbs, framing strategies,
        and tone guidance.
        """
        result = self.rag.ask(query, k=4, show_sources=False)

        if result:
            return {'guidance': result['answer']}
        return {'guidance': 'No guidance available'}

    def _get_success_examples(self, role_type: str) -> Dict:
        """RAG query for success stories"""
        if not self.rag.is_ready():
            return {'examples': 'RAG not available', 'sources': []}

        query = f"""
        Success stories and examples of high-performing professionals in
        {role_type} roles. What makes them successful? What competencies
        and achievements do they demonstrate?
        """
        result = self.rag.ask(query, k=5, show_sources=True)

        if result:
            return {
                'examples': result['answer'],
                'sources': [s['source'] for s in result.get('sources', [])]
            }
        return {'examples': 'No examples available', 'sources': []}

    def _get_resume_structure_advice(self, role_type: str) -> str:
        """RAG query for resume structure"""
        if not self.rag.is_ready():
            return 'RAG not available'

        query = f"""
        Best practices for resume structure and organization for {role_type}
        roles. Include section order, content priorities, and formatting.
        """
        result = self.rag.ask(query, k=4, show_sources=False)
        return result['answer'] if result else 'No advice available'

    def _get_bullet_strategies(self, role_type: str) -> str:
        """RAG query for bullet strategies"""
        if not self.rag.is_ready():
            return 'RAG not available'

        query = f"""
        Strategies for writing effective resume bullet points for {role_type}
        roles. Include the Action-Scope-Outcome formula, metric usage, and
        impact framing.
        """
        result = self.rag.ask(query, k=4, show_sources=False)
        return result['answer'] if result else 'No strategies available'

    def _get_achievement_framing(self, role_type: str) -> str:
        """RAG query for achievement framing"""
        if not self.rag.is_ready():
            return 'RAG not available'

        query = f"""
        How to frame professional achievements and accomplishments for
        {role_type} roles to maximize impact and demonstrate value.
        """
        result = self.rag.ask(query, k=4, show_sources=False)
        return result['answer'] if result else 'No framing advice available'

    def _get_cover_letter_best_practices(self, tone: str, role_type: str) -> str:
        """RAG query for cover letter best practices"""
        if not self.rag.is_ready():
            return 'RAG not available'

        query = f"""
        Cover letter best practices for {role_type} roles with {tone} tone.
        Include structure, storytelling, hooks, and closing strategies.
        """
        result = self.rag.ask(query, k=5, show_sources=False)
        return result['answer'] if result else 'No best practices available'

    def _get_storytelling_strategies(self, role_type: str) -> str:
        """RAG query for storytelling"""
        if not self.rag.is_ready():
            return 'RAG not available'

        query = f"""
        Storytelling and narrative strategies for career positioning in
        {role_type} cover letters. How to connect career dots and demonstrate fit.
        """
        result = self.rag.ask(query, k=4, show_sources=False)
        return result['answer'] if result else 'No storytelling strategies available'

    def _get_opening_hook_strategies(self, tone: str) -> str:
        """RAG query for opening hooks"""
        if not self.rag.is_ready():
            return 'RAG not available'

        query = f"""
        High-impact opening strategies for cover letters with {tone} tone.
        Avoid clichés and create memorable first impressions.
        """
        result = self.rag.ask(query, k=3, show_sources=False)
        return result['answer'] if result else 'No hook strategies available'

    def _get_common_interview_questions(self, role_type: str) -> str:
        """RAG query for interview questions"""
        if not self.rag.is_ready():
            return 'RAG not available'

        query = f"""
        Common interview questions for {role_type} roles and how to
        answer them effectively. Include behavioral, situational, and
        technical questions.
        """
        result = self.rag.ask(query, k=6, show_sources=False)
        return result['answer'] if result else 'No questions available'

    def _get_star_method_guidance(self) -> str:
        """RAG query for STAR method"""
        if not self.rag.is_ready():
            return 'RAG not available'

        query = """
        STAR method (Situation, Task, Action, Result) best practices for
        interview preparation. Include examples and common mistakes.
        """
        result = self.rag.ask(query, k=4, show_sources=False)
        return result['answer'] if result else 'No STAR guidance available'

    def _get_behavioral_competencies(self, role_type: str) -> str:
        """RAG query for behavioral competencies"""
        if not self.rag.is_ready():
            return 'RAG not available'

        query = f"""
        Key behavioral competencies and soft skills required for success
        in {role_type} roles. Include leadership, communication, and
        problem-solving skills.
        """
        result = self.rag.ask(query, k=5, show_sources=False)
        return result['answer'] if result else 'No competencies available'

    # =====================================================================
    # HELPER METHODS
    # =====================================================================

    def _classify_role(self, jd_text: str, role_title: str) -> str:
        """Classify role type"""
        title_lower = role_title.lower()

        if any(w in title_lower for w in ['chief', 'c-suite', 'vp', 'vice president', 'director']):
            return 'Strategic/Executive'
        elif any(w in title_lower for w in ['manager', 'lead']):
            return 'Operational/Management'
        elif any(w in title_lower for w in ['compliance', 'deputy', 'audit']):
            return 'Compliance/Deputy'
        else:
            return 'Specialist/IC'

    def _generate_recommendations(self, **kwargs) -> str:
        """Generate specific recommendations"""
        return f"""
Based on RAG-powered analysis:

STRUCTURE:
{kwargs['structure_advice'][:300]}...

BULLET STRATEGIES:
{kwargs['bullet_strategies'][:300]}...

ACHIEVEMENT FRAMING:
{kwargs['achievement_framing'][:300]}...

TOP RECOMMENDATIONS:
1. Align positioning with {kwargs['target_analysis']['role_type']} expectations
2. Use language patterns from best practices
3. Emphasize success factors from research
4. Match tone: {kwargs['target_analysis']['tone']}
"""

    def _compile_cover_letter_strategy(self, **kwargs) -> Dict:
        """Compile cover letter strategy"""
        return {
            'best_practices': kwargs['best_practices'],
            'storytelling': kwargs['storytelling'],
            'opening_strategies': kwargs['opening'],
            'template_guidance': f"""
RAG-ENHANCED COVER LETTER STRATEGY:

Tone: {kwargs['tone'].upper()}
Role Type: {kwargs['role_type']}
Company: {kwargs['company_name']}

OPENING HOOK:
{kwargs['opening'][:200]}...

STORYTELLING:
{kwargs['storytelling'][:200]}...

BEST PRACTICES:
{kwargs['best_practices'][:300]}...
"""
        }

    def _compile_interview_strategy(self, **kwargs) -> Dict:
        """Compile interview strategy"""
        return {
            'common_questions': kwargs['common_questions'],
            'star_guidance': kwargs['star_guidance'],
            'behavioral_competencies': kwargs['behavioral_competencies'],
            'prep_summary': f"""
RAG-ENHANCED INTERVIEW PREP:

Role Type: {kwargs['role_type']}

COMMON QUESTIONS:
{kwargs['common_questions'][:300]}...

STAR METHOD:
{kwargs['star_guidance'][:200]}...

KEY COMPETENCIES:
{kwargs['behavioral_competencies'][:200]}...
"""
        }


# =========================================================================
# QUICK TEST
# =========================================================================

if __name__ == "__main__":
    kyle = Kyle()

    sample_jd = """
    Deputy VPHR - Strategic Human Capital Partner
    We are seeking a strategic deputy to support our VP of Human Resources.
    """

    # Test analysis
    analysis = kyle.analyze_target_role(
        jd_text=sample_jd,
        role_title="Deputy VPHR"
    )

    print(f"\n📊 ROLE ANALYSIS:")
    print(f"Role Type: {analysis['role_type']}")
    print(f"Deputy: {analysis['is_deputy']}")
    print(f"Tone: {analysis['tone']}")
    print(f"\nPositioning Strategy:")
    print(analysis['positioning']['summary'])
