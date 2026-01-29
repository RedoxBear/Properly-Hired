import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";

export default function ONetImport() {
  const [file, setFile] = React.useState(null);
  const [importing, setImporting] = React.useState(false);
  const [progress, setProgress] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setSuccess(false);
  };

  const parseAndImport = async () => {
    if (!file) return;
    setImporting(true);
    setError("");
    setProgress("Uploading file...");

    try {
      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;
      
      setProgress("Extracting data from CSV...");

      // Extract CSV data
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            records: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  occupation_code: { type: "string" },
                  occupation_title: { type: "string" },
                  skill_name: { type: "string" },
                  skill_category: { type: "string" },
                  importance: { type: "number" },
                  level: { type: "number" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractResult.status === "error") {
        setError(extractResult.details);
        setImporting(false);
        return;
      }

      const records = extractResult.output?.records || [];
      setProgress(`Importing ${records.length} records...`);

      // Batch insert (50 at a time to avoid timeouts)
      const batchSize = 50;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await base44.entities.ONetSkill.bulkCreate(batch);
        setProgress(`Imported ${Math.min(i + batchSize, records.length)}/${records.length} records...`);
      }

      setSuccess(true);
      setProgress(`✅ Successfully imported ${records.length} O*NET records`);
    } catch (e) {
      console.error(e);
      setError("Import failed. Convert SQL to CSV first or contact support.");
    }

    setImporting(false);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">O*NET Data Import</h1>
          <p className="text-slate-600">Import O*NET skills database from CSV files</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700">{progress}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
              <p className="text-sm text-slate-500 mt-2">
                Accepts CSV with columns: occupation_code, occupation_title, skill_name, skill_category, importance, level, description
              </p>
            </div>

            {file && (
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800">Selected: {file.name}</p>
              </div>
            )}

            <Button
              onClick={parseAndImport}
              disabled={!file || importing}
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {progress}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import O*NET Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-amber-800 mb-3">⚠️ SQL to CSV Conversion</h3>
            <p className="text-sm text-amber-700 mb-2">
              Since you have SQL files, you'll need to convert them to CSV first:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700">
              <li>Extract your SQL zip file</li>
              <li>Use a tool like <code>sqlite3</code> or <code>mysql</code> to load the SQL files</li>
              <li>Export as CSV: <code>SELECT * FROM skills INTO OUTFILE 'skills.csv'</code></li>
              <li>Or use an online SQL-to-CSV converter</li>
              <li>Upload the CSV here</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}