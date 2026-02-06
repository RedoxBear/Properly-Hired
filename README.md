# Prague-Day - Base44 Application

Intelligent job application management platform with AI-powered job analysis and resume optimization.

## 🚀 Quick Features

- **AI Job Analysis** (Simon) - Ghost-job detection, role classification, opportunity evaluation
- **Resume Optimization** (Kyle) - Positioning strategies, interview prep, STAR method templates
- **Application Tracking** - Track and manage job applications
- **Resume Management** - Create, edit, and optimize resumes
- **Interview Preparation** - AI-guided interview prep with STAR method

## 📚 Documentation

### Integration Documentation
- **[INTEGRATIONS_README.md](./INTEGRATIONS_README.md)** - Complete integration guide for Kyle & Simon
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment and testing

### Getting Started
1. Review [INTEGRATIONS_README.md](./INTEGRATIONS_README.md) for full integration overview
2. Follow [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for setup steps
3. Check [src/api/aiIntegrations.js](./src/api/aiIntegrations.js) for API helper

## 🔌 AI Integrations

### Simon (JobAnalysis v2.1.0)
AI recruiter and HR expert providing comprehensive job opportunity analysis.

**Features:**
- Ghost-job probability detection
- Role classification and tier assessment
- Job description quality evaluation
- Comprehensive decision recommendations

**Usage:**
```javascript
import { AI } from '@/api/aiIntegrations';

const analysis = await AI.analyzeJob(
  jobDescription,
  companyName,
  roleTitle
);
```

### Kyle (ResumeOptimizer v2.1.0)
AI career and cover letter expert for resume positioning and interview prep.

**Features:**
- Resume positioning strategy
- Interview preparation with STAR method
- CV and cover letter best practices
- Complete application package optimization

**Usage:**
```javascript
import { AI } from '@/api/aiIntegrations';

const optimization = await AI.optimizeResume(simonBrief);
```

## 📂 Project Structure

```
prague-day/
├── src/
│   ├── api/
│   │   ├── aiIntegrations.js          # Simon & Kyle API helper
│   │   └── base44Client.js
│   ├── components/
│   ├── pages/
│   └── ...
├── integrations/                      # Base44 custom integrations
│   ├── JobAnalysis.py                 # Simon integration
│   ├── ResumeOptimizer.py             # Kyle integration
│   └── requirements.txt
├── agents/                            # Kyle & Simon agent dependencies
│   ├── simon/
│   └── kyle/
├── INTEGRATIONS_README.md             # Full integration documentation
├── DEPLOYMENT_CHECKLIST.md            # Deployment guide
└── README.md                          # This file
```

## ⚙️ Installation

```bash
# Install dependencies
npm install

# Install Python integrations
pip install -r integrations/requirements.txt

# Run development server
npm run dev
```

## 🧪 Testing Integrations

```bash
# Test Simon (JobAnalysis)
python3 integrations/JobAnalysis.py

# Test Kyle (ResumeOptimizer)
python3 integrations/ResumeOptimizer.py

# Test from frontend
npm run dev  # Then check browser console
```

## 🔗 Key Files

| File | Purpose |
|------|---------|
| [INTEGRATIONS_README.md](./INTEGRATIONS_README.md) | Complete API reference and usage guide |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Setup, deployment, and testing checklist |
| [src/api/aiIntegrations.js](./src/api/aiIntegrations.js) | JavaScript API helper for Simon & Kyle |
| [integrations/JobAnalysis.py](./integrations/JobAnalysis.py) | Simon agent integration |
| [integrations/ResumeOptimizer.py](./integrations/ResumeOptimizer.py) | Kyle agent integration |

## 📖 More Information

For detailed integration documentation, deployment steps, API reference, and troubleshooting, see:
- **[INTEGRATIONS_README.md](./INTEGRATIONS_README.md)** - Comprehensive guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Quick deployment reference

## 📝 License

[Your License Here]
