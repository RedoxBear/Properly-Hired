import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Info
} from "lucide-react";
import { isAdmin } from "@/components/utils/accessControl";
import { useNavigate } from "react-router-dom";
import ONetFileList, { FILE_STATUS } from "@/components/onet/ONetFileList";
import ONetImportProgress from "@/components/onet/ONetImportProgress";
import ONetAttribution from "@/components/onet/ONetAttribution";
import { onetDataService } from "@/components/onet/ONetDataService";
import {
  ONET_SCHEMAS,
  ONET_PHASES,
  getSchemaByFileName,
  getSchemasByPhase,
  getImportOrder,
  parseCSVWithSchema,
  validateRecords
} from "@/lib/onetSchemas";

const BATCH_SIZE = 50;
const UPLOAD_STORAGE_KEY = 'onet_upload_queue';
const IMPORTED_RECORDS_KEY = 'onet_imported_record_ids';
const TOTAL_ONET_FILES = Object.keys(ONET_SCHEMAS).length;

const aggregateImportedCountByEntity = (queue = {}) => {
  const totals = {};

  Object.values(queue).forEach((entry) => {
    if (!entry || entry.status !== FILE_STATUS.COMPLETE || !entry.entity) return;
    totals[entry.entity] = (totals[entry.entity] || 0) + (entry.importedCount || 0);
  });

  return totals;
};

