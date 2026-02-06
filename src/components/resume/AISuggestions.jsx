import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Lightbulb, GraduationCap, TrendingUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AISuggestions({ suggestions }) {
  const [copiedItems, setCopiedItems] = React.useState(new Set());

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedItems(prev => new Set([...prev, id]));
    setTimeout(() => {
      setCopiedItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  if (!suggestions) return null;

  const { keywords = [], experience_suggestions = [], education_tips = [], skill_gaps = [] } = suggestions;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 mb-6"
    >
      {/* Keywords Section */}
      {keywords.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Target className="w-5 h-5 text-blue-600" />
              Must-Have Keywords for ATS
            </CardTitle>
            <p className="text-sm text-blue-700">These keywords from the job posting should appear in your resume</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Badge 
                    variant="outline" 
                    className="bg-white border-blue-300 text-blue-900 px-3 py-1 text-sm cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => copyToClipboard(keyword, `kw-${idx}`)}
                  >
                    {keyword}
                    {copiedItems.has(`kw-${idx}`) ? (
                      <Check className="w-3 h-3 ml-1 inline text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 ml-1 inline opacity-0 group-hover:opacity-100" />
                    )}
                  </Badge>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-3">💡 Click any keyword to copy it</p>
          </CardContent>
        </Card>
      )}

      {/* Experience Suggestions */}
      {experience_suggestions.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-900">
              <Lightbulb className="w-5 h-5 text-green-600" />
              Suggested Experience Phrases
            </CardTitle>
            <p className="text-sm text-green-700">
              These achievement phrases would strengthen your resume for this role
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {experience_suggestions.map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-lg p-3 border border-green-200 hover:border-green-400 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      <span className="font-semibold text-green-800">• </span>
                      {suggestion.text}
                    </p>
                    {suggestion.rationale && (
                      <p className="text-xs text-slate-500 mt-1 ml-3">
                        {suggestion.rationale}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(suggestion.text, `exp-${idx}`)}
                    className="shrink-0"
                  >
                    {copiedItems.has(`exp-${idx}`) ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Education & Certifications */}
      {education_tips.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              Education & Certifications to Highlight
            </CardTitle>
            <p className="text-sm text-purple-700">
              Emphasize these qualifications based on job requirements
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {education_tips.map((tip, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-2 p-2 rounded bg-white"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                <p className="text-sm text-slate-700">{tip}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skill Gaps */}
      {skill_gaps.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Skill Gaps to Address
            </CardTitle>
            <p className="text-sm text-amber-700">
              These skills from the job posting aren't prominently featured in your resume
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {skill_gaps.map((gap, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-white border border-amber-200"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">{gap.skill}</p>
                  <p className="text-xs text-slate-600 mt-1">{gap.suggestion}</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="text-center py-4">
        <p className="text-sm text-slate-600">
          💡 These are AI-generated suggestions. Review and adapt them to match your actual experience.
        </p>
      </div>
    </motion.div>
  );
}