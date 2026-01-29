"""
Career Coach Agents

Main import module for Kyle and Simon agents.
Enhanced versions are used by default.

Quick Start:
    from agents import Kyle, Simon

    kyle = Kyle()  # CV & Cover Letter Expert
    simon = Simon()  # Recruiting & HR Expert

    # Kyle creates application materials
    cv_strategy = kyle.get_cv_best_practices("HR Manager")
    cl_strategy = kyle.get_cover_letter_best_practices("HR Manager", "Sunbit")

    # Simon analyzes opportunities
    recruiting = simon.get_recruiting_best_practices("HR Manager")
    jd_analysis = simon.analyze_job_description_comprehensive(
        jd_text, "Sunbit", "HR Manager"
    )
"""

# Import enhanced versions as defaults
from .kyle import Kyle, KyleEnhanced, KyleLegacy
from .simon import Simon, SimonEnhanced, SimonLegacy
from .rag_client import RAGClient

__all__ = [
    'Kyle',          # Default: Enhanced version
    'Simon',         # Default: Enhanced version
    'KyleEnhanced',  # Explicit enhanced
    'SimonEnhanced', # Explicit enhanced
    'KyleLegacy',    # Legacy if needed
    'SimonLegacy',   # Legacy if needed
    'RAGClient'      # RAG access
]

__version__ = '2.0.0'
__description__ = 'Career Coach Agents - Kyle & Simon (RAG Enhanced)'