// Helper functions for localStorage persistence
const getUploadQueue = () => {
  try {
    const stored = localStorage.getItem(UPLOAD_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Failed to read upload queue:", e);
    return {};
  }
};

const saveUploadQueue = (queue) => {
  try {
    localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to save upload queue:", e);
  }
};

const getImportedRecordIds = () => {
  try {
    const stored = localStorage.getItem(IMPORTED_RECORDS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Failed to read imported records:", e);
    return {};
  }
};

const saveImportedRecordIds = (records) => {
  try {
    localStorage.setItem(IMPORTED_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Failed to save imported records:", e);
  }
};

export default function ONetImport() {
  const navigate = useNavigate();
  const [isCheckingAccess, setIsCheckingAccess] = React.useState(true);
  const [error, setError] = React.useState("");
  const [fileStates, setFileStates] = React.useState({});
  const [apiStatus, setApiStatus] = React.useState(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [dbStats, setDbStats] = React.useState(null);
  const [verificationInProgress, setVerificationInProgress] = React.useState(false);
  const [importStats, setImportStats] = React.useState(null);
  const [totalProgress, setTotalProgress] = React.useState(0);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [matchedFiles, setMatchedFiles] = React.useState([]);
  const [unmatchedFiles, setUnmatchedFiles] = React.useState([]);
  const [uploadQueue, setUploadQueue] = React.useState(getUploadQueue());
  const [importedRecordIds, setImportedRecordIds] = React.useState(getImportedRecordIds());
  const folderInputRef = React.useRef(null);

  const completedImports = React.useMemo(
    () => Object.entries(uploadQueue)
      .filter(([, value]) => value?.status === FILE_STATUS.COMPLETE)
      .sort((a, b) => new Date(b[1].importedAt || 0) - new Date(a[1].importedAt || 0)),
    [uploadQueue]
  );

  const totalImportedRows = React.useMemo(
    () => completedImports.reduce((sum, [, value]) => sum + (value?.importedCount || 0), 0),
    [completedImports]
  );

  React.useEffect(() => {
    checkAccess();
    checkApiStatus();
    loadDbStats();
  }, []);

  const checkAccess = async () => {
    setIsCheckingAccess(true);
    try {
      const user = await base44.auth.me();
      if (!isAdmin(user)) {
        setError("Access Denied: Admin privileges required.");
        setTimeout(() => navigate("/Dashboard"), 2000);
        return;
      }
    } catch (e) {
      console.error("Error checking access:", e);
      setError("Failed to verify access. Redirecting...");
      setTimeout(() => navigate("/Dashboard"), 2000);
      return;
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const checkApiStatus = async () => {
    try {
      await base44.functions.invoke('queryONetAPI', {
        endpoint: '/online/search',
        params: { keyword: 'test' }
      });
      setApiStatus({ available: true });
      onetDataService.resetApiStatus();
    } catch (e) {
      setApiStatus({ available: false, error: e.message });
    }
  };

  const loadDbStats = async () => {
    try {
      const entities = ['ONetOccupation', 'ONetSkill', 'ONetAbility', 'ONetKnowledge',
                        'ONetTask', 'ONetWorkActivity', 'ONetWorkContext', 'ONetReference'];
      const stats = {};
      let totalRecords = 0;
      let entitiesWithData = 0;
      const expectedRecordCounts = {
        'ONetReference': 630,         // Phase 1 reference tables
        'ONetOccupation': 968,        // Phase 2 occupation count
        'ONetSkill': 35,              // Phase 3 skill count
        'ONetAbility': 52,            // Phase 3 ability count
        'ONetKnowledge': 34,          // Phase 3 knowledge count
        'ONetTask': 15000,            // Phase 4 task count
        'ONetWorkActivity': 41,       // Phase 5 work activity count
        'ONetWorkContext': 40         // Phase 5 work context count
      };

      // Map entities to phases
      const entityPhases = {
        'ONetReference': 1,
        'ONetOccupation': 2,
        'ONetSkill': 3,
        'ONetAbility': 3,
        'ONetKnowledge': 3,
        'ONetTask': 4,
        'ONetWorkActivity': 5,
        'ONetWorkContext': 5
      };

      // Get actual counts
      const queueImportedByEntity = aggregateImportedCountByEntity(uploadQueue);
      for (const entityName of entities) {
        try {
          const entity = base44.entities[entityName];
          if (entity) {
            const records = await entity.list('-created_date', 1000);
            const count = records.length;
            const queueCount = queueImportedByEntity[entityName] || 0;
            const effectiveCount = Math.max(count, queueCount);
            const expected = expectedRecordCounts[entityName] || 100;
            const percentage = Math.round((effectiveCount / expected) * 100);
            const phase = entityPhases[entityName];

            stats[entityName] = {
              status: effectiveCount > 0 ? 'has_data' : 'empty',
              count: effectiveCount,
              expected: expected,
              percentage: Math.min(percentage, 100),
              phase: phase,
              displayString: `${effectiveCount} / ${expected} = ${Math.min(percentage, 100)}%`
            };
            if (effectiveCount > 0) {
              totalRecords += effectiveCount;
              entitiesWithData++;
            }
          }
        } catch (e) {
          const expected = expectedRecordCounts[entityName] || 100;
          stats[entityName] = {
            status: 'error',
            count: 0,
            expected: expected,
            percentage: 0,
            phase: entityPhases[entityName],
            displayString: `0 / ${expected} = 0%`,
            error: e.message
          };
        }
      }

      // Calculate overall percentage
      const totalExpected = Object.values(expectedRecordCounts).reduce((a, b) => a + b, 0);
      const overallPercentage = Math.round((totalRecords / totalExpected) * 100);

      // Calculate per-phase stats
      const phaseStats = {};
      for (let phase = 1; phase <= 5; phase++) {
        const phaseEntities = Object.entries(stats).filter(([_, data]) => data.phase === phase);
        const phaseRecords = phaseEntities.reduce((sum, [_, data]) => sum + data.count, 0);
        const phaseExpected = phaseEntities.reduce((sum, [_, data]) => sum + data.expected, 0);
        const phasePercentage = phaseExpected > 0 ? Math.round((phaseRecords / phaseExpected) * 100) : 0;

        phaseStats[phase] = {
          records: phaseRecords,
          expected: phaseExpected,
          percentage: phasePercentage,
          displayString: `${phaseRecords} / ${phaseExpected} = ${phasePercentage}%`,
          entities: phaseEntities.map(([name, data]) => ({ name, ...data }))
        };
      }

      setDbStats({ ...stats, totalRecords, overallPercentage, phaseStats });
      return { stats, totalRecords, entitiesWithData, totalEntities: entities.length, overallPercentage, phaseStats };
    } catch (e) {
      console.error("Failed to load DB stats:", e);
      return null;
    }
  };

  const verifyImportedData = async () => {
    setVerificationInProgress(true);
    try {
      const result = await loadDbStats();
      if (result) {
        setImportStats({
          totalRecords: result.totalRecords,
          entitiesWithData: result.entitiesWithData,
          totalEntities: result.totalEntities,
          isComplete: result.entitiesWithData === result.totalEntities && result.totalRecords > 0,
          timestamp: new Date().toISOString(),
          details: result.stats
        });
      }
    } catch (e) {
      console.error("Failed to verify import:", e);
      setError("Failed to verify imported data");
    } finally {
      setVerificationInProgress(false);
    }
  };

  const updateFileState = (fileName, updates) => {
    setFileStates(prev => ({
      ...prev,
      [fileName]: { ...prev[fileName], ...updates }
    }));
  };

  const handleFileSelect = (fileName, file) => {
    const nextQueue = {
      ...uploadQueue,
      [fileName]: {
        ...(uploadQueue[fileName] || {}),
        fileName,
        sourceFileName: file.name,
        fileSize: file.size,
        fileLastModified: file.lastModified,
        selectedAt: new Date().toISOString(),
        status: FILE_STATUS.PENDING
      }
    };

    saveUploadQueue(nextQueue);
    setUploadQueue(nextQueue);

    updateFileState(fileName, {
      file,
      status: FILE_STATUS.PENDING,
      error: null,
      progress: 0,
      importedCount: 0
    });
    setError("");
  };

  const importFile = async (fileName) => {
    const state = fileStates[fileName];
    if (!state?.file) return;

    const existingImport = uploadQueue[fileName];
    if (existingImport?.status === FILE_STATUS.COMPLETE) {
      updateFileState(fileName, {
        status: FILE_STATUS.COMPLETE,
        progress: 100,
        importedCount: existingImport.importedCount || 0,
        skippedCount: existingImport.skippedCount || 0,
        failedCount: existingImport.failedCount || 0,
        summary: `Already imported on ${new Date(existingImport.importedAt).toLocaleString()}`
      });
      return;
    }

    const schema = getSchemaByFileName(fileName);
    if (!schema) {
      updateFileState(fileName, {
        status: FILE_STATUS.ERROR,
        error: `Unknown file type: ${fileName}`
      });
      return;
    }

    const startTime = Date.now();
    updateFileState(fileName, {
      status: FILE_STATUS.PARSING,
      startTime,
      progress: 0
    });

    try {
      // Read file content
      const text = await state.file.text();

      // Parse CSV using schema
      const records = parseCSVWithSchema(text, schema);

      // Validate records
      const validation = validateRecords(records, schema);
      if (!validation.valid && validation.errors.length > 0) {
        console.warn(`Validation warnings for ${fileName}:`, validation.errors);
      }

      if (records.length === 0) {
        throw new Error("No valid records found in file");
      }

      updateFileState(fileName, {
        status: FILE_STATUS.IMPORTING,
        progress: 0
      });

      // Get target entity
      const entityName = schema.entity;
      const entity = base44.entities[entityName];

      if (!entity) {
        throw new Error(`Entity ${entityName} not found. Please ensure it exists in Base44.`);
      }

      // Load previously imported records to detect duplicates
      const importedIds = getImportedRecordIds();
      const entityImportedIds = importedIds[entityName] || {};

      // Batch import using individual creates
      let importedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      const totalRecords = records.length;
      const newImportedIds = { ...entityImportedIds };

      for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        // Process each record individually for reliability
        for (let j = 0; j < batch.length; j++) {
          const record = batch[j];
          const recordId = record.id || record.code || record.title; // Use unique identifier

          try {
            // Check if already imported (duplicate detection)
            if (newImportedIds[recordId]) {
              skippedCount++;
              console.log(`Record ${recordId} already imported, skipping`);
            } else {
              await entity.create(record);
              importedCount++;
              newImportedIds[recordId] = true;
            }
          } catch (recordError) {
            failedCount++;
            const recordIndex = i + j;
            console.warn(`Record ${recordIndex} insert failed:`, recordError.message, record);
            // Continue with next record instead of stopping
          }
        }

        // Update progress after each batch
        const progress = Math.round(((importedCount + skippedCount) / totalRecords) * 100);
        updateFileState(fileName, {
          progress,
          importedCount,
          skippedCount,
          failedCount
        });
      }

      // Save imported record IDs to prevent duplicates on resume
      importedIds[entityName] = newImportedIds;
      saveImportedRecordIds(importedIds);
      setImportedRecordIds(importedIds);

      const status = failedCount > 0 ? FILE_STATUS.COMPLETE : FILE_STATUS.COMPLETE;
      const summary = skippedCount > 0
        ? `Imported ${importedCount} new, skipped ${skippedCount} duplicates (${failedCount} failed)`
        : failedCount > 0
        ? `Imported ${importedCount} of ${totalRecords} records (${failedCount} failed)`
        : `Successfully imported all ${importedCount} records`;

      updateFileState(fileName, {
        status,
        progress: 100,
        importedCount,
        skippedCount,
        failedCount,
        summary,
        endTime: Date.now()
      });

      const completedImport = {
        ...(uploadQueue[fileName] || {}),
        fileName,
        sourceFileName: state.file.name,
        fileSize: state.file.size,
        fileLastModified: state.file.lastModified,
        status,
        entity: entityName,
        expectedRows: schema.rowCount,
        importedCount,
        skippedCount,
        failedCount,
        importedAt: new Date().toISOString(),
        summary
      };

      const nextQueue = {
        ...uploadQueue,
        [fileName]: completedImport
      };
      saveUploadQueue(nextQueue);
      setUploadQueue(nextQueue);

      // Refresh DB stats
      loadDbStats();

    } catch (e) {
      console.error(`Import failed for ${fileName}:`, e);

      const failedImport = {
        ...(uploadQueue[fileName] || {}),
        fileName,
        sourceFileName: state.file.name,
        fileSize: state.file.size,
        fileLastModified: state.file.lastModified,
        status: FILE_STATUS.ERROR,
        error: e.message,
        failedAt: new Date().toISOString()
      };
      const nextQueue = {
        ...uploadQueue,
        [fileName]: failedImport
      };
      saveUploadQueue(nextQueue);
      setUploadQueue(nextQueue);

      updateFileState(fileName, {
        status: FILE_STATUS.ERROR,
        error: e.message,
        endTime: Date.now()
      });
    }
  };

  const handleImport = async (fileName) => {
    setIsImporting(true);
    try {
      await importFile(fileName);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportPhase = async (phase) => {
    const schemas = getSchemasByPhase(phase);
    const filesToImport = schemas.filter(s =>
      fileStates[s.fileName]?.file &&
      fileStates[s.fileName]?.status !== FILE_STATUS.COMPLETE
    );

    if (filesToImport.length === 0) return;

    setIsImporting(true);
    try {
      let completed = 0;
      for (const schema of filesToImport) {
        await importFile(schema.fileName);
        completed++;
        // Update overall progress
        setTotalProgress(Math.round((completed / filesToImport.length) * 100));
      }
      // Verify data after phase import
      await verifyImportedData();
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportAll = async () => {
    const importOrder = getImportOrder();
    const filesToImport = importOrder.filter(s =>
      fileStates[s.fileName]?.file &&
      fileStates[s.fileName]?.status !== FILE_STATUS.COMPLETE
    );

    if (filesToImport.length === 0) return;

    setIsImporting(true);
    setTotalProgress(0);
    try {
      let completed = 0;
      for (const schema of filesToImport) {
        await importFile(schema.fileName);
        completed++;
        // Update overall progress
        setTotalProgress(Math.round((completed / filesToImport.length) * 100));
      }
      // Verify data after all imports complete
      await verifyImportedData();
    } finally {
      setIsImporting(false);
    }
  };

  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const matched = [];
    const unmatched = [];

    // Try to match each file to a schema by filename
    files.forEach(file => {
      const schema = getSchemaByFileName(file.name);
      if (schema) {
        matched.push({ file, schema, fileName: schema.fileName });
      } else {
        unmatched.push({ fileName: file.name });
      }
    });

    // Set file states for matched files
    const newFileStates = { ...fileStates };
    matched.forEach(({ file, fileName }) => {
      newFileStates[fileName] = {
        file,
        status: FILE_STATUS.PENDING,
        error: null,
        progress: 0,
        importedCount: 0
      };
    });
    setFileStates(newFileStates);

    setMatchedFiles(matched);
    setUnmatchedFiles(unmatched);
    setPreviewMode(true);
    setError("");

    // Reset file input
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  const confirmAndImportAll = async () => {
    if (matchedFiles.length === 0) return;

    setPreviewMode(false);
    await handleImportAll();
  };

  const cancelPreview = () => {
    setPreviewMode(false);
    setMatchedFiles([]);
    setUnmatchedFiles([]);
    setFileStates({});
  };

  const handleClearAllData = async () => {
    if (!confirm("This will delete ALL O*NET data from the database AND reset upload tracking. Are you sure?")) {
      return;
    }

    setIsImporting(true);
    try {
      const entities = ['ONetOccupation', 'ONetSkill', 'ONetAbility', 'ONetKnowledge',
                        'ONetTask', 'ONetWorkActivity', 'ONetWorkContext', 'ONetReference'];

      for (const entityName of entities) {
        try {
          const entity = base44.entities[entityName];
          if (!entity) continue;

          // Keep deleting in chunks until no records remain.
          while (true) {
            const records = await entity.list('-created_date', 1000);
            if (!records.length) break;

            for (const record of records) {
              try {
                await entity.delete(record.id);
              } catch (e) {
                console.warn(`Failed to delete ${entityName} record:`, e);
              }
            }

            if (records.length < 1000) break;
          }
        } catch (e) {
          console.warn(`Failed to clear ${entityName}:`, e);
        }
      }

      // Clear upload tracking
      setFileStates({});
      localStorage.removeItem(UPLOAD_STORAGE_KEY);
      localStorage.removeItem(IMPORTED_RECORDS_KEY);
      setUploadQueue({});
      setImportedRecordIds({});

      loadDbStats();
    } finally {
      setIsImporting(false);
    }
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Verifying access...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
            <Database className="w-4 h-4" /> Admin Only
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">O*NET Data Import</h1>
          <p className="text-slate-600">Import all 40 O*NET CSV files with proper ordering and validation</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* API Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {apiStatus?.available ? (
                    <div className="p-2 rounded-lg bg-green-100">
                      <Wifi className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-red-100">
                      <WifiOff className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">O*NET API</div>
                    <div className="text-xs text-slate-500">
                      {apiStatus?.available ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkApiStatus}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* DB Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Database Status</div>
                  {dbStats && (
                    <div className="mt-2 space-y-2">
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${dbStats.overallPercentage >= 80 ? 'bg-green-600' : dbStats.overallPercentage >= 40 ? 'bg-yellow-600' : 'bg-red-600'}`}
                          style={{ width: `${Math.min(dbStats.overallPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {dbStats.overallPercentage}% Complete
                        </span>
                        <span className="text-xs text-slate-600">
                          {dbStats.totalRecords?.toLocaleString() || 0} records
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium">Actions</div>
                  <div className="text-xs text-slate-500">Manage or verify data</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={verifyImportedData}
                    disabled={isImporting || verificationInProgress}
                    className="text-xs"
                  >
                    {verificationInProgress ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Verifying
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Verify
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAllData}
                    disabled={isImporting}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">O*NET Intake Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 border">
                <div className="text-xs text-slate-500">Files imported</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {completedImports.length}/{TOTAL_ONET_FILES}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border">
                <div className="text-xs text-slate-500">Rows imported</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {totalImportedRows.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border">
                <div className="text-xs text-slate-500">Most recent import</div>
                <div className="text-sm font-semibold text-slate-800">
                  {completedImports[0]?.[1]?.importedAt
                    ? new Date(completedImports[0][1].importedAt).toLocaleString()
                    : 'Not yet imported'}
                </div>
              </div>
            </div>

            {completedImports.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 text-xs font-semibold text-slate-600">
                  <div className="col-span-4">File</div>
                  <div className="col-span-2">Entity</div>
                  <div className="col-span-2 text-right">Imported</div>
                  <div className="col-span-2 text-right">Skipped</div>
                  <div className="col-span-2">Imported at</div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {completedImports.map(([fileName, data]) => (
                    <div key={fileName} className="grid grid-cols-12 gap-2 p-3 border-t text-xs">
                      <div className="col-span-4">
                        <div className="font-medium text-slate-800">{fileName}</div>
                        <div className="text-slate-500 truncate" title={data.sourceFileName}>
                          Source: {data.sourceFileName || 'Unknown'}
                        </div>
                      </div>
                      <div className="col-span-2 text-slate-700">{data.entity || '-'}</div>
                      <div className="col-span-2 text-right text-green-700 font-medium">
                        {(data.importedCount || 0).toLocaleString()}
                      </div>
                      <div className="col-span-2 text-right text-amber-700 font-medium">
                        {(data.skippedCount || 0).toLocaleString()}
                      </div>
                      <div className="col-span-2 text-slate-600">
                        {data.importedAt ? new Date(data.importedAt).toLocaleString() : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No completed imports tracked yet. Once files are imported, this section will show exactly what was loaded so you can avoid duplicate uploads.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Overall Import Progress Bar */}
        {isImporting && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-blue-900">Overall Import Progress</div>
                <div className="text-sm font-semibold text-blue-700">{totalProgress}%</div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              {isImporting && (
                <div className="flex items-center gap-2 mt-3 text-sm text-blue-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing files...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Database Status by Phase */}
        {dbStats && (
          <Card className={dbStats.overallPercentage >= 80 ? 'bg-green-50 border-green-200' : dbStats.overallPercentage >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}>
            <CardHeader>
              <CardTitle className={`text-base flex items-center gap-2 ${dbStats.overallPercentage >= 80 ? 'text-green-900' : dbStats.overallPercentage >= 40 ? 'text-yellow-900' : 'text-red-900'}`}>
                {dbStats.overallPercentage >= 80 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                O*NET Database Status: {dbStats.overallPercentage}% Complete ({dbStats.totalRecords?.toLocaleString() || 0} records)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Summary by Phase */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700 mb-3">Progress by Phase:</div>

                  {/* Phase 1: Reference */}
                  <div className="p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">Phase 1: Reference Tables</div>
                      <span className={`text-xs font-bold ${dbStats.ONetReference?.percentage >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {dbStats.ONetReference?.displayString || '0 / 0 = 0%'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${dbStats.ONetReference?.percentage >= 80 ? 'bg-green-600' : 'bg-yellow-600'}`}
                        style={{ width: `${Math.min(dbStats.ONetReference?.percentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Phase 2: Occupations */}
                  <div className="p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">Phase 2: Occupations</div>
                      <span className={`text-xs font-bold ${dbStats.ONetOccupation?.percentage >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {dbStats.ONetOccupation?.displayString || '0 / 0 = 0%'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${dbStats.ONetOccupation?.percentage >= 80 ? 'bg-green-600' : 'bg-yellow-600'}`}
                        style={{ width: `${Math.min(dbStats.ONetOccupation?.percentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Phase 3: Core Competencies */}
                  {(() => {
                    const phase3Average = Math.round((
                      (dbStats.ONetSkill?.percentage || 0) +
                      (dbStats.ONetAbility?.percentage || 0) +
                      (dbStats.ONetKnowledge?.percentage || 0)
                    ) / 3);

                    return (
                      <div className="p-3 bg-white rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm">Phase 3: Skills, Abilities, Knowledge</div>
                          <span className={`text-xs font-bold ${phase3Average >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {phase3Average}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${phase3Average >= 80 ? 'bg-green-600' : 'bg-yellow-600'}`}
                            style={{ width: `${Math.min(phase3Average, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                          <div>Skills: {dbStats.ONetSkill?.displayString || '0 / 0 = 0%'}</div>
                          <div>Abilities: {dbStats.ONetAbility?.displayString || '0 / 0 = 0%'}</div>
                          <div>Knowledge: {dbStats.ONetKnowledge?.displayString || '0 / 0 = 0%'}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Phase 4: Tasks */}
                  <div className="p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">Phase 4: Tasks</div>
                      <span className={`text-xs font-bold ${dbStats.ONetTask?.percentage >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {dbStats.ONetTask?.displayString || '0 / 0 = 0%'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${dbStats.ONetTask?.percentage >= 80 ? 'bg-green-600' : 'bg-yellow-600'}`}
                        style={{ width: `${Math.min(dbStats.ONetTask?.percentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Phase 5: Work Activities & Context */}
                  <div className="p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">Phase 5: Work Activities & Context</div>
                      <span className={`text-xs font-bold ${(dbStats.ONetWorkActivity?.percentage + dbStats.ONetWorkContext?.percentage) / 2 >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {Math.round((dbStats.ONetWorkActivity?.percentage || 0 + dbStats.ONetWorkContext?.percentage || 0) / 2)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${(dbStats.ONetWorkActivity?.percentage || 0 + dbStats.ONetWorkContext?.percentage || 0) / 2 >= 80 ? 'bg-green-600' : 'bg-yellow-600'}`}
                        style={{ width: `${Math.min((dbStats.ONetWorkActivity?.percentage || 0 + dbStats.ONetWorkContext?.percentage || 0) / 2, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                      <div>Work Activities: {dbStats.ONetWorkActivity?.displayString || '0 / 0 = 0%'}</div>
                      <div>Work Context: {dbStats.ONetWorkContext?.displayString || '0 / 0 = 0%'}</div>
                    </div>
                  </div>

                  {/* Overall Summary */}
                  <div className="p-3 bg-white rounded border-l-4 mt-2" style={{
                    borderColor: dbStats.overallPercentage >= 80 ? '#16a34a' : dbStats.overallPercentage >= 40 ? '#ca8a04' : '#dc2626'
                  }}>
                    <div className="text-sm font-medium">
                      Overall: {dbStats.overallPercentage}% Complete
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {dbStats.overallPercentage >= 80 ? '✓ Most phases have sufficient data' :
                       dbStats.overallPercentage >= 40 ? '⚠ Some phases incomplete - re-upload to complete' :
                       '✗ Minimal data - start fresh import'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Results */}
        {importStats && (
          <Card className={importStats.isComplete ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${importStats.isComplete ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {importStats.isComplete ? (
                    <CheckCircle2 className={`w-5 h-5 ${importStats.isComplete ? 'text-green-600' : 'text-yellow-600'}`} />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${importStats.isComplete ? 'text-green-900' : 'text-yellow-900'}`}>
                    {importStats.isComplete ? 'Import Complete ✓' : 'Partial Import'}
                  </div>
                  <div className={`text-sm mt-1 ${importStats.isComplete ? 'text-green-700' : 'text-yellow-700'}`}>
                    {importStats.totalRecords.toLocaleString()} records loaded across {importStats.entitiesWithData} of {importStats.totalEntities} entities
                  </div>
                  {importStats.details && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {Object.entries(importStats.details).map(([entity, data]) => (
                        <div key={entity} className="p-2 bg-white rounded">
                          <div className="font-medium truncate">{entity}</div>
                          <div className={data.status === 'has_data' ? 'text-green-600' : data.status === 'error' ? 'text-red-600' : 'text-gray-500'}>
                            {data.count.toLocaleString()} records
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Progress */}
        <ONetImportProgress fileStates={fileStates} schemas={ONET_SCHEMAS} />

        {/* Instructions */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Import Instructions
            </h3>
            <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
              <li>Download O*NET database CSV files from <a href="https://www.onetcenter.org/database.html#individual-files" target="_blank" rel="noopener noreferrer" className="underline">onetcenter.org</a></li>
              <li>Import in order: Phase 1 (Reference) Phase 2 (Occupations) Phase 3-7</li>
              <li>Phase 2 Occupation_Data.csv is CRITICAL - required for all other data</li>
              <li>Large files (Task_Ratings, Work_Context) may take several minutes</li>
              <li>Files are auto-detected by filename - use original O*NET names</li>
            </ol>
          </CardContent>
        </Card>

        {/* Batch Folder Upload */}
        {!previewMode && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Batch Upload from Folder</h3>
                  <p className="text-sm text-blue-700">Select your O*NET CSV folder to auto-match and preview all files</p>
                </div>
                <div>
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    webkitdirectory="true"
                    onChange={handleFolderSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => folderInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Folder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Mode */}
        {previewMode && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Import Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {matchedFiles.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Matched Files ({matchedFiles.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {matchedFiles.map((item, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-green-200">
                        <div className="text-sm font-medium text-green-800 truncate">{item.file.name}</div>
                        <div className="text-xs text-green-700">→ {item.schema.entity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unmatchedFiles.length > 0 && (
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">Unmatched Files ({unmatchedFiles.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {unmatchedFiles.map((item, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-amber-200">
                        <div className="text-sm text-amber-800 truncate">{item.fileName}</div>
                        <div className="text-xs text-amber-600">Not recognized</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-green-200">
                <Button
                  onClick={confirmAndImportAll}
                  disabled={matchedFiles.length === 0 || isImporting}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm & Import All ({matchedFiles.length} files)
                    </>
                  )}
                </Button>
                <Button
                  onClick={cancelPreview}
                  disabled={isImporting}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File List */}
        <ONetFileList
          fileStates={fileStates}
          onFileSelect={handleFileSelect}
          onImport={handleImport}
          onImportPhase={handleImportPhase}
          onImportAll={handleImportAll}
          disabled={isImporting}
        />

        {/* Entity Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Entity Mapping Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div>
                <Badge className="mb-2 bg-blue-600">ONetOccupation</Badge>
                <p className="text-slate-600">Occupation_Data, Alternate_Titles, Job_Zones, Related_Occupations</p>
              </div>
              <div>
                <Badge className="mb-2 bg-green-600">ONetSkill</Badge>
                <p className="text-slate-600">Skills, Skills_to_Work_Activities</p>
              </div>
              <div>
                <Badge className="mb-2 bg-purple-600">ONetAbility</Badge>
                <p className="text-slate-600">Abilities, Abilities_to_Work_Activities</p>
              </div>
              <div>
                <Badge className="mb-2 bg-amber-600">ONetKnowledge</Badge>
                <p className="text-slate-600">Knowledge</p>
              </div>
              <div>
                <Badge className="mb-2 bg-red-600">ONetTask</Badge>
                <p className="text-slate-600">Task_Statements, Task_Ratings, Emerging_Tasks, Tasks_to_DWAs</p>
              </div>
              <div>
                <Badge className="mb-2 bg-cyan-600">ONetWorkActivity</Badge>
                <p className="text-slate-600">Work_Activities, IWA_Reference, DWA_Reference</p>
              </div>
              <div>
                <Badge className="mb-2 bg-indigo-600">ONetWorkContext</Badge>
                <p className="text-slate-600">Work_Context, Work_Context_Categories</p>
              </div>
              <div>
                <Badge className="mb-2 bg-slate-600">ONetReference</Badge>
                <p className="text-slate-600">Content_Model_Reference, Scales_Reference, Interests, Work_Styles, etc.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attribution */}
        <ONetAttribution />
      </div>
    </div>
  );
}
