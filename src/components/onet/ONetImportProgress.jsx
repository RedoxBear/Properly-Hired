import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Database,
  FileText,
  Zap
} from "lucide-react";
import { FILE_STATUS } from "./ONetFileList";

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to human readable
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

/**
 * Single file progress component
 */
function FileProgress({ fileName, state, schema }) {
  const { status, progress, importedCount, error, startTime, endTime } = state || {};

  const duration = endTime && startTime ? endTime - startTime :
                   startTime ? Date.now() - startTime : null;

  const getStatusColor = () => {
    switch (status) {
      case FILE_STATUS.COMPLETE: return 'text-green-600';
      case FILE_STATUS.ERROR: return 'text-red-600';
      case FILE_STATUS.IMPORTING:
      case FILE_STATUS.PARSING:
      case FILE_STATUS.UPLOADING: return 'text-blue-600';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case FILE_STATUS.COMPLETE:
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case FILE_STATUS.ERROR:
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case FILE_STATUS.IMPORTING:
      case FILE_STATUS.PARSING:
      case FILE_STATUS.UPLOADING:
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case FILE_STATUS.COMPLETE: return 'Complete';
      case FILE_STATUS.ERROR: return 'Failed';
      case FILE_STATUS.IMPORTING: return 'Importing...';
      case FILE_STATUS.PARSING: return 'Parsing...';
      case FILE_STATUS.UPLOADING: return 'Uploading...';
      default: return 'Pending';
    }
  };

  return (
    <div className="p-3 rounded-lg border bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">{fileName}</span>
        </div>
        <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
          {getStatusText()}
        </Badge>
      </div>

      {(status === FILE_STATUS.IMPORTING || status === FILE_STATUS.COMPLETE) && (
        <div className="space-y-2">
          <Progress value={progress || 0} className="h-2" />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {importedCount?.toLocaleString() || 0} / {schema?.rowCount?.toLocaleString() || '?'} rows
            </span>
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(duration)}
              </span>
            )}
          </div>
        </div>
      )}

      {status === FILE_STATUS.ERROR && error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

/**
 * Overall import summary stats
 */
function ImportSummary({ fileStates, schemas }) {
  const stats = React.useMemo(() => {
    const files = Object.entries(fileStates);
    const completed = files.filter(([, s]) => s?.status === FILE_STATUS.COMPLETE);
    const failed = files.filter(([, s]) => s?.status === FILE_STATUS.ERROR);
    const inProgress = files.filter(([, s]) =>
      [FILE_STATUS.IMPORTING, FILE_STATUS.PARSING, FILE_STATUS.UPLOADING].includes(s?.status)
    );

    const totalImported = completed.reduce((sum, [, s]) => sum + (s?.importedCount || 0), 0);
    const totalExpected = Object.values(schemas).reduce((sum, s) => sum + (s?.rowCount || 0), 0);

    const totalDuration = completed.reduce((sum, [, s]) => {
      if (s?.startTime && s?.endTime) {
        return sum + (s.endTime - s.startTime);
      }
      return sum;
    }, 0);

    return {
      total: files.length,
      completed: completed.length,
      failed: failed.length,
      inProgress: inProgress.length,
      pending: files.length - completed.length - failed.length - inProgress.length,
      totalImported,
      totalExpected,
      totalDuration,
      percentComplete: Math.round((completed.length / (files.length || 1)) * 100)
    };
  }, [fileStates, schemas]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.completed}/{stats.total}</div>
              <div className="text-xs text-slate-500">Files Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {(stats.totalImported / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-slate-500">Records Imported</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.percentComplete}%</div>
              <div className="text-xs text-slate-500">Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stats.totalDuration > 0 ? formatDuration(stats.totalDuration) : '-'}
              </div>
              <div className="text-xs text-slate-500">Total Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Active imports panel - shows currently processing files
 */
function ActiveImports({ fileStates, schemas }) {
  const activeFiles = Object.entries(fileStates)
    .filter(([, s]) =>
      [FILE_STATUS.UPLOADING, FILE_STATUS.PARSING, FILE_STATUS.IMPORTING].includes(s?.status)
    )
    .map(([fileName, state]) => ({ fileName, state, schema: schemas[fileName] }));

  if (activeFiles.length === 0) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          Active Imports ({activeFiles.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {activeFiles.map(({ fileName, state, schema }) => (
            <FileProgress
              key={fileName}
              fileName={fileName}
              state={state}
              schema={schema}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Recent completions panel
 */
function RecentCompletions({ fileStates, schemas, limit = 5 }) {
  const recentCompleted = Object.entries(fileStates)
    .filter(([, s]) => s?.status === FILE_STATUS.COMPLETE && s?.endTime)
    .sort(([, a], [, b]) => (b?.endTime || 0) - (a?.endTime || 0))
    .slice(0, limit)
    .map(([fileName, state]) => ({ fileName, state, schema: schemas[fileName] }));

  if (recentCompleted.length === 0) return null;

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          Recently Completed
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {recentCompleted.map(({ fileName, state, schema }) => (
            <FileProgress
              key={fileName}
              fileName={fileName}
              state={state}
              schema={schema}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Errors panel
 */
function ErrorsPanel({ fileStates, schemas }) {
  const failedFiles = Object.entries(fileStates)
    .filter(([, s]) => s?.status === FILE_STATUS.ERROR)
    .map(([fileName, state]) => ({ fileName, state, schema: schemas[fileName] }));

  if (failedFiles.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          Failed Imports ({failedFiles.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {failedFiles.map(({ fileName, state, schema }) => (
            <FileProgress
              key={fileName}
              fileName={fileName}
              state={state}
              schema={schema}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main ONetImportProgress component
 */
export default function ONetImportProgress({ fileStates, schemas }) {
  const hasAnyActivity = Object.values(fileStates).some(s => s?.status !== FILE_STATUS.PENDING);

  if (!hasAnyActivity) return null;

  return (
    <div className="space-y-4">
      <ImportSummary fileStates={fileStates} schemas={schemas} />

      <div className="grid md:grid-cols-2 gap-4">
        <ActiveImports fileStates={fileStates} schemas={schemas} />
        <ErrorsPanel fileStates={fileStates} schemas={schemas} />
      </div>

      <RecentCompletions fileStates={fileStates} schemas={schemas} />
    </div>
  );
}

export { FileProgress, ImportSummary, ActiveImports, RecentCompletions, ErrorsPanel };
