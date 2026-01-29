/**
 * AI Module - Integrated Kyle & Simon Agents
 *
 * Provides career coaching, resume optimization, and job analysis
 * using Kyle (applicant-side) and Simon (employer-side) agents
 */

const LLMClient = require('./llm_client');
const KyleAgent = require('./agents/kyle');
const SimonAgent = require('./agents/simon');

const USE_MOCK = process.env.USE_MOCK_AI === 'true';
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';

let llmClient = null;
let kyle = null;
let simon = null;

function initializeAgents() {
  if (USE_MOCK) {
    console.log('AI Module: Running in MOCK mode');
    return;
  }

  try {
    llmClient = new LLMClient(LLM_PROVIDER, {
      apiKey: LLM_PROVIDER === 'openai'
        ? process.env.OPENAI_API_KEY
        : process.env.GEMINI_API_KEY,
      model: LLM_PROVIDER === 'openai'
        ? process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
        : process.env.GEMINI_MODEL || 'gemini-pro'
    });

    kyle = new KyleAgent(llmClient);
    simon = new SimonAgent(llmClient);

    console.log(`AI Module: Initialized with ${LLM_PROVIDER.toUpperCase()}`);
  } catch (error) {
    console.error('AI Module initialization error:', error);
    console.log('Falling back to MOCK mode');
  }
}

initializeAgents();

async function analyzeResume(resumeData, jobDescription) {
  console.log('AI Module: Analyzing resume...');

  if (USE_MOCK || !kyle) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      mode: 'mock',
      score: 85,
      summary: 'Strong candidate but missing TypeScript experience.',
      skills_found: ['React', 'JavaScript', 'HTML/CSS'],
      skills_missing: ['TypeScript', 'Jest'],
      recommendation: 'Interview'
    };
  }

  try {
    const optimization = await kyle.optimizeResume(resumeData, jobDescription);
    const screening = await kyle.screenResume(resumeData, jobDescription);

    return {
      mode: 'live',
      score: optimization.score,
      summary: `${screening.verdict}: ${optimization.strengths.join(', ')}`,
      strengths: optimization.strengths,
      weaknesses: optimization.weaknesses,
      fixes: optimization.fixes,
      atsOptimization: optimization.atsOptimization,
      keywords: optimization.keywords,
      verdict: screening.verdict,
      screeningReasons: screening.reasons,
      interviewQuestions: screening.interviewQuestions,
      improvementPlan: screening.improvementPlan
    };
  } catch (error) {
    console.error('Resume analysis error:', error);
    throw error;
  }
}

async function analyzeJobDescription(jobDescription, candidateContext = null) {
  console.log('AI Module: Analyzing job description...');

  if (USE_MOCK || !simon) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      mode: 'mock',
      key_requirements: ['5+ years experience', 'React expertise', 'Team leadership'],
      company_culture: 'Fast-paced startup with a focus on innovation and collaboration.',
      required_qualifications: ['Bachelor in CS', 'Experience with Node.js'],
      nice_to_have_skills: ['TypeScript', 'AWS', 'Docker'],
      important_keywords: ['React', 'Scale', 'System Design'],
      seniority_level: 'Senior',
      application_strategy: 'Focus on your experience scaling React applications and leading small teams.',
      optimization_score: 85,
      ai_generated_likelihood: 10,
      ai_signals: ['Human-like tone'],
      humanization_tips: 'Mention specific projects where you solved complex problems.'
    };
  }

  try {
    const jobAnalysis = await simon.analyzeJobDescription(jobDescription);
    const kyleBrief = await simon.generateKyleBrief(jobDescription, candidateContext);

    let fitAssessment = null;
    if (candidateContext) {
      fitAssessment = await simon.assessCandidateFit(candidateContext, jobDescription);
    }

    return {
      mode: 'live',
      ...jobAnalysis,
      kyleBrief,
      fitAssessment
    };
  } catch (error) {
    console.error('Job analysis error:', error);
    throw error;
  }
}

