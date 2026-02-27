import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Camera, Sliders } from "lucide-react";

export default function TemplateCustomizer({ resume, resumeData, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const skills = resumeData?.skills || [];
  const skillLevels = resume?.skill_levels || {};

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !resume?.id) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Resume.update(resume.id, { profile_photo_url: file_url });
    if (onUpdate) onUpdate();
    setUploading(false);
  };

  const handleSkillLevel = async (skillName, level) => {
    if (!resume?.id) return;
    const updated = { ...skillLevels, [skillName]: level };
    await base44.entities.Resume.update(resume.id, { skill_levels: updated });
    if (onUpdate) onUpdate();
  };

  if (!resume) return null;

  return (
    <Card className="shadow border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          Template Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Photo */}
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-2">Profile Photo (for sidebar templates)</label>
          <div className="flex items-center gap-3">
            {resume.profile_photo_url ? (
              <img src={resume.profile_photo_url} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Camera className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <span className="flex items-center gap-1.5">
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {resume.profile_photo_url ? "Change Photo" : "Upload Photo"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Skill Levels */}
        {skills.length > 0 && (
          <div>
            <button
              onClick={() => setShowSkills(!showSkills)}
              className="text-xs font-medium text-slate-700 flex items-center gap-1 hover:text-blue-700 transition-colors"
            >
              Skill Proficiency Levels {showSkills ? "▾" : "▸"}
            </button>
            {showSkills && (
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {skills.slice(0, 12).map((s) => {
                  const level = skillLevels[s] || 70;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 w-32 truncate">{s}</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={level}
                        onChange={(e) => handleSkillLevel(s, parseInt(e.target.value))}
                        className="flex-1 h-1.5 accent-blue-600"
                      />
                      <span className="text-xs text-slate-400 w-8 text-right">{level}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}