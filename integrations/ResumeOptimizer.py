"""
Base44 Custom Integration: Resume Optimizer
Uses Kyle v2.1.0 for positioning analysis and interview preparation

Integration Name: ResumeOptimizer
Description: Optimizes resumes, creates positioning strategies, and prepares interview materials

Kyle's Best Qualities Integrated:
- Domain-focused expertise (CV, Cover Letters, Interview Prep, Positioning)
- RAG-powered knowledge base access
- Quality frameworks and checklists
- Integrated workflows (complete application packages)
- Strategic positioning and personal branding
- Framework-based guidance (STAR method, ARC formula, etc.)
"""
import sys
import os
from typing import Dict, Any, Optional

# Add career-coach agents to path
sys.path.insert(0, '/mnt/f/Projects/AI_Projects/code/career-coach')

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
    - create_application_package_strategy
    - get_quality_framework
    - get_positioning_analysis

    Kyle's Expertise Domains:
    - CV & Resume Optimization
    - Cover Letter Strategies
    - Bullet Point & Achievement Framing
    - Interview Preparation & STAR Method
    - Career Positioning & Personal Branding
    - Application Materials Integration
    """

    # Kyle's specialized expertise domains
    EXPERTISE_DOMAINS = [
        "CV best practices",
        "Cover letter strategies",
        "Resume optimization",
        "Application materials",
        "Career branding",
        "Interview preparation",
        "STAR method coaching",
        "Bullet point strategies",
        "Positioning analysis",
        "Achievement framing"
    ]

    def __init__(self):
        """Initialize Kyle agent"""
        self.kyle = Kyle()
        self.name = "Kyle (CV & Cover Letter Expert)"
        print(f"✓ {self.name} initialized")
        print(f"  → Expert access to {len(self.EXPERTISE_DOMAINS)} knowledge domains")
        print(f"  → Domains: {', '.join(self.EXPERTISE_DOMAINS[:5])}+")

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

    def get_positioning_analysis(self,
                                 role_title: str,
                                 role_type: str,
                                 seniority_level: str = "mid") -> Dict[str, Any]:
        """
        Get strategic positioning analysis for target role

        Args:
            role_title: Target role title
            role_type: Role type
            seniority_level: Career level

        Returns:
            Dict with positioning strategies and personal branding guidance
        """
        print(f"[Base44 - ResumeOptimizer] Analyzing positioning for {role_title}")

        try:
            # Get positioning guidance from Kyle
            result = self.kyle.analyze_target_role(
                role_title=role_title
            )

            return {
                "success": True,
                "data": {
                    "positioning_statement": result.get('positioning_statement', ''),
                    "key_themes": result.get('key_themes', []),
                    "focus_areas": result.get('recommended_focus_areas', []),
                    "positioning_guidance": result.get('positioning_guidance', ''),
                    "application_approach": result.get('application_approach', '')
                }
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def get_quality_framework(self,
                            framework_type: str = "cv_quality",
                            role_type: str = "Professional") -> Dict[str, Any]:
        """
        Get quality framework for evaluating documents

        Framework types:
        - cv_quality: CV/Resume quality checklist
        - cover_letter_quality: Cover letter evaluation framework
        - positioning_quality: Positioning statement framework
        - interview_readiness: Interview preparation checklist

        Args:
            framework_type: Type of quality framework
            role_type: Role type for context

        Returns:
            Dict with framework items and criteria
        """
        print(f"[Base44 - ResumeOptimizer] Getting quality framework: {framework_type}")

        frameworks = {
            "cv_quality": {
                "framework_name": "CV Quality Evaluation",
                "categories": [
                    {
                        "category": "Professional Summary",
                        "criteria": [
                            "Clearly positions candidate for target role",
                            "Highlights key value propositions",
                            "Includes relevant metrics/achievements",
                            "Uses strong action verbs",
                            "Customized for role/industry"
                        ]
                    },
                    {
                        "category": "Experience Section",
                        "criteria": [
                            "Reverse chronological order maintained",
                            "4-7 bullet points per role",
                            "Action-Result format applied",
                            "Achievements quantified with metrics",
                            "JD keywords strategically included",
                            "Impact statements lead each bullet"
                        ]
                    },
                    {
                        "category": "Skills Section",
                        "criteria": [
                            "Prioritized by relevance to JD",
                            "Mix of technical and soft skills",
                            "Keywords match job description",
                            "Proficiency levels indicated if applicable",
                            "Skills demonstrated in experience section"
                        ]
                    },
                    {
                        "category": "Formatting & Design",
                        "criteria": [
                            "ATS-friendly formatting",
                            "Clear visual hierarchy",
                            "Consistent font and spacing",
                            "Professional design elements",
                            "Mobile-responsive for online viewing"
                        ]
                    }
                ]
            },
            "cover_letter_quality": {
                "framework_name": "Cover Letter Quality Evaluation",
                "categories": [
                    {
                        "category": "Opening Hook",
                        "criteria": [
                            "Captures attention immediately",
                            "Avoids clichés and overused phrases",
                            "Demonstrates company research",
                            "Establishes value proposition upfront",
                            "Creates connection with reader"
                        ]
                    },
                    {
                        "category": "Body Paragraphs",
                        "criteria": [
                            "Each paragraph has single focus",
                            "Storytelling elements included",
                            "Achievements linked to role requirements",
                            "Company-specific references included",
                            "Evidence supports claims made"
                        ]
                    },
                    {
                        "category": "Closing & Call-to-Action",
                        "criteria": [
                            "Strong closing statement",
                            "Clear call-to-action included",
                            "Professional sign-off",
                            "Contact information provided",
                            "Follow-up timeline suggested"
                        ]
                    },
                    {
                        "category": "Tone & Voice",
                        "criteria": [
                            "Professional yet personable tone",
                            "Authentic voice evident",
                            "Enthusiasm shown for opportunity",
                            "Confidence balanced with humility",
                            "No grammatical or spelling errors"
                        ]
                    }
                ]
            },
            "positioning_quality": {
                "framework_name": "Positioning Quality Evaluation",
                "categories": [
                    {
                        "category": "Positioning Statement",
                        "criteria": [
                            "Clearly identifies target role",
                            "Specifies years of experience",
                            "Highlights unique specialties",
                            "Differentiates from competition",
                            "Memorable and compelling"
                        ]
                    },
                    {
                        "category": "Value Proposition",
                        "criteria": [
                            "Articulates core value delivered",
                            "Aligned with target role needs",
                            "Specific and quantifiable where possible",
                            "Demonstrates market understanding",
                            "Addresses employer pain points"
                        ]
                    },
                    {
                        "category": "Brand Consistency",
                        "criteria": [
                            "Consistent across all materials",
                            "Reflected in CV, cover letter, interview",
                            "Authentic to candidate's background",
                            "Future-focused career narrative",
                            "Cohesive professional story"
                        ]
                    }
                ]
            },
            "interview_readiness": {
                "framework_name": "Interview Readiness Checklist",
                "categories": [
                    {
                        "category": "STAR Method Preparation",
                        "criteria": [
                            "5+ STAR stories prepared",
                            "Stories cover key competencies",
                            "Clear Situation-Task-Action-Result structure",
                            "Quantifiable results included",
                            "Delivery practiced and timed"
                        ]
                    },
                    {
                        "category": "Company Research",
                        "criteria": [
                            "Company mission/values researched",
                            "Recent news and announcements reviewed",
                            "Industry position understood",
                            "Leadership team identified",
                            "Specific role research completed"
                        ]
                    },
                    {
                        "category": "Question Preparation",
                        "criteria": [
                            "Common questions prepared",
                            "Behavioral questions practiced",
                            "Role-specific questions researched",
                            "Difficult questions anticipated",
                            "30-second elevator pitch ready"
                        ]
                    },
                    {
                        "category": "Interview Logistics",
                        "criteria": [
                            "Interview format confirmed",
                            "Dress code researched",
                            "Travel/timing planned",
                            "Technical setup tested (if virtual)",
                            "Materials prepared (references, portfolio)"
                        ]
                    }
                ]
            }
        }

        selected_framework = frameworks.get(framework_type, frameworks["cv_quality"])

        return {
            "success": True,
            "data": {
                "framework": selected_framework,
                "role_context": role_type,
                "total_criteria": sum(len(cat["criteria"]) for cat in selected_framework["categories"])
            }
        }

    def create_application_package_strategy(self,
                                           role_title: str,
                                           company_name: str,
                                           role_type: str = "Professional",
                                           jd_text: str = None,
                                           simon_brief: Dict = None) -> Dict[str, Any]:
        """
        Create complete application package strategy (CV + Cover Letter + Interview)

        This implements Kyle's integrated workflow approach

        Args:
            role_title: Target role title
            company_name: Company name
            role_type: Role type
            jd_text: Job description text (optional)
            simon_brief: Simon's brief with company/role analysis (optional)

        Returns:
            Complete strategy combining CV, cover letter, and interview prep
        """
        print(f"[Base44 - ResumeOptimizer] Creating application package strategy for {role_title}")

        try:
            # Step 1: Positioning Analysis
            positioning = self.analyze_target_role(
                role_title=role_title,
                jd_text=jd_text,
                simon_brief=simon_brief
            )

            if not positioning.get('success'):
                return positioning

            positioning_data = positioning['data']
            role_data = positioning_data.get('role', {})

            # Step 2: CV Best Practices
            cv_strategy = self.get_cv_best_practices(
                role_type=role_data.get('type', role_type),
                experience_level=role_data.get('seniority', 'mid')
            )

            # Step 3: Bullet Point Strategies
            bullet_strategies = self.get_bullet_point_strategies(
                role_type=role_data.get('type', role_type)
            )

            # Step 4: Cover Letter Best Practices
            cl_strategy = self.get_cover_letter_best_practices(
                role_type=role_data.get('type', role_type),
                company_name=company_name
            )

            # Step 5: Interview Strategy
            interview_prep = self.prepare_interview_strategy(
                role_title=role_title,
                company_name=company_name,
                role_type=role_data.get('type', role_type),
                simon_brief=simon_brief,
                save_to_file=False
            )

            # Step 6: Quality Frameworks
            cv_framework = self.get_quality_framework("cv_quality", role_data.get('type', role_type))
            cl_framework = self.get_quality_framework("cover_letter_quality", role_data.get('type', role_type))

            return {
                "success": True,
                "data": {
                    "application_package": {
                        "role": role_data,
                        "positioning": positioning_data.get('positioning', {}),
                        "company": company_name
                    },
                    "cv_strategy": cv_strategy.get('data', {}),
                    "bullet_strategies": bullet_strategies.get('data', {}),
                    "cover_letter_strategy": cl_strategy.get('data', {}),
                    "interview_prep": interview_prep.get('data', {}),
                    "quality_frameworks": {
                        "cv_quality": cv_framework.get('data', {}),
                        "cover_letter_quality": cl_framework.get('data', {})
                    },
                    "timeline_and_checklist": {
                        "preparation_steps": [
                            "Research company and role",
                            "Tailor CV using positioning statement",
                            "Apply bullet point strategies",
                            "Write compelling cover letter",
                            "Prepare STAR stories",
                            "Practice interview responses",
                            "Review quality frameworks",
                            "Final proofing and polish"
                        ],
                        "estimated_time_hours": 8
                    }
                },
                "version": "2.1.0-Enhanced",
                "workflow": "Kyle Enhanced - Complete Application Package",
                "expertise_domains_used": [
                    "Positioning Analysis",
                    "CV Optimization",
                    "Bullet Point Strategies",
                    "Cover Letter Development",
                    "Interview Preparation"
                ]
            }

        except Exception as e:
            print(f"[Base44 - ResumeOptimizer] Error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Application package strategy creation failed"
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
        "action": "analyze_target_role" | "prepare_interview_strategy" | 
                  "optimize_complete_package" | "create_application_package_strategy" |
                  "get_quality_framework" | "get_positioning_analysis" | etc.,
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
    elif action == 'get_positioning_analysis':
        return integration.get_positioning_analysis(**params)
    elif action == 'get_quality_framework':
        return integration.get_quality_framework(**params)
    elif action == 'create_application_package_strategy':
        return integration.create_application_package_strategy(**params)
    elif action == 'optimize_complete_package':
        return integration.optimize_complete_package(**params)
    else:
        return {
            "success": False,
            "error": f"Unknown action: {action}",
            "available_actions": [
                "analyze_target_role",
                "prepare_interview_strategy",
                "get_cv_best_practices",
                "get_cover_letter_best_practices",
                "get_bullet_point_strategies",
                "get_positioning_analysis",
                "get_quality_framework",
                "create_application_package_strategy",
                "optimize_complete_package"
            ]
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
