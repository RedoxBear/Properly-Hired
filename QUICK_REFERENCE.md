# Quick Reference Card - Simon & Kyle Integration

**Print this or bookmark it for quick reference!**

---

## 🎯 What's Integrated?

| Agent | Role | Knowledge | Action |
|-------|------|-----------|--------|
| **Simon** | Job Analysis | 6 files in `knowledge/simon/` | `AI.analyzeJob()` |
| **Kyle** | Resume Optimization | 7 files in `knowledge/kyle/` | `AI.optimizeResume()` |

---

## 📚 Documentation Map

```
START HERE
    ↓
AI_AGENTS_README.md (this is the main README)
    ↓
Choose your path:
    ├─ Setup? → INTEGRATION_GUIDE.md
    ├─ Knowledge? → KNOWLEDGE_BASE_GUIDE.md
    ├─ Deploy? → DEPLOYMENT_CHECKLIST.md
    ├─ Overview? → INTEGRATION_SUMMARY.md
    └─ Code? → src/api/aiIntegrations.js
```

---

## 💻 API Quick Reference

### Simon Functions

```javascript
// Full analysis
AI.analyzeJob({ description, company, title })
// Returns: { recommendation, ghost_job, role, quality }

// Ghost job only
AI.checkGhostJob(jd, company, title)
// Returns: { score: 0-100, risk_level, recommendation }

// Role classification
AI.classifyRole(roleTitle)
// Returns: { role_type, tier, seniority }
```

### Kyle Functions

```javascript
// Complete optimization
AI.optimizeResume(simonAnalysis, resumeData?)
// Returns: { positioning, cv_strategy, cover_letter_strategy, interview_prep }

// Interview prep
AI.prepareInterview(simonAnalysis)
// Returns: { star_method, interview_questions }

// CV best practices
AI.getCVBestPractices(roleType, experienceLevel?)
// Returns: { best_practices, sources, confidence }

// Cover letter best practices
AI.getCoverLetterBestPractices(roleType, industryType?)
// Returns: { best_practices, key_elements, sources }
```

### Complete Workflow

```javascript
// Simon → Kyle in one call
AI.analyzeAndOptimize(jobData, resumeData?)
// Returns: { pursue, simonAnalysis, kyleOptimization } or { pursue: false, reason }
```

---

## 📂 Directory Structure

```
integrations/           ← Python wrappers (copy from local)
  ├── JobAnalysis.py
  ├── ResumeOptimizer.py
  └── requirements.txt

agents/                 ← Agent code (copy from local)
  ├── simon/
  ├── kyle/
  └── rag_client.py

knowledge/              ← Knowledge bases (copy from local)
  ├── simon/ (6 files)
  └── kyle/ (7 files)

src/api/
  └── aiIntegrations.js ✅ Created

src/components/
  └── AIIntegrationExamples.jsx ✅ Created
```

---

## 🚀 Common Tasks

### Using Simon (Job Analysis)

```javascript
import { AI } from '@/api/aiIntegrations';

// Quick ghost job check
const ghost = await AI.checkGhostJob(jd, company, title);
if (ghost.data.score > 70) console.log('Probably ghost job');

// Full analysis
const analysis = await AI.analyzeJob({ description, company, title });
if (analysis.data.recommendation.decision === 'APPLY') {
  // Proceed to Kyle
}
```

### Using Kyle (Resume Optimization)

```javascript
// Get resume optimization
const optimized = await AI.optimizeResume(simonAnalysis, resumeData);

// Get interview prep
const interview = await AI.prepareInterview(simonAnalysis);
console.log(`STAR templates: ${interview.data.star_method.templates.length}`);
```

### Complete Workflow

```javascript
// One call does it all
const result = await AI.analyzeAndOptimize(jobData, resumeData);

if (result.pursue) {
  console.log('Analysis:', result.simonAnalysis);
  console.log('Optimization:', result.kyleOptimization);
} else {
  console.log('Reason to skip:', result.reason);
}
```

### Add Custom Knowledge

```bash
# Create new knowledge file
echo "# Custom Knowledge" > knowledge/simon/custom.md

# Add content, commit, and push
git add knowledge/
git commit -m "Add custom knowledge"
git push origin main
# Base44 auto-indexes
```

---

## 🧪 Testing

```javascript
// Test Simon
const result = await AI.classifyRole('HR Manager');
console.log(result.data); // Should have role_type, tier, seniority

// Test Kyle
const practices = await AI.getCVBestPractices('Manager');
console.log(practices.data); // Should have best_practices array

// Test Complete
const complete = await AI.analyzeAndOptimize(jobData);
console.log(complete.pursue ? 'Apply' : 'Skip');
```

