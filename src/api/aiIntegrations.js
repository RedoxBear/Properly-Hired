// AI Integrations API Helper
// Simplifies interaction with Kyle (ResumeOptimizer) and Simon (JobAnalysis) agents

import { base44 } from './base44Client';

/**
 * Unified AI integration API
 * Provides simplified access to Simon (JobAnalysis) and Kyle (ResumeOptimizer)
 */
export const AI = {
  // ===== SIMON (JobAnalysis) FUNCTIONS =====

  /**
   * Complete job analysis with opportunity evaluation
   * @param {string} jd_text - Job description text
   * @param {string} company_name - Company name
   * @param {string} role_title - Role title
   * @param {string} candidate_background - (Optional) Candidate background
   * @returns {Promise<object>} Analysis result with recommendations
   */
  analyzeJob: async (jd_text, company_name, role_title, candidate_background = null) => {
    try {
      const result = await base44.integrations.Custom.JobAnalysis({
        action: 'analyze_job_opportunity',
        params: {
          jd_text,
          company_name,
          role_title,
          ...(candidate_background && { candidate_background })
        }
      });

      console.log('AI.analyzeJob - Success', {
        company: company_name,
        role: role_title,
        decision: result.data?.recommendation?.decision
      });

      return result;
    } catch (error) {
      console.error('AI.analyzeJob - Failed', {
        company: company_name,
        role: role_title,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Quick ghost-job probability check
   * @param {string} jd_text - Job description
   * @param {string} company_name - Company name
   * @param {string} role_title - Role title
   * @returns {Promise<object>} Ghost job score and risk level
   */
  checkGhostJob: async (jd_text, company_name, role_title) => {
    try {
      const result = await base44.integrations.Custom.JobAnalysis({
        action: 'calculate_ghost_job_score',
        params: { jd_text, company_name, role_title }
      });

      console.log('AI.checkGhostJob - Success', {
        company: company_name,
        ghostScore: result.data?.score,
        riskLevel: result.data?.risk_level
      });

      return result;
    } catch (error) {
      console.error('AI.checkGhostJob - Failed', {
        company: company_name,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Classify a role based on title
   * @param {string} role_title - Role title to classify
   * @returns {Promise<object>} Role classification details
   */
  classifyRole: async (role_title) => {
    try {
      const result = await base44.integrations.Custom.JobAnalysis({
        action: 'classify_role',
        params: { role_title }
      });

      console.log('AI.classifyRole - Success', {
        roleTitle: role_title,
        type: result.data?.role_type,
        tier: result.data?.tier
      });

      return result;
    } catch (error) {
      console.error('AI.classifyRole - Failed', {
        role: role_title,
        error: error.message
      });
      throw error;
    }
  },

  // ===== KYLE (ResumeOptimizer) FUNCTIONS =====

  /**
   * Complete optimization of entire application package
   * @param {object} simon_brief - Complete brief from JobAnalysis
   * @param {object} resume_data - (Optional) Resume data
   * @returns {Promise<object>} Complete optimization package
   */
  optimizeResume: async (simon_brief, resume_data = null) => {
    try {
      const result = await base44.integrations.Custom.ResumeOptimizer({
        action: 'optimize_complete_package',
        params: {
          simon_brief,
          ...(resume_data && { resume_data })
        }
      });

      console.log('AI.optimizeResume - Success', {
        hasPositioning: !!result.data?.positioning,
        hasCVStrategy: !!result.data?.cv_strategy,
        hasInterviewPrep: !!result.data?.interview_prep
      });

      return result;
    } catch (error) {
      console.error('AI.optimizeResume - Failed', {
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Get CV best practices for target role
   * @param {string} role_type - Type of role
   * @param {string} experience_level - Experience level (junior, mid, senior)
   * @returns {Promise<object>} CV best practices
   */
  getCVPractices: async (role_type, experience_level = 'mid') => {
    try {
      const result = await base44.integrations.Custom.ResumeOptimizer({
        action: 'get_cv_best_practices',
        params: { role_type, experience_level }
      });

      console.log('AI.getCVPractices - Success', {
        roleType: role_type,
        experienceLevel: experience_level
      });

      return result;
    } catch (error) {
      console.error('AI.getCVPractices - Failed', {
        roleType: role_type,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Get cover letter best practices
   * @param {string} role_type - Type of role
   * @param {string} industry - (Optional) Industry context
   * @returns {Promise<object>} Cover letter strategies
   */
  getCoverLetterPractices: async (role_type, industry = null) => {
    try {
      const result = await base44.integrations.Custom.ResumeOptimizer({
        action: 'get_cover_letter_best_practices',
        params: { role_type, ...(industry && { industry }) }
      });

      console.log('AI.getCoverLetterPractices - Success', {
        roleType: role_type,
        industry: industry || 'general'
      });

      return result;
    } catch (error) {
      console.error('AI.getCoverLetterPractices - Failed', {
        roleType: role_type,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Prepare interview strategy with STAR method
   * @param {string} role_title - Role title
   * @param {string} company_name - Company name
   * @param {string} role_type - Role type
   * @returns {Promise<object>} Interview preparation package
   */
  prepareInterview: async (role_title, company_name, role_type) => {
    try {
      const result = await base44.integrations.Custom.ResumeOptimizer({
        action: 'prepare_interview_strategy',
        params: { role_title, company_name, role_type }
      });

      console.log('AI.prepareInterview - Success', {
        role: role_title,
        company: company_name,
        hasSTARTemplates: !!result.data?.star_method?.templates
      });

      return result;
    } catch (error) {
      console.error('AI.prepareInterview - Failed', {
        role: role_title,
        company: company_name,
        error: error.message
      });
      throw error;
    }
  },

  // ===== COMBINED WORKFLOW =====

  /**
   * Complete Simon → Kyle workflow
   * Analyzes job and optimizes resume in one call
   * @param {object} jobData - Job data object
   * @returns {Promise<object>} Complete analysis and optimization
   */
  analyzeAndOptimize: async (jobData) => {
    try {
      console.log('Starting AI.analyzeAndOptimize workflow...');

      // Step 1: Simon analyzes job opportunity
      console.log('Step 1: Analyzing job opportunity with Simon...');
      const simonAnalysis = await AI.analyzeJob(
        jobData.description,
        jobData.company,
        jobData.title,
        jobData.candidateBackground
      );

      if (!simonAnalysis.success) {
        throw new Error(`Simon analysis failed: ${simonAnalysis.error}`);
      }

      const { recommendation, ghost_job, quality } = simonAnalysis.data;

      console.log('Simon Analysis Complete:', {
        decision: recommendation.decision,
        priority: recommendation.priority,
        ghostScore: ghost_job.score,
        qualityRating: quality.rating
      });

      // Step 2: Check if worth pursuing
      if (recommendation.priority === 'SKIP') {
        console.log('Job marked as SKIP - returning recommendation');
        return {
          pursue: false,
          reason: recommendation.reasoning,
          ghostScore: ghost_job.score,
          simonAnalysis: simonAnalysis.data
        };
      }

      // Step 3: Kyle optimizes resume package
      console.log('Step 2: Optimizing application package with Kyle...');
      const kyleOptimization = await AI.optimizeResume(simonAnalysis.data);

      if (!kyleOptimization.success) {
        throw new Error(`Kyle optimization failed: ${kyleOptimization.error}`);
      }

      console.log('Kyle Optimization Complete - Full package ready');

      // Return complete package
      return {
        pursue: true,
        priority: recommendation.priority,
        simonAnalysis: simonAnalysis.data,
        kyleOptimization: kyleOptimization.data,
        ready: true,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI.analyzeAndOptimize workflow failed:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive role analysis without optimization
   * @param {string} role_title - Role title
   * @returns {Promise<object>} Role classification and best practices
   */
  analyzeRoleOnly: async (role_title) => {
    try {
      const classification = await AI.classifyRole(role_title);
      const cvPractices = await AI.getCVPractices(
        classification.data.role_type,
        'senior'
      );

      return {
        classification: classification.data,
        cvPractices: cvPractices.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI.analyzeRoleOnly - Failed', error);
      throw error;
    }
  }
};

export default AI;
