"""
Simon Agent Module

Imports the enhanced version by default for best performance.

Usage:
    # Recommended (uses enhanced version automatically)
    from agents.simon import Simon
    simon = Simon()

    # Explicit enhanced version
    from agents.simon import SimonEnhanced
    simon = SimonEnhanced()

    # Legacy version (if needed)
    from agents.simon.simon import Simon as SimonLegacy
    simon = SimonLegacy()
"""

# Import enhanced version and make it the default "Simon"
from .simon_enhanced import SimonEnhanced as Simon
from .simon_enhanced import SimonEnhanced

# Also expose legacy version if needed
from .simon import Simon as SimonLegacy

# Default export
__all__ = ['Simon', 'SimonEnhanced', 'SimonLegacy']

# Version info
__version__ = '2.1.0-enhanced'
__author__ = 'Career Coach Team'
__description__ = 'Simon - Recruiting & HR Expert (Enhanced with RAG, Ghost-Job Detection, and Company Research)'
