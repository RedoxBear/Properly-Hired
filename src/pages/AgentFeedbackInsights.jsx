import React from "react";
import { base44 } from "@/api/base44Client";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, RefreshCcw } from "lucide-react";

const LOCAL_FEEDBACK = "agent-feedback-store";

const loadLocal = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    return [];
  }
};

export default function AgentFeedbackInsights() {
  const [feedback, setFeedback] = React.useState([]);
  const [summary, setSummary] = React.useState("");
  const [suggestions, setSuggestions] = React.useState([]);
  const [critical, setCritical] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadFeedback = React.useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await base44.entities?.AgentFeedback?.filter?.({}, "-created_date", 200);
      setFeedback(data || loadLocal(LOCAL_FEEDBACK));
    } catch (e) {
      console.error("Failed to load feedback:", e);
      setFeedback(loadLocal(LOCAL_FEEDBACK));
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const analyzeFeedback = async () => {
    setIsLoading(true);
    setError("");
    try {
      const prompt = `Analyze this agent feedback. Identify recurring issues, suggest improvements for AgentTrainingConfig and AgentTrainingDoc, and flag critical feedback. Return JSON with: summary (string), suggestions (array), critical (array of objects with id, reason).\n\nFeedback:\n${JSON.stringify(feedback.slice(0, 120))}`;
      const res = await InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
            critical: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  reason: { type: "string" }
                },
                required: ["id", "reason"]
              }
            }
          },
          required: ["summary", "suggestions", "critical"]
        }
      });

      setSummary(res?.summary || "");
      setSuggestions(res?.suggestions || []);
      setCritical(res?.critical || []);

      if (base44.entities?.AgentNotification && (res?.critical || []).length) {
        for (const item of res.critical) {
          await base44.entities.AgentNotification.create({
            id: `note-${Date.now()}-${item.id}`,
            type: "critical_feedback",
            message: item.reason,
            target_agent: "manager",
            created_at: new Date().toISOString(),
            created_by: "system"
          });
        }
      }
    } catch (e) {
      console.error("Feedback analysis failed:", e);
      setError("Could not analyze feedback.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium mb-3">
            <AlertTriangle className="w-4 h-4" />
            Feedback Insights
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Agent Feedback Analyzer</h1>
          <p className="text-slate-600">Identify recurring issues and auto-flag critical feedback.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={analyzeFeedback} disabled={isLoading} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {isLoading ? "Analyzing..." : "Analyze Feedback"}
          </Button>
          <Button onClick={loadFeedback} variant="outline" className="gap-2" disabled={isLoading}>
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{summary}</p>
            </CardContent>
          </Card>
        )}

        {suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suggested Improvements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map((s, idx) => (
                <div key={idx} className="border rounded-lg p-2 bg-white text-sm text-slate-700">{s}</div>
              ))}
            </CardContent>
          </Card>
        )}

        {critical.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Critical Feedback Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {critical.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-2 bg-white">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Badge variant="destructive">Critical</Badge>
                    <span>ID: {item.id}</span>
                  </div>
                  <p className="text-sm text-slate-700">{item.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
