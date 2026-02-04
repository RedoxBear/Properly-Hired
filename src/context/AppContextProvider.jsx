import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * AppContext - Tracks user's current activity/context in the app
 * Used by AgentChat (Kyle/Simon) to provide context-aware guidance
 */
const AppContext = createContext(null);

export function AppContextProvider({ children }) {
  const [context, setContext] = useState({
    currentPage: null,           // Current page name (e.g., "ResumeOptimizer", "JobAnalysis")
    currentTask: null,           // Current task (e.g., "writing_cover_letter", "analyzing_job")
    jobData: null,              // Job being analyzed (for JobAnalysis/JobMatcher)
    resumeData: null,           // Resume being optimized (for ResumeOptimizer)
    questionData: null,         // Current question (for ApplicationQnA)
    skillContext: null,         // Skill being analyzed (for TransferableSkills)
    conversationPhase: null,    // Phase in the workflow (e.g., "initial", "refining", "completed")
    metadata: {}                // Additional context as needed
  });

  /**
   * Update context when user navigates or starts a task
   */
  const updateContext = useCallback((newContext) => {
    setContext(prev => ({
      ...prev,
      ...newContext,
      timestamp: new Date().toISOString()
    }));
  }, []);

  /**
   * Set page context
   */
  const setPageContext = useCallback((page, additionalData = {}) => {
    updateContext({
      currentPage: page,
      ...additionalData
    });
  }, [updateContext]);

  /**
   * Set job analysis context
   */
  const setJobAnalysisContext = useCallback((jobData, phase = "analyzing") => {
    updateContext({
      currentPage: "JobAnalysis",
      currentTask: "analyzing_job",
      jobData,
      conversationPhase: phase,
      metadata: {
        jobTitle: jobData?.job_title,
        company: jobData?.company_name,
        hasDescription: !!jobData?.job_description
      }
    });
  }, [updateContext]);

  /**
   * Set resume optimizer context
   */
  const setResumeOptimizerContext = useCallback((resumeData, section = null, phase = "optimizing") => {
    updateContext({
      currentPage: "ResumeOptimizer",
      currentTask: "optimizing_resume",
      resumeData,
      conversationPhase: phase,
      metadata: {
        resumeTitle: resumeData?.title,
        resumeMode: resumeData?.mode,
        currentSection: section
      }
    });
  }, [updateContext]);

  /**
   * Set cover letter context
   */
  const setCoverLetterContext = useCallback((jobData, resumeData, phase = "writing") => {
    updateContext({
      currentPage: "CoverLetters",
      currentTask: "writing_cover_letter",
      jobData,
      resumeData,
      conversationPhase: phase,
      metadata: {
        company: jobData?.company_name,
        role: jobData?.job_title,
        letterStage: phase
      }
    });
  }, [updateContext]);

  /**
   * Set application Q&A context
   */
  const setApplicationQnAContext = useCallback((questionData, applicationData, phase = "answering") => {
    updateContext({
      currentPage: "ApplicationQnA",
      currentTask: "answering_application_questions",
      questionData,
      metadata: {
        company: applicationData?.company,
        jobTitle: applicationData?.jobTitle,
        questionIndex: questionData?.index,
        totalQuestions: questionData?.total
      }
    });
  }, [updateContext]);

  /**
   * Set transferable skills context
   */
  const setTransferableSkillsContext = useCallback((skillContext, phase = "analyzing") => {
    updateContext({
      currentPage: "TransferableSkills",
      currentTask: "analyzing_skills",
      skillContext,
      conversationPhase: phase,
      metadata: {
        targetRole: skillContext?.targetRole,
        hasResume: !!skillContext?.resumeData
      }
    });
  }, [updateContext]);

  /**
   * Set job matcher context
   */
  const setJobMatcherContext = useCallback((jobData, resumeData, phase = "matching") => {
    updateContext({
      currentPage: "JobMatcher",
      currentTask: "matching_job",
      jobData,
      resumeData,
      conversationPhase: phase,
      metadata: {
        jobTitle: jobData?.job_title,
        company: jobData?.company_name
      }
    });
  }, [updateContext]);

  /**
   * Clear context (when user navigates away)
   */
  const clearContext = useCallback(() => {
    setContext({
      currentPage: null,
      currentTask: null,
      jobData: null,
      resumeData: null,
      questionData: null,
      skillContext: null,
      conversationPhase: null,
      metadata: {}
    });
  }, []);

  /**
   * Get context summary for chatbot prompt
   */
  const getContextSummary = useCallback(() => {
    const { currentPage, currentTask, metadata, conversationPhase } = context;

    if (!currentPage) return "General guidance";

    const summaries = {
      ResumeOptimizer: `User is optimizing their ${metadata?.resumeMode || 'resume'}. Current section: ${metadata?.currentSection || 'general'}. Stage: ${conversationPhase || 'optimizing'}.`,
      JobAnalysis: `User is analyzing a job posting for ${metadata?.jobTitle || 'a role'} at ${metadata?.company || 'a company'}. Stage: ${conversationPhase || 'analyzing'}.`,
      CoverLetters: `User is writing a cover letter for ${metadata?.role || 'a role'} at ${metadata?.company || 'a company'}. Stage: ${conversationPhase || 'writing'}.`,
      ApplicationQnA: `User is answering application questions (Q${metadata?.questionIndex}/${metadata?.totalQuestions}) for ${metadata?.company || 'a position'}. Stage: ${conversationPhase || 'answering'}.`,
      TransferableSkills: `User is analyzing transferable skills for ${metadata?.targetRole || 'a target role'}. Stage: ${conversationPhase || 'analyzing'}.`,
      JobMatcher: `User is matching their resume against a job posting for ${metadata?.jobTitle || 'a role'} at ${metadata?.company || 'a company'}. Stage: ${conversationPhase || 'matching'}.`
    };

    return summaries[currentPage] || "General guidance";
  }, [context]);

  const value = {
    context,
    updateContext,
    setPageContext,
    setJobAnalysisContext,
    setResumeOptimizerContext,
    setCoverLetterContext,
    setApplicationQnAContext,
    setTransferableSkillsContext,
    setJobMatcherContext,
    clearContext,
    getContextSummary
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to use app context
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
}
