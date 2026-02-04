import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Upload,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { ONET_PHASES, getSchemasByPhase } from "@/lib/onetSchemas";

/**
 * File status states
 */
export const FILE_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  PARSING: 'parsing',
  IMPORTING: 'importing',
  COMPLETE: 'complete',
  ERROR: 'error'
};

/**
 * Status indicator component
 */
function StatusIndicator({ status, progress, error }) {
  switch (status) {
    case FILE_STATUS.COMPLETE:
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case FILE_STATUS.UPLOADING:
    case FILE_STATUS.PARSING:
    case FILE_STATUS.IMPORTING:
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    case FILE_STATUS.ERROR:
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    default:
      return <Circle className="w-5 h-5 text-slate-300" />;
  }
}

/**
 * Single file row component
 */
function FileRow({
  schema,
  fileState,
  onFileSelect,
  onImport,
  disabled
}) {
  const inputRef = React.useRef(null);
  const { status, file, progress, error, importedCount } = fileState || {
    status: FILE_STATUS.PENDING,
    progress: 0
  };

  const isProcessing = [FILE_STATUS.UPLOADING, FILE_STATUS.PARSING, FILE_STATUS.IMPORTING].includes(status);
  const canImport = file && status === FILE_STATUS.PENDING;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(schema.fileName, selectedFile);
    }
  };

  const formatRowCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
      status === FILE_STATUS.COMPLETE ? 'bg-green-50 border-green-200' :
      status === FILE_STATUS.ERROR ? 'bg-red-50 border-red-200' :
      isProcessing ? 'bg-blue-50 border-blue-200' :
      'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      <StatusIndicator status={status} progress={progress} error={error} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-800 truncate">
            {schema.fileName}
          </span>
          {schema.critical && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
              Critical
            </Badge>
          )}
          {schema.large && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
              Large
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500">
            {formatRowCount(schema.rowCount)} rows
          </span>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-slate-500">
            {schema.entity}
          </span>

          {status === FILE_STATUS.IMPORTING && (
            <>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-blue-600">
                {progress}% ({importedCount || 0} rows)
              </span>
            </>
          )}

          {status === FILE_STATUS.COMPLETE && (
            <>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-green-600">
                {importedCount || schema.rowCount} imported
              </span>
            </>
          )}

          {status === FILE_STATUS.ERROR && (
            <>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-red-600 truncate" title={error}>
                {error}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {file && status !== FILE_STATUS.COMPLETE && (
          <span className="text-xs text-slate-500 truncate max-w-[100px]" title={file.name}>
            {file.name}
          </span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isProcessing}
        />

        {status === FILE_STATUS.ERROR && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isProcessing}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}

        {status !== FILE_STATUS.COMPLETE && status !== FILE_STATUS.ERROR && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isProcessing}
            className="text-xs"
          >
            Choose
          </Button>
        )}

        {canImport && (
          <Button
            size="sm"
            onClick={() => onImport(schema.fileName)}
            disabled={disabled}
            className="text-xs bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="w-3 h-3 mr-1" />
            Import
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Phase section component
 */
function PhaseSection({
  phase,
  phaseInfo,
  schemas,
  fileStates,
  onFileSelect,
  onImport,
  onImportPhase,
  disabled
}) {
  const [expanded, setExpanded] = React.useState(true);

  const phaseComplete = schemas.every(s =>
    fileStates[s.fileName]?.status === FILE_STATUS.COMPLETE
  );

  const phaseHasFiles = schemas.some(s => fileStates[s.fileName]?.file);
  const phaseProcessing = schemas.some(s =>
    [FILE_STATUS.UPLOADING, FILE_STATUS.PARSING, FILE_STATUS.IMPORTING]
      .includes(fileStates[s.fileName]?.status)
  );

  const completedCount = schemas.filter(s =>
    fileStates[s.fileName]?.status === FILE_STATUS.COMPLETE
  ).length;

  return (
    <Card className={`${phaseComplete ? 'border-green-200 bg-green-50/50' : ''}`}>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-left"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
            <CardTitle className="text-sm font-semibold">
              Phase {phase}: {phaseInfo.name}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {completedCount}/{schemas.length}
            </Badge>
          </button>

          {phaseHasFiles && !phaseComplete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onImportPhase(phase)}
              disabled={disabled || phaseProcessing}
              className="text-xs"
            >
              {phaseProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 mr-1" />
                  Import Phase {phase}
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-500 ml-6">{phaseInfo.description}</p>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {schemas.map(schema => (
              <FileRow
                key={schema.fileName}
                schema={schema}
                fileState={fileStates[schema.fileName]}
                onFileSelect={onFileSelect}
                onImport={onImport}
                disabled={disabled}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Main ONetFileList component
 */
export default function ONetFileList({
  fileStates,
  onFileSelect,
  onImport,
  onImportPhase,
  onImportAll,
  disabled = false
}) {
  const phases = Object.entries(ONET_PHASES).map(([num, info]) => ({
    phase: parseInt(num),
    info,
    schemas: getSchemasByPhase(parseInt(num))
  }));

  const totalFiles = Object.keys(fileStates).length;
  const completedFiles = Object.values(fileStates).filter(
    s => s?.status === FILE_STATUS.COMPLETE
  ).length;

  const anyProcessing = Object.values(fileStates).some(s =>
    [FILE_STATUS.UPLOADING, FILE_STATUS.PARSING, FILE_STATUS.IMPORTING].includes(s?.status)
  );

  const allHaveFiles = phases.every(p =>
    p.schemas.some(s => fileStates[s.fileName]?.file)
  );

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm font-medium text-slate-700">
              Files Ready: {Object.values(fileStates).filter(s => s?.file).length} / 40
            </div>
            <div className="text-xs text-slate-500">
              Completed: {completedFiles} / 40
            </div>
          </div>
        </div>

        {allHaveFiles && completedFiles < 40 && (
          <Button
            onClick={onImportAll}
            disabled={disabled || anyProcessing}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {anyProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import All Phases
              </>
            )}
          </Button>
        )}
      </div>

      {/* Phase sections */}
      {phases.map(({ phase, info, schemas }) => (
        <PhaseSection
          key={phase}
          phase={phase}
          phaseInfo={info}
          schemas={schemas}
          fileStates={fileStates}
          onFileSelect={onFileSelect}
          onImport={onImport}
          onImportPhase={onImportPhase}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export { FileRow, PhaseSection, StatusIndicator };
