import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/integrations/Core";
import { readEvents } from "@/components/utils/telemetry";
import { UploadCloud, Brain, ShieldCheck, FileText, Save, Sparkles, HelpCircle, Wand2 } from "lucide-react";

const DOC_KEY = "agent-training-docs";
const CONFIG_KEY = "agent-training-config";
const QUIZ_KEY = "agent-training-quizzes";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const loadLocal = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (e) {
        return [];
    }
};

const saveLocal = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export default function AgentTraining() {
    const [agent, setAgent] = React.useState("kyle");
    const [documents, setDocuments] = React.useState([]);
    const [configs, setConfigs] = React.useState([]);
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isQuizGenerating, setIsQuizGenerating] = React.useState(false);
    const [isFeedbackSyncing, setIsFeedbackSyncing] = React.useState(false);
    const [quizzes, setQuizzes] = React.useState([]);
    const [isAutoDocFromConvo, setIsAutoDocFromConvo] = React.useState(false);
    const [isAutoDocFromDocs, setIsAutoDocFromDocs] = React.useState(false);

    const [useCase, setUseCase] = React.useState("");
    const [behavior, setBehavior] = React.useState("");
    const [doList, setDoList] = React.useState("");
    const [dontList, setDontList] = React.useState("");
    const [companyContext, setCompanyContext] = React.useState("");

    const loadData = React.useCallback(async () => {
        setError("");
        try {
            const docEntity = base44.entities?.AgentTrainingDoc;
            const configEntity = base44.entities?.AgentTrainingConfig;
            const quizEntity = base44.entities?.AgentTrainingQuiz;
            if (docEntity && configEntity) {
                const [docData, configData, quizData] = await Promise.all([
                    docEntity.filter({}, "-created_date", 200),
                    configEntity.filter({}, "-created_date", 200),
                    quizEntity ? quizEntity.filter({}, "-created_date", 200) : Promise.resolve([])
                ]);
                setDocuments(docData || []);
                setConfigs(configData || []);
                setQuizzes(quizData || []);
                return;
            }
            setDocuments(loadLocal(DOC_KEY));
            setConfigs(loadLocal(CONFIG_KEY));
            setQuizzes(loadLocal(QUIZ_KEY));
        } catch (e) {
            console.error("Failed to load training data:", e);
            setError("Could not load training data. Using local cache.");
            setDocuments(loadLocal(DOC_KEY));
            setConfigs(loadLocal(CONFIG_KEY));
            setQuizzes(loadLocal(QUIZ_KEY));
        }
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setError("");
        setSuccess("");

        if (file.size > MAX_FILE_SIZE) {
            setError("File too large. Please keep files under 2MB.");
            return;
        }

        const readText = () => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => resolve("");
            reader.readAsText(file);
        });

        const text = file.type.startsWith("text/") ? await readText() : "";
        const payload = {
            id: `doc-${Date.now()}`,
            agent,
            title: file.name,
            mime_type: file.type,
            size: file.size,
            extracted_text: text,
            created_at: new Date().toISOString()
        };

        try {
            const entity = base44.entities?.AgentTrainingDoc;
            if (entity) {
                await entity.create(payload);
                setSuccess("Document uploaded for training review.");
                await loadData();
                return;
            }
            const next = [payload, ...documents];
            setDocuments(next);
            saveLocal(DOC_KEY, next);
            setSuccess("Document uploaded locally. Connect Base44 entity to persist.");
        } catch (e) {
            console.error("Upload failed:", e);
            setError("Upload failed. Please try again.");
        }
    };

    const saveConfig = async () => {
        setIsSaving(true);
        setError("");
        setSuccess("");

        const payload = {
            id: `cfg-${Date.now()}`,
            agent,
            use_case: useCase,
            desired_behavior: behavior,
            do_list: doList.split("\n").map((line) => line.trim()).filter(Boolean),
            dont_list: dontList.split("\n").map((line) => line.trim()).filter(Boolean),
            company_context: companyContext,
            created_at: new Date().toISOString()
        };

        try {
            const entity = base44.entities?.AgentTrainingConfig;
            if (entity) {
                await entity.create(payload);
                setSuccess("Training configuration saved.");
                await loadData();
            } else {
                const next = [payload, ...configs];
                setConfigs(next);
                saveLocal(CONFIG_KEY, next);
                setSuccess("Training configuration saved locally.");
            }

            setUseCase("");
            setBehavior("");
            setDoList("");
            setDontList("");
            setCompanyContext("");
        } catch (e) {
            console.error("Failed to save config:", e);
            setError("Could not save training configuration.");
        }

        setIsSaving(false);
    };

    const generateDocFromLogs = async () => {
        setIsGenerating(true);
        setError("");
        setSuccess("");
        try {
            const events = await readEvents();
            const relevant = events.filter((ev) => ev.type && String(ev.type).includes("agent"));
            const prompt = `
You are creating an internal training memo for agent: ${agent}.
Summarize recurring user needs, failure patterns, and high-value behaviors.
Return JSON with: title, summary (<= 280 chars), tags (3-6), doc (200-400 words).

Behavior logs:
${JSON.stringify(relevant.slice(-120))}
            `;
            const res = await InvokeLLM({
                prompt,
                add_context_from_internet: false,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        summary: { type: "string" },
                        tags: { type: "array", items: { type: "string" } },
                        doc: { type: "string" }
                    },
                    required: ["title", "summary", "tags", "doc"]
                }
            });
            const content = res?.doc || "";
            const payload = {
                id: `doc-${Date.now()}`,
                agent,
                title: res?.title || `Auto Training Memo (${new Date().toLocaleDateString()})`,
                doc_type: "auto-generated",
                extracted_text: content,
                summary: res?.summary || content.slice(0, 280),
                tags: res?.tags || [],
                created_at: new Date().toISOString()
            };
            const entity = base44.entities?.AgentTrainingDoc;
            if (entity) {
                await entity.create(payload);
                await loadData();
            } else {
                const next = [payload, ...documents];
                setDocuments(next);
                saveLocal(DOC_KEY, next);
            }
            setSuccess("Auto-generated training memo created from behavior logs.");
        } catch (e) {
            console.error("Auto-doc failed:", e);
            setError("Could not generate training memo from logs.");
        }
        setIsGenerating(false);
    };

    const generateDocFromConversations = async () => {
        setIsAutoDocFromConvo(true);
        setError("");
        setSuccess("");
        try {
            const convKey = "agent-search-index";
            const conv = loadLocal(convKey).filter((item) => item.type === "conversation");
            const sample = conv.slice(0, 20);
            const prompt = `
Create an AgentTrainingDoc for ${agent} based on recent conversation summaries.
Identify key recurring needs and best responses. Return JSON with: title, summary (<= 280 chars), tags (3-6), doc (200-400 words).

Conversations:
${JSON.stringify(sample)}
            `;
            const res = await InvokeLLM({
                prompt,
                add_context_from_internet: false,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        summary: { type: "string" },
                        tags: { type: "array", items: { type: "string" } },
                        doc: { type: "string" }
                    },
                    required: ["title", "summary", "tags", "doc"]
                }
            });
            const payload = {
                id: `doc-${Date.now()}`,
                agent,
                title: res?.title || `Conversation Memo (${new Date().toLocaleDateString()})`,
                doc_type: "auto-conversations",
                extracted_text: res?.doc || "",
                summary: res?.summary || "",
                tags: res?.tags || [],
                created_at: new Date().toISOString()
            };
            const entity = base44.entities?.AgentTrainingDoc;
            if (entity) {
                await entity.create(payload);
                await loadData();
            } else {
                const next = [payload, ...documents];
                setDocuments(next);
                saveLocal(DOC_KEY, next);
            }
            setSuccess("Generated training doc from conversations.");
        } catch (e) {
            console.error("Conversation auto-doc failed:", e);
            setError("Could not generate from conversations.");
        }
        setIsAutoDocFromConvo(false);
    };

    const generateDocFromExistingDocs = async () => {
        setIsAutoDocFromDocs(true);
        setError("");
        setSuccess("");
        try {
            const docSet = documents.filter((d) => d.agent === agent).slice(0, 10);
            if (!docSet.length) {
                setError("No existing docs to summarize.");
                setIsAutoDocFromDocs(false);
                return;
            }
            const prompt = `
Summarize these internal documents into a unified training doc for ${agent}.
Return JSON with: title, summary (<= 280 chars), tags (3-6), doc (200-400 words).

Docs:
${JSON.stringify(docSet.map((d) => ({ title: d.title, summary: d.summary, extracted_text: d.extracted_text })).slice(0, 6))}
            `;
            const res = await InvokeLLM({
                prompt,
                add_context_from_internet: false,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        summary: { type: "string" },
                        tags: { type: "array", items: { type: "string" } },
                        doc: { type: "string" }
                    },
                    required: ["title", "summary", "tags", "doc"]
                }
            });
            const payload = {
                id: `doc-${Date.now()}`,
                agent,
                title: res?.title || `Unified Training Doc (${new Date().toLocaleDateString()})`,
                doc_type: "auto-docs",
                extracted_text: res?.doc || "",
                summary: res?.summary || "",
                tags: res?.tags || [],
                created_at: new Date().toISOString()
            };
            const entity = base44.entities?.AgentTrainingDoc;
            if (entity) {
                await entity.create(payload);
                await loadData();
            } else {
                const next = [payload, ...documents];
                setDocuments(next);
                saveLocal(DOC_KEY, next);
            }
            setSuccess("Generated training doc from existing docs.");
        } catch (e) {
            console.error("Doc merge failed:", e);
            setError("Could not generate from existing docs.");
        }
        setIsAutoDocFromDocs(false);
    };

    const generateQuiz = async () => {
        if (!documents.length) {
            setError("Upload or generate a training document first.");
            return;
        }
        setIsQuizGenerating(true);
        setError("");
        setSuccess("");
        try {
            const doc = documents.find((d) => d.agent === agent) || documents[0];
            const prompt = `
Create a short quiz (5 questions) for agent: ${agent}.
Questions should validate understanding of this training doc.
Return JSON with fields: title, questions (array with question + 3 options + correct_index).

Doc:
${doc.extracted_text || doc.summary || ""}
            `;
            const res = await InvokeLLM({
                prompt,
                add_context_from_internet: false,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        questions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    question: { type: "string" },
                                    options: { type: "array", items: { type: "string" } },
                                    correct_index: { type: "number" }
                                },
                                required: ["question", "options", "correct_index"]
                            }
                        }
                    },
                    required: ["title", "questions"]
                }
            });
            const payload = {
                id: `quiz-${Date.now()}`,
                agent,
                title: res?.title || `Quiz for ${doc.title || "Training Doc"}`,
                questions: JSON.stringify(res?.questions || []),
                source_doc_id: doc.id,
                created_at: new Date().toISOString()
            };
            const entity = base44.entities?.AgentTrainingQuiz;
            if (entity) {
                await entity.create(payload);
                await loadData();
            } else {
                const next = [payload, ...quizzes];
                setQuizzes(next);
                saveLocal(QUIZ_KEY, next);
            }
            setSuccess("Quiz generated from training doc.");
        } catch (e) {
            console.error("Quiz generation failed:", e);
            setError("Could not generate quiz.");
        }
        setIsQuizGenerating(false);
    };

    const syncFeedbackToConfig = async () => {
        setIsFeedbackSyncing(true);
        setError("");
        setSuccess("");
        try {
            const feedbackEntity = base44.entities?.AgentFeedback;
            const feedback = feedbackEntity
                ? await feedbackEntity.filter({ agent_name: agent }, "-created_date", 200)
                : loadLocal("agent-feedback-store").filter((f) => f.agent_name === agent);

            const prompt = `
You are an agent trainer. Use this feedback to update training behavior.
Provide a concise behavior summary, a do list, and a don't list.

Feedback:
${JSON.stringify(feedback.slice(0, 120))}
            `;
            const res = await InvokeLLM({
                prompt,
                add_context_from_internet: false,
                response_json_schema: {
                    type: "object",
                    properties: {
                        behavior_summary: { type: "string" },
                        do_list: { type: "array", items: { type: "string" } },
                        dont_list: { type: "array", items: { type: "string" } }
                    },
                    required: ["behavior_summary", "do_list", "dont_list"]
                }
            });

            const payload = {
                id: `cfg-${Date.now()}`,
                agent,
                use_case: "Feedback-driven refinement",
                desired_behavior: res?.behavior_summary || "",
                feedback_summary: res?.behavior_summary || "",
                do_list: res?.do_list || [],
                dont_list: res?.dont_list || [],
                created_at: new Date().toISOString()
            };

            const entity = base44.entities?.AgentTrainingConfig;
            if (entity) {
                await entity.create(payload);
                await loadData();
            } else {
                const next = [payload, ...configs];
                setConfigs(next);
                saveLocal(CONFIG_KEY, next);
            }
            setSuccess("Training configuration updated from feedback.");
        } catch (e) {
            console.error("Feedback sync failed:", e);
            setError("Could not update config from feedback.");
        }
        setIsFeedbackSyncing(false);
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-3">
                        <Brain className="w-4 h-4" />
                        Agent Training
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Training Center</h1>
                    <p className="text-slate-600">Upload knowledge, configure behavior, and fine-tune agent responses.</p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="border-green-200 bg-green-50">
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-purple-600" />
                            Select Agent
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={agent} onValueChange={setAgent}>
                            <SelectTrigger className="w-full md:w-64">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="kyle">Kyle</SelectItem>
                                <SelectItem value="simon">Simon</SelectItem>
                                <SelectItem value="cv_assistant">CV Assistant</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-blue-600" />
                                Upload Knowledge
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Input type="file" onChange={handleUpload} />
                            <p className="text-xs text-slate-500">Supports text files (PDF parsing not enabled yet). Max 2MB.</p>
                            <div className="space-y-2">
                                {documents.filter((d) => d.agent === agent).slice(0, 5).map((doc) => (
                                    <div key={doc.id} className="border rounded-lg p-2 bg-white">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm font-medium text-slate-700">{doc.title}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">{doc.mime_type || "unknown"} · {(doc.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={generateDocFromLogs} disabled={isGenerating} variant="outline" className="gap-2">
                                    <Wand2 className="w-4 h-4" />
                                    {isGenerating ? "Generating..." : "Auto-Generate from Logs"}
                                </Button>
                                <Button onClick={generateDocFromConversations} disabled={isAutoDocFromConvo} variant="outline" className="gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    {isAutoDocFromConvo ? "Generating..." : "From Conversations"}
                                </Button>
                                <Button onClick={generateDocFromExistingDocs} disabled={isAutoDocFromDocs} variant="outline" className="gap-2">
                                    <FileText className="w-4 h-4" />
                                    {isAutoDocFromDocs ? "Generating..." : "From Existing Docs"}
                                </Button>
                                <Button onClick={generateQuiz} disabled={isQuizGenerating} variant="outline" className="gap-2">
                                    <HelpCircle className="w-4 h-4" />
                                    {isQuizGenerating ? "Building Quiz..." : "Generate Quiz"}
                                </Button>
                                <Button onClick={syncFeedbackToConfig} disabled={isFeedbackSyncing} variant="outline" className="gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    {isFeedbackSyncing ? "Syncing..." : "Update from Feedback"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-600" />
                                Configure Behavior
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Input
                                value={useCase}
                                onChange={(e) => setUseCase(e.target.value)}
                                placeholder="Use case (e.g. B2B SaaS resume optimization)"
                            />
                            <Textarea
                                value={behavior}
                                onChange={(e) => setBehavior(e.target.value)}
                                placeholder="Desired behavior and tone"
                                className="min-h-[80px]"
                            />
                            <Textarea
                                value={doList}
                                onChange={(e) => setDoList(e.target.value)}
                                placeholder="Do list (one per line)"
                            />
                            <Textarea
                                value={dontList}
                                onChange={(e) => setDontList(e.target.value)}
                                placeholder="Don't list (one per line)"
                            />
                            <Textarea
                                value={companyContext}
                                onChange={(e) => setCompanyContext(e.target.value)}
                                placeholder="Company knowledge / internal context"
                            />
                            <Button onClick={saveConfig} disabled={isSaving} className="gap-2">
                                <Save className="w-4 h-4" />
                                Save Configuration
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Training Configurations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {configs.filter((c) => c.agent === agent).slice(0, 5).map((cfg) => (
                            <div key={cfg.id} className="border rounded-lg p-3 bg-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">{cfg.agent}</Badge>
                                    <span className="text-sm font-semibold text-slate-700">{cfg.use_case || "Untitled"}</span>
                                </div>
                                <p className="text-xs text-slate-600">{cfg.desired_behavior || "No description"}</p>
                            </div>
                        ))}
                        {configs.filter((c) => c.agent === agent).length === 0 && (
                            <p className="text-sm text-slate-500">No training configurations yet.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Quizzes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {quizzes.filter((q) => q.agent === agent).slice(0, 5).map((quiz) => (
                            <div key={quiz.id} className="border rounded-lg p-3 bg-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">{quiz.agent}</Badge>
                                    <span className="text-sm font-semibold text-slate-700">{quiz.title || "Quiz"}</span>
                                </div>
                                <p className="text-xs text-slate-600">Questions: {JSON.parse(quiz.questions || "[]").length}</p>
                            </div>
                        ))}
                        {quizzes.filter((q) => q.agent === agent).length === 0 && (
                            <p className="text-sm text-slate-500">No quizzes generated yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
