# Deployment Checklist & Next Steps

Quick reference guide for deploying Kyle & Simon integrations to your Prague-Day application.

---

## 📋 Pre-Deployment Checklist

### Repository Setup
- [ ] Create `/integrations` directory in project root
- [ ] Create `/agents` directory in project root
- [ ] Copy `JobAnalysis.py` to `/integrations`
- [ ] Copy `ResumeOptimizer.py` to `/integrations`
- [ ] Copy `requirements.txt` to `/integrations`
- [ ] Copy entire `/agents` directory from career-coach repo
- [ ] Create `/integrations/__init__.py` (can be empty)

### Path Configuration
- [ ] Update `JobAnalysis.py` - change sys.path to relative
- [ ] Update `ResumeOptimizer.py` - change sys.path to relative
- [ ] Verify `agents/__init__.py` exists
- [ ] Test local imports: `python3 -c "import agents.simon; print('OK')"`

### Dependencies
- [ ] Install Python 3.8+
- [ ] Run `pip install -r integrations/requirements.txt`
- [ ] Verify installation: `pip list | grep langchain`

### Frontend Setup
- [ ] Create `/src/api/aiIntegrations.js` ✅ (Already created)
- [ ] Import AI helper in pages that need it
- [ ] Create React hooks for queries (optional but recommended)

---

## 🚀 Deployment Steps

### Step 1: Copy Files to Workspace

```bash
# From integrations folder (outside workspace)
cp F:\Projects\AI_Projects\code\prague-day\integrations\JobAnalysis.py integrations/
cp F:\Projects\AI_Projects\code\prague-day\integrations\ResumeOptimizer.py integrations/
cp F:\Projects\AI_Projects\code\prague-day\integrations\requirements.txt integrations/

# Copy agents
cp -r F:\Projects\AI_Projects\code\career-coach\agents .
```

### Step 2: Fix Python Paths

Edit both `integrations/JobAnalysis.py` and `integrations/ResumeOptimizer.py`:

```python
# Find this line:
sys.path.insert(0, '/mnt/f/Projects/AI_Projects/code/career-coach')

# Change to:
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
```

### Step 3: Verify Local Installation

```bash
# Test Python path configuration
python3 -c "import sys; sys.path.insert(0, '.'); from agents import simon; print('✓ Simon loads')"

# Test dependencies
pip install -r integrations/requirements.txt

# Test integrations locally
python3 integrations/JobAnalysis.py
python3 integrations/ResumeOptimizer.py
```

### Step 4: Git Commit and Push

```bash
git add .
git commit -m "Add Kyle & Simon AI integrations v2.1.0

- Added JobAnalysis integration (Simon) for opportunity analysis
- Added ResumeOptimizer integration (Kyle) for resume optimization
- Created aiIntegrations.js helper module
- Updated INTEGRATIONS_README.md with complete documentation
- Includes ghost-job detection, role classification
- Full Simon → Kyle workflow with interview preparation
"

git push origin main
```

### Step 5: Verify Base44 Deployment

1. Go to Base44 dashboard
2. Navigate to **Integrations** section
3. Wait 1-2 minutes for deployment
4. Verify status shows "Active" for:
   - ✅ `JobAnalysis` integration
   - ✅ `ResumeOptimizer` integration

---

## 🧪 Testing After Deployment

### Test 1: Ghost Job Detection

```javascript
// In browser console or your test page
const result = await base44.integrations.Custom.JobAnalysis({
  action: 'calculate_ghost_job_score',
  params: {
    jd_text: "Join our dynamic team! Work on exciting projects!",
    company_name: "TestCorp",
    role_title: "Software Engineer"
  }
});

console.log('Score:', result.data.score);
console.log('Risk:', result.data.risk_level);
// Expected: Score 0-100, Risk: LOW/MEDIUM/HIGH
```

### Test 2: Role Classification

```javascript
const result = await base44.integrations.Custom.JobAnalysis({
  action: 'classify_role',
  params: { role_title: 'Senior Product Manager' }
});

console.log('Type:', result.data.role_type);
console.log('Tier:', result.data.tier);
// Expected: role_type, tier filled in
```

### Test 3: CV Best Practices

```javascript
const result = await base44.integrations.Custom.ResumeOptimizer({
  action: 'get_cv_best_practices',
  params: { role_type: 'Manager', experience_level: 'senior' }
});

console.log('Practices:', result.data.best_practices);
// Expected: Array of CV best practices
```

### Test 4: Complete Workflow (Once Verified)

```javascript
import { AI } from '@/api/aiIntegrations';

const jobData = {
  title: 'Senior HR Manager',
  company: 'TechCorp',
  description: 'Looking for HR Manager with 5+ years...',
  candidateBackground: 'HR Specialist, 4 years experience'
};

const result = await AI.analyzeAndOptimize(jobData);

if (result.pursue) {
  console.log('✓ Recommended - Priority:', result.priority);
  console.log('Positioning:', result.kyleOptimization.positioning);
} else {
  console.log('✗ Not Recommended:', result.reason);
}
```

---

## 🛠️ Component Integration

### Option A: Add to Existing Job Analysis Page

