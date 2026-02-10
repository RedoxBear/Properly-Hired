import React from "react";
import { base44 } from "@/api/base44Client";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, RefreshCcw, Users, Link2, ClipboardList, Sparkles, Clock } from "lucide-react";

const LOCAL_SEARCH = "agent-search-index";
const LOCAL_RESOURCES = "agent-external-resources";
const LOCAL_INBOX = "agent-collab-inbox";

const loadLocal = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    return [];
  }
};

export default function CollaborationDashboard() {
  const [conversations, setConversations] = React.useState([]);
  const [resources, setResources] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);
  const [isSuggesting, setIsSuggesting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [resourceData, inboxData] = await Promise.all([
        base44.entities?.AgentExternalResource?.filter?.({}, "-created_date", 200),
        base44.entities?.AgentCollabInbox?.filter?.({}, "-created_date", 200)
      ]);

      const convLocal = loadLocal(LOCAL_SEARCH).filter((item) => item.type === "conversation");
      const resourceLocal = loadLocal(LOCAL_RESOURCES);
      const inboxLocal = loadLocal(LOCAL_INBOX);

      setConversations(convLocal.slice(0, 12));
      setResources((resourceData || resourceLocal).slice(0, 12));
      setTasks((inboxData || inboxLocal).filter((item) => item.status !== "closed").slice(0, 12));
    } catch (e) {
      console.error("Failed to load collaboration data:", e);
      setError("Could not load collaboration data. Using local cache.");
      setConversations(loadLocal(LOCAL_SEARCH).filter((item) => item.type === "conversation").slice(0, 12));
      setResources(loadLocal(LOCAL_RESOURCES).slice(0, 12));
      setTasks(loadLocal(LOCAL_INBOX).filter((item) => item.status !== "closed").slice(0, 12));
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 15000);
    return () => clearInterval(timer);
  }, [loadData]);

  const filteredConversations = conversations.filter((conv) =>
    query ? (conv.message || "").toLowerCase().includes(query.toLowerCase()) : true
  );

  const generateSuggestions = async () => {
    if (!filteredConversations.length) return;
    setIsSuggesting(true);
    setError("");
    try {
      const payload = filteredConversations.slice(0, 4).map((c) => ({
        id: c.id,
        agent: c.agent,
        summary: c.message
      }));
      const prompt = `
You are an AI collaboration director. Review these conversations and suggest inter-agent actions.
Return JSON array with fields: conversation_id, target_agent (kyle/simon/cv_assistant), priority (low/normal/high), reason.

Conversations:
${JSON.stringify(payload)}
      `;
      const res = await InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              conversation_id: { type: "string" },
              target_agent: { type: "string" },
              priority: { type: "string" },
              reason: { type: "string" }
            },
            required: ["conversation_id", "target_agent", "priority", "reason"]
          }
        }
      });
      setSuggestions(res || []);
    } catch (e) {
      console.error("Suggestion generation failed:", e);
      setError("Could not generate suggestions.");
    }
    setIsSuggesting(false);
  };

  const createTaskFromSuggestion = async (suggestion) => {
    const conv = conversations.find((c) => c.id === suggestion.conversation_id);
    const payload = {
      id: `inbox-${Date.now()}`,
      from_agent: "system",
      to_agent: suggestion.target_agent || "simon",
      summary: suggestion.reason,
      highlights: conv?.message ? [conv.message.slice(0, 160)] : [],
      priority: suggestion.priority || "normal",
      status: "open",
      created_at: new Date().toISOString(),
      created_by: "system"
    };

    try {
      if (base44.entities?.AgentCollabInbox) {
        await base44.entities.AgentCollabInbox.create(payload);
      } else {
        const existing = loadLocal(LOCAL_INBOX);
        existing.unshift(payload);
        localStorage.setItem(LOCAL_INBOX, JSON.stringify(existing));
      }
      await loadData();
    } catch (e) {
      console.error("Failed to create task:", e);
      setError("Could not create task from suggestion.");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium mb-3">
              <Users className="w-4 h-4" />
              Collaboration Dashboard
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Real-time Agent Collaboration</h1>
            <p className="text-slate-600">Monitor conversations, shared resources, and triage tasks.</p>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2" disabled={loading}>
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
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
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Ongoing Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations..." />
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <div key={conv.id} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Badge variant="outline">{conv.agent || "agent"}</Badge>
                    <Clock className="w-3 h-3" />
                    {new Date(conv.created_at || new Date()).toLocaleTimeString()}
                  </div>
                  <p className="text-sm text-slate-700">{conv.message || "No summary available."}</p>
                </div>
              ))}
              {!filteredConversations.length && (
                <p className="text-sm text-slate-500">No conversations found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-600" />
                Shared Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {resources.map((res) => (
                <div key={res.id} className="border rounded-lg p-3 bg-white">
                  <div className="text-sm font-semibold text-slate-700">{res.title}</div>
                  <p className="text-xs text-slate-500">{res.description || res.url}</p>
                </div>
              ))}
              {!resources.length && <p className="text-sm text-slate-500">No shared resources yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-600" />
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Badge variant="outline">{task.to_agent}</Badge>
                    {task.priority && <Badge variant="secondary">{task.priority}</Badge>}
                  </div>
                  <p className="text-sm text-slate-700">{task.summary || "No summary."}</p>
                </div>
              ))}
              {!tasks.length && <p className="text-sm text-slate-500">No pending tasks.</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Communication Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={generateSuggestions} disabled={isSuggesting} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {isSuggesting ? "Generating..." : "Generate Suggestions"}
            </Button>
            {suggestions.map((suggestion, idx) => (
              <div key={`${suggestion.conversation_id}-${idx}`} className="border rounded-lg p-3 bg-white space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline">{suggestion.target_agent}</Badge>
                  <Badge variant="secondary">{suggestion.priority}</Badge>
                </div>
                <p className="text-sm text-slate-700">{suggestion.reason}</p>
                <Button size="sm" variant="outline" onClick={() => createTaskFromSuggestion(suggestion)}>
                  Create Task
                </Button>
              </div>
            ))}
            {!suggestions.length && (
              <p className="text-sm text-slate-500">Generate suggestions to see recommended agent handoffs.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
