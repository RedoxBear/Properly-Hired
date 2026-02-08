import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Resume } from "@/entities/Resume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Printer, Download, Palette, ArrowRight } from "lucide-react";
import Classic from "@/components/resume/templates/Classic";
import Modern from "@/components/resume/templates/Modern";
import Minimal from "@/components/resume/templates/Minimal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parse, parseISO, isValid, differenceInMonths } from "date-fns";
import TemplateGallery, { DEFAULT_TEMPLATES } from "@/components/resume/templates/TemplateGallery";
import { hasAccess, TIERS, isAdmin } from "@/components/utils/accessControl";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";
import AgentChat from "@/components/agents/AgentChat";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { KyleOptimizeBanner, ProjectBasedCVHint, TemplateHelperHint } from "@/components/resume/KyleTemplateBanner";

export default function ResumeTemplates() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [template, setTemplate] = useState("classic");
  const [appliedNote, setAppliedNote] = useState("");
  const printRef = useRef(null); // NEW: printable area ref
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [templateItems, setTemplateItems] = useState(DEFAULT_TEMPLATES);
  const [autoRedirectArmed, setAutoRedirectArmed] = useState(false);
  const redirectTimerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setIsLoadingUser(false);

        // Only load resumes if user has access
        if (hasAccess(user, "resume_templates")) {
          const urlParams = new URLSearchParams(window.location.search);
          const rid = urlParams.get("resumeId") || "";
          const list = await Resume.list("-created_date", 50);
          setResumes(list);
          if (rid) setSelectedResumeId(rid);
          else if (list.length) setSelectedResumeId(list[0].id);
        }
      } catch (e) {
        console.warn("Failed to load user:", e);
        setIsLoadingUser(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("resume-template-gallery");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplateItems(parsed);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse stored templates:", e);
      }
    }
    setTemplateItems(DEFAULT_TEMPLATES);
  }, []);

  const persistTemplates = (items) => {
    setTemplateItems(items);
    localStorage.setItem("resume-template-gallery", JSON.stringify(items));
  };

  const handleAddTemplate = (item) => {
    const next = [...templateItems, item];
    persistTemplates(next);
  };

  const handleDeleteTemplate = (item) => {
    const next = templateItems.filter(t => (t.id || t.title) !== (item.id || item.title));
    persistTemplates(next);
  };

  // When switching selected resume, load its saved template if exists
  useEffect(() => {
    const r = resumes.find(x => x.id === selectedResumeId);
    if (r?.template && ["classic", "modern", "minimal"].includes(r.template)) {
      setTemplate(r.template);
    }
  }, [selectedResumeId, resumes]);

  useEffect(() => {
    if (!selectedResumeId) return;
    const key = `resume-templates-redirect-${selectedResumeId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setAutoRedirectArmed(true);
    redirectTimerRef.current = setTimeout(() => {
      navigate(`${createPageUrl("ResumeEditor")}?resumeId=${selectedResumeId}`);
    }, 3500);
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [selectedResumeId, navigate]);

  // Show loading while checking user access
  if (isLoadingUser) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Feature gate: Resume Templates requires Pro or higher
  if (!hasAccess(currentUser, "resume_templates")) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <UpgradePrompt
          feature="resume_templates"
          currentTier={currentUser?.subscription_tier || TIERS.FREE}
          variant="card"
        />
      </div>
    );
  }

  const resume = resumes.find(r => r.id === selectedResumeId);
  let resumeData = null;
  if (resume) {
    resumeData = resume.optimized_content
      ? JSON.parse(resume.optimized_content)
      : (resume.parsed_content ? JSON.parse(resume.parsed_content) : null);
  }

  // Detect employment gaps of 6+ months (best-effort parsing)
  const tryParseDate = (str) => {
    if (!str || typeof str !== "string") return null;
    const s = str.trim().toLowerCase().replace("present", new Date().getFullYear().toString());
    // Try common patterns: "MMM yyyy", "MMMM yyyy", "yyyy-mm", "yyyy"
    const formats = ["MMM yyyy", "MMMM yyyy", "yyyy-MM", "yyyy"];
    for (const f of formats) {
      const d = parse(s, f, new Date());
      if (isValid(d)) return d;
    }
    // Fallback ISO/new Date
    const iso = parseISO(str);
    if (isValid(iso)) return iso;
    const nd = new Date(str);
    return isValid(nd) ? nd : null;
  };

  const extractRangeFromDuration = (duration) => {
    // Examples: "Jan 2021 - Jun 2022", "2020 - 2023", "Jan 2020–Present"
    if (!duration || typeof duration !== "string") return {};
    const parts = duration.replace("–", "-").split("-").map(p => p.trim());
    if (parts.length >= 2) {
      return { start: tryParseDate(parts[0]), end: tryParseDate(parts[1]) };
    }
    // If single value, treat as year range with unknown end
    const single = tryParseDate(duration);
    return { start: single, end: single };
  };

  const computeTenureStats = (experience) => {
    if (!Array.isArray(experience) || experience.length === 0) return null;
    const tenures = experience.map((e) => {
      const { start, end } = extractRangeFromDuration(e?.duration);
      if (!start || !end) return null;
      const months = Math.max(0, differenceInMonths(end, start));
      return months;
    }).filter((m) => typeof m === "number");

    if (tenures.length === 0) return null;
    const total = tenures.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / tenures.length);
    const shortStints = tenures.filter(m => m < 12).length;
    return { averageMonths: avg, shortStints, totalRoles: tenures.length };
  };

  const computeGapAlerts = (experience) => {
    if (!Array.isArray(experience) || experience.length < 2) return [];
    // Normalize to {start, end, label}
    const normalized = experience.map((e, i) => {
      const { start, end } = extractRangeFromDuration(e?.duration);
      return {
        start,
        end,
        label: [e?.position, e?.company].filter(Boolean).join(" @ ") || `Experience ${i + 1}`
      };
    }).filter(x => x.start || x.end);

    if (normalized.length < 2) return [];
    // Sort by end desc (most recent first)
    normalized.sort((a, b) => {
      const ae = a.end || a.start || new Date(0);
      const be = b.end || b.start || new Date(0);
      return be.getTime() - ae.getTime(); // Use getTime() for reliable date comparison
    });

    const alerts = [];
    for (let i = 0; i < normalized.length - 1; i++) {
      const current = normalized[i]; // Most recent entry
      const next = normalized[i + 1]; // Next older entry

      // Consider the gap between the start of the current experience and the end of the next older experience
      const currentStart = current.start; // Assuming this is the start of the current job
      const nextEnd = next.end;         // Assuming this is the end of the previous job

      if (currentStart && nextEnd && currentStart > nextEnd) {
        const gapMonths = differenceInMonths(currentStart, nextEnd);
        if (gapMonths >= 6) {
          alerts.push(`Gap of approximately ${gapMonths} months between "${next.label}" and "${current.label}".`);
        }
      }
    }
    return alerts;
  };

  const gapAlerts = resumeData?.experience ? computeGapAlerts(resumeData.experience) : [];
  const tenureStats = resumeData?.experience ? computeTenureStats(resumeData.experience) : null;
  const recommendProjectCV = tenureStats ? tenureStats.shortStints >= 2 || tenureStats.averageMonths <= 14 : false;

  const renderTemplate = () => {
    const props = { data: resumeData };
    if (template === "classic") return <Classic {...props} />;
    if (template === "modern") return <Modern {...props} />;
    if (template === "minimal") return <Minimal {...props} />;
    return null;
  };

  // REPLACE: window.print with iframe-based clean printing
  const handlePrint = async () => {
    const node = printRef.current;
    if (!node) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;

    const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => `<link rel="stylesheet" href="${l.href}">`)
      .join("");

    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${resume?.version_name || "Resume"}</title>
${linkTags}
<style>
  @page { size: A4; margin: 16mm; }
  html, body { background: #fff; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  #printable-resume {
    max-width: 800px;
    margin: 0 auto;
    font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    color: #111827;
  }
  .page-break { break-after: page; }
</style>
</head>
<body>
  <div id="printable-resume">
    ${node.outerHTML}
  </div>
</body>
</html>`.trim();

    doc.open();
    doc.write(html);
    doc.close();

    // Give the iframe a tick to load styles/fonts
    await new Promise(r => setTimeout(r, 150));
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    setTimeout(() => iframe.remove(), 500);
  };

  const handleDownloadHtml = () => {
    const el = document.getElementById("print-area");
    if (!el) return;
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Resume - ${resume?.version_name || "Export"}</title>
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
<style>
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body class="bg-white">
${el.innerHTML}
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (resume?.version_name || "Resume").replace(/[\\/:*?"<>|]/g, "_");
    a.href = url;
    a.download = `${safe}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleGalleryPick = async (slug) => {
    setTemplate(slug);
    setAppliedNote("");
    if (selectedResumeId) {
      await Resume.update(selectedResumeId, { template: slug });
      setAppliedNote("Template applied to this resume.");
      // Smooth scroll to preview
      const el = document.getElementById("print-area");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setAppliedNote("Select a resume above to save this template.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <style>
        {`/* Allow long resumes to span multiple pages naturally in the preview */
        #print-area { overflow: visible; }
        `}
      </style>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium mb-4">
            <Palette className="w-4 h-4" />
            Resume Templates
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Choose a Resume Template</h1>
          <p className="text-slate-600 mt-2">Render your resume data into a professional design and print to PDF.</p>
        </div>

        {/* Gap alerts (6+ months) */}
        {gapAlerts.length > 0 && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertDescription>
              We detected employment gaps of 6 months or more. Consider adding details or explanations:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {gapAlerts.map((msg, idx) => <li key={idx}>{msg}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {recommendProjectCV && <ProjectBasedCVHint />}

        <KyleOptimizeBanner resumeId={selectedResumeId} />
        {autoRedirectArmed && selectedResumeId && (
          <Alert className="border-slate-200 bg-white">
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>Redirecting to Resume Editor in a few seconds...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (redirectTimerRef.current) {
                    clearTimeout(redirectTimerRef.current);
                    redirectTimerRef.current = null;
                  }
                  setAutoRedirectArmed(false);
                }}
              >
                Stay here
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Select Resume & Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Resume</label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a resume to render" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.version_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Template</label>
                <Tabs value={template} onValueChange={setTemplate} className="mt-2">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="classic">Classic</TabsTrigger>
                    <TabsTrigger value="modern">Modern</TabsTrigger>
                    <TabsTrigger value="minimal">Minimal</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {appliedNote && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{appliedNote}</div>}

            <div className="flex flex-wrap gap-3 no-print">
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Print as PDF
              </Button>
              <Button onClick={handleDownloadHtml} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download HTML
              </Button>
              {selectedResumeId && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(`${createPageUrl("ResumeEditor")}?resumeId=${selectedResumeId}`)}
                >
                  Open Resume Editor
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Printable area: attach ref so we only print this */}
        <div id="print-area" ref={printRef} className="bg-white rounded-xl shadow">
          {renderTemplate()}
        </div>

        <TemplateHelperHint />

        {/* Gallery */}
        <TemplateGallery
          onPick={handleGalleryPick}
          items={templateItems}
          showAdminControls={isAdmin(currentUser)}
          onAdd={handleAddTemplate}
          onDelete={handleDeleteTemplate}
        />

        {/* Kyle Agent Chat */}
        <AgentChat
          agentName="kyle"
          agentTitle="Kyle - CV Expert"
          autoOpen
          autoSendInitial
          initialMessage={`Start by asking me: "Is there anything you'd like to change or optimize further?" Then advise whether a project-based CV would be stronger. Tenure stats: ${tenureStats ? `avg ${tenureStats.averageMonths} months, short stints ${tenureStats.shortStints}/${tenureStats.totalRoles}` : "not available"}.`}
          context={{
            page: "ResumeTemplates",
            resumeId: selectedResumeId,
            template,
            tenureStats,
            recommendProjectCV
          }}
        />
      </div>
    </div>
  );
}