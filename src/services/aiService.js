import { InvokeLLM } from '@/api/integrations';
import { resumeAPI, jobAPI, coverLetterAPI, interviewAPI } from '@/api/client';

const USE_BACKEND_AI = import.meta.env.VITE_USE_BACKEND_AI === 'true';

export const aiService = {
    async analyzeResume(resumeData, jobDescription) {
        if (USE_BACKEND_AI) {
            try {
                const response = await resumeAPI.analyze(resumeData, jobDescription);
                return response.data;
            } catch (error) {
                console.warn('Backend AI failed, falling back to Base44:', error);
                return await this.analyzeResumeBase44(resumeData, jobDescription);
            }
        }
        return await this.analyzeResumeBase44(resumeData, jobDescription);
    },

    async analyzeResumeBase44(resumeData, jobDescription) {
        const prompt = `Analyze this resume against the job description and provide insights.

Resume: ${JSON.stringify(resumeData)}
Job Description: ${jobDescription}

Provide analysis in JSON format with:
- strengths: array of strings
- improvements: array of strings
- optimizedBullets: array of strings
- overallScore: number (0-100)`;

        return await InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    improvements: { type: 'array', items: { type: 'string' } },
                    optimizedBullets: { type: 'array', items: { type: 'string' } },
                    overallScore: { type: 'number' }
                }
            }
        });
    },

    async optimizeResume(resumeData, jobDescription, targetRole) {
        if (USE_BACKEND_AI) {
            try {
                const response = await resumeAPI.optimize(resumeData, jobDescription, targetRole);
                return response.data;
            } catch (error) {
                console.warn('Backend AI failed, falling back to Base44:', error);
                return await this.optimizeResumeBase44(resumeData, jobDescription, targetRole);
            }
        }
        return await this.optimizeResumeBase44(resumeData, jobDescription, targetRole);
    },

    async optimizeResumeBase44(resumeData, jobDescription, targetRole) {
        const prompt = `Optimize this resume for the target role.

Resume: ${JSON.stringify(resumeData)}
Job Description: ${jobDescription}
Target Role: ${targetRole}

Provide optimized resume in JSON format with:
- optimizedResume: object with updated resume data
- changes: array of strings describing changes made
- improvementScore: number (0-100)`;

        return await InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    optimizedResume: { type: 'object' },
                    changes: { type: 'array', items: { type: 'string' } },
                    improvementScore: { type: 'number' }
                }
            }
        });
    },

    async analyzeJob(jobDescription, candidateContext = {}) {
        if (USE_BACKEND_AI) {
            try {
                const response = await jobAPI.analyze(jobDescription, candidateContext);
                return response.data;
            } catch (error) {
                console.warn('Backend AI failed, falling back to Base44:', error);
                return await this.analyzeJobBase44(jobDescription, candidateContext);
            }
        }
        return await this.analyzeJobBase44(jobDescription, candidateContext);
    },

    async analyzeJobBase44(jobDescription, candidateContext) {
        const prompt = `Analyze this job posting and provide insights.

Job Description: ${jobDescription}
Candidate Context: ${JSON.stringify(candidateContext)}

Provide analysis in JSON format with:
- hiringIntent: string
- successProfile: object with technicalSkills, softSkills, experience
- mustHaves: array of strings
- niceToHaves: array of strings
- redFlags: array of strings
- kyleBrief: object with focusAreas, talkingPoints, interviewPrep`;

        return await InvokeLLM({
            prompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    hiringIntent: { type: 'string' },
                    successProfile: { type: 'object' },
                    mustHaves: { type: 'array', items: { type: 'string' } },
                    niceToHaves: { type: 'array', items: { type: 'string' } },
                    redFlags: { type: 'array', items: { type: 'string' } },
                    kyleBrief: { type: 'object' }
                }
            }
        });
    },

    async assessFit(resumeData, jobDescription) {
        if (USE_BACKEND_AI) {
            try {
                const response = await jobAPI.assessFit(resumeData, jobDescription);
                return response.data;
            } catch (error) {
                console.warn('Backend AI failed, falling back to Base44:', error);
                return await this.assessFitBase44(resumeData, jobDescription);
            }
        }
        return await this.assessFitBase44(resumeData, jobDescription);
    },

    async assessFitBase44(resumeData, jobDescription) {
        const prompt = `Assess how well this candidate fits the job.

Resume: ${JSON.stringify(resumeData)}
Job Description: ${jobDescription}

Provide assessment in JSON format with:
- overallFit: number (0-100)
- verdict: string
- strengths: array of strings
- gaps: array of strings
- recommendations: array of strings
- interviewLikelihood: string
- competitionLevel: string`;

        return await InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    overallFit: { type: 'number' },
                    verdict: { type: 'string' },
                    strengths: { type: 'array', items: { type: 'string' } },
                    gaps: { type: 'array', items: { type: 'string' } },
                    recommendations: { type: 'array', items: { type: 'string' } },
                    interviewLikelihood: { type: 'string' },
                    competitionLevel: { type: 'string' }
                }
            }
        });
    },

    async generateCoverLetter(resumeData, jobDescription, companyName, additionalContext = {}) {
        if (USE_BACKEND_AI) {
            try {
                const response = await coverLetterAPI.generate(resumeData, jobDescription, companyName, additionalContext);
                return response.data;
            } catch (error) {
                console.warn('Backend AI failed, falling back to Base44:', error);
                return await this.generateCoverLetterBase44(resumeData, jobDescription, companyName, additionalContext);
            }
        }
        return await this.generateCoverLetterBase44(resumeData, jobDescription, companyName, additionalContext);
    },

    async generateCoverLetterBase44(resumeData, jobDescription, companyName, additionalContext) {
        const prompt = `Generate a professional cover letter.

Resume: ${JSON.stringify(resumeData)}
Job Description: ${jobDescription}
Company: ${companyName}
Additional Context: ${JSON.stringify(additionalContext)}

Provide cover letter in JSON format with:
- coverLetter: string (full cover letter text)
- keyPoints: array of strings
- tone: string
- wordCount: number`;

        return await InvokeLLM({
            prompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    coverLetter: { type: 'string' },
                    keyPoints: { type: 'array', items: { type: 'string' } },
                    tone: { type: 'string' },
                    wordCount: { type: 'number' }
                }
            }
        });
    },

    async prepareInterview(resumeData, jobDescription, questionType = 'behavioral') {
        if (USE_BACKEND_AI) {
            try {
                const response = await interviewAPI.prepare(resumeData, jobDescription, questionType);
                return response.data;
            } catch (error) {
                console.warn('Backend AI failed, falling back to Base44:', error);
                return await this.prepareInterviewBase44(resumeData, jobDescription, questionType);
            }
        }
        return await this.prepareInterviewBase44(resumeData, jobDescription, questionType);
    },

    async prepareInterviewBase44(resumeData, jobDescription, questionType) {
        const prompt = `Prepare interview materials for this candidate.

Resume: ${JSON.stringify(resumeData)}
Job Description: ${jobDescription}
Question Type: ${questionType}

Provide interview prep in JSON format with:
- questions: array of objects with question, suggestedAnswer, starFramework, tipsForDelivery
- generalTips: array of strings`;

        return await InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    questions: { type: 'array', items: { type: 'object' } },
                    generalTips: { type: 'array', items: { type: 'string' } }
                }
            }
        });
    },

    async invokeLLM(options) {
        return await InvokeLLM(options);
    }
};

export default aiService;
