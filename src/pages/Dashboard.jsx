import React, { useState, useEffect } from "react";
import { JobApplication } from "@/entities/JobApplication";
import { Resume } from "@/entities/Resume";
import { AutofillVault } from "@/entities/AutofillVault";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useDeviceDetection } from "@/components/utils/deviceDetection";
import {
    Plus,
    FileText,
    Mail,
    Search,
    TrendingUp,
    Target,
    Clock,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Upload,
    Monitor,
    Smartphone,
    Tablet
} from "lucide-react";
import { motion } from "framer-motion";

import StatsCard from "../components/dashboard/StatsCard";
import RecentApplications from "../components/dashboard/RecentApplications";
import QuickActions from "../components/dashboard/QuickActions";
import FollowUpList from "../components/followups/FollowUpList";
import DailyEncouragement from "../components/dashboard/DailyEncouragement";

const heroPresets = {
    elegant: {
        headline: "Navigate Your Career with Precision",
        sub: "Turn every application into an opportunity. Prague Day analyzes your resume, matches it to your dream roles, and crafts personalized materials that get you noticed.",
        primary: { label: "Match My Resume", href: createPageUrl("JobAnalysis") },
        secondary: { label: "Try Demo → Instant Match", href: createPageUrl("JobAnalysis?demo=1") },
        highlight: "Precision"
    },
    human: {
        headline: "Find Work That Moves You",
        sub: "Prague Day blends smart AI with human insight to help you discover, tailor, and land roles that fit your story — not just your skills.",
        primary: { label: "Discover My Fit", href: createPageUrl("JobAnalysis") },
        secondary: { label: "Try Demo → Instant Match", href: createPageUrl("JobAnalysis?demo=1") },
        highlight: "Moves You"
    },
    bold: {
        headline: "Your Career, Re-Engineered.",
        sub: "AI-driven matching, instant resume optimization, and dynamic cover-letter generation — built to get you interviews faster.",
        primary: { label: "Optimize My Resume →", href: createPageUrl("JobAnalysis") },
        secondary: { label: "See How It Works", href: createPageUrl("JobAnalysis?demo=1") },
        highlight: "Re-Engineered."
    }
};

