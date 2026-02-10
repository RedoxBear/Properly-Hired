import React, { useState, useEffect, useRef } from "react";
import { ingestFromKnowledgeBase } from "@/functions/ingestFromKnowledgeBase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play, Square, RefreshCw, CheckCircle2, XCircle, Clock,
  Loader2, Database, FileText, AlertTriangle
} from "lucide-react";

export default function KnowledgeIngest() {
  const [records, setRecords] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const stopRef = useRef(false);
  const logEndRef = useRef(null);

  const loadList = async () => {
    setListLoading(true);
    try {
      const res = await ingestFromKnowledgeBase({ action: "list" });
      const data = res.data || res;
      setRecords(data.records || []);
    } catch (err) {
      addLog(`Error loading list: ${err.message}`, "error");
    }
    setListLoading(false);
  };

  useEffect(() => { loadList(); }, []);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  const addLog = (msg, type = "info") => {
    setLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  const runIngestion = async () => {
    stopRef.current = false;
    setRunning(true);
    setLog([]);

    let offset = 0;
    let chunkStart = 0;
    let filesCompleted = 0;
    let totalChunks = 0;

    addLog("Starting ingestion...");

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    while (!stopRef.current) {
      try {
        const res = await ingestFromKnowledgeBase({ action: "ingest_one", offset, chunk_start: chunkStart });
        const d = res.data || res;

        if (d.done) {
          addLog("All records processed!");
          break;
        }

        if (d.status === "skipped") {
          addLog(`Skipped: ${d.title} (${d.reason})`, "warn");
          offset = d.next_offset;
          chunkStart = 0;
          continue;
        }

        if (d.status === "partial") {
          setCurrentFile(d.title);
          setProgress(d.progress_pct);
          totalChunks += d.chunks_this_call;
          addLog(`${d.title} — ${d.progress_pct}% (${d.chunks_this_call} chunks this batch)`);
          offset = d.next_offset;
          chunkStart = d.chunk_start;
          continue;
        }

        if (d.status === "completed") {
          filesCompleted++;
          totalChunks += d.chunks_this_call;
          addLog(`✓ ${d.title} — ${d.total_chunk_count} total chunks`, "success");
          setCurrentFile(null);
          setProgress(0);
          offset = d.next_offset;
          chunkStart = 0;
          continue;
        }

        // Unknown response — move forward
        addLog(`Unexpected response for offset ${offset}: ${JSON.stringify(d).substring(0, 200)}`, "warn");
        offset++;
        chunkStart = 0;

      } catch (err) {
        addLog(`Error at offset ${offset}: ${err.message}`, "error");
        addLog("Waiting 5s before retrying...", "warn");
        await sleep(5000);
        // Retry same position once, then skip
        try {
          const retry = await ingestFromKnowledgeBase({ action: "ingest_one", offset, chunk_start: chunkStart });
          const rd = retry.data || retry;
          if (rd.status === "partial") { offset = rd.next_offset; chunkStart = rd.chunk_start; }
          else if (rd.status === "completed") { offset = rd.next_offset; chunkStart = 0; filesCompleted++; }
          else { offset++; chunkStart = 0; }
          addLog("Retry succeeded", "success");
        } catch (retryErr) {
          addLog(`Retry failed, skipping: ${retryErr.message}`, "error");
          offset++;
          chunkStart = 0;
        }
      }

      // Small delay between calls to avoid rate limits
      await sleep(1000);
    }

    addLog(`Done. Files: ${filesCompleted}, Total chunks: ${totalChunks}`);
    setRunning(false);
    setCurrentFile(null);
    setProgress(0);
    loadList();
  };

  const stopIngestion = () => {
    stopRef.current = true;
    addLog("Stopping after current batch...", "warn");
  };

  const pendingCount = records.filter(r => !r.already_ingested).length;
  const completedCount = records.filter(r => r.already_ingested).length;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Ingestion</h1>
          <p className="text-sm text-muted-foreground">
            Ingest KnowledgeBase text records into RAG chunks
          </p>
        </div>
        <Button onClick={loadList} disabled={listLoading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${listLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{records.length}</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Ingested</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            {!running ? (
              <Button onClick={runIngestion} disabled={pendingCount === 0}>
                <Play className="w-4 h-4 mr-2" />
                Start Ingestion ({pendingCount} pending)
              </Button>
            ) : (
              <Button onClick={stopIngestion} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
          </div>

          {currentFile && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="truncate">{currentFile}</span>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ingestion Log</CardTitle>
          </CardHeader>
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

      {/* Records List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Knowledge Records</CardTitle>
          <CardDescription>{records.length} records found in KnowledgeBase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {records.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                {r.already_ingested
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{r.title}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{Math.round(r.content_length / 1024)}KB</span>
                    <span>~{r.estimated_chunks} chunks</span>
                    {r.chunk_count > 0 && <span className="text-green-600">{r.chunk_count} ingested</span>}
                  </div>
                </div>
                <Badge variant="outline" className="flex-shrink-0">{r.agent}</Badge>
                {r.category && <Badge variant="secondary" className="flex-shrink-0 text-[10px]">{r.category}</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}