# Prague-Day Integration with Simon & Kyle AI Agents

> Complete integration of Simon (Recruiting Expert) and Kyle (CV Expert) AI agents for job analysis and resume optimization

**Status:** ✅ Integration Complete  
**Version:** 2.1.0  
**Last Updated:** January 29, 2026

---

## 🎯 What is This?

Prague-Day is now integrated with two specialized AI agents:

- **Simon v2.1.0** - Recruiting & HR Expert (Job Analysis)
- **Kyle v2.1.0** - CV & Cover Letter Expert (Resume Optimization)

These agents work together to analyze job opportunities and optimize application materials.

---

## 🚀 Quick Start

### For Developers

1. **Review the Integration Documentation**
   ```bash
   # Read the main integration guide
   cat INTEGRATION_GUIDE.md
   
   # Read knowledge base setup
   cat KNOWLEDGE_BASE_GUIDE.md
   
   # See deployment checklist
   cat DEPLOYMENT_CHECKLIST.md
   ```

2. **Explore the Integration Code**
   ```bash
   # View the API helper
   cat src/api/aiIntegrations.js
   
   # View component examples
   cat src/components/AIIntegrationExamples.jsx
   ```

3. **Deploy to Base44**
   - Copy integration files from local repository
   - Follow DEPLOYMENT_CHECKLIST.md
   - Verify Base44 auto-deployment

### For Users

1. **Job Analysis with Simon**
   - Paste job description
   - Get instant analysis (ghost job score, quality, recommendation)

2. **Resume Optimization with Kyle**
   - Upload resume
   - Get positioning strategy, CV tips, interview prep

3. **Complete Workflow**
   - Simon analyzes job → Kyle optimizes resume
   - Ready to apply in minutes

---

## 📋 Documentation

### Main Guides

| Guide | Purpose |
|-------|---------|
| **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** | Complete setup, API reference, examples, troubleshooting |
| **[KNOWLEDGE_BASE_GUIDE.md](./KNOWLEDGE_BASE_GUIDE.md)** | Knowledge base structure, customization, maintenance |
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | Pre/during/post deployment verification |
| **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** | Overview and quick reference |

### Code Documentation

| File | Purpose |
|------|---------|
| **[src/api/aiIntegrations.js](./src/api/aiIntegrations.js)** | Frontend API helper with monitoring and caching |
| **[src/components/AIIntegrationExamples.jsx](./src/components/AIIntegrationExamples.jsx)** | React component examples |

---

## 🏗️ Architecture

```
Prague-Day Repository
├── src/
│   ├── api/
│   │   └── aiIntegrations.js ← API helper module
│   ├── components/
│   │   └── AIIntegrationExamples.jsx ← Component examples
│   └── pages/
│
├── integrations/                    ← Simon & Kyle wrappers
│   ├── JobAnalysis.py              (Simon)
│   ├── ResumeOptimizer.py          (Kyle)
│   └── requirements.txt
│
├── agents/                          ← Agent code
│   ├── simon/
│   ├── kyle/
│   └── rag_client.py
│
└── knowledge/                       ← Agent knowledge bases
    ├── simon/                       (6 knowledge files)
    └── kyle/                        (7 knowledge files)
```

---

## 🤖 Agents

### Simon - Recruiting & HR Expert

**Analyzes:** Job opportunities  
**Provides:** Decision, ghost score, role classification, quality assessment

**Key Functions:**
- `AI.analyzeJob()` - Full job analysis
- `AI.checkGhostJob()` - Quick ghost job detection
- `AI.classifyRole()` - Role classification

**Example:**
```javascript
const analysis = await AI.analyzeJob({
  description: "Job description...",
  company: "Company name",
  title: "Role title"
});

console.log(analysis.data.recommendation.decision); // APPLY / MONITOR / SKIP
console.log(analysis.data.ghost_job.score);         // 0-100
```

### Kyle - CV & Cover Letter Expert

**Optimizes:** Resume, cover letter, interview preparation  
**Provides:** Positioning strategy, best practices, STAR templates, question banks

**Key Functions:**
- `AI.optimizeResume()` - Complete resume optimization
- `AI.prepareInterview()` - Interview prep with STAR method
- `AI.getCVBestPractices()` - Resume best practices
- `AI.getCoverLetterBestPractices()` - Cover letter strategy

