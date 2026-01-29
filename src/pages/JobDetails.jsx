
import React, { useEffect, useState } from "react";
import { JobApplication } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Link as RouterLink } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Building,
  ExternalLink,
  Target,
  FileText,
  Mail,
  MessageCircleQuestion,
  ArrowLeft,
} from "lucide-react";

const statusConfig = {
  analyzing: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Analyzing" },
  ready: { color: "bg-green-100 text-green-800 border-green-300", label: "Ready to Apply" },
  applied: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Applied" },
  interview: { color: "bg-purple-100 text-purple-800 border-purple-300", label: "Interview" },
  rejected: { color: "bg-red-100 text-red-800 border-red-300", label: "Rejected" },
  offer: { color: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "Offer" },
};

export default function JobDetails() {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("applicationId");
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const app = await JobApplication.get(id);
      setApplication(app || null);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-slate-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <RouterLink to={createPageUrl("JobLibrary")}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Job Library
            </Button>
          </RouterLink>
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-slate-700">Application not found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const status = statusConfig[application.application_status] || statusConfig.analyzing;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <RouterLink to={createPageUrl("JobLibrary")}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Job Library
            </Button>
          </RouterLink>
          <div className="flex items-center gap-3">
            {application.optimization_score !== undefined && application.optimization_score !== null && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                <Target className="w-4 h-4" />
                {application.optimization_score}% match
              </div>
            )}
            <Badge className={`${status.color} border font-medium`}>{status.label}</Badge>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">{application.job_title}</CardTitle>
            <div className="flex items-center gap-2 text-slate-600">
              <Building className="w-4 h-4" />
              <span>{application.company_name}</span>
              {application.job_posting_url && (
                <a
                  href={application.job_posting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 ml-2"
                >
                  <ExternalLink className="w-4 h-4" /> View Posting
                </a>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Added on {format(new Date(application.created_date), "MMM d, yyyy")}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Requirements */}
            {Array.isArray(application.key_requirements) && application.key_requirements.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Key Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {application.key_requirements.map((req, i) => (
                    <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-800 border-blue-200">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Company Culture */}
            {application.company_culture && (
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Company Culture & Insights</h3>
                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">{application.company_culture}</p>
              </div>
            )}

            {/* Job Description */}
            {application.job_description && (
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Job Description</h3>
                <div className="text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {application.job_description}
                </div>
              </div>
            )}

            <Separator />

            {/* Cover Letter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  Cover Letter
                </h3>
                <RouterLink to={createPageUrl("CoverLetters")}>
                  <Button variant="outline" size="sm">Generate New</Button>
                </RouterLink>
              </div>
              {application.cover_letter ? (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-slate-800 whitespace-pre-wrap">
                  {application.cover_letter}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">
                  No cover letter yet. Use the "Generate New" button to create one.
                </p>
              )}
            </div>

            {/* Application Questions & Answers */}
            {Array.isArray(application.application_questions) && application.application_questions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <MessageCircleQuestion className="w-4 h-4 text-orange-600" />
                    Application Q&A
                  </h3>
                  <RouterLink to={createPageUrl("QAAssistant")}>
                    <Button variant="outline" size="sm">Open Q&A Assistant</Button>
                  </RouterLink>
                </div>
                <div className="space-y-3">
                  {application.application_questions.map((qa, idx) => (
                    <div key={idx} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-sm font-medium text-orange-800">Q: {qa.question}</div>
                      {qa.character_limit && (
                        <div className="text-xs text-orange-700">Limit: {qa.character_limit} chars</div>
                      )}
                      {qa.answer ? (
                        <div className="mt-2 text-slate-800 whitespace-pre-wrap">A: {qa.answer}</div>
                      ) : (
                        <div className="mt-2 text-slate-600 text-sm">No answer saved yet.</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimized Resume Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Resume Actions</h3>
              <div className="flex flex-wrap gap-3">
                <RouterLink to={createPageUrl(`ResumeOptimizer?id=${application.id}`)}>
                  <Button className="gap-2">
                    <Target className="w-4 h-4" />
                    Optimize Resume
                  </Button>
                </RouterLink>
                <RouterLink to={createPageUrl("MyResumes")}>
                  <Button variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" />
                    View All Resumes
                  </Button>
                </RouterLink>
                {application.optimized_resume_id && (
                  <>
                    <RouterLink to={createPageUrl(`ResumeTemplates?resumeId=${application.optimized_resume_id}`)}>
                      <Button className="gap-2">
                        <FileText className="w-4 h-4" />
                        Open in Templates
                      </Button>
                    </RouterLink>
                    <RouterLink to={createPageUrl(`ResumeViewer?resumeId=${application.optimized_resume_id}`)}>
                      <Button variant="outline" className="gap-2">
                        <FileText className="w-4 h-4" />
                        View & Download
                      </Button>
                    </RouterLink>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
