import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, CheckCircle2, XCircle, AlertCircle, Database, FileText, Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * O*NET Data Import Page
 *
 * Imports O*NET 30.1 CSV files into 8 Base44 entities:
 * - ONetOccupation, ONetSkill, ONetAbility, ONetKnowledge
 * - ONetTask, ONetWorkActivity, ONetWorkContext, ONetReference
 */

const ENTITIES = [
  { name: 'ONetOccupation', icon: '👔', color: 'blue' },
  { name: 'ONetSkill', icon: '🎯', color: 'green' },
  { name: 'ONetAbility', icon: '💪', color: 'purple' },
  { name: 'ONetKnowledge', icon: '📚', color: 'yellow' },
  { name: 'ONetTask', icon: '✅', color: 'red' },
  { name: 'ONetWorkActivity', icon: '⚙️', color: 'indigo' },
  { name: 'ONetWorkContext', icon: '🏢', color: 'pink' },
  { name: 'ONetReference', icon: '📖', color: 'gray' }
];

// File to Entity mapping
const FILE_MAPPING = {
  'Occupation_Data': 'ONetOccupation',
  'Alternate_Titles': 'ONetOccupation',
  'Sample_of_Reported_Titles': 'ONetOccupation',
  'Related_Occupations': 'ONetOccupation',
  'Job_Zones': 'ONetOccupation',

  'Skills': 'ONetSkill',
  'Skills_to_Work_Activities': 'ONetSkill',
  'Skills_to_Work_Context': 'ONetSkill',

  'Abilities': 'ONetAbility',
  'Abilities_to_Work_Activities': 'ONetAbility',
  'Abilities_to_Work_Context': 'ONetAbility',

  'Knowledge': 'ONetKnowledge',

  'Task_Statements': 'ONetTask',
  'Task_Ratings': 'ONetTask',
  'Emerging_Tasks': 'ONetTask',
  'Tasks_to_DWAs': 'ONetTask',

  'Work_Activities': 'ONetWorkActivity',
  'IWA_Reference': 'ONetWorkActivity',
  'DWA_Reference': 'ONetWorkActivity',

  'Work_Context': 'ONetWorkContext',
  'Work_Context_Categories': 'ONetWorkContext',
  'Work_Styles': 'ONetWorkContext',
  'Work_Values': 'ONetWorkContext',

  'Content_Model_Reference': 'ONetReference',
  'Scales_Reference': 'ONetReference',
  'Level_Scale_Anchors': 'ONetReference',
  'Job_Zone_Reference': 'ONetReference',
};