**Example:**
```javascript
const optimization = await AI.optimizeResume(simonAnalysis, resumeData);

console.log(optimization.data.positioning);      // Positioning strategy
console.log(optimization.data.interview_prep);   // STAR templates & questions
```

---

## 💻 Frontend Integration

### Basic Usage

```javascript
import { AI } from '@/api/aiIntegrations';

// Analyze job
const analysis = await AI.analyzeJob(jobData);

// Optimize resume
const optimization = await AI.optimizeResume(analysis.data, resumeData);

// Complete workflow
const result = await AI.analyzeAndOptimize(jobData, resumeData);
```

### React Components

```jsx
import { 
  JobAnalysisPanel,
  ResumeOptimizerPanel,
  CompleteWorkflowPanel 
} from '@/components/AIIntegrationExamples';

// Use in your pages
<JobAnalysisPanel jobData={jobData} />
<ResumeOptimizerPanel simonAnalysis={analysis} resumeData={resumeData} />
<CompleteWorkflowPanel jobData={jobData} resumeData={resumeData} />
```

See [src/components/AIIntegrationExamples.jsx](./src/components/AIIntegrationExamples.jsx) for full examples.

---

## 📚 Knowledge Base

Each agent has specialized knowledge files:

**Simon's Knowledge** (6 files):
- Ghost job detection patterns
- Role classification logic
- Company research methodology
- Job quality assessment
- Application strategy
- Industry insights

**Kyle's Knowledge** (7 files):
- Resume best practices
- Cover letter strategies
- STAR interview method
- Interview preparation
- Positioning strategies
- Bullet point formulas
- Complete application strategy

Add custom knowledge:
```bash
# Create new knowledge file
cat > knowledge/simon/custom_knowledge.md << EOF
# My Custom Knowledge
## Section
Content...
EOF

# Commit and push - Base44 auto-indexes
git add knowledge/
git commit -m "Add custom knowledge"
git push origin main
```

---

## 🚢 Deployment

### Prerequisites
- Base44 account with GitHub integration
- Python 3.8+
- Node.js 16+

### Steps

1. **Copy Integration Files**
   ```bash
   cp /path/to/integrations/* integrations/
   cp /path/to/agents/* agents/
   cp /path/to/knowledge/* knowledge/
   ```

2. **Update Python Paths**
   - Change absolute paths to relative paths
   - `sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))`

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Kyle & Simon integrations v2.1.0"
   git push origin main
   ```

4. **Verify in Base44**
   - Check Integrations section
   - Confirm JobAnalysis and ResumeOptimizer are active

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed verification steps.

---

## 📊 API Reference

### Simon (JobAnalysis)

**Full Analysis:**
```javascript
AI.analyzeJob({
  description: string,
  company: string,
  title: string,
  candidateBackground?: string,
  postingDate?: string
})
```

Returns: Complete analysis with recommendation, ghost score, role details, quality assessment

**Ghost Job Check:**
```javascript
AI.checkGhostJob(jd, company, title)
```

Returns: Ghost score (0-100), risk level, indicators

**Role Classification:**
```javascript
AI.classifyRole(roleTitle)
```

Returns: Role type, tier, seniority, deputy/compliance flags

### Kyle (ResumeOptimizer)

**Complete Optimization:**
```javascript
AI.optimizeResume(simonAnalysis, resumeData?)
```

Returns: Positioning, CV strategy, cover letter strategy, interview prep, bullet strategies

**Interview Preparation:**
```javascript
AI.prepareInterview(simonAnalysis)
```

Returns: STAR method, interview questions by category, preparation guide

**CV Best Practices:**
```javascript
AI.getCVBestPractices(roleType, experienceLevel?)
```

Returns: Best practices, sources, confidence score

**Cover Letter Best Practices:**
```javascript
AI.getCoverLetterBestPractices(roleType, industryType?)
```

Returns: Best practices, key elements, sources

### Complete Workflow

```javascript
AI.analyzeAndOptimize(jobData, resumeData?)
```

Returns: Combined Simon analysis + Kyle optimization (or skip recommendation)

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md#api-reference) for full API documentation.

---

## 🧪 Testing

### Local Testing

```javascript
// Test Simon
const analysis = await AI.classifyRole('Senior HR Manager');
console.log(analysis.data.role_type);

