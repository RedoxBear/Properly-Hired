# Base44 Custom Integrations - Kyle & Simon v2.1.0

Deploy Kyle and Simon AI agents to Base44 platform via GitHub.

---

## Overview

Two custom integrations for Base44:

1. **JobAnalysis** - Simon v2.1.0 (Recruiting & HR Expert)
   - Job opportunity analysis
   - Ghost-job detection
   - Role classification
   - Company research

2. **ResumeOptimizer** - Kyle v2.1.0 (CV & Cover Letter Expert)
   - Resume positioning
   - Interview preparation
   - CV/Cover Letter strategies
   - Complete application package

---

## Directory Structure

```
base44-integrations/
├── JobAnalysis.py          # Simon integration
├── ResumeOptimizer.py      # Kyle integration
├── requirements.txt        # Python dependencies
├── README.md              # This file
└── examples/
    └── frontend-usage.js   # Frontend integration examples
```

---

## Deployment via GitHub

### Step 1: Copy Integration Files to Your Base44 Repo

```bash
# From your prague-day directory
cp -r base44-integrations/* <your-base44-repo>/integrations/

# Or if Base44 expects a specific directory structure:
cp base44-integrations/JobAnalysis.py <your-base44-repo>/functions/
cp base44-integrations/ResumeOptimizer.py <your-base44-repo>/functions/
```

### Step 2: Copy Agent Dependencies

The integrations need access to the Kyle and Simon agents:

```bash
# Option A: Copy agents to Base44 repo
cp -r /mnt/f/Projects/AI_Projects/code/career-coach/agents <your-base44-repo>/

# Option B: Add as git submodule (recommended)
cd <your-base44-repo>
git submodule add <career-coach-repo-url> agents
```

### Step 3: Add Dependencies

Create or update `requirements.txt`:

```txt
# Python dependencies for Kyle & Simon integrations
langchain>=0.1.0
chromadb>=0.4.22
sentence-transformers>=2.2.0
torch>=2.0.0
```

### Step 4: Commit and Push to GitHub

```bash
cd <your-base44-repo>
git add .
git commit -m "Add Kyle & Simon AI integrations v2.1.0"
git push origin main
```

### Step 5: Base44 Auto-Deploy

Base44 will automatically detect and deploy your custom integrations from GitHub.

---

## Usage in Base44 Frontend

### Method 1: Using Base44 SDK (Recommended)

```javascript
// src/api/aiIntegrations.js
import { base44 } from './base44Client';

// Job Analysis (Simon)
export const analyzeJob = async (jobData) => {
  const result = await base44.integrations.Custom.JobAnalysis({
    action: 'analyze_job_opportunity',
    params: {
      jd_text: jobData.description,
      company_name: jobData.company,
      role_title: jobData.title,
      candidate_background: jobData.candidateBackground
    }
  });

  return result;
};

// Resume Optimization (Kyle)
export const optimizeResume = async (simonBrief) => {
  const result = await base44.integrations.Custom.ResumeOptimizer({
    action: 'optimize_complete_package',
    params: {
      simon_brief: simonBrief
    }
  });

  return result;
};

// Quick ghost-job check
export const checkGhostJob = async (jd_text, company, roleTitle) => {
  const result = await base44.integrations.Custom.JobAnalysis({
    action: 'calculate_ghost_job_score',
    params: { jd_text, company_name: company, role_title: roleTitle }
  });

  return result;
};
```

### Method 2: Complete Workflow

```javascript
// Complete Simon → Kyle workflow
export const analyzeAndOptimize = async (jobData) => {
  try {
    // Step 1: Simon analyzes job opportunity
    console.log('Step 1: Analyzing job opportunity...');
    const simonAnalysis = await analyzeJob(jobData);

    if (!simonAnalysis.success) {
      throw new Error(simonAnalysis.error);
    }

    const { recommendation, ghost_job, quality } = simonAnalysis.data;

    console.log(`Decision: ${recommendation.decision}`);
    console.log(`Ghost Score: ${ghost_job.score}/100`);
    console.log(`JD Quality: ${quality.rating}`);

    // Step 2: Check if worth pursuing
    if (recommendation.priority === 'SKIP') {
      return {
        pursue: false,
        reason: recommendation.reasoning,
        ghostScore: ghost_job.score
      };
    }

    // Step 3: Kyle optimizes resume package
    console.log('Step 2: Optimizing application package...');
    const kyleOptimization = await optimizeResume(simonAnalysis.data);

    if (!kyleOptimization.success) {
      throw new Error(kyleOptimization.error);
    }

    // Return complete package
    return {
      pursue: true,
      priority: recommendation.priority,
      simonAnalysis: simonAnalysis.data,
      kyleOptimization: kyleOptimization.data,
      ready: true
    };

  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
};
```

### Method 3: React Component Example

