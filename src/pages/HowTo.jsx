import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Compass, CheckCircle2, Sparkles, Crown, ArrowRight, BookOpen } from "lucide-react";

const quickStartSteps = [
  {
    title: "Analyze a job",
    description: "Paste a job description or URL to get instant alignment insights.",
    action: { label: "Go to Job Analysis", href: createPageUrl("JobAnalysis") }
  },
  {
    title: "Optimize your resume",
    description: "Use your master resume to tailor for that specific role.",
    action: { label: "Open Resume Optimizer", href: createPageUrl("ResumeOptimizer") }
  },
  {
    title: "Generate a cover letter",
    description: "Create a focused, role-specific cover letter in minutes.",
    action: { label: "Create Cover Letter", href: createPageUrl("CoverLetters") }
  }
];

const freeLimits = [
  { label: "Resume optimizations", value: "5 per week" },
  { label: "Job analyses", value: "10 per week" },
  { label: "Cover letters", value: "5 per week" }
];

const premiumUnlocks = [
  "Unlimited resume optimizations, job analyses, and cover letters",
  "Job matcher and application tracking",
  "Transferable skills and insights",
  "Autofill Vault + Application Q&A"
];

const navigationMap = [
  {
    title: "Start Here",
    items: ["Dashboard", "How to Use", "My Resumes", "New Build"]
  },
  {
    title: "Free AI (Weekly Limits)",
    items: ["Job Analysis", "Resume Optimizer", "Cover Letters"]
  },
  {
    title: "Premium & Growth",
    items: ["Job Matcher", "App Tracker", "Autofill Vault", "Transferable Skills", "Application Q&A", "Insights"]
  }
];

export default function HowTo() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-sm font-medium">
            <Compass className="w-4 h-4" />
            How to use Properly Hired
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Your simple, guided path to better applications</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow this quick playbook to move from job discovery to tailored materials fast — while staying inside your free weekly limits.
          </p>
        </div>

        <Card className="bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Quick start (3 steps)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {quickStartSteps.map((step) => (
              <div key={step.title} className="p-4 border border-border rounded-xl bg-background/60 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {step.title}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <Link to={step.action.href} className="inline-flex">
                  <Button variant="outline" size="sm" className="gap-2">
                    {step.action.label}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Navigation map
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {navigationMap.map((section) => (
                <div key={section.title} className="p-4 rounded-xl border border-border bg-muted/40">
                  <p className="text-sm font-semibold text-foreground mb-2">{section.title}</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {section.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30">
            <CardHeader>
              <CardTitle className="text-emerald-800 dark:text-emerald-200">Free weekly limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-emerald-800 dark:text-emerald-200">
              {freeLimits.map((limit) => (
                <div key={limit.label} className="flex items-center justify-between">
                  <span>{limit.label}</span>
                  <span className="font-semibold">{limit.value}</span>
                </div>
              ))}
              <Link to={createPageUrl("Pricing")} className="block pt-2">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  View paid unlocks
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <Crown className="w-5 h-5 text-amber-600" />
              What paid unlocks give you
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 text-sm text-amber-900 dark:text-amber-200">
            {premiumUnlocks.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}