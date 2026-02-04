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

      for (const entityName of entities) {
        try {
          const entity = base44.entities[entityName];
          if (entity) {
            const records = await entity.list('-created_date', 1);
            stats[entityName] = records.length > 0 ? 'has_data' : 'empty';
          }
        } catch (e) {
          stats[entityName] = 'error';
        }
      }

      setDbStats(stats);
    } catch (e) {
      console.error("Failed to load DB stats:", e);
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

      // Batch import
      let importedCount = 0;
      const totalRecords = records.length;

      for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        try {
          await entity.bulkCreate(batch);
          importedCount += batch.length;

          const progress = Math.round((importedCount / totalRecords) * 100);
          updateFileState(fileName, {
            progress,
            importedCount
          });
        } catch (batchError) {
          console.error(`Batch error at offset ${i}:`, batchError);

          // Try individual inserts for failed batch
          for (const record of batch) {
            try {
              await entity.create(record);
              importedCount++;
            } catch (recordError) {
              console.warn(`Record insert failed:`, recordError.message);
            }
          }

          const progress = Math.round((importedCount / totalRecords) * 100);
          updateFileState(fileName, {
            progress,
            importedCount
          });
        }
      }

      updateFileState(fileName, {
        status: FILE_STATUS.COMPLETE,
        progress: 100,
        importedCount,
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
      for (const schema of filesToImport) {
        await importFile(schema.fileName);
      }
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
    try {
      for (const schema of filesToImport) {
        await importFile(schema.fileName);
      }
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
                <div>
                  <div className="font-medium">Local Database</div>
                  <div className="text-xs text-slate-500">
                    {dbStats ? Object.values(dbStats).filter(s => s === 'has_data').length : 0}/8 entities with data
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Data Management</div>
                  <div className="text-xs text-slate-500">Clear all imported data</div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAllData}
                  disabled={isImporting}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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
