import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link2, Plus, RefreshCcw, BookOpen, Trash2, Loader2 } from "lucide-react";

export default function ExternalResources() {
    const [resources, setResources] = React.useState([]);
    const [title, setTitle] = React.useState("");
    const [url, setUrl] = React.useState("");
    const [tags, setTags] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [audience, setAudience] = React.useState("all");
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);

    const loadResources = React.useCallback(async () => {
        setError("");
        setLoading(true);
        try {
            const data = await base44.entities.AgentExternalResource.filter({}, "-created_date", 200);
            setResources(data);
        } catch (e) {
            console.error("Failed to load resources:", e);
            setError("Could not load resources.");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadResources();
    }, [loadResources]);

    const addResource = async () => {
        if (!title.trim() || !url.trim()) {
            setError("Title and URL are required.");
            return;
        }
        if (title.trim().length > 120) {
            setError("Title must be 120 characters or less.");
            return;
        }
        if (url.trim().length > 300) {
            setError("URL must be 300 characters or less.");
            return;
        }
        const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10);
        if (tagList.some(t => t.length > 24)) {
            setError("Each tag must be 24 characters or less.");
            return;
        }
        if (description.trim().length > 400) {
            setError("Description must be 400 characters or less.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            await base44.entities.AgentExternalResource.create({
                title: title.trim(),
                url: url.trim(),
                tags: tagList,
                description: description.trim(),
                audience,
            });
            setTitle("");
            setUrl("");
            setTags("");
            setDescription("");
            setAudience("all");
            await loadResources();
        } catch (e) {
            console.error("Failed to add resource:", e);
            setError("Could not add resource. Try again.");
        } finally {
            setSaving(false);
        }
    };

    const deleteResource = async (id) => {
        try {
            await base44.entities.AgentExternalResource.delete(id);
            setResources((prev) => prev.filter((r) => r.id !== id));
        } catch (e) {
            console.error("Failed to delete resource:", e);
            setError("Could not delete resource.");
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-3">
                        <BookOpen className="w-4 h-4" />
                        External Knowledge
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">External Resources</h1>
                    <p className="text-slate-600">Link documentation, policies, or references for agents to use.</p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-blue-600" />
                            Add Resource
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
                        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
                        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" />
                        <Select value={audience} onValueChange={setAudience}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Agents</SelectItem>
                                <SelectItem value="kyle">Kyle</SelectItem>
                                <SelectItem value="simon">Simon</SelectItem>
                                <SelectItem value="cv_assistant">CV Assistant</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe when to use this resource"
                            className="md:col-span-2"
                        />
                        <div className="md:col-span-2">
                            <Button onClick={addResource} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Resource
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <CardTitle>Saved Resources</CardTitle>
                        <Button variant="outline" size="sm" onClick={loadResources} className="gap-2">
                            <RefreshCcw className="w-4 h-4" />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {resources.length === 0 && (
                            <p className="text-sm text-slate-500">No resources yet.</p>
                        )}
                        {resources.map((item) => (
                            <div key={item.id} className="border rounded-lg p-3 bg-white">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-slate-800">{item.title}</span>
                                    <Badge variant="outline">{item.audience || "all"}</Badge>
                                </div>
                                <p className="text-xs text-slate-500 break-all">{item.url}</p>
                                {item.description && <p className="text-sm text-slate-600 mt-2">{item.description}</p>}
                                {item.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {item.tags.map((tag, idx) => (
                                            <Badge key={`${item.id}-${idx}`} variant="secondary">{tag}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}