import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  Mail,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Users,
  Brain,
  TrendingUp,
  BarChart3,
  MessageCircle,
} from "lucide-react";

const LOGO_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af4e866eafaf5bc320af8a/0cf860df6_Prague-DayAcceptedConcept.jpg";
const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af4e866eafaf5bc320af8a/468690cdf_Prague-DayAcceptedConcept-DarkMode.jpg";

const features = [
  {
    icon: Search,
    title: "Job Analysis",
    description: "Paste any job posting — get instant ghost job detection, role classification, ATS keywords, and salary benchmarks.",
    color: "bg-blue-500",
    link: "JobAnalysis",
  },
  {
    icon: Target,
    title: "Resume Optimizer",
    description: "AI matches your resume against the job description and rewrites bullet points to maximize ATS pass rate.",
    color: "bg-cyan-500",
    link: "ResumeOptimizer",
  },
  {
    icon: Mail,
    title: "Cover Letter Generator",
    description: "Generate tailored cover letters using the ARC formula — aligned to each role's requirements and company culture.",
    color: "bg-green-500",
    link: "CoverLetters",
  },
  {
    icon: Brain,
    title: "Dual AI Agents",
    description: "Simon analyzes the opportunity. Kyle builds your materials. They collaborate so your application package is cohesive.",
    color: "bg-purple-500",
    link: "AgentWorkspace",
  },
  {
    icon: BarChart3,
    title: "Application Tracker",
    description: "Track every application from analysis to offer. Follow-up reminders, status updates, and pipeline analytics.",
    color: "bg-orange-500",
    link: "ApplicationTracker",
  },
  {
    icon: TrendingUp,
    title: "Transferable Skills",
    description: "Discover cross-industry skills powered by O*NET data. Find roles you're qualified for that you hadn't considered.",
    color: "bg-pink-500",
    link: "TransferableSkills",
  },
];

const steps = [
  {
    num: "1",
    title: "Paste a Job Posting",
    desc: "Drop in any job URL or description. Simon identifies red flags, extracts keywords, and classifies the role.",
  },
  {
    num: "2",
    title: "Upload Your Resume",
    desc: "Your master CV becomes the foundation. AI scores it against the target role and identifies gaps.",
  },
  {
    num: "3",
    title: "Get Your Package",
    desc: "Optimized resume, tailored cover letter, and interview prep — all aligned to the specific role.",
  },
];

const stats = [
  { value: "100-pt", label: "Ghost Job Scoring" },
  { value: "8-Signal", label: "RAG Retrieval" },
  { value: "O*NET", label: "Occupational Data" },
  { value: "STAR", label: "Interview Prep" },
];

export default function Home() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [hasData, setHasData] = React.useState(null);

  React.useEffect(() => {
    checkUserData();
  }, []);

  const checkUserData = async () => {
    try {
      const apps = await base44.entities.JobApplication.list("-created_date", 1);
      if (apps && apps.length > 0) {
        setHasData(true);
      } else {
        setHasData(false);
      }
    } catch {
      setHasData(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-950" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-80 h-80 bg-orange-300/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm px-4 py-1.5">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Career Navigation
                </Badge>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                  Stop Guessing.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-200">
                    Start Landing.
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Analyze any job posting, optimize your resume for ATS, and generate tailored cover letters — all powered by dual AI agents and real labor market data.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link to={createPageUrl("JobAnalysis")}>
                    <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg w-full sm:w-auto h-12 px-8 text-base font-semibold">
                      <Search className="w-5 h-5 mr-2" />
                      Analyze a Job Posting
                    </Button>
                  </Link>
                  {hasData && (
                    <Link to={createPageUrl("Dashboard")}>
                      <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto h-12 px-8 text-base [&:hover]:text-white">
                        Go to Dashboard
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  )}
                  {hasData === false && (
                    <Link to={createPageUrl("MyResumes")}>
                      <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto h-12 px-8 text-base [&:hover]:text-white">
                        Upload Your Resume
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0 hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-2xl scale-110" />
                <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <img
                    src={isDark ? LOGO_DARK : LOGO_LIGHT}
                    alt="Properly Hired"
                    className="w-56 md:w-72 h-auto object-contain"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-blue-200 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Three Steps to Your Next Interview
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From job posting to application package in minutes — not hours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="h-full border-0 shadow-lg bg-card/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg mb-4">
                      {step.num}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Land the Role
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for serious job seekers who want an edge — not another generic template generator.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={createPageUrl(feature.link)} className="block h-full">
                    <Card className="h-full border hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer">
                      <CardContent className="p-6">
                        <div className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Two AI Experts. One Goal.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our agents don't just respond — they collaborate. Simon researches the opportunity, then hands off a structured brief so Kyle can build materials that actually fit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Simon</h3>
                      <p className="text-blue-200 text-sm">Recruiting & HR Expert</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    "Ghost job detection with 100-point scoring",
                    "Role classification and salary benchmarking",
                    "Company research and red flag analysis",
                    "ATS keyword extraction",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Kyle</h3>
                      <p className="text-orange-100 text-sm">CV & Cover Letter Expert</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    "Resume optimization and bullet rewriting",
                    "Cover letters using the ARC formula",
                    "STAR method interview preparation",
                    "Achievement framing and positioning",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to Take Control of Your Job Search?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Start with a free analysis of any job posting. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={createPageUrl("JobAnalysis")}>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg w-full sm:w-auto h-12 px-8 text-base">
                  <Search className="w-5 h-5 mr-2" />
                  Analyze Your First Job
                </Button>
              </Link>
              <Link to={createPageUrl("Pricing")}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                  View Plans
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
