require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'prague-day-secret-key-2026';

// Mock User Database (Base44 should eventually replace this)
const users = [
  {
    id: '1',
    name: 'Pro User',
    email: 'pro@test.com',
    password: bcrypt.hashSync('password', 10),
    subscription_tier: 'pro',
    credits_remaining: 50
  },
  {
    id: '2',
    name: 'Free User',
    email: 'free@test.com',
    password: bcrypt.hashSync('password', 10),
    subscription_tier: 'free',
    credits_remaining: 5
  }
];

const {
  analyzeResume,
  analyzeJobDescription,
  optimizeResumeForJob,
  generateCoverLetter,
  prepareInterviewAnswers,
  assessCandidateFit,
  parseResume
} = require('./src/ai_module');

const {
  JobApplicationAPI,
  ResumeAPI,
  EncouragementQuoteAPI,
  AutofillVaultAPI,
  JobMatchAPI,
  UserPreferencesAPI,
  ReferralAPI
} = require('./src/base44_client');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

app.get('/', (req, res) => {
  res.json({
    service: 'Prague Day AI API',
    status: 'running',
    version: '1.0.0',
    mode: process.env.USE_MOCK_AI === 'true' ? 'mock' : 'live',
    database: 'Base44',
    endpoints: {
      health: 'GET /',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me'
      },
      ai: {
        parseResume: 'POST /api/resume/parse (multipart/form-data)',
        analyzeResume: 'POST /api/resume/analyze',
        optimizeResume: 'POST /api/resume/optimize',
        analyzeJob: 'POST /api/job/analyze',
        assessFit: 'POST /api/job/assess-fit',
        generateCoverLetter: 'POST /api/cover-letter/generate',
        prepareInterview: 'POST /api/interview/prepare',
        answerQuestions: 'POST /api/interview/answer-questions'
      },
      data: {
        jobApplications: 'GET/POST /api/data/job-applications',
        resumes: 'GET/POST /api/data/resumes',
        quotes: 'GET /api/data/quotes',
        autofillVault: 'GET/POST /api/data/autofill-vault',
        jobMatches: 'GET/POST /api/data/job-matches',
        userPreferences: 'GET/POST /api/data/user-preferences',
        referrals: 'GET/POST /api/data/referrals'
      }
    }
  });
});

// --- Auth Endpoints ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, subscription_tier: user.subscription_tier },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      subscription_tier: user.subscription_tier,
      credits_remaining: user.credits_remaining
    }
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = {
    id: String(users.length + 1),
    name,
    email,
    password: await bcrypt.hashSync(password, 10),
    subscription_tier: 'free',
    credits_remaining: 5
  };

  users.push(newUser);
  res.status(201).json({ message: 'User created successfully' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    subscription_tier: user.subscription_tier,
    credits_remaining: user.credits_remaining
  });
});

// --- Admin / Sync Endpoints ---