```jsx
// src/components/JobAnalyzer.jsx
import { useState } from 'react';
import { analyzeAndOptimize } from '@/api/aiIntegrations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function JobAnalyzer({ jobData }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const analysis = await analyzeAndOptimize(jobData);
      setResult(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">AI Job Analysis</h2>

      <Button
        onClick={handleAnalyze}
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Analyzing...' : 'Analyze Opportunity'}
      </Button>

      {result && (
        <div className="space-y-4">
          {!result.pursue ? (
            <div className="bg-red-50 p-4 rounded">
              <h3 className="font-bold text-red-800">Not Recommended</h3>
              <p className="text-red-700">{result.reason}</p>
              <p className="text-sm text-red-600">
                Ghost Job Score: {result.ghostScore}/100
              </p>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-bold text-green-800">
                Recommended - Priority: {result.priority}
              </h3>

              {/* Simon's Analysis */}
              <div className="mt-4">
                <h4 className="font-semibold">Role Analysis</h4>
                <p>Type: {result.simonAnalysis.role.type}</p>
                <p>Tier: {result.simonAnalysis.role.tier}</p>
                <p>JD Quality: {result.simonAnalysis.quality.rating}</p>
              </div>

              {/* Kyle's Positioning */}
              <div className="mt-4">
                <h4 className="font-semibold">Positioning Strategy</h4>
                <ul className="list-disc list-inside">
                  {result.kyleOptimization.positioning.positioning.key_themes.map((theme, i) => (
                    <li key={i}>{theme}</li>
                  ))}
                </ul>
              </div>

              {/* Interview Prep */}
              <div className="mt-4">
                <h4 className="font-semibold">Interview Preparation</h4>
                <p>STAR Templates: {result.kyleOptimization.interview_prep.star_method.templates.length}</p>
                <p>Practice Questions: {Object.keys(result.kyleOptimization.interview_prep.questions.by_category).length} categories</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
```

---

## API Reference

### JobAnalysis Integration

#### `analyze_job_opportunity()`
Complete job analysis with Simon's brief to Kyle.

**Parameters:**
- `jd_text` (str): Job description
- `company_name` (str): Company name
- `role_title` (str): Role title
- `candidate_background` (str, optional): Candidate background
- `posting_date` (str, optional): When job was posted

**Returns:**
```javascript
{
  success: true,
  data: {
    role: { title, company, type, tier, seniority, is_deputy, is_compliance },
    quality: { score, rating, strengths, issues },
    ghost_job: { score, risk_level, recommendation, red_flags, positive_signals },
    recommendation: { decision, priority, reasoning, confidence },
    strategy: { approach, tone, cv_emphasis, cover_letter_emphasis, warnings }
  }
}
```

#### `calculate_ghost_job_score()`
Quick ghost-job probability check.

**Parameters:**
- `jd_text` (str): Job description
- `company_name` (str): Company name
- `role_title` (str): Role title

**Returns:**
```javascript
{
  success: true,
  data: {
    score: 35,
    risk_level: "LOW",
    recommendation: "MONITOR - Minor concerns, likely legitimate",
    indicators: [...],
    positive_signals: [...]
  }
}
```

#### `classify_role()`
Enhanced role classification.

**Parameters:**
- `role_title` (str): Role title to classify

**Returns:**
```javascript
{
  success: true,
  data: {
    role_type: "Manager",
    tier: "Senior Manager",
    seniority_level: "senior manager",
    is_deputy: false,
    is_compliance: false
  }
}
```

---

### ResumeOptimizer Integration

#### `optimize_complete_package()`
Complete optimization: positioning + CV + cover letter + interview.

**Parameters:**
- `simon_brief` (dict): Complete brief from JobAnalysis
- `resume_data` (dict, optional): Resume data

**Returns:**
```javascript
{
  success: true,
  data: {
    positioning: { role, positioning, guidance, application_approach },
    cv_strategy: { best_practices, sources, confidence },
    cover_letter_strategy: { best_practices, key_elements, sources },
    bullet_strategies: { strategies, formulas, sources },
    interview_prep: { role, star_method, questions, preparation },
    simon_recommendation: { decision, priority, ghost_score }
  }
}
```

#### `analyze_target_role()`
Positioning analysis for target role.

#### `prepare_interview_strategy()`
STAR method templates and interview prep.

#### `get_cv_best_practices()`
CV best practices from knowledge base.

#### `get_cover_letter_best_practices()`
Cover letter strategies from knowledge base.

---

## Testing

### Local Testing (Before Deployment)

```bash
# Test JobAnalysis
cd base44-integrations
python3 JobAnalysis.py

# Test ResumeOptimizer
python3 ResumeOptimizer.py
```

### Testing After Deployment

Use Base44 console or frontend to test:

```javascript
// In browser console
const result = await base44.integrations.Custom.JobAnalysis({
  action: 'calculate_ghost_job_score',
  params: {
    jd_text: "Join our fast-paced team!",
    company_name: "TestCorp",
    role_title: "HR Manager"
  }
});

console.log(result);
```

---

## Troubleshooting

### "Module not found: agents"
- Ensure agents directory is in Base44 repo
- Check Python path configuration in Base44

### "RAG not available"
- ChromaDB may not be installed on Base44
- Agents will work without RAG but with limited knowledge
- Consider hosting RAG database separately

### "Permission denied: file writes"
- Base44 may restrict file system writes
- Set `save_to_file=False` in interview prep
- Return interview prep as JSON instead

---

## Configuration

### Environment Variables

Add to Base44 environment:

```bash
# Optional: If using external RAG service
RAG_SERVICE_URL=https://your-rag-service.com

# Optional: If using web search
SEARCH_API_KEY=your-search-api-key
```

---

## Version History

### v2.1.0 (Current)
- Initial Base44 integration
- Full Simon v2.1.0 features (ghost-job detection, role classification)
- Full Kyle v2.1.0 features (positioning, interview prep, STAR method)
- Complete Simon → Kyle workflow

---

## Support

For issues or questions:
1. Check Base44 logs for error messages
2. Test integrations locally first
3. Verify GitHub deployment completed successfully
4. Check Base44 custom integration documentation

---

## Next Steps

1. Deploy to GitHub
2. Verify Base44 auto-deployment
3. Test integrations from frontend
4. Build UI components for job analysis
5. Add to existing Base44 workflows
