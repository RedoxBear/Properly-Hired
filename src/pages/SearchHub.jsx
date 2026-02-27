import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Sparkles, Clock, RefreshCw, Lock, ExternalLink } from "lucide-react";
import { hasAccess, TIERS } from "@/components/utils/accessControl";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const LOCAL_DOCS = "agent-training-docs";
const LOCAL_FEEDBACK = "agent-feedback-store";
const LOCAL_INBOX = "agent-collab-inbox";
const LOCAL_SEARCH = "agent-search-index";
const LOCAL_COMPANY_RESEARCH = "company-research";

const POLL_INTERVAL_MS = 15000;

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
    const [query, setQuery] = useState("");
    const [agentFilter, setAgentFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editSummaryId, setEditSummaryId] = useState("");
    const [editSummaryText, setEditSummaryText] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [pollingEnabled, setPollingEnabled] = useState(true);
    const pollRef = useRef(null);
    const initialLoadDone = useRef(false);

    // Parse URL params on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const paramAgent = urlParams.get("agent");
        const paramType = urlParams.get("type");
        const paramQuery = urlParams.get("query");

        if (paramAgent) setAgentFilter(paramAgent);
        if (paramType) setTypeFilter(paramType);
        if (paramQuery) setQuery(decodeURIComponent(paramQuery));
    }, []);

    // Load user
    useEffect(() => {
        (async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
            } catch (e) {
                console.warn("Failed to load user:", e);
            } finally {
                setIsLoadingUser(false);
            }
        })();
    }, []);

    const loadAll = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
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
        if (!silent) setLoading(false);
    }, []);

    // Initial load
    useEffect(() => {
        if (!initialLoadDone.current) {
            initialLoadDone.current = true;
            loadAll();
        }
    }, [loadAll]);

    // Polling
    useEffect(() => {
        if (pollingEnabled) {
            pollRef.current = setInterval(() => loadAll(true), POLL_INTERVAL_MS);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [pollingEnabled, loadAll]);

    const isPro = hasAccess(currentUser, "insights");
    const FREE_PREVIEW_LIMIT = 3;

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

    const displayResults = isPro ? filtered : filtered.slice(0, FREE_PREVIEW_LIMIT);
    const hiddenCount = isPro ? 0 : Math.max(0, filtered.length - FREE_PREVIEW_LIMIT);

    if (isLoadingUser) {
        return (
            <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-3">
                        <Search className="w-4 h-4" />
                        Unified Search
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Search Hub</h1>
                    <p className="text-slate-600">Search across conversations, uploads, feedback, company research, and collaboration notes.</p>
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

                <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm text-slate-600">
                        {filtered.length} results
                        {pollingEnabled && <span className="ml-2 text-xs text-emerald-600">(auto-refreshing)</span>}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setPollingEnabled(!pollingEnabled)}
                            variant={pollingEnabled ? "secondary" : "outline"}
                            size="sm"
                            className="gap-1 text-xs"
                        >
                            <RefreshCw className={`w-3 h-3 ${pollingEnabled ? "animate-spin" : ""}`} />
                            {pollingEnabled ? "Auto" : "Paused"}
                        </Button>
                        <Button onClick={() => loadAll()} variant="outline" size="sm" className="gap-2">
                            <Sparkles className="w-4 h-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="grid gap-3">
                    {loading && (
                        <div className="text-sm text-slate-500">Loading...</div>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div className="text-sm text-slate-500">No results found.</div>
                    )}
                    {displayResults.map((item, idx) => (
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
                                {/* For free users beyond limit, blur text */}
                                <p className={`text-sm text-slate-700 whitespace-pre-wrap ${!isPro && idx >= FREE_PREVIEW_LIMIT ? "blur-sm select-none" : ""}`}>
                                    {item.text?.substring(0, isPro ? undefined : 300) || "No text available."}
                                    {!isPro && item.text?.length > 300 && "..."}
                                </p>
                                {item.type === "company_research" && isPro && (
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
                                                                await base44.entities.CompanyResearch.update(item.id, {
                                                                    summary: editSummaryText
                                                                });
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
                                        {/* Source URLs */}
                                        {item.source?.job_url && (
                                            <a href={item.source.job_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" /> Job URL
                                            </a>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Free tier: show upgrade prompt when results are hidden */}
                {hiddenCount > 0 && (
                    <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="p-6 text-center space-y-3">
                            <Lock className="w-8 h-8 text-amber-600 mx-auto" />
                            <p className="text-sm text-amber-800 font-medium">
                                {hiddenCount} more result{hiddenCount > 1 ? "s" : ""} available with Pro
                            </p>
                            <p className="text-xs text-amber-700">
                                Upgrade to access full research history, filtering, and company research details.
                            </p>
                            <Link to={createPageUrl("Pricing")}>
                                <Button size="sm" className="mt-2">View Plans</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}