# Base44 AI Integrations - Complete Setup Guide

**Version:** 2.1.0  
**Status:** Ready for Deployment  
**Last Updated:** January 29, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Agents](#architecture--agents)
3. [Quick Start Deployment](#quick-start-deployment)
4. [Knowledge Base Integration](#knowledge-base-integration)
5. [Frontend Integration](#frontend-integration)
6. [API Reference](#api-reference)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)
9. [Performance & Monitoring](#performance--monitoring)

---

## Overview

This integration deploys two AI agents to the Base44 platform via GitHub:

### **Agent 1: Simon v2.1.0** (JobAnalysis)
**Specialization:** Recruiting & HR Expert

**Capabilities:**
- Job opportunity analysis
- Ghost-job detection
- Role classification
- Company research
- JD quality assessment
- Application strategy

**Knowledge Base:** `\base44-integrations\knowledge\simon\`

### **Agent 2: Kyle v2.1.0** (ResumeOptimizer)
**Specialization:** CV & Cover Letter Expert

**Capabilities:**
- Resume positioning
- Interview preparation (STAR method)
- CV/Cover Letter strategies
- Complete application package optimization
- Bullet point formulation
- Interview question generation

**Knowledge Base:** `\base44-integrations\knowledge\kyle\`

### **Workflow: Simon → Kyle**

```
Job Description
      ↓
   Simon analyzes
      ↓
   Decision: Pursue or Skip?
      ↓
  If Pursue → Kyle optimizes resume package
      ↓
   Ready for application
```

---

## Architecture & Agents

### Directory Structure

```
properly-hired/ (Current Repository)
├── src/
│   ├── api/
│   │   ├── base44Client.js           # Base44 SDK
│   │   ├── entities.js
│   │   └── integrations.js           # AI integration helpers
│   ├── components/
│   │   └── ... (UI components)
│   ├── pages/
│   │   ├── JobAnalysis.jsx           # Simon integration page
│   │   ├── ResumeOptimizer.jsx       # Kyle integration page
│   │   └── ... (other pages)
│   └── lib/
│
├── integrations/                      # Python integration files
│   ├── JobAnalysis.py                # Simon integration
│   ├── ResumeOptimizer.py            # Kyle integration
│   └── requirements.txt              # Dependencies
│
├── agents/                            # Agent code (from career-coach)
│   ├── simon/
│   │   ├── simon.py
│   │   ├── simon_enhanced.py
│   │   └── __init__.py
│   ├── kyle/
│   │   ├── kyle.py
│   │   ├── kyle_enhanced.py
│   │   └── __init__.py
│   ├── rag_client.py
│   └── __init__.py
│
├── knowledge/                         # Agent knowledge base
│   ├── simon/                         # Simon's knowledge files
│   │   ├── interviewing.md           # Interview strategies
│   │   ├── role_classification.md
│   │   ├── ghost_job_signals.md
│   │   ├── company_research.md
│   │   └── ... (more knowledge files)
│   │
│   └── kyle/                          # Kyle's knowledge files
│       ├── cv_best_practices.md
│       ├── cover_letter_strategies.md
│       ├── star_method.md
│       ├── interview_preparation.md
│       └── ... (more knowledge files)
│
├── INTEGRATION_GUIDE.md               # This file
└── ... (other project files)
```

---

## Quick Start Deployment

### Prerequisites

- ✅ Base44 account with GitHub integration enabled
- ✅ GitHub repository connected to Base44
- ✅ Career coach agents available locally
- ✅ Python 3.8+
- ✅ Node.js 16+ (for frontend)

### Step 1: Prepare Your Repository Structure

Create the necessary directories in your GitHub repo:

```bash
# From your properly-hired directory
mkdir -p integrations agents knowledge/{simon,kyle}
```

### Step 2: Copy Integration Files

```bash
# Copy Python integration files
cp /path/to/base44-integrations/JobAnalysis.py integrations/
cp /path/to/base44-integrations/ResumeOptimizer.py integrations/
cp /path/to/base44-integrations/requirements.txt integrations/

# Copy agent code (if using agents from career-coach)
cp -r /path/to/career-coach/agents/* agents/
```

### Step 3: Update Integration Paths

Edit both `JobAnalysis.py` and `ResumeOptimizer.py`:

```python
# Change absolute paths to relative paths
# From:
sys.path.insert(0, '/path/to/absolute/location/career-coach')

# To:
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# This allows Base44 to find agents in the deployed repo
```

Create `integrations/__init__.py`:

```python
import sys
import os

# Add parent directory to path so Base44 can find agents
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
```

### Step 4: Commit and Push to GitHub

```bash
git add integrations/ agents/ knowledge/
git commit -m "Add Kyle & Simon AI integrations v2.1.0

- JobAnalysis (Simon) for job opportunity analysis
- ResumeOptimizer (Kyle) for resume optimization  
- Ghost-job detection
- Interview preparation with STAR method
- Complete knowledge base for both agents"

git push origin main
```

### Step 5: Verify Base44 Deployment

1. Go to Base44 Dashboard
2. Check **Integrations** section
3. Look for:
   - ✅ `JobAnalysis` (Simon)
   - ✅ `ResumeOptimizer` (Kyle)
4. Status should show "Active" or "Ready"

---

## Knowledge Base Integration

### Agent Knowledge Structure

The knowledge base is organized by agent and contains specialized knowledge files:

#### **Simon's Knowledge** (`knowledge/simon/`)

```
knowledge/simon/
├── ghost_job_signals.md          # Indicators of ghost jobs
├── role_classification.md         # Role tier/type classification
├── company_research.md           # Company analysis techniques
├── job_quality_assessment.md     # JD quality evaluation
├── application_strategy.md        # When to apply vs skip
└── industry_insights.md          # Industry-specific knowledge
```

#### **Kyle's Knowledge** (`knowledge/kyle/`)

```
knowledge/kyle/
├── cv_best_practices.md          # Resume optimization techniques
├── cover_letter_strategies.md    # Cover letter writing
├── star_method.md                # STAR interview method
├── interview_preparation.md      # Interview readiness
├── positioning_strategies.md     # Role positioning
├── bullet_point_formulas.md      # Bullet point writing
└── application_package.md        # Complete application strategy
```

### Loading Knowledge Base at Runtime

The agents load their knowledge automatically when initialized:

```python
# In JobAnalysis.py
from agents.simon import Simon

# Simon loads knowledge from knowledge/simon/
simon = Simon(knowledge_base_path='./knowledge/simon')

# In ResumeOptimizer.py
from agents.kyle import Kyle

# Kyle loads knowledge from knowledge/kyle/
kyle = Kyle(knowledge_base_path='./knowledge/kyle')
```

### Adding Custom Knowledge

To add new knowledge to an agent:

1. Create a new `.md` file in the appropriate `knowledge/{agent}/` directory
2. Use clear structure with headers and sections
3. Commit and push to GitHub
4. Base44 will automatically update on next deployment

**Example: Adding new interview strategy for Simon**

```markdown
# knowledge/simon/advanced_interviewing.md

## Advanced Interview Strategies

### Remote Interview Signals
- Check for company culture indicators
- Assess team dynamics from LinkedIn
- Look for remote work policy clarity

### Interview Red Flags
- Vague about role responsibilities
- No clear growth path mentioned
- Rapid turnover in position
```

---

## Frontend Integration

### Setup Integration Helpers

Create `src/api/aiIntegrations.js`:

```javascript
import { base44 } from './base44Client';

// Error handler
function handleIntegrationError(error) {
  console.error('AI Integration Error:', error);
  throw error;
}

// Simon (JobAnalysis) Functions
export const AI = {
  // Job Analysis with full Simon brief
  analyzeJob: async (jobData) => {
    try {
      const result = await base44.integrations.Custom.JobAnalysis({
        action: 'analyze_job_opportunity',
        params: {
          jd_text: jobData.description,
          company_name: jobData.company,
          role_title: jobData.title,
          candidate_background: jobData.candidateBackground,
          posting_date: jobData.postingDate
        }
      });
      return result;
    } catch (error) {
      handleIntegrationError(error);
    }
  },

  // Quick ghost-job check
  checkGhostJob: async (jd, company, title) => {
    try {
      const result = await base44.integrations.Custom.JobAnalysis({
        action: 'calculate_ghost_job_score',
        params: {
          jd_text: jd,
          company_name: company,
          role_title: title
        }
      });
      return result;
    } catch (error) {
      handleIntegrationError(error);
    }
  },

  // Role classification
  classifyRole: async (roleTitle) => {
    try {
      const result = await base44.integrations.Custom.JobAnalysis({
        action: 'classify_role',
        params: { role_title: roleTitle }
      });
      return result;
    } catch (error) {
      handleIntegrationError(error);
    }
  },

  // Kyle (ResumeOptimizer) Functions
  optimizeResume: async (simonAnalysis, resumeData) => {
    try {
      const result = await base44.integrations.Custom.ResumeOptimizer({
        action: 'optimize_complete_package',
        params: {
          simon_brief: simonAnalysis,
          resume_data: resumeData
        }
      });
      return result;
    } catch (error) {
      handleIntegrationError(error);
    }
  },

  // Interview preparation
  prepareInterview: async (simonAnalysis) => {
    try {
      const result = await base44.integrations.Custom.ResumeOptimizer({
        action: 'prepare_interview_strategy',
        params: {
          role_title: simonAnalysis.role.title,
          company_name: simonAnalysis.role.company,
          role_type: simonAnalysis.role.type
        }
      });
      return result;
    } catch (error) {
      handleIntegrationError(error);
    }
  },

  // Complete Simon → Kyle workflow
  analyzeAndOptimize: async (jobData, resumeData) => {
    try {
      // Step 1: Analyze job with Simon
      const simonAnalysis = await AI.analyzeJob(jobData);

      if (!simonAnalysis.success) {
        throw new Error(simonAnalysis.error);
      }

      // Step 2: Check if worth pursuing
      if (simonAnalysis.data.recommendation.priority === 'SKIP') {
        return {
          pursue: false,
          reason: simonAnalysis.data.recommendation.reasoning,
          ghostScore: simonAnalysis.data.ghost_job.score
        };
      }

      // Step 3: Optimize with Kyle
      const kyleOptimization = await AI.optimizeResume(
        simonAnalysis.data,
        resumeData
      );

      if (!kyleOptimization.success) {
        throw new Error(kyleOptimization.error);
      }

      return {
        pursue: true,
        simonAnalysis: simonAnalysis.data,
        kyleOptimization: kyleOptimization.data,
        ready: true
      };
    } catch (error) {
      handleIntegrationError(error);
    }
  }
};

export default AI;
```

### Add to React Pages

**Example: Create `src/pages/JobAnalysis.jsx`**

```jsx
import { useState } from 'react';
import { AI } from '@/api/aiIntegrations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export function JobAnalysis({ jobData }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await AI.analyzeJob(jobData);
      setResult(analysis.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Job'}
      </Button>

      {error && <Alert variant="destructive">{error}</Alert>}

      {result && (
        <div className="space-y-4">
          {/* Decision Card */}
          <Card className="p-4">
            <h3 className="font-bold text-lg">Decision</h3>
            <p className="text-2xl font-bold">
              {result.recommendation.decision}
            </p>
            <p className="text-gray-600">
              Priority: {result.recommendation.priority}
            </p>
          </Card>

          {/* Ghost Job Score */}
          <Card className="p-4">
            <h3 className="font-bold">Ghost Job Analysis</h3>
            <p>Score: {result.ghost_job.score}/100</p>
            <p>Risk Level: {result.ghost_job.risk_level}</p>
            <div className="mt-2 space-y-1">
              {result.ghost_job.red_flags.map((flag, i) => (
                <p key={i} className="text-red-600">⚠️ {flag}</p>
              ))}
            </div>
          </Card>

          {/* Role Classification */}
          <Card className="p-4">
            <h3 className="font-bold">Role Details</h3>
            <p>Type: {result.role.type}</p>
            <p>Tier: {result.role.tier}</p>
            <p>Seniority: {result.role.seniority}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
```

**Example: Create `src/pages/ResumeOptimizer.jsx`**

```jsx
import { useState } from 'react';
import { AI } from '@/api/aiIntegrations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ResumeOptimizer({ simonAnalysis, resumeData }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const optimization = await AI.optimizeResume(
        simonAnalysis,
        resumeData
      );
      setResult(optimization.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleOptimize}
        disabled={loading}
      >
        {loading ? 'Optimizing...' : 'Optimize Resume'}
      </Button>

      {result && (
        <div className="space-y-4">
          {/* Positioning Strategy */}
          <Card className="p-4">
            <h3 className="font-bold">Positioning Strategy</h3>
            <div className="mt-2 space-y-2">
              {result.positioning.positioning.key_themes.map((theme, i) => (
                <p key={i}>✓ {theme}</p>
              ))}
            </div>
          </Card>

          {/* Interview Preparation */}
          <Card className="p-4">
            <h3 className="font-bold">Interview Preparation</h3>
            <p>STAR Templates: {result.interview_prep.star_method.templates.length}</p>
            <p>Categories: {Object.keys(result.interview_prep.questions.by_category).join(', ')}</p>
          </Card>

          {/* CV Strategy */}
          <Card className="p-4">
            <h3 className="font-bold">Resume Best Practices</h3>
            <ul className="mt-2 space-y-1">
              {result.cv_strategy.best_practices.map((practice, i) => (
                <li key={i}>• {practice}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
```

---

## API Reference

### Simon (JobAnalysis) API

#### `analyze_job_opportunity()`

**Full job analysis with strategy recommendations**

**Parameters:**
```javascript
{
  jd_text: string,              // Job description text
  company_name: string,         // Company name
  role_title: string,           // Role title
  candidate_background: string, // (optional) Candidate info
  posting_date: string          // (optional) ISO date
}
```

**Returns:**
```javascript
{
  success: boolean,
  data: {
    role: {
      title: string,
      company: string,
      type: string,             // e.g., "Manager", "Individual Contributor"
      tier: string,             // e.g., "Senior Manager"
      seniority: string,        // "senior manager", "mid-level", etc
      is_deputy: boolean,
      is_compliance: boolean
    },
    quality: {
      score: number,
      rating: string,           // "Excellent", "Good", "Fair", "Poor"
      strengths: string[],
      issues: string[]
    },
    ghost_job: {
      score: number,            // 0-100
      risk_level: string,       // "LOW", "MEDIUM", "HIGH"
      recommendation: string,
      red_flags: string[],
      positive_signals: string[]
    },
    recommendation: {
      decision: string,         // "APPLY", "MONITOR", "SKIP"
      priority: string,         // "HIGH", "MEDIUM", "LOW"
      reasoning: string,
      confidence: number        // 0-100
    },
    strategy: {
      approach: string,
      tone: string,
      cv_emphasis: string[],
      cover_letter_emphasis: string[],
      warnings: string[]
    }
  },
  error?: string
}
```

#### `calculate_ghost_job_score()`

**Quick ghost-job probability check**

**Parameters:**
```javascript
{
  jd_text: string,
  company_name: string,
  role_title: string
}
```

**Returns:**
```javascript
{
  success: boolean,
  data: {
    score: number,              // 0-100
    risk_level: string,         // "LOW", "MEDIUM", "HIGH"
    recommendation: string,
    indicators: string[],
    positive_signals: string[]
  }
}
```

#### `classify_role()`

**Enhanced role classification**

**Parameters:**
```javascript
{
  role_title: string
}
```

**Returns:**
```javascript
{
  success: boolean,
  data: {
    role_type: string,
    tier: string,
    seniority_level: string,
    is_deputy: boolean,
    is_compliance: boolean
  }
}
```

---

### Kyle (ResumeOptimizer) API

#### `optimize_complete_package()`

**Complete optimization: positioning + CV + cover letter + interview**

**Parameters:**
```javascript
{
  simon_brief: object,          // Complete output from analyze_job_opportunity()
  resume_data: object           // (optional) Current resume/CV data
}
```

**Returns:**
```javascript
{
  success: boolean,
  data: {
    positioning: {
      role: string,
      positioning: string,
      guidance: string,
      application_approach: string
    },
    cv_strategy: {
      best_practices: string[],
      sources: string[],
      confidence: number
    },
    cover_letter_strategy: {
      best_practices: string[],
      key_elements: string[],
      sources: string[]
    },
    bullet_strategies: {
      strategies: string[],
      formulas: string[],
      sources: string[]
    },
    interview_prep: {
      role: string,
      star_method: {
        templates: object[],
        instructions: string
      },
      questions: {
        by_category: object
      },
      preparation: string
    },
    simon_recommendation: {
      decision: string,
      priority: string,
      ghost_score: number
    }
  }
}
```

#### `prepare_interview_strategy()`

**STAR method templates and interview prep**

**Parameters:**
```javascript
{
  role_title: string,
  company_name: string,
  role_type: string
}
```

**Returns:**
```javascript
{
  success: boolean,
  data: {
    star_method: {
      templates: object[],
      example_stories: object[]
    },
    interview_questions: {
      behavioral: string[],
      technical: string[],
      company_specific: string[]
    },
    preparation_guide: string
  }
}
```

---

## Testing & Verification

### Unit Testing Integration

Create `src/api/__tests__/aiIntegrations.test.js`:

```javascript
import { AI } from '../aiIntegrations';
import { describe, it, expect, beforeEach } from 'vitest';

describe('AI Integrations', () => {
  describe('Simon (JobAnalysis)', () => {
    it('should classify roles correctly', async () => {
      const result = await AI.classifyRole('Senior HR Manager');
      expect(result.success).toBe(true);
      expect(result.data.role_type).toBeDefined();
      expect(result.data.tier).toBeDefined();
    });

    it('should detect ghost jobs', async () => {
      const result = await AI.checkGhostJob(
        'Join our fast-paced team!',
        'TestCorp',
        'HR Manager'
      );
      expect(result.success).toBe(true);
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(result.data.score).toBeLessThanOrEqual(100);
    });

    it('should provide complete job analysis', async () => {
      const jobData = {
        description: 'Looking for an HR Manager...',
        company: 'TestCorp',
        title: 'HR Manager'
      };

      const result = await AI.analyzeJob(jobData);
      expect(result.success).toBe(true);
      expect(result.data.recommendation).toBeDefined();
      expect(['APPLY', 'MONITOR', 'SKIP']).toContain(
        result.data.recommendation.decision
      );
    });
  });

  describe('Kyle (ResumeOptimizer)', () => {
    it('should optimize resume for target role', async () => {
      const simonAnalysis = { /* Simon output */ };
      const resumeData = { /* Resume info */ };

      const result = await AI.optimizeResume(simonAnalysis, resumeData);
      expect(result.success).toBe(true);
      expect(result.data.positioning).toBeDefined();
      expect(result.data.interview_prep).toBeDefined();
    });
  });

  describe('Complete Workflow', () => {
    it('should complete Simon -> Kyle workflow', async () => {
      const jobData = {
        description: 'Job description...',
        company: 'Company',
        title: 'Role'
      };
      const resumeData = { /* Resume */ };

      const result = await AI.analyzeAndOptimize(jobData, resumeData);
      
      if (result.pursue) {
        expect(result.simonAnalysis).toBeDefined();
        expect(result.kyleOptimization).toBeDefined();
      } else {
        expect(result.reason).toBeDefined();
      }
    });
  });
});
```

### Manual Testing Checklist

- [ ] **Simon Basic**
  - [ ] Role classification works
  - [ ] Ghost-job detection works
  - [ ] Full analysis completes

- [ ] **Kyle Basic**
  - [ ] Resume optimization works
  - [ ] Interview prep generates templates
  - [ ] Positioning strategy provided

- [ ] **Workflow**
  - [ ] Simon → Kyle flow completes
  - [ ] Skip decisions handled properly
  - [ ] All data transfers correctly

- [ ] **Error Handling**
  - [ ] Invalid input handled
  - [ ] Network errors caught
  - [ ] Graceful fallbacks

---

## Troubleshooting

### Issue: "Integration not found"

**Symptoms:** Base44 console shows integration as unavailable

**Solutions:**
1. Verify files are in correct repository paths
2. Check Base44 deployment logs
3. Ensure GitHub push completed successfully
4. Wait 5 minutes for Base44 to sync
5. Manually trigger re-deployment in Base44

### Issue: "ModuleNotFoundError: agents"

**Symptoms:** Python integration fails with agent import error

**Solutions:**
1. Verify `agents/` directory exists in repo root
2. Check `agents/__init__.py` exists
3. Verify relative path in integration files:
   ```python
   sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
   ```
4. Test locally first:
   ```bash
   python integrations/JobAnalysis.py
   ```

### Issue: "RAG not available"

**Expected behavior:** Agents work without RAG but with limited knowledge

**Solutions:**
- This is normal - integrations work without RAG
- Full knowledge access requires RAG service running
- For better performance, consider hosting RAG separately

### Issue: "Permission denied: file writes"

**Symptoms:** Interview prep fails when saving files

**Solutions:**
```python
# Disable file writing in Base44 environment
interview_prep = kyle.prepare_interview_strategy(
    role_title=title,
    save_to_file=False  # Return JSON instead of saving
)
```

### Issue: "CORS or network errors"

**Symptoms:** Frontend integration calls fail with network errors

**Solutions:**
1. Verify Base44 endpoint URLs
2. Check CORS configuration in Base44
3. Ensure network connectivity
4. Review Base44 network logs

---

## Performance & Monitoring

### Add Monitoring & Logging

```javascript
// src/api/aiIntegrations.js - Enhanced with monitoring

const PERFORMANCE_THRESHOLDS = {
  analyzeJob: 10000,      // 10 seconds
  optimizeResume: 8000,   // 8 seconds
  classifyRole: 2000      // 2 seconds
};

function createMonitoredCall(fnName, baseFn) {
  return async (...args) => {
    const startTime = performance.now();
    const threshold = PERFORMANCE_THRESHOLDS[fnName] || 5000;

    try {
      const result = await baseFn(...args);
      const duration = performance.now() - startTime;

      // Log performance
      if (duration > threshold) {
        console.warn(`${fnName} took ${duration}ms (threshold: ${threshold}ms)`);
      } else {
        console.log(`${fnName} completed in ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`${fnName} failed after ${duration}ms:`, error);
      throw error;
    }
  };
}

export const AI = {
  analyzeJob: createMonitoredCall('analyzeJob', async (jobData) => {
    return base44.integrations.Custom.JobAnalysis({
      action: 'analyze_job_opportunity',
      params: { /* ... */ }
    });
  }),
  // ... other functions
};
```

### Cache Frequently Used Data

```javascript
// Cache role classifications for performance
const roleCache = new Map();

export async function classifyRoleCached(roleTitle) {
  if (roleCache.has(roleTitle)) {
    console.log(`Cache hit for role: ${roleTitle}`);
    return roleCache.get(roleTitle);
  }

  const result = await AI.classifyRole(roleTitle);
  roleCache.set(roleTitle, result);
  return result;
}
```

### Use React Query for State Management

```javascript
import { useQuery } from '@tanstack/react-query';
import { AI } from '@/api/aiIntegrations';

export function useJobAnalysis(jobData) {
  return useQuery({
    queryKey: ['job-analysis', jobData.id],
    queryFn: () => AI.analyzeJob(jobData),
    staleTime: 5 * 60 * 1000,   // 5 minutes
    cacheTime: 10 * 60 * 1000,  // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}

// Usage in component
function JobAnalysisPage({ jobData }) {
  const { data, isLoading, error } = useJobAnalysis(jobData);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}
```

---

## Success Checklist

- [ ] Integration files in GitHub repo (`integrations/`)
- [ ] Agents directory copied (`agents/`)
- [ ] Knowledge base organized (`knowledge/simon/`, `knowledge/kyle/`)
- [ ] Python dependencies in `requirements.txt`
- [ ] Paths updated to relative paths
- [ ] Pushed to GitHub
- [ ] Base44 deployment verified
- [ ] `src/api/aiIntegrations.js` created
- [ ] React pages integrate with AI
- [ ] Testing completed
- [ ] Monitoring in place
- [ ] Documentation updated

---

## Next Steps

1. ✅ Deploy integrations to GitHub
2. ✅ Verify Base44 auto-deployment
3. ✅ Test integrations in frontend
4. 🔄 Build UI components for each integration
5. 🔄 Add to existing workflows
6. 🔄 Monitor usage and performance
7. 🔄 Iterate based on user feedback

---

## Additional Resources

- [Base44 Documentation](https://base44.com/docs)
- [Career Coach Repository](https://github.com/your-org/career-coach)
- [Properly Hired Repository](https://github.com/your-org/properly-hired)

---

**Version 2.1.0 | Last Updated: January 29, 2026**
