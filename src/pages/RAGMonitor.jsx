import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ragHealthCheck } from "@/functions/ragHealthCheck";
import { ingestKnowledge } from "@/functions/ingestKnowledge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Database, FileText, Search, Upload, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, Clock, Zap, BarChart3, Loader2
} from "lucide-react";

function StatCard({ label, value, icon: Icon, color = "blue" }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-950/40`}>
          <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RAGMonitor() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ingest form
  const [uploadAgent, setUploadAgent] = useState("kyle");
  const [uploadTags, setUploadTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ragHealthCheck({});
      setHealthData(res.data || res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHealth(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const tags = uploadTags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await ingestKnowledge({
        file_url,
        file_name: file.name,
        agent: uploadAgent,
        tags
      });
      setUploadResult(res.data || res);
      loadHealth();
    } catch (err) {
      setUploadResult({ error: err.message });
    } finally {
      setUploading(false);
    }
  };

  const s = healthData?.summary;
  const di = healthData?.data_integrity;
  const rq = healthData?.retrieval_quality;
  const perf = healthData?.performance;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">RAG Knowledge Monitor</h1>
          <p className="text-sm text-muted-foreground">Ingestion health, retrieval quality, and data integrity</p>
        </div>
        <Button onClick={loadHealth} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" /> Ingest Knowledge Document
          </CardTitle>
          <CardDescription>Upload a file to chunk and index for RAG retrieval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium">Agent</label>
              <Select value={uploadAgent} onValueChange={setUploadAgent}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kyle">Kyle</SelectItem>
                  <SelectItem value="simon">Simon</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium">Tags (comma-separated)</label>
              <Input
                placeholder="resume, cover-letter, ats"
                value={uploadTags}
                onChange={e => setUploadTags(e.target.value)}
              />
            </div>
            <div>
              <label className="cursor-pointer">
                <input type="file" className="hidden" accept=".txt,.md,.pdf,.docx,.doc,.rtf" onChange={handleFileUpload} disabled={uploading} />
                <Button asChild disabled={uploading}>
                  <span>
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {uploading ? "Ingesting..." : "Upload & Ingest"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
          {uploadResult && (
            <div className={`text-sm p-3 rounded-lg ${uploadResult.error ? "bg-red-50 dark:bg-red-950/20 text-red-700" : "bg-green-50 dark:bg-green-950/20 text-green-700"}`}>
              {uploadResult.error
                ? `Error: ${uploadResult.error}`
                : `Ingested "${uploadResult.file_name}" — ${uploadResult.chunks_created} chunks created (${uploadResult.text_length} chars)`
              }
            </div>
          )}
        </CardContent>
      </Card>

      {loading && !healthData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {s && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Sources" value={s.sources.total} icon={FileText} color="blue" />
            <StatCard label="Total Chunks" value={s.chunks.total} icon={Database} color="purple" />
            <StatCard label="Ingested (24h)" value={s.recent_ingestions_24h} icon={Clock} color="green" />
            <StatCard label="Avg Retrieval" value={`${perf?.avg_retrieval_ms || 0}ms`} icon={Zap} color="amber" />
          </div>

          {/* Per-Agent Breakdown */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Kyle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span>Sources</span><Badge variant="secondary">{s.sources.kyle}</Badge></div>
                <div className="flex justify-between text-sm"><span>Chunks</span><Badge variant="secondary">{s.chunks.kyle}</Badge></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Simon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span>Sources</span><Badge variant="secondary">{s.sources.simon}</Badge></div>
                <div className="flex justify-between text-sm"><span>Chunks</span><Badge variant="secondary">{s.chunks.simon}</Badge></div>
              </CardContent>
            </Card>
          </div>

          {/* Data Integrity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Data Integrity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {di.sources_with_no_chunks.length === 0
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-500" />
                    }
                    <span>Sources with 0 chunks: {di.sources_with_no_chunks.length}</span>
                  </div>
                  {di.sources_with_no_chunks.map(s => (
                    <div key={s.id} className="ml-6 text-xs text-muted-foreground">{s.path} ({s.status})</div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {di.failed_sources.length === 0
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-500" />
                    }
                    <span>Failed sources: {di.failed_sources.length}</span>
                  </div>
                  {di.failed_sources.map(s => (
                    <div key={s.id} className="ml-6 text-xs text-muted-foreground">{s.path}: {s.error}</div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {di.duplicate_sources.length === 0
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <AlertTriangle className="w-4 h-4 text-amber-500" />
                  }
                  <span>Duplicate sources: {di.duplicate_sources.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  {di.empty_chunks === 0
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-red-500" />
                  }
                  <span>Empty chunks: {di.empty_chunks}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Query Results */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4" /> Retrieval Test Results
              </CardTitle>
              <CardDescription>4 test queries (2 per agent) with latency and hit counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rq?.test_results?.map((tr, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{tr.agent}</Badge>
                        <span className="font-medium text-sm">"{tr.query}"</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={tr.hits > 0 ? "default" : "destructive"}>{tr.hits} hits</Badge>
                        <Badge variant="secondary">{tr.retrieval_ms}ms</Badge>
                      </div>
                    </div>
                    {tr.top_chunk_preview !== "N/A" && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-1">
                        Top chunk: {tr.top_chunk_preview}... (relevance: {tr.top_relevance?.toFixed(2)})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Queried Chunks */}
          {rq?.top_queried_chunks?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Most Queried Chunks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rq.top_queried_chunks.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 border-b last:border-0 pb-2">
                      <Badge variant="outline" className="mt-0.5">{c.agent}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{c.content_preview}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs">Queries: {c.query_count}</span>
                          <span className="text-xs text-muted-foreground">Relevance: {c.relevance_score?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Avg Retrieval Latency</p>
                  <p className="text-lg font-bold">{perf?.avg_retrieval_ms || 0}ms</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Retrieval Latency</p>
                  <p className="text-lg font-bold">{perf?.max_retrieval_ms || 0}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}