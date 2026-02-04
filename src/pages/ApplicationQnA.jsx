import React from "react";
import { base44 } from "@/api/base44Client";
import { JobApplication } from "@/entities/JobApplication";
import { Resume } from "@/entities/Resume";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    MessageCircleQuestion,
    Sparkles,
    Plus,
    Trash2,
    CheckCircle2,
    Loader2,
    Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { retryWithBackoff } from "@/components/utils/retry";
import { logEvent } from "@/components/utils/telemetry";
import AgentChat from "@/components/agents/AgentChat";
import { hasAccess, TIERS } from "@/components/utils/accessControl";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";

export default function QAAssistant() {
    const [jobApplications, setJobApplications] = React.useState([]);
    const [selectedJobId, setSelectedJobId] = React.useState("");
    const [questions, setQuestions] = React.useState([{ question: "", character_limit: "", answer: "" }]);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [error, setError] = React.useState("");
    const [answerStyle, setAnswerStyle] = React.useState("balanced"); // concise | balanced | detailed
    const [resumes, setResumes] = React.useState([]);
    const [currentUser, setCurrentUser] = React.useState(null);

    React.useEffect(() => {
        (async () => {
            const user = await base44.auth.me();
            setCurrentUser(user);
        })();
        loadJobApplications();
    }, []);

    // Feature gate: Application Q&A requires Pro or higher
    if (currentUser && !hasAccess(currentUser, "application_qna")) {
        return (
            <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
                <UpgradePrompt
                    feature="application_qna"
                    currentTier={currentUser.subscription_tier || TIERS.FREE}
                    variant="card"
                />
            </div>
        );
    }

    const loadJobApplications = async () => {
        try {
            const [applications, resumeList] = await Promise.all([
                JobApplication.list("-created_date", 20),
                Resume.list("-created_date", 100)
            ]);
            setJobApplications(applications);
            setResumes(resumeList);
        } catch (error) {
            console.error("Error loading job applications:", error);
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, { question: "", character_limit: "", answer: "" }]);
    };

    const removeQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const updateQuestion = (index, field, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index][field] = value;
        setQuestions(updatedQuestions);
    };

    const generateAnswers = async () => {
        if (!selectedJobId) {
            setError("Please select a job application");
            return;
        }

        const validQuestions = questions.filter(q => q.question.trim());
        if (validQuestions.length === 0) {
            setError("Please add at least one question");
            return;
        }

        setIsGenerating(true);
        setError("");

        try {
            const selectedJob = jobApplications.find(job => job.id === selectedJobId);
            
            // Get the resume to use (optimized version if available, otherwise master)
            const resumeToUse = (() => {
                if (selectedJob.optimized_resume_id) {
                    const optimized = resumes.find(r => r.id === selectedJob.optimized_resume_id);
                    if (optimized) return optimized;
                }
                if (selectedJob.master_resume_id) {
                    const master = resumes.find(r => r.id === selectedJob.master_resume_id);
                    if (master) return master;
                }
                // Fallback to any master resume
                return resumes.find(r => r.is_master_resume);
            })();

            const resumeContent = resumeToUse ? (
                resumeToUse.optimized_content 
                    ? (typeof resumeToUse.optimized_content === 'string' ? resumeToUse.optimized_content : JSON.stringify(resumeToUse.optimized_content))
                    : (typeof resumeToUse.parsed_content === 'string' ? resumeToUse.parsed_content : JSON.stringify(resumeToUse.parsed_content))
            ) : "No resume available";
            
            const styleGuidance = {
                concise: "Be brief and to the point. 2-3 sentences maximum unless the character limit requires more.",
                balanced: "Provide focused, well-structured answers. Use 1-2 short paragraphs with key details.",
                detailed: "Provide comprehensive, thorough answers with specific examples and context."
            };

            const qaPrompt = `
You are helping a job applicant answer application questions. Provide tailored answers based on their ACTUAL resume and the job requirements.

JOB CONTEXT:
- Job Title: ${selectedJob.job_title}
- Company: ${selectedJob.company_name}
- Job Description: ${selectedJob.job_description}
- Key Requirements: ${selectedJob.key_requirements?.join(', ') || 'Not specified'}

CANDIDATE'S RESUME:
${resumeContent}

CRITICAL INSTRUCTIONS:
- Base ALL answers on the candidate's ACTUAL experience from their resume
- Use SPECIFIC examples, achievements, and metrics from their resume
- Never fabricate or exaggerate experience they don't have
- If the question asks about something they haven't done, acknowledge it honestly or pivot to related experience they DO have
- Make answers sound authentically human - avoid robotic patterns and AI buzzwords

ANSWER STYLE: ${styleGuidance[answerStyle]}

QUESTIONS TO ANSWER:
${validQuestions.map((q, i) => `
${i + 1}. "${q.question}"
   ${q.character_limit ? `Character limit: ${q.character_limit} (STRICT - do not exceed)` : 'No character limit'}
`).join('\n')}

INSTRUCTIONS:
- Base answers ONLY on information in their resume - use specific examples and metrics they actually achieved
- Align answers with the job requirements by highlighting relevant experience
- Use STAR method when appropriate (Situation, Task, Action, Result) from their actual work history
- Include specific examples and quantifiable achievements FROM THEIR RESUME
- Use keywords from the job description naturally, but only where they match real experience
- Respect character limits strictly
- Be authentic and professional - sound like a real person, not a marketing brochure
- Make each answer unique to its question
- If they lack experience in a specific area, either acknowledge it professionally or pivot to the closest related experience they DO have

**Anti-AI Writing Rules:**
- Avoid: "leveraged," "spearheaded," "facilitated," "championed," "drove," "utilized"
- Use concrete action verbs: "Built," "Created," "Led," "Reduced," "Improved," "Designed"
- Sound conversational and genuine, not robotic
- Include natural imperfections and varied sentence structure

Return one focused answer per question grounded in their actual resume.
            `;

            const response = await retryWithBackoff(() => InvokeLLM({
                prompt: qaPrompt,
                add_context_from_internet: false,
                response_json_schema: {
                    type: "object",
                    properties: {
                        answers: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    question_number: { type: "number" },
                                    answer: { type: "string" },
                                    character_count: { type: "number" },
                                    tip: { type: "string" }
                                }
                            }
                        }
                    }
                }
            }), { retries: 3, baseDelay: 1200 });

            // Update questions with generated answers
            const updatedQuestions = [...questions];
            response.answers.forEach((generatedAnswer, index) => {
                if (updatedQuestions[index] && updatedQuestions[index].question.trim()) {
                    updatedQuestions[index].answer = generatedAnswer.answer;
                    updatedQuestions[index].optimization_tips = generatedAnswer.tip;
                }
            });
            setQuestions(updatedQuestions);

            // Save to job application
            await JobApplication.update(selectedJobId, {
                application_questions: validQuestions.map((q, i) => ({
                    question: q.question,
                    answer: response.answers[i]?.answer || "",
                    character_limit: q.character_limit ? parseInt(q.character_limit) : null
                }))
            });

            try {
                await logEvent({ 
                    type: "application_qna_used", 
                    ts: new Date().toISOString(), 
                    app_id: selectedJobId,
                    style: answerStyle
                });
            } catch (telemetryError) {
                console.error("Failed to log telemetry event:", telemetryError);
            }
        } catch (error) {
            setError("Failed to generate answers. Please try again in a moment.");
            console.error("Answer generation error:", error);
        }

        setIsGenerating(false);
    };

    const copyAnswer = (answer) => {
        navigator.clipboard.writeText(answer);
    };

    const getCharacterCountColor = (current, limit) => {
        if (!limit) return "text-slate-500";
        const percentage = current / limit;
        if (percentage > 1) return "text-red-600";
        if (percentage > 0.9) return "text-yellow-600";
        return "text-green-600";
    };

    const selectedJobData = selectedJobId ? jobApplications.find(job => job.id === selectedJobId) : null;

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium mb-4">
                        <MessageCircleQuestion className="w-4 h-4" />
                        AI Q&A Assistant
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                        Application <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Question Assistant</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Get AI-powered help with job application questions, tailored responses within character limits, and optimization tips
                    </p>
                </motion.div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    {/* Job Selection */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Select Job Application</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose the job you're applying for..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobApplications.map((job) => (
                                        <SelectItem key={job.id} value={job.id}>
                                            {job.job_title} at {job.company_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedJobData && (
                                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <h3 className="font-semibold text-orange-800 mb-2">Selected Position</h3>
                                    <p className="text-orange-700">{selectedJobData.job_title} at {selectedJobData.company_name}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Answer Style Selection */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Answer Style</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3">
                                <Button
                                    variant={answerStyle === "concise" ? "default" : "outline"}
                                    onClick={() => setAnswerStyle("concise")}
                                    className="flex-1"
                                >
                                    Concise
                                </Button>
                                <Button
                                    variant={answerStyle === "balanced" ? "default" : "outline"}
                                    onClick={() => setAnswerStyle("balanced")}
                                    className="flex-1"
                                >
                                    Balanced
                                </Button>
                                <Button
                                    variant={answerStyle === "detailed" ? "default" : "outline"}
                                    onClick={() => setAnswerStyle("detailed")}
                                    className="flex-1"
                                >
                                    Detailed
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                {answerStyle === "concise" && "Brief, direct answers (2-3 sentences)"}
                                {answerStyle === "balanced" && "Well-structured answers with key details (recommended)"}
                                {answerStyle === "detailed" && "Comprehensive answers with examples"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Questions Section */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Application Questions</CardTitle>
                                <Button onClick={addQuestion} variant="outline" size="sm" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Add Question
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <AnimatePresence>
                                {questions.map((q, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="p-4 border border-slate-200 rounded-lg space-y-4"
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 space-y-4">
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-2">
                                                        <Label htmlFor={`question-${index}`}>Question {index + 1}</Label>
                                                        <Input
                                                            id={`question-${index}`}
                                                            placeholder="Enter the application question..."
                                                            value={q.question}
                                                            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`limit-${index}`}>Character Limit (Optional)</Label>
                                                        <Input
                                                            id={`limit-${index}`}
                                                            type="number"
                                                            placeholder="e.g. 500"
                                                            value={q.character_limit}
                                                            onChange={(e) => updateQuestion(index, 'character_limit', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <Label htmlFor={`answer-${index}`}>AI-Generated Answer</Label>
                                                        {q.answer && (
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs ${getCharacterCountColor(q.answer.length, q.character_limit)}`}>
                                                                    {q.answer.length}{q.character_limit ? `/${q.character_limit}` : ''} characters
                                                                </span>
                                                                <Button
                                                                    onClick={() => copyAnswer(q.answer)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="gap-1 h-6 px-2"
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                    Copy
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Textarea
                                                        id={`answer-${index}`}
                                                        placeholder="AI-generated answer will appear here..."
                                                        value={q.answer}
                                                        onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                                                        className="min-h-32 resize-y"
                                                    />
                                                    {q.optimization_tips && (
                                                        <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                                                            <p className="text-sm text-blue-800">
                                                                <span className="font-semibold">💡 Tip:</span> {q.optimization_tips}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {questions.length > 1 && (
                                                <Button
                                                    onClick={() => removeQuestion(index)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            
                            <Button 
                                onClick={generateAnswers}
                                disabled={!selectedJobId || isGenerating || questions.every(q => !q.question.trim())}
                                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-12"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Generating Answers...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Generate All Answers ({answerStyle})
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Tips Card */}
                    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Best Practices
                            </h3>
                            <ul className="space-y-2 text-sm text-blue-700">
                                <li>• Choose your preferred answer style (concise, balanced, or detailed)</li>
                                <li>• Use the STAR method: Situation, Task, Action, Result</li>
                                <li>• Include specific, quantifiable achievements when possible</li>
                                <li>• Tailor your answers to match the job requirements</li>
                                <li>• Stay within character limits while being comprehensive</li>
                                <li>• Review and personalize AI-generated content before submitting</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Kyle AI Agent Chat */}
            <AgentChat
                agentName="kyle"
                agentTitle="Kyle - CV Expert"
                context={{
                    selectedJob: selectedJobId ? jobApplications.find(job => job.id === selectedJobId)?.job_title : "",
                    answerStyle: answerStyle,
                    questionsCount: questions.length,
                    hasAnswers: questions.some(q => q.answer)
                }}
            />
        </div>
    );
}