async function optimizeResumeForJob(resumeData, jobDescription, targetRole) {
  console.log('AI Module: Optimizing resume for job...');

  if (USE_MOCK || !kyle || !simon) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      mode: 'mock',
      optimizedResume: resumeData,
      changes: ['Added TypeScript to skills', 'Quantified achievements', 'Improved ATS keywords'],
      matchScore: 92
    };
  }

  try {
    const jobAnalysis = await simon.analyzeJobDescription(jobDescription);
    const optimization = await kyle.optimizeResume(resumeData, jobDescription, targetRole);
    const fitAssessment = await simon.assessCandidateFit(resumeData, jobDescription);

    return {
      mode: 'live',
      optimization,
      jobAnalysis,
      fitAssessment,
      actionPlan: {
        immediateChanges: optimization.fixes.slice(0, 3),
        keywordsToAdd: optimization.keywords,
        emphasisPoints: fitAssessment.emphasisPoints,
        gapsToAddress: fitAssessment.gaps
      }
    };
  } catch (error) {
    console.error('Resume optimization error:', error);
    throw error;
  }
}

async function generateCoverLetter(resumeData, jobDescription, companyName, options = {}) {
  console.log('AI Module: Generating cover letter...');

  if (USE_MOCK || !kyle) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      mode: 'mock',
      shouldWrite: true,
      reasoning: 'Strategic opportunity to highlight relevant experience',
      intro_mission: 'When I saw your team\'s recent work, I knew I had to apply.',
      para_experience: 'I have 5 years of experience building scalable applications.',
      para_alignment: 'Your mission resonates with my core values.',
      closing: 'I look forward to discussing this role further.',
      coverLetter: 'Dear Hiring Manager,\n\nI am excited to apply...'
    };
  }

  try {
    return await kyle.generateCoverLetter(resumeData, jobDescription, companyName, options);
  } catch (error) {
    console.error('Cover letter generation error:', error);
    throw error;
  }
}

async function prepareInterviewAnswers(resumeData, jobDescription, questionType = 'behavioral') {
  console.log('AI Module: Preparing interview answers...');

  if (USE_MOCK || !kyle) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      mode: 'mock',
      tellMeAboutYourself: 'I am a software engineer with 5 years of experience...',
      starStories: [
        { situation: '...', task: '...', action: '...', result: '...' }
      ],
      questionsToAsk: ['What does success look like in this role?']
    };
  }

  try {
    return await kyle.prepareInterviewAnswers(resumeData, jobDescription, questionType);
  } catch (error) {
    console.error('Interview prep error:', error);
    throw error;
  }
}

async function answerApplicationQuestions(resumeData, jobDescription, questions) {
  console.log('AI Module: Answering application questions...');

  if (USE_MOCK || !kyle) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      mode: 'mock',
      answers: questions.map(q => ({
        question: q.question,
        answer: `This is a mock answer for: ${q.question}`,
        character_count: 100,
        optimization_tips: 'Highlight your specific experience here.'
      }))
    };
  }

  try {
    return await kyle.answerApplicationQuestions(resumeData, jobDescription, questions);
  } catch (error) {
    console.error('QA Assistant error:', error);
    throw error;
  }
}

async function assessCandidateFit(resumeData, jobDescription) {
  console.log('AI Module: Assessing candidate fit...');

  if (USE_MOCK || !simon) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      mode: 'mock',
      fitLevel: 'Strong',
      reasons: ['Relevant experience', 'Strong technical skills', 'Leadership background'],
      screeningLikelihood: 85
    };
  }

  try {
    return await simon.assessCandidateFit(resumeData, jobDescription);
  } catch (error) {
    console.error('Fit assessment error:', error);
    throw error;
  }
}

async function parseResume(rawText) {
  console.log('AI Module: Parsing resume text...');

  if (USE_MOCK || !kyle) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      mode: 'mock',
      personal_info: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        location: 'New York, NY',
        linkedin: 'linkedin.com/in/johndoe'
      },
      skills: ['JavaScript', 'React', 'Node.js', 'Team Leadership'],
      experience: [
        {
          company: 'Tech Corp',
          position: 'Senior Developer',
          duration: '2020 - Present',
          achievements: ['Led team of 5', 'Increased performance by 20%']
        }
      ],
      education: [
        {
          institution: 'State University',
          degree: 'BS Computer Science',
          year: '2019'
        }
      ]
    };
  }

  try {
    return await kyle.parseResume(rawText);
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw error;
  }
}

module.exports = {
  analyzeResume,
  analyzeJobDescription,
  optimizeResumeForJob,
  generateCoverLetter,
  prepareInterviewAnswers,
  answerApplicationQuestions,
  assessCandidateFit,
  parseResume
};
