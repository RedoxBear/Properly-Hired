import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Lock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const FEATURES = [
  "Banned AI-flagged verbs replaced with natural alternatives",
  "Removes corporate buzzword soup & compound-modifier stacking",
  "Varies sentence structure to avoid robotic patterns",
  "Plain scope bullets mixed with metric-driven ones",
  "Passes AI detection tools (GPTZero, Originality.ai)"
];

export default function HumanOptimizationToggle({ 
  enabled, 
  onToggle, 
  canUse, 
  usageCount, 
  usageLimit,
  currentTier 
}) {
  const isLocked = !canUse;
  const limitDisplay = usageLimit === -1 ? "Unlimited" : `${usageCount}/${usageLimit}`;
  
  return (
    <Card className={`border-2 transition-all ${
      enabled 
        ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30" 
        : "border-slate-200 dark:border-slate-700"
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className={`w-5 h-5 ${enabled ? "text-emerald-600" : "text-slate-400"}`} />
            <span className={enabled ? "text-emerald-900 dark:text-emerald-100" : "text-slate-700 dark:text-slate-300"}>
              Human Optimization
            </span>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2">
              PREMIUM
            </Badge>
          </CardTitle>
          
          {isLocked ? (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <Link 
                to={createPageUrl("Pricing")} 
                className="text-xs text-blue-600 hover:underline"
              >
                Upgrade
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {limitDisplay} this week
              </span>
              <Switch 
                checked={enabled} 
                onCheckedChange={onToggle}
                disabled={isLocked}
              />
            </div>
          )}
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Anti-AI detection framework — makes your resume sound authentically human-written
        </p>
      </CardHeader>
      
      {enabled && !isLocked && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-2">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-emerald-800 dark:text-emerald-200">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-800 dark:text-emerald-200 font-medium">
                Active — Your resume will be rewritten using natural, human voice patterns
              </span>
            </div>
          </div>
        </CardContent>
      )}
      
      {isLocked && (
        <CardContent className="pt-0">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {currentTier === "free" 
                ? "Free users get 1 Human Optimization per week. Upgrade to Pro for 20/week or Premium for 100/week."
                : "You've reached your weekly Human Optimization limit. Resets Monday."
              }
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}