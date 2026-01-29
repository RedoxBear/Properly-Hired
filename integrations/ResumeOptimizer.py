"""
Base44 Custom Integration: Resume Optimizer
Uses Kyle v2.1.0 for positioning analysis and interview preparation

Integration Name: ResumeOptimizer
Description: Optimizes resumes, creates positioning strategies, and prepares interview materials
"""
import sys
import os
from typing import Dict, Any, Optional

# Add career-coach agents to path
sys.path.insert(0, 0, os.path.join(os.path.dirname(__file__), '..'))

from agents import Kyle


class ResumeOptimizer:
    """
    Base44 Integration for Resume Optimization using Kyle v2.1.0

    Methods exposed to Base44:
    - analyze_target_role
    - prepare_interview_strategy
    - get_cv_best_practices
    - get_cover_letter_best_practices
    - optimize_complete_package
    """

    def __init__(self):
        """Initialize Kyle agent"""
        self.kyle = Kyle()

    def analyze_target_role(self,
                           role_title: str = None,
                           jd_text: str = None,
                           simon_brief: Dict = None) -> Dict[str, Any]:
        """
        Analyze target role and create positioning summary

        Args:
            role_title: Role title
            jd_text: Job description (optional if simon_brief provided)
            simon_brief: Simon's brief from JobAnalysis integration

        Returns:
            Dict with positioning summary, themes, and strategy
        """
        print(f"[Base44 - ResumeOptimizer] Analyzing target role: {role_title}")

        try:
            analysis = self.kyle.analyze_target_role(
                jd_text=jd_text,
                role_title=role_title,
                simon_brief=simon_brief
            )

            return {
                "success": True,
                "data": {
                    "role": {
                        "title": analysis['role_title'],
                        "type": analysis['role_type'],
                        "seniority": analysis['seniority_level']
                    },
                    "positioning": {
                        "statement": analysis['positioning_statement'],
                        "key_themes": analysis['key_themes'],
                        "focus_areas": analysis['recommended_focus_areas']
                    },
                    "guidance": analysis.get('positioning_guidance', ''),
                    "application_approach": analysis['application_approach'],
                    "master_cv_available": analysis['master_cv_available'],
                    "simon_strategy": analysis.get('simon_strategy')
                },
                "version": "2.1.0",
                "agent": "Kyle (CV & Cover Letter Expert)"
            }

        except Exception as e:
            print(f"[Base44 - ResumeOptimizer] Error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Target role analysis failed"
            }

    def prepare_interview_strategy(self,
                                   role_title: str,
                                   company_name: str = "Target Company",
                                   role_type: str = "Professional",
                                   simon_brief: Dict = None,
                                   save_to_file: bool = False) -> Dict[str, Any]:
        """
        Prepare comprehensive interview strategy with STAR method

        Args:
            role_title: Target role title
            company_name: Company name
            role_type: Role type
            simon_brief: Optional Simon's brief
            save_to_file: Whether to save artifacts (Base44 may not support file writes)

        Returns:
            Dict with interview prep artifacts, STAR templates, question bank
        """
        print(f"[Base44 - ResumeOptimizer] Preparing interview strategy for {role_title}")

        try:
            interview_prep = self.kyle.prepare_interview_strategy(
                role_title=role_title,
                role_type=role_type,
                simon_brief=simon_brief,
                save_to_file=save_to_file  # May be disabled in Base44 environment
            )

            return {
                "success": True,
                "data": {
                    "role": {
                        "title": interview_prep['role_title'],
                        "company": interview_prep['company_name'],
                        "type": interview_prep['role_type']
                    },
                    "star_method": {
                        "guidance": interview_prep['star_method_guidance'],
                        "templates": interview_prep['star_templates']
                    },
                    "questions": {
                        "behavioral": interview_prep['behavioral_questions'],
                        "by_category": interview_prep['question_bank']
                    },
                    "preparation": {
                        "checklist": interview_prep['preparation_checklist'],
                        "company_research": interview_prep['company_research_prompts'],
                        "questions_to_ask": interview_prep['questions_to_ask_interviewer']
                    },
                    "file_saved": interview_prep.get('saved_to')
                },
                "version": "2.1.0",
                "agent": "Kyle (CV & Cover Letter Expert)"
            }

        except Exception as e:
            print(f"[Base44 - ResumeOptimizer] Error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Interview preparation failed"
            }

    def get_cv_best_practices(self,
                             role_type: str,
                             experience_level: str = "senior") -> Dict[str, Any]:
        """
        Get CV best practices from knowledge base

        Args:
            role_type: Role type (Manager, Director, Professional, etc.)
            experience_level: Experience level (junior, mid, senior, executive)

        Returns:
            Dict with best practices, sources, and confidence
        """
        print(f"[Base44 - ResumeOptimizer] Getting CV best practices for {role_type}")

        try:
            result = self.kyle.get_cv_best_practices(
                role_type=role_type,
                experience_level=experience_level
            )

            return {
                "success": True,
                "data": {
                    "best_practices": result.get('best_practices', ''),
                    "sources": result.get('cv_specific_sources', []),
                    "confidence": result.get('confidence', 'MEDIUM')
                }
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def get_cover_letter_best_practices(self,
                                       role_type: str,
                                       company_name: str = None) -> Dict[str, Any]:
        """
        Get cover letter best practices from knowledge base

        Args:
            role_type: Role type
            company_name: Target company name (optional)

        Returns:
            Dict with best practices, examples, and sources
        """
        print(f"[Base44 - ResumeOptimizer] Getting cover letter best practices for {role_type}")

        try:
            result = self.kyle.get_cover_letter_best_practices(
                role_type=role_type,
                company_name=company_name
            )

            return {
                "success": True,
                "data": {
                    "best_practices": result.get('best_practices', ''),
                    "key_elements": result.get('key_elements', []),
                    "sources": result.get('sources', [])
                }
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def get_bullet_point_strategies(self, role_type: str) -> Dict[str, Any]:
        """
        Get bullet point writing strategies (ARC formula)

        Args:
            role_type: Role type

        Returns:
            Dict with strategies, formulas, and examples
        """
        print(f"[Base44 - ResumeOptimizer] Getting bullet point strategies")

        try:
            result = self.kyle.get_bullet_point_strategies(role_type=role_type)

            return {
                "success": True,
                "data": {
                    "strategies": result.get('strategies', ''),
                    "formulas": result.get('key_formulas', []),
                    "sources": result.get('sources', [])
                }
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def optimize_complete_package(self,
                                  simon_brief: Dict,
                                  resume_data: Dict = None) -> Dict[str, Any]:
        """
        Complete optimization package: positioning + CV + cover letter + interview

        This is the full Simon → Kyle workflow for Base44

        Args:
            simon_brief: Complete brief from JobAnalysis integration
            resume_data: Optional resume data for optimization

        Returns:
            Complete application package with all strategies
        """
        print("[Base44 - ResumeOptimizer] Creating complete optimization package")

        try:
            # Step 1: Positioning analysis
            positioning = self.analyze_target_role(simon_brief=simon_brief)

            if not positioning['success']:
                return positioning

            role_data = positioning['data']['role']

            # Step 2: CV strategy
            cv_strategy = self.get_cv_best_practices(
                role_type=role_data['type'],
                experience_level=role_data['seniority']
            )

            # Step 3: Cover letter strategy
            cl_strategy = self.get_cover_letter_best_practices(
                role_type=role_data['type'],
                company_name=simon_brief['brief_metadata']['company_name']
            )

            # Step 4: Bullet point strategies
            bullet_strategies = self.get_bullet_point_strategies(
                role_type=role_data['type']
            )

            # Step 5: Interview preparation
            interview_prep = self.prepare_interview_strategy(
                role_title=role_data['title'],
                company_name=simon_brief['brief_metadata']['company_name'],
                role_type=role_data['type'],
                simon_brief=simon_brief,
                save_to_file=False  # Don't save in Base44 environment
            )

            return {
                "success": True,
                "data": {
                    "positioning": positioning['data'],
                    "cv_strategy": cv_strategy.get('data', {}),
                    "cover_letter_strategy": cl_strategy.get('data', {}),
                    "bullet_strategies": bullet_strategies.get('data', {}),
                    "interview_prep": interview_prep.get('data', {}),
                    "simon_recommendation": {
                        "decision": simon_brief['overall_recommendation']['decision'],
                        "priority": simon_brief['overall_recommendation']['priority'],
                        "ghost_score": simon_brief['ghost_job_analysis']['ghost_job_score']
                    }
                },
                "version": "2.1.0",
                "workflow": "Simon → Kyle (Complete Package)"
            }

        except Exception as e:
            print(f"[Base44 - ResumeOptimizer] Error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Complete package optimization failed"
            }


# Base44 Integration Entry Point
def handler(event, context):
    """
    Base44 integration handler

    event should contain:
    {
        "action": "analyze_target_role" | "prepare_interview_strategy" | "optimize_complete_package" | etc.,
        "params": { ... method parameters ... }
    }
    """
    integration = ResumeOptimizer()

    action = event.get('action', 'optimize_complete_package')
    params = event.get('params', {})

    if action == 'analyze_target_role':
        return integration.analyze_target_role(**params)
    elif action == 'prepare_interview_strategy':
        return integration.prepare_interview_strategy(**params)
    elif action == 'get_cv_best_practices':
        return integration.get_cv_best_practices(**params)
    elif action == 'get_cover_letter_best_practices':
        return integration.get_cover_letter_best_practices(**params)
    elif action == 'get_bullet_point_strategies':
        return integration.get_bullet_point_strategies(**params)
    elif action == 'optimize_complete_package':
        return integration.optimize_complete_package(**params)
    else:
        return {
            "success": False,
            "error": f"Unknown action: {action}"
        }


# For local testing
if __name__ == "__main__":
    integration = ResumeOptimizer()

    # Test positioning analysis
    result = integration.analyze_target_role(
        role_title="Senior HR Manager",
        jd_text="Senior HR Manager position..."
    )

    print("\n" + "="*80)
    print("TEST RESULT - POSITIONING ANALYSIS")
    print("="*80)
    print(f"Success: {result['success']}")
    if result['success']:
        print(f"Role: {result['data']['role']['title']}")
        print(f"Type: {result['data']['role']['type']}")
        print(f"Key Themes: {result['data']['positioning']['key_themes']}")
