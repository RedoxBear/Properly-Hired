import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Loader2, AlertCircle, Circle, Upload, X
} from "lucide-react";

const STATUS = {
  PENDING: "pending",
  UPLOADING: "uploading",
  IMPORTING: "importing",
  DONE: "done",
  ERROR: "error",
  SKIPPED: "skipped",
};

function StatusIcon({ status }) {
  switch (status) {
    case STATUS.DONE: return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />;
    case STATUS.ERROR: return <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />;
    case STATUS.UPLOADING:
    case STATUS.IMPORTING: return <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />;
    case STATUS.SKIPPED: return <X className="w-4 h-4 text-slate-400 shrink-0" />;
    default: return <Circle className="w-4 h-4 text-slate-300 shrink-0" />;
  }
}

function formatRows(n) {
  if (!n) return "—";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

export { STATUS };

export default function CSVImportQueue({ files, onImportFile, onImportAll, disabled }) {
  const pending = files.filter(f => f.status === STATUS.PENDING);
  const done = files.filter(f => f.status === STATUS.DONE);
  const errors = files.filter(f => f.status === STATUS.ERROR);
  const active = files.filter(f => f.status === STATUS.UPLOADING || f.status === STATUS.IMPORTING);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex gap-4 text-xs font-medium">
          <span className="text-green-700">{done.length} done</span>
          <span className="text-blue-700">{active.length} active</span>
          <span className="text-slate-600">{pending.length} pending</span>
          {errors.length > 0 && <span className="text-red-700">{errors.length} failed</span>}
        </div>
        {pending.length > 0 && (
          <Button size="sm" onClick={onImportAll} disabled={disabled || active.length > 0}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Import All ({pending.length})
          </Button>
        )}
      </div>

      {/* File list */}
      <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
        {files.map((f, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-sm transition-colors ${
              f.status === STATUS.DONE ? "bg-green-50/60 border-green-200" :
              f.status === STATUS.ERROR ? "bg-red-50/60 border-red-200" :
              f.status === STATUS.IMPORTING || f.status === STATUS.UPLOADING ? "bg-blue-50/60 border-blue-200" :
              f.status === STATUS.SKIPPED ? "bg-muted/30 border-border/50" :
              "bg-card border-border"
            }`}
          >
            <StatusIcon status={f.status} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground truncate text-xs">
                  {f.uploadName}
                </span>
                {f.entity && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {f.entity}
                  </Badge>
                )}
              </div>
              {f.status === STATUS.IMPORTING && f.stats && (
                <div className="mt-1">
                  <Progress value={Math.round((f.stats.imported / Math.max(f.stats.provided, 1)) * 100)} className="h-1" />
                  <span className="text-[10px] text-muted-foreground">
                    {formatRows(f.stats.imported)} / {formatRows(f.stats.provided)}
                  </span>
                </div>
              )}
              {f.status === STATUS.DONE && f.stats && (
                <span className="text-[10px] text-green-700">
                  {formatRows(f.stats.imported)} imported
                  {f.stats.errors > 0 && `, ${f.stats.errors} errors`}
                </span>
              )}
              {f.status === STATUS.ERROR && f.error && (
                <span className="text-[10px] text-red-600 truncate block">{f.error}</span>
              )}
              {f.status === STATUS.SKIPPED && (
                <span className="text-[10px] text-muted-foreground">Unsupported file</span>
              )}
            </div>

            {f.status === STATUS.PENDING && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
                onClick={() => onImportFile(idx)}
                disabled={disabled || active.length > 0}
              >
                Import
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}