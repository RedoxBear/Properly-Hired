#!/usr/bin/env python3
"""
Simon (Enhanced) - Employer-Side Recruiter + Company Researcher
Production implementation for Career-Coach with Hybrid Intelligence:
1. Online Search (Priority for Company/Industry)
2. RAG (Priority for Knowledge Base/Best Practices)
3. Local Text Search (Fallback for Best Practices)
"""
import sys
import os
import subprocess
import re
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime

# Add parent directory to path for rag_client import
sys.path.insert(0, str(Path(__file__).parent.parent))
from rag_client import RAGClient


class Simon:
    """
    Enhanced Simon with Hybrid Search and RAG integration for Career-Coach
    """

    def __init__(self, llm_provider: Optional[str] = None, search_tool: Optional[Callable] = None):
        """
        Initialize Simon with RAG client and optional search tool

        Args:
            llm_provider: LLM provider (claude, openai, gemini, ollama)
            search_tool: A callable that takes a query string and returns search results
        """
        self.name = "Simon"
        self.rag = RAGClient(llm_provider=llm_provider)
        self.search_tool = search_tool
        self.kb_path = Path("/mnt/f/Projects/AI_Projects/code/brilliant-day/data/knowledge_base/hr/recruit/")

        # Check RAG readiness
        if self.rag.is_ready():
            print(f"✓ {self.name} initialized with RAG-powered recruitment knowledge")
        else:
            print(f"⚠ {self.name} initialized WITHOUT RAG (using local text search fallback)")

    # =====================================================================
    # SEARCH & RETRIEVAL UTILITIES
    # =====================================================================

    def _google_search(self, query: str) -> str:
        """Priority: Online Knowledge for company and industry research"""
        print(f"🌐 [ONLINE SEARCH] Priority Search for: '{query}'")
        if self.search_tool:
            try:
                results = self.search_tool(query)
                return str(results)
            except Exception as e:
                return f"Online search failed: {e}. Reverting to internal knowledge."
        return "Search tool not configured. Reverting to internal knowledge."

    def _local_text_search(self, query: str, k: int = 5) -> str:
        """Fallback: .txt/.md search on local recruitment resources if RAG fails"""
        print(f"📂 [LOCAL TEXT SEARCH] Fallback Search for: '{query}'")
        if not self.kb_path.exists():
            return "Local knowledge base path not found."

        # Extract keywords for search
        keywords = re.findall(r'\w+', query.lower())
        # Filter common words
        stopwords = {'what', 'is', 'the', 'for', 'and', 'how', 'to', 'in', 'of', 'best', 'practices', 'roles'}
        keywords = [w for w in keywords if w not in stopwords and len(w) > 2]
        
        if not keywords:
            keywords = [query[:20]]

        all_matches = []
        try:
            for file in self.kb_path.glob("*.md"):
                # Simple search
                with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    # Find paragraphs containing keywords
                    paragraphs = content.split('\n\n')
                    for p in paragraphs:
                        score = sum(1 for kw in keywords if kw in p.lower())
                        if score > 0:
                            all_matches.append((score, f"Source: {file.name}\n{p.strip()}"))
            
            # Sort by score and take top k
            all_matches.sort(key=lambda x: x[0], reverse=True)
            results = [m[1] for m in all_matches[:k]]
            
            if not results:
                return "No local text matches found."
            
            return "\n\n---\n\n".join(results)
        except Exception as e:
            return f"Local text search error: {e}"

    # =====================================================================
    # MAIN ANALYSIS METHOD
    # =====================================================================

    def analyze_job_description(self, jd_text: str, company_name: str,
                                role_title: str) -> Dict:
        """
        Comprehensive JD analysis with Hybrid research
        """
        print(f"\n{'='*70}")
        print(f"SIMON'S EMPLOYER-SIDE ANALYSIS (Hybrid Intelligence)")
        print(f"{'='*70}")
        print(f"Role: {role_title} at {company_name}")
        print(f"Analysis started: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

        # Step 1: Extract JD linguistic DNA
        print(f"\n📋 Step 1: Extracting JD linguistic DNA...")
        linguistic_dna = self._extract_linguistic_dna(jd_text)

        # Step 2: Classify role level
        print(f"\n🎯 Step 2: Classifying role level...")
        role_classification = self._classify_role_level(jd_text, role_title)

        # Step 3: Online-Priority Company Research
        print(f"\n🔍 Step 3: Priority Online company research...")
        company_research = self._research_company(company_name, role_title)

        # Step 4: Online-Priority Industry benchmarking
        print(f"\n📊 Step 4: Industry benchmarking...")
        industry_context = self._get_industry_context(role_title, company_name)

        # Step 5: Best practices for role type (RAG with Fallback)
        print(f"\n📚 Step 5: Role best practices (RAG/Text)...")
        role_best_practices = self._get_role_best_practices(role_classification['role_type'])

        # Step 6: Recruitment knowledge (RAG with Fallback)
        print(f"\n🎓 Step 6: Recruitment best practices (RAG/Text)...")
        recruitment_insights = self._get_recruitment_insights(role_title, role_classification['role_type'])

        # Step 7: Ghost job detection
        print(f"\n👻 Step 7: Ghost job detection...")
        ghost_score = self._calculate_ghost_job_score(jd_text, company_research)

        # Step 8: Build success profile
        print(f"\n🎯 Step 8: Building success profile...")
        success_profile = self._build_success_profile(
            jd_text, role_classification, role_best_practices
        )

        # Compile final brief for Kyle
        brief = self._compile_kyle_brief(
            company_name=company_name,
            role_title=role_title,
            linguistic_dna=linguistic_dna,
            role_classification=role_classification,
            company_research=company_research,
            industry_context=industry_context,
            ghost_score=ghost_score,
            success_profile=success_profile,
            role_best_practices=role_best_practices,
            recruitment_insights=recruitment_insights
        )

        print(f"\n{'='*70}")
        print(f"✅ Analysis complete!")
        print(f"{'='*70}")

        return brief

    # =====================================================================
    # HYBRID RESEARCH METHODS
    # =====================================================================

    def _research_company(self, company_name: str, role_title: str) -> Dict:
        """Priority: Online Search for company research"""
        research = {}

        # 1. ONLINE SEARCH (Priority)
        print(f"  → Searching online for {company_name} context...")
        search_query = f"{company_name} company culture hiring trends financial health 2025 2026"
        search_results = self._google_search(search_query)
        research['industry_insights'] = search_results
        
        # 2. RAG SUPPLEMENT (If available)
        if self.rag.is_ready():
            print(f"  → Supplementing with RAG internal data...")
            rag_query = f"Hiring patterns and organizational signals for {company_name}"
            try:
                rag_result = self.rag.ask(rag_query, k=3, show_sources=False)
                if rag_result and 'answer' in rag_result:
                    research['industry_insights'] += f"\n\nInternal Knowledge Supplement:\n{rag_result['answer']}"
            except Exception as e:
                print(f"  ⚠ RAG Supplement failed: {e}. Continuing with online research.")

        # 3. HIRING PATTERNS (RAG/Text Fallback)
        hiring_query = f"Typical hiring patterns and success factors for {role_title} roles"
        hiring_res = None
        if self.rag.is_ready():
            try:
                hiring_res = self.rag.ask(hiring_query, k=4, show_sources=False)
            except Exception as e:
                print(f"  ⚠ RAG Hiring Patterns search failed: {e}. Falling back to text search.")
        
        if not hiring_res or 'Error' in hiring_res.get('answer', ''):
            research['hiring_patterns'] = self._local_text_search(hiring_query)
        else:
            research['hiring_patterns'] = hiring_res.get('answer', 'Data unavailable.')

        return research

    def _get_industry_context(self, role_title: str, company_name: str) -> Dict:
        """Priority: Online Search for industry benchmarking"""
        print(f"  → Gathering industry benchmarks via Online Search...")
        
        search_query = f"Industry standards benchmarks salary range for {role_title} in 2026"
        search_results = self._google_search(search_query)
        
        return {
            'standards': search_results,
            'sources': ['Online Search']
        }

    def _get_role_best_practices(self, role_type: str) -> Dict:
        """RAG Priority, Fallback to Local Text Search"""
        print(f"  → Fetching best practices for {role_type} roles...")

        query = f"Best practices, success factors, and key competencies for {role_type} professional roles"
        
        # Try RAG
        result = None
        if self.rag.is_ready():
            try:
                result = self.rag.ask(query, k=5, show_sources=True)
            except Exception as e:
                print(f"  ⚠ RAG Error: {e}. Falling back to text search.")

        if result and 'answer' in result and 'Error' not in result['answer']:
            return {
                'best_practices': result['answer'],
                'sources': [s['source'] for s in result.get('sources', [])]
            }
        
        # Fallback to Text Search
        fallback_text = self._local_text_search(query)
        return {
            'best_practices': fallback_text,
            'sources': ['Local Text Resources']
        }

    def _get_recruitment_insights(self, role_title: str, role_type: str) -> Dict:
        """RAG Priority, Fallback to Local Text Search"""
        print(f"  → Fetching recruitment insights...")

        query = f"Recruitment expert perspective: hiring signals and assessment criteria for {role_title} {role_type}"
        
        # Try RAG
        result = None
        if self.rag.is_ready():
            try:
                result = self.rag.ask(query, k=5, show_sources=True)
            except Exception as e:
                print(f"  ⚠ RAG Error: {e}. Falling back to text search.")

        if result and 'answer' in result and 'Error' not in result['answer']:
            return {
                'insights': result['answer'],
                'sources': [s['source'] for s in result.get('sources', [])]
            }
        
        # Fallback to Text Search
        fallback_text = self._local_text_search(query)
        return {
            'insights': fallback_text,
            'sources': ['Local Text Resources']
        }

    def _build_success_profile(self, jd_text: str, role_classification: Dict,
                              role_best_practices: Dict) -> Dict:
        """Build success profile using retrieved insights"""
        role_type = role_classification['role_type']
        
        # We synthesize the profile here based on best practices retrieved
        profile = f"Based on industry best practices for {role_type} roles:\n"
        profile += role_best_practices['best_practices'][:1000]
        
        return {
            'profile': profile,
            'role_best_practices_summary': role_best_practices['best_practices'][:300] + '...'
        }

    # =====================================================================
    # CLASSIFICATION & ANALYSIS METHODS
    # =====================================================================

    def _extract_linguistic_dna(self, jd_text: str) -> Dict:
        """Extract language patterns from JD"""
        tone_indicators = {'formal': 0, 'casual': 0}
        formal_words = ['ensure', 'execute', 'oversee', 'implement', 'maintain', 'establish']
        casual_words = ['build', 'create', 'drive', 'grow', 'innovate', 'collaborate']
        jd_lower = jd_text.lower()
        for word in formal_words:
            tone_indicators['formal'] += jd_lower.count(word)
        for word in casual_words:
            tone_indicators['casual'] += jd_lower.count(word)
        return {
            'tone': 'formal' if tone_indicators['formal'] > tone_indicators['casual'] else 'casual',
            'tone_scores': tone_indicators
        }

    def _classify_role_level(self, jd_text: str, role_title: str) -> Dict:
        """Classify role level"""
        jd_lower = jd_text.lower()
        title_lower = role_title.lower()
        deputy_signals = ['deputy', 'right hand', 'support', 'assist', 'enable', 'reports to vp', 'reports to chief']
        is_deputy = any(signal in jd_lower or signal in title_lower for signal in deputy_signals)
        if any(word in title_lower for word in ['chief', 'c-suite', 'vp', 'vice president']):
            role_type = 'Strategic/Executive'
        elif 'director' in title_lower:
            role_type = 'Strategic/Executive' if not is_deputy else 'Operational/Management'
        elif 'manager' in title_lower or 'lead' in title_lower:
            role_type = 'Operational/Management'
        elif any(word in title_lower for word in ['compliance', 'deputy', 'audit']):
            role_type = 'Compliance/Deputy'
        else:
            role_type = 'Specialist/IC'
        return {'role_type': role_type, 'is_deputy': is_deputy, 'level': self._determine_level(role_type, is_deputy)}

    def _determine_level(self, role_type: str, is_deputy: bool) -> str:
        if role_type == 'Strategic/Executive': return 'Deputy' if is_deputy else 'C-Suite/VP'
        elif role_type == 'Operational/Management': return 'Senior Manager/Deputy' if is_deputy else 'Director'
        elif role_type == 'Compliance/Deputy': return 'Deputy'
        else: return 'Manager' if 'management' in role_type.lower() else 'Specialist/IC'

    def _calculate_ghost_job_score(self, jd_text: str, company_research: Dict) -> Dict:
        score = 0
        indicators = []
        jd_lower = jd_text.lower()
        if len(jd_text) < 500:
            score += 20
            indicators.append("Very short JD (possible template)")
        if 'salary' not in jd_lower and 'compensation' not in jd_lower:
            score += 15
            indicators.append("No salary/compensation mentioned")
        if 'reports to' in jd_lower:
            score -= 10
            indicators.append("Clear reporting structure (good sign)")
        if len(jd_text) > 1500:
            score -= 15
            indicators.append("Detailed JD (good sign)")
        score = max(0, min(100, score))
        viability = "Real Opening" if score <= 20 else "Likely Real" if score <= 40 else "Uncertain" if score <= 60 else "Likely Ghost" if score <= 80 else "Ghost Job"
        return {'score': score, 'viability': viability, 'indicators': indicators}

    def _compile_kyle_brief(self, **kwargs) -> Dict:
        brief_text = f"""
{'='*70}
SIMON'S BRIEF TO KYLE (Hybrid Intelligence)
{'='*70}

ROLE: {kwargs['role_title']} at {kwargs['company_name']}
POST DATE: {datetime.now().strftime('%Y-%m-%d')}
GHOST JOB SCORE: {kwargs['ghost_score']['score']}% ({kwargs['ghost_score']['viability']})
VIABILITY: {kwargs['ghost_score']['viability']}

{'='*70}
COMPANY & INDUSTRY RESEARCH (ONLINE PRIORITY)
{'='*70}

Industry Insights (Online Search Results):
{kwargs['company_research']['industry_insights'][:1000]}...

Hiring Patterns:
{kwargs['company_research']['hiring_patterns'][:500]}...

Industry Benchmarks:
{kwargs['industry_context']['standards'][:500]}...

{'='*70}
RECRUITMENT BEST PRACTICES (KNOWLEDGE BASE)
{'='*70}

{kwargs['recruitment_insights']['insights'][:600]}...

Sources: {', '.join(kwargs['recruitment_insights']['sources'])}

{'='*70}
SUCCESS PROFILE
{'='*70}

{kwargs['success_profile']['profile'][:600]}...

{'='*70}
BRIEF TO KYLE
{'='*70}

Recommendation: {'PURSUE' if kwargs['ghost_score']['score'] < 40 else 'CAUTION' if kwargs['ghost_score']['score'] < 60 else 'SKIP'}
Confidence: {100 - kwargs['ghost_score']['score']}%

**Key Positioning:**
1. Match {kwargs['linguistic_dna']['tone']} tone.
2. Emphasize {kwargs['role_classification']['role_type']} competencies.
3. Reference benchmarks from Online Research.
"""
        return {
            'brief_text': brief_text,
            'structured_data': {
                'role_title': kwargs['role_title'],
                'company': kwargs['company_name'],
                'tone': kwargs['linguistic_dna']['tone'],
                'recommendation': 'PURSUE' if kwargs['ghost_score']['score'] < 40 else 'CAUTION'
            }
        }


if __name__ == "__main__":
    # Test stub
    simon = Simon()
    print("Simon initialized.")
    # No search tool passed, will use stubs/fallbacks
    analysis = simon.analyze_job_description("Sample JD text", "Sunbit", "VP HR")
    print(analysis['brief_text'])
