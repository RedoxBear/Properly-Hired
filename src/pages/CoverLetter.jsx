
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PremiumGate from "@/components/PremiumGate";
import { 
    jobApplicationAPI, 
    resumeAPI, 
    coverLetterAPI 
} from "@/api/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Printer, Save, Sparkles, Loader2, Building, MessageCircle, Target, Lightbulb, Heart } from "lucide-react";
import { RICHARD_DEFAULT, fillTemplate } from "@/components/coverletter/template";
import { getVault } from "@/components/utils/vault";
import { fetchOrgResearch } from "@/components/utils/orgResearch";
import { createPageUrl } from "@/utils";

export default function CoverLetter() {
  const [params] = useSearchParams();
  const appId = params.get("id") || "";
  const [app, setApp] = useState(null);
  const [vault, setVault] = useState(null);
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [orgResearch, setOrgResearch] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [openingStyle, setOpeningStyle] = useState("direct_hook");

  const [vars, setVars] = useState({
    candidate_name: "",
    candidate_email: "",
    candidate_phone: "",
    candidate_linkedin: "",
    recipient_name: "Hiring Committee",
    company_name: "",
    company_city_state_zip: "",
    intro_mission: "",
    para_experience: "",
    para_alignment: "",
    closing: ""
  });
  const [template, setTemplate] = useState(RICHARD_DEFAULT);

  useEffect(() => {
    (async () => {
      if (appId) {
        try {
          const a = await jobApplicationAPI.getById(appId);
          setApp(a);
          
          let currentResume = null; // Use a local variable to manage resume within this effect run

          // Attempt to load optimized resume if an ID is present
          if (a.optimized_resume_id) {
            try {
              const resume = await resumeAPI.getById(a.optimized_resume_id);
              currentResume = resume;
              setOptimizedResume(resume); // Update state
            } catch (e) {
              console.error("Failed to load optimized resume:", e);
              // Do not set error here, as we might still find a master resume.
            }
          }
          
          // If no optimized resume was found or specified, try to load a master resume as fallback
          if (!currentResume) { // Check the local variable
            try {
              const masters = await resumeAPI.getAll({ is_master_resume: true, sort: "-created_date", limit: 1 });
              if (masters && masters[0]) {
                currentResume = masters[0];
                setOptimizedResume(masters[0]); // Update state
                setError(""); // Clear any previous general error if a master resume is found successfully
              } else {
                setError("No resume found. Please upload a master resume or optimize one for this job first.");
              }
            } catch (e) {
              console.error("Failed to load master resume:", e);
              setError("No resume available. Please upload a resume first from My Resumes.");
            }
          }
          
          // Check if we already have organization research from Job Analysis
          if (a.summary?.company_overview || a.summary?.research_snapshot) {
            setOrgResearch({
              overview: a.summary.company_overview,
              ...a.summary.research_snapshot
            });
          } else if (a.company_name) {
            // Fetch fresh organization research
            setIsResearchLoading(true);
            try {
              const research = await fetchOrgResearch(a.company_name);
              setOrgResearch(research);
              
              // Save research back to the job application
              await jobApplicationAPI.update(appId, {
                summary: {
                  ...(a.summary || {}),
                  company_overview: research?.overview,
                  research_snapshot: {
                    website: research?.website,
                    founded: research?.founded,
                    size: research?.size,
                    industry: research?.industry,
                    headquarters: research?.headquarters
                  }
                }
              });
            } catch (e) {
              console.error("Failed to fetch org research:", e);
            }
            setIsResearchLoading(false);
          }
        } catch (e) {
          console.error("Failed to load job application:", e);
          setError("Failed to load job application. Please try again.");
        }
      }
      setVault(await getVault());
    })();
  }, [appId]);

  // Autofill from Vault + JobApplication when available
  useEffect(() => {
    if (!vault && !app) return;
    setVars(prev => ({
      ...prev,
      candidate_name: prev.candidate_name || vault?.personal?.full_name || "",
      candidate_email: prev.candidate_email || vault?.personal?.email || "",
      candidate_phone: prev.candidate_phone || vault?.personal?.phone || "",
      candidate_linkedin: prev.candidate_linkedin || vault?.ats_profile?.linkedin || "",
      company_name: prev.company_name || app?.company_name || "",
      company_city_state_zip: prev.company_city_state_zip || app?.summary?.research_snapshot?.headquarters || "",
      intro_mission: prev.intro_mission,
      para_experience: prev.para_experience,
      para_alignment: prev.para_alignment,
      closing: prev.closing
    }));
  }, [vault, app]);

  const output = useMemo(() => fillTemplate(template, vars), [template, vars]);

  const onVar = (k) => (e) => setVars({ ...vars, [k]: e.target.value });

  // Opening style configurations
  const openingStyles = {
    direct_hook: {
      label: "Direct Hook",
      icon: Target,
      description: "Start immediately with a compelling connection to the company or role",
      example: "When I saw your team's recent work on [specific project], I immediately thought: this is where I want to contribute next.",
      instructions: `**Opening Style: Direct Hook**`
    },
    shared_value: {
      label: "Shared Values",
      icon: Heart,
      description: "Lead with alignment between your values and the company's mission",
      example: "Building accessible technology that genuinely serves people—not just checking compliance boxes—is what drives my work. That's why [Company]'s mission resonates so deeply with me.",
      instructions: `**Opening Style: Shared Values**`
    },
    problem_solution: {
      label: "Problem-Solution",
      icon: Lightbulb,
      description: "Open by demonstrating understanding of a key challenge and positioning yourself as part of the solution",
      example: "Scaling HR operations while maintaining the personal touch that makes employees feel valued—that's the challenge growing companies face. It's also exactly what I've solved in my last two roles.",
      instructions: `**Opening Style: Problem-Solution Insight**`
    },
    natural_conversation: {
      label: "Natural Conversation",
      icon: MessageCircle,
      description: "Start like you're talking to a real person—warm, professional, and genuine",
      example: "I don't usually apply to roles within 24 hours of seeing them posted, but when I read about [specific aspect of role], I had to reach out. This is exactly the kind of work I want to be doing.",
      instructions: `**Opening Style: Natural Conversation**`
    }
  };

  const selectedStyleConfig = openingStyles[openingStyle];

  // AI-Powered Cover Letter Generation
  const generateCoverLetter = async () => {
    if (!app) {
      setError("Job application data is missing. Please go back and analyze the job first.");
      return;
    }

    if (!optimizedResume) {
      setError("No resume found. Please upload a master resume or run the Resume Optimizer first.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Parse resume data
      const resumeData = optimizedResume.optimized_content 
        ? JSON.parse(optimizedResume.optimized_content)
        : JSON.parse(optimizedResume.parsed_content);

      // Using Backend API (Kyle Agent)
      const response = await coverLetterAPI.generate(
        resumeData, 
        app.job_description, 
        app.company_name, 
        { 
          openingStyle, 
          orgResearch 
        }
      );

      // Sanitize output to remove any bullet points or resume artifacts
      const sanitize = (text) => {
        if (!text) return "";
        return String(text)
          .replace(/^[\s]*[•·\-\*]\s+/gm, '')
          .replace(/^[\s]*(Role|Position|Company|Duration):\s*/gmi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
      };

      // Update variables with AI-generated content (sanitized)
      setVars(prev => ({
        ...prev,
        intro_mission: sanitize(response.intro_mission) || prev.intro_mission,
        para_experience: sanitize(response.para_experience) || prev.para_experience,
        para_alignment: sanitize(response.para_alignment) || prev.para_alignment,
        closing: sanitize(response.closing) || prev.closing
      }));

    } catch (e) {
      console.error("Cover letter generation error:", e);
      setError("Failed to generate cover letter. Please try again or write manually.");
    }

    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!appId) return;
    try {
      await jobApplicationAPI.update(appId, {
        cover_letter_text: output,
        cover_letter_template: template,
        cover_letter_vars: vars,
        last_cover_letter_at: new Date().toISOString(),
        cover_letter_last_updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const handlePrint = () => window.print();

  return (
    <PremiumGate feature="cover_letters">
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-letter, #printable-letter * { visibility: visible !important; }
          #printable-letter { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: Letter; margin: 1in; }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" /> Cover Letter
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button asChild>
            <Link to={createPageUrl(appId ? `JobSummary?id=${appId}` : "JobSummary")}>Back to Summary</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Organization Research Card */}
      {isResearchLoading && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Researching organization...
          </AlertDescription>
        </Alert>
      )}

      {orgResearch && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Organization Research
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-2">
            {orgResearch.overview && <p><strong>Overview:</strong> {orgResearch.overview}</p>}
            <div className="grid grid-cols-2 gap-2">
              {orgResearch.industry && <p><strong>Industry:</strong> {orgResearch.industry}</p>}
              {orgResearch.size && <p><strong>Size:</strong> {orgResearch.size}</p>}
              {orgResearch.headquarters && <p><strong>Location:</strong> {orgResearch.headquarters}</p>}
              {orgResearch.founded && <p><strong>Founded:</strong> {orgResearch.founded}</p>}
            </div>
            {orgResearch.website && (
              <p>
                <strong>Website:</strong>{" "}
                <a href={orgResearch.website} target="_blank" rel="noopener noreferrer" className="underline">
                  {orgResearch.website}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Generate Section with Opening Style Selector */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-green-800 mb-1">AI-Powered Cover Letter Generator</h3>
            <p className="text-sm text-green-700 mb-4">
              Combines your optimized resume + organization research + job requirements to create a personalized, human-sounding cover letter.
            </p>

            {/* Opening Style Selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-green-800">Choose Your Opening Style:</label>
              <Select value={openingStyle} onValueChange={setOpeningStyle}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(openingStyles).map(([key, style]) => {
                    const Icon = style.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{style.label}</div>
                            <div className="text-xs text-slate-500">{style.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Style Preview */}
              <div className="bg-white border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  {React.createElement(selectedStyleConfig.icon, { className: "w-4 h-4 text-green-600 mt-0.5" })}
                  <div>
                    <div className="font-medium text-sm text-slate-800">{selectedStyleConfig.label}</div>
                    <div className="text-xs text-slate-600">{selectedStyleConfig.description}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 italic mt-2 pl-6">
                  Example: "{selectedStyleConfig.example}"
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={generateCoverLetter}
            disabled={isGenerating || !app || !optimizedResume}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Your full name" value={vars.candidate_name} onChange={onVar("candidate_name")} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Email" value={vars.candidate_email} onChange={onVar("candidate_email")} />
              <Input placeholder="Phone" value={vars.candidate_phone} onChange={onVar("candidate_phone")} />
            </div>
            <Input placeholder="LinkedIn URL" value={vars.candidate_linkedin} onChange={onVar("candidate_linkedin")} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Recipient (e.g., Hiring Committee)" value={vars.recipient_name} onChange={onVar("recipient_name")} />
              <Input placeholder="Company name" value={vars.company_name} onChange={onVar("company_name")} />
            </div>
            <Input placeholder="City, State ZIP" value={vars.company_city_state_zip} onChange={onVar("company_city_state_zip")} />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Opening Paragraph</label>
              <Textarea rows={4} value={vars.intro_mission} onChange={onVar("intro_mission")} placeholder="Opening hook and connection to the company..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Experience Paragraph</label>
              <Textarea rows={6} value={vars.para_experience} onChange={onVar("para_experience")} placeholder="Highlight relevant experience and achievements..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Alignment Paragraph</label>
              <Textarea rows={5} value={vars.para_alignment} onChange={onVar("para_alignment")} placeholder="Show company knowledge and explain your fit..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Closing Paragraph</label>
              <Textarea rows={3} value={vars.closing} onChange={onVar("closing")} placeholder="Express interest and mention next steps..." />
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold block mb-1">Template</label>
              <Textarea rows={8} value={template} onChange={(e) => setTemplate(e.target.value)} />
              <div className="text-xs text-slate-500 mt-1">
                Variables: {"{{candidate_name}} {{candidate_email}} {{candidate_phone}} {{candidate_linkedin}} {{recipient_name}} {{company_name}} {{company_city_state_zip}} {{intro_mission}} {{para_experience}} {{para_alignment}} {{closing}}"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="printable-letter" className="space-y-4 text-slate-800">
              {output
                .split(/\n\s*\n/)
                .filter(Boolean)
                .map((para, idx) => (
                  <p key={idx} className="leading-7">{para.trim()}</p>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </PremiumGate>
  );
}
