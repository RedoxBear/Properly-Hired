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

const RECORD_KEY_CANDIDATES = [
  'soc_code',
  'element_id',
  'task_id',
  'commodity_code',
  'iwa_id',
  'dwa_id',
  'scale_id',
  'category',
  'title',
  'alternate_title',
  'description'
];

const buildRecordKey = (record, fileName, index) => {
  const keyParts = RECORD_KEY_CANDIDATES
    .filter(field => record[field] !== undefined && record[field] !== null && String(record[field]).trim() !== '')
    .slice(0, 4)
    .map(field => `${field}:${record[field]}`);

  if (keyParts.length > 0) {
    return `${fileName}|${keyParts.join('|')}`;
  }

  const fallback = JSON.stringify(record);
  return `${fileName}|row:${index}|${fallback}`;
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

const updateUploadQueueState = (setUploadQueue, updater) => {
  setUploadQueue(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    saveUploadQueue(next);
    return next;
  });
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


  const latestBatchStatus = React.useMemo(() => {
    const entries = Object.entries(uploadQueue).filter(([, value]) => value?.batchId);
    if (entries.length === 0) return null;

    const batches = entries.reduce((acc, [fileName, value]) => {
      const batchId = value.batchId;
      if (!acc[batchId]) {
        acc[batchId] = {
          batchId,
          files: [],
          latestTimestamp: 0
        };
      }

      const timestamp = new Date(value.selectedAt || value.importedAt || 0).getTime();
      if (timestamp > acc[batchId].latestTimestamp) {
        acc[batchId].latestTimestamp = timestamp;
      }

      acc[batchId].files.push({ fileName, ...value });
      return acc;
    }, {});

    const latestBatch = Object.values(batches)
      .sort((a, b) => b.latestTimestamp - a.latestTimestamp)[0];

    const counts = latestBatch.files.reduce((summary, file) => {
      const status = file.status || FILE_STATUS.PENDING;
      if (status === FILE_STATUS.COMPLETE) summary.complete += 1;
      else if (status === FILE_STATUS.ERROR) summary.error += 1;
      else if ([FILE_STATUS.IMPORTING, FILE_STATUS.PARSING, FILE_STATUS.UPLOADING].includes(status)) summary.processing += 1;
      else summary.pending += 1;
      return summary;
    }, { total: latestBatch.files.length, complete: 0, error: 0, processing: 0, pending: 0 });

    let label = 'Pending';
    if (counts.error > 0) label = 'Needs Attention';
    else if (counts.complete === counts.total && counts.total > 0) label = 'Confirmed Complete';
    else if (counts.processing > 0 || counts.pending > 0) label = 'In Progress';

    return {
      batchId: latestBatch.batchId,
      latestTimestamp: latestBatch.latestTimestamp,
      counts,
      label
    };
  }, [uploadQueue]);

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
        'ONetOccupation': 968,        // Typical O*NET occupation count
        'ONetSkill': 35,              // Typical skill count
        'ONetAbility': 52,            // Typical ability count
        'ONetKnowledge': 34,          // Typical knowledge count
        'ONetTask': 15000,            // Typical task count (varies)
        'ONetWorkActivity': 41,       // Typical work activity count
        'ONetWorkContext': 40,        // Typical work context count
        'ONetReference': 50           // Typical reference count
      };

      for (const entityName of entities) {
        try {
          const entity = base44.entities[entityName];
          if (entity) {
            // Get count of records (fetch all to get actual count)
            const records = await entity.list('-created_date', 1000);
            const count = records.length;
            const expected = expectedRecordCounts[entityName] || 100;
            const percentage = Math.round((count / expected) * 100);
            stats[entityName] = {
              status: count > 0 ? 'has_data' : 'empty',
              count: count,
              expected: expected,
              percentage: Math.min(percentage, 100)
            };
            if (count > 0) {
              totalRecords += count;
              entitiesWithData++;
            }
          }
        } catch (e) {
          stats[entityName] = { status: 'error', count: 0, expected: 0, percentage: 0, error: e.message };
        }
      }

      // Calculate overall percentage
      const totalExpected = Object.values(expectedRecordCounts).reduce((a, b) => a + b, 0);
      const overallPercentage = Math.round((totalRecords / totalExpected) * 100);

      setDbStats({ ...stats, totalRecords, overallPercentage });
      return { stats, totalRecords, entitiesWithData, totalEntities: entities.length, overallPercentage };
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
    updateUploadQueueState(setUploadQueue, prev => ({
      ...prev,
      [fileName]: {
        ...(prev[fileName] || {}),
        fileName,
        sourceFileName: file.name,
        fileSize: file.size,
        fileLastModified: file.lastModified,
        selectedAt: new Date().toISOString(),
        batchId: `manual_${Date.now()}`,
        status: FILE_STATUS.PENDING
      }
    }));

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

    const existingImport = getUploadQueue()[fileName];
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
      const fileImportedIds = importedIds[fileName] || {};

      // Backward compatibility for legacy entity-level tracking
      const legacyEntityImportedIds = importedIds[entityName] || {};

      // Batch import using individual creates
      let importedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      const totalRecords = records.length;
      const newImportedIds = { ...legacyEntityImportedIds, ...fileImportedIds };

      for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        // Process each record individually for reliability
        for (let j = 0; j < batch.length; j++) {
          const record = batch[j];
          const recordId = buildRecordKey(record, fileName, i + j);

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
      importedIds[fileName] = newImportedIds;
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

      updateUploadQueueState(setUploadQueue, prev => ({
        ...prev,
        [fileName]: {
          ...(prev[fileName] || {}),
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
        }
      }));

      // Refresh DB stats
      loadDbStats();

    } catch (e) {
      console.error(`Import failed for ${fileName}:`, e);

      updateUploadQueueState(setUploadQueue, prev => ({
        ...prev,
        [fileName]: {
          ...(prev[fileName] || {}),
          fileName,
          sourceFileName: state.file.name,
          fileSize: state.file.size,
          fileLastModified: state.file.lastModified,
          status: FILE_STATUS.ERROR,
          error: e.message,
          failedAt: new Date().toISOString()
        }
      }));

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

    const batchId = `batch_${Date.now()}`;
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

    if (matched.length > 0) {
      updateUploadQueueState(setUploadQueue, prev => {
        const next = { ...prev };
        matched.forEach(({ file, fileName }) => {
          next[fileName] = {
            ...(next[fileName] || {}),
            fileName,
            sourceFileName: file.name,
            fileSize: file.size,
            fileLastModified: file.lastModified,
            selectedAt: new Date().toISOString(),
            batchId,
            status: next[fileName]?.status === FILE_STATUS.COMPLETE ? FILE_STATUS.COMPLETE : FILE_STATUS.PENDING
          };
        });
        return next;
      });
    }

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
          if (entity) {
            const records = await entity.list('-created_date', 1000);
            for (const record of records) {
              try {
                await entity.delete(record.id);
              } catch (e) {
                console.warn(`Failed to delete ${entityName} record:`, e);
              }
            }
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
                  <div className="font-medium">Database Status</div>
                  <div className="text-xs text-slate-500">
                    {dbStats ? Object.values(dbStats).filter(s => s.status === 'has_data').length : 0}/8 entities
                  </div>
                  {dbStats && (
                    <div className="mt-1 space-y-1">
                      <div className="text-xs font-medium">
                        <span className={dbStats.overallPercentage >= 80 ? 'text-green-600' : dbStats.overallPercentage >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                          {dbStats.overallPercentage || 0}% complete
                        </span>
                      </div>
                      {dbStats.totalRecords > 0 && (
                        <div className="text-xs text-slate-600">
                          {dbStats.totalRecords.toLocaleString()} records
                        </div>
                      )}
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
            <CardTitle className="text-base">Latest Batch Upload Status</CardTitle>
          </CardHeader>
          <CardContent>
            {latestBatchStatus ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">Batch ID</div>
                    <div className="font-semibold text-slate-800">{latestBatchStatus.batchId}</div>
                  </div>
                  <Badge className={latestBatchStatus.label === 'Confirmed Complete' ? 'bg-green-600' : latestBatchStatus.label === 'Needs Attention' ? 'bg-red-600' : 'bg-blue-600'}>
                    {latestBatchStatus.label}
                  </Badge>
                </div>
                <div className="grid md:grid-cols-4 gap-3 text-sm">
                  <div className="p-2 rounded border bg-slate-50">Total files: <span className="font-semibold">{latestBatchStatus.counts.total}</span></div>
                  <div className="p-2 rounded border bg-green-50">Completed: <span className="font-semibold text-green-700">{latestBatchStatus.counts.complete}</span></div>
                  <div className="p-2 rounded border bg-blue-50">In progress: <span className="font-semibold text-blue-700">{latestBatchStatus.counts.processing + latestBatchStatus.counts.pending}</span></div>
                  <div className="p-2 rounded border bg-red-50">Errors: <span className="font-semibold text-red-700">{latestBatchStatus.counts.error}</span></div>
                </div>
                <div className="text-xs text-slate-500">
                  Last update: {latestBatchStatus.latestTimestamp ? new Date(latestBatchStatus.latestTimestamp).toLocaleString() : '-'}
                </div>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No batch upload has been detected yet. Select an O*NET folder to create and track a batch.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>


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

        {/* Database Integrity Report */}
        {dbStats && (
          <Card className={dbStats.overallPercentage >= 80 ? 'bg-green-50 border-green-200' : dbStats.overallPercentage >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}>
            <CardHeader>
              <CardTitle className={`text-base flex items-center gap-2 ${dbStats.overallPercentage >= 80 ? 'text-green-900' : dbStats.overallPercentage >= 40 ? 'text-yellow-900' : 'text-red-900'}`}>
                {dbStats.overallPercentage >= 80 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                O*NET Database Status: {dbStats.overallPercentage}% Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(dbStats).filter(([key]) => key !== 'overallPercentage' && key !== 'totalRecords').map(([entity, data]) => {
                    if (data.status === 'error' || !data.count) return null;
                    return (
                      <div key={entity} className="p-3 bg-white rounded border">
                        <div className="font-medium text-sm truncate">{entity}</div>
                        <div className="mt-1 space-y-1">
                          <div className="text-xs text-slate-600">
                            {data.count.toLocaleString()} / {data.expected.toLocaleString()} records
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${data.percentage >= 80 ? 'bg-green-600' : data.percentage >= 40 ? 'bg-yellow-600' : 'bg-red-600'}`}
                              style={{ width: `${Math.min(data.percentage, 100)}%` }}
                            />
                          </div>
                          <div className={`text-xs font-medium ${data.percentage >= 80 ? 'text-green-600' : data.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {data.percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 bg-white rounded border-l-4" style={{
                  borderColor: dbStats.overallPercentage >= 80 ? '#16a34a' : dbStats.overallPercentage >= 40 ? '#ca8a04' : '#dc2626'
                }}>
                  <div className="text-sm font-medium">
                    Total: {dbStats.totalRecords?.toLocaleString() || 0} records imported
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {dbStats.overallPercentage >= 80 ? '✓ Most data present' :
                     dbStats.overallPercentage >= 40 ? '⚠ Partial data - resume import' :
                     '✗ Minimal data - start fresh import'}
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
