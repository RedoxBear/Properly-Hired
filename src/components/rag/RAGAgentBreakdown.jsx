import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RAGAgentBreakdown({ stats }) {
  if (!stats) return null;
  
  const agents = [
    { name: "Kyle", key: "kyle", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    { name: "Simon", key: "simon", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
    { name: "Both", key: "both", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {agents.map(a => (
        <Card key={a.key}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={a.color}>{a.name}</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sources</span>
                <span className="font-medium">{stats.sources?.[a.key] || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chunks</span>
                <span className="font-medium">{stats.chunks?.[a.key] || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}