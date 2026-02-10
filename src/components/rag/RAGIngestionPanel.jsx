import React, { useState, useRef, useEffect } from "react";
import { ragIngest } from "@/functions/ragIngest";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Play, Square, RefreshCw, CheckCircle2, Clock, Loader2,
  RotateCcw, AlertTriangle, Brain, Hash, Trash2
} from "lucide-react";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default function RAGIngestionPanel({ onRefreshStats }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [log, setLog] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const stopRef = useRef(false);
  const logEndRef = useRef(null);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await ragIngest({ action: "list" });
      const d = res.data || res;
      setRecords(d.records || []);
    } catch (err) {
      addLog(`Failed to load: ${err.message}`, "error");
    }
    setLoading(false);
  };

  useEffect(() => { loadList(); }, []);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  const addLog = (msg, type = "info") => {
    setLog(prev => [...prev.slice(-100), { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  const resetOne = async (record) => {
    if (!record.source_id) return;
    addLog(`Resetting ${record.title}...`, "warn");
    try {
      await ragIngest({ action: "reset_one", source_id: record.source_id });
      addLog(`Reset: ${record.title}`, "success");
      await sleep(1500);
      loadList();
    } catch (err) {
      addLog(`Reset failed: ${err.message}`, "error");
    }
  };

  const runIngestion = async () => {
    stopRef.current = false;
    setRunning(true);
    setLog([]);

    const pending = records.filter(r => r.status !== 'completed');
    if (!pending.length) {
      addLog("All records already ingested.");
      setRunning(false);
      return;
    }

    addLog(`Starting ingestion of ${pending.length} records (AI summaries: ${useAI ? 'ON' : 'OFF'})...`);
    let done = 0, totalChunks = 0, totalDeduped = 0, totalSummaries = 0;

    for (const record of pending) {
      if (stopRef.current) { addLog("Stopped by user.", "warn"); break; }
      addLog(`▶ ${record.title} (${Math.round(record.content_length / 1024)}KB)`);
      setCurrentFile(record.title);
      setProgress(0);

      let chunkStart = 0;
      let errors = 0;

      while (!stopRef.current) {
        try {
          await sleep(2500);
          const res = await ragIngest({
            action: "ingest_one", kb_id: record.id,
            chunk_start: chunkStart, use_ai: useAI
          });
          const d = res.data || res;

          if (d.error) {
            errors++;
            addLog(`  Error: ${d.error}`, "error");
            if (errors >= 3) { addLog(`  Skipping after 3 errors`, "error"); break; }
            await sleep(8000);
            continue;
          }
          errors = 0;

          if (d.status === 'skipped' || d.status === 'already_done') {
            addLog(`  Skipped: ${d.reason || 'already done'}`, "warn");
            break;
          }

          totalChunks += d.chunks_created || 0;
          totalDeduped += d.deduped || 0;
          totalSummaries += d.ai_summaries || 0;

          if (d.status === 'partial') {
            setProgress(d.progress_pct || 0);
            addLog(`  ${d.progress_pct}% — +${d.chunks_created} chunks, ${d.deduped || 0} deduped, ${d.ai_summaries || 0} summaries`);
            chunkStart = d.next_chunk_start;
            continue;
          }

          if (d.status === 'completed') {
            done++;
            addLog(`  ✓ Done — ${d.total_chunks} total chunks`, "success");
            break;
          }

          break;
        } catch (err) {
          errors++;
          addLog(`  Network error: ${err.message}`, "error");
          if (errors >= 3) { addLog(`  Skipping after 3 errors`, "error"); break; }
          await sleep(8000);
        }
      }
      setCurrentFile(null);
      setProgress(0);
    }

    addLog(`\nDone! Files: ${done}, Chunks: ${totalChunks}, Deduped: ${totalDeduped}, AI Summaries: ${totalSummaries}`, "success");
    setRunning(false);
    await sleep(2000);
    loadList();
    onRefreshStats?.();
  };

  const pending = records.filter(r => r.status !== 'completed').length;
  const completed = records.filter(r => r.status === 'completed').length;
  const stuck = records.filter(r => r.status === 'processing').length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Knowledge Ingestion</CardTitle>
              <CardDescription>
                {records.length} records — {completed} done, {pending} pending{stuck > 0 ? `, ${stuck} stuck` : ''}
              </CardDescription>
            </div>
            <Button onClick={loadList} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            {!running ? (
              <Button onClick={runIngestion} disabled={pending === 0 || loading}>
                <Play className="w-4 h-4 mr-2" />
                Ingest {pending} Pending
              </Button>
            ) : (
              <Button onClick={() => { stopRef.current = true; }} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={useAI} onCheckedChange={setUseAI} disabled={running} id="ai-toggle" />
              <label htmlFor="ai-toggle" className="text-sm flex items-center gap-1 cursor-pointer">
                <Brain className="w-4 h-4" />
                AI Summaries
              </label>
            </div>
          </div>

          {currentFile && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span className="truncate flex-1">{currentFile}</span>
                <Badge variant="secondary">{progress}%</Badge>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log */}
      {log.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="max-h-48 overflow-y-auto space-y-0.5 font-mono text-xs">
              {log.map((e, i) => (
                <div key={i} className={`flex gap-2 ${
                  e.type === "error" ? "text-red-600" :
                  e.type === "warn" ? "text-amber-600" :
                  e.type === "success" ? "text-green-600" :
                  "text-muted-foreground"
                }`}>
                  <span className="text-muted-foreground/50 flex-shrink-0">{e.ts}</span>
                  <span>{e.msg}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records list */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {records.map((r, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg border text-sm hover:bg-muted/30">
                {r.status === 'completed'
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : r.status === 'processing'
                    ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    : <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-xs">{r.title}</p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    <span>{Math.round(r.content_length / 1024)}KB</span>
                    {r.chunk_count > 0 && <span className="text-green-600">{r.chunk_count} chunks</span>}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] flex-shrink-0">{r.agent}</Badge>
                {r.status === 'processing' && r.source_id && !running && (
                  <Button size="sm" variant="ghost" onClick={() => resetOne(r)} className="h-7 w-7 p-0">
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}