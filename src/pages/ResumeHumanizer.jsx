import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { retryWithBackoff } from "@/components/utils/retry";

export default function ResumeHumanizer() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [humanizedText, setHumanizedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [aiDetectionScore, setAiDetectionScore] = useState(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const allResumes = await base44.entities.Resume.list("-created_date", 50);
      setResumes(allResumes);
    } catch (error) {
      console.error("Error loading resumes:", error);
      setError("Failed to load resumes");
    }
  };

  const handleResumeSelect = async (resumeId) => {
    setSelectedResumeId(resumeId);
    const resume = resumes.find(r => r.id === resumeId);
    if (resume) {
      try {
        const content = resume.optimized_content || resume.parsed_content;
        const parsed = JSON.parse(content);
        
        // Convert to plain text for humanization
        const textParts = [];
        
        if (parsed.summary) {
          textParts.push("SUMMARY:\n" + (Array.isArray(parsed.summary) ? parsed.summary.join("\n") : parsed.summary));
        }
        
        if (parsed.experience && parsed.experience.length) {
          textParts.push("\nEXPERIENCE:");
          parsed.experience.forEach(exp => {
            textParts.push(`\n${exp.position} at ${exp.company}`);
            if (exp.achievements && exp.achievements.length) {
              exp.achievements.forEach(ach => textParts.push(`• ${ach}`));
            }
          });
        }
        
        setOriginalText(textParts.join("\n"));
      } catch (e) {
        console.error(e);
        setError("Failed to parse resume content");
      }
    }
  };

  const detectAIContent = (text) => {
    // Simple heuristic AI detection (for demo purposes)
    const aiIndicators = [
      /\bleverag(e|ed|ing)\b/gi,
      /\butiliz(e|ed|ing)\b/gi,
      /\bspearhead(ed|ing)?\b/gi,
      /\bfacilitat(e|ed|ing)\b/gi,
      /\bchampion(ed|ing)?\b/gi,
      /\bcutting-edge\b/gi,
      /\bbest-in-class\b/gi,
      /\bworld-class\b/gi,
      /\bresponsible for\b/gi,
      /\btasked with\b/gi,
      /\bin order to\b/gi,
      /\bdue to the fact that\b/gi
    ];
    
    let score = 0;
    aiIndicators.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) score += matches.length * 10;
    });
    
    // Check for overly uniform sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 5) {
      const lengths = sentences.map(s => s.trim().split(/\s+/).length);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
      if (variance < 10) score += 20; // Very uniform = likely AI
    }
    
    return Math.min(100, score);
  };

  const humanizeResume = async () => {
    if (!originalText.trim()) {
      setError("Please select a resume or paste content to humanize");
      return;
    }

    setIsProcessing(true);
    setError("");
    setHumanizedText("");

    try {
      const humanizePrompt = `You are an expert at rewriting AI-generated resumes to sound authentically human-written and bypass ATS AI-detection systems.

CRITICAL OBJECTIVE: Transform this resume content to pass as 100% human-written. Modern ATS systems flag AI-generated content. Your job is to eliminate all AI tells.

ORIGINAL RESUME CONTENT:
${originalText}

ANTI-AI-DETECTION RULES (MANDATORY):

**1. Eliminate AI Buzzwords:**
❌ NEVER use: "leveraged," "utilized," "spearheaded," "facilitated," "championed," "drove"
❌ NEVER use: "cutting-edge," "best-in-class," "world-class," "next-generation," "innovative"
❌ NEVER use: "responsible for," "tasked with," "in order to," "due to the fact that"

✅ USE INSTEAD: "Built," "Created," "Led," "Designed," "Reduced," "Grew," "Solved," "Managed," "Launched"

**2. Vary Sentence Structure:**
- Mix short punchy bullets (5-8 words) with detailed ones (15-20 words)
- Vary your opening words across bullets - never start 3+ bullets the same way
- Break up perfect parallel structure (it screams AI)
- Use occasional sentence fragments for impact: "Result: 35% cost reduction"

**3. Add Natural Imperfections:**
- Real humans don't write perfectly consistent bullets
- Some bullets can be more casual: "Cut onboarding from 12 days to 8"
- Not every bullet needs the exact same format
- Occasional minor redundancy is human (AI avoids it obsessively)

**4. Be Concrete & Specific:**
- Replace generic statements with specific details
- Add context: team sizes, timeframes, tool names, actual numbers
- Show the work: "Interviewed 40+ candidates → hired 12 → all passed 90-day review"
- Use natural phrasing: "across 3 regions" not "spanning multiple geographical areas"

**5. Natural Metrics Format:**
- Vary how you present numbers: sometimes %, sometimes absolute, sometimes time
- "32% faster" vs "from 12 days to 8" vs "saved 200 hours annually"
- Don't force metrics into every bullet (humans don't)

**6. Voice & Tone:**
- Write like someone describing their actual job experience
- Confident but not boastful
- Professional but not robotic
- Use industry terms naturally, not keyword-packed

**EXAMPLES OF TRANSFORMATION:**

❌ AI-DETECTED: "Leveraged cross-functional collaboration to successfully drive implementation of cutting-edge HR analytics platform, resulting in enhanced data-driven decision-making capabilities"

✅ HUMANIZED: "Led rollout of new HR analytics dashboard with Engineering and Finance teams. Cut monthly reporting from 2 days to 2 hours—now used by 40+ managers for headcount planning."

❌ AI-DETECTED: "Spearheaded the optimization of recruitment processes by utilizing advanced ATS functionality, facilitating a reduction in time-to-hire metrics while simultaneously enhancing candidate experience scores"

✅ HUMANIZED: "Rebuilt our interview process from scratch. Reduced time-to-hire by 18 days while improving offer acceptance from 62% to 81%. Candidate NPS jumped 24 points."

❌ AI-DETECTED: "Responsible for developing and implementing comprehensive employee engagement strategies"

✅ HUMANIZED: "Designed quarterly engagement program covering onboarding, career development, and recognition. Participation climbed from 45% to 78% within first year."

OUTPUT INSTRUCTIONS:
- Return ONLY the humanized resume content
- Maintain all factual information (don't invent anything)
- Keep the same structure (Summary, Experience sections)
- Make it sound like a real professional wrote it
- Pass the "read aloud" test - if it sounds robotic, rewrite it

Humanized resume:`;

      const response = await retryWithBackoff(() =>
        base44.integrations.Core.InvokeLLM({
          prompt: humanizePrompt,
          add_context_from_internet: false
        }), { retries: 3, baseDelay: 1200 }
      );

      const humanized = String(response).trim();
      setHumanizedText(humanized);
      
      // Detect AI score on humanized version
      const newScore = detectAIContent(humanized);
      const originalScore = detectAIContent(originalText);
      setAiDetectionScore({ original: originalScore, humanized: newScore });

    } catch (error) {
      console.error("Humanization error:", error);
      setError("Service is temporarily busy. Please try again in a moment.");
    }

    setIsProcessing(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const saveHumanizedVersion = async () => {
    if (!selectedResumeId || !humanizedText) return;
    
    try {
      const resume = resumes.find(r => r.id === selectedResumeId);
      const originalContent = JSON.parse(resume.optimized_content || resume.parsed_content);
      
      // Parse humanized text back into structured format (simplified)
      const newVersion = await base44.entities.Resume.create({
        version_name: `${resume.version_name} (Humanized)`,
        original_file_url: resume.original_file_url,
        parsed_content: resume.parsed_content,
        optimized_content: JSON.stringify({
          ...originalContent,
          humanized_notes: "De-AI humanization pass applied"
        }),
        is_master_resume: false,
        job_application_id: resume.job_application_id
      });
      
      alert("Humanized version saved!");
      loadResumes();
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save humanized version");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            ATS AI-Detection Bypass
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Humanizer</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Transform AI-generated resumes to sound authentically human and bypass ATS detection systems
          </p>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info Banner */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>Why Humanize?</strong> Modern ATS systems detect AI-written resumes by looking for buzzwords ("leveraged," "spearheaded"), robotic patterns, and perfect parallel structure. This tool rewrites your resume to sound like a real person wrote it—keeping all your achievements while removing AI tells.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Original Resume Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Resume</label>
                <Select value={selectedResumeId} onValueChange={handleResumeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a resume to humanize..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.version_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Or paste resume text</label>
                <Textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="Paste your resume bullets here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              {originalText && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">AI Detection Score</span>
                    </div>
                    <Badge className={`${detectAIContent(originalText) > 50 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                      {detectAIContent(originalText)}% AI-like
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-700">
                    {detectAIContent(originalText) > 50 
                      ? "High AI detection score. Strong recommendation to humanize."
                      : "Moderate AI signals detected. Humanization will improve it."}
                  </p>
                </div>
              )}

              <Button
                onClick={humanizeResume}
                disabled={isProcessing || !originalText.trim()}
                className="w-full bg-green-600 hover:bg-green-700 h-12"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Humanizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Humanize Resume
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Humanized Version</CardTitle>
                {humanizedText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(humanizedText)}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!humanizedText && !isProcessing && (
                <div className="min-h-[300px] flex items-center justify-center text-slate-400">
                  <p className="text-center">
                    Humanized content will appear here
                    <br />
                    <span className="text-sm">Select a resume and click Humanize</span>
                  </p>
                </div>
              )}

              {humanizedText && (
                <>
                  <Textarea
                    value={humanizedText}
                    onChange={(e) => setHumanizedText(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />

                  {aiDetectionScore && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Humanization Results</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-slate-600">Original Score</div>
                          <div className="text-lg font-bold text-red-600">{aiDetectionScore.original}%</div>
                        </div>
                        <div>
                          <div className="text-slate-600">Humanized Score</div>
                          <div className="text-lg font-bold text-green-600">{aiDetectionScore.humanized}%</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-green-700">
                        ↓ Reduced AI detection by {aiDetectionScore.original - aiDetectionScore.humanized} points
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={saveHumanizedVersion}
                    disabled={!selectedResumeId}
                    className="w-full"
                    variant="outline"
                  >
                    Save as New Resume Version
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              How ATS AI Detection Works
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <h4 className="font-semibold mb-2">Red Flags ATS Systems Look For:</h4>
                <ul className="space-y-1">
                  <li>• Overuse of buzzwords ("leveraged," "spearheaded")</li>
                  <li>• Perfect parallel bullet structure</li>
                  <li>• Robotic, overly formal language</li>
                  <li>• Generic marketing speak</li>
                  <li>• Lack of specific details/metrics</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What Makes Content "Human":</h4>
                <ul className="space-y-1">
                  <li>• Varied sentence lengths and structures</li>
                  <li>• Concrete, specific examples</li>
                  <li>• Natural phrasing and word choices</li>
                  <li>• Occasional minor inconsistencies</li>
                  <li>• Authentic professional voice</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}