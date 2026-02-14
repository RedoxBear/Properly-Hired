#!/usr/bin/env python3
"""
Simon Enhanced - Recruiting & HR Resources Expert
Locked in with deep knowledge from H02 - Recruiting and H04 - HR Resources

Key Enhancements:
- Focused RAG queries on recruiting best practices
- Access to 100+ HR and recruiting resources
- Domain expertise in talent acquisition and HR operations
"""
import sys
from pathlib import Path
from typing import Dict, List, Optional, Callable

# Add parent directory for rag_client
sys.path.insert(0, str(Path(__file__).parent.parent))
from rag_client import RAGClient


class SimonEnhanced:
    """
    Simon - The Recruiting & HR Resources Expert

    Specialized knowledge domains:
    - H02 - Recruiting (primary expertise)
    - H04 - HR Resources (secondary expertise)
    - Talent acquisition strategies
    - Candidate assessment
    - HR best practices
    """

    def __init__(self, llm_provider: Optional[str] = None, search_tool: Optional[Callable] = None):
        """
        Initialize Simon with specialized recruiting expertise

        Args:
            llm_provider: LLM provider (claude, openai, gemini, ollama)
            search_tool: Optional web search tool for company research (callable that takes query string)
        """
        self.name = "Simon (Recruiting & HR Expert)"
        self.rag = RAGClient(llm_provider=llm_provider)
        self.search_tool = search_tool

        # Simon's specialized domains
        self.expertise_domains = [
            "Recruiting best practices",
            "Talent acquisition strategies",
            "Candidate assessment",
            "HR operations",
            "Hiring patterns",
            "Interview techniques",
            "Ghost-job detection",
            "Company research"
        ]

        # Check RAG readiness
        if self.rag.is_ready():
            print(f"✓ {self.name} initialized")
            print(f"  → Expert access to Recruiting & HR knowledge base")
            print(f"  → Specialized in: {', '.join(self.expertise_domains)}")
            if self.search_tool:
                print(f"  → Web search enabled for company research")
        else:
            print(f"⚠ {self.name} initialized WITHOUT RAG")
            print(f"  Run: cd /mnt/f/Projects/AI_Projects/rag-system && python ingest.py")

    # =====================================================================
    # RECRUITING EXPERTISE - DOMAIN-FOCUSED RAG QUERIES
    # =====================================================================

    def get_recruiting_best_practices(self, role_type: str, experience_level: str = "senior") -> Dict:
        """
        Get recruiting best practices from H02 knowledge base

        Args:
            role_type: Type of role (e.g., "HR Manager", "Software Engineer")
            experience_level: Career level (junior, mid, senior, executive)

        Returns:
            Dict with recruiting strategies, assessment criteria, and sources
        """
        print(f"\n🎯 [SIMON - RECRUITING EXPERT] Best practices for hiring {role_type}...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        query = f"""
        Recruiting and talent acquisition best practices for hiring {experience_level} {role_type} professionals.

        Focus on:
        - Candidate sourcing strategies
        - Assessment criteria and competencies
        - Interview question frameworks
        - Red flags and warning signs
        - Offer negotiation tactics
        - Time-to-hire optimization
        - Candidate experience best practices

        Include specific examples and frameworks.
        """

        result = self.rag.ask(query, k=8, show_sources=True)

        if result:
            sources = result.get('sources', [])
            # Filter for recruiting-specific sources
            recruiting_sources = [s for s in sources if any(term in s.get('source', '').lower()
                                  for term in ['recruit', 'hiring', 'talent', 'selection'])]

            return {
                'best_practices': result['answer'],
                'recruiting_specific_sources': [s['source'] for s in recruiting_sources],
                'all_sources': [s['source'] for s in sources],
                'confidence': 'HIGH' if len(recruiting_sources) >= 3 else 'MEDIUM'
            }

        return {'error': 'Query failed'}

    def get_candidate_assessment_criteria(self, role_type: str) -> Dict:
        """
        Get candidate assessment criteria and competencies

        Returns expert guidance on:
        - Technical competencies
        - Behavioral competencies
        - Cultural fit indicators
        - Assessment methods
        """
        print(f"\n✅ [SIMON - RECRUITING EXPERT] Assessment criteria for {role_type}...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        query = f"""
        Candidate assessment criteria and competency frameworks for {role_type} positions.

        Cover:
        - Core technical competencies
        - Behavioral competencies
        - Leadership and soft skills
        - Cultural fit indicators
        - Success factors and predictors
        - Assessment methods (behavioral interviews, case studies, etc.)
        - Scoring and evaluation frameworks

        Provide specific examples and rubrics.
        """

        result = self.rag.ask(query, k=6, show_sources=True)

        if result:
            return {
                'assessment_criteria': result['answer'],
                'sources': [s['source'] for s in result.get('sources', [])],
                'competency_framework': self._extract_competencies(result['answer'])
            }

        return {'error': 'Query failed'}

    def get_interview_question_frameworks(self, role_type: str, focus_areas: List[str] = None) -> Dict:
        """
        Get interview question frameworks from recruiting knowledge base

        Args:
            role_type: Target role type
            focus_areas: Specific areas to focus on (e.g., ['leadership', 'problem-solving'])

        Returns:
            Interview question frameworks and examples
        """
        print(f"\n❓ [SIMON - RECRUITING EXPERT] Interview questions for {role_type}...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        focus_text = f" with emphasis on {', '.join(focus_areas)}" if focus_areas else ""

        query = f"""
        Interview question frameworks and examples for {role_type} positions{focus_text}.

        Include:
        - Behavioral interview questions (STAR method)
        - Situational questions
        - Technical competency questions
        - Cultural fit questions
        - Red flag questions
        - Question sequences and follow-ups
        - Effective probing techniques

        Provide specific question examples with evaluation criteria.
        """

        result = self.rag.ask(query, k=7, show_sources=True)

        if result:
            return {
                'interview_frameworks': result['answer'],
                'question_bank': self._extract_questions(result['answer']),
                'sources': [s['source'] for s in result.get('sources', [])]
            }

        return {'error': 'Query failed'}

    def analyze_candidate_profile(self, candidate_background: str, target_role: str) -> Dict:
        """
        Analyze candidate profile against role requirements using HR knowledge

        Args:
            candidate_background: Candidate's background/resume summary
            target_role: Target role requirements

        Returns:
            Analysis with strengths, gaps, and assessment recommendations
        """
        print(f"\n🔍 [SIMON - RECRUITING EXPERT] Analyzing candidate fit for {target_role}...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        # Get success factors for role
        success_query = f"Success factors and key competencies for {target_role} roles"
        success_factors = self.rag.ask(success_query, k=5, show_sources=False)

        # Get common hiring mistakes
        mistakes_query = f"Common hiring mistakes and red flags when recruiting for {target_role}"
        hiring_mistakes = self.rag.ask(mistakes_query, k=4, show_sources=False)

        # Get assessment recommendations
        assessment_query = f"How to assess candidates for {target_role} positions effectively"
        assessment = self.rag.ask(assessment_query, k=5, show_sources=False)

        return {
            'success_factors': success_factors.get('answer', '') if success_factors else '',
            'hiring_mistakes_to_avoid': hiring_mistakes.get('answer', '') if hiring_mistakes else '',
            'assessment_recommendations': assessment.get('answer', '') if assessment else '',
            'analysis_summary': self._generate_candidate_analysis(
                success_factors, hiring_mistakes, candidate_background
            )
        }

    # =====================================================================
    # HR RESOURCES EXPERTISE - DOMAIN-FOCUSED RAG QUERIES
    # =====================================================================

    def get_hr_best_practices(self, topic: str) -> Dict:
        """
        Get HR best practices from H04 - HR Resources knowledge base

        Args:
            topic: HR topic (e.g., "onboarding", "performance management", "compensation")

        Returns:
            HR best practices and frameworks
        """
        print(f"\n📚 [SIMON - HR EXPERT] Best practices for {topic}...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        query = f"""
        HR best practices and frameworks for {topic}.

        Include:
        - Industry standards and benchmarks
        - Implementation strategies
        - Common challenges and solutions
        - Metrics and KPIs
        - Compliance considerations
        - Technology and tools

        Provide actionable guidance and examples.
        """

        result = self.rag.ask(query, k=6, show_sources=True)

        if result:
            sources = result.get('sources', [])
            hr_sources = [s for s in sources if any(term in s.get('source', '').lower()
                         for term in ['hr', 'human resource', 'people', 'talent'])]

            return {
                'best_practices': result['answer'],
                'hr_sources': [s['source'] for s in hr_sources],
                'frameworks': self._extract_frameworks(result['answer'])
            }

        return {'error': 'Query failed'}

    def get_compensation_benchmarks(self, role_type: str, location: str = None) -> Dict:
        """
        Get compensation and benefits benchmarks

        Args:
            role_type: Target role type
            location: Geographic location (optional)

        Returns:
            Compensation guidance and benchmarks
        """
        print(f"\n💰 [SIMON - HR EXPERT] Compensation benchmarks for {role_type}...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        location_text = f" in {location}" if location else ""

        query = f"""
        Compensation and benefits benchmarks for {role_type} positions{location_text}.

        Include:
        - Salary ranges by experience level
        - Total compensation packages
        - Benefits benchmarks
        - Equity and bonus structures
        - Market trends
        - Negotiation strategies

        Provide specific data and ranges.
        """

        result = self.rag.ask(query, k=6, show_sources=True)

        if result:
            return {
                'compensation_guidance': result['answer'],
                'sources': [s['source'] for s in result.get('sources', [])],
                'key_insights': self._extract_key_insights(result['answer'])
            }

        return {'error': 'Query failed'}

    def get_employer_branding_strategies(self, company_size: str = "mid-size") -> Dict:
        """
        Get employer branding and recruitment marketing strategies

        Args:
            company_size: Company size (startup, small, mid-size, enterprise)

        Returns:
            Employer branding strategies
        """
        print(f"\n🌟 [SIMON - HR EXPERT] Employer branding for {company_size} companies...")

        if not self.rag.is_ready():
            return {'error': 'RAG not available'}

        query = f"""
        Employer branding and recruitment marketing strategies for {company_size} companies.

        Include:
        - EVP (Employee Value Proposition) development
        - Recruitment marketing channels
        - Candidate experience optimization
        - Social media strategies
        - Career site best practices
        - Metrics and ROI measurement

        Provide specific tactics and examples.
        """

        result = self.rag.ask(query, k=6, show_sources=False)

        if result:
            return {
                'branding_strategies': result['answer'],
                'tactics': self._extract_tactics(result['answer'])
            }

        return {'error': 'Query failed'}

    # =====================================================================
    # COMPANY RESEARCH - ONLINE SEARCH INTEGRATION
    # =====================================================================

    def research_company_online(self, company_name: str, focus_areas: List[str] = None) -> Dict:
        """
        Research company using online search tool

        Args:
            company_name: Company name to research
            focus_areas: Specific areas to focus on (e.g., ['culture', 'layoffs', 'growth'])

        Returns:
            Company research summary from online sources
        """
        print(f"\n🔍 [SIMON - COMPANY RESEARCH] Researching {company_name} online...")

        if not self.search_tool:
            return {
                'error': 'No search tool available',
                'recommendation': 'Inject search_tool during initialization'
            }

        focus = focus_areas or ['culture', 'reviews', 'hiring', 'stability', 'news']

        search_results = {}
        for area in focus:
            query = f"{company_name} company {area} 2026"
            try:
                result = self.search_tool(query)
                search_results[area] = result
            except Exception as e:
                search_results[area] = f"Search failed: {str(e)}"

        return {
            'company': company_name,
            'search_results': search_results,
            'focus_areas_covered': focus,
            'timestamp': '2026-01-28'
        }

    def verify_job_posting_authenticity(self, company_name: str, role_title: str) -> Dict:
        """
        Verify job posting authenticity using online search

        Args:
            company_name: Company name
            role_title: Role title

        Returns:
            Authenticity verification results
        """
        print(f"\n✅ [SIMON - AUTHENTICITY CHECK] Verifying {role_title} at {company_name}...")

        if not self.search_tool:
            return {'warning': 'No search tool available for verification'}

        signals = {
            'positive_signals': [],
            'negative_signals': [],
            'neutral_signals': []
        }

        # Search for company + role
        try:
            company_search = self.search_tool(f"{company_name} hiring {role_title} 2026")
            signals['positive_signals'].append("Company appears in search results")
        except Exception as e:
            signals['negative_signals'].append(f"Company search failed: {str(e)}")

        # Search for layoffs/hiring freeze
        try:
            stability_search = self.search_tool(f"{company_name} layoffs hiring freeze 2026")
            # Analyze results (simplified - would need actual content analysis)
            signals['neutral_signals'].append("Checked recent company stability news")
        except Exception:
            pass

        return {
            'signals': signals,
            'verification_status': 'REQUIRES_MANUAL_REVIEW',
            'recommendation': 'Cross-reference with company career page and LinkedIn'
        }

    # =====================================================================
    # INTEGRATED JOB ANALYSIS - FULL RECRUITER PERSPECTIVE
    # =====================================================================

    def analyze_job_description_comprehensive(self, jd_text: str, company_name: str, role_title: str) -> Dict:
        """
        Comprehensive JD analysis with recruiting and HR expertise

        Args:
            jd_text: Full job description text
            company_name: Target company name
            role_title: Role title

        Returns:
            Complete recruiter analysis
        """
        print(f"\n📋 [SIMON - COMPREHENSIVE ANALYSIS] Analyzing {role_title} at {company_name}...")

        # Get recruiting best practices for this role type
        role_type = self._classify_role(role_title)
        recruiting_bp = self.get_recruiting_best_practices(role_type)

        # Get candidate assessment criteria
        assessment = self.get_candidate_assessment_criteria(role_type)

        # Get interview frameworks
        interviews = self.get_interview_question_frameworks(role_type)

        # Get HR best practices for hiring
        hr_hiring = self.get_hr_best_practices("talent acquisition and hiring")

        # Get compensation benchmarks
        compensation = self.get_compensation_benchmarks(role_type)

        # Analyze JD quality
        jd_quality = self._assess_jd_quality(jd_text)

        return {
            'role_classification': role_type,
            'recruiting_best_practices': recruiting_bp,
            'assessment_criteria': assessment,
            'interview_frameworks': interviews,
            'hr_hiring_practices': hr_hiring,
            'compensation_benchmarks': compensation,
            'jd_quality_assessment': jd_quality,
            'recruiter_brief': self._create_recruiter_brief(
                role_title, company_name, recruiting_bp, assessment, jd_quality
            ),
            'candidate_sourcing_strategy': self._create_sourcing_strategy(
                role_type, recruiting_bp
            )
        }

    # =====================================================================
    # GHOST-JOB DETECTION & OPPORTUNITY SCORING
    # =====================================================================

    def calculate_ghost_job_score(self, jd_text: str, company_name: str, role_title: str,
                                   posting_date: str = None, company_info: Dict = None) -> Dict:
        """
        Calculate probability that job posting is a "ghost job" (fake/not actively hiring)

        Ghost job indicators:
        - Vague job description
        - Missing key details (salary, reporting structure, team size)
        - Company in hiring freeze or recent layoffs
        - Posting has been up for 60+ days
        - Generic/templated language
        - No clear responsibilities or requirements

        Args:
            jd_text: Job description text
            company_name: Company name
            role_title: Role title
            posting_date: When job was posted (for age calculation)
            company_info: Optional company research data

        Returns:
            Dict with ghost_job_score (0-100), risk_level, and indicators
        """
        print(f"\n👻 [SIMON - GHOST JOB DETECTION] Analyzing {role_title} at {company_name}...")

        ghost_score = 0
        indicators = []
        positive_signals = []

        # 1. JD Quality Analysis (30 points)
        jd_quality = self._assess_jd_quality(jd_text)
        if jd_quality['quality_score'] < 50:
            ghost_score += 30
            indicators.append(f"Poor JD quality ({jd_quality['quality_score']}/100)")
        elif jd_quality['quality_score'] < 70:
            ghost_score += 15
            indicators.append(f"Fair JD quality ({jd_quality['quality_score']}/100)")
        else:
            positive_signals.append(f"Good JD quality ({jd_quality['quality_score']}/100)")

        # 2. Vagueness Detection (20 points)
        if len(jd_text) < 500:
            ghost_score += 20
            indicators.append("Very short JD (< 500 chars)")
        elif len(jd_text) < 800:
            ghost_score += 10
            indicators.append("Short JD (< 800 chars)")
        else:
            positive_signals.append("Detailed JD length")

        # 3. Missing Critical Information (30 points)
        missing_info = []
        if 'salary' not in jd_text.lower() and 'compensation' not in jd_text.lower():
            missing_info.append("salary/compensation")
            ghost_score += 10
        if 'reports to' not in jd_text.lower() and 'reporting' not in jd_text.lower():
            missing_info.append("reporting structure")
            ghost_score += 5
        if 'team' not in jd_text.lower():
            missing_info.append("team information")
            ghost_score += 5
        if 'responsibilities' not in jd_text.lower() and 'duties' not in jd_text.lower():
            missing_info.append("clear responsibilities")
            ghost_score += 10

        if missing_info:
            indicators.append(f"Missing: {', '.join(missing_info)}")
        else:
            positive_signals.append("All key information present")

        # 4. Generic/Template Language Detection (10 points)
        generic_phrases = [
            'fast-paced environment',
            'self-starter',
            'hit the ground running',
            'wear many hats',
            'competitive salary',
            'great benefits'
        ]
        generic_count = sum(1 for phrase in generic_phrases if phrase in jd_text.lower())
        if generic_count >= 4:
            ghost_score += 10
            indicators.append(f"Heavy use of generic phrases ({generic_count} found)")
        elif generic_count >= 2:
            ghost_score += 5
            indicators.append(f"Some generic phrases ({generic_count} found)")
        else:
            positive_signals.append("Minimal generic language")

        # 5. Company Research (10 points) - if available
        if company_info:
            if company_info.get('recent_layoffs'):
                ghost_score += 10
                indicators.append("Company had recent layoffs")
            if company_info.get('hiring_freeze'):
                ghost_score += 10
                indicators.append("Company in hiring freeze")
            if company_info.get('stable') == True:
                positive_signals.append("Company appears stable")

        # 6. RAG Knowledge Check - recruiting red flags
        if self.rag.is_ready():
            red_flags_query = "What are signs of fake job postings and ghost jobs?"
            red_flags = self.rag.ask(red_flags_query, k=3, show_sources=False)
            if red_flags and 'answer' in red_flags:
                # Store for reference but don't auto-score
                indicators.append("Reference: RAG knowledge on ghost job patterns available")

        # Calculate risk level
        if ghost_score >= 60:
            risk_level = "HIGH"
            recommendation = "AVOID - Strong indicators of ghost job"
        elif ghost_score >= 40:
            risk_level = "MEDIUM"
            recommendation = "PROCEED WITH CAUTION - Some red flags present"
        elif ghost_score >= 20:
            risk_level = "LOW"
            recommendation = "MONITOR - Minor concerns, likely legitimate"
        else:
            risk_level = "VERY LOW"
            recommendation = "PURSUE - Appears legitimate"

        return {
            'ghost_job_score': min(100, ghost_score),
            'risk_level': risk_level,
            'recommendation': recommendation,
            'indicators': indicators,
            'positive_signals': positive_signals,
            'jd_quality': jd_quality,
            'analysis_timestamp': '2026-01-28'
        }

    # =====================================================================
    # RECRUITMENT AGENCY DETECTION
    # =====================================================================

    def detect_recruitment_agency(self, jd_text: str, company_name: str) -> Dict:
        """
        Detect if a job posting is from a recruitment/staffing agency rather than a direct employer.

        Scoring breakdown (0-100):
        - Known agency name matching (40 pts)
        - JD language pattern detection (30 pts)
        - Company name keyword analysis (15 pts)
        - Missing direct employer detection (15 pts)

        Threshold: confidence >= 50 = agency posting

        Args:
            jd_text: Full job description text
            company_name: Company/poster name

        Returns:
            Dict with is_recruitment_agency, agency_confidence, agency_signals, agency_name
        """
        import re
        print(f"\n🏢 [SIMON - AGENCY DETECTION] Checking if '{company_name}' is a recruitment agency...")

        confidence = 0
        signals = []
        detected_agency_name = ""

        company_lower = company_name.lower().strip()
        jd_lower = jd_text.lower()

        # 1. Known agency name matching (40 pts)
        known_agencies = [
            "robert half", "randstad", "hays", "adecco", "manpowergroup", "manpower",
            "kelly services", "michael page", "kforce", "teksystems", "tek systems",
            "insight global", "aerotek", "page group", "pagegroup", "staffing",
            "spencer stuart", "korn ferry", "russell reynolds", "egon zehnder",
            "hudson", "antal", "reed", "modis", "experis", "jefferson frank",
            "nigel frank", "frank recruitment", "harvey nash", "sthree", "s three",
            "heidrick & struggles", "heidrick and struggles", "talent solutions",
            "allegis group", "apex group", "apex systems", "spherion", "volt",
            "express employment", "staffmark", "trueblue", "true blue",
            "robert walters", "page personnel", "spring professional",
            "billion talent", "morgan mckinley", "walker hamill"
        ]

        for agency in known_agencies:
            if agency in company_lower:
                confidence += 40
                detected_agency_name = company_name
                signals.append(f"Company name matches known agency: {agency}")
                break

        # 2. JD language pattern detection (30 pts)
        agency_phrases = [
            (r'\bour client\b', "Uses phrase 'our client'"),
            (r'\bon behalf of\b', "Uses phrase 'on behalf of'"),
            (r'\bconfidential employer\b', "Uses phrase 'confidential employer'"),
            (r'\bundisclosed client\b', "Uses phrase 'undisclosed client'"),
            (r'\bconfidential company\b', "Uses phrase 'confidential company'"),
            (r'\bour customer\b', "Uses phrase 'our customer'"),
            (r'\bhiring for\b.*\bclient\b', "Hiring for a client"),
            (r'\bplaced with\b', "Uses placement language"),
            (r'\bcontract opportunity\b', "Uses 'contract opportunity'"),
            (r'\bw-?2\s+(contract|position|role)\b', "Uses W2 contract terminology"),
            (r'\bcorp.to.corp\b|c2c\b', "Uses corp-to-corp/C2C terminology"),
        ]

        phrase_score = 0
        for pattern, description in agency_phrases:
            if re.search(pattern, jd_lower):
                phrase_score += 10
                signals.append(description)

        confidence += min(30, phrase_score)

        # 3. Company name keyword analysis (15 pts)
        agency_keywords = [
            "staffing", "recruiting", "recruitment", "talent acquisition",
            "consulting group", "placement", "search firm", "headhunt",
            "employment agency", "employment services", "workforce solutions",
            "talent solutions", "human capital", "personnel"
        ]

        keyword_score = 0
        for keyword in agency_keywords:
            if keyword in company_lower or keyword in jd_lower[:500]:
                keyword_score += 8
                signals.append(f"Agency keyword detected: '{keyword}'")

        confidence += min(15, keyword_score)

        # 4. Missing direct employer detection (15 pts)
        employer_absent_patterns = [
            (r'\b(client|employer)\s+(name\s+)?(?:is\s+)?(?:confidential|undisclosed|not\s+disclosed|withheld)\b',
             "Employer name explicitly withheld"),
            (r'\bwe\s+are\s+(?:a|an)\s+(?:leading\s+)?(?:staffing|recruiting|recruitment|talent)',
             "Self-describes as staffing/recruitment agency"),
        ]

        for pattern, description in employer_absent_patterns:
            if re.search(pattern, jd_lower):
                confidence += 8
                signals.append(description)

        # Check if JD mentions "our client" but never names the actual employer
        if re.search(r'\bour client\b', jd_lower) and not re.search(r'\bour client[,:]?\s+[A-Z]', jd_text):
            confidence += 7
            signals.append("References 'our client' without naming the employer")

        confidence = min(100, confidence)
        is_agency = confidence >= 50

        result = {
            'is_recruitment_agency': is_agency,
            'agency_confidence': confidence,
            'agency_signals': signals,
            'agency_name': detected_agency_name
        }

        print(f"  → Agency: {is_agency} (confidence: {confidence}%)")
        if signals:
            for s in signals:
                print(f"  → {s}")

        return result

    # =====================================================================
    # BRIEF TO KYLE - COMPREHENSIVE OPPORTUNITY PACKAGE
    # =====================================================================

    def create_brief_to_kyle(self, jd_text: str, company_name: str, role_title: str,
                             candidate_background: str = None, posting_date: str = None) -> Dict:
        """
        Create comprehensive brief for Kyle with opportunity analysis and recommendation

        This is Simon's complete assessment package for Kyle to use when crafting
        application materials (CV, cover letter, etc.)

        Args:
            jd_text: Full job description text
            company_name: Company name
            role_title: Role title
            candidate_background: Optional candidate background for fit analysis
            posting_date: When job was posted

        Returns:
            Complete brief with analysis, ghost-job score, and recommendation
        """
        print(f"\n📋 [SIMON - BRIEF TO KYLE] Creating comprehensive brief for {role_title} at {company_name}...")

        # 1. Role Classification (enhanced)
        role_classification = self._classify_role_level(role_title)

        # 2. JD Quality Assessment
        jd_quality = self._assess_jd_quality(jd_text)

        # 3. Ghost Job Score
        ghost_job_analysis = self.calculate_ghost_job_score(
            jd_text, company_name, role_title, posting_date
        )

        # 3.5 Recruitment Agency Detection
        agency_detection = self.detect_recruitment_agency(jd_text, company_name)

        # 4. Company Research (if search tool available)
        company_research = None
        if self.search_tool:
            company_research = self.research_company_online(
                company_name,
                focus_areas=['culture', 'hiring', 'stability', 'reviews']
            )

        # 5. Recruiting Best Practices for this role
        recruiting_insights = None
        if self.rag.is_ready():
            recruiting_insights = self.get_recruiting_best_practices(
                role_classification['role_type'],
                role_classification['seniority_level']
            )

        # 6. Candidate Assessment Criteria
        assessment_criteria = None
        if self.rag.is_ready():
            assessment_criteria = self.get_candidate_assessment_criteria(
                role_classification['role_type']
            )

        # 7. Overall Recommendation
        recommendation = self._generate_kyle_recommendation(
            ghost_job_analysis,
            jd_quality,
            role_classification,
            company_research
        )

        # 8. Strategic Guidance for Kyle
        kyle_strategy = self._generate_kyle_strategy(
            role_classification,
            jd_quality,
            recruiting_insights,
            ghost_job_analysis,
            agency_detection
        )

        return {
            'brief_metadata': {
                'created_by': 'Simon (Recruiting & HR Expert)',
                'for': 'Kyle (CV & Cover Letter Expert)',
                'role_title': role_title,
                'company_name': company_name,
                'analysis_date': '2026-01-28'
            },
            'role_classification': role_classification,
            'jd_quality_assessment': jd_quality,
            'ghost_job_analysis': ghost_job_analysis,
            'agency_detection': agency_detection,
            'company_research': company_research,
            'recruiting_insights': recruiting_insights,
            'assessment_criteria': assessment_criteria,
            'overall_recommendation': recommendation,
            'strategy_for_kyle': kyle_strategy,
            'candidate_fit_analysis': self._analyze_candidate_fit(
                candidate_background, role_classification, assessment_criteria
            ) if candidate_background else None
        }

    # =====================================================================
    # HELPER METHODS
    # =====================================================================

    def _classify_role(self, role_title: str) -> str:
        """Classify role type (simple version for backward compatibility)"""
        return self._classify_role_level(role_title)['role_type']

    def _classify_role_level(self, role_title: str) -> Dict:
        """
        Enhanced role classification with nuanced tier detection

        Detects:
        - Deputy roles (deputy director, deputy manager)
        - Compliance tier (compliance officer, compliance manager)
        - Management tier (manager, senior manager, associate director)
        - Executive tier (director, VP, C-suite)
        - Individual contributor tier

        Returns:
            Dict with role_type, tier, is_deputy, is_compliance, seniority_level
        """
        import re
        title_lower = role_title.lower()

        # Deputy detection
        is_deputy = 'deputy' in title_lower or 'assistant' in title_lower

        # Compliance detection
        is_compliance = any(w in title_lower for w in ['compliance', 'regulatory', 'audit'])

        # Tier classification
        tier = None
        role_type = None
        seniority_level = None

        # Helper function for word boundary matching
        def has_word(text, word):
            """Check if word exists as a whole word (not substring)"""
            pattern = r'\b' + re.escape(word) + r'\b'
            return bool(re.search(pattern, text))

        # Executive tier (C-suite, VP, SVP, EVP) - use word boundaries
        if any(has_word(title_lower, w) for w in ['chief', 'ceo', 'cfo', 'cto', 'cio', 'coo', 'chro', 'cpo', 'cso']):
            tier = 'C-Suite Executive'
            role_type = 'Executive'
            seniority_level = 'executive'
        elif 'executive vice president' in title_lower or has_word(title_lower, 'evp'):
            tier = 'Executive VP'
            role_type = 'Executive'
            seniority_level = 'executive'
        elif 'senior vice president' in title_lower or has_word(title_lower, 'svp'):
            tier = 'Senior VP'
            role_type = 'Executive'
            seniority_level = 'executive'
        elif 'vice president' in title_lower or has_word(title_lower, 'vp'):
            tier = 'VP'
            role_type = 'Executive'
            seniority_level = 'executive'

        # Director tier
        elif 'director' in title_lower:
            if 'senior' in title_lower or 'sr.' in title_lower:
                tier = 'Senior Director'
                seniority_level = 'senior director'
            elif 'associate' in title_lower:
                tier = 'Associate Director'
                seniority_level = 'associate director'
            else:
                tier = 'Director'
                seniority_level = 'director'
            role_type = 'Director'

        # Manager tier
        elif any(w in title_lower for w in ['manager', 'mgr']):
            if 'senior' in title_lower or 'sr.' in title_lower:
                tier = 'Senior Manager'
                seniority_level = 'senior manager'
            elif 'associate' in title_lower:
                tier = 'Associate Manager'
                seniority_level = 'associate manager'
            else:
                tier = 'Manager'
                seniority_level = 'manager'
            role_type = 'Manager'

        # Lead/Principal tier
        elif any(w in title_lower for w in ['lead', 'principal', 'staff']):
            if 'principal' in title_lower:
                tier = 'Principal'
                seniority_level = 'principal'
            elif 'staff' in title_lower:
                tier = 'Staff'
                seniority_level = 'staff'
            else:
                tier = 'Lead'
                seniority_level = 'lead'
            role_type = 'Senior Professional'

        # Senior IC tier
        elif any(w in title_lower for w in ['senior', 'sr.', 'sr ']):
            tier = 'Senior'
            role_type = 'Senior Professional'
            seniority_level = 'senior'

        # Mid-level IC tier
        elif any(w in title_lower for w in ['mid', 'intermediate', 'ii', ' ii']):
            tier = 'Mid-Level'
            role_type = 'Professional'
            seniority_level = 'mid'

        # Junior IC tier
        elif any(w in title_lower for w in ['junior', 'jr.', 'jr ', 'associate', 'entry']):
            tier = 'Junior'
            role_type = 'Professional'
            seniority_level = 'junior'

        # Default IC tier
        else:
            tier = 'Professional'
            role_type = 'Professional'
            seniority_level = 'mid'

        # Adjust for deputy roles
        if is_deputy:
            tier = f"Deputy {tier}"

        # Adjust for compliance roles
        if is_compliance:
            tier = f"Compliance - {tier}"

        return {
            'role_type': role_type,
            'tier': tier,
            'seniority_level': seniority_level,
            'is_deputy': is_deputy,
            'is_compliance': is_compliance,
            'original_title': role_title
        }

    def _extract_competencies(self, text: str) -> List[str]:
        """Extract competencies from text"""
        competencies = []
        # Look for competency patterns
        import re
        patterns = [
            r'competenc(?:y|ies)[:\s]+(.{20,100})',
            r'skill[s]?[:\s]+(.{20,100})',
            r'requirement[s]?[:\s]+(.{20,100})'
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            competencies.extend(matches)
        return list(set(competencies))[:10]

    def _extract_questions(self, text: str) -> List[str]:
        """Extract interview questions from text"""
        questions = []
        lines = text.split('\n')
        for line in lines:
            # Look for lines ending with '?'
            if '?' in line and len(line) > 20:
                questions.append(line.strip())
        return questions[:15]

    def _extract_frameworks(self, text: str) -> List[str]:
        """Extract frameworks from text"""
        frameworks = []
        lines = text.split('\n')
        for line in lines:
            if any(word in line.lower() for word in ['framework', 'model', 'approach', 'methodology']):
                frameworks.append(line.strip())
        return frameworks[:5]

    def _extract_key_insights(self, text: str) -> List[str]:
        """Extract key insights from text"""
        insights = []
        lines = text.split('\n')
        for line in lines:
            if line.strip().startswith(('•', '-', '*', '1.', '2.', '3.')):
                insights.append(line.strip())
        return insights[:10]

    def _extract_tactics(self, text: str) -> List[str]:
        """Extract tactics from text"""
        return self._extract_key_insights(text)  # Similar extraction

    def _generate_candidate_analysis(self, success_factors, hiring_mistakes, candidate_bg: str) -> str:
        """Generate candidate analysis summary"""
        return f"""
CANDIDATE ANALYSIS SUMMARY:

Success Factors for Role:
{(success_factors.get('answer', '')[:300] + '...') if success_factors else 'N/A'}

Hiring Mistakes to Avoid:
{(hiring_mistakes.get('answer', '')[:300] + '...') if hiring_mistakes else 'N/A'}

ASSESSMENT RECOMMENDATIONS:
1. Evaluate against key success factors
2. Watch for common red flags
3. Use behavioral interview techniques
4. Assess cultural fit
5. Verify claims with specific examples
"""

    def _assess_jd_quality(self, jd_text: str) -> Dict:
        """Assess job description quality"""
        score = 100
        issues = []
        strengths = []

        # Length check
        if len(jd_text) < 500:
            score -= 20
            issues.append("JD is too short (< 500 chars)")
        elif len(jd_text) > 1500:
            score -= 0
            strengths.append("Comprehensive JD length")

        # Structure checks
        if 'responsibilities' in jd_text.lower() or 'duties' in jd_text.lower():
            strengths.append("Clear responsibilities section")
        else:
            score -= 15
            issues.append("Missing clear responsibilities")

        if 'qualifications' in jd_text.lower() or 'requirements' in jd_text.lower():
            strengths.append("Clear qualifications section")
        else:
            score -= 15
            issues.append("Missing qualifications section")

        # Compensation
        if 'salary' in jd_text.lower() or 'compensation' in jd_text.lower():
            strengths.append("Mentions compensation")
        else:
            score -= 10
            issues.append("No compensation information")

        # Reporting structure
        if 'reports to' in jd_text.lower():
            strengths.append("Clear reporting structure")
        else:
            score -= 10
            issues.append("Unclear reporting structure")

        quality = "Excellent" if score >= 85 else "Good" if score >= 70 else "Fair" if score >= 50 else "Poor"

        return {
            'quality_score': max(0, score),
            'quality_rating': quality,
            'strengths': strengths,
            'issues': issues
        }

    def _create_recruiter_brief(self, role_title, company, recruiting_bp, assessment, jd_quality) -> str:
        """Create recruiter brief"""
        return f"""
RECRUITER BRIEF - {role_title} at {company}

JD QUALITY: {jd_quality.get('quality_rating', 'N/A')} ({jd_quality.get('quality_score', 0)}/100)

RECRUITING APPROACH:
{(recruiting_bp.get('best_practices', '')[:400] + '...') if recruiting_bp.get('best_practices') else 'N/A'}

ASSESSMENT FOCUS:
{(assessment.get('assessment_criteria', '')[:400] + '...') if assessment.get('assessment_criteria') else 'N/A'}

KEY ACTIONS:
1. Source candidates with proven track record
2. Assess against competency framework
3. Use behavioral interview techniques
4. Evaluate cultural fit
5. Verify references thoroughly
"""

    def _create_sourcing_strategy(self, role_type, recruiting_bp) -> Dict:
        """Create candidate sourcing strategy"""
        return {
            'sourcing_channels': [
                'LinkedIn (primary)',
                'Industry-specific job boards',
                'Professional associations',
                'Employee referrals',
                'Recruiting agencies (if needed)'
            ],
            'target_profiles': f"{role_type} professionals with 5+ years experience",
            'key_competencies': "Based on recruiting best practices analysis",
            'timeline': {
                'sourcing': '1-2 weeks',
                'screening': '1 week',
                'interviews': '2-3 weeks',
                'offer_to_hire': '1-2 weeks',
                'total': '5-8 weeks'
            }
        }

    def _generate_kyle_recommendation(self, ghost_job_analysis, jd_quality, role_classification, company_research) -> Dict:
        """Generate overall recommendation for Kyle"""

        # Decision logic
        ghost_score = ghost_job_analysis['ghost_job_score']
        jd_score = jd_quality['quality_score']

        if ghost_score >= 60:
            decision = "DO NOT PURSUE"
            priority = "SKIP"
            reasoning = "High probability of ghost job - not worth the effort"
        elif ghost_score >= 40:
            if jd_score >= 70:
                decision = "PROCEED WITH CAUTION"
                priority = "LOW"
                reasoning = "Mixed signals - good JD but some red flags. Apply if time permits."
            else:
                decision = "SKIP"
                priority = "SKIP"
                reasoning = "Multiple red flags and poor JD quality - likely not a real opportunity"
        elif ghost_score >= 20:
            if jd_score >= 70:
                decision = "PURSUE"
                priority = "MEDIUM"
                reasoning = "Legitimate opportunity with good JD quality - worth pursuing"
            else:
                decision = "CONSIDER"
                priority = "LOW"
                reasoning = "Likely legitimate but JD quality is concerning - proceed if interested"
        else:
            if jd_score >= 85:
                decision = "STRONGLY PURSUE"
                priority = "HIGH"
                reasoning = "Excellent opportunity - high quality JD, low ghost job risk"
            elif jd_score >= 70:
                decision = "PURSUE"
                priority = "MEDIUM"
                reasoning = "Good opportunity - appears legitimate with decent JD quality"
            else:
                decision = "PURSUE"
                priority = "MEDIUM"
                reasoning = "Appears legitimate but JD could be stronger"

        return {
            'decision': decision,
            'priority': priority,
            'reasoning': reasoning,
            'ghost_job_risk': ghost_job_analysis['risk_level'],
            'jd_quality_rating': jd_quality['quality_rating'],
            'confidence': 'HIGH' if abs(ghost_score - 50) > 30 else 'MEDIUM'
        }

    def _generate_kyle_strategy(self, role_classification, jd_quality, recruiting_insights, ghost_job_analysis, agency_detection=None) -> Dict:
        """Generate strategic guidance for Kyle on how to approach this application"""

        strategy = {
            'approach': '',
            'cv_emphasis': [],
            'cover_letter_emphasis': [],
            'tone_recommendation': '',
            'key_talking_points': [],
            'warnings': [],
            'is_agency_posting': False,
            'agency_strategy': None
        }

        # Approach based on role tier
        tier = role_classification['tier']
        if 'Executive' in tier or 'Director' in tier:
            strategy['approach'] = "Executive positioning - emphasize leadership, strategy, and impact"
            strategy['tone_recommendation'] = "Authoritative and strategic"
        elif 'Manager' in tier:
            strategy['approach'] = "Management positioning - balance leadership and execution"
            strategy['tone_recommendation'] = "Professional and results-oriented"
        else:
            strategy['approach'] = "Professional positioning - emphasize expertise and contributions"
            strategy['tone_recommendation'] = "Professional and enthusiastic"

        # CV emphasis
        if role_classification['seniority_level'] in ['executive', 'director', 'senior director']:
            strategy['cv_emphasis'] = [
                "Strategic leadership examples",
                "Quantified business impact",
                "Change management and transformation",
                "Executive presence and stakeholder management"
            ]
        elif role_classification['seniority_level'] in ['manager', 'senior manager']:
            strategy['cv_emphasis'] = [
                "Team leadership and development",
                "Project/program management",
                "Process improvement and efficiency gains",
                "Cross-functional collaboration"
            ]
        else:
            strategy['cv_emphasis'] = [
                "Technical expertise and skills",
                "Project contributions and outcomes",
                "Problem-solving examples",
                "Professional growth and learning"
            ]

        # Cover letter emphasis
        strategy['cover_letter_emphasis'] = [
            "Alignment with role requirements",
            "Enthusiasm for the opportunity",
            "Relevant experience highlights",
            "Cultural fit indicators"
        ]

        # Key talking points from recruiting insights
        if recruiting_insights and 'best_practices' in recruiting_insights:
            strategy['key_talking_points'].append("Address key competencies from recruiting best practices")

        # Warnings based on ghost job analysis
        if ghost_job_analysis['ghost_job_score'] >= 40:
            strategy['warnings'].append(
                f"Ghost job risk: {ghost_job_analysis['risk_level']} - "
                f"Consider tailoring application effort accordingly"
            )

        if jd_quality['quality_score'] < 60:
            strategy['warnings'].append(
                "Poor JD quality - may need to make assumptions about role requirements"
            )

        # Agency-aware adjustments
        if agency_detection and agency_detection.get('is_recruitment_agency') and agency_detection.get('agency_confidence', 0) >= 50:
            strategy['is_agency_posting'] = True
            strategy['agency_strategy'] = {
                'agency_name': agency_detection.get('agency_name', ''),
                'recommendation': 'Send brief recruiter outreach message instead of formal cover letter',
                'approach': [
                    'Connect with recruiter on LinkedIn',
                    'Ask qualifying questions: client name, salary range, contract vs permanent, exclusivity',
                    'Highlight 3-4 top matching skills concisely',
                    'Keep messaging under 200 words'
                ]
            }
            strategy['cover_letter_emphasis'] = [
                "Brief recruiter intro message (NOT formal cover letter)",
                "Top 3-4 matching skills for the role",
                "Qualifying questions for the recruiter",
                "LinkedIn connection suggestion"
            ]
            strategy['warnings'].append(
                f"Agency posting detected (confidence: {agency_detection['agency_confidence']}%) - "
                "de-emphasize formal cover letter, use recruiter outreach approach"
            )

        return strategy

    def _analyze_candidate_fit(self, candidate_bg, role_classification, assessment_criteria) -> Dict:
        """Analyze candidate fit for the role"""
        if not candidate_bg:
            return None

        # Use RAG to analyze fit if available
        if self.rag.is_ready() and assessment_criteria:
            fit_query = f"""
            Analyze candidate fit for {role_classification['tier']} role.

            Candidate Background:
            {candidate_bg[:500]}

            Assessment Criteria:
            {str(assessment_criteria)[:500]}

            Provide:
            1. Strengths alignment
            2. Potential gaps
            3. Fit score (0-100)
            """

            fit_analysis = self.rag.ask(fit_query, k=4, show_sources=False)

            return {
                'analysis': fit_analysis.get('answer', '') if fit_analysis else 'Analysis unavailable',
                'role_level_match': role_classification['seniority_level'],
                'assessment_criteria_available': True
            }

        return {
            'analysis': 'Candidate background provided but detailed analysis unavailable',
            'role_level_match': role_classification['seniority_level'],
            'assessment_criteria_available': False
        }


# =========================================================================
# QUICK TEST
# =========================================================================

if __name__ == "__main__":
    # Example: Simple web search function for testing
    def mock_search(query: str) -> str:
        return f"Mock search results for: {query}"

    simon = SimonEnhanced(search_tool=mock_search)

    # Test 1: Enhanced role classification
    print("\n" + "="*70)
    print("TEST 1: Enhanced Role Classification")
    print("="*70)
    test_roles = [
        "Deputy Director of Compliance",
        "Senior HR Manager",
        "Chief Technology Officer",
        "Compliance Officer",
        "Assistant Vice President, HR"
    ]
    for role in test_roles:
        classification = simon._classify_role_level(role)
        print(f"\n{role}:")
        print(f"  → Type: {classification['role_type']}")
        print(f"  → Tier: {classification['tier']}")
        print(f"  → Seniority: {classification['seniority_level']}")
        print(f"  → Deputy: {classification['is_deputy']}")
        print(f"  → Compliance: {classification['is_compliance']}")

    # Test 2: Ghost job detection
    print("\n" + "="*70)
    print("TEST 2: Ghost Job Detection")
    print("="*70)
    sample_jd = """
    We are looking for a passionate self-starter to join our fast-paced team.
    You will wear many hats and hit the ground running.
    Competitive salary and great benefits offered.
    """
    ghost_analysis = simon.calculate_ghost_job_score(
        sample_jd,
        "TechCorp",
        "Senior HR Manager"
    )
    print(f"\nGhost Job Score: {ghost_analysis['ghost_job_score']}/100")
    print(f"Risk Level: {ghost_analysis['risk_level']}")
    print(f"Recommendation: {ghost_analysis['recommendation']}")
    print(f"\nRed Flags:")
    for indicator in ghost_analysis['indicators']:
        print(f"  ⚠ {indicator}")
    print(f"\nPositive Signals:")
    for signal in ghost_analysis['positive_signals']:
        print(f"  ✓ {signal}")

    # Test 3: Brief to Kyle
    print("\n" + "="*70)
    print("TEST 3: Brief to Kyle")
    print("="*70)
    better_jd = """
    Senior HR Manager - TechCorp Inc.

    Reports to: CHRO

    About the Role:
    We are seeking an experienced Senior HR Manager to lead our talent acquisition
    and employee relations initiatives. You will manage a team of 5 HR professionals
    and work closely with department heads across the organization.

    Key Responsibilities:
    - Lead talent acquisition strategy and execution
    - Manage employee relations and conflict resolution
    - Develop and implement HR policies and procedures
    - Oversee performance management processes
    - Partner with leadership on organizational development

    Qualifications:
    - 8+ years of HR experience, with 3+ years in management
    - Strong knowledge of employment law and HR best practices
    - Experience with HRIS systems (Workday preferred)
    - Bachelor's degree in HR or related field; SHRM-CP/SCP preferred
    - Excellent communication and leadership skills

    Compensation: $120,000 - $150,000 base + bonus + equity
    Benefits: Full health/dental/vision, 401k match, unlimited PTO

    Team: Join our 50-person HR department serving 2,000+ employees globally
    """

    brief = simon.create_brief_to_kyle(
        better_jd,
        "TechCorp Inc.",
        "Senior HR Manager"
    )

    print(f"\nBRIEF TO KYLE:")
    print(f"Role: {brief['brief_metadata']['role_title']}")
    print(f"Company: {brief['brief_metadata']['company_name']}")
    print(f"\nRole Classification:")
    print(f"  Type: {brief['role_classification']['role_type']}")
    print(f"  Tier: {brief['role_classification']['tier']}")
    print(f"  Seniority: {brief['role_classification']['seniority_level']}")
    print(f"\nJD Quality: {brief['jd_quality_assessment']['quality_rating']} "
          f"({brief['jd_quality_assessment']['quality_score']}/100)")
    print(f"\nGhost Job Analysis:")
    print(f"  Score: {brief['ghost_job_analysis']['ghost_job_score']}/100")
    print(f"  Risk: {brief['ghost_job_analysis']['risk_level']}")
    print(f"\nOverall Recommendation:")
    print(f"  Decision: {brief['overall_recommendation']['decision']}")
    print(f"  Priority: {brief['overall_recommendation']['priority']}")
    print(f"  Reasoning: {brief['overall_recommendation']['reasoning']}")
    print(f"\nStrategy for Kyle:")
    print(f"  Approach: {brief['strategy_for_kyle']['approach']}")
    print(f"  Tone: {brief['strategy_for_kyle']['tone_recommendation']}")
    print(f"  CV Emphasis:")
    for point in brief['strategy_for_kyle']['cv_emphasis']:
        print(f"    • {point}")

    # Test 4: Recruiting expertise (existing)
    print("\n" + "="*70)
    print("TEST 4: Recruiting Best Practices")
    print("="*70)
    recruiting = simon.get_recruiting_best_practices("HR Manager", "senior")
    if 'best_practices' in recruiting:
        print(f"\n{recruiting['best_practices'][:500]}...")
        print(f"\nSources: {len(recruiting.get('recruiting_specific_sources', []))} recruiting sources")