---

## 🚢 Deployment Checklist

- [ ] Copy `integrations/` files from local
- [ ] Copy `agents/` from local
- [ ] Copy `knowledge/` from local
- [ ] Update Python paths to relative
- [ ] Push to GitHub
- [ ] Verify Base44 deployment (wait 5-10 min)
- [ ] Test integrations
- [ ] Check knowledge indexing

See: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Integration not found | Wait 5 min, verify GitHub push, check file paths |
| ModuleNotFoundError | Check `agents/` exists, verify relative paths |
| Knowledge not used | Verify files indexed, check content relevance |
| API errors | Check network, verify Base44 endpoint, review logs |

See: [INTEGRATION_GUIDE.md#troubleshooting](./INTEGRATION_GUIDE.md#troubleshooting)

---

## 📊 Performance Tips

```javascript
// Caching works automatically
const role1 = await AI.classifyRole('HR Manager');  // Fetched
const role2 = await AI.classifyRole('HR Manager');  // Cached ✓

// Check cache
AI.getCacheStats();  // { roleClassification: 1, ... }

// Clear cache if needed
AI.clearCache();
```

---

## 🔗 Key Files

| File | Purpose |
|------|---------|
| [AI_AGENTS_README.md](./AI_AGENTS_README.md) | Main README |
| [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) | Complete setup guide |
| [KNOWLEDGE_BASE_GUIDE.md](./KNOWLEDGE_BASE_GUIDE.md) | Knowledge management |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Deployment steps |
| [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) | Overview |
| [src/api/aiIntegrations.js](./src/api/aiIntegrations.js) | API helper |
| [src/components/AIIntegrationExamples.jsx](./src/components/AIIntegrationExamples.jsx) | React examples |

---

## 💡 Usage Examples

### Example 1: Quick Ghost Job Check

```javascript
const ghostScore = await AI.checkGhostJob(
  "Join our fast-paced team!",
  "TestCorp",
  "HR Manager"
);
console.log(`Ghost score: ${ghostScore.data.score}/100`);
// Output: Ghost score: 45/100
```

### Example 2: Full Job Analysis

```javascript
const analysis = await AI.analyzeJob({
  description: jobDescription,
  company: 'Acme Corp',
  title: 'Senior HR Manager'
});

if (analysis.data.recommendation.decision === 'APPLY') {
  console.log('Priority:', analysis.data.recommendation.priority);
}
```

### Example 3: Resume Optimization

```javascript
const optimized = await AI.optimizeResume(
  simonAnalysis.data,
  { content: 'Resume text...', format: 'pdf' }
);

console.log('Positioning:', optimized.data.positioning.positioning);
console.log('CV tips:', optimized.data.cv_strategy.best_practices);
```

### Example 4: Interview Prep

```javascript
const interview = await AI.prepareInterview(simonAnalysis.data);

interview.data.interview_prep.questions.by_category.forEach(q => {
  console.log(q);
});
```

---

## 🎯 Simon's Knowledge Files

- `ghost_job_signals.md` - Ghost job detection patterns
- `role_classification.md` - Role type/tier/seniority classification
- `company_research.md` - Company analysis methodology
- `job_quality_assessment.md` - JD quality scoring
- `application_strategy.md` - APPLY/MONITOR/SKIP logic
- `industry_insights.md` - Industry-specific knowledge

## 🎯 Kyle's Knowledge Files

- `cv_best_practices.md` - Resume optimization techniques
- `cover_letter_strategies.md` - Cover letter writing
- `star_method.md` - STAR interview framework
- `interview_preparation.md` - Interview readiness
- `positioning_strategies.md` - Role positioning
- `bullet_point_formulas.md` - Bullet point writing
- `application_package.md` - Complete application strategy

---

## 📞 Getting Help

1. **Setup questions?** → Read [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
2. **Knowledge questions?** → Read [KNOWLEDGE_BASE_GUIDE.md](./KNOWLEDGE_BASE_GUIDE.md)
3. **Deployment questions?** → Read [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
4. **Code questions?** → Check [src/api/aiIntegrations.js](./src/api/aiIntegrations.js)
5. **Troubleshooting?** → See the Troubleshooting section in any guide

---

## ✅ Integration Status

- ✅ Simon v2.1.0 - Recruiting & HR Expert
- ✅ Kyle v2.1.0 - CV & Cover Letter Expert
- ✅ Knowledge bases (6 + 7 files)
- ✅ Frontend API helper
- ✅ React component examples
- ✅ Complete documentation

**Ready for Base44 deployment!**

---

**Version 2.1.0 | January 29, 2026**

💾 **Pro Tip:** Bookmark this page and [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for quick access!
