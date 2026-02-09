import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, Brain, ShieldCheck, FileText, Save, Sparkles } from "lucide-react";

const DOC_KEY = "agent-training-docs";
const CONFIG_KEY = "agent-training-config";
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
            if (docEntity && configEntity) {
                const [docData, configData] = await Promise.all([
                    docEntity.filter({}, "-created_date", 200),
                    configEntity.filter({}, "-created_date", 200)
                ]);
                setDocuments(docData || []);
                setConfigs(configData || []);
                return;
            }
            setDocuments(loadLocal(DOC_KEY));
            setConfigs(loadLocal(CONFIG_KEY));
        } catch (e) {
            console.error("Failed to load training data:", e);
            setError("Could not load training data. Using local cache.");
            setDocuments(loadLocal(DOC_KEY));
            setConfigs(loadLocal(CONFIG_KEY));
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
            </div>
        </div>
    );
}
