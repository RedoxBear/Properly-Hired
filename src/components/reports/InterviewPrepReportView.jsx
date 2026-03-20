import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import ProfessionalReportRenderer from "@/components/reports/ProfessionalReportRenderer";
import { cleanMarkdown } from "@/components/utils/cleanReportText";

export default function InterviewPrepReportView({ reportText, jobTitle, companyName, isGenerating }) {
  if (isGenerating) {
    return (
      <Card className="border-purple-200 bg-purple-50/30">
        <CardContent className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
          <span className="text-purple-700 font-medium">Generating detailed interview prep report...</span>
        </CardContent>
      </Card>
    );
  }

  if (!reportText) return null;

  const handleDownload = () => {
    const safe = `${(companyName || "Company").replace(/[\\/:*?"<>|]/g, "_")}-${(jobTitle || "Role").replace(/[\\/:*?"<>|]/g, "_")}-interview_prep.txt`;
    const cleaned = cleanMarkdown(reportText);
    const blob = new Blob([cleaned], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safe;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-purple-600" />
            Detailed Interview Prep Report
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/40 p-5 rounded-lg border max-h-[600px] overflow-y-auto">
          <ProfessionalReportRenderer text={reportText} accentColor="purple" />
        </div>
      </CardContent>
    </Card>
  );
}