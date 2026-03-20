import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Target, CheckCircle2, Sparkles, Building, Globe, ExternalLink,
  Link2, Save, Bot, FileText, MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import CompanyResearchCard from "@/components/company/CompanyResearchCard";
import AnalysisReportView from "@/components/reports/AnalysisReportView";
import DOMPurify from "dompurify";

const createPageUrl = (path) => path.startsWith('/') ? path : `/${path}`;

export default function AnalysisResultsSection({
  analysisResult, savedApp, companyName, jobTitle,
  companyResearch, companyResearchSummary, setCompanyResearchSummary,
  saveCompanyResearchSummary, notionDbId, setNotionDbId, saveResearchToNotion,
  onetBenchmark, resumeMatch, recommendationScore, gradeFromScore,
  resumeTextForReview, jobDescription, masterPlain, optimizedPlain,
  CareerArticulationPanel, indeed, linkedin, resetForm,
  analysisReportText, isGeneratingReport
}) {
  const appId = analysisResult?.applicationId;

  return (
    <div className="space-y-6">
      {/* Analysis Report (new primary view) */}
      <AnalysisReportView
        reportText={analysisReportText}
        jobTitle={jobTitle}
        companyName={companyName}
        isGenerating={isGeneratingReport}
      />

      {/* Analysis Results Card */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Analysis Complete
              </CardTitle>
              <p className="text-slate-600 mt-1">{jobTitle} at {companyName}</p>
            </div>
            <Button variant="outline" onClick={resetForm}>Analyze New Job</Button>
          </div>
          {analysisResult.ai_generated_likelihood > 50 && (
            <Badge variant="outline" className="mt-2 text-sm text-yellow-700 bg-yellow-50 border-yellow-200">
              <Bot className="w-3 h-3 mr-1" />
              AI-Generated Likelihood: {analysisResult.ai_generated_likelihood}%
            </Badge>
          )}
          {typeof recommendationScore === "number" && (
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="text-sm text-blue-700 bg-blue-50 border-blue-200">
                Recommendation Score: {recommendationScore}/100
              </Badge>
              <Badge variant="outline" className="text-sm text-emerald-700 bg-emerald-50 border-emerald-200">
                Grade: {gradeFromScore(recommendationScore)}
              </Badge>
            </div>
          )}
          {savedApp?.llm_analysis_result?.simon_ghost_score !== undefined && (
            <div className="mt-3 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Simon's Ghost-Job Analysis:</h4>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`text-sm ${
                  savedApp.llm_analysis_result.simon_ghost_score < 21 ? 'bg-green-50 text-green-700 border-green-200' :
                  savedApp.llm_analysis_result.simon_ghost_score < 41 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  savedApp.llm_analysis_result.simon_ghost_score < 61 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  Ghost Score: {savedApp.llm_analysis_result.simon_ghost_score}/100
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Risk: {savedApp.llm_analysis_result.simon_risk_level}
                </Badge>
                {savedApp.llm_analysis_result.simon_role_classification?.role_type && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    {savedApp.llm_analysis_result.simon_role_classification.tier || savedApp.llm_analysis_result.simon_role_classification.role_type}
                  </Badge>
                )}
              </div>
              {savedApp.llm_analysis_result.simon_role_classification?.positive_signals?.length > 0 && (
                <div className="text-xs text-green-700 mt-1">
                  ✓ {savedApp.llm_analysis_result.simon_role_classification.positive_signals.slice(0, 2).join(", ")}
                </div>
              )}
            </div>
          )}
          {savedApp?.llm_analysis_result?.is_recruitment_agency && savedApp.llm_analysis_result.agency_confidence >= 50 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
              <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                <Building className="w-4 h-4" />
                Recruitment Agency Posting Detected
                {savedApp.llm_analysis_result.agency_name && (
                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300 ml-1">
                    {savedApp.llm_analysis_result.agency_name}
                  </Badge>
                )}
              </h4>
              <p className="text-sm text-amber-700 mb-2">This posting appears to be from a recruitment/staffing agency.</p>
              <div className="text-sm text-amber-800 mb-2">
                <p className="font-medium mb-1">Recommended approach:</p>
                <ul className="list-disc pl-5 space-y-1 text-amber-700">
                  <li>Connect with the recruiter on LinkedIn</li>
                  <li>Ask qualifying questions: client name, salary range, contract vs permanent</li>
                  <li>Send a recruiter intro message instead of a formal cover letter</li>
                </ul>
              </div>
              {savedApp.llm_analysis_result.agency_signals?.length > 0 && (
                <div className="text-xs text-amber-600 mt-2">Signals: {savedApp.llm_analysis_result.agency_signals.join(", ")}</div>
              )}
              <div className="text-xs text-amber-500 mt-1">Confidence: {savedApp.llm_analysis_result.agency_confidence}%</div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Target className="w-4 h-4" />Key Requirements</h3>
            <div className="flex flex-wrap gap-2">
              {analysisResult.key_requirements?.map((req, i) => (
                <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-800 border-blue-200">{req}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Building className="w-4 h-4" />Company Culture & Insights</h3>
            <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">{analysisResult.company_culture}</p>
          </div>
          {onetBenchmark && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Target className="w-4 h-4" />O*NET Benchmark</h3>
              {onetBenchmark.status === "error" ? (
                <p className="text-sm text-red-600">O*NET benchmark failed.</p>
              ) : (
                <div className="rounded-lg border bg-white p-4 space-y-2">
                  <p className="text-sm text-slate-700">{onetBenchmark.occupation} ({onetBenchmark.soc_code})</p>
                  <div className="flex flex-wrap gap-2">
                    {onetBenchmark.top_skills?.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200">{skill.name}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Overlap score: {onetBenchmark.overlap_score || 0}% · {onetBenchmark.ghost_indicator}</p>
                </div>
              )}
            </div>
          )}
          {resumeMatch && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" />Resume Match</h3>
              <div className="rounded-lg border bg-white p-4 space-y-2">
                <p className="text-sm text-slate-700">Match score: <strong>{resumeMatch.match_score ?? "N/A"}%</strong></p>
                <p className="text-xs text-slate-500">{resumeMatch.alignment_summary}</p>
                <div className="grid md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Strengths</p>
                    <ul className="list-disc pl-4 space-y-1">{(resumeMatch.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Gaps</p>
                    <ul className="list-disc pl-4 space-y-1">{(resumeMatch.gaps || []).map((g, i) => <li key={i}>{g}</li>)}</ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Required Qualifications</h3>
            {savedApp?.summary?.research_snapshot && (
              <CompanyResearchCard company={companyName} orgResearch={{
                overview: savedApp.summary.company_overview,
                website: savedApp.summary.research_snapshot.website,
                founded: savedApp.summary.research_snapshot.founded,
                size: savedApp.summary.research_snapshot.size,
                industry: savedApp.summary.research_snapshot.industry,
                headquarters: savedApp.summary.research_snapshot.headquarters
              }} />
            )}
            <ul className="space-y-2">
              {analysisResult.required_qualifications?.map((qual, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{qual}</span>
                </li>
              ))}
            </ul>
          </div>
          {analysisResult.humanization_tips && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" />Humanization Tips</h3>
              <p className="text-slate-700 bg-purple-50 p-4 rounded-lg border border-purple-200">{analysisResult.humanization_tips}</p>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Application Strategy</h3>
            <p className="text-slate-700 bg-green-50 p-4 rounded-lg border border-green-200">{analysisResult.application_strategy}</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Globe className="w-4 h-4" />Explore Similar Jobs</h3>
            <div className="flex flex-wrap gap-3">
              <a href={indeed} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700">
                <ExternalLink className="w-4 h-4" />Indeed results for "{jobTitle}"
              </a>
              <a href={linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700">
                <ExternalLink className="w-4 h-4" />LinkedIn results for "{jobTitle}"
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Alignment */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader><CardTitle className="text-xl">Resume Alignment & Quality Review</CardTitle></CardHeader>
        <CardContent>
          <CareerArticulationPanel
            resumeText={resumeTextForReview}
            jdText={jobDescription}
            blockApplyOnCritical={true}
            onResolveFlag={() => {}}
            masterText={masterPlain}
            optimizedText={optimizedPlain}
          />
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      {savedApp && (
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-xl">Analysis Summary</CardTitle></CardHeader>
          <CardContent className="prose max-w-none">
            {savedApp.analysis_summary_html ? (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(savedApp.analysis_summary_html) }} />
            ) : (
              <div className="whitespace-pre-wrap text-sm text-slate-700 leading-[1.75]">
                {savedApp.analysis_summary_md || "No summary available."}
              </div>
            )}
            {savedApp.summary && (
              <div className="mt-4 space-y-4">
                {savedApp.summary.company_overview && (
                  <div><h4 className="font-semibold mb-2">Company Overview</h4><p className="text-slate-700">{savedApp.summary.company_overview}</p></div>
                )}
                {savedApp.summary.ats_keywords?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">ATS Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {savedApp.summary.ats_keywords.map((kw, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {savedApp.summary.role_differences?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Role Differences vs. Your Master CV</h4>
                    <ul className="space-y-1">{savedApp.summary.role_differences.map((d, i) => <li key={i} className="text-slate-700">{d}</li>)}</ul>
                  </div>
                )}
                {savedApp.summary.interviewer_tips?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Interviewer Tips</h4>
                    <ul className="list-disc list-inside text-slate-700 space-y-1">{savedApp.summary.interviewer_tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader><CardTitle className="text-xl">Next Steps</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {appId ? (
              <Link to={createPageUrl(`ResumeOptimizer?id=${appId}`)}>
                <Button className="w-full bg-green-600 hover:bg-green-700 h-12"><FileText className="w-4 h-4 mr-2" />Open Resume Optimizer</Button>
              </Link>
            ) : (
              <Button className="w-full h-12" disabled><FileText className="w-4 h-4 mr-2" />Open Resume Optimizer</Button>
            )}
            {appId ? (
              savedApp?.llm_analysis_result?.is_recruitment_agency && savedApp.llm_analysis_result.agency_confidence >= 50 ? (
                <Link to={createPageUrl(`CoverLetter?id=${appId}&mode=recruiter`)}>
                  <Button variant="outline" className="w-full h-12 border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100">
                    <MessageCircle className="w-4 h-4 mr-2" />Draft Recruiter Message
                  </Button>
                </Link>
              ) : (
                <Link to={createPageUrl(`CoverLetter?id=${appId}`)}>
                  <Button variant="outline" className="w-full h-12"><Sparkles className="w-4 h-4 mr-2" />Create Cover Letter</Button>
                </Link>
              )
            ) : (
              <Button variant="outline" className="w-full h-12" disabled><Sparkles className="w-4 h-4 mr-2" />Create Cover Letter</Button>
            )}
            {appId ? (
              <Link to={createPageUrl(`JobSummary?id=${appId}`)}>
                <Button variant="ghost" className="w-full h-12">View Saved Summary</Button>
              </Link>
            ) : (
              <Button variant="ghost" className="w-full h-12" disabled>View Saved Summary</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}