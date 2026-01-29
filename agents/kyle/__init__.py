"""
Kyle Agent Module

Imports the enhanced version by default for best performance.

Usage:
    # Recommended (uses enhanced version automatically)
    from agents.kyle import Kyle
    kyle = Kyle()

    # Explicit enhanced version
    from agents.kyle import KyleEnhanced
    kyle = KyleEnhanced()

    # Legacy version (if needed)
    from agents.kyle.kyle import Kyle as KyleLegacy
    kyle = KyleLegacy()
"""

# Import enhanced version and make it the default "Kyle"
from .kyle_enhanced import KyleEnhanced as Kyle
from .kyle_enhanced import KyleEnhanced

# Also expose legacy version if needed
from .kyle import Kyle as KyleLegacy

# Default export
__all__ = ['Kyle', 'KyleEnhanced', 'KyleLegacy']

# Version info
__version__ = '2.1.0-enhanced'
__author__ = 'Career Coach Team'
__description__ = 'Kyle - CV & Cover Letter Expert (Enhanced with RAG, Positioning Analysis, and Interview Prep)'