export default function Dashboard() {
    const [applications, setApplications] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [vaultUpdatedAt, setVaultUpdatedAt] = useState(null);
    const [masterQuality, setMasterQuality] = useState(null);
    
    const { isMobile, isTablet, isDesktop, deviceType } = useDeviceDetection();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [fetchedApplications, fetchedResumes, vaultList] = await Promise.all([
                JobApplication.list("-created_date", 10),
                Resume.list("-created_date", 5),
                AutofillVault.list("-updated_date", 1)
            ]);
            setApplications(fetchedApplications);
            setResumes(fetchedResumes);
            setVaultUpdatedAt(vaultList && vaultList[0] ? vaultList[0].updated_at : null);

            const masters = fetchedResumes.filter(r => r.is_master_resume);
            if (masters.length > 0 && masters[0].quality_scores) {
                setMasterQuality(masters[0].quality_scores);
            } else {
                setMasterQuality(null);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setIsLoading(false);
    };

    const averageOptimizationScore = applications.length > 0
        ? Math.round(applications.reduce((sum, app) => sum + (app.optimization_score || 0), 0) / applications.length)
        : 0;

    const readyApplications = applications.filter(app => app.application_status === 'ready').length;
    const appliedApplications = applications.filter(app => app.application_status === 'applied').length;

    const timeAgo = (ts) => {
        if (!ts) return "not set";
        const diff = Date.now() - new Date(ts).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24);
        return `${d}d ago`;
    };

    const urlParams = new URLSearchParams(window.location.search);
    const presetKey = ["elegant", "human", "bold"].includes(urlParams.get("preset")) ? urlParams.get("preset") : "elegant";
    const preset = heroPresets[presetKey];

    const renderHeadline = () => {
        const parts = preset.headline.split(preset.highlight);
        if (parts.length === 2) {
            return (
                <>
                    {parts[0]}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{preset.highlight}</span>
                    {parts[1]}
                </>
            );
        }
        return preset.headline;
    };

    return (
        <div className="min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 bg-background">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
                {/* Device Type Banner - Simplified for mobile */}
                {!isMobile && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                            {isTablet && (
                                <>
                                    <Tablet className="w-3 h-3" />
                                    <span>Tablet Browser</span>
                                </>
                            )}
                            {isDesktop && (
                                <>
                                    <Monitor className="w-3 h-3" />
                                    <span>Desktop Browser</span>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}

                <DailyEncouragement />

                {/* Hero Section - Mobile Optimized */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="relative text-center mb-4 sm:mb-6 md:mb-10"
                >
                    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden sm:block">
                        <div className="mx-auto h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80 rounded-full blur-3xl opacity-30"
                             style={{ background: "radial-gradient(closest-side, #60a5fa, transparent)" }} />
                    </div>

                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 md:mb-5">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M12 2l2.39 4.84L20 7.27l-3.82 3.72.9 5.26L12 14.77 6.92 16.25l.9-5.26L4 7.27l5.61-.43L12 2z" />
                        </svg>
                        AI Career Assistant
                    </div>

                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-800 mb-2 sm:mb-3 leading-tight px-2 sm:px-4">
                        {renderHeadline()}
                    </h1>

                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-2 sm:px-4">
                        {preset.sub}
                    </p>

                    <div className="mt-3 sm:mt-4 md:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4">
                        <Link to={preset.primary.href} className="w-full sm:w-auto">
                            <Button
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-10 sm:h-11 md:h-12 text-sm md:text-base px-4 sm:px-6"
                                onClick={() => window.dispatchEvent(new CustomEvent("pd_click", { detail: { name: "hero_cta", variant: presetKey, type: "primary" } }))}
                            >
                                {preset.primary.label}
                            </Button>
                        </Link>
                        <Link to={preset.secondary.href} className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto h-10 sm:h-11 md:h-12 text-sm md:text-base px-4 sm:px-6"
                                onClick={() => window.dispatchEvent(new CustomEvent("pd_click", { detail: { name: "hero_cta", variant: presetKey, type: "secondary" } }))}
                            >
                                {preset.secondary.label}
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm text-slate-500 px-2">
                        Trusted by job seekers across 25+ industries.
                    </div>
                </motion.div>

                {/* Vault Status */}
                <div className="flex items-center justify-center px-2 sm:px-4">
                    <Link to={createPageUrl("AutofillVault")} className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs sm:text-sm">
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500" />
                        <span className="hidden xs:inline">Autofill Vault: </span>
                        {vaultUpdatedAt ? `updated ${timeAgo(vaultUpdatedAt)}` : "set up now"}
                    </Link>
                </div>

                {/* Quick Action Cards - Mobile Optimized */}
                <section className="max-w-5xl mx-auto px-1 sm:px-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        <Link
                            to={createPageUrl("JobAnalysis")}
                            className="p-3 sm:p-4 rounded-xl border bg-white/80 backdrop-blur-sm flex items-start gap-2 sm:gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                        >
                            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-700 flex-shrink-0">
                                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-semibold text-slate-800 text-sm sm:text-base">Analyze JD</div>
                                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">Paste a job description or URL for instant insights.</p>
                            </div>
                        </Link>

                        <Link
                            to={createPageUrl("MyResumes")}
                            className="p-3 sm:p-4 rounded-xl border bg-white/80 backdrop-blur-sm flex items-start gap-2 sm:gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                        >
                            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-50 text-cyan-700 flex-shrink-0">
                                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-semibold text-slate-800 text-sm sm:text-base">Upload Resume</div>
                                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">Use your master resume for tailored optimization.</p>
                            </div>
                        </Link>

                        <Link
                            to={createPageUrl("ApplicationQnA")}
                            className="p-3 sm:p-4 rounded-xl border bg-white/80 backdrop-blur-sm flex items-start gap-2 sm:gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] sm:col-span-2 lg:col-span-1"
                        >
                            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-700 flex-shrink-0">
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-semibold text-slate-800 text-sm sm:text-base">Generate Materials</div>
                                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">Answer application questions using your CV & JD.</p>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <Link to={createPageUrl("JobLibrary")} className="block">
                        <StatsCard
                            title="Total Applications"
                            value={applications.length}
                            icon={FileText}
                            color="blue"
                            trend={`+${applications.filter(app => {
                                const weekAgo = new Date();
                                weekAgo.setDate(weekAgo.getDate() - 7);
                                return new Date(app.created_date) > weekAgo;
                            }).length} this week`}
                        />
                    </Link>
                    <Link to={createPageUrl("ResumeOptimizer")} className="block">
                        <StatsCard
                            title="Optimization Score"
                            value={`${averageOptimizationScore}%`}
                            icon={Target}
                            color="green"
                            trend={averageOptimizationScore > 75 ? "Excellent match" : "Room for improvement"}
                        />
                    </Link>
                    <Link to={createPageUrl("JobAnalysis")} className="block">
                        <StatsCard
                            title="Ready to Apply"
                            value={readyApplications}
                            icon={CheckCircle2}
                            color="purple"
                            trend={`${appliedApplications} already applied`}
                        />
                    </Link>
                    <Link to={createPageUrl("MyResumes")} className="block">
                        <StatsCard
                            title="Saved Resumes"
                            value={resumes.length}
                            icon={FileText}
                            color="orange"
                            trend="Master templates"
                        />
                    </Link>
                </div>

                {/* Master CV Quality Card */}
                {masterQuality && (
                    <Link to={createPageUrl("MyResumes")} className="block">
                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-600 text-xs sm:text-sm font-medium mb-1">Master CV Quality</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                                        {masterQuality.overall || 0}%
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {masterQuality.overall >= 85 ? "🎯 Excellent" : masterQuality.overall >= 70 ? "✓ Good" : "⚠ Needs work"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )}

                {masterQuality && masterQuality.overall < 70 && (
                    <Alert className="border-amber-200 bg-amber-50">
                        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-sm">
                            <span className="text-amber-800">
                                💡 Your master CV could be stronger. Review and improve it for better results.
                            </span>
                            <Link to={createPageUrl("MyResumes")}>
                                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                    Review CV
                                </Button>
                            </Link>
                        </AlertDescription>
                    </Alert>
                )}

                <FollowUpList apps={applications} onUpdated={() => loadData()} />

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    <div className="lg:col-span-2">
                        <RecentApplications
                            applications={applications}
                            isLoading={isLoading}
                        />
                    </div>

                    <div>
                        <QuickActions />
                    </div>
                </div>

                {/* Get Started Card */}
                {applications.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-800 text-base sm:text-lg md:text-xl">
                                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Get Started with CareerCraft
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 sm:space-y-4">
                                    <p className="text-blue-700 text-xs sm:text-sm md:text-base">
                                        Ready to supercharge your job applications? Follow these simple steps:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">1</div>
                                            <div>
                                                <h4 className="font-semibold text-blue-800 text-xs sm:text-sm md:text-base">Analyze Job Posting</h4>
                                                <p className="text-xs sm:text-sm text-blue-600">Paste a job URL or description</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">2</div>
                                            <div>
                                                <h4 className="font-semibold text-blue-800 text-xs sm:text-sm md:text-base">Upload Resume</h4>
                                                <p className="text-xs sm:text-sm text-blue-600">Let AI optimize your resume</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">3</div>
                                            <div>
                                                <h4 className="font-semibold text-blue-800 text-xs sm:text-sm md:text-base">Generate Materials</h4>
                                                <p className="text-xs sm:text-sm text-blue-600">Cover letter & application help</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2 sm:pt-4">
                                        <Link to={createPageUrl("JobAnalysis")} className="block">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-10 sm:h-11 md:h-12 text-sm sm:text-base">
                                                Start Your First Application
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    );
}