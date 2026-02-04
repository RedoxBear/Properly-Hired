"""
Base44 Custom Integration: Job Analysis
Uses Simon for comprehensive job opportunity analysis

Integration Name: JobAnalysis
Description: Analyzes job opportunities with ghost-job detection and recommendations
"""
import sys
import os
from typing import Dict, Any
from pathlib import Path

# Add local agents to path
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir / 'agents'))

from simon.simon import Simon


def mock_search_tool(query: str) -> str:
    """
    Mock search tool for Base44 environment
    TODO: Replace with actual Base44 web search integration
    """
    return f"Search results for: {query} (Base44 mock)"


class JobAnalysis:
    """
    Base44 Integration for Job Analysis using Simon v2.1.0

    Methods exposed to Base44:
    - analyze_job_opportunity
    - calculate_ghost_job_score
    - classify_role
    - research_company
    """

    def __init__(self):
        """Initialize Simon agent"""
        # Check if web search integration is available from Base44
        search_tool = self._get_base44_search_tool()
        self.simon = Simon(search_tool=search_tool)

    def _get_base44_search_tool(self):
        """
        Get Base44's web search integration if available
        Falls back to mock if not available
        """
        # TODO: Integrate with Base44's web search integration
        # For now, use mock
        return mock_search_tool

    def analyze_job_opportunity(self,
                                jd_text: str,
                                company_name: str,
                                role_title: str,
                                candidate_background: str = None,
                                posting_date: str = None) -> Dict[str, Any]:
        """
        Complete job opportunity analysis with Simon's brief to Kyle

        Args:
            jd_text: Full job description text
            company_name: Company name
            role_title: Role title
            candidate_background: Optional candidate background
            posting_date: Optional posting date

        Returns:
            Dict with complete analysis including:
            - role_classification (with deputy/compliance detection)
            - jd_quality_assessment
            - ghost_job_analysis (with score and recommendation)
            - overall_recommendation (PURSUE/SKIP/etc.)
            - strategy_for_kyle
            - company_research (if search tool available)
        """
        print(f"[Base44 - JobAnalysis] Analyzing {role_title} at {company_name}")

        try:
            brief = self.simon.create_brief_to_kyle(
                jd_text=jd_text,
                company_name=company_name,
                role_title=role_title,
                candidate_background=candidate_background,
                posting_date=posting_date
            )

            # Format for Base44 response
            return {
                "success": True,
                "data": {
                    "role": {
                        "title": brief['brief_metadata']['role_title'],
                        "company": brief['brief_metadata']['company_name'],
                        "type": brief['role_classification']['role_type'],
                        "tier": brief['role_classification']['tier'],
                        "seniority": brief['role_classification']['seniority_level'],
                        "is_deputy": brief['role_classification']['is_deputy'],
                        "is_compliance": brief['role_classification']['is_compliance']
                    },
                    "quality": {
                        "score": brief['jd_quality_assessment']['quality_score'],
                        "rating": brief['jd_quality_assessment']['quality_rating'],
                        "strengths": brief['jd_quality_assessment']['strengths'],
                        "issues": brief['jd_quality_assessment']['issues']
                    },
                    "ghost_job": {
                        "score": brief['ghost_job_analysis']['ghost_job_score'],
                        "risk_level": brief['ghost_job_analysis']['risk_level'],
                        "recommendation": brief['ghost_job_analysis']['recommendation'],
                        "red_flags": brief['ghost_job_analysis']['indicators'],
                        "positive_signals": brief['ghost_job_analysis']['positive_signals']
                    },
                    "recommendation": {
                        "decision": brief['overall_recommendation']['decision'],
                        "priority": brief['overall_recommendation']['priority'],
                        "reasoning": brief['overall_recommendation']['reasoning'],
                        "confidence": brief['overall_recommendation']['confidence']
                    },
                    "strategy": {
                        "approach": brief['strategy_for_kyle']['approach'],
                        "tone": brief['strategy_for_kyle']['tone_recommendation'],
                        "cv_emphasis": brief['strategy_for_kyle']['cv_emphasis'],
                        "cover_letter_emphasis": brief['strategy_for_kyle']['cover_letter_emphasis'],
                        "warnings": brief['strategy_for_kyle']['warnings']
                    },
                    "company_research": brief.get('company_research'),
                    "recruiting_insights": brief.get('recruiting_insights'),
                    "assessment_criteria": brief.get('assessment_criteria')
                },
                "version": "2.1.0",
                "agent": "Simon (Recruiting & HR Expert)"
            }

        except Exception as e:
            print(f"[Base44 - JobAnalysis] Error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Job analysis failed"
            }

    def calculate_ghost_job_score(self,
                                  jd_text: str,
                                  company_name: str,
                                  role_title: str) -> Dict[str, Any]:
        """
        Quick ghost-job probability check

        Returns:
            Dict with ghost_job_score, risk_level, and recommendation
        """
        print(f"[Base44 - JobAnalysis] Ghost-job check for {role_title}")

        try:
            result = self.simon.calculate_ghost_job_score(
                jd_text=jd_text,
                company_name=company_name,
                role_title=role_title
            )

            return {
                "success": True,
                "data": {
                    "score": result['ghost_job_score'],
                    "risk_level": result['risk_level'],
                    "recommendation": result['recommendation'],
                    "indicators": result['indicators'],
                    "positive_signals": result['positive_signals']
                }
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def classify_role(self, role_title: str) -> Dict[str, Any]:
        """
        Enhanced role classification with deputy/compliance detection

        Returns:
            Dict with role_type, tier, seniority, flags
        """
        print(f"[Base44 - JobAnalysis] Classifying role: {role_title}")

        try:
            classification = self.simon._classify_role_level(role_title)

            return {
                "success": True,
                "data": classification
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def research_company(self,
                        company_name: str,
                        focus_areas: list = None) -> Dict[str, Any]:
        """
        Research company online (if search tool available)

        Args:
            company_name: Company to research
            focus_areas: Areas to focus on (culture, hiring, stability, etc.)

        Returns:
            Dict with search results per focus area
        """
        print(f"[Base44 - JobAnalysis] Researching {company_name}")

        try:
            result = self.simon.research_company_online(
                company_name=company_name,
                focus_areas=focus_areas
            )

            return {
                "success": True,
                "data": result
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Base44 Integration Entry Point
def handler(event, context):
    """
    Base44 integration handler

    event should contain:
    {
        "action": "analyze_job_opportunity" | "calculate_ghost_job_score" | "classify_role" | "research_company",
        "params": { ... method parameters ... }
    }
    """
    integration = JobAnalysis()

    action = event.get('action', 'analyze_job_opportunity')
    params = event.get('params', {})

    if action == 'analyze_job_opportunity':
        return integration.analyze_job_opportunity(**params)
    elif action == 'calculate_ghost_job_score':
        return integration.calculate_ghost_job_score(**params)
    elif action == 'classify_role':
        return integration.classify_role(**params)
    elif action == 'research_company':
        return integration.research_company(**params)
    else:
        return {
            "success": False,
            "error": f"Unknown action: {action}"
        }


# For local testing
if __name__ == "__main__":
    integration = JobAnalysis()

    # Test job analysis
    test_jd = """
    Senior HR Manager - TechCorp Inc.

    Reports to: CHRO
    Team: 5 direct reports

    Responsibilities:
    - Lead talent acquisition for 200+ hires annually
    - Manage employee relations
    - Develop HR policies

    Qualifications:
    - 8+ years HR experience
    - 3+ years management
    - SHRM-CP preferred

    Compensation: $120,000 - $150,000 + bonus + equity
    """

    result = integration.analyze_job_opportunity(
        jd_text=test_jd,
        company_name="TechCorp Inc.",
        role_title="Senior HR Manager"
    )

    print("\n" + "="*80)
    print("TEST RESULT")
    print("="*80)
    print(f"Success: {result['success']}")
    if result['success']:
        print(f"Decision: {result['data']['recommendation']['decision']}")
        print(f"Priority: {result['data']['recommendation']['priority']}")
        print(f"Ghost Score: {result['data']['ghost_job']['score']}/100")
        print(f"JD Quality: {result['data']['quality']['rating']}")
