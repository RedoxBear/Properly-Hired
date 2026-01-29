import { useState, useCallback } from 'react';
import { resumeAPI, jobAPI, coverLetterAPI, interviewAPI } from '@/api/client';

export function useBackendAI() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeResume = useCallback(async (resumeData, jobDescription) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await resumeAPI.analyze(resumeData, jobDescription);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to analyze resume');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const optimizeResume = useCallback(async (resumeData, jobDescription, targetRole) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await resumeAPI.optimize(resumeData, jobDescription, targetRole);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to optimize resume');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const analyzeJob = useCallback(async (jobDescription, candidateContext = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await jobAPI.analyze(jobDescription, candidateContext);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to analyze job');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const assessFit = useCallback(async (resumeData, jobDescription) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await jobAPI.assessFit(resumeData, jobDescription);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to assess fit');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const generateCoverLetter = useCallback(async (resumeData, jobDescription, companyName, additionalContext = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await coverLetterAPI.generate(resumeData, jobDescription, companyName, additionalContext);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to generate cover letter');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const prepareInterview = useCallback(async (resumeData, jobDescription, questionType = 'behavioral') => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await interviewAPI.prepare(resumeData, jobDescription, questionType);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to prepare interview');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        analyzeResume,
        optimizeResume,
        analyzeJob,
        assessFit,
        generateCoverLetter,
        prepareInterview
    };
}

export default useBackendAI;