```jsx
// In JobAnalysis.jsx or similar
import { AI } from '@/api/aiIntegrations';
import { useState } from 'react';

export function JobAnalysisPanel({ jobData }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await AI.analyzeAndOptimize(jobData);
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Job'}
      </button>
      
      {analysis && (
        <div>
          {analysis.pursue ? (
            <div className="bg-green-50 p-4">
              <h3>Recommended!</h3>
              <p>Priority: {analysis.priority}</p>
            </div>
          ) : (
            <div className="bg-red-50 p-4">
              <h3>Not Recommended</h3>
              <p>{analysis.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Option B: Create Dedicated Integrations Hook

```jsx
// src/hooks/useAIIntegrations.js
import { useQuery, useMutation } from '@tanstack/react-query';
import { AI } from '@/api/aiIntegrations';

export function useJobAnalysis(jobData) {
  return useQuery({
    queryKey: ['job-analysis', jobData?.id],
    queryFn: () => AI.analyzeAndOptimize(jobData),
    enabled: !!jobData,
    staleTime: 5 * 60 * 1000
  });
}

export function useGhostJobCheck() {
  return useMutation(async ({ jd, company, role }) => {
    return AI.checkGhostJob(jd, company, role);
  });
}

// Usage
import { useJobAnalysis } from '@/hooks/useAIIntegrations';

export function MyPage({ jobData }) {
  const { data, isLoading, error } = useJobAnalysis(jobData);
  
  return isLoading ? <p>Loading...</p> : <div>{/* render data */}</div>;
}
```

---

## 📊 Monitoring & Logging

### Add Error Tracking

```javascript
// src/api/aiIntegrations.js - add error handling
export const AI = {
  analyzeJob: async (...args) => {
    try {
      const result = await base44.integrations.Custom.JobAnalysis({...});
      
      // Log success
      console.log('analyzeJob success', {
        company: args[1],
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      // Log error to monitoring service (Sentry, etc.)
      logError('analyzeJob', error, { args });
      throw error;
    }
  }
};
```

### Add Performance Monitoring

```javascript
// Track API call duration
const startTime = Date.now();
const result = await AI.analyzeJob(...);
const duration = Date.now() - startTime;

console.log(`AI.analyzeJob took ${duration}ms`);
```

---

## 🚨 Troubleshooting

### "Integration not found" Error

**Check:**
1. Verify files are in `integrations/` directory
2. Confirm GitHub push completed
3. Check Base44 deployment logs
4. Wait 2-3 minutes and refresh

**Fix:**
```bash
# Verify file structure
ls -la integrations/
ls -la agents/

# Re-push if needed
git push origin main
```

### "ModuleNotFoundError: agents"

**Check:**
1. `agents/` directory exists at repo root
2. `agents/__init__.py` exists
3. Relative paths in integration files

**Test:**
```bash
# Test Python import
python3 -c "import agents.simon; print('OK')"
```

### "Permission denied" Errors

**Likely cause:** File permissions in Base44

**Solution:**
```python
# In integration files, ensure:
save_to_file=False  # Don't write to disk
return_only=True    # Return JSON instead of saving
```

### Integration Timeout

**Solution:**
1. Check Base44 timeout settings (increase if possible)
2. Cache frequently used data
3. Use batch processing with delays
4. Optimize query parameters

---

## 📈 Next Steps After Deployment

### Phase 1: Verification (Day 1)
- [ ] Deploy integrations
- [ ] Verify in Base44 dashboard
- [ ] Test basic functionality
- [ ] Check error logs

### Phase 2: Integration (Days 2-3)
- [ ] Add to first page/component
- [ ] Test complete workflow
- [ ] Implement caching
- [ ] Add error handling

### Phase 3: Enhancement (Week 2)
- [ ] Add to all relevant pages
- [ ] Create dedicated components
- [ ] Implement React Query hooks
- [ ] Add monitoring/logging

### Phase 4: Optimization (Week 3)
- [ ] Analyze usage patterns
- [ ] Optimize caching strategy
- [ ] Add performance monitoring
- [ ] Gather user feedback

### Phase 5: Scale (Ongoing)
- [ ] Monitor usage metrics
- [ ] Update integrations as needed
- [ ] Enhance UI/UX based on feedback
- [ ] Document best practices

---

## 📚 Documentation References

- **Full Guide:** [INTEGRATIONS_README.md](./INTEGRATIONS_README.md)
- **API Reference:** See "API Reference" section in INTEGRATIONS_README.md
- **Usage Examples:** See "Usage Examples" section in INTEGRATIONS_README.md
- **Troubleshooting:** See "Troubleshooting" section in INTEGRATIONS_README.md

---

## 🔗 Quick Links

- **Base44 Dashboard:** [https://base44.app/dashboard](https://base44.app/dashboard)
- **AI Integrations API:** `src/api/aiIntegrations.js`
- **Integration Files:** `integrations/` directory
- **Agents:** `agents/` directory
- **Main Guide:** `INTEGRATIONS_README.md`

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Integration files are in GitHub
2. ✅ Base44 shows "Active" status
3. ✅ Ghost job score returns 0-100
4. ✅ Role classification returns role type/tier
5. ✅ Complete workflow returns positioning & interview prep
6. ✅ React component can call AI methods
7. ✅ Results display in UI without errors

---

**Version:** 2.1.0  
**Created:** January 28, 2026  
**Status:** Ready for Deployment
