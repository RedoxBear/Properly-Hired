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
import { hasAccess, TIERS } from "@/components/utils/accessControl";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";

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
    const [currentUser, setCurrentUser] = React.useState(null);
    const [isAccessLoading, setIsAccessLoading] = React.useState(true);

    React.useEffect(() => {
        (async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
            } catch (e) {
                setCurrentUser(null);
            } finally {
                setIsAccessLoading(false);
            }
        })();
    }, []);

    const isProOrAbove = currentUser && currentUser.subscription_tier && currentUser.subscription_tier !== TIERS.FREE;

    const validatePublicUrl = (raw) => {
        try {
            const parsed = new URL(raw);
            if (!["http:", "https:"].includes(parsed.protocol)) return "Only http/https URLs are allowed.";
            const host = parsed.hostname.toLowerCase();
            if (host === "localhost" || host === "127.0.0.1") return "Localhost links are not allowed.";
            if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\\d|3[0-1])\\./.test(host)) {
                return "Private network links are not allowed.";
            }
            if (parsed.protocol === "file:") return "File links are not allowed.";
            return null;
        } catch (e) {
            return "Invalid URL format.";
        }
    };

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
        if (!isProOrAbove) {
            setError("Pro plan required to add external resources.");
            return;
        }
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
        const urlError = validatePublicUrl(url.trim());
        if (urlError) {
            setError(urlError);
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
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-3">
                        <BookOpen className="w-4 h-4" />
                        External Knowledge
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">External Resources</h1>
                    <p className="text-muted-foreground">Link documentation, policies, or references for agents (Kyle, Simon, CV Assistant) to suggest during chat.</p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {!isAccessLoading && !isProOrAbove && (
                    <UpgradePrompt
                        feature="external_resources"
                        currentTier={currentUser?.subscription_tier || TIERS.FREE}
                    />
                )}

                <Card className={!isProOrAbove ? "opacity-50 pointer-events-none" : ""}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-blue-600" />
                            Add Resource
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                        <div>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (max 120 chars)" maxLength={120} />
                            <p className="text-xs text-muted-foreground mt-1">{title.length}/120</p>
                        </div>
                        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." maxLength={300} />
                        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated, max 10)" />
                        <Select value={audience} onValueChange={setAudience}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Agents</SelectItem>
                                <SelectItem value="kyle">Kyle only</SelectItem>
                                <SelectItem value="simon">Simon only</SelectItem>
                                <SelectItem value="cv_assistant">CV Assistant only</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="md:col-span-2">
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe when agents should reference this resource (max 400 chars)"
                                maxLength={400}
                            />
                            <p className="text-xs text-muted-foreground mt-1">{description.length}/400</p>
                            <p className="text-xs text-muted-foreground mt-1">Public links only. No private files or internal network URLs.</p>
                        </div>
                        <div className="md:col-span-2">
                            <Button onClick={addResource} disabled={saving} className="gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {saving ? "Saving..." : "Add Resource"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <CardTitle>Saved Resources ({resources.length})</CardTitle>
                        <Button variant="outline" size="sm" onClick={loadResources} disabled={loading} className="gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {loading && resources.length === 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                            </div>
                        )}
                        {!loading && resources.length === 0 && (
                            <p className="text-sm text-muted-foreground">No resources yet. Add one above to get started.</p>
                        )}
                        {resources.map((item) => (
                            <div key={item.id} className="border rounded-lg p-3 bg-card">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-foreground">{item.title}</span>
                                        <Badge variant="outline" className="capitalize">{item.audience || "all"}</Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => deleteResource(item.id)}
                                        title="Delete resource"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 break-all hover:underline">{item.url}</a>
                                {item.description && <p className="text-sm text-muted-foreground mt-2">{item.description}</p>}
                                {item.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {item.tags.map((tag, idx) => (
                                            <Badge key={`${item.id}-${idx}`} variant="secondary" className="text-xs">{tag}</Badge>
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
