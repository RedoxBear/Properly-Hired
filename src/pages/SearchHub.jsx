import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Sparkles, Clock } from "lucide-react";

const LOCAL_DOCS = "agent-training-docs";
const LOCAL_FEEDBACK = "agent-feedback-store";
const LOCAL_INBOX = "agent-collab-inbox";
const LOCAL_SEARCH = "agent-search-index";
const LOCAL_COMPANY_RESEARCH = "company-research";

const loadLocal = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (e) {
        return [];
    }
};

const normalizeItem = (item, type) => ({
    id: item.id || `${type}-${Math.random().toString(36).slice(2)}`,
    type,
    agent: item.agent || item.agent_name || item.to_agent || item.from_agent || "unknown",
    text: item.summary || item.extracted_text || item.comment || item.message || item.content || "",
    created_at: item.created_at || item.timestamp || item.created_date || new Date().toISOString(),
    source: item
});

export default function SearchHub() {
    const [query, setQuery] = React.useState("");
    const [agentFilter, setAgentFilter] = React.useState("all");
    const [typeFilter, setTypeFilter] = React.useState("all");
    const [sortOrder, setSortOrder] = React.useState("newest");
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [editSummaryId, setEditSummaryId] = React.useState("");
    const [editSummaryText, setEditSummaryText] = React.useState("");

    const loadAll = React.useCallback(async () => {
        setLoading(true);
        try {
            const [docs, feedback, inbox, companyResearch] = await Promise.all([
                base44.entities?.AgentTrainingDoc?.filter?.({}, "-created_date", 200),
                base44.entities?.AgentFeedback?.filter?.({}, "-created_date", 200),
                base44.entities?.AgentCollabInbox?.filter?.({}, "-created_date", 200),
                base44.entities?.CompanyResearch?.filter?.({}, "-created_date", 200)
            ]);

            const localDocs = loadLocal(LOCAL_DOCS);
            const localFeedback = loadLocal(LOCAL_FEEDBACK);
            const localInbox = loadLocal(LOCAL_INBOX);
            const localSearch = loadLocal(LOCAL_SEARCH);
            const localResearch = loadLocal(LOCAL_COMPANY_RESEARCH);

            const all = [
                ...(docs || localDocs).map((item) => normalizeItem(item, "document")),
                ...(feedback || localFeedback).map((item) => normalizeItem(item, "feedback")),
                ...(inbox || localInbox).map((item) => normalizeItem(item, "collab")),
                ...(companyResearch || localResearch).map((item) => ({
                    ...normalizeItem(item, "company_research"),
                    agent: "simon",
                    text: `${item.company_name || ""} ${item.job_url || ""} ${item.summary || ""} ${item.research_payload || ""}`
                })),
                ...localSearch.map((item) => normalizeItem(item, item.type || "conversation"))
            ];

            setResults(all);
        } catch (e) {
            console.error("Failed to load search data:", e);
            const localDocs = loadLocal(LOCAL_DOCS);
            const localFeedback = loadLocal(LOCAL_FEEDBACK);
            const localInbox = loadLocal(LOCAL_INBOX);
            const localSearch = loadLocal(LOCAL_SEARCH);
            const localResearch = loadLocal(LOCAL_COMPANY_RESEARCH);
            const all = [
                ...localDocs.map((item) => normalizeItem(item, "document")),
                ...localFeedback.map((item) => normalizeItem(item, "feedback")),
                ...localInbox.map((item) => normalizeItem(item, "collab")),
                ...localResearch.map((item) => ({
                    ...normalizeItem(item, "company_research"),
                    agent: "simon",
                    text: `${item.company_name || ""} ${item.job_url || ""} ${item.summary || ""} ${item.research_payload || ""}`
                })),
                ...localSearch.map((item) => normalizeItem(item, item.type || "conversation"))
            ];
            setResults(all);
        }
        setLoading(false);
    }, []);

    React.useEffect(() => {
        loadAll();
    }, [loadAll]);

    const filtered = results.filter((item) => {
        const matchesQuery = query
            ? item.text.toLowerCase().includes(query.toLowerCase())
            : true;
        const matchesAgent = agentFilter === "all" || item.agent === agentFilter;
        const matchesType = typeFilter === "all" || item.type === typeFilter;
        return matchesQuery && matchesAgent && matchesType;
    }).sort((a, b) => {
        if (sortOrder === "oldest") {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-3">
                        <Search className="w-4 h-4" />
                        Unified Search
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Search Hub</h1>
                    <p className="text-slate-600">Search across conversations, uploads, feedback, and collaboration notes.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-emerald-600" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-4">
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search keywords..." />
                        <Select value={agentFilter} onValueChange={setAgentFilter}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Agents</SelectItem>
                                <SelectItem value="kyle">Kyle</SelectItem>
                                <SelectItem value="simon">Simon</SelectItem>
                                <SelectItem value="cv_assistant">CV Assistant</SelectItem>
                                <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="conversation">Conversation</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                                <SelectItem value="feedback">Feedback</SelectItem>
                                <SelectItem value="collab">Collaboration</SelectItem>
                                <SelectItem value="company_research">Company Research</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="oldest">Oldest</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">{filtered.length} results</p>
                    <Button onClick={loadAll} variant="outline" size="sm" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        Refresh Index
                    </Button>
                </div>

                <div className="grid gap-3">
                    {loading && (
                        <div className="text-sm text-slate-500">Loading...</div>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div className="text-sm text-slate-500">No results found.</div>
                    )}
                    {filtered.map((item) => (
                        <Card key={item.id}>
                            <CardContent className="p-4 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{item.type}</Badge>
                                    <Badge variant="secondary">{item.agent}</Badge>
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(item.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.text || "No text available."}</p>
                                {item.type === "company_research" && (
                                    <div className="mt-3 border-t pt-3 space-y-2">
                                        <div className="text-xs text-slate-500">Summary</div>
                                        {editSummaryId === item.id ? (
                                            <>
                                                <Textarea
                                                    value={editSummaryText}
                                                    onChange={(e) => setEditSummaryText(e.target.value)}
                                                    className="min-h-[90px]"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={async () => {
                                                            try {
                                                                if (base44.entities?.CompanyResearch) {
                                                                    await base44.entities.CompanyResearch.update(item.id, {
                                                                        summary: editSummaryText
                                                                    });
                                                                } else {
                                                                    const localResearch = loadLocal(LOCAL_COMPANY_RESEARCH);
                                                                    const next = localResearch.map((r) =>
                                                                        r.id === item.id ? { ...r, summary: editSummaryText } : r
                                                                    );
                                                                    localStorage.setItem(LOCAL_COMPANY_RESEARCH, JSON.stringify(next));
                                                                }
                                                                setEditSummaryId("");
                                                                setEditSummaryText("");
                                                                loadAll();
                                                            } catch (e) {
                                                                console.error("Failed to update summary:", e);
                                                            }
                                                        }}
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => setEditSummaryId("")}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm text-slate-700">{item.source?.summary || "No summary yet."}</p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditSummaryId(item.id);
                                                        setEditSummaryText(item.source?.summary || "");
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
