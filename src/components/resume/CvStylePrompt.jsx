import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Award, Columns2 } from "lucide-react";

const OPTIONS = [
  {
    value: "chronological",
    label: "Chronological",
    description: "Clear career timeline, ATS-safe",
    icon: FileText,
    color: "border-blue-300 hover:bg-blue-50"
  },
  {
    value: "achievement",
    label: "Achievement",
    description: "Impact-first, results-led format",
    icon: Award,
    color: "border-amber-300 hover:bg-amber-50"
  },
  {
    value: "both",
    label: "Generate Both",
    description: "Compare side-by-side (recommended)",
    icon: Columns2,
    color: "border-purple-300 hover:bg-purple-50",
    recommended: true
  }
];

export default function CvStylePrompt({ onSelect, selectedStyle }) {
  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-purple-900">
          <Award className="w-5 h-5 text-purple-600" />
          Kyle detected this is a Senior-level role
        </CardTitle>
        <p className="text-sm text-purple-700">Which CV format would you like?</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = selectedStyle === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onSelect(opt.value)}
                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                    : `border-border ${opt.color}`
                }`}
              >
                {opt.recommended && (
                  <Badge className="absolute -top-2 right-2 bg-purple-600 text-white text-[10px]">
                    Recommended
                  </Badge>
                )}
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-purple-600" : "text-muted-foreground"}`} />
                <div className="font-medium text-sm text-foreground">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{opt.description}</div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}