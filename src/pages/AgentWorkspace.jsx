import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Inbox, RefreshCcw, Tag, MessageSquare } from "lucide-react";

const LOCAL_KEY = "agent-collab-inbox";

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

export default function AgentWorkspace() {
    const [items, setItems] = React.useState([]);
    const [filterAgent, setFilterAgent] = React.useState("all");
    const [filterStatus, setFilterStatus] = React.useState("open");
    const [note, setNote] = React.useState("");
    const [selectedId, setSelectedId] = React.useState("");
    const [error, setError] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

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
                                    {item.highlights?.length > 0 && (
                                        <ul className="text-xs text-slate-500 list-disc pl-5 mt-2">
                                            {item.highlights.map((h, idx) => (
                                                <li key={idx}>{h}</li>
                                            ))}
                                        </ul>
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
