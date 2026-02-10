import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ingestKnowledge } from "@/functions/ingestKnowledge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";

export default function RAGFileUpload({ onComplete }) {
  const [agent, setAgent] = useState("kyle");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await ingestKnowledge({ file_url, file_name: file.name, agent, tags: tagList });
      setResult(res.data || res);
      onComplete?.();
    } catch (err) {
      setResult({ error: err.message });
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload New Document
        </CardTitle>
        <CardDescription>Upload a file to chunk and index for RAG retrieval</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium">Agent</label>
            <Select value={agent} onValueChange={setAgent}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kyle">Kyle</SelectItem>
                <SelectItem value="simon">Simon</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-[180px]">
            <label className="text-xs font-medium">Tags (comma-separated)</label>
            <Input placeholder="resume, cover-letter, ats" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
          <label className="cursor-pointer">
            <input type="file" className="hidden" accept=".txt,.md,.pdf,.docx,.doc,.rtf" onChange={handleUpload} disabled={uploading} />
            <Button asChild disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? "Ingesting..." : "Upload & Ingest"}
              </span>
            </Button>
          </label>
        </div>
        {result && (
          <div className={`text-sm p-3 rounded-lg flex items-center gap-2 ${result.error
            ? "bg-red-50 dark:bg-red-950/20 text-red-700"
            : "bg-green-50 dark:bg-green-950/20 text-green-700"}`}>
            {!result.error && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {result.error
              ? `Error: ${result.error}`
              : `Ingested "${result.file_name}" — ${result.chunks_created} chunks (${result.text_length} chars)`
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}