import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { importONetCSV } from "@/functions/importONetCSV";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database, Loader2, AlertCircle, CheckCircle2, Trash2,
  RefreshCw, Upload, FolderOpen, Circle, X, Play, Info
} from "lucide-react";
import { isAdmin } from "@/components/utils/accessControl";
import { useNavigate } from "react-router-dom";

const ENTITY_NAMES = [
  "ONetOccupation", "ONetSkill", "ONetAbility", "ONetKnowledge",
  "ONetTask", "ONetWorkActivity", "ONetWorkContext", "ONetReference",
];

const FILE_STATUS = {
  PENDING: "pending",
  UPLOADING: "uploading",
  IMPORTING: "importing",
  DONE: "done",
  ERROR: "error",
  SKIPPED: "skipped",
};

export default function ONetImport() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [files, setFiles] = useState([]);
  const [importing, setImporting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [dbCounts, setDbCounts] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [log, setLog] = useState([]);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const logEndRef = useRef(null);

  // Scroll log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // Auth check
  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!isAdmin(user)) {
          setGlobalError("Admin access required.");
          setTimeout(() => navigate("/Dashboard"), 2000);
        } else {
          setAuthorized(true);
        }
      } catch {
        setGlobalError("Auth failed. Redirecting...");
        setTimeout(() => navigate("/Dashboard"), 2000);
      } finally {
        setChecking(false);
      }
    })();
    refreshCounts();
  }, []);

  const addLog = (msg, type = "info") => {
    const ts = new Date().toLocaleTimeString();
    setLog(prev => [...prev, { ts, msg, type }]);
  };

  // Refresh DB counts
  const refreshCounts = async () => {
    setLoadingCounts(true);
    try {
      const counts = {};
      for (const name of ENTITY_NAMES) {
        try {
          const ent = base44.entities[name];
          if (ent) {
            const recs = await ent.list("-created_date", 1);
            counts[name] = recs?.length > 0 ? "✓ has data" : "0";
          } else {
            counts[name] = "N/A";
          }
        } catch {
          counts[name] = "error";
        }
      }
      setDbCounts(counts);
    } finally {
      setLoadingCounts(false);
    }
  };

  // Handle file selection
  const handleFiles = async (fileList) => {
    setGlobalError("");
    const csvFiles = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith(".csv"));
    if (csvFiles.length === 0) {
      setGlobalError("No CSV files found in selection.");
      return;
    }

    addLog(`Selected ${csvFiles.length} CSV files. Resolving mappings...`);

    // Resolve file names via backend
    const newFiles = csvFiles.map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      resolvedName: null,
      entity: null,
      supported: null,
      status: FILE_STATUS.PENDING,
      stats: null,
      error: null,
    }));

    try {
      const res = await importONetCSV({ action: "resolve_files", file_names: csvFiles.map(f => f.name) });
      const resolved = res.data?.files || [];
      for (let i = 0; i < newFiles.length; i++) {
        const match = resolved.find(r => r.upload_name === newFiles[i].name);
        if (match) {
          newFiles[i].resolvedName = match.resolved_name;
          newFiles[i].entity = match.entity;
          newFiles[i].supported = match.supported;
          if (!match.supported) {
            newFiles[i].status = FILE_STATUS.SKIPPED;
          }
        } else {
          newFiles[i].status = FILE_STATUS.SKIPPED;
        }
      }
    } catch (e) {
      addLog(`Warning: Could not resolve file mappings (${e.message}). Will try import anyway.`, "warn");
    }

    // Sort: supported first
    newFiles.sort((a, b) => {
      if (a.supported && !b.supported) return -1;
      if (!a.supported && b.supported) return 1;
      return a.name.localeCompare(b.name);
    });

    const supported = newFiles.filter(f => f.status !== FILE_STATUS.SKIPPED).length;
    const skipped = newFiles.filter(f => f.status === FILE_STATUS.SKIPPED).length;
    addLog(`✅ ${supported} files mapped to entities, ${skipped} skipped (unsupported).`);

    setFiles(prev => [...prev, ...newFiles]);
  };

  // Import ALL pending files one at a time
  const importAll = async () => {
    setImporting(true);
    addLog("━━━ Starting batch import ━━━", "header");

    // Get a snapshot of files
    let filesCopy = [...files];

    for (let i = 0; i < filesCopy.length; i++) {
      if (filesCopy[i].status !== FILE_STATUS.PENDING) continue;

      setCurrentFileIndex(i);
      const f = filesCopy[i];
      addLog(`[${i + 1}/${filesCopy.length}] Uploading: ${f.name}...`);

      // Update status to uploading
      setFiles(prev => {
        const next = [...prev];
        next[i] = { ...next[i], status: FILE_STATUS.UPLOADING };
        return next;
      });

      try {
        // Step 1: Upload to storage
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f.file });
        addLog(`  ↳ Uploaded. Sending to server for parsing...`);

        // Step 2: Update to importing
        setFiles(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: FILE_STATUS.IMPORTING };
          return next;
        });

        // Step 3: Call backend import
        const res = await importONetCSV({
          action: "import_csv",
          file_url,
          csv_name: f.name,
        });

        const stats = res.data?.stats;
        if (stats) {
          addLog(`  ✅ Done: ${stats.imported} rows imported into ${stats.entity}${stats.errors > 0 ? ` (${stats.errors} errors)` : ""}`, "success");
        } else {
          addLog(`  ✅ Done (no stats returned)`, "success");
        }

        setFiles(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: FILE_STATUS.DONE, stats: stats || { imported: 0, provided: 0, errors: 0 } };
          return next;
        });
      } catch (e) {
        const errMsg = e?.response?.data?.error || e.message || "Unknown error";
        addLog(`  ❌ FAILED: ${errMsg}`, "error");
        setFiles(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: FILE_STATUS.ERROR, error: errMsg };
          return next;
        });
      }

      // Brief pause between files
      await new Promise(r => setTimeout(r, 500));

      // Re-read filesCopy from state
      setFiles(prev => { filesCopy = prev; return prev; });
    }

    setCurrentFileIndex(-1);
    setImporting(false);
    addLog("━━━ Batch import complete ━━━", "header");
    refreshCounts();
  };

  // Clear all O*NET data
  const handleClear = async () => {
    if (!confirm("Delete ALL O*NET data from all 8 entities? This cannot be undone.")) return;
    setImporting(true);
    addLog("Clearing all O*NET data...", "warn");

    for (const name of ENTITY_NAMES) {
      try {
        const ent = base44.entities[name];
        if (!ent) continue;
        let batch;
        do {
          batch = await ent.list("-created_date", 200);
          for (const r of batch) {
            try { await ent.delete(r.id); } catch {}
          }
          if (batch.length > 0) addLog(`  Deleted ${batch.length} from ${name}`);
        } while (batch.length >= 200);
      } catch {}
    }

    setFiles([]);
    setLog([]);
    addLog("All O*NET data cleared.", "success");
    await refreshCounts();
    setImporting(false);
  };

  // Calculate stats
  const pendingCount = files.filter(f => f.status === FILE_STATUS.PENDING).length;
  const doneCount = files.filter(f => f.status === FILE_STATUS.DONE).length;
  const errorCount = files.filter(f => f.status === FILE_STATUS.ERROR).length;
  const totalImported = files.filter(f => f.status === FILE_STATUS.DONE)
    .reduce((sum, f) => sum + (f.stats?.imported || 0), 0);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive"><AlertDescription>{globalError}</AlertDescription></Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Database className="w-6 h-6" /> O*NET 30.1 Import
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload CSV files → auto-maps → server imports into database
            </p>
          </div>
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Admin Only</Badge>
        </div>

        {globalError && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: DB Status */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                Step 1: Current Database Status
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={refreshCounts} disabled={loadingCounts}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingCounts ? "animate-spin" : ""}`} /> Refresh
                </Button>
                <Button size="sm" variant="destructive" onClick={handleClear} disabled={importing}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {dbCounts ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ENTITY_NAMES.map(name => (
                  <div key={name} className="p-2.5 rounded-lg border bg-muted/30 text-center">
                    <div className="text-xs font-medium text-foreground truncate">{name.replace("ONet", "")}</div>
                    <div className={`text-sm font-bold ${
                      dbCounts[name] === "error" ? "text-red-500" :
                      dbCounts[name] === "N/A" ? "text-red-500" :
                      dbCounts[name] === "✓ has data" ? "text-green-600" : "text-muted-foreground"
                    }`}>
                      {dbCounts[name]}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                {loadingCounts ? "Loading..." : "Click Refresh to check"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Upload */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Step 2: Select CSV Files</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); if (!importing) handleFiles(e.dataTransfer.files); }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                importing ? "opacity-50 pointer-events-none border-border" : "border-border hover:border-blue-400"
              }`}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium text-foreground text-sm mb-1">Drop O*NET CSV files here</p>
              <p className="text-xs text-muted-foreground mb-3">Or use buttons below</p>
              <div className="flex gap-2 justify-center">
                <input ref={fileInputRef} type="file" multiple accept=".csv" className="hidden"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Choose Files
                </Button>
                <input ref={folderInputRef} type="file" multiple webkitdirectory="true" className="hidden"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
                <Button variant="outline" size="sm" onClick={() => folderInputRef.current?.click()} disabled={importing}>
                  <FolderOpen className="w-3.5 h-3.5 mr-1.5" /> Choose Folder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: File Queue & Import */}
        {files.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Step 3: Import Queue ({files.length} files)</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-600 font-medium">{doneCount} done</span>
                    <span className="text-muted-foreground">{pendingCount} pending</span>
                    {errorCount > 0 && <span className="text-red-600 font-medium">{errorCount} failed</span>}
                  </div>
                  {pendingCount > 0 && (
                    <Button size="sm" onClick={importAll} disabled={importing}>
                      {importing ? (
                        <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Importing...</>
                      ) : (
                        <><Play className="w-3.5 h-3.5 mr-1.5" /> Import All ({pendingCount})</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Progress bar */}
              {importing && files.length > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Overall Progress</span>
                    <span>{doneCount + errorCount} / {files.filter(f => f.status !== FILE_STATUS.SKIPPED).length}</span>
                  </div>
                  <Progress
                    value={((doneCount + errorCount) / Math.max(files.filter(f => f.status !== FILE_STATUS.SKIPPED).length, 1)) * 100}
                    className="h-2"
                  />
                </div>
              )}

              {/* File list */}
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {files.map((f, idx) => (
                  <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-colors ${
                    f.status === FILE_STATUS.DONE ? "bg-green-50/60 dark:bg-green-950/20 border-green-200 dark:border-green-800" :
                    f.status === FILE_STATUS.ERROR ? "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800" :
                    f.status === FILE_STATUS.IMPORTING || f.status === FILE_STATUS.UPLOADING ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" :
                    f.status === FILE_STATUS.SKIPPED ? "bg-muted/30 border-border/50 opacity-50" :
                    "bg-card border-border"
                  }`}>
                    {/* Status icon */}
                    {f.status === FILE_STATUS.DONE && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                    {f.status === FILE_STATUS.ERROR && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                    {(f.status === FILE_STATUS.UPLOADING || f.status === FILE_STATUS.IMPORTING) && <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
                    {f.status === FILE_STATUS.SKIPPED && <X className="w-4 h-4 text-slate-400 shrink-0" />}
                    {f.status === FILE_STATUS.PENDING && <Circle className="w-4 h-4 text-slate-300 shrink-0" />}

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{f.name}</span>
                      {f.status === FILE_STATUS.UPLOADING && <span className="text-blue-600">Uploading to storage...</span>}
                      {f.status === FILE_STATUS.IMPORTING && <span className="text-blue-600">Server parsing & importing...</span>}
                      {f.status === FILE_STATUS.DONE && f.stats && (
                        <span className="text-green-700 dark:text-green-400">
                          {f.stats.imported.toLocaleString()} rows → {f.stats.entity}
                          {f.stats.errors > 0 && ` (${f.stats.errors} errors)`}
                        </span>
                      )}
                      {f.status === FILE_STATUS.ERROR && <span className="text-red-600 truncate block">{f.error}</span>}
                      {f.status === FILE_STATUS.SKIPPED && <span className="text-muted-foreground">Unsupported file</span>}
                    </div>

                    {/* Entity badge */}
                    {f.entity && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {f.entity.replace("ONet", "")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary stats */}
              {doneCount > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200">
                    <CheckCircle2 className="w-4 h-4" />
                    Total imported: {totalImported.toLocaleString()} rows across {doneCount} files
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Live Log */}
        {log.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Import Log</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-slate-950 text-slate-200 rounded-lg p-3 font-mono text-xs max-h-[300px] overflow-y-auto">
                {log.map((entry, idx) => (
                  <div key={idx} className={`py-0.5 ${
                    entry.type === "error" ? "text-red-400" :
                    entry.type === "success" ? "text-green-400" :
                    entry.type === "warn" ? "text-yellow-400" :
                    entry.type === "header" ? "text-blue-400 font-bold" :
                    "text-slate-300"
                  }`}>
                    <span className="text-slate-500 mr-2">[{entry.ts}]</span>
                    {entry.msg}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2 text-sm">
              <Info className="w-4 h-4" /> Step-by-Step Instructions
            </h3>
            <ol className="text-xs text-amber-700 dark:text-amber-300 space-y-1.5 list-decimal list-inside">
              <li><strong>Check DB Status</strong> — Click "Refresh" to see what's already imported. Use "Clear All" to start fresh.</li>
              <li><strong>Select Files</strong> — Drop your O*NET CSV files or click "Choose Files" / "Choose Folder".</li>
              <li><strong>Review Queue</strong> — Green = supported, gray = skipped. Each file shows its target entity.</li>
              <li><strong>Click "Import All"</strong> — Files are uploaded one at a time, parsed on the server, and bulk-inserted.</li>
              <li><strong>Watch the Log</strong> — Real-time progress shows exactly what's happening. Errors are logged individually.</li>
              <li><strong>After completion</strong> — Click "Refresh" on DB Status to confirm all entities have data.</li>
            </ol>
            <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-xs text-amber-800 dark:text-amber-200">
              <strong>Tip:</strong> For large files (90K+ rows), each takes 1-3 minutes. Total for 40 files: ~15-30 minutes.
              Keep this tab open and let it run. Do NOT close the browser.
            </div>
          </CardContent>
        </Card>

        {/* Attribution */}
        <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 text-center">
            <a href="https://www.onetcenter.org/database.html" target="_blank" rel="noopener noreferrer">
              <img src="https://www.onetcenter.org/image/link/onet-in-it.svg" alt="O*NET" className="w-28 mx-auto mb-2 border-0" />
            </a>
            <p className="text-xs text-muted-foreground">
              O*NET 30.1 Database by U.S. Department of Labor/ETA. Used under{" "}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">CC BY 4.0</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}