/**
 * Base44 Frontend Integration Examples
 * Kyle & Simon AI Agents v2.1.0
 *
 * How to use JobAnalysis and ResumeOptimizer integrations in your Base44 app
 */

import { base44 } from '@/api/base44Client';

// ============================================================================
// EXAMPLE 1: Simple Job Analysis
// ============================================================================

export async function simpleJobAnalysis(jobDescription, company, roleTitle) {
  try {
    const result = await base44.integrations.Custom.JobAnalysis({
      action: 'analyze_job_opportunity',
      params: {
        jd_text: jobDescription,
        company_name: company,
        role_title: roleTitle
      }
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Access the analysis
    const { recommendation, ghost_job, quality, role } = result.data;

    console.log(`Decision: ${recommendation.decision}`);
    console.log(`Priority: ${recommendation.priority}`);
    console.log(`Ghost Job Score: ${ghost_job.score}/100`);
    console.log(`JD Quality: ${quality.rating} (${quality.score}/100)`);

    return result.data;
  } catch (error) {
    console.error('Job analysis failed:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Quick Ghost-Job Check
// ============================================================================

export async function quickGhostJobCheck(jobDescription, company, roleTitle) {
  try {
    const result = await base44.integrations.Custom.JobAnalysis({
      action: 'calculate_ghost_job_score',
      params: {
        jd_text: jobDescription,
        company_name: company,
        role_title: roleTitle
      }
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    const { score, risk_level, recommendation } = result.data;

    // Return simple boolean + details
    return {
      isGhostJob: score >= 60,
      score,
      riskLevel: risk_level,
      recommendation,
      shouldPursue: score < 40
    };
  } catch (error) {
    console.error('Ghost job check failed:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 3: Role Classification
// ============================================================================

export async function classifyRole(roleTitle) {
  try {
    const result = await base44.integrations.Custom.JobAnalysis({
      action: 'classify_role',
      params: { role_title: roleTitle }
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    const { role_type, tier, seniority_level, is_deputy, is_compliance } = result.data;

    return {
      type: role_type,
      tier,
      seniority: seniority_level,
      isDeputy: is_deputy,
      isCompliance: is_compliance
    };
  } catch (error) {
    console.error('Role classification failed:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 4: Complete Simon → Kyle Workflow
// ============================================================================

export async function completeJobApplicationWorkflow(jobData) {
  try {
    // STEP 1: Simon analyzes the opportunity
    console.log('Step 1: Simon analyzes job opportunity...');

    const simonAnalysis = await base44.integrations.Custom.JobAnalysis({
      action: 'analyze_job_opportunity',
      params: {
        jd_text: jobData.description,
        company_name: jobData.company,
        role_title: jobData.title,
        candidate_background: jobData.candidateBackground || null
      }
    });

    if (!simonAnalysis.success) {
      throw new Error(`Simon analysis failed: ${simonAnalysis.error}`);
    }

    const { recommendation, ghost_job } = simonAnalysis.data;

    // Check if worth pursuing
    if (recommendation.priority === 'SKIP') {
      return {
        status: 'rejected',
        reason: recommendation.reasoning,
        ghostScore: ghost_job.score,
        recommendation: recommendation.decision
      };
    }

    console.log('✓ Simon recommends pursuing this opportunity');

    // STEP 2: Kyle optimizes the complete package
    console.log('Step 2: Kyle creates optimization package...');

    const kyleOptimization = await base44.integrations.Custom.ResumeOptimizer({
      action: 'optimize_complete_package',
      params: {
        simon_brief: simonAnalysis.data
      }
    });

    if (!kyleOptimization.success) {
      throw new Error(`Kyle optimization failed: ${kyleOptimization.error}`);
    }

    console.log('✓ Complete application package ready');

    // Return complete package
    return {
      status: 'ready',
      priority: recommendation.priority,
      simonAnalysis: simonAnalysis.data,
      kylePackage: kyleOptimization.data,
      summary: {
        decision: recommendation.decision,
        ghostScore: ghost_job.score,
        jdQuality: simonAnalysis.data.quality.rating,
        roleType: simonAnalysis.data.role.type,
        keyThemes: kyleOptimization.data.positioning.positioning.key_themes,
        starTemplates: kyleOptimization.data.interview_prep.star_method.templates.length
      }
    };

  } catch (error) {
    console.error('Complete workflow failed:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 5: Interview Preparation Only
// ============================================================================

export async function prepareForInterview(roleTitle, companyName, roleType, simonBrief = null) {
  try {
    const result = await base44.integrations.Custom.ResumeOptimizer({
      action: 'prepare_interview_strategy',
      params: {
        role_title: roleTitle,
        company_name: companyName,
        role_type: roleType,
        simon_brief: simonBrief,
        save_to_file: false // Base44 may not support file writes
      }
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    const { star_method, questions, preparation } = result.data;

    return {
      starTemplates: star_method.templates,
      starGuidance: star_method.guidance,
      questionsByCategory: questions.by_category,
      checklist: preparation.checklist,
      companyResearch: preparation.company_research,
      questionsToAsk: preparation.questions_to_ask
    };
  } catch (error) {
    console.error('Interview preparation failed:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 6: Get CV Best Practices
// ============================================================================

export async function getCVStrategy(roleType, experienceLevel = 'senior') {
  try {
    const result = await base44.integrations.Custom.ResumeOptimizer({
      action: 'get_cv_best_practices',
      params: {
        role_type: roleType,
        experience_level: experienceLevel
      }
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      bestPractices: result.data.best_practices,
      sources: result.data.sources,
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('CV strategy failed:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 7: Get Cover Letter Strategy
// ============================================================================

export async function getCoverLetterStrategy(roleType, companyName = null) {
  try {
    const result = await base44.integrations.Custom.ResumeOptimizer({
      action: 'get_cover_letter_best_practices',
      params: {
        role_type: roleType,
        company_name: companyName
      }
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      bestPractices: result.data.best_practices,
      keyElements: result.data.key_elements,
      sources: result.data.sources
    };
  } catch (error) {
    console.error('Cover letter strategy failed:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 8: React Hook for Job Analysis
// ============================================================================

import { useState, useCallback } from 'react';

export function useJobAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (jobData) => {
    setLoading(true);
    setError(null);

    try {
      const analysis = await completeJobApplicationWorkflow(jobData);
      setResult(analysis);
      return analysis;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    analyze,
    reset,
    loading,
    result,
    error,
    isPursuing: result?.status === 'ready',
    recommendation: result?.summary?.decision
  };
}

// Usage in component:
// const { analyze, loading, result, isPursuing } = useJobAnalysis();
// await analyze({ description: '...', company: '...', title: '...' });

// ============================================================================
// EXAMPLE 9: Batch Analysis (Multiple Jobs)
// ============================================================================

export async function batchAnalyzeJobs(jobsList) {
  const results = [];

  for (const job of jobsList) {
    try {
      const analysis = await simpleJobAnalysis(
        job.description,
        job.company,
        job.title
      );

      results.push({
        jobId: job.id,
        success: true,
        data: analysis,
        recommendation: analysis.recommendation.decision,
        priority: analysis.recommendation.priority,
        ghostScore: analysis.ghost_job.score
      });
    } catch (error) {
      results.push({
        jobId: job.id,
        success: false,
        error: error.message
      });
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Sort by priority
  return results.sort((a, b) => {
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'SKIP': 0 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// ============================================================================
// EXAMPLE 10: Error Handling Pattern
// ============================================================================

export async function safeJobAnalysis(jobData) {
  try {
    const result = await completeJobApplicationWorkflow(jobData);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    // Log error for monitoring
    console.error('Job analysis error:', {
      job: jobData.title,
      company: jobData.company,
      error: error.message
    });

    // Return user-friendly error
    return {
      success: false,
      error: error.message,
      fallback: {
        // Provide fallback recommendations
        recommendation: 'MANUAL_REVIEW',
        reason: 'AI analysis unavailable - please review manually'
      }
    };
  }
}