// Test Kyle
const practices = await AI.getCVBestPractices('Manager');
console.log(practices.data.best_practices);

// Test Complete Workflow
const result = await AI.analyzeAndOptimize(jobData, resumeData);
console.log(result.pursue ? 'Applying' : 'Skipping');
```

### Running Tests

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run specific test
npm test -- aiIntegrations
```

---

## 🐛 Troubleshooting

### Integration Not Found

**Check:**
1. GitHub repository updated
2. Base44 deployment completed
3. Integration files in correct directory
4. Wait 5 minutes for Base44 sync

### ModuleNotFoundError: agents

**Fix:**
1. Verify `agents/` directory exists
2. Check `agents/__init__.py` exists
3. Update relative paths in integration files
4. Test locally before deploying

### Knowledge Not Being Used

**Check:**
1. Knowledge files are indexed
2. File names are correct
3. Content is relevant to queries
4. Run manual reindex in Base44

See [INTEGRATION_GUIDE.md#troubleshooting](./INTEGRATION_GUIDE.md#troubleshooting) for more solutions.

---

## 📈 Performance

### Features

- ✅ **Automatic Caching** - Role classifications and ghost job scores cached
- ✅ **Performance Monitoring** - All calls logged with duration
- ✅ **Error Handling** - Graceful error handling with user-friendly messages
- ✅ **Concurrent Processing** - Full Simon → Kyle workflow in single call

### Optimization

```javascript
// Cache automatically managed
const role1 = await AI.classifyRole('HR Manager');  // Fetched
const role2 = await AI.classifyRole('HR Manager');  // Cached

// Check cache stats
AI.getCacheStats();  // { roleClassification: 1, ghostJobScores: 0 }

// Clear if needed
AI.clearCache();
```

---

## 📊 Monitoring

### Available Metrics

- Function call duration
- Cache hit/miss rates
- Error rates and types
- Knowledge base usage
- API performance by function

### Track Metrics

```javascript
// All calls are logged with timestamps
// Check browser console for [PERF] and [CACHE] tags

// Example output:
// [PERF] analyzeJob completed in 5432ms
// [CACHE] Ghost job score hit
// [ERROR] analyzeJob failed after 2341ms
```

---

## 🔄 Continuous Integration

### Automatic Deployment

1. Push changes to GitHub
2. Base44 automatically syncs (5-10 min)
3. Knowledge base re-indexed
4. Integrations updated in production

### Manual Deployment

If needed, trigger re-deployment in Base44 dashboard:
1. Go to Integrations
2. Select JobAnalysis or ResumeOptimizer
3. Click "Reindex" or "Redeploy"

---

## 📝 Contributing

### Adding Knowledge

1. Create file in `knowledge/{agent}/`
2. Use markdown format
3. Follow structure conventions
4. Commit and push
5. Base44 auto-indexes

### Updating Integration

1. Update Python files in `integrations/`
2. Update frontend in `src/`
3. Update knowledge if needed
4. Commit, push, and verify deployment

---

## 📞 Support

### Documentation
- **Setup & Usage:** [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Knowledge Base:** [KNOWLEDGE_BASE_GUIDE.md](./KNOWLEDGE_BASE_GUIDE.md)
- **Deployment:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Summary:** [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)

### Code
- **API Helper:** [src/api/aiIntegrations.js](./src/api/aiIntegrations.js)
- **Components:** [src/components/AIIntegrationExamples.jsx](./src/components/AIIntegrationExamples.jsx)

### Issues

See [INTEGRATION_GUIDE.md#troubleshooting](./INTEGRATION_GUIDE.md#troubleshooting) for common issues and solutions.

---

## 📄 License

See [LICENSE](./LICENSE) file.

---

## 🙏 Acknowledgments

- Simon v2.1.0 - Recruiting & HR expertise
- Kyle v2.1.0 - CV & Cover Letter expertise
- Base44 platform integration

---

## 🎉 Next Steps

1. Review [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
2. Copy integration files from local repository
3. Follow [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
4. Deploy to Base44
5. Start using Simon & Kyle!

---

**Version 2.1.0 | January 29, 2026**

Have questions? See the documentation files or check the troubleshooting guide.
