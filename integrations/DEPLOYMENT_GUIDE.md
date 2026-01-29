# Base44 Deployment Guide - GitHub Integration

Step-by-step guide to deploy Kyle & Simon v2.1.0 to Base44 via GitHub.

---

## Prerequisites

- ✅ Base44 account with GitHub integration enabled
- ✅ GitHub repository connected to Base44
- ✅ Kyle & Simon agents (career-coach) available

---

## Quick Start (5 Steps)

### 1. Prepare Your Repository Structure

Your Base44 GitHub repo should look like:

```
your-base44-repo/
├── src/                          # Frontend code (existing)
├── integrations/                 # Base44 custom integrations (new)
│   ├── JobAnalysis.py           # Simon integration
│   ├── ResumeOptimizer.py       # Kyle integration
│   └── requirements.txt         # Python dependencies
├── agents/                       # Kyle & Simon agents (dependency)
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
└── package.json                  # Frontend dependencies (existing)
```

### 2. Copy Integration Files

```bash
# Navigate to your Base44 repo
cd /path/to/your-base44-repo

# Create integrations directory
mkdir -p integrations

# Copy integration files
cp /mnt/f/Projects/AI_Projects/code/prague-day/base44-integrations/JobAnalysis.py integrations/
cp /mnt/f/Projects/AI_Projects/code/prague-day/base44-integrations/ResumeOptimizer.py integrations/
cp /mnt/f/Projects/AI_Projects/code/prague-day/base44-integrations/requirements.txt integrations/

# Copy agents directory
cp -r /mnt/f/Projects/AI_Projects/code/career-coach/agents .
```

### 3. Update Integration Paths

Edit the Python path in both integration files:

```python
# In JobAnalysis.py and ResumeOptimizer.py
# Change this:
sys.path.insert(0, '/mnt/f/Projects/AI_Projects/code/career-coach')

# To this (relative path):
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
```

Or create a `__init__.py` in integrations:

```python
# integrations/__init__.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
```

### 4. Commit and Push

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

### 5. Verify Deployment in Base44

1. Go to Base44 dashboard
2. Navigate to Integrations section
3. Check deployment status
4. Look for:
   - ✅ `JobAnalysis` integration
   - ✅ `ResumeOptimizer` integration

---

## Testing Your Deployment

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

### Test in Your Frontend

```javascript
// Add to your existing page
import { base44 } from '@/api/base44Client';

async function testIntegrations() {
  try {
    // Test Simon
    const simon = await base44.integrations.Custom.JobAnalysis({
      action: 'classify_role',
      params: { role_title: 'Senior HR Manager' }
    });
    console.log('✓ Simon works:', simon);

    // Test Kyle
    const kyle = await base44.integrations.Custom.ResumeOptimizer({
      action: 'get_cv_best_practices',
      params: { role_type: 'Manager', experience_level: 'senior' }
    });
    console.log('✓ Kyle works:', kyle);

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

testIntegrations();
```

---

## Integration into Your Base44 App

### Option 1: Create API Helper Module

```javascript
// src/api/aiIntegrations.js
import { base44 } from '@/api/base44Client';

export const AI = {
  // Simon functions
  analyzeJob: async (jd, company, title) => {
    return base44.integrations.Custom.JobAnalysis({
      action: 'analyze_job_opportunity',
      params: { jd_text: jd, company_name: company, role_title: title }
    });
  },

  checkGhostJob: async (jd, company, title) => {
    return base44.integrations.Custom.JobAnalysis({
      action: 'calculate_ghost_job_score',
      params: { jd_text: jd, company_name: company, role_title: title }
    });
  },

  // Kyle functions
  optimizeResume: async (simonBrief) => {
    return base44.integrations.Custom.ResumeOptimizer({
      action: 'optimize_complete_package',
      params: { simon_brief: simonBrief }
    });
  },

  prepareInterview: async (title, company, type) => {
    return base44.integrations.Custom.ResumeOptimizer({
      action: 'prepare_interview_strategy',
      params: { role_title: title, company_name: company, role_type: type }
    });
  }
};

// Use in your app
import { AI } from '@/api/aiIntegrations';

const analysis = await AI.analyzeJob(jobDescription, 'Sunbit', 'HR Manager');
```

### Option 2: Add to Existing Pages

