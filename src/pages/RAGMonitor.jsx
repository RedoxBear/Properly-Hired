import React, { useState, useEffect } from "react";
import { ragIngest } from "@/functions/ragIngest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Upload, Search, Trash2, BarChart3 } from "lucide-react";
import RAGStats from "../components/rag/RAGStats";
import RAGAgentBreakdown from "../components/rag/RAGAgentBreakdown";
import RAGIngestionPanel from "../components/rag/RAGIngestionPanel";
import RAGTestQuery from "../components/rag/RAGTestQuery";
import RAGNukePanel from "../components/rag/RAGNukePanel";
import RAGFileUpload from "../components/rag/RAGFileUpload";

export default function RAGMonitor() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await ragIngest({ action: "stats" });
      setStats(res.data || res);
    } catch (err) {
      console.error("Stats load failed:", err);
    }
    setStatsLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RAG Knowledge Manager</h1>
        <p className="text-sm text-muted-foreground">
          Ingest, test, and manage knowledge for Kyle & Simon
        </p>
      </div>

      <RAGStats stats={stats} loading={statsLoading} />
      <RAGAgentBreakdown stats={stats} />

      <Tabs defaultValue="ingest" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="ingest" className="gap-1 text-xs">
            <Database className="w-3 h-3" /> Ingest
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1 text-xs">
            <Upload className="w-3 h-3" /> Upload
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-1 text-xs">
            <Search className="w-3 h-3" /> Test
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-1 text-xs">
            <Trash2 className="w-3 h-3" /> Reset
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingest">
          <RAGIngestionPanel onRefreshStats={loadStats} />
        </TabsContent>

        <TabsContent value="upload">
          <RAGFileUpload onComplete={loadStats} />
        </TabsContent>

        <TabsContent value="test">
          <RAGTestQuery />
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <RAGNukePanel onComplete={loadStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}