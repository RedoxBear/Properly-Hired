import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { hasAccess, TIERS } from "@/components/utils/accessControl";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MessageSquare, HelpCircle, Star, CheckSquare, ArrowLeft, FileText } from "lucide-react";
import { generateInterviewPrep } from "@/functions/generateInterviewPrep";
import { generateInterviewPrepReport } from "@/components/reports/InterviewPrepReportGenerator";
import InterviewPrepReportView from "@/components/reports/InterviewPrepReportView";
import JobSelectionPicker from "@/components/interviewprep/JobSelectionPicker";

const CATEGORY_COLORS = {
  behavioral: "bg-blue-100 text-blue-800",
  situational: "bg-green-100 text-green-800",
  technical: "bg-orange-100 text-orange-800",
  culture: "bg-purple-100 text-purple-800"
};

export default function InterviewPrep() {
  const [currentUser, setCurrentUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [prep, setPrep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [error, setError] = useState(null);
  const [prepReportText, setPrepReportText] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const appId = new URLSearchParams(window.location.search).get("id");

  useEffect(() => {
    const init = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      if (!hasAccess(user, "interview_prep")) {
        setLoading(false);
        return;
      }
      if (!appId) {
        setLoading(false);
        return;
      }
      await loadApplication();
    };
    init();
  }, [appId]);

  const loadApplication = async () => {
    setLoading(true);
    try {
      const app = await base44.entities.JobApplication.get(appId);
      setApplication(app);
      const existingPrep = app?.summary?.interview_prep ?? null;
      setPrep(existingPrep);
      setPrepReportText(app?.interview_prep_report_text || "");

      // If prep is missing, it should already have been generated during Resume Optimizer handoff.
      // Auto-generate as a fallback to ensure data is always present.
      if (!existingPrep) {
        setGenerating(true);
        generateInterviewPrep({ action: "generate", job_application_id: appId })
          .then(result => setPrep(result.data?.interview_prep))
          .catch(console.error)
          .finally(() => setGenerating(false));
      }
      if (!app?.interview_prep_report_text) {
        setIsGeneratingReport(true);
        generateInterviewPrepReport(appId)
          .then(text => setPrepReportText(text || ""))
          .catch(console.error)
          .finally(() => setIsGeneratingReport(false));
      }
    } catch (e) {
      setError("Could not load application.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateInterviewPrep({
        action: "generate",
        job_application_id: appId
      });
      setPrep(result.data?.interview_prep);
      // Also regenerate the detailed report
      setIsGeneratingReport(true);
      // Clear existing to force re-generation
      await base44.entities.JobApplication.update(appId, { interview_prep_report_text: "" });
      generateInterviewPrepReport(appId).then(text => {
        setPrepReportText(text || "");
      }).catch(console.error).finally(() => setIsGeneratingReport(false));
    } catch (e) {
      setError("Regeneration failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleCheck = (idx) =>
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));

  // Premium gate
  if (!loading && currentUser && !hasAccess(currentUser, "interview_prep")) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <UpgradePrompt
          feature="interview_prep"
          currentTier={currentUser?.subscription_tier || TIERS.FREE}
          variant="card"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-2xl">Interview Prep</CardTitle>
              <p className="text-muted-foreground mt-1">
                {application?.job_title} at {application?.company_name}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {application?.summary?.simon_brief?.ghost_job_score !== undefined && (
                <Badge className="bg-amber-100 text-amber-800">
                  Ghost Score: {application.summary.simon_brief.ghost_job_score}/100
                </Badge>
              )}
              <Link to={createPageUrl(`JobDetails?applicationId=${appId}`)}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Details
                </Button>
              </Link>
              <Link to={createPageUrl(`ResumeOptimizer?id=${appId}`)}>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" /> Optimize CV
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Detailed Report (primary view) */}
      <InterviewPrepReportView
        reportText={prepReportText}
        jobTitle={application?.job_title}
        companyName={application?.company_name}
        isGenerating={isGeneratingReport}
      />

      {/* Loading state while auto-generating */}
      {generating && !prep && (
        <Card className="border-purple-200">
          <CardContent className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="text-purple-700 font-medium">Generating interview preparation...</span>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {prep && (
        <>
          {/* Likely Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Likely Interviewer Questions
                <Badge variant="outline">{prep.likely_questions?.length ?? 0} questions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {prep.likely_questions?.map((q, i) => (
                <div key={i} className="border-b pb-5 last:border-0">
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground font-mono text-sm mt-0.5">Q{i + 1}</span>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">"{q.question}"</p>
                        <Badge className={CATEGORY_COLORS[q.category] ?? "bg-gray-100"}>
                          {q.category}
                        </Badge>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded p-3 text-sm">
                        <p className="font-medium text-amber-800 mb-1">Why they ask:</p>
                        <p className="text-amber-700">{q.why_they_ask}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-sm">
                        <p className="font-medium text-blue-800 mb-1">Best answer guide:</p>
                        <p className="text-blue-700">{q.best_answer_guide}</p>
                      </div>
                      {q.star_hook && (
                        <div className="flex items-center gap-2 text-sm text-purple-700">
                          <Star className="h-3.5 w-3.5" />
                          <span className="font-medium">STAR hook:</span> {q.star_hook}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Questions to Ask */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-green-600" />
                Questions to Ask the Interviewer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="strategic">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="strategic">Strategic</TabsTrigger>
                  <TabsTrigger value="narrative">Narrative</TabsTrigger>
                  <TabsTrigger value="value_driving">Value-Driving</TabsTrigger>
                  <TabsTrigger value="insightful">Insightful</TabsTrigger>
                </TabsList>
                {["strategic", "narrative", "value_driving", "insightful"].map(tab => (
                  <TabsContent key={tab} value={tab}>
                    <ul className="mt-4 space-y-3">
                      {prep.questions_to_ask?.[tab]?.map((q, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span className="text-foreground">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* STAR Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                STAR Story Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {prep.star_templates?.map((t, i) => (
                  <AccordionItem key={i} value={`star-${i}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="font-medium text-foreground">
                      {t.scenario}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-3 pt-2">
                        {["situation", "task", "action", "result"].map(field => (
                          <div key={field} className="bg-muted rounded p-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                              {field}
                            </p>
                            <p className="text-foreground text-sm">{t[field]}</p>
                          </div>
                        ))}
                        {t.coaching_note && (
                          <div className="bg-purple-50 border border-purple-100 rounded p-3 text-sm text-purple-700">
                            <span className="font-medium">Coaching note:</span> {t.coaching_note}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* O*NET Context */}
          {prep.onet_context && (
            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-blue-900 text-base">O*NET Role Fit Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">Work styles to demonstrate:</span>{" "}
                  {prep.onet_context.work_styles_to_demonstrate?.join(", ")}
                </p>
                <p><span className="font-medium">Role values alignment:</span>{" "}
                  {prep.onet_context.role_values_alignment?.join(", ")}
                </p>
                <p><span className="font-medium">RIASEC fit:</span>{" "}
                  {prep.onet_context.riasec_fit}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Preparation Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-teal-600" />
                Preparation Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prep.preparation_checklist?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Checkbox
                      id={`chk-${i}`}
                      checked={!!checkedItems[i]}
                      onCheckedChange={() => toggleCheck(i)}
                    />
                    <label htmlFor={`chk-${i}`}
                      className={`text-sm cursor-pointer ${checkedItems[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regenerate */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleRegenerate} disabled={generating} size="sm">
              {generating
                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Regenerating…</>
                : "Regenerate"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}