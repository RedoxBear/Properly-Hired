/**
 * AI Integration Helper Module
 * Integrates Simon (JobAnalysis) and Kyle (ResumeOptimizer) agents with Base44
 * 
 * Agents:
 * - Simon: Recruiting & HR Expert (JobAnalysis)
 * - Kyle: CV & Cover Letter Expert (ResumeOptimizer)
 */

import { base44 } from './base44Client';

// ============================================================================
// ERROR HANDLING
// ============================================================================

class AIIntegrationError extends Error {
  constructor(message, agent, action, originalError) {
    super(message);
    this.name = 'AIIntegrationError';
    this.agent = agent;
    this.action = action;
    this.originalError = originalError;
  }
}

function handleIntegrationError(error, agent, action) {
  const message = `${agent} ${action} failed: ${error?.message || 'Unknown error'}`;
  throw new AIIntegrationError(message, agent, action, error);
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

const PERFORMANCE_THRESHOLDS = {
  analyzeJob: 10000,           // 10 seconds
  optimizeResume: 8000,        // 8 seconds
  classifyRole: 2000,          // 2 seconds
  checkGhostJob: 3000,         // 3 seconds
  prepareInterview: 5000,      // 5 seconds
  analyzeAndOptimize: 20000    // 20 seconds
};

function createMonitoredCall(fnName, baseFn) {
  return async (...args) => {
    const startTime = performance.now();
    const threshold = PERFORMANCE_THRESHOLDS[fnName] || 5000;

    try {
      const result = await baseFn(...args);
      const duration = performance.now() - startTime;

      if (duration > threshold) {
        console.warn(
          `[PERF] ${fnName} took ${Math.round(duration)}ms (threshold: ${threshold}ms)`
        );
      } else {
        console.debug(`[PERF] ${fnName} completed in ${Math.round(duration)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[ERROR] ${fnName} failed after ${Math.round(duration)}ms:`, error);
      throw error;
    }
  };
}

// ============================================================================
// CACHING
// ============================================================================

const caches = {
  roleClassification: new Map(),
  ghostJobScores: new Map()
};

function getCacheKey(...args) {
  return JSON.stringify(args);
}

// ============================================================================
// SIMON (JobAnalysis) INTEGRATION
// ============================================================================

/**
 * Analyze a job opportunity with Simon
 * @param {Object} jobData - Job data to analyze
 * @param {string} jobData.description - Job description text
 * @param {string} jobData.company - Company name
 * @param {string} jobData.title - Role title
 * @param {string} [jobData.candidateBackground] - Optional candidate background
 * @param {string} [jobData.postingDate] - Optional posting date (ISO format)
 * @returns {Promise<Object>} Simon's analysis
 */
async function analyzeJobImpl(jobData) {
  try {
    const result = await base44.integrations.Custom.JobAnalysis({
      action: 'analyze_job_opportunity',
      params: {
        jd_text: jobData.description,
        company_name: jobData.company,
        role_title: jobData.title,
        candidate_background: jobData.candidateBackground,
        posting_date: jobData.postingDate
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    return result;
  } catch (error) {
    handleIntegrationError(error, 'Simon', 'analyze_job_opportunity');
  }
}

/**
 * Quick ghost-job detection
 * @param {string} jd - Job description
 * @param {string} company - Company name
 * @param {string} title - Role title
 * @returns {Promise<Object>} Ghost job analysis
 */
async function checkGhostJobImpl(jd, company, title) {
  const cacheKey = getCacheKey(jd, company, title);
  if (caches.ghostJobScores.has(cacheKey)) {
    console.debug('[CACHE] Ghost job score hit');
    return caches.ghostJobScores.get(cacheKey);
  }

  try {
    const result = await base44.integrations.Custom.JobAnalysis({
      action: 'calculate_ghost_job_score',
      params: {
        jd_text: jd,
        company_name: company,
        role_title: title
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Ghost job check failed');
    }

    caches.ghostJobScores.set(cacheKey, result);
    return result;
  } catch (error) {
    handleIntegrationError(error, 'Simon', 'calculate_ghost_job_score');
  }
}

/**
 * Classify a role by title
 * @param {string} roleTitle - Role title to classify
 * @returns {Promise<Object>} Role classification
 */
async function classifyRoleImpl(roleTitle) {
  if (caches.roleClassification.has(roleTitle)) {
    console.debug('[CACHE] Role classification hit');
    return caches.roleClassification.get(roleTitle);
  }

  try {
    const result = await base44.integrations.Custom.JobAnalysis({
      action: 'classify_role',
      params: { role_title: roleTitle }
    });

    if (!result.success) {
      throw new Error(result.error || 'Role classification failed');
    }

    caches.roleClassification.set(roleTitle, result);
    return result;
  } catch (error) {
    handleIntegrationError(error, 'Simon', 'classify_role');
  }
}

// ============================================================================
// KYLE (ResumeOptimizer) INTEGRATION
// ============================================================================

/**
 * Optimize complete resume package based on job analysis
 * @param {Object} simonAnalysis - Complete output from analyzeJob
 * @param {Object} [resumeData] - Current resume data (optional)
 * @returns {Promise<Object>} Optimized resume package
 */
async function optimizeResumeImpl(simonAnalysis, resumeData = null) {
  try {
    const result = await base44.integrations.Custom.ResumeOptimizer({
      action: 'optimize_complete_package',
      params: {
        simon_brief: simonAnalysis,
        resume_data: resumeData
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Resume optimization failed');
    }

    return result;
  } catch (error) {
    handleIntegrationError(error, 'Kyle', 'optimize_complete_package');
  }
}

/**
 * Prepare interview strategy with STAR method templates
 * @param {Object} simonAnalysis - Job analysis from Simon
 * @returns {Promise<Object>} Interview preparation
 */
async function prepareInterviewImpl(simonAnalysis) {
  try {
    const result = await base44.integrations.Custom.ResumeOptimizer({
      action: 'prepare_interview_strategy',
      params: {
        role_title: simonAnalysis.role.title,
        company_name: simonAnalysis.role.company,
        role_type: simonAnalysis.role.type
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Interview preparation failed');
    }

    return result;
  } catch (error) {
    handleIntegrationError(error, 'Kyle', 'prepare_interview_strategy');
  }
}

/**
 * Get CV best practices for target role
 * @param {string} roleType - Role type (e.g., "Manager", "Individual Contributor")
 * @param {string} [experienceLevel] - Experience level (e.g., "senior", "mid", "junior")
 * @returns {Promise<Object>} CV best practices
 */
async function getCVBestPracticesImpl(roleType, experienceLevel = null) {
  try {
    const result = await base44.integrations.Custom.ResumeOptimizer({
      action: 'get_cv_best_practices',
      params: {
        role_type: roleType,
        experience_level: experienceLevel
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to get CV best practices');
    }

    return result;
  } catch (error) {
    handleIntegrationError(error, 'Kyle', 'get_cv_best_practices');
  }
}

/**
 * Get cover letter best practices
 * @param {string} roleType - Role type
 * @param {string} [industryType] - Industry type (optional)
 * @returns {Promise<Object>} Cover letter best practices
 */
async function getCoverLetterBestPracticesImpl(roleType, industryType = null) {
  try {
    const result = await base44.integrations.Custom.ResumeOptimizer({
      action: 'get_cover_letter_best_practices',
      params: {
        role_type: roleType,
        industry_type: industryType
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to get cover letter best practices');
    }

    return result;
  } catch (error) {
    handleIntegrationError(error, 'Kyle', 'get_cover_letter_best_practices');
  }
}

// ============================================================================
// COMPLETE WORKFLOW: SIMON → KYLE
// ============================================================================

/**
 * Complete workflow: Analyze job with Simon, then optimize resume with Kyle
 * @param {Object} jobData - Job data to analyze
 * @param {Object} [resumeData] - Current resume data (optional)
 * @returns {Promise<Object>} Complete analysis and optimization or skip recommendation
 */
async function analyzeAndOptimizeImpl(jobData, resumeData = null) {

  try {
    // Step 1: Analyze job with Simon
    const simonAnalysis = await analyzeJobImpl(jobData);

    if (!simonAnalysis.success) {
      throw new Error(simonAnalysis.error || 'Simon analysis failed');
    }

    const analysis = simonAnalysis.data;


    // Step 2: Check if worth pursuing
    if (analysis.recommendation.priority === 'SKIP') {
      return {
        pursue: false,
        reason: analysis.recommendation.reasoning,
        ghostScore: analysis.ghost_job.score,
        decision: analysis.recommendation.decision,
        priority: analysis.recommendation.priority
      };
    }

    // Step 3: Optimize with Kyle
    const kyleOptimization = await optimizeResumeImpl(analysis, resumeData);

    if (!kyleOptimization.success) {
      throw new Error(kyleOptimization.error || 'Kyle optimization failed');
    }


    return {
      pursue: true,
      decision: analysis.recommendation.decision,
      priority: analysis.recommendation.priority,
      ghostScore: analysis.ghost_job.score,
      simonAnalysis: analysis,
      kyleOptimization: kyleOptimization.data,
      ready: true
    };
  } catch (error) {
    console.error('[WORKFLOW] Workflow failed:', error);
    handleIntegrationError(error, 'Workflow', 'Simon → Kyle');
  }
}

// ============================================================================
// MAIN EXPORT: AI INTEGRATION OBJECT
// ============================================================================

export const AI = {
  // Simon (JobAnalysis) API
  analyzeJob: createMonitoredCall('analyzeJob', analyzeJobImpl),
  checkGhostJob: createMonitoredCall('checkGhostJob', checkGhostJobImpl),
  classifyRole: createMonitoredCall('classifyRole', classifyRoleImpl),

  // Kyle (ResumeOptimizer) API
  optimizeResume: createMonitoredCall('optimizeResume', optimizeResumeImpl),
  prepareInterview: createMonitoredCall('prepareInterview', prepareInterviewImpl),
  getCVBestPractices: createMonitoredCall('getCVBestPractices', getCVBestPracticesImpl),
  getCoverLetterBestPractices: createMonitoredCall(
    'getCoverLetterBestPractices',
    getCoverLetterBestPracticesImpl
  ),

  // Complete Workflow
  analyzeAndOptimize: createMonitoredCall('analyzeAndOptimize', analyzeAndOptimizeImpl),

  // Utility functions
  clearCache: () => {
    caches.roleClassification.clear();
    caches.ghostJobScores.clear();
  },

  getCacheStats: () => ({
    roleClassification: caches.roleClassification.size,
    ghostJobScores: caches.ghostJobScores.size
  })
};

export default AI;

/**
 * Usage Examples:
 * 
 * // Quick role classification
 * const classification = await AI.classifyRole('Senior HR Manager');
 * 
 * // Ghost job check
 * const ghostScore = await AI.checkGhostJob(jd, company, title);
 * 
 * // Complete job analysis
 * const analysis = await AI.analyzeJob({
 *   description: '...',
 *   company: '...',
 *   title: '...'
 * });
 * 
 * // Resume optimization
 * const optimized = await AI.optimizeResume(simonAnalysis, resumeData);
 * 
 * // Complete workflow
 * const result = await AI.analyzeAndOptimize(jobData, resumeData);
 * 
 * if (result.pursue) {
 *   // Use result.simonAnalysis and result.kyleOptimization
 * } else {
 *   // Show skip reason
 * }
 */
