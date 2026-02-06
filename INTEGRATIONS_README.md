# Base44 AI Integrations Guide - Kyle & Simon v2.1.0

Comprehensive guide to integrate and deploy Kyle & Simon AI agents for job analysis and resume optimization in your Prague-Day application.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Installation & Deployment](#installation--deployment)
- [Frontend Integration](#frontend-integration)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Configuration](#configuration)
- [Performance Optimization](#performance-optimization)

---

## 🎯 Overview

This integration brings two powerful AI agents to your Base44 application:

### **JobAnalysis (Simon v2.1.0)** - Recruiting & HR Expert
- Job opportunity analysis
- Ghost-job detection
- Role classification
- Company research
- Comprehensive job evaluation with red flags

### **ResumeOptimizer (Kyle v2.1.0)** - CV & Cover Letter Expert
- Resume positioning strategies
- Interview preparation
- CV/Cover Letter optimization
- STAR method templates
- Complete application package guidance

---

## ✅ Prerequisites

- Base44 account with GitHub integration enabled
- GitHub repository connected to Base44
- Kyle & Simon agents from career-coach repository
- Node.js 16+ and Python 3.8+
- Git for version control

---

## 🚀 Quick Start (5 Steps)

### Step 1: Prepare Your Repository Structure

Ensure your repository looks like this:

```
prague-day/
├── src/                          # Frontend code
├── integrations/                 # Base44 custom integrations (NEW)
│   ├── JobAnalysis.py           # Simon integration
│   ├── ResumeOptimizer.py       # Kyle integration
│   └── requirements.txt         # Python dependencies
├── agents/                       # Kyle & Simon agents (NEW)
│   ├── __init__.py
│   ├── kyle/
│   │   ├── __init__.py
│   │   ├── kyle_enhanced.py
│   │   └── kyle.py
│   ├── simon/
│   │   ├── __init__.py
│   │   ├── simon_enhanced.py
│   │   └── simon.py
│   └── rag_client.py
├── package.json
└── INTEGRATIONS_README.md        # This file
```

### Step 2: Copy Integration Files

```bash
# Navigate to your prague-day repo
cd f:\Projects\AI_Projects\code\prague-day\Prague-Day

# Create integrations directory
mkdir integrations

# Copy integration files
cp ../integrations/JobAnalysis.py integrations/
cp ../integrations/ResumeOptimizer.py integrations/
cp ../integrations/requirements.txt integrations/

# Copy agents directory
cp -r ../../career-coach/agents .
```

### Step 3: Update Integration Paths

Edit the Python path in both integration files:

```python
# In JobAnalysis.py and ResumeOptimizer.py
# Change from absolute path:
sys.path.insert(0, '/mnt/f/Projects/AI_Projects/code/career-coach')

# To relative path:
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
```

Or create a `__init__.py` in integrations:

```python
# integrations/__init__.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
```

### Step 4: Install Dependencies

```bash
# Install Python dependencies
pip install -r integrations/requirements.txt

# Dependencies needed:
# - langchain>=0.1.0
# - chromadb>=0.4.22
# - sentence-transformers>=2.2.0
# - torch>=2.0.0
```

### Step 5: Commit and Push to GitHub

```bash
git add .
git commit -m "Add Kyle & Simon AI integrations v2.1.0

- JobAnalysis integration (Simon) for opportunity analysis
- ResumeOptimizer integration (Kyle) for resume optimization
- Complete Simon → Kyle workflow
- Ghost-job detection
- Interview preparation with STAR method
"
git push origin main
```

After pushing, Base44 will automatically detect and deploy your custom integrations.

---

## 📂 Directory Structure

### Main Integration Directory

```
integrations/
├── JobAnalysis.py          # Simon integration module
├── ResumeOptimizer.py      # Kyle integration module
├── requirements.txt        # Python dependencies
└── __init__.py            # Package initialization
```

### Agents Directory (Dependency)

```
agents/
├── __init__.py
├── kyle/
│   ├── __init__.py
│   ├── kyle.py            # Core Kyle agent
│   └── kyle_enhanced.py    # Enhanced features
├── simon/
│   ├── __init__.py
│   ├── simon.py           # Core Simon agent
│   └── simon_enhanced.py  # Enhanced features
└── rag_client.py          # RAG service client
```

---

## 📦 Installation & Deployment

### Local Installation

```bash
# 1. Clone/navigate to your prague-day repo
cd /path/to/prague-day

# 2. Create integrations directory
mkdir -p integrations

# 3. Copy files from external integrations folder
cp /path/to/integrations/* integrations/

# 4. Copy agents directory
cp -r /path/to/agents .

# 5. Install dependencies
pip install -r integrations/requirements.txt

# 6. Verify installation
python3 integrations/JobAnalysis.py --test
python3 integrations/ResumeOptimizer.py --test
```

### GitHub Deployment

```bash
# 1. Stage all changes
git add .

# 2. Commit with descriptive message
git commit -m "Add Kyle & Simon integrations v2.1.0"

# 3. Push to main branch
git push origin main

# 4. Base44 will auto-detect and deploy
# Check Base44 dashboard for deployment status
```

### Verify Deployment in Base44

1. Go to Base44 dashboard
2. Navigate to **Integrations** section
3. Look for:
   - ✅ `JobAnalysis` integration
   - ✅ `ResumeOptimizer` integration
4. Status should show "Active"

---

## 🔌 Frontend Integration

### Method 1: Create API Helper Module (Recommended)

Create a new file `src/api/aiIntegrations.js`:

```javascript
import { base44 } from './base44Client';

export const AI = {
  // ===== SIMON (JobAnalysis) FUNCTIONS =====

  /**
   * Complete job analysis with opportunity evaluation
   * @param {string} jd_text - Job description text
   * @param {string} company_name - Company name
   * @param {string} role_title - Role title
   * @param {string} candidate_background - (Optional) Candidate background
   * @returns {Promise<object>} Analysis result with recommendations
   */
  analyzeJob: async (jd_text, company_name, role_title, candidate_background = null) => {
    return base44.integrations.Custom.JobAnalysis({
      action: 'analyze_job_opportunity',
      params: {
        jd_text,
        company_name,
        role_title,
        ...(candidate_background && { candidate_background })
      }
    });
  },

  /**
   * Quick ghost-job probability check
   * @param {string} jd_text - Job description
   * @param {string} company_name - Company name
   * @param {string} role_title - Role title
   * @returns {Promise<object>} Ghost job score and risk level
   */
  checkGhostJob: async (jd_text, company_name, role_title) => {
    return base44.integrations.Custom.JobAnalysis({
      action: 'calculate_ghost_job_score',
      params: { jd_text, company_name, role_title }
    });
  },

  /**
   * Classify a role based on title
   * @param {string} role_title - Role title to classify
   * @returns {Promise<object>} Role classification details
   */
  classifyRole: async (role_title) => {
    return base44.integrations.Custom.JobAnalysis({
      action: 'classify_role',
      params: { role_title }
    });
  },

  // ===== KYLE (ResumeOptimizer) FUNCTIONS =====

  /**
   * Complete optimization of entire application package
   * @param {object} simon_brief - Complete brief from JobAnalysis
   * @param {object} resume_data - (Optional) Resume data
   * @returns {Promise<object>} Complete optimization package
   */
  optimizeResume: async (simon_brief, resume_data = null) => {
    return base44.integrations.Custom.ResumeOptimizer({
      action: 'optimize_complete_package',
      params: {
        simon_brief,
        ...(resume_data && { resume_data })
      }
    });
  },

  /**
   * Get CV best practices for target role
   * @param {string} role_type - Type of role
   * @param {string} experience_level - Experience level
   * @returns {Promise<object>} CV best practices
   */
  getCVPractices: async (role_type, experience_level = 'mid') => {
    return base44.integrations.Custom.ResumeOptimizer({
      action: 'get_cv_best_practices',
      params: { role_type, experience_level }
    });
  },

  /**
   * Get cover letter best practices
   * @param {string} role_type - Type of role
   * @param {string} industry - Industry context
   * @returns {Promise<object>} Cover letter strategies
   */
  getCoverLetterPractices: async (role_type, industry = null) => {
    return base44.integrations.Custom.ResumeOptimizer({
      action: 'get_cover_letter_best_practices',
      params: { role_type, ...(industry && { industry }) }
    });
  },

  /**
   * Prepare interview strategy with STAR method
   * @param {string} role_title - Role title
   * @param {string} company_name - Company name
   * @param {string} role_type - Role type
   * @returns {Promise<object>} Interview preparation package
   */
  prepareInterview: async (role_title, company_name, role_type) => {
    return base44.integrations.Custom.ResumeOptimizer({
      action: 'prepare_interview_strategy',
      params: { role_title, company_name, role_type }
    });
  },

  // ===== COMBINED WORKFLOW =====

  /**
   * Complete Simon → Kyle workflow
   * @param {object} jobData - Job data object
   * @returns {Promise<object>} Complete analysis and optimization
   */
  analyzeAndOptimize: async (jobData) => {
    try {
      // Step 1: Simon analyzes job opportunity
      console.log('Step 1: Analyzing job opportunity...');
      const simonAnalysis = await AI.analyzeJob(
        jobData.description,
        jobData.company,
        jobData.title,
        jobData.candidateBackground
      );

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
          ghostScore: ghost_job.score,
          simonAnalysis: simonAnalysis.data
        };
      }

      // Step 3: Kyle optimizes resume package
      console.log('Step 2: Optimizing application package...');
      const kyleOptimization = await AI.optimizeResume(simonAnalysis.data);

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
      console.error('Analysis and optimization failed:', error);
      throw error;
    }
  }
};

export default AI;
```

### Method 2: Use in React Components

```jsx
// src/components/JobAnalyzer.jsx
import { useState } from 'react';
import { AI } from '@/api/aiIntegrations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function JobAnalyzer({ jobData }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await AI.analyzeAndOptimize(jobData);
      setResult(analysis);
    } catch (err) {
      setError(err.message);
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">AI Job Analysis</h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <h3 className="font-bold text-red-800">Not Recommended</h3>
              <p className="text-red-700 mt-2">{result.reason}</p>
              <p className="text-sm text-red-600 mt-2">
                Ghost Job Score: {result.ghostScore}/100
              </p>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <h3 className="font-bold text-green-800">
                ✓ Recommended - Priority: {result.priority}
              </h3>

              {/* Simon's Analysis */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-gray-800">Job Analysis (Simon)</h4>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-gray-600">Role Type:</span>
                    <p className="font-medium">{result.simonAnalysis.role.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tier:</span>
                    <p className="font-medium">{result.simonAnalysis.role.tier}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">JD Quality:</span>
                    <p className="font-medium">{result.simonAnalysis.quality.rating}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ghost Score:</span>
                    <p className="font-medium">{result.simonAnalysis.ghost_job.score}/100</p>
                  </div>
                </div>
              </div>

              {/* Kyle's Positioning */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-gray-800">Positioning Strategy (Kyle)</h4>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  {result.kyleOptimization.positioning.key_themes?.map((theme, i) => (
                    <li key={i} className="text-gray-700">{theme}</li>
                  ))}
                </ul>
              </div>

              {/* Interview Prep */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-gray-800">Interview Preparation</h4>
                <div className="text-sm text-gray-700 mt-2">
                  <p>📋 STAR Templates: {result.kyleOptimization.interview_prep.star_method.templates.length}</p>
                  <p>❓ Practice Questions: {Object.keys(result.kyleOptimization.interview_prep.questions.by_category).length} categories</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
```

### Method 3: Use with React Query (For Caching & State Management)

```jsx
// src/hooks/useJobAnalysis.js
import { useQuery } from '@tanstack/react-query';
import { AI } from '@/api/aiIntegrations';

export function useJobAnalysis(jobData) {
  return useQuery({
    queryKey: ['job-analysis', jobData?.id],
    queryFn: () => AI.analyzeAndOptimize(jobData),
    enabled: !!jobData,
    staleTime: 5 * 60 * 1000,    // 5 minutes
    cacheTime: 10 * 60 * 1000    // 10 minutes
  });
}

// Usage in component
import { useJobAnalysis } from '@/hooks/useJobAnalysis';

export function MyComponent({ jobData }) {
  const { data, isLoading, error } = useJobAnalysis(jobData);

  return (
    <div>
      {isLoading && <p>Analyzing...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <div>{/* Display results */}</div>}
    </div>
  );
}
```

---

## 📚 API Reference

### JobAnalysis Integration (Simon)

#### `analyze_job_opportunity()`
Complete job analysis with Simon's evaluation.

**Parameters:**
```javascript
{
  jd_text: string,              // Job description text
  company_name: string,         // Company name
  role_title: string,           // Role title
  candidate_background?: string // (Optional) Candidate background
}
```

**Returns:**
```javascript
{
  success: true,
  data: {
    role: { 
      title, company, type, tier, seniority, 
      is_deputy, is_compliance 
    },
    quality: { 
      score, rating, strengths, issues 
    },
    ghost_job: { 
      score, risk_level, recommendation, 
      red_flags, positive_signals 
    },
    recommendation: { 
      decision, priority, reasoning, confidence 
    },
    strategy: { 
      approach, tone, cv_emphasis, 
      cover_letter_emphasis, warnings 
    }
  }
}
```

#### `calculate_ghost_job_score()`
Quick ghost-job probability check.

**Parameters:**
```javascript
{
  jd_text: string,      // Job description
  company_name: string, // Company name
  role_title: string    // Role title
}
```

**Returns:**
```javascript
{
  success: true,
  data: {
    score: 0-100,           // Ghost job score
    risk_level: string,     // LOW, MEDIUM, HIGH
    recommendation: string, // Assessment text
    indicators: [...],      // Red flags
    positive_signals: [...]  // Green flags
  }
}
```

#### `classify_role()`
Enhanced role classification.

**Parameters:**
```javascript
{
  role_title: string // Role title to classify
}
```

**Returns:**
```javascript
{
  success: true,
  data: {
    role_type: string,      // e.g., "Manager"
    tier: string,           // e.g., "Senior Manager"
    seniority_level: string,// "junior", "mid", "senior"
    is_deputy: boolean,
    is_compliance: boolean
  }
}
```

### ResumeOptimizer Integration (Kyle)

#### `optimize_complete_package()`
Complete optimization of resume, cover letter, and interview prep.

**Parameters:**
```javascript
{
  simon_brief: object,     // Complete brief from JobAnalysis
  resume_data?: object     // (Optional) Resume data
}
```

**Returns:**
```javascript
{
  success: true,
  data: {
    positioning: { 
      role, positioning, guidance, application_approach 
    },
    cv_strategy: { 
      best_practices, sources, confidence 
    },
    cover_letter_strategy: { 
      best_practices, key_elements, sources 
    },
    bullet_strategies: { 
      strategies, formulas, sources 
    },
    interview_prep: { 
      role, star_method, questions, preparation 
    },
    simon_recommendation: { 
      decision, priority, ghost_score 
    }
  }
}
```

#### `get_cv_best_practices()`
CV best practices for target role.

**Parameters:**
```javascript
{
  role_type: string,            // Role type
  experience_level?: string     // "junior", "mid", "senior"
}
```

#### `get_cover_letter_best_practices()`
Cover letter strategies.

**Parameters:**
```javascript
{
  role_type: string,    // Role type
  industry?: string     // (Optional) Industry context
}
```

#### `prepare_interview_strategy()`
Interview prep with STAR method.

**Parameters:**
```javascript
{
  role_title: string,   // Role title
  company_name: string, // Company name
  role_type: string     // Role type
}
```

---

## 💡 Usage Examples

### Example 1: Basic Job Analysis

```javascript
import { AI } from '@/api/aiIntegrations';

const jobData = {
  title: 'Senior HR Manager',
  company: 'TechCorp',
  description: 'Looking for HR Manager with 5+ years experience...',
  candidateBackground: 'HR Specialist, 4 years experience'
};

try {
  const analysis = await AI.analyzeJob(
    jobData.description,
    jobData.company,
    jobData.title,
    jobData.candidateBackground
  );

  console.log('Decision:', analysis.data.recommendation.decision);
  console.log('Priority:', analysis.data.recommendation.priority);
  console.log('Ghost Score:', analysis.data.ghost_job.score);
} catch (error) {
  console.error('Analysis failed:', error);
}
```

### Example 2: Ghost Job Detection Only

```javascript
const ghostJobCheck = await AI.checkGhostJob(
  'Join our team! Work on cool projects!',
  'FastGrowthCo',
  'Software Engineer'
);

if (ghostJobCheck.data.score > 70) {
  console.warn('⚠️ High ghost job risk:', ghostJobCheck.data.recommendation);
} else {
  console.log('✓ Likely legitimate opportunity');
}
```

### Example 3: Complete Workflow

```javascript
const jobData = {
  title: 'Product Manager',
  company: 'StartupXYZ',
  description: '...',
  candidateBackground: '...'
};

// Complete analysis and optimization
const result = await AI.analyzeAndOptimize(jobData);

if (result.pursue) {
  // Update UI with positioning
  updatePositioningGuidance(result.kyleOptimization.positioning);
  
  // Prepare interview materials
  prepareInterviewNotes(result.kyleOptimization.interview_prep);
  
  // Show resume strategies
  showResumeTips(result.kyleOptimization.cv_strategy);
} else {
  // Show recommendation to skip
  console.log('Skip reason:', result.reason);
}
```

### Example 4: Batch Processing Multiple Jobs

```javascript
async function analyzeMultipleJobs(jobs) {
  const results = [];

  for (let i = 0; i < jobs.length; i += 5) {
    // Process in batches of 5
    const batch = jobs.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map(job => AI.analyzeJob(
        job.description,
        job.company,
        job.title
      ))
    );
    results.push(...batchResults);

    // Small delay between batches to avoid rate limiting
    if (i + 5 < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

---

## 🧪 Testing

### Test in Base44 Console

```javascript
// Test JobAnalysis
const result = await base44.integrations.Custom.JobAnalysis({
  action: 'calculate_ghost_job_score',
  params: {
    jd_text: "Join our fast-paced team! Competitive salary.",
    company_name: "TestCorp",
    role_title: "HR Manager"
  }
});

console.log('Ghost Job Score:', result.data.score);
console.log('Risk Level:', result.data.risk_level);
```

### Test Frontend Integration

```javascript
// Add to your page for testing
async function testIntegrations() {
  try {
    console.log('Testing Simon (JobAnalysis)...');
    const simon = await base44.integrations.Custom.JobAnalysis({
      action: 'classify_role',
      params: { role_title: 'Senior HR Manager' }
    });
    console.log('✓ Simon works:', simon);

    console.log('Testing Kyle (ResumeOptimizer)...');
    const kyle = await base44.integrations.Custom.ResumeOptimizer({
      action: 'get_cv_best_practices',
      params: { role_type: 'Manager', experience_level: 'senior' }
    });
    console.log('✓ Kyle works:', kyle);

  } catch (error) {
    console.error('✗ Integration test failed:', error);
  }
}

testIntegrations();
```

### Local Testing

```bash
# Test JobAnalysis
python3 integrations/JobAnalysis.py

# Test ResumeOptimizer
python3 integrations/ResumeOptimizer.py
```

---

## 🔧 Troubleshooting

### Issue: "Integration not found"
**Solution:**
1. Check Base44 deployment logs
2. Verify files are in correct `integrations/` directory
3. Ensure GitHub push completed successfully
4. Wait a few minutes for Base44 to redeploy
5. Refresh Base44 dashboard

### Issue: "ModuleNotFoundError: agents"
**Solution:**
1. Verify `agents/` directory exists in repo root
2. Check `agents/__init__.py` exists
3. Update Python paths in integration files
4. Test locally: `python3 -c "import agents.kyle; print('OK')"`

### Issue: "RAG not available"
**Expected behavior** - Kyle and Simon work without RAG but with limited knowledge.

**Solutions:**
- Integrations still function (basic knowledge base)
- For full RAG access, host database separately
- Add `RAG_SERVICE_URL` to Base44 environment variables

### Issue: "Permission denied: file writes"
**Expected behavior** - Base44 may restrict file system writes.

**Solution:**
```python
# Set save_to_file=False in interview prep
interview_prep = kyle.prepare_interview_strategy(
    role_title=title,
    save_to_file=False  # Don't write to disk
)
```

### Issue: Integration Timeout
**Solution:**
- Increase timeout in Base44 settings
- Cache frequently used results
- Use batch processing with delays

---

## ⚙️ Configuration

### Environment Variables

Add these to Base44 if needed:

```bash
# RAG Service (if hosted separately)
RAG_SERVICE_URL=https://your-rag-service.com

# Web Search API
SEARCH_API_KEY=your-search-api-key

# LLM Provider
OPENAI_API_KEY=your-openai-key
```

### Python Requirements

**File:** `integrations/requirements.txt`
```
langchain>=0.1.0
chromadb>=0.4.22
sentence-transformers>=2.2.0
torch>=2.0.0
requests>=2.28.0
python-dotenv>=0.20.0
```

---

## ⚡ Performance Optimization

### 1. Cache Results

```javascript
const cache = new Map();

export async function classifyRoleCached(roleTitle) {
  if (cache.has(roleTitle)) {
    return cache.get(roleTitle);
  }

  const result = await AI.classifyRole(roleTitle);
  cache.set(roleTitle, result);
  return result;
}
```

### 2. Use React Query

```javascript
import { useQuery } from '@tanstack/react-query';

export function useJobAnalysis(jobData) {
  return useQuery({
    queryKey: ['job-analysis', jobData.id],
    queryFn: () => AI.analyzeJob(jobData),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });
}
```

### 3. Batch Processing

```javascript
export async function batchAnalyze(jobs, batchSize = 5) {
  const results = [];

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(job => AI.analyzeJob(job))
    );
    results.push(...batchResults);

    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

### 4. Monitoring & Logging

```javascript
export const AI = {
  analyzeJob: async (...args) => {
    const startTime = Date.now();
    try {
      const result = await base44.integrations.Custom.JobAnalysis({...});
      console.log('✓ analyzeJob', {
        duration: Date.now() - startTime,
        success: true
      });
      return result;
    } catch (error) {
      console.error('✗ analyzeJob', {
        duration: Date.now() - startTime,
        error: error.message
      });
      throw error;
    }
  }
};
```

---

## ✅ Success Checklist

- [ ] Integration files copied to `integrations/` directory
- [ ] Agents directory copied to repo root
- [ ] Dependencies installed: `pip install -r integrations/requirements.txt`
- [ ] Python paths updated (relative imports)
- [ ] Changes committed to GitHub
- [ ] Base44 deployment verified (status: Active)
- [ ] JobAnalysis integration tested
- [ ] ResumeOptimizer integration tested
- [ ] API helper module created (`src/api/aiIntegrations.js`)
- [ ] React components integrated
- [ ] Frontend testing completed
- [ ] Error handling implemented
- [ ] Monitoring/logging in place
- [ ] Performance optimizations applied

---

## 📞 Support

**Common Questions:**

**Q: How much does this cost on Base44?**
A: Depends on your Base44 plan and usage. Check Base44 pricing.

**Q: Can I update integrations after deployment?**
A: Yes! Update files in `integrations/`, commit, and push. Base44 auto-deploys.

**Q: What if RAG isn't available?**
A: Basic functionality works. For full knowledge access, host RAG separately.

**Q: How do I add more features?**
A: Update `integrations/JobAnalysis.py` or `integrations/ResumeOptimizer.py` and push.

**Q: How to debug integration issues?**
A: Check Base44 logs, test locally, verify Python imports, ensure paths are relative.

---

## 🎉 Next Steps

1. ✅ Install and deploy integrations
2. ✅ Verify Base44 deployment
3. ✅ Create API helper module
4. ✅ Build React components
5. ✅ Add to existing workflows
6. ✅ Implement caching & performance
7. ✅ Monitor usage and performance
8. ✅ Iterate based on user feedback

---

**Version:** 2.1.0  
**Last Updated:** January 28, 2026  
**Maintained By:** Prague-Day Development Team
