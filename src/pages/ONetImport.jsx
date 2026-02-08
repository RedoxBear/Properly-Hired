import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Database, Loader2, AlertCircle, CheckCircle2, Trash2, RefreshCw, Info
} from "lucide-react";
import { isAdmin } from "@/components/utils/accessControl";
import { useNavigate } from "react-router-dom";
import { importONetCSV } from "@/functions/importONetCSV";
import CSVUploadZone from "@/components/onet/CSVUploadZone";
import CSVImportQueue, { STATUS } from "@/components/onet/CSVImportQueue";
import ONetAttribution from "@/components/onet/ONetAttribution";

const ENTITY_NAMES = [
  "ONetOccupation", "ONetSkill", "ONetAbility", "ONetKnowledge",
  "ONetTask", "ONetWorkActivity", "ONetWorkContext", "ONetReference",
];

export default function ONetImport() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);
  const [importing, setImporting] = useState(false);
  const [dbCounts, setDbCounts] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // ── Access check ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!isAdmin(user)) {
          setError("Admin access required.");
          setTimeout(() => navigate("/Dashboard"), 2000);
        }
      } catch {
        setError("Auth failed. Redirecting...");
        setTimeout(() => navigate("/Dashboard"), 2000);
      } finally {
        setChecking(false);
      }
    })();
    refreshCounts();
  }, []);

  // ── Load DB counts ────────────────────────────────────────────
  const refreshCounts = async () => {
    setLoadingCounts(true);
    try {
      const counts = {};
      for (const name of ENTITY_NAMES) {
        try {
          const ent = base44.entities[name];
          if (ent) {
            const recs = await ent.list("-created_date", 1);
            counts[name] = recs.length;
          } else {
            counts[name] = -1;
          }
        } catch {
          counts[name] = -1;
        }
      }
      setDbCounts(counts);
    } catch {
      // ignore
    } finally {
      setLoadingCounts(false);
    }
  };

  // ── File selection → upload to storage → resolve mapping ──────
  const handleFilesSelected = useCallback(async (csvFiles) => {
    setError("");
    const newFiles = [];

    for (const file of csvFiles) {
      newFiles.push({
        file,
        uploadName: file.name,
        resolvedName: null,
        entity: null,
        supported: null,
        status: STATUS.PENDING,
        fileUrl: null,
        stats: null,
        error: null,
      });
    }

    // Resolve file names server-side
    try {
      const names = newFiles.map(f => f.uploadName);
      const res = await importONetCSV({ action: "resolve_files", file_names: names });
      const resolved = res.data?.files || [];
      for (let i = 0; i < newFiles.length; i++) {
        const match = resolved.find(r => r.upload_name === newFiles[i].uploadName);
        if (match) {
          newFiles[i].resolvedName = match.resolved_name;
          newFiles[i].entity = match.entity;
          newFiles[i].supported = match.supported;
          if (!match.supported) {
            newFiles[i].status = STATUS.SKIPPED;
          }
        } else {
          newFiles[i].status = STATUS.SKIPPED;
        }
      }
    } catch (e) {
      console.error("Resolve failed:", e);
      // Mark all as pending, we'll try anyway
    }

    // Sort: supported first, then alphabetical
    newFiles.sort((a, b) => {
      if (a.supported && !b.supported) return -1;
      if (!a.supported && b.supported) return 1;
      return a.uploadName.localeCompare(b.uploadName);
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  // ── Import a single file ──────────────────────────────────────
  const importSingleFile = useCallback(async (idx) => {
    setFiles(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], status: STATUS.UPLOADING };
      return next;
    });

    try {
      const f = files[idx] || (await new Promise(r => {
        setFiles(prev => { r(prev[idx]); return prev; });
      }));

      // Get current file from state
      let currentFile;
      setFiles(prev => {
        currentFile = prev[idx];
        return prev;
      });
      if (!currentFile) return;

      // Upload file to storage
      const { file_url } = await base44.integrations.Core.UploadFile({ file: currentFile.file });

      setFiles(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], status: STATUS.IMPORTING, fileUrl: file_url };
        return next;
      });

      // Call backend to parse & import
      const res = await importONetCSV({
        action: "import_csv",
        file_url,
        csv_name: currentFile.uploadName,
      });

      const stats = res.data?.stats;

      setFiles(prev => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          status: STATUS.DONE,
          stats: stats || { imported: 0, provided: 0, errors: 0 },
        };
        return next;
      });
    } catch (e) {
      console.error("Import error:", e);
      setFiles(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], status: STATUS.ERROR, error: e.message || "Import failed" };
        return next;
      });
    }
  }, [files]);

  // ── Import all pending files sequentially ─────────────────────
  const importAll = useCallback(async () => {
    setImporting(true);
    // Snapshot the current indices of pending files
    let currentFiles;
    setFiles(prev => { currentFiles = prev; return prev; });

    for (let i = 0; i < currentFiles.length; i++) {
      if (currentFiles[i].status === STATUS.PENDING) {
        await importSingleFile(i);
        // Re-read state after each import
        setFiles(prev => { currentFiles = prev; return prev; });
      }
    }
    setImporting(false);
    refreshCounts();
  }, [importSingleFile]);

  // ── Clear all O*NET data ──────────────────────────────────────
  const handleClear = async () => {
    if (!confirm("Delete ALL O*NET data from all 8 entities? This cannot be undone.")) return;
    setImporting(true);
    try {
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
          } while (batch.length >= 200);
        } catch {}
      }
      setFiles([]);
      await refreshCounts();
    } finally {
      setImporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalImported = files.filter(f => f.status === STATUS.DONE)
    .reduce((sum, f) => sum + (f.stats?.imported || 0), 0);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <Badge className="mb-3 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Database className="w-3.5 h-3.5 mr-1" /> Admin Only
          </Badge>
          <h1 className="text-2xl font-bold text-foreground">O*NET 30.1 CSV Import</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload CSV files → server parses & imports into entity tables
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* DB Status */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" /> Entity Record Counts
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={refreshCounts} disabled={loadingCounts}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingCounts ? "animate-spin" : ""}`} />
                  Refresh
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
                  <div key={name} className="p-2.5 rounded-lg border bg-muted/30">
                    <div className="text-xs font-medium text-foreground truncate">{name}</div>
                    <div className={`text-lg font-bold ${
                      dbCounts[name] === -1 ? "text-red-500" :
                      dbCounts[name] > 0 ? "text-green-600" : "text-muted-foreground"
                    }`}>
                      {dbCounts[name] === -1 ? "N/A" : dbCounts[name] > 0 ? "✓" : "0"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">Loading counts...</div>
            )}
          </CardContent>
        </Card>

        {/* Upload Zone */}
        <CSVUploadZone onFilesSelected={handleFilesSelected} disabled={importing} />

        {/* Session stats */}
        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-foreground">{files.length}</div>
                <div className="text-xs text-muted-foreground">Files Queued</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {files.filter(f => f.status === STATUS.DONE).length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {totalImported >= 1000 ? `${(totalImported / 1000).toFixed(1)}K` : totalImported}
                </div>
                <div className="text-xs text-muted-foreground">Rows Imported</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Import Queue */}
        {files.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Import Queue</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CSVImportQueue
                files={files}
                onImportFile={importSingleFile}
                onImportAll={importAll}
                disabled={importing}
              />
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2 text-sm">
              <Info className="w-4 h-4" /> How it works
            </h3>
            <ol className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
              <li>Drop or select your O*NET 30.1 CSV files (supports split parts like Abilities__part001.csv)</li>
              <li>Files are auto-matched to entity tables (ONetSkill, ONetAbility, etc.)</li>
              <li>Each file is uploaded to storage, then the server parses and bulk-imports rows</li>
              <li>Large files (90K+ rows) take 1-3 minutes each — the server handles everything</li>
              <li>Unrecognized files are marked "Skipped" and ignored</li>
            </ol>
          </CardContent>
        </Card>

        {/* Entity Mapping */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs">Entity Mapping Reference</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div>
                <Badge className="mb-1 bg-blue-600 text-white">ONetOccupation</Badge>
                <p className="text-muted-foreground">Occupation_Data, Alternate_Titles, Job_Zones</p>
              </div>
              <div>
                <Badge className="mb-1 bg-green-600 text-white">ONetSkill</Badge>
                <p className="text-muted-foreground">Skills.csv</p>
              </div>
              <div>
                <Badge className="mb-1 bg-purple-600 text-white">ONetAbility</Badge>
                <p className="text-muted-foreground">Abilities.csv</p>
              </div>
              <div>
                <Badge className="mb-1 bg-amber-600 text-white">ONetKnowledge</Badge>
                <p className="text-muted-foreground">Knowledge.csv</p>
              </div>
              <div>
                <Badge className="mb-1 bg-red-600 text-white">ONetTask</Badge>
                <p className="text-muted-foreground">Task_Statements, Emerging_Tasks</p>
              </div>
              <div>
                <Badge className="mb-1 bg-cyan-600 text-white">ONetWorkActivity</Badge>
                <p className="text-muted-foreground">Work_Activities.csv</p>
              </div>
              <div>
                <Badge className="mb-1 bg-indigo-600 text-white">ONetWorkContext</Badge>
                <p className="text-muted-foreground">Work_Context.csv</p>
              </div>
              <div>
                <Badge className="mb-1 bg-slate-600 text-white">ONetReference</Badge>
                <p className="text-muted-foreground">All remaining reference/crosswalk tables (~25 files)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ONetAttribution />
      </div>
    </div>
  );
}