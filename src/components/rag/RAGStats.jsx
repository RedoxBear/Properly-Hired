import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Database, FileText, Brain, AlertTriangle } from "lucide-react";

export default function RAGStats({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <Card key={i}><CardContent className="p-4 h-16 animate-pulse bg-muted/30" /></Card>
        ))}
      </div>
    );
  }

  const items = [
    { label: "Sources", value: stats.sources?.total || 0, icon: FileText, color: "text-blue-600" },
    { label: "Chunks", value: stats.chunks?.total || 0, icon: Database, color: "text-purple-600" },
    { label: "AI Summaries", value: stats.ai_summaries || 0, icon: Brain, color: "text-emerald-600" },
    { label: "Issues", value: Object.values(stats.issues || {}).reduce((a, b) => a + b, 0), icon: AlertTriangle, color: "text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
            <div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}