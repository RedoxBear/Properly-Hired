import React, { useState } from "react";
import { ragIngest } from "@/functions/ragIngest";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

export default function RAGNukePanel({ onComplete }) {
  const [confirmText, setConfirmText] = useState("");
  const [nuking, setNuking] = useState(false);
  const [result, setResult] = useState(null);

  const handleNuke = async () => {
    if (confirmText !== "NUKE") return;
    setNuking(true);
    setResult(null);
    try {
      const res = await ragIngest({ action: "nuke" });
      const d = res.data || res;
      setResult(d);
      setConfirmText("");
      onComplete?.();
    } catch (err) {
      setResult({ error: err.message });
    }
    setNuking(false);
  };

  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-red-600">
          <Trash2 className="w-4 h-4" /> Nuke & Rebuild
        </CardTitle>
        <CardDescription>
          Delete ALL chunks and sources. You'll need to re-ingest everything.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-xs text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          This is irreversible. Type NUKE to confirm.
        </div>
        <div className="flex gap-2">
          <Input
            placeholder='Type "NUKE" to confirm'
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            className="flex-1"
            disabled={nuking}
          />
          <Button
            variant="destructive"
            onClick={handleNuke}
            disabled={confirmText !== "NUKE" || nuking}
          >
            {nuking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            {nuking ? "Deleting..." : "Nuke All"}
          </Button>
        </div>
        {result && (
          <div className={`text-sm p-3 rounded-lg ${result.error 
            ? "bg-red-50 dark:bg-red-950/20 text-red-700" 
            : "bg-green-50 dark:bg-green-950/20 text-green-700"}`}>
            {result.error
              ? `Error: ${result.error}`
              : `Deleted ${result.deleted_chunks} chunks and ${result.deleted_sources} sources.`
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}