# Prague-Day & Career-Coach CV File Structure Standard
**Date:** January 21, 2026
**Confirmed By:** Richard Xiong + Claude Sonnet 4.5

---

## ✅ CONFIRMED: Default CV Storage Location

**Primary Storage Path:** `/mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/`

**Current Status:**
- Prague-Day CVs: **65 files** (ACTIVE)
- Career-Coach CVs: **1 file** (BACKUP/LEGACY)

**Decision:** Prague-Day is the PRIMARY and DEFAULT storage location for all CVs.

---

## 📁 File Naming Convention

### Standard Format

```
YYMMDDHHMM - Company_Name - Position_Title - Version_Type.txt
```

**Components:**
1. **Timestamp:** `YYMMDDHHMM` (10 digits)
   - YY = Year (26 for 2026)
   - MM = Month (01-12)
   - DD = Day (01-31)
   - HH = Hour (00-23, 24-hour format)
   - MM = Minute (00-59)

2. **Company Name:** Replace spaces with underscores
   - Example: `Ajinomoto_Food`, `Yusen_Terminals_LLC`, `Anduril_Industries`

3. **Position Title:** Replace spaces with underscores
   - Example: `HR_Service_Center_Manager`, `HRBP`, `Head_of_People`

4. **Version Type:** Descriptive version identifier
   - Examples: `V1_SIMON_BRIEF`, `V2_KYLE_STRATEGY`, `V3_CV`, `V4_SAFETY_CV`
   - Or: `Resume_v2`, `Cover_Letter_v2`, `V6_EXHAUSTIVE`

### Format Examples (Currently in Use)

**Format 1 (PREFERRED - Shorter timestamp):**
```
2601071729 - Ajinomoto_Food - HR_Service_Center_Manager_V6_EXHAUSTIVE.txt
2601081210 - Yusen_Terminals_LLC - HRBP - V3_CV.txt
2601081305 - Anduril - People_Business_Partner - V2_KYLE_STRATEGY.txt
```

**Format 2 (Also acceptable - Full year):**
```
202601081830 - Akkodis - HR Director - Cover Letter v2.txt
202601081835 - Akkodis - HR Director - Resume v2.txt
```

---

## 📋 Version Type Taxonomy

### Kyle & Simon Workflow Versions

**V1_SIMON_BRIEF**
- Simon's initial analysis
- Company research and role assessment
- Ghost Job Score
- Target persona definition

**V2_KYLE_STRATEGY**
- Kyle's application strategy
- Skill mapping
- Positioning recommendations
- Protected signals identified

**V3_CV / V3_RESUME**
- First tailored CV/resume
- Based on Simon's brief + Kyle's strategy
- ATS-optimized

**V4+_[DESCRIPTOR]**
- Refined versions with specific focus
- Examples:
  - `V4_SAFETY_CV` - Safety-focused version
  - `V4_EXECUTIVE_CV` - Executive positioning
  - `V5_FINAL` - Final approved version
  - `V6_EXHAUSTIVE` - Comprehensive version

### Document Type Versions

**Resume v[X]**
- Resume document, iteration X
- Example: `Resume v2`, `Resume v3`

**Cover Letter v[X]**
- Cover letter document, iteration X
- Example: `Cover Letter v2`

---

## 🗂️ Directory Structure

```
/mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/
├── 2601071729 - Ajinomoto_Food - HR_Service_Center_Manager_V6_EXHAUSTIVE.txt
├── 2601081210 - Yusen_Terminals_LLC - HRBP - V3_CV.txt
├── 2601081220 - Yusen_Terminals_LLC - HRBP - V2_SAFETY_Cover_Letter.txt
├── 2601081305 - Anduril - People_Business_Partner - V2_KYLE_STRATEGY.txt
├── 202601081830 - Akkodis - HR Director - Cover Letter v2.txt
├── 202601081835 - Akkodis - HR Director - Resume v2.txt
└── ... (65 files total as of 2026-01-21)
```

---

## 🔄 Migration Path

### Career-Coach → Prague-Day

**Current State:**
- Career-Coach: `/mnt/f/Projects/AI_Projects/code/career-coach/data/CVs/` (1 file)
- Prague-Day: `/mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/` (65 files)

**Recommendation:**
1. Keep Prague-Day as primary
2. Career-Coach becomes backup/archive (optional)
3. Future Python-based Kyle & Simon agents should save to Prague-Day location

**Rationale:**
- Prague-Day is the active job application platform
- Already has 65 CVs (established workflow)
- Kyle & Simon agents (Node.js) are already integrated
- Future Python agents should use same location

---

## 🛠️ Implementation for Agents

### Prague-Day Agents (Kyle & Simon - Node.js)

**Storage Path (Current):**
```javascript
const CV_STORAGE_PATH = '/mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/';
```

**File Naming Function:**
```javascript
function generateCVFilename(companyName, positionTitle, versionType) {
    const now = new Date();
    const timestamp = [
        String(now.getFullYear()).slice(-2),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0')
    ].join('');

    const company = companyName.replace(/\s+/g, '_');
    const position = positionTitle.replace(/\s+/g, '_');

    return `${timestamp} - ${company} - ${position} - ${versionType}.txt`;
}

// Example usage:
// generateCVFilename("Ajinomoto Food", "HR Service Center Manager", "V6_EXHAUSTIVE")
// Returns: "2601071729 - Ajinomoto_Food - HR_Service_Center_Manager - V6_EXHAUSTIVE.txt"
```