app.post('/api/admin/master-cv/sync', authenticateToken, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const masterCvPath = path.join(__dirname, '..', 'master_cv.txt');

    if (!fs.existsSync(masterCvPath)) {
      return res.status(404).json({ error: 'master_cv.txt not found in project root' });
    }

    const rawText = fs.readFileSync(masterCvPath, 'utf8');
    
    // 1. Parse the resume using Kyle
    console.log('Syncing Master CV: Parsing raw text...');
    const parsedData = await parseResume(rawText);

    // 2. Check if a master resume already exists in Base44
    const existingMasterResumes = await ResumeAPI.getMasterResumes();
    
    let result;
    const resumePayload = {
      version_name: 'Master CV (Sync)',
      is_master_resume: true,
      content: rawText,
      structured_data: JSON.stringify(parsedData),
      updated_at: new Date().toISOString()
    };

    if (existingMasterResumes && existingMasterResumes.length > 0) {
      console.log(`Updating existing Master CV (ID: ${existingMasterResumes[0]._id})`);
      result = await ResumeAPI.update(existingMasterResumes[0]._id, resumePayload);
    } else {
      console.log('Creating new Master CV in Base44');
      result = await ResumeAPI.create({
        ...resumePayload,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      status: 'success',
      message: 'Master CV synced successfully',
      resume_id: result._id || result.id,
      parsed_data: parsedData
    });

  } catch (error) {
    console.error('Master CV sync failed:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

app.post('/api/resume/parse', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let text = '';
    
    // Simple text extraction based on mimetype
    if (req.file.mimetype === 'application/pdf') {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else if (req.file.mimetype === 'text/plain') {
      text = req.file.buffer.toString('utf8');
    } else {
      // For images/other formats, we might need OCR or a more complex parser
      // For now, return error or handle text/pdf only
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or TXT.' });
    }

    const result = await parseResume(text);
    
    // Return structured data along with a mock file_url since we aren't storing it permanently yet
    res.json({
      status: 'success',
      output: result,
      file_url: `memory://${req.file.originalname}` // Placeholder
    });

  } catch (error) {
    console.error('Resume parsing failed:', error);
    res.status(500).json({ error: 'Parsing failed', details: error.message });
  }
});

app.post('/api/interview/answer-questions', authenticateToken, async (req, res) => {
  try {
    const { resumeData, jobDescription, questions } = req.body;

    if (!resumeData || !jobDescription || !questions) {
      return res.status(400).json({ error: 'Resume data, job description, and questions are required' });
    }

    const result = await answerApplicationQuestions(resumeData, jobDescription, questions);
    res.json(result);
  } catch (error) {
    console.error('Answer generation failed:', error);
    res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

app.post('/api/resume/analyze', authenticateToken, async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const result = await analyzeResume(resumeData, jobDescription);
    res.json(result);
  } catch (error) {
    console.error('Resume analysis failed:', error);
    res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

app.post('/api/resume/optimize', authenticateToken, async (req, res) => {
  try {
    const { resumeData, jobDescription, targetRole } = req.body;

    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Resume data and job description are required' });
    }

    const result = await optimizeResumeForJob(resumeData, jobDescription, targetRole);
    res.json(result);
  } catch (error) {
    console.error('Resume optimization failed:', error);
    res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

app.post('/api/job/analyze', authenticateToken, async (req, res) => {
  try {
    const { jobDescription, candidateContext } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const result = await analyzeJobDescription(jobDescription, candidateContext);
    res.json(result);
  } catch (error) {
    console.error('Job analysis failed:', error);
    res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

app.post('/api/job/assess-fit', authenticateToken, async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Resume data and job description are required' });
    }

    const result = await assessCandidateFit(resumeData, jobDescription);
    res.json(result);
  } catch (error) {
    console.error('Fit assessment failed:', error);
    res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

app.post('/api/cover-letter/generate', authenticateToken, async (req, res) => {
  try {
    const { resumeData, jobDescription, companyName, options } = req.body;

    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Resume data and job description are required' });
    }

    const result = await generateCoverLetter(resumeData, jobDescription, companyName, options);
    res.json(result);
  } catch (error) {
    console.error('Cover letter generation failed:', error);
    res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

app.post('/api/interview/prepare', authenticateToken, async (req, res) => {
  try {
    const { resumeData, jobDescription, questionType } = req.body;

    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Resume data and job description are required' });
    }

    const result = await prepareInterviewAnswers(resumeData, jobDescription, questionType);
    res.json(result);
  } catch (error) {
    console.error('Interview preparation failed:', error);
    res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

app.get('/api/data/job-applications', authenticateToken, async (req, res) => {
  try {
    const filters = req.query;
    const applications = await JobApplicationAPI.getAll(filters);
    res.json(applications);
  } catch (error) {
    console.error('Failed to fetch job applications:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.get('/api/data/job-applications/:id', authenticateToken, async (req, res) => {
  try {
    const application = await JobApplicationAPI.getById(req.params.id);
    res.json(application);
  } catch (error) {
    console.error('Failed to fetch job application:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.post('/api/data/job-applications', authenticateToken, async (req, res) => {
  try {
    const application = await JobApplicationAPI.create(req.body);
    res.status(201).json(application);
  } catch (error) {
    console.error('Failed to create job application:', error);
    res.status(500).json({ error: 'Database insert failed', details: error.message });
  }
});

app.put('/api/data/job-applications/:id', authenticateToken, async (req, res) => {
  try {
    const application = await JobApplicationAPI.update(req.params.id, req.body);
    res.json(application);
  } catch (error) {
    console.error('Failed to update job application:', error);
    res.status(500).json({ error: 'Database update failed', details: error.message });
  }
});

app.delete('/api/data/job-applications/:id', authenticateToken, async (req, res) => {
  try {
    await JobApplicationAPI.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete job application:', error);
    res.status(500).json({ error: 'Database delete failed', details: error.message });
  }
});

app.get('/api/data/resumes', authenticateToken, async (req, res) => {
  try {
    const filters = req.query;
    const resumes = await ResumeAPI.getAll(filters);
    res.json(resumes);
  } catch (error) {
    console.error('Failed to fetch resumes:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.get('/api/data/resumes/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await ResumeAPI.getById(req.params.id);
    res.json(resume);
  } catch (error) {
    console.error('Failed to fetch resume:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.post('/api/data/resumes', authenticateToken, async (req, res) => {
  try {
    const resume = await ResumeAPI.create(req.body);
    res.status(201).json(resume);
  } catch (error) {
    console.error('Failed to create resume:', error);
    res.status(500).json({ error: 'Database insert failed', details: error.message });
  }
});

app.put('/api/data/resumes/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await ResumeAPI.update(req.params.id, req.body);
    res.json(resume);
  } catch (error) {
    console.error('Failed to update resume:', error);
    res.status(500).json({ error: 'Database update failed', details: error.message });
  }
});

app.get('/api/data/quotes', authenticateToken, async (req, res) => {
  try {
    const quotes = await EncouragementQuoteAPI.getApproved();
    res.json(quotes);
  } catch (error) {
    console.error('Failed to fetch quotes:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.get('/api/data/quotes/random', authenticateToken, async (req, res) => {
  try {
    const quote = await EncouragementQuoteAPI.getRandom();
    res.json(quote);
  } catch (error) {
    console.error('Failed to fetch random quote:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.get('/api/data/autofill-vault', authenticateToken, async (req, res) => {
  try {
    const vaults = await AutofillVaultAPI.getAll(req.query);
    res.json(vaults);
  } catch (error) {
    console.error('Failed to fetch autofill vaults:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.get('/api/data/autofill-vault/:id', authenticateToken, async (req, res) => {
  try {
    const vault = await AutofillVaultAPI.getById(req.params.id);
    res.json(vault);
  } catch (error) {
    console.error('Failed to fetch autofill vault:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.post('/api/data/autofill-vault', authenticateToken, async (req, res) => {
  try {
    const vault = await AutofillVaultAPI.create(req.body);
    res.status(201).json(vault);
  } catch (error) {
    console.error('Failed to create autofill vault:', error);
    res.status(500).json({ error: 'Database insert failed', details: error.message });
  }
});

app.put('/api/data/autofill-vault/:id', authenticateToken, async (req, res) => {
  try {
    const vault = await AutofillVaultAPI.update(req.params.id, req.body);
    res.json(vault);
  } catch (error) {
    console.error('Failed to update autofill vault:', error);
    res.status(500).json({ error: 'Database update failed', details: error.message });
  }
});

app.get('/api/data/job-matches', authenticateToken, async (req, res) => {
  try {
    const matches = await JobMatchAPI.getAll(req.query);
    res.json(matches);
  } catch (error) {
    console.error('Failed to fetch job matches:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.get('/api/data/job-matches/:id', authenticateToken, async (req, res) => {
  try {
    const match = await JobMatchAPI.getById(req.params.id);
    res.json(match);
  } catch (error) {
    console.error('Failed to fetch job match:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.post('/api/data/job-matches', authenticateToken, async (req, res) => {
  try {
    const match = await JobMatchAPI.create(req.body);
    res.status(201).json(match);
  } catch (error) {
    console.error('Failed to create job match:', error);
    res.status(500).json({ error: 'Database insert failed', details: error.message });
  }
});

app.put('/api/data/job-matches/:id', authenticateToken, async (req, res) => {
  try {
    const match = await JobMatchAPI.update(req.params.id, req.body);
    res.json(match);
  } catch (error) {
    console.error('Failed to update job match:', error);
    res.status(500).json({ error: 'Database update failed', details: error.message });
  }
});

app.get('/api/data/user-preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = await UserPreferencesAPI.getAll(req.query);
    res.json(preferences);
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.get('/api/data/user-preferences/:id', authenticateToken, async (req, res) => {
  try {
    const preferences = await UserPreferencesAPI.getById(req.params.id);
    res.json(preferences);
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.post('/api/data/user-preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = await UserPreferencesAPI.create(req.body);
    res.status(201).json(preferences);
  } catch (error) {
    console.error('Failed to create user preferences:', error);
    res.status(500).json({ error: 'Database insert failed', details: error.message });
  }
});

app.put('/api/data/user-preferences/:id', authenticateToken, async (req, res) => {
  try {
    const preferences = await UserPreferencesAPI.update(req.params.id, req.body);
    res.json(preferences);
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    res.status(500).json({ error: 'Database update failed', details: error.message });
  }
});

app.get('/api/data/referrals', authenticateToken, async (req, res) => {
  try {
    const referrals = await ReferralAPI.getAll(req.query);
    res.json(referrals);
  } catch (error) {
    console.error('Failed to fetch referrals:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.get('/api/data/referrals/:id', authenticateToken, async (req, res) => {
  try {
    const referral = await ReferralAPI.getById(req.params.id);
    res.json(referral);
  } catch (error) {
    console.error('Failed to fetch referral:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

app.post('/api/data/referrals', authenticateToken, async (req, res) => {
  try {
    const referral = await ReferralAPI.create(req.body);
    res.status(201).json(referral);
  } catch (error) {
    console.error('Failed to create referral:', error);
    res.status(500).json({ error: 'Database insert failed', details: error.message });
  }
});

app.put('/api/data/referrals/:id', authenticateToken, async (req, res) => {
  try {
    const referral = await ReferralAPI.update(req.params.id, req.body);
    res.json(referral);
  } catch (error) {
    console.error('Failed to update referral:', error);
    res.status(500).json({ error: 'Database update failed', details: error.message });
  }
});

app.post('/api/analyze', authenticateToken, async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job Description is required' });
    }

    const result = await analyzeResume(null, jobDescription);
    res.json(result);
  } catch (error) {
    console.error('Analysis failed:', error);
    res.status(500).json({ error: 'AI Processing Failed' });
  }
});

// ==================== O*NET Import Endpoints ====================
const {
  importONetFile,
  importONetBatch,
  createImportJob,
  getImportJob,
  cancelImportJob,
  listImportJobs
} = require('./src/onet_import');

// Configure multer for O*NET imports (allow larger files)
const onetUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for O*NET files
    files: 50 // Allow up to 50 files at once
  }
});

// Create import job
app.post('/api/onet/import/create', authenticateToken, (req, res) => {
  try {
    const job = createImportJob(req.user.id, req.body.type || 'single');
    res.json({ success: true, job });
  } catch (error) {
    console.error('Failed to create import job:', error);
    res.status(500).json({ error: 'Failed to create import job', details: error.message });
  }
});

// Upload and import single file
app.post('/api/onet/import/file/:jobId', authenticateToken, onetUpload.single('file'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getImportJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Start import in background
    importONetFile(jobId, req.file.originalname, req.file.buffer, (updatedJob) => {
      // Progress updates can be sent via SSE or polling
      console.log(`Job ${jobId} progress: ${updatedJob.progress}%`);
    }).catch(error => {
      console.error(`Import job ${jobId} failed:`, error);
    });

    res.json({ success: true, message: 'Import started', jobId });
  } catch (error) {
    console.error('Failed to start import:', error);
    res.status(500).json({ error: 'Failed to start import', details: error.message });
  }
});

// Upload and import multiple files
app.post('/api/onet/import/batch/:jobId', authenticateToken, onetUpload.array('files', 50), async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getImportJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Start batch import in background
    importONetBatch(jobId, req.files, (updatedJob) => {
      console.log(`Batch job ${jobId} progress: ${updatedJob.currentFileIndex}/${updatedJob.totalFiles} files`);
    }).catch(error => {
      console.error(`Batch import job ${jobId} failed:`, error);
    });

    res.json({
      success: true,
      message: 'Batch import started',
      jobId,
      fileCount: req.files.length
    });
  } catch (error) {
    console.error('Failed to start batch import:', error);
    res.status(500).json({ error: 'Failed to start batch import', details: error.message });
  }
});

// Get job status
app.get('/api/onet/import/status/:jobId', authenticateToken, (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getImportJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ success: true, job });
  } catch (error) {
    console.error('Failed to get job status:', error);
    res.status(500).json({ error: 'Failed to get job status', details: error.message });
  }
});

// List user's import jobs
app.get('/api/onet/import/jobs', authenticateToken, (req, res) => {
  try {
    const jobs = listImportJobs(req.user.id);
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Failed to list import jobs:', error);
    res.status(500).json({ error: 'Failed to list jobs', details: error.message });
  }
});

// Cancel import job
app.post('/api/onet/import/cancel/:jobId', authenticateToken, (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getImportJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const cancelledJob = cancelImportJob(jobId);
    res.json({ success: true, job: cancelledJob });
  } catch (error) {
    console.error('Failed to cancel job:', error);
    res.status(500).json({ error: 'Failed to cancel job', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Prague Day API Server`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.USE_MOCK_AI === 'true' ? 'MOCK' : 'LIVE'}`);
  console.log(`   LLM: ${process.env.LLM_PROVIDER || 'openai'}`);
  console.log(`   Database: Base44`);
  console.log(`\n📋 AI Endpoints:`);
  console.log(`   POST /api/resume/analyze        - Analyze resume`);
  console.log(`   POST /api/resume/optimize       - Optimize resume for job`);
  console.log(`   POST /api/job/analyze           - Analyze job description`);
  console.log(`   POST /api/job/assess-fit        - Assess candidate fit`);
  console.log(`   POST /api/cover-letter/generate - Generate cover letter`);
  console.log(`   POST /api/interview/prepare     - Prepare interview answers`);
  console.log(`\n💾 Data Endpoints:`);
  console.log(`   GET/POST /api/data/job-applications`);
  console.log(`   GET/POST /api/data/resumes`);
  console.log(`   GET      /api/data/quotes`);
  console.log(`   GET/POST /api/data/autofill-vault`);
  console.log(`   GET/POST /api/data/job-matches`);
  console.log(`   GET/POST /api/data/user-preferences`);
  console.log(`   GET/POST /api/data/referrals`);
  console.log(`\n📊 O*NET Bulk Import Endpoints:`);
  console.log(`   POST /api/onet/import/create        - Create import job`);
  console.log(`   POST /api/onet/import/file/:jobId   - Upload single file`);
  console.log(`   POST /api/onet/import/batch/:jobId  - Upload multiple files`);
  console.log(`   GET  /api/onet/import/status/:jobId - Get job status`);
  console.log(`   GET  /api/onet/import/jobs          - List all jobs`);
  console.log(`   POST /api/onet/import/cancel/:jobId - Cancel job`);
  console.log(`\n✅ Ready for requests\n`);
});
