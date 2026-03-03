import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Download, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EditorHeader({ resume, baselineScore, currentScore, improved, scoring, onRescore, onDownload, formatLabel, hasUnsavedChanges }) {
  const navigate = useNavigate();

  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl("MyResumes"))} className="gap-1 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <CardTitle className="text-2xl">Resume Editor</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-600">{resume?.version_name}</p>
                <Badge className={formatLabel === "Achievement-Based" 
                  ? "bg-amber-100 text-amber-800 border-amber-200" 
                  : "bg-blue-100 text-blue-800 border-blue-200"}>
                  {formatLabel}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-600">
          <div className="space-y-1 text-left md:text-right">
            <div>Baseline: <span className="font-semibold text-slate-800">{baselineScore ?? "—"}</span></div>
            <div className="flex items-center gap-2 md:justify-end">
              Current: <span className={`font-semibold ${improved ? "text-green-600" : "text-slate-800"}`}>{currentScore ?? "—"}</span>
              {improved && <TrendingUp className="w-4 h-4 text-green-600" />}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button onClick={() => onDownload("txt")} size="sm" variant="outline">Download TXT</Button>
            <Button onClick={() => onDownload("md")} size="sm" variant="outline">Download MD</Button>
            <Button onClick={() => onDownload("json")} size="sm" variant="outline">Download JSON</Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}