### Future Python-Based Agents (Kyle & Simon - Brilliant Day)

**Storage Path:**
```python
from pathlib import Path
import os

CV_STORAGE_DIR = Path(
    os.getenv(
        "CAREER_COACH_CV_DIR",
        "/mnt/f/Projects/AI_Projects/code/prague-day/data/CVs"
    )
).resolve()
```

**File Naming Function:**
```python
from datetime import datetime

def generate_cv_filename(
    company_name: str,
    position_title: str,
    version_type: str
) -> str:
    """
    Generate standardized CV filename.

    Args:
        company_name: Company name (e.g., "Ajinomoto Food")
        position_title: Position (e.g., "HR Service Center Manager")
        version_type: Version identifier (e.g., "V6_EXHAUSTIVE")

    Returns:
        Filename string (e.g., "2601071729 - Ajinomoto_Food - HR_Service_Center_Manager - V6_EXHAUSTIVE.txt")
    """
    now = datetime.now()
    timestamp = now.strftime("%y%m%d%H%M")

    company = company_name.replace(" ", "_")
    position = position_title.replace(" ", "_")

    return f"{timestamp} - {company} - {position} - {version_type}.txt"

# Example usage:
# filename = generate_cv_filename(
#     "Ajinomoto Food",
#     "HR Service Center Manager",
#     "V6_EXHAUSTIVE"
# )
# filepath = CV_STORAGE_DIR / filename
# with open(filepath, 'w') as f:
#     f.write(cv_content)
```

---

## 📝 Master CV Protection

**Master CV Location:**
```
/mnt/f/Projects/AI_Projects/code/career-coach/master_cv.txt
```

**Protection Rules:**
1. **READ-ONLY:** Agents can read but NEVER modify
2. **Source of Truth:** All tailored CVs derive from master CV
3. **Manual Updates Only:** User must explicitly update
4. **Application Isolation:** Each tailored CV is generated fresh from master (no cross-contamination)

---

## 🎯 Naming Best Practices

### DO ✅

- Use underscores for spaces in company/position names
- Use consistent timestamp format (YYMMDDHHMM preferred)
- Use descriptive version types (V1_SIMON_BRIEF, V2_KYLE_STRATEGY)
- Include document type when ambiguous (Resume, Cover_Letter)
- Use sequential version numbers (V1, V2, V3, etc.)

### DON'T ❌

- Don't use spaces in filenames (use underscores)
- Don't use special characters (/, \, :, *, ?, ", <>, |)
- Don't reuse timestamps (each file should have unique timestamp)
- Don't modify master CV (read-only)
- Don't copy/borrow from previous tailored CVs (generate fresh each time)

---

## 🔍 Search & Organization

### Finding Files

**By Company:**
```bash
ls /mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/ | grep -i "ajinomoto"
# Returns all Ajinomoto-related CVs
```

**By Position:**
```bash
ls /mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/ | grep -i "hrbp"
# Returns all HRBP position CVs
```

**By Version Type:**
```bash
ls /mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/ | grep "SIMON_BRIEF"
# Returns all Simon's initial briefs
```

**By Date:**
```bash
ls /mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/ | grep "^2601" | sort
# Returns all files from January 2026, sorted
```

### Most Recent File for a Company:
```bash
ls /mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/ | grep -i "ajinomoto" | sort | tail -1
# Returns most recent Ajinomoto CV
```

---

## 📊 Current Statistics (2026-01-21)

**Total CVs Stored:** 65 files

**Breakdown by Type (sample):**
- Simon Briefs (V1_SIMON_BRIEF): 3+
- Kyle Strategies (V2_KYLE_STRATEGY): 3+
- Tailored CVs (V3_CV, V4_CV, etc.): 40+
- Cover Letters: 10+
- Specialized versions (SAFETY, EXECUTIVE, etc.): 9+

**Date Range:** 2026-01-07 to 2026-01-09 (active job search period)

**Companies Targeted:** Ajinomoto Food, Yusen Terminals, Anduril, Planhat, Akkodis, and 10+ others

---

## ✅ CONFIRMATION SUMMARY

**✅ Primary Storage Location:** `/mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/`

**✅ File Naming Format:** `YYMMDDHHMM - Company_Name - Position_Title - Version_Type.txt`

**✅ Current Status:** 65 files stored and organized

**✅ Both Projects Use Same Location:**
- Prague-Day: Active storage (65 files)
- Career-Coach: Legacy/backup (1 file)
- Future Python agents: Will use Prague-Day location

**✅ Master CV:** Protected at `/mnt/f/Projects/AI_Projects/code/career-coach/master_cv.txt` (read-only)

**✅ Agents:**
- Kyle (Node.js): Reads from this location ✅
- Simon (Node.js): Writes to this location ✅
- Future Kyle/Simon (Python): Will use this location ✅

---

**Standard confirmed and documented.**
**All agents should follow this convention.**

---

*Document created by: Claude Sonnet 4.5*
*Date: January 21, 2026*
*Status: ✅ Confirmed and Active*
