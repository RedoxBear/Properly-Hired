import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { JobApplication } from "@/entities/JobApplication";
import { Resume } from "@/entities/Resume";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Printer, Save, Sparkles, Loader2, Building, MessageCircle, Target, Lightbulb, Heart, Briefcase } from "lucide-react";
import { USER_DEFAULT, fillTemplate } from "@/components/coverletter/template";
import { getVault } from "@/components/utils/vault";
import { fetchOrgResearch } from "@/components/utils/orgResearch";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import CompanyResearchCard from "@/components/company/CompanyResearchCard";
import { retryWithBackoff } from "@/components/utils/retry";
import { canPerformAction, getWeekStart, getTierLimit, formatLimit, TIERS } from "@/components/utils/accessControl";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";
import { HUMAN_OPTIMIZATION_SYSTEM_PROMPT } from "@/components/resume/HumanOptimizationPrompt";
import HumanVoiceScanCard from "@/components/scanner/HumanVoiceScanCard";

export default function CoverLetter() {
  const [params] = useSearchParams();
  const appId = params.get("id") || "";
  const urlRecruiterMode = params.get("mode") === "recruiter";
  const [app, setApp] = useState(null);
  const [vault, setVault] = useState(null);
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [orgResearch, setOrgResearch] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [openingStyle, setOpeningStyle] = useState("direct_hook");
  
  // NEW: Tone and emphasis controls
  const [tone, setTone] = useState("professional");
  const [keyPoints, setKeyPoints] = useState("");
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(0);
  
  // AI Feedback state
  const [aiFeedback, setAIFeedback] = useState(null);
  const [isCheckingFeedback, setIsCheckingFeedback] = useState(false);
  const feedbackTextRef = useRef("");

  // Recruiter mode state (agency posting detection)
  const [isRecruiterMode, setIsRecruiterMode] = useState(urlRecruiterMode);

  // Tier limit enforcement
  const [currentUser, setCurrentUser] = useState(null);
  const [coverLetterCount, setCoverLetterCount] = useState(0);

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
  const [template, setTemplate] = useState(USER_DEFAULT);

  useEffect(() => {
    (async () => {
      if (appId) {
        try {
          const a = await JobApplication.get(appId);
          setApp(a);
          // Auto-detect recruiter mode from agency analysis
          if (a.llm_analysis_result?.is_recruitment_agency && a.llm_analysis_result.agency_confidence >= 50) {
            setIsRecruiterMode(true);
          }
          
          let currentResume = null;

          if (a.optimized_resume_id) {
            try {
              const resume = await Resume.get(a.optimized_resume_id);
              currentResume = resume;
              setOptimizedResume(resume);
            } catch (e) {
              console.error("Failed to load optimized resume:", e);
            }
          }
          
          if (!currentResume) {
            try {
              const masters = await Resume.filter({ is_master_resume: true }, "-created_date", 1);
              if (masters && masters[0]) {
                currentResume = masters[0];
                setOptimizedResume(masters[0]);
                setError("");
              } else {
                setError("No resume found. Please upload a master resume or optimize one for this job first.");
              }
            } catch (e) {
              console.error("Failed to load master resume:", e);
              setError("No resume available. Please upload a resume first from My Resumes.");
            }
          }
          
          if (a.summary?.company_overview || a.summary?.research_snapshot) {
            setOrgResearch({
              overview: a.summary.company_overview,
              ...a.summary.research_snapshot
            });
          } else if (a.company_name) {
            setIsResearchLoading(true);
            try {
              const research = await fetchOrgResearch(a.company_name);
              setOrgResearch(research);
              
              await JobApplication.update(appId, {
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
      try {
        const vaultData = await getVault();
        setVault(vaultData);
      } catch (e) {
        console.error("Failed to load autofill vault:", e);
        setVault(null);
      }
    })();
  }, [appId]);

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

  // Load user and cover letter count for tier limits
  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Count this week's cover letters (Monday to Sunday)
        const weekStart = getWeekStart();
        const allApplications = await JobApplication.list("-created_date", 500);
        const weeklyCount = allApplications.filter(app =>
          app.cover_letter_text && new Date(app.updated_date || app.created_date) >= weekStart
        ).length;
        setCoverLetterCount(weeklyCount);
      } catch (e) {
        console.warn("Failed to load user for tier check:", e);
      }
    })();
  }, []);

  const output = useMemo(() => fillTemplate(template, vars), [template, vars]);

  const onVar = (k) => (e) => setVars({ ...vars, [k]: e.target.value });

  const toneConfigs = {
    professional: {
      label: "Professional",
      description: "Balanced, polished tone suitable for most corporate roles",
      instructions: "Use clear, professional language. Maintain formality while staying approachable."
    },
    enthusiastic: {
      label: "Enthusiastic",
      description: "Show genuine excitement and energy for the opportunity",
      instructions: "Express authentic enthusiasm and passion. Use active, energetic language while remaining professional."
    },
    concise: {
      label: "Concise",
      description: "Brief and to-the-point, respecting busy hiring managers",
      instructions: "Be direct and efficient. Every sentence should add value. Aim for shorter paragraphs."
    },
    formal: {
      label: "Formal",
      description: "Traditional business tone for conservative industries",
      instructions: "Use formal business language. Maintain traditional structure and decorum."
    }
  };

  const openingStyles = {
    direct_hook: {
      label: "Direct Hook",
      icon: Target,
      description: "Start immediately with a compelling connection to the company or role",
      example: "When I saw your team's recent work on [specific project], I immediately thought: this is where I want to contribute next.",
      instructions: `**Opening Style: Direct Hook**

START RULES - CRITICAL:
❌ NEVER start with: "I am writing to express", "I am writing in response to", "Please accept this letter", "I am interested in", "I would like to apply"
❌ NEVER use formal/robotic openings
❌ DO NOT start with your name or "My name is"

✅ START with one of these patterns:
- "When I [saw/learned/discovered] [specific company detail], I [immediate reaction]"
- "[Specific observation about company] is exactly why I'm applying for [role]"
- "Your recent [project/achievement/announcement] caught my attention because [personal connection]"
- Start with a direct statement about the role: "[Role] at [Company] combines [thing 1] and [thing 2]—exactly what I've been building toward"

MUST include in first 2 sentences:
1. Specific detail about the company (from research: ${orgResearch ? `${orgResearch.overview?.substring(0, 100)}...` : 'their mission/work'})
2. The position title: ${app?.job_title || '[role]'}
3. WHY this specific company/role interests you (be genuine, not generic)

Make it feel like you're starting a conversation with someone you're genuinely excited to talk to.`
    },
    shared_value: {
      label: "Shared Values",
      icon: Heart,
      description: "Lead with alignment between your values and the company's mission",
      example: "Building accessible technology that genuinely serves people—not just checking compliance boxes—is what drives my work. That's why [Company]'s mission resonates so deeply with me.",
      instructions: `**Opening Style: Shared Values**

START RULES - CRITICAL:
❌ NEVER start with: "I am writing to", "I am excited to express", "Please consider", "I would like to"
❌ NEVER use generic value statements that could apply to ANY company
❌ DO NOT be overly sentimental or use marketing language

✅ START with one of these patterns:
- "[Specific value/principle you hold] is what drew me to [Company]'s work on [specific initiative]"
- "I've always believed [specific belief]. That's exactly what I see in [Company]'s approach to [specific thing they do]"
- "When a company prioritizes [specific company value from research], you know they're serious about [outcome]. That's why [role] at [Company] is compelling to me"
- "[Specific observation about their mission/culture] mirrors my own approach to [your field]"

MUST include:
1. A SPECIFIC value/principle (not generic like "excellence" or "teamwork")
2. How the company demonstrates this value in a concrete way (use research: ${orgResearch ? `${orgResearch.overview?.substring(0, 100)}...` : 'their specific work'})
3. Connection to the role: ${app?.job_title || '[role]'}

Make it genuine and specific—sound like you've actually thought about why THIS company, not just any company.`
    },
    problem_solution: {
      label: "Problem-Solution",
      icon: Lightbulb,
      description: "Open by demonstrating understanding of a key challenge and positioning yourself as part of the solution",
      example: "Scaling HR operations while maintaining the personal touch that makes employees feel valued—that's the challenge growing companies face. It's also exactly what I've solved in my last two roles.",
      instructions: `**Opening Style: Problem-Solution Insight**

START RULES - CRITICAL:
❌ NEVER start with: "I am writing", "I wish to apply", "This letter is in response to"
❌ NEVER state obvious/generic problems ("Every company wants to grow")
❌ DO NOT present yourself as having all the answers (sounds arrogant)

✅ START with one of these patterns:
- "[Specific challenge in the industry/role]—that's the puzzle I've been working on for [time period]. It's also what makes [role] at [Company] so interesting"
- "As [their industry] evolves toward [specific trend/challenge], companies like [Company] need [specific capability]. I've been building exactly that skill set"
- "[Observation about a challenge from JD]: ${app?.job_description?.substring(0, 150) || '[challenge]'}... I've seen this firsthand and developed [approach] to address it"

MUST include:
1. A SPECIFIC challenge (drawn from JD or industry context)
2. Evidence you understand the nuance (not just surface-level)
3. Brief hint at your relevant experience (save details for body paragraphs)
4. The role: ${app?.job_title || '[role]'}

Sound like someone who understands the real work, not a consultant selling solutions.`
    },
    natural_conversation: {
      label: "Natural Conversation",
      icon: MessageCircle,
      description: "Start like you're talking to a real person—warm, professional, and genuine",
      example: "I don't usually apply to roles within 24 hours of seeing them posted, but when I read about [specific aspect of role], I had to reach out. This is exactly the kind of work I want to be doing.",
      instructions: `**Opening Style: Natural Conversation**

START RULES - CRITICAL:
❌ NEVER start with: "I am writing to apply", "Please accept my application", "I am interested in the position"
❌ NEVER be overly casual or use slang
❌ DO NOT try too hard to be clever or funny

✅ START with one of these patterns:
- "I don't usually [normal behavior], but when I [saw/learned about] [specific thing], I had to [action]. This is [genuine reaction]"
- "Full transparency: [honest statement about your situation/interest]. That's why [role] at [Company] caught my attention"
- "[Short personal observation or reaction], which is exactly how I felt when I came across [role] at [Company]"
- Start with what you've been doing: "For the past [timeframe], I've been [relevant activity]. When I learned about [Company]'s work on [specific thing], it felt like a natural next step"

MUST include:
1. A genuine, human reaction or observation
2. Specific detail about the role/company (not generic)
3. The position: ${app?.job_title || '[role]'}
4. WHY NOW (what prompted you to apply)

Write like you're explaining to a friend why you're excited about this opportunity. Professional but human.`
    }
  };

  const selectedStyleConfig = openingStyles[openingStyle];
  const selectedToneConfig = toneConfigs[tone];

  const generateCoverLetter = async (generateMultiple = false) => {
    // Check tier limits
    if (!canPerformAction(currentUser, "cover_letter", coverLetterCount)) {
      setError("You've reached your weekly cover letter limit. Upgrade to Pro for more cover letters.");
      return;
    }

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
      const resumeData = optimizedResume.optimized_content 
        ? JSON.parse(optimizedResume.optimized_content)
        : JSON.parse(optimizedResume.parsed_content);

      const candidateName = vars.candidate_name || resumeData?.personal_info?.name || "Candidate";
      const companyName = app.company_name;
      
      const achievements = [];
      if (resumeData.experience) {
        resumeData.experience.forEach(exp => {
          if (exp.achievements && exp.achievements.length > 0) {
            achievements.push(...exp.achievements.slice(0, 2));
          }
        });
      }
      
      const skillsText = Array.isArray(resumeData.skills) 
        ? resumeData.skills.slice(0, 8).join(", ") 
        : "";

      const keyPointsText = keyPoints.trim()
        ? `\n**KEY POINTS TO EMPHASIZE (MUST address these):**\n${keyPoints}\n`
        : "";

      const recruiterPrompt = isRecruiterMode ? `You are an expert at writing brief, conversational recruiter outreach messages — NOT formal cover letters.

**CONTEXT:** This job posting is from a recruitment/staffing agency${app?.llm_analysis_result?.agency_name ? ` (${app.llm_analysis_result.agency_name})` : ''}, not the direct employer.

**OBJECTIVE:** Write a brief, warm, professional message to the recruiter that:
1. Shows genuine interest in the opportunity
2. Highlights 3-4 top matching skills from the candidate's background
3. Includes qualifying questions (client/company name, salary range, contract vs permanent, exclusivity)
4. Suggests connecting on LinkedIn
5. Keeps it conversational — NOT a formal cover letter

**Job Details:**
- Position: ${app?.job_title || '[role]'}
- Agency/Company: ${app?.company_name || '[company]'}
- Job Description: ${app?.job_description || ''}
${keyPointsText}
**Candidate Information:**
- Name: ${candidateName}
- LinkedIn: ${vars.candidate_linkedin}

**Candidate's Background:**
- Career Summary: ${resumeData.summary || resumeData.executive_summary || ""}
- Top Skills: ${skillsText}
- Key Achievements:
${achievements.slice(0, 5).map(a => `  • ${a}`).join('\n')}

**WRITING GUIDELINES:**
- Keep the total message under 200 words
- Use a friendly, professional tone — like reaching out to a potential business contact
- Do NOT use formal letter formatting (no "Dear Sir/Madam", no "Sincerely")
- Weave in skills naturally, not as a list
- End with qualifying questions and a LinkedIn connection suggestion

**OUTPUT FORMAT:**
Return a JSON object with these 4 strings:
{
  "intro_mission": "2-3 sentence opening — express interest and briefly introduce yourself",
  "para_experience": "3-4 sentences highlighting your most relevant skills and experience for this role",
  "para_alignment": "2-3 sentences with qualifying questions for the recruiter (client name, salary range, contract vs perm, exclusivity)",
  "closing": "1-2 sentences suggesting next steps — LinkedIn connection, quick call"
}` : null;

      const prompt = recruiterPrompt || `You are an expert cover letter writer who creates compelling, personalized, and authentically human cover letters.

CRITICAL OBJECTIVE: Write a cover letter that sounds 100% human-written and passes ATS AI-detection systems.

**TONE REQUIREMENT:** ${selectedToneConfig.instructions}

═══════════════════════════════════════════
VOICE RULES (NON-NEGOTIABLE)
═══════════════════════════════════════════
- Write as if talking to the hiring manager over coffee, not presenting at a board meeting.
- Use contractions naturally (I'm, I've, I'd, doesn't, wasn't). Zero-contraction formality is BANNED.
- Vary paragraph length — let the important paragraph run long, keep supporting points short.
- No four-item abstract noun lists in closings (e.g., "passion, dedication, leadership, and integrity" is BANNED).

═══════════════════════════════════════════
BANNED PHRASES (instant rejection if used)
═══════════════════════════════════════════
❌ "at the intersection of..."
❌ "navigate ambiguity" / "navigate complexity"
❌ "care-adjacent" or ANY "[noun]-adjacent" construction
❌ "signal quality" or other engineer-speak in HR context
❌ Any tagline in the header (e.g., "Architect of the Ecosystem")
❌ "Leveraged," "utilized," "spearheaded," "facilitated"
❌ "I am excited to express my interest" (too formal/robotic)
❌ "Best-in-class," "world-class," "cutting-edge"
❌ Generic phrases that could apply to ANY company
❌ Buzzword soup and keyword stuffing
❌ Resume bullets or achievement lists

═══════════════════════════════════════════
METRICS IN COVER LETTERS
═══════════════════════════════════════════
- Use casual phrasing: "about $1.1M" not "$1.1 million annually"
- Round where appropriate: "roughly 50 roles" not "50+ roles"
- Don't attach a metric to every example — one or two is enough. Let some achievements breathe without numbers.

CRITICAL OUTPUT RULES:
❌ DO NOT copy-paste resume bullets or raw achievement text
❌ DO NOT include company names from resume in the output (except when naturally referencing your experience)
❌ DO NOT output any resume-style bullet points
✅ Write ONLY in flowing paragraph prose
✅ Transform achievements into natural storytelling
✅ Output ONLY the 4 requested paragraphs - nothing else

**Job Application Details:**
- Position: ${app.job_title}
- Company: ${companyName}
- Job Description: ${app.job_description}
${keyPointsText}
**Candidate Information:**
- Name: ${candidateName}
- Email: ${vars.candidate_email}
- Phone: ${vars.candidate_phone}
- LinkedIn: ${vars.candidate_linkedin}

**Candidate's Background (USE FOR CONTEXT ONLY - DO NOT COPY VERBATIM):**
- Career Summary: ${resumeData.summary || resumeData.executive_summary || ""}
- Top Skills: ${skillsText}
- Key Achievements (TRANSFORM into natural prose):
${achievements.slice(0, 5).map(a => `  • ${a}`).join('\n')}

**Organization Research:**
${orgResearch ? `
- Company Overview: ${orgResearch.overview || "Not available"}
- Industry: ${orgResearch.industry || "Not specified"}
- Company Size: ${orgResearch.size || "Not specified"}
- Location: ${orgResearch.headquarters || vars.company_city_state_zip}
- Founded: ${orgResearch.founded || "Not specified"}
- Website: ${orgResearch.website || "Not available"}
` : "Limited organization data available."}

**Key Requirements from Job Posting:**
${(app.key_requirements || []).slice(0, 5).map(req => `- ${req}`).join('\n')}

**CRITICAL WRITING GUIDELINES - ANTI-AI DETECTION:**

${selectedStyleConfig.instructions}

═══════════════════════════════════════════
STRUCTURE (STRICT)
═══════════════════════════════════════════

**Paragraph 1 — Why this role, why now (3-4 sentences MAX):**
- Follow the selected opening style above.
- Hook the reader with something specific about THIS company/role.
- Keep it tight. Don't front-load your life story here.

**Paragraph 2 — The proof (THIS IS THE LONGEST PARAGRAPH, 4-6 sentences):**
- 2-3 company examples with specific facts from your background.
- Weave in metrics casually (remember: "about $1.1M", not "$1.1 million annually").
- Tell brief stories, don't list achievements.
- This paragraph should feel substantial — it carries the weight of the letter.

**Paragraph 3 — The company-specific connection (3-4 sentences):**
- What about THIS company's situation fits your experience?
- Demonstrate you've done your homework using the organization research above.
- Be specific — name a product, initiative, or challenge they face.

**Paragraph 4 (optional) — Secondary skill if relevant (2 sentences MAX):**
- Only include if there's a clear secondary angle (analytics, AI, language, etc.).
- Keep it brief. If it doesn't add value, skip it entirely.

**Closing (2-3 sentences):**
- Just say you want the job. Be direct.
- No stacking abstract qualities ("I bring passion, integrity, resilience, and vision...").
- Warm but not groveling.

**OUTPUT FORMAT:**

Return ONLY a JSON object with these 4 clean paragraph strings:
{
  "intro_mission": "3-4 sentence opening paragraph following the ${openingStyle} style with ${tone} tone — why this role, why now",
  "para_experience": "The proof — 4-6 sentence paragraph with 2-3 company examples, specific facts, casual metrics. This is the longest paragraph.",
  "para_alignment": "3-4 sentence paragraph on company-specific connection. If a secondary skill is relevant, append 1-2 sentences about it here.",
  "closing": "2-3 sentence closing. Direct, warm. No abstract noun stacking."
}`;

      const numVariations = generateMultiple ? 3 : 1;
      const generatedVariations = [];

      for (let i = 0; i < numVariations; i++) {
        const response = await retryWithBackoff(() =>
          base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: false,
            response_json_schema: {
              type: "object",
              properties: {
                intro_mission: { type: "string" },
                para_experience: { type: "string" },
                para_alignment: { type: "string" },
                closing: { type: "string" }
              }
            }
          }), { retries: 3, baseDelay: 1200 }
        );

        const sanitize = (text) => {
          if (!text) return "";
          return String(text)
            .replace(/^[\s]*[•·*-]\s+/gm, '')
            .replace(/^[\s]*(Role|Position|Company|Duration):\s*/gmi, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        };

        generatedVariations.push({
          intro_mission: sanitize(response.intro_mission),
          para_experience: sanitize(response.para_experience),
          para_alignment: sanitize(response.para_alignment),
          closing: sanitize(response.closing)
        });
      }

      if (generateMultiple) {
        setVariations(generatedVariations);
        setSelectedVariation(0);
      }

      // Apply first variation
      setVars(prev => ({
        ...prev,
        ...generatedVariations[0]
      }));

    } catch (e) {
      console.error("Cover letter generation error:", e);
      setError("Failed to generate cover letter. Please try again or write manually.");
    }

    setIsGenerating(false);
  };

  const applyVariation = (index) => {
    setSelectedVariation(index);
    setVars(prev => ({
      ...prev,
      ...variations[index]
    }));
  };

  const handleSave = async () => {
    if (!appId) return;
    try {
      await JobApplication.update(appId, {
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

  const runAIFeedback = async () => {
    setIsCheckingFeedback(true);
    setAIFeedback(null);
    let textToCheck = output;
    feedbackTextRef.current = textToCheck;
    try {
      const prompt = `You are a world-class recruiter and AI/ATS expert. Carefully review the following cover letter for recruiter appeal, clarity, human tone, and ATS-friendliness.\n\nCover Letter:\n${textToCheck}\n\nReturn ONLY a JSON array of objects: [{\n  "issue": string, // short description of the problem or opportunity\n  "original": string, // the problematic or improvable sentence/phrase\n  "suggestion": string // improved version or actionable advice\n}]`;
      const response = await retryWithBackoff(() => base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              issue: { type: "string" },
              original: { type: "string" },
              suggestion: { type: "string" }
            }
          }
        }
      }), { retries: 2, baseDelay: 1200 });
      setAIFeedback(response);
    } catch (e) {
      setAIFeedback([{ issue: "Error running AI feedback", original: "", suggestion: "Try again later." }]);
    }
    setIsCheckingFeedback(false);
  };

  return (
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
          {isRecruiterMode ? <MessageCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          {isRecruiterMode ? "Recruiter Message" : "Cover Letter"}
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

      {/* Tier Limit Warning */}
      {currentUser && !canPerformAction(currentUser, "cover_letter", coverLetterCount) && (
        <UpgradePrompt
          feature="cover_letters_weekly"
          currentTier={currentUser.subscription_tier || TIERS.FREE}
          variant="alert"
        />
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isResearchLoading && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Researching organization...
          </AlertDescription>
        </Alert>
      )}

      {orgResearch && <CompanyResearchCard company={app?.company_name} orgResearch={orgResearch} />}

      {/* Recruitment Agency Banner */}
      {isRecruiterMode && (
        <Alert className="bg-amber-50 border-amber-300">
          <MessageCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <span className="font-semibold">Agency Posting Detected</span>
            {app?.llm_analysis_result?.agency_name && (
              <span> — {app.llm_analysis_result.agency_name}</span>
            )}
            <span className="block mt-1 text-sm text-amber-700">
              This job is from a recruitment agency. The generator will produce a brief recruiter outreach message instead of a formal cover letter. Focus on building a relationship and asking qualifying questions.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Generate Section */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-green-800 mb-1">
              {isRecruiterMode ? "AI-Powered Recruiter Message Generator" : "AI-Powered Cover Letter Generator"}
            </h3>
            <p className="text-sm text-green-700 mb-4">
              {isRecruiterMode
                ? "Generates a brief, conversational recruiter outreach message with qualifying questions — optimized for agency postings."
                : "Combines your optimized resume + organization research + job requirements to create personalized, human-sounding cover letters."
              }
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Tone Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-green-800">Tone:</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(toneConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-slate-500">{config.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Opening Style Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-green-800">Opening Style:</label>
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
              </div>
            </div>

            {/* Key Points Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-green-800">Key Points to Emphasize (Optional):</label>
              <Textarea
                placeholder="List specific experiences, skills, or achievements you want highlighted in the cover letter..."
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                className="min-h-[80px] bg-white"
              />
              <p className="text-xs text-green-700">
                Example: "3 years managing remote teams", "Led digital transformation project", "Fluent in Spanish"
              </p>
            </div>

            {/* Style Preview */}
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                {React.createElement(selectedStyleConfig.icon, { className: "w-4 h-4 text-green-600 mt-0.5" })}
                <div>
                  <div className="font-medium text-sm text-slate-800">{selectedStyleConfig.label} - {selectedToneConfig.label}</div>
                  <div className="text-xs text-slate-600">{selectedStyleConfig.description}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 italic mt-2 pl-6">
                Example: "{selectedStyleConfig.example}"
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => generateCoverLetter(false)}
              disabled={isGenerating || !app || !optimizedResume}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isRecruiterMode ? "Generate Recruiter Message" : "Generate Cover Letter"}
                </>
              )}
            </Button>
            <Button
              onClick={() => generateCoverLetter(true)}
              disabled={isGenerating || !app || !optimizedResume}
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              Generate 3 Variations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variations Selector */}
      {variations.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 text-base">Generated Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {variations.map((_, index) => (
                <Button
                  key={index}
                  onClick={() => applyVariation(index)}
                  variant={selectedVariation === index ? "default" : "outline"}
                  size="sm"
                >
                  Variation {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            {/* Human Voice Scan for Cover Letter */}
            {output.trim() && (
              <div className="mt-4">
                <HumanVoiceScanCard
                  text={output}
                  label="Human Voice Scan — Cover Letter"
                />
              </div>
            )}

            <div className="mt-6">
              <Button onClick={runAIFeedback} disabled={isCheckingFeedback} className="mb-4">
                {isCheckingFeedback ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isCheckingFeedback ? "Checking..." : "Get AI Feedback"}
              </Button>
              {aiFeedback && aiFeedback.length > 0 && (
                <div className="space-y-3">
                  {aiFeedback.map((s, i) => (
                    <div key={i} className="border rounded p-2 bg-slate-50">
                      <div className="text-xs text-slate-500 mb-1">{s.issue}</div>
                      <div><span className="font-semibold">Original:</span> {s.original}</div>
                      <div><span className="font-semibold">Suggestion:</span> {s.suggestion}</div>
                    </div>
                  ))}
                </div>
              )}
              {aiFeedback && aiFeedback.length === 0 && (
                <div className="text-green-700">No major recruiter/AI issues found!</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}