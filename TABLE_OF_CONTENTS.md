# 📑 Prague-Day Documentation Map

**Quick navigation for all integration documentation and code.**

---

## 📂 Where to Find Everything

### 🚀 **I Want to Start Now**
- **Time:** 5 minutes
- **Read:** [`AI_QUICK_REFERENCE.md`](./AI_QUICK_REFERENCE.md)
- **Then:** Import from `src/api/aiIntegrations.js`
- **Result:** Ready to code

### 🔧 **I Need to Deploy**
- **Time:** 20 minutes
- **Follow:** [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md)
- **Then:** Follow 5-step process
- **Result:** Integrations deployed to Base44

### 📚 **I Need Complete Reference**
- **Time:** 30 minutes
- **Read:** [`INTEGRATIONS_README.md`](./INTEGRATIONS_README.md)
- **Contains:** Everything about Simon & Kyle
- **Result:** Full understanding of integrations

### 🗺️ **I Need Navigation Help**
- **Read:** [`INDEX.md`](./INDEX.md)
- **Contains:** Document guide, scenarios, quick links
- **Result:** Know where to find everything

### 📋 **I Need a Summary**
- **Read:** [`INTEGRATION_SUMMARY.md`](./INTEGRATION_SUMMARY.md)
- **Contains:** What was created, next steps
- **Result:** Understand the deliverables

---

## 📖 All Documentation Files

| File | Size | Read Time | Purpose | Start? |
|------|------|-----------|---------|--------|
| **INDEX.md** | 10.3 KB | 2 min | Navigation guide | 🟢 YES |
| **AI_QUICK_REFERENCE.md** | 7.9 KB | 5 min | Developer cheat sheet | 🟢 YES |
| **INTEGRATIONS_README.md** | 28.9 KB | 30 min | Complete reference | 🟡 After quick ref |
| **DEPLOYMENT_CHECKLIST.md** | 10.7 KB | 20 min | Deployment guide | 🟡 When deploying |
| **INTEGRATION_SUMMARY.md** | 9.3 KB | 5 min | What was delivered | 🟡 Optional |
| **README.md** | 4.1 KB | 3 min | Project overview | 🟡 Background |

**Total Documentation:** 71.2 KB | **Estimated Total Read Time:** 65 minutes

---

## 💻 Code Files

| File | Size | Purpose | Status |
|------|------|---------|--------|
| **src/api/aiIntegrations.js** | 9.6 KB | API helper module | ✅ Ready to use |

---

## 🎯 Functions Reference

### Simon (JobAnalysis)
```javascript
import { AI } from '@/api/aiIntegrations';

// Analyze job opportunity
const analysis = await AI.analyzeJob(jd, company, title);

// Quick ghost job check
const ghostScore = await AI.checkGhostJob(jd, company, title);

// Classify role
const classification = await AI.classifyRole(title);
```

### Kyle (ResumeOptimizer)
```javascript
// Optimize complete application package
const optimization = await AI.optimizeResume(simonBrief);

// Get CV best practices
const cvTips = await AI.getCVPractices(roleType, level);

// Get cover letter best practices
const clTips = await AI.getCoverLetterPractices(roleType);

// Prepare interview strategy
const interviewPrep = await AI.prepareInterview(title, company, type);
```

### Combined Workflow (Recommended)
```javascript
// Complete analysis + optimization in one call
const result = await AI.analyzeAndOptimize(jobData);
```

---

## 🚀 Getting Started Checklist

- [ ] Read AI_QUICK_REFERENCE.md (5 min)
- [ ] Understand Simon & Kyle functions
- [ ] Know where src/api/aiIntegrations.js is
- [ ] Can copy import statement
- [ ] Know how to call AI.analyzeAndOptimize()
- [ ] Can follow DEPLOYMENT_CHECKLIST.md
- [ ] Know how to test in Base44
- [ ] Can handle errors from troubleshooting guide

---

## 📚 Documentation by Topic

### Getting Started
- **First read:** INDEX.md or AI_QUICK_REFERENCE.md
- **Setup:** INTEGRATIONS_README.md (Quick Start section)
- **Deployment:** DEPLOYMENT_CHECKLIST.md

### API Reference
- **Simon functions:** INTEGRATIONS_README.md (JobAnalysis Integration section)
- **Kyle functions:** INTEGRATIONS_README.md (ResumeOptimizer Integration section)
- **Function table:** AI_QUICK_REFERENCE.md

