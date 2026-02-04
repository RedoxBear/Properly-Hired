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

      for (const entityName of entities) {
        try {
          const entity = base44.entities[entityName];
          if (entity) {
            // Get count of records (fetch all to get actual count)
            const records = await entity.list('-created_date', 1000);
            const count = records.length;
            stats[entityName] = {
              status: count > 0 ? 'has_data' : 'empty',
              count: count
            };
            if (count > 0) {
              totalRecords += count;
              entitiesWithData++;
            }
          }
        } catch (e) {
          stats[entityName] = { status: 'error', count: 0, error: e.message };
        }
      }

      setDbStats(stats);
      return { stats, totalRecords, entitiesWithData, totalEntities: entities.length };
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

      // Batch import using individual creates
      let importedCount = 0;
      let failedCount = 0;
      const totalRecords = records.length;

      for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        // Process each record individually for reliability
        for (let j = 0; j < batch.length; j++) {
          const record = batch[j];
          try {
            await entity.create(record);
            importedCount++;
          } catch (recordError) {
            failedCount++;
            const recordIndex = i + j;
            console.warn(`Record ${recordIndex} insert failed:`, recordError.message, record);
            // Continue with next record instead of stopping
          }
        }

        // Update progress after each batch
        const progress = Math.round((importedCount / totalRecords) * 100);
        updateFileState(fileName, {
          progress,
          importedCount,
          failedCount
        });
      }

      const status = failedCount > 0 ? FILE_STATUS.COMPLETE : FILE_STATUS.COMPLETE;
      const summary = failedCount > 0
        ? `Imported ${importedCount} of ${totalRecords} records (${failedCount} failed)`
        : `Successfully imported all ${importedCount} records`;

      updateFileState(fileName, {
        status,
        progress: 100,
        importedCount,
        failedCount,
        summary,
        endTime: Date.now()
      });

      // Refresh DB stats
      loadDbStats();

    } catch (e) {
      console.error(`Import failed for ${fileName}:`, e);
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

  const handleClearAllData = async () => {
    if (!confirm("This will delete ALL O*NET data from the database. Are you sure?")) {
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

      setFileStates({});
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
                  <div className="font-medium">Local Database</div>
                  <div className="text-xs text-slate-500">
                    {dbStats ? Object.values(dbStats).filter(s => s.status === 'has_data').length : 0}/8 entities
                  </div>
                  {dbStats && importStats?.totalRecords > 0 && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      {importStats.totalRecords.toLocaleString()} records loaded
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