export default function ONetImport() {
  const [files, setFiles] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [results, setResults] = useState([]);
  const [entityStats, setEntityStats] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Check entity status
  const checkEntities = async () => {
    const stats = {};
    for (const entity of ENTITIES) {
      try {
        const count = await base44.entities[entity.name]?.list?.('-created_date', 1);
        stats[entity.name] = { exists: true, count: count?.length || 0 };
      } catch (e) {
        stats[entity.name] = { exists: false, error: e.message };
      }
    }
    setEntityStats(stats);
  };

  React.useEffect(() => {
    checkEntities();
  }, []);

  // Handle file selection
  const handleFiles = (selectedFiles) => {
    const csvFiles = Array.from(selectedFiles).filter(f => f.name.endsWith('.csv'));
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const newFiles = csvFiles.filter(f => !existing.has(f.name));
      return [...prev, ...newFiles];
    });
  };

  const handleFileInput = (e) => {
    handleFiles(e.target.files);
  };

  const handleFolderInput = (e) => {
    handleFiles(e.target.files);
  };

  const removeFile = (fileName) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setUploadedFiles([]);
    setProgress(0);
  };

  // Parse CSV
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const record = {};
        headers.forEach((header, idx) => {
          record[header] = values[idx]?.trim().replace(/^"|"$/g, '');
        });
        records.push(record);
      }
    }

    return { headers, records };
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current) result.push(current);
    return result;
  };

  // Determine target entity
  const getTargetEntity = (fileName) => {
    for (const [pattern, entity] of Object.entries(FILE_MAPPING)) {
      if (fileName.includes(pattern)) {
        return entity;
      }
    }
    return null;
  };

  // Import all files
  const importFiles = async () => {
    if (files.length === 0) return;

    setImporting(true);
    setProgress(0);
    setResults([]);
    setUploadedFiles([]);

    const importResults = [];
    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.name);
      setProgress(((i + 1) / files.length) * 100);

      try {
        // Read file
        const text = await file.text();
        const { records } = parseCSV(text);

        // Determine target entity
        const targetEntity = getTargetEntity(file.name);

        if (!targetEntity) {
          importResults.push({
            file: file.name,
            status: 'skipped',
            message: 'Unknown file type',
            records: 0
          });
          continue;
        }

        // Store in repository
        const repoEntry = {
          fileName: file.name,
          targetEntity,
          recordCount: records.length,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size
        };

        // Import to Base44
        let imported = 0;
        const batchSize = 100;

        for (let j = 0; j < records.length; j += batchSize) {
          const batch = records.slice(j, j + batchSize);

          try {
            await Promise.all(
              batch.map(record =>
                base44.entities[targetEntity].create(record)
              )
            );
            imported += batch.length;
          } catch (e) {
            console.error(`Batch import failed for ${file.name}:`, e);
          }
        }

        importResults.push({
          file: file.name,
          status: imported > 0 ? 'success' : 'failed',
          entity: targetEntity,
          message: `Imported ${imported}/${records.length} records`,
          records: imported
        });

        uploaded.push(repoEntry);

      } catch (error) {
        importResults.push({
          file: file.name,
          status: 'error',
          message: error.message,
          records: 0
        });
      }
    }

    setResults(importResults);
    setUploadedFiles(uploaded);
    setImporting(false);
    setCurrentFile('');
    await checkEntities();
  };

  // Clear entity data
  const clearEntity = async (entityName) => {
    if (!confirm(`Are you sure you want to delete all data from ${entityName}?`)) return;

    try {
      // This would need a server function to bulk delete
      alert('Clear function needs to be implemented on server side');
    } catch (e) {
      alert(`Failed to clear ${entityName}: ${e.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">O*NET Data Import</h1>
        <p className="text-gray-600">
          Upload O*NET 30.1 CSV files to populate the 8 occupational data entities
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">📤 Upload Files</TabsTrigger>
          <TabsTrigger value="entities">🗄️ Entity Status</TabsTrigger>
          <TabsTrigger value="repository">📁 File Repository</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Select CSV Files</CardTitle>
              <CardDescription>
                Upload individual files or select an entire folder containing O*NET CSV files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Select Files
                </Button>
                <Button
                  onClick={() => folderInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select Folder
                </Button>
                {files.length > 0 && (
                  <Button
                    onClick={clearAll}
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleFolderInput}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{files.length} files selected</span>
                  </div>
                  {files.map((file, idx) => {
                    const entity = getTargetEntity(file.name);
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm truncate">{file.name}</span>
                          {entity && (
                            <Badge variant="outline" className="text-xs">
                              {entity}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(file.name)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                onClick={importFiles}
                disabled={importing || files.length === 0}
                className="w-full"
                size="lg"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Importing... {progress.toFixed(0)}%
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Import {files.length} Files
                  </>
                )}
              </Button>

              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-gray-600">
                    Processing: {currentFile}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Import Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.map((result, idx) => (
                    <Alert key={idx} variant={result.status === 'success' ? 'default' : 'destructive'}>
                      <div className="flex items-start gap-3">
                        {result.status === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : result.status === 'error' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{result.file}</div>
                          <div className="text-sm">{result.message}</div>
                          {result.entity && (
                            <Badge variant="outline" className="mt-1">
                              → {result.entity}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium">
                          {result.records > 0 && `${result.records.toLocaleString()} records`}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Entity Status Tab */}
        <TabsContent value="entities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ENTITIES.map((entity) => {
              const stats = entityStats[entity.name] || {};
              return (
                <Card key={entity.name}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">{entity.icon}</span>
                      {stats.exists ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{entity.name}</h3>
                    <p className="text-2xl font-bold mb-2">
                      {stats.count !== undefined ? stats.count.toLocaleString() : '-'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {stats.exists ? 'Ready' : 'Not configured'}
                    </p>
                    {stats.exists && stats.count > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() => clearEntity(entity.name)}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Clear Data
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button onClick={checkEntities} variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </TabsContent>

        {/* File Repository Tab */}
        <TabsContent value="repository" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>
                History of O*NET CSV files that have been uploaded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No files uploaded yet
                </div>
              ) : (
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{file.fileName}</div>
                        <div className="text-sm text-gray-600">
                          {file.recordCount.toLocaleString()} records → {file.targetEntity}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(file.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
