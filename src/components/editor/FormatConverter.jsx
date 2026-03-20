import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRightLeft, Award, FileText, AlertTriangle } from "lucide-react";
import { normalizeAchievementItem } from "@/components/utils/achievementItemUtils";

/**
 * Convert Achievement-Based format → Chronological format
 * Moves pillar items into experience achievements
 */
export function achievementToChronological(draft) {
  const converted = { ...draft };
  const pillars = converted.career_achievements || [];
  
  if (pillars.length > 0 && converted.experience?.length > 0) {
    // Collect all achievement texts
    const allItems = pillars.flatMap(p => 
      (p.items || []).map(item => normalizeAchievementItem(item).text)
    );
    
    // Distribute achievements across experience entries (proportionally)
    const expCount = converted.experience.length;
    const itemsPerRole = Math.ceil(allItems.length / expCount);
    
    converted.experience = converted.experience.map((exp, i) => ({
      ...exp,
      achievements: [
        ...(exp.achievements || []),
        ...allItems.slice(i * itemsPerRole, (i + 1) * itemsPerRole)
      ]
    }));
  }
  
  // Remove career_achievements 
  converted.career_achievements = [];
  
  // Rename executive_summary to summary if needed
  if (converted.executive_summary && !converted.summary) {
    converted.summary = converted.executive_summary;
  }
  
  return converted;
}

/**
 * Convert Chronological format → Achievement-Based format
 * Moves experience bullets into a single "Key Achievements" pillar
 */
export function chronologicalToAchievement(draft) {
  const converted = { ...draft };
  
  // Collect all experience achievements
  const allBullets = (converted.experience || []).flatMap(exp => 
    (exp.achievements || []).map(a => ({ text: a, formula: null }))
  );
  
  if (allBullets.length > 0) {
    converted.career_achievements = [
      { pillar_name: "KEY ACHIEVEMENTS", items: allBullets }
    ];
    
    // Strip achievements from experience (lightweight)
    converted.experience = (converted.experience || []).map(exp => ({
      ...exp,
      achievements: []
    }));
  }
  
  // Rename summary to executive_summary
  if (converted.summary && !converted.executive_summary) {
    converted.executive_summary = converted.summary;
  }
  
  return converted;
}

export default function FormatConverter({ currentFormat, onConvert }) {
  const [confirming, setConfirming] = React.useState(false);
  
  const targetFormat = currentFormat === "achievement" ? "chronological" : "achievement";
  const targetLabel = targetFormat === "achievement" ? "Achievement-Based" : "Chronological";
  const TargetIcon = targetFormat === "achievement" ? Award : FileText;

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardContent className="p-4">
        {!confirming ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-purple-800">
              <ArrowRightLeft className="w-4 h-4" />
              <span>Convert this resume to <strong>{targetLabel}</strong> format</span>
            </div>
            <Button size="sm" variant="outline" className="gap-1 border-purple-300 text-purple-700 hover:bg-purple-100" onClick={() => setConfirming(true)}>
              <TargetIcon className="w-3.5 h-3.5" />
              Convert
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-sm text-amber-800">
                {currentFormat === "achievement" 
                  ? "Converting to Chronological will move your pillar achievements into per-role bullet points. The original pillar structure will be removed."
                  : "Converting to Achievement-Based will move your per-role bullets into a single \"Key Achievements\" pillar. You can then reorganize into multiple pillars. Experience entries will become lightweight (no bullets)."
                }
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-1" onClick={() => { onConvert(targetFormat); setConfirming(false); }}>
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Confirm Convert to {targetLabel}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}