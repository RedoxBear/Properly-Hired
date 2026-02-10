import React, { useState, useEffect, useRef } from "react";
import { ingestFromKnowledgeBase } from "@/functions/ingestFromKnowledgeBase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play, Square, RefreshCw, CheckCircle2, Clock,
  Loader2, Database, RotateCcw, AlertTriangle
} from "lucide-react";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default function KnowledgeIngest() {
  const [records, setRecords] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const stopRef = useRef(false);
  const logEndRef = useRef(null);

  const loadList = async () => {
    setListLoading(true);
    setListError(null);
    try {
      await sleep(500); // brief pause to avoid hitting rate limit right away
      const res = await ingestFromKnowledgeBase({ action: "list" });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setRecords(data.records || []);
    } catch (err) {
      setListError(err.message || "Failed to load list");
    }
    setListLoading(false);
  };

  useEffect(() => { loadList(); }, []);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  const addLog = (msg, type = "info") => {
    setLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  const resetSource = async (record) => {
    if (!record.source_id) return;
    addLog(`Resetting ${record.title}...`, "warn");
    try {
      await ingestFromKnowledgeBase({ action: "reset", source_id: record.source_id });
      addLog(`Reset complete: ${record.title}`, "success");
      await sleep(2000);
      loadList();
    } catch (err) {
      addLog(`Reset failed: ${err.message}`, "error");
    }
  };

  const runIngestion = async () => {
    stopRef.current = false;
    setRunning(true);
    setLog([]);

    // Get pending records (not completed)
    const pending = records.filter(r => !r.already_ingested);
    if (pending.length === 0) {
      addLog("Nothing to ingest — all records already completed.");
      setRunning(false);
      return;
    }

    addLog(`Starting ingestion of ${pending.length} records...`);
    let filesCompleted = 0;
    let totalChunks = 0;

    for (const record of pending) {
      if (stopRef.current) { addLog("Stopped by user.", "warn"); break; }

      addLog(`Processing: ${record.title} (${Math.round(record.content_length / 1024)}KB)`);
      setCurrentFile(record.title);
      setProgress(0);

      let chunkStart = 0;
      let consecutive_errors = 0;

      while (!stopRef.current) {
        try {
          await sleep(2000); // 2s between each call
          const res = await ingestFromKnowledgeBase({
            action: "ingest_one",
            kb_id: record.id,
            chunk_start: chunkStart
          });
          const d = res.data || res;

          if (d.error) {
            consecutive_errors++;
            addLog(`Error: ${d.error}`, "error");
            if (consecutive_errors >= 3) {
              addLog(`Too many errors, skipping ${record.title}`, "error");
              break;
            }
            addLog(`Waiting 10s before retry (${consecutive_errors}/3)...`, "warn");
            await sleep(10000);
            continue;
          }

          consecutive_errors = 0;

          if (d.status === "skipped") {
            addLog(`Skipped: ${record.title} (${d.reason})`, "warn");
            break;
          }

          if (d.status === "partial") {
            setProgress(d.progress_pct);
            totalChunks += d.chunks_this_call;
            addLog(`  ${d.progress_pct}% — ${d.chunks_this_call} chunks (${d.total_chunks_so_far} total)`);
            chunkStart = d.next_chunk_start;
            continue;
          }

          if (d.status === "completed") {
            filesCompleted++;
            totalChunks += d.chunks_this_call;
            addLog(`✓ ${record.title} — ${d.total_chunks} total chunks`, "success");
            break;
          }

          addLog(`Unknown response: ${JSON.stringify(d).substring(0, 150)}`, "warn");
          break;

        } catch (err) {
          consecutive_errors++;
          addLog(`Network error: ${err.message}`, "error");
          if (consecutive_errors >= 3) {
            addLog(`Too many errors, skipping ${record.title}`, "error");
            break;
          }
          addLog(`Waiting 10s before retry (${consecutive_errors}/3)...`, "warn");
          await sleep(10000);
        }
      }

      setCurrentFile(null);
      setProgress(0);
    }

    addLog(`Done. Files completed: ${filesCompleted}, Total chunks: ${totalChunks}`);
    setRunning(false);
    await sleep(3000);
    loadList();
  };

  const pendingCount = records.filter(r => !r.already_ingested).length;
  const completedCount = records.filter(r => r.already_ingested).length;
  const stuckCount = records.filter(r => r.ingestion_status === "processing" && !r.already_ingested).length;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Ingestion</h1>
          <p className="text-sm text-muted-foreground">Ingest KnowledgeBase records into RAG chunks</p>
        </div>
        <Button onClick={loadList} disabled={listLoading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${listLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {listError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{listError}</span>
          <Button onClick={loadList} size="sm" variant="outline" className="ml-auto">Retry</Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Database className="w-5 h-5 text-blue-600" />
          <div><p className="text-2xl font-bold">{records.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div><p className="text-2xl font-bold">{completedCount}</p><p className="text-xs text-muted-foreground">Ingested</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600" />
          <div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Pending</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div><p className="text-2xl font-bold">{stuckCount}</p><p className="text-xs text-muted-foreground">Stuck</p></div>
        </CardContent></Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {!running ? (
              <Button onClick={runIngestion} disabled={pendingCount === 0}>
                <Play className="w-4 h-4 mr-2" />
                Start Ingestion ({pendingCount} pending)
              </Button>
            ) : (
              <Button onClick={() => { stopRef.current = true; }} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
            {stuckCount > 0 && !running && (
              <p className="text-xs text-muted-foreground">
                {stuckCount} stuck record(s) — use the reset button below to clear them first
              </p>
            )}
          </div>

          {currentFile && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
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
          <CardHeader className="pb-2"><CardTitle className="text-base">Ingestion Log</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs">
              {log.map((entry, i) => (
                <div key={i} className={`flex gap-2 ${
                  entry.type === "error" ? "text-red-600" :
                  entry.type === "warn" ? "text-amber-600" :
                  entry.type === "success" ? "text-green-600" :
                  "text-muted-foreground"
                }`}>
                  <span className="text-muted-foreground/60 flex-shrink-0">{entry.ts}</span>
                  <span>{entry.msg}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Knowledge Records</CardTitle>
          <CardDescription>{records.length} records in KnowledgeBase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {records.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                {r.already_ingested
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : r.ingestion_status === "processing"
                    ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    : <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{r.title}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{Math.round(r.content_length / 1024)}KB</span>
                    <span>~{r.estimated_chunks} chunks</span>
                    {r.chunk_count > 0 && <span className="text-green-600">{r.chunk_count} done</span>}
                    {r.ingestion_status === "processing" && !r.already_ingested && (
                      <span className="text-amber-600">stuck</span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="flex-shrink-0">{r.agent}</Badge>
                {r.category && <Badge variant="secondary" className="flex-shrink-0 text-[10px]">{r.category}</Badge>}
                {r.ingestion_status === "processing" && !r.already_ingested && r.source_id && !running && (
                  <Button size="sm" variant="ghost" onClick={() => resetSource(r)} title="Reset stuck ingestion">
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