```javascript
// In your job analysis page
import { AI } from '@/api/aiIntegrations';

export function JobAnalysisPage() {
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async (jobData) => {
    const result = await AI.analyzeJob(
      jobData.description,
      jobData.company,
      jobData.title
    );

    if (result.success) {
      setAnalysis(result.data);
    }
  };

  return (
    <div>
      {/* Your UI */}
      {analysis && (
        <div>
          <h3>Decision: {analysis.recommendation.decision}</h3>
          <p>Ghost Score: {analysis.ghost_job.score}/100</p>
          <p>Priority: {analysis.recommendation.priority}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Troubleshooting

### Issue: "Integration not found"

**Solution:**
1. Check Base44 deployment logs
2. Verify files are in correct directory
3. Ensure GitHub push completed successfully
4. Wait a few minutes for Base44 to redeploy

### Issue: "ModuleNotFoundError: agents"

**Solution:**
1. Verify `agents/` directory is in your repo
2. Check Python path in integration files
3. Ensure `agents/__init__.py` exists
4. Check Base44 Python path configuration

### Issue: "RAG not available"

**Expected behavior** - Kyle and Simon will work without RAG but with limited knowledge from knowledge base.

**Solutions:**
- Integrations will still work (basic functionality)
- For full RAG access, need to host RAG database separately
- Can add RAG service URL to Base44 environment variables

### Issue: "Permission denied: file writes"

**Expected behavior** - Base44 may restrict file system writes.

**Solution:**
```python
# Set save_to_file=False in interview prep
interview_prep = kyle.prepare_interview_strategy(
    role_title=title,
    save_to_file=False  # Don't try to save files in Base44
)
```

---

## Environment Variables (Optional)

If you need external services, add to Base44:

```bash
# RAG Service (if hosted separately)
RAG_SERVICE_URL=https://your-rag-service.com

# Web Search API (if using)
SEARCH_API_KEY=your-key

# LLM Provider (if needed)
OPENAI_API_KEY=your-key
```

---

## Performance Optimization

### 1. Cache Frequently Used Data

```javascript
// Cache role classifications
const roleCache = new Map();

export async function classifyRoleCached(roleTitle) {
  if (roleCache.has(roleTitle)) {
    return roleCache.get(roleTitle);
  }

  const result = await AI.classifyRole(roleTitle);
  roleCache.set(roleTitle, result);
  return result;
}
```

### 2. Use React Query

```javascript
import { useQuery } from '@tanstack/react-query';

export function useJobAnalysis(jobData) {
  return useQuery({
    queryKey: ['job-analysis', jobData.id],
    queryFn: () => AI.analyzeJob(
      jobData.description,
      jobData.company,
      jobData.title
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000  // 10 minutes
  });
}
```

### 3. Batch Processing

```javascript
// Analyze multiple jobs in batches
export async function batchAnalyze(jobs, batchSize = 5) {
  const results = [];

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(job => AI.analyzeJob(job.description, job.company, job.title))
    );
    results.push(...batchResults);

    // Small delay between batches
    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

---

## Monitoring & Logging

Add monitoring to track usage:

```javascript
// src/api/aiIntegrations.js
export const AI = {
  analyzeJob: async (jd, company, title) => {
    const startTime = Date.now();

    try {
      const result = await base44.integrations.Custom.JobAnalysis({
        action: 'analyze_job_opportunity',
        params: { jd_text: jd, company_name: company, role_title: title }
      });

      // Log success
      console.log('AI.analyzeJob success', {
        duration: Date.now() - startTime,
        company,
        title
      });

      return result;
    } catch (error) {
      // Log error
      console.error('AI.analyzeJob failed', {
        duration: Date.now() - startTime,
        company,
        title,
        error: error.message
      });

      throw error;
    }
  }
};
```

---

## Next Steps

1. ✅ Deploy integrations to GitHub
2. ✅ Verify Base44 deployment
3. ✅ Test integrations
4. 📝 Build UI components for job analysis
5. 📝 Add to existing workflows
6. 📝 Monitor usage and performance
7. 📝 Iterate based on user feedback

---

## Support

**Common Questions:**

**Q: How much does this cost on Base44?**
A: Depends on your Base44 plan and usage. Check Base44 pricing for custom integrations.

**Q: Can I update the integrations?**
A: Yes! Just push updated files to GitHub and Base44 will auto-deploy.

**Q: What if RAG isn't available?**
A: Basic functionality still works. For full knowledge base access, consider hosting RAG separately.

**Q: How do I add more features?**
A: Update the Python files in `/integrations/` and push to GitHub.

---

## Success Checklist

- [ ] Integration files in GitHub repo
- [ ] Agents directory copied
- [ ] Dependencies in requirements.txt
- [ ] Pushed to GitHub
- [ ] Base44 deployment verified
- [ ] Tested JobAnalysis integration
- [ ] Tested ResumeOptimizer integration
- [ ] Frontend integration added
- [ ] UI components created
- [ ] Monitoring in place

---

**🎉 You're ready to use Kyle & Simon in your Base44 app!**
