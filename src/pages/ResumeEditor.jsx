import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle2, Sparkles, Star, TrendingUp, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { analyzeResumeAgainstJD } from "@/components/utils/articulation";
import { resumeJsonToPlainText } from "@/components/utils/resumeText";

export default function ResumeEditor() {
  const [resume, setResume] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");
  const [baselineScore, setBaselineScore] = useState(null);
  const [currentScore, setCurrentScore] = useState(null);
  const [improved, setImproved] = useState(false);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const resumeId = urlParams.get("resumeId");
  const isNew = urlParams.get("new") === "1";

  useEffect(() => {
    if (!resumeId) {
      setError("No resumeId provided.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const r = await base44.entities.Resume.get(resumeId);
        setResume(r);
        const parsed = safeParse(r.parsed_content);
        setDraft(parsed || {
          personal_info: {},
          summary: "",
          skills: [],
          highlights: "",
          experience: [],
          education: []
        });
        const base = Number(r?.quality_scores?.overall ?? 0);
        setBaselineScore(isFinite(base) ? base : null);
        setCurrentScore(isFinite(base) ? base : null);
      } catch (e) {
        console.error(e);
        setError("Could not load resume.");
      }
      setLoading(false);
    })();
  }, [resumeId]);

  const plain = useMemo(() => resumeJsonToPlainText(draft || {}), [draft]);

  function safeParse(json) {
    try { return json ? JSON.parse(json) : null; } catch { return null; }
  }

  const updateField = (path, value) => {
    setDraft((prev) => ({ ...(prev || {}), [path]: value }));
  };

  const updateExperience = (newExp) => {
    setDraft((prev) => ({ ...(prev || {}), experience: newExp }));
  };

  const updateEducation = (newEdu) => {
    setDraft((prev) => ({ ...(prev || {}), education: newEdu }));
  };

  const addExperience = () => {
    const current = draft?.experience || [];
    updateExperience([...current, { company: "", position: "", duration: "", location: "", achievements: [] }]);
  };

  const removeExperience = (index) => {
    const current = draft?.experience || [];
    updateExperience(current.filter((_, i) => i !== index));
  };

  const updateExperienceField = (index, field, value) => {
    const current = [...(draft?.experience || [])];
    current[index] = { ...current[index], [field]: value };
    updateExperience(current);
  };

  const updateExperienceAchievements = (index, value) => {
    const current = [...(draft?.experience || [])];
    const achievements = value.split('\n').filter(line => line.trim());
    current[index] = { ...current[index], achievements };
    updateExperience(current);
  };

  const addEducation = () => {
    const current = draft?.education || [];
    updateEducation([...current, { institution: "", degree: "", year: "" }]);
  };

  const removeEducation = (index) => {
    const current = draft?.education || [];
    updateEducation(current.filter((_, i) => i !== index));
  };

  const updateEducationField = (index, field, value) => {
    const current = [...(draft?.education || [])];
    current[index] = { ...current[index], [field]: value };
    updateEducation(current);
  };

  const rescore = async () => {
    setScoring(true);
    setError("");
    try {
      const analysis = await analyzeResumeAgainstJD(plain, "");
      const scoreNow = Number(analysis?.scores?.overall ?? 0);
      setCurrentScore(scoreNow);
      const base = Number(baselineScore ?? 0);
      setImproved(isFinite(base) && isFinite(scoreNow) ? scoreNow > base : false);
      
      await base44.entities.Resume.update(resumeId, {
        quality_scores: analysis?.scores || null,
        quality_flags: analysis?.flags || [],
        quality_last_analyzed_at: new Date().toISOString()
      });
      
      const updated = await base44.entities.Resume.get(resumeId);
      setResume(updated);
    } catch (e) {
      console.error(e);
      setError("Scoring failed. Please try again.");
    }
    setScoring(false);
  };

  const saveEdits = async () => {
    setSaving(true);
    setError("");
    try {
      const analysis = await analyzeResumeAgainstJD(plain, "");
      const payload = {
        parsed_content: JSON.stringify(draft),
        personal_info: draft.personal_info || {},
        skills: (draft.skills || []).slice(0, 8),
        experience: draft.experience || [],
        education: draft.education || [],
        quality_scores: analysis?.scores || null,
        quality_flags: analysis?.flags || [],
        quality_last_analyzed_at: new Date().toISOString()
      };
      await base44.entities.Resume.update(resumeId, payload);
      const updated = await base44.entities.Resume.get(resumeId);
      setResume(updated);
      const base = Number(updated?.quality_scores?.overall ?? 0);
      setCurrentScore(isFinite(base) ? base : null);
      if (baselineScore == null) setBaselineScore(base);
    } catch (e) {
      console.error(e);
      setError("Save failed. Please try again.");
    }
    setSaving(false);
  };

  const promoteToMaster = async () => {
    try {
      const masters = await base44.entities.Resume.filter({ is_master_resume: true }, "-created_date", 50);
      await Promise.all(masters.map(m => m.id !== resumeId ? base44.entities.Resume.update(m.id, { is_master_resume: false }) : Promise.resolve()));
      await base44.entities.Resume.update(resumeId, { is_master_resume: true });
      const updated = await base44.entities.Resume.get(resumeId);
      setResume(updated);
      navigate(createPageUrl("MyResumes"));
    } catch (e) {
      console.error(e);
      setError("Could not set this resume as Master.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center space-y-3">
        <p className="text-slate-700">{error || "Resume not found."}</p>
        <Button onClick={() => navigate(createPageUrl("MyResumes"))} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to My Resumes
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        {isNew && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>📝 Imported successfully!</strong> Improve your resume below and re-score. When ready, set it as your Master.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        )}

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Resume Editor</CardTitle>
              <p className="text-sm text-slate-600 mt-1">{resume.version_name}</p>
            </div>
            <div className="text-sm text-slate-600 space-y-1 text-right">
              <div>
                Baseline: <span className="font-semibold text-slate-800">{baselineScore ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                Current: <span className={`font-semibold ${improved ? "text-green-600" : "text-slate-800"}`}>{currentScore ?? "—"}</span>
                {improved && <TrendingUp className="w-4 h-4 text-green-600" />}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <Label className="text-base font-semibold mb-2 block">Career Summary</Label>
              <Textarea
                className="w-full min-h-[120px]"
                value={Array.isArray(draft?.summary) ? draft.summary.join("\n") : (draft?.summary || "")}
                onChange={(e) => updateField("summary", e.target.value)}
                placeholder="3-5 lines that frame your value. ATS-friendly keywords encouraged."
              />
              <p className="text-xs text-slate-500 mt-1">Keep it concise and impactful. This is your elevator pitch.</p>
            </section>

            <section>
              <Label className="text-base font-semibold mb-2 block">Core Competencies (max 8)</Label>
              <Input
                className="w-full"
                value={(draft?.skills || []).join(", ")}
                onChange={(e) => updateField("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean).slice(0, 8))}
                placeholder="e.g. Talent Strategy, Workforce Planning, OKRs, ATS"
              />
              <p className="text-xs text-slate-500 mt-1">Cap to 8 keywords to keep it tight and ATS-friendly.</p>
            </section>

            <section>
              <Label className="text-base font-semibold mb-2 block">Career Highlights</Label>
              <Textarea
                className="w-full min-h-[120px]"
                value={draft?.highlights || ""}
                onChange={(e) => updateField("highlights", e.target.value)}
                placeholder="Bulleted achievements from recent and past roles. Avoid repeating bullets used in work history."
              />
              <p className="text-xs text-slate-500 mt-1">Older achievements can appear here; keep work history lean.</p>
            </section>

            <section>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base font-semibold">Professional Experience</Label>
                <Button onClick={addExperience} size="sm" variant="outline" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Experience
                </Button>
              </div>
              <div className="space-y-4">
                {(draft?.experience || []).map((exp, index) => (
                  <Card key={index} className="bg-slate-50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <Label className="text-sm font-semibold text-slate-700">Experience {index + 1}</Label>
                        <Button onClick={() => removeExperience(index)} size="sm" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-slate-600">Position</Label>
                          <Input
                            value={exp.position || ""}
                            onChange={(e) => updateExperienceField(index, "position", e.target.value)}
                            placeholder="e.g. Senior Engineer"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Company</Label>
                          <Input
                            value={exp.company || ""}
                            onChange={(e) => updateExperienceField(index, "company", e.target.value)}
                            placeholder="e.g. Google"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Duration</Label>
                          <Input
                            value={exp.duration || ""}
                            onChange={(e) => updateExperienceField(index, "duration", e.target.value)}
                            placeholder="e.g. 2019-2024"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Location</Label>
                          <Input
                            value={exp.location || ""}
                            onChange={(e) => updateExperienceField(index, "location", e.target.value)}
                            placeholder="e.g. San Francisco, CA"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Achievements (one per line)</Label>
                        <Textarea
                          className="min-h-[100px]"
                          value={(exp.achievements || []).join("\n")}
                          onChange={(e) => updateExperienceAchievements(index, e.target.value)}
                          placeholder="Led team of 10 engineers&#10;Increased revenue by 25%&#10;Deployed 50+ features"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(draft?.experience || []).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No experience added yet. Click "Add Experience" to start.</p>
                )}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base font-semibold">Education</Label>
                <Button onClick={addEducation} size="sm" variant="outline" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Education
                </Button>
              </div>
              <div className="space-y-4">
                {(draft?.education || []).map((edu, index) => (
                  <Card key={index} className="bg-slate-50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <Label className="text-sm font-semibold text-slate-700">Education {index + 1}</Label>
                        <Button onClick={() => removeEducation(index)} size="sm" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-slate-600">Institution</Label>
                          <Input
                            value={edu.institution || ""}
                            onChange={(e) => updateEducationField(index, "institution", e.target.value)}
                            placeholder="e.g. Stanford University"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Degree</Label>
                          <Input
                            value={edu.degree || ""}
                            onChange={(e) => updateEducationField(index, "degree", e.target.value)}
                            placeholder="e.g. BS Computer Science"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Year</Label>
                          <Input
                            value={edu.year || ""}
                            onChange={(e) => updateEducationField(index, "year", e.target.value)}
                            placeholder="e.g. 2020"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(draft?.education || []).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No education added yet. Click "Add Education" to start.</p>
                )}
              </div>
            </section>

            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button onClick={rescore} disabled={scoring} variant="outline" className="gap-2">
                {scoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scoring
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Re-score
                  </>
                )}
              </Button>
              <Button onClick={saveEdits} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button variant="ghost" onClick={() => navigate(createPageUrl("MyResumes"))} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to My Resumes
              </Button>
            </div>
          </CardContent>
        </Card>

        {improved && !resume?.is_master_resume && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                This version beats your baseline!
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={promoteToMaster} className="bg-green-600 hover:bg-green-700 gap-2">
                <Star className="w-4 h-4" />
                Make this my Master Resume
              </Button>
              <p className="text-sm text-green-800 self-center">
                Your Master score becomes the benchmark for all optimized resumes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}