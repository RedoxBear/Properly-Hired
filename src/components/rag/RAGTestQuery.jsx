import React, { useState } from "react";
import { ragIngest } from "@/functions/ragIngest";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Brain, Zap } from "lucide-react";

export default function RAGTestQuery() {
  const [query, setQuery] = useState("");
  const [agent, setAgent] = useState("kyle");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runTest = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await ragIngest({ action: "test_retrieve", query, test_agent: agent, test_top_k: 5 });
      setResult(res.data || res);
    } catch (err) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="w-4 h-4" /> Test Retrieval
        </CardTitle>
        <CardDescription>Test how the RAG system retrieves chunks for a query</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={agent} onValueChange={setAgent}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="kyle">Kyle</SelectItem>
              <SelectItem value="simon">Simon</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Try: cover letter tips, ghost jobs, resume format..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runTest()}
            className="flex-1"
          />
          <Button onClick={runTest} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {result?.error && (
          <div className="text-sm text-red-600 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            {result.error}
          </div>
        )}

        {result && !result.error && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" />{result.retrieval_ms}ms
              </Badge>
              <Badge variant="outline">{result.total_candidates} candidates</Badge>
              <Badge variant="outline">{result.chunks?.length || 0} results</Badge>
            </div>

            {result.expanded_terms?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Brain className="w-3 h-3" /> Expanded:
                </span>
                {result.expanded_terms.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/30">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {(result.chunks || []).map((c, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2 hover:bg-muted/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        Score: {c.score?.toFixed(1)}
                      </Badge>
                      {c.coverage > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {c.coverage}% coverage
                        </Badge>
                      )}
                    </div>
                    {c.heading && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                        § {c.heading}
                      </span>
                    )}
                  </div>
                  
                  {c.summary && (
                    <div className="text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 p-2 rounded flex items-start gap-1">
                      <Brain className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {c.summary}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {c.content_preview}
                  </p>
                  
                  <div className="flex gap-1 flex-wrap">
                    {(c.keywords || []).map((k, j) => (
                      <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              
              {result.chunks?.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No relevant chunks found. Try different terms or ingest more content.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}