# AI Integrations Quick Reference

## 🎯 Simon (JobAnalysis) - 30 Second Overview

**What:** AI recruiter analyzing job opportunities  
**Use Case:** Should I apply for this job?  
**Input:** Job description, company, role title  
**Output:** Decision + ghost score + positioning

```javascript
const analysis = await AI.analyzeJob(jd, company, title);
if (analysis.data.recommendation.priority === 'SKIP') {
  console.log('Skip this job:', analysis.data.recommendation.reasoning);
}
```

---

## 🎯 Kyle (ResumeOptimizer) - 30 Second Overview

**What:** AI career expert optimizing your application  
**Use Case:** How do I apply successfully for this role?  
**Input:** Simon's analysis result  
**Output:** Positioning + CV tips + interview prep

```javascript
const optimization = await AI.optimizeResume(simonAnalysis.data);
// optimization.data has positioning, cv_strategy, interview_prep
```

---

## 🚀 Complete Workflow (Recommended)

```javascript
import { AI } from '@/api/aiIntegrations';

// One function does everything
const result = await AI.analyzeAndOptimize({
  title: 'Senior PM',
  company: 'TechCorp',
  description: '...',
  candidateBackground: '...'
});

// Returns either:
// { pursue: false, reason: '...' }  ← Simon says skip
// { pursue: true, simonAnalysis: {...}, kyleOptimization: {...} }  ← Full package
```

---

## 📞 All Available Functions

### Simon (JobAnalysis)
| Function | Input | Output | Use When |
|----------|-------|--------|----------|
| `analyzeJob()` | JD, company, title | Full analysis | Deep evaluation needed |
| `checkGhostJob()` | JD, company, title | Score 0-100 | Quick ghost check |
| `classifyRole()` | Title | Role type/tier | Understand role |

### Kyle (ResumeOptimizer)
| Function | Input | Output | Use When |
|----------|-------|--------|----------|
| `optimizeResume()` | Simon brief | Full package | Want complete guidance |
| `getCVPractices()` | Role type | CV tips | Need CV advice |
| `getCoverLetterPractices()` | Role type | CL tips | Need cover letter help |
| `prepareInterview()` | Role, company | Interview prep | Need interview tips |

### Combo
| Function | Input | Output |
|----------|-------|--------|
| `analyzeAndOptimize()` | Job data | Simon + Kyle results |
| `analyzeRoleOnly()` | Role title | Classification + CV tips |

---

## 💾 Response Structure

### Simon Analysis Response
```javascript
{
  decision: "APPLY",                    // YES, MAYBE, SKIP
  priority: "HIGH",                     // HIGH, MEDIUM, LOW
  ghostScore: 25,                       // 0-100, higher = more ghost-like
  roleType: "Manager",
  quality: { score: 85, rating: "Good" }
}
```

### Kyle Optimization Response
```javascript
{
  positioning: { key_themes, approach, tone },
  cv_strategy: { best_practices, [...] },
  cover_letter_strategy: { best_practices, [...] },
  interview_prep: { 
    star_method: { templates: [...] },
    questions: { by_category: {...} }
  }
}
```

---

## 🔥 Common Patterns

### Pattern 1: Ghost Job Check Only
```javascript
const ghostCheck = await AI.checkGhostJob(jd, company, title);
if (ghostCheck.data.score > 70) {
  console.warn('⚠️ Likely ghost job');
}
```

### Pattern 2: Full Analysis → Apply Decision
```javascript
const analysis = await AI.analyzeJob(jd, company, title);
if (analysis.data.recommendation.priority === 'HIGH') {
  applyImmediately();  // Hot opportunity!
}
```

### Pattern 3: Complete Workflow
```javascript
const result = await AI.analyzeAndOptimize(jobData);
if (result.pursue) {
  showPositioningGuidance(result.kyleOptimization.positioning);
  prepareInterviewNotes(result.kyleOptimization.interview_prep);
}
```

### Pattern 4: Batch Analysis
```javascript
const results = await Promise.all(
  jobs.map(job => AI.analyzeJob(job.jd, job.company, job.title))
);
const topJobs = results.filter(r => r.data.recommendation.priority === 'HIGH');
```