### Frontend Integration
- **React patterns:** INTEGRATIONS_README.md (Frontend Integration section)
- **Code examples:** INTEGRATIONS_README.md (Usage Examples section)
- **React Query:** INTEGRATIONS_README.md (Method 3)

### Testing & Deployment
- **Local testing:** DEPLOYMENT_CHECKLIST.md (Testing section)
- **Base44 deployment:** DEPLOYMENT_CHECKLIST.md (Deployment Steps)
- **Verification:** DEPLOYMENT_CHECKLIST.md (Verify Deployment)

### Troubleshooting
- **Error fixes:** INTEGRATIONS_README.md (Troubleshooting section)
- **Quick fixes:** AI_QUICK_REFERENCE.md (Troubleshooting table)
- **Installation issues:** DEPLOYMENT_CHECKLIST.md (Troubleshooting section)

### Performance & Monitoring
- **Performance tips:** AI_QUICK_REFERENCE.md (Performance Tips)
- **Optimization guide:** INTEGRATIONS_README.md (Performance Optimization section)
- **Monitoring setup:** DEPLOYMENT_CHECKLIST.md (Monitoring & Logging)
- **Logging:** INTEGRATIONS_README.md (Monitoring & Logging section)

---

## 🎓 Learning Paths

### Path 1: Developer (Coding Now)
1. AI_QUICK_REFERENCE.md (5 min)
2. INTEGRATIONS_README.md → Usage Examples (10 min)
3. INTEGRATIONS_README.md → Frontend Integration (10 min)
4. Start coding with src/api/aiIntegrations.js

### Path 2: DevOps (Deploying Now)
1. DEPLOYMENT_CHECKLIST.md (20 min)
2. INTEGRATIONS_README.md → Installation & Deployment (10 min)
3. Follow 5-step deployment process
4. Run test cases

### Path 3: Architect (Planning Now)
1. INTEGRATIONS_README.md → Overview (5 min)
2. INTEGRATIONS_README.md → Directory Structure (5 min)
3. INTEGRATIONS_README.md → Frontend Integration (10 min)
4. DEPLOYMENT_CHECKLIST.md → Phases (10 min)
5. INTEGRATIONS_README.md → Performance Optimization (10 min)

### Path 4: Full Understanding
1. INDEX.md (2 min)
2. AI_QUICK_REFERENCE.md (5 min)
3. INTEGRATIONS_README.md (30 min)
4. DEPLOYMENT_CHECKLIST.md (20 min)
5. src/api/aiIntegrations.js (review code) (10 min)

---

## 📞 Common Questions

| Question | Answer |
|----------|--------|
| **Where do I start?** | Read AI_QUICK_REFERENCE.md (5 min) |
| **How do I use the functions?** | See AI_QUICK_REFERENCE.md or src/api/aiIntegrations.js |
| **How do I deploy?** | Follow DEPLOYMENT_CHECKLIST.md |
| **Where's the complete API reference?** | INTEGRATIONS_README.md → API Reference section |
| **How do I integrate in React?** | INTEGRATIONS_README.md → Frontend Integration section |
| **Something's broken, what do I do?** | INTEGRATIONS_README.md → Troubleshooting section |
| **How do I optimize performance?** | AI_QUICK_REFERENCE.md → Performance Tips |
| **What if I want React Query hooks?** | INTEGRATIONS_README.md → Method 3: React Component Example |

---

## 🔗 Quick Links

**Documentation**
- [INDEX.md](./INDEX.md) - Start here for navigation
- [AI_QUICK_REFERENCE.md](./AI_QUICK_REFERENCE.md) - Start here for coding
- [INTEGRATIONS_README.md](./INTEGRATIONS_README.md) - Complete reference
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment guide
- [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) - What was delivered
- [README.md](./README.md) - Project overview

**Code**
- [src/api/aiIntegrations.js](./src/api/aiIntegrations.js) - API helper

---

## ⏱️ Time Estimates

| Activity | Time | Document |
|----------|------|----------|
| Quick start | 5 min | AI_QUICK_REFERENCE.md |
| Full learning | 30 min | INTEGRATIONS_README.md |
| Deployment | 20 min | DEPLOYMENT_CHECKLIST.md |
| Complete understanding | 65 min | All files |
| Ready to code | 5 min | Quick reference + API helper |
| Ready to deploy | 20 min | Deployment checklist |

---

## ✅ You Are Here

This is the **Table of Contents** file. It helps you navigate all documentation.

**Next Step:** Choose your path above and start reading!

---

**Version:** 2.1.0  
**Last Updated:** January 28, 2026  
**Status:** ✅ Ready for Development
