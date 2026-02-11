import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { InvokeLLM } from "@/integrations/Core";
import { Inbox, RefreshCcw, Tag, MessageSquare, Sparkles, AlertTriangle } from "lucide-react";

const LOCAL_KEY = "agent-collab-inbox";
const RULES_KEY = "agent-collab-rules";
const NOTIFY_KEY = "agent-collab-notified";

function loadLocalInbox() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    } catch (e) {
        return [];
    }
}

function saveLocalInbox(items) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

function loadRules() {
    try {
        return JSON.parse(localStorage.getItem(RULES_KEY) || "[]");
    } catch (e) {
        return [];
    }
}

function saveRules(rules) {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

function loadNotified() {
    try {
        return new Set(JSON.parse(localStorage.getItem(NOTIFY_KEY) || "[]"));
    } catch (e) {
        return new Set();
    }
}

function saveNotified(set) {
    localStorage.setItem(NOTIFY_KEY, JSON.stringify(Array.from(set)));
}

export default function AgentWorkspace() {
    const [items, setItems] = React.useState([]);
    const [filterAgent, setFilterAgent] = React.useState("all");
    const [filterStatus, setFilterStatus] = React.useState("open");
    const [note, setNote] = React.useState("");
    const [selectedId, setSelectedId] = React.useState("");
    const [error, setError] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [rules, setRules] = React.useState([]);
    const [ruleKeyword, setRuleKeyword] = React.useState("");
    const [ruleAgent, setRuleAgent] = React.useState("kyle");
    const [isRouting, setIsRouting] = React.useState(false);
    const [summarizingId, setSummarizingId] = React.useState("");

    const loadInbox = React.useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const entity = base44.entities?.AgentCollabInbox;
            if (entity) {
                const data = await entity.filter({}, "-created_date", 200);
                setItems(data);
            } else {
                setItems(loadLocalInbox());
            }
        } catch (e) {
            console.error("Failed to load inbox:", e);
            setError("Could not load inbox. Falling back to local cache.");
            setItems(loadLocalInbox());
        }
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        loadInbox();
    }, [loadInbox]);

    React.useEffect(() => {
        setRules(loadRules());
    }, []);

    const notifyHighPriority = React.useCallback(async (data) => {
        const notified = loadNotified();
        const entity = base44.entities?.AgentNotification;
        for (const item of data) {
            if (item.priority !== "high") continue;
            if (notified.has(item.id)) continue;
            const message = `High priority inbox item for ${item.to_agent}: ${item.summary || "New request"}`;
            const payload = {
                id: `note-${Date.now()}-${item.id}`,
                type: "inbox",
                message,
                target_agent: item.to_agent || "",
                created_at: new Date().toISOString(),
                created_by: item.created_by || ""
            };
            try {
                if (entity) {
                    await entity.create(payload);
                } else {
                    const key = "agent-notifications";
                    const existing = JSON.parse(localStorage.getItem(key) || "[]");
                    existing.unshift(payload);
                    localStorage.setItem(key, JSON.stringify(existing));
                }
                notified.add(item.id);
            } catch (e) {
                console.warn("Failed to create notification:", e);
            }
        }
        saveNotified(notified);
    }, []);

    React.useEffect(() => {
        if (items.length) {
            notifyHighPriority(items);
        }
    }, [items, notifyHighPriority]);

    const filteredItems = items.filter((item) => {
        const agentMatch = filterAgent === "all" || item.to_agent === filterAgent;
        const statusMatch = filterStatus === "all" || item.status === filterStatus;
        return agentMatch && statusMatch;
    });

    const markStatus = async (id, status) => {
        try {
            const entity = base44.entities?.AgentCollabInbox;
            if (entity) {
                await entity.update(id, { status });
                await loadInbox();
                return;
            }
            const next = items.map((item) => (item.id === id ? { ...item, status } : item));
            setItems(next);
            saveLocalInbox(next);
        } catch (e) {
            console.error("Failed to update inbox item:", e);
            setError("Could not update inbox status. Try again.");
        }
    };

    const workloadByAgent = React.useMemo(() => {
        const counts = { kyle: 0, simon: 0, cv_assistant: 0 };
        for (const item of items) {
            if (item.status !== "open") continue;
            if (counts[item.to_agent] !== undefined) counts[item.to_agent] += 1;
        }
        return counts;
    }, [items]);

    const inferPriority = (item) => {
        if (item.priority) return item.priority;
        const text = `${item.summary || ""} ${(item.highlights || []).join(" ")}`.toLowerCase();
        if (/urgent|asap|deadline|offer|interview|time-sensitive|today|tomorrow/.test(text)) return "high";
        if (/fyi|optional|low priority|nice to have/.test(text)) return "low";
        return "normal";
    };

    const autoNormalize = React.useCallback(async (data) => {
        const entity = base44.entities?.AgentCollabInbox;
        const next = data.map((item) => ({ ...item }));
        let changed = false;

        // Priority inference
        for (const item of next) {
            const inferred = inferPriority(item);
            if (inferred && inferred !== item.priority) {
                item.priority = inferred;
                changed = true;
                if (entity) {
                    await entity.update(item.id, { priority: inferred });
                }
            }
        }

        // Routing by rules if present
        if (rules.length) {
            for (const item of next) {
                if (item.status !== "open") continue;
                const text = `${item.summary || ""} ${(item.highlights || []).join(" ")}`.toLowerCase();
                let assigned = null;
                for (const rule of rules) {
                    if (!rule.keyword) continue;
                    if (text.includes(rule.keyword.toLowerCase())) {
                        assigned = rule.agent;
                        break;
                    }
                }
                if (assigned && assigned !== item.to_agent) {
                    item.to_agent = assigned;
                    item.routed_by = "auto";
                    changed = true;
                    if (entity) {
                        await entity.update(item.id, { to_agent: assigned, routed_by: "auto" });
                    }
                }
            }
        }

        if (changed && !entity) {
            saveLocalInbox(next);
        }
        if (changed) setItems(next);
    }, [rules]);

    const applyRouting = async () => {
        setIsRouting(true);
        try {
            const entity = base44.entities?.AgentCollabInbox;
            const next = [...items];
            for (const item of next) {
                if (item.status !== "open") continue;
                const text = `${item.summary || ""} ${(item.highlights || []).join(" ")}`.toLowerCase();
                let assigned = null;
                for (const rule of rules) {
                    if (!rule.keyword) continue;
                    if (text.includes(rule.keyword.toLowerCase())) {
                        assigned = rule.agent;
                        break;
                    }
                }
                if (!assigned) {
                    const entries = Object.entries(workloadByAgent);
                    entries.sort((a, b) => a[1] - b[1]);
                    assigned = entries[0]?.[0] || item.to_agent;
                }
                if (assigned && assigned !== item.to_agent) {
                    item.to_agent = assigned;
                    item.routed_by = "auto";
                    if (entity) {
                        await entity.update(item.id, { to_agent: assigned, routed_by: "auto" });
                    }
                }
            }
            if (!entity) saveLocalInbox(next);
            setItems(next);
        } catch (e) {
            console.error("Routing failed:", e);
            setError("Auto-routing failed. Try again.");
        }
        setIsRouting(false);
    };

    const addRule = () => {
        if (!ruleKeyword.trim()) return;
        const next = [...rules, { id: `rule-${Date.now()}`, keyword: ruleKeyword.trim(), agent: ruleAgent }];
        setRules(next);
        saveRules(next);
        setRuleKeyword("");
    };

    const summarizeItem = async (item) => {
        setSummarizingId(item.id);
        try {
            const prompt = `
Summarize this agent handoff into 2-3 bullet points for quick triage.
Include the ask, urgency, and any requested actions.

Summary: ${item.summary || ""}
Highlights: ${(item.highlights || []).join("; ")}
Messages: ${(item.messages || []).map((m) => `${m.role}: ${m.content}`).join(" | ").slice(0, 1200)}
            `;
            const res = await InvokeLLM({ prompt, add_context_from_internet: false });
            const aiSummary = res?.response || res?.content || res?.text || "";
            const entity = base44.entities?.AgentCollabInbox;
            if (entity) {
                await entity.update(item.id, { ai_summary: aiSummary });
                await loadInbox();
            } else {
                const next = items.map((it) => (it.id === item.id ? { ...it, ai_summary: aiSummary } : it));
                setItems(next);
                saveLocalInbox(next);
            }
        } catch (e) {
            console.error("Summarization failed:", e);
            setError("Could not summarize this item.");
        }
        setSummarizingId("");
    };

    const addNote = async () => {
        if (!selectedId || !note.trim()) return;
        try {
            const entity = base44.entities?.AgentCollabInbox;
            if (entity) {
                const current = items.find((item) => item.id === selectedId);
                const notes = current?.notes || [];
                await entity.update(selectedId, {
                    notes: [...notes, { note: note.trim(), created_at: new Date().toISOString() }]
                });
                setNote("");
                await loadInbox();
                return;
            }
            const next = items.map((item) => {
                if (item.id !== selectedId) return item;
                const notes = item.notes || [];
                return { ...item, notes: [...notes, { note: note.trim(), created_at: new Date().toISOString() }] };
            });
            setItems(next);
            saveLocalInbox(next);
            setNote("");
        } catch (e) {
            console.error("Failed to add note:", e);
            setError("Could not add note. Try again.");
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-3">
                            <Inbox className="w-4 h-4" />
                            Agent Collaboration
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Shared Workspace</h1>
                        <p className="text-slate-600">Review tagged conversations, add notes, and coordinate handoffs.</p>
                    </div>
                    <Button onClick={loadInbox} variant="outline" className="gap-2" disabled={isLoading}>
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="w-5 h-5 text-indigo-600" />
                            Routing Rules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2 items-center">
                            <Input
                                value={ruleKeyword}
                                onChange={(e) => setRuleKeyword(e.target.value)}
                                placeholder="Keyword (e.g. interview, salary, tech stack)"
                                className="w-full md:w-64"
                            />
                            <Select value={ruleAgent} onValueChange={setRuleAgent}>
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kyle">Kyle</SelectItem>
                                    <SelectItem value="simon">Simon</SelectItem>
                                    <SelectItem value="cv_assistant">CV Assistant</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={addRule} variant="outline">Add Rule</Button>
                            <Button onClick={applyRouting} disabled={isRouting} className="gap-2">
                                <Sparkles className="w-4 h-4" />
                                {isRouting ? "Routing..." : "Auto-route by Workload"}
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                            {rules.map((rule) => (
                                <span key={rule.id} className="px-2 py-1 rounded-full bg-slate-100">
                                    {rule.keyword} → {rule.agent}
                                </span>
                            ))}
                            {!rules.length && (
                                <span className="text-slate-400">No rules yet. Add keywords to direct routing.</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500">Agent</label>
                                <Select value={filterAgent} onValueChange={setFilterAgent}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="kyle">Kyle</SelectItem>
                                        <SelectItem value="simon">Simon</SelectItem>
                                        <SelectItem value="cv_assistant">CV Assistant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Status</label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="reviewed">Reviewed</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Inbox ({filteredItems.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {filteredItems.length === 0 && (
                                <p className="text-sm text-slate-500">No tagged items yet.</p>
                            )}
                            {filteredItems.map((item) => (
                                <div key={item.id} className="border rounded-lg p-3 bg-white shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-indigo-600" />
                                            <span className="font-semibold text-sm text-slate-800">
                                                {item.from_agent} → {item.to_agent}
                                            </span>
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                {item.status || "open"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => markStatus(item.id, "reviewed")}>Reviewed</Button>
                                            <Button size="sm" variant="outline" onClick={() => markStatus(item.id, "closed")}>Close</Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-2">{item.summary || "No summary provided."}</p>
                                    {item.priority === "high" && (
                                        <div className="flex items-center gap-1 text-xs text-amber-700 mt-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            High priority
                                        </div>
                                    )}
                                    {item.highlights?.length > 0 && (
                                        <ul className="text-xs text-slate-500 list-disc pl-5 mt-2">
                                            {item.highlights.map((h, idx) => (
                                                <li key={idx}>{h}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {item.ai_summary && (
                                        <div className="text-xs text-slate-700 bg-slate-50 border rounded p-2 mt-2">
                                            <span className="font-semibold">AI Summary: </span>
                                            {item.ai_summary}
                                        </div>
                                    )}
                                    <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" />
                                        Conversation: {item.conversation_id || "N/A"}
                                    </div>
                                    {item.notes?.length > 0 && (
                                        <div className="mt-2 text-xs text-slate-600">
                                            <p className="font-medium">Notes:</p>
                                            <ul className="list-disc pl-4">
                                                {item.notes.map((n, idx) => (
                                                    <li key={idx}>{n.note}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <Button
                                        size="sm"
                                        variant={selectedId === item.id ? "default" : "outline"}
                                        className="mt-3"
                                        onClick={() => setSelectedId(item.id)}
                                    >
                                        {selectedId === item.id ? "Selected" : "Add Note"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-3 ml-2"
                                        onClick={() => summarizeItem(item)}
                                        disabled={summarizingId === item.id}
                                    >
                                        {summarizingId === item.id ? "Summarizing..." : "Summarize"}
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Add Collaboration Note</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add guidance, questions, or decisions for the other agent..."
                            className="min-h-[100px]"
                        />
                        <Button onClick={addNote} disabled={!selectedId || !note.trim()}>
                            Save Note
                        </Button>
                        {!selectedId && (
                            <p className="text-xs text-slate-500">Select an inbox item first.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}