### Pattern 5: With React Query (Recommended)
```javascript
import { useQuery } from '@tanstack/react-query';
import { AI } from '@/api/aiIntegrations';

export function useJobAnalysis(jobData) {
  return useQuery({
    queryKey: ['job-analysis', jobData.id],
    queryFn: () => AI.analyzeAndOptimize(jobData),
    staleTime: 5 * 60 * 1000
  });
}

// In component:
const { data, isLoading } = useJobAnalysis(jobData);
```

---

## 🛠️ Error Handling

```javascript
try {
  const analysis = await AI.analyzeJob(jd, company, title);
  if (!analysis.success) {
    console.error('Analysis failed:', analysis.error);
  }
} catch (error) {
  console.error('API call failed:', error.message);
  // Show user-friendly error message
}
```

---

## ⚡ Performance Tips

1. **Cache Results** - Same job analysis shouldn't be repeated
2. **Batch Process** - Analyze multiple jobs together with delays
3. **Use React Query** - Built-in caching and state management
4. **Lazy Load** - Don't analyze until user requests it
5. **Debounce** - If analyzing on input change, add delay

---

## 📂 File Locations

| What | Where |
|------|-------|
| API Helper | `src/api/aiIntegrations.js` |
| Full Guide | `INTEGRATIONS_README.md` |
| Deployment | `DEPLOYMENT_CHECKLIST.md` |
| Simon Code | `integrations/JobAnalysis.py` |
| Kyle Code | `integrations/ResumeOptimizer.py` |
| Agents | `agents/` |

---

## 🔗 Import & Use

```javascript
// In any React component:
import { AI } from '@/api/aiIntegrations';

// Then use any function:
const result = await AI.analyzeJob(...);
```

---

## 🆘 Quick Troubleshooting

| Error | Solution |
|-------|----------|
| "Integration not found" | Wait 2 min, refresh Base44 |
| "ModuleNotFoundError: agents" | Check agents/ folder exists |
| "Permission denied" | Not a problem, integrations work |
| "RAG not available" | Normal, basic functionality still works |
| Timeout | Cache results, use batch processing |

---

## 📞 When to Use Each Function

**`analyzeJob()` - Full Analysis**
- User wants comprehensive job evaluation
- Need ghost score, role classification, positioning advice
- Planning to decide "apply or skip"

**`checkGhostJob()` - Quick Ghost Check**
- Just want to know if job is likely real
- Don't need full analysis
- Running bulk ghost check

**`optimizeResume()` - Get Optimization**
- Already decided to apply
- Need positioning, CV, cover letter, interview tips
- Have Simon analysis result

**`analyzeAndOptimize()` - Complete Workflow** ⭐ RECOMMENDED
- Want everything in one call
- Simon → Kyle → full optimization
- Most common use case

---

## 💡 Pro Tips

1. **Always use `analyzeAndOptimize()`** - It's the recommended workflow
2. **Cache ghost scores** - They don't change for same job
3. **Batch process with delays** - Avoid rate limiting
4. **Show results incrementally** - Simon first, then Kyle
5. **Use React Query** - Better caching and state management
6. **Log API calls** - Monitor usage and debug issues
7. **Test locally first** - Before adding to production

---

## 🚀 Common Use Cases

### Use Case: Job Board with AI Analysis
```javascript
// On job list page
const ghostScores = await Promise.all(
  jobs.map(j => AI.checkGhostJob(j.jd, j.company, j.title))
);

jobs.forEach((job, i) => {
  if (ghostScores[i].data.score > 70) {
    job.ghostJobBadge = '⚠️';
  }
});
```

### Use Case: Application Assistant
```javascript
// When user opens job detail
const analysis = await AI.analyzeAndOptimize(jobData);

// Show decision
if (!analysis.pursue) {
  return <SkipRecommendation reason={analysis.reason} />;
}

// Show guidance
return (
  <>
    <PositioningGuide {...analysis.kyleOptimization.positioning} />
    <InterviewPrep {...analysis.kyleOptimization.interview_prep} />
  </>
);
```

---

**Version:** 2.1.0  
**Last Updated:** January 28, 2026  
**Audience:** Developers integrating Simon & Kyle into Prague-Day app