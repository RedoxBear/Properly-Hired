import React from "react";
import { base44 } from "@/api/base44Client";

const JobApplication = base44.entities.JobApplication;
const Resume = base44.entities.Resume;
const AutofillVault = base44.entities.AutofillVault;
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
import ApplicationInsightsWidget from "../components/dashboard/ApplicationInsightsWidget";
import SubscriptionStatus from "../components/dashboard/SubscriptionStatus";
import HeroBanner from "../components/dashboard/HeroBanner";

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

// Cycle fix
export default function Dashboard() {
    const [applications, setApplications] = React.useState([]);
    const [resumes, setResumes] = React.useState([]);
    const [userData, setUserData] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [vaultUpdatedAt, setVaultUpdatedAt] = React.useState(null);
    const [masterQuality, setMasterQuality] = React.useState(null);
    
    const { isMobile, isTablet, isDesktop, deviceType } = useDeviceDetection();

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [fetchedApplications, fetchedResumes, vaultList, userList] = await Promise.all([
                JobApplication.list("-created_date", 10),
                Resume.list("-created_date", 5),
                AutofillVault.list("-updated_date", 1),
                base44.entities.User.list()
            ]);
            setApplications(fetchedApplications);
            setResumes(fetchedResumes);
            setVaultUpdatedAt(vaultList && vaultList[0] ? vaultList[0].updated_at : null);
            setUserData(userList && userList[0] ? userList[0] : null);

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
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300">{preset.highlight}</span>
                    {parts[1]}
                </>
            );
        }
        return preset.headline;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="w-8 h-8 animate-pulse text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

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
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">
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

                {/* Hero Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                >
                    <HeroBanner />
                </motion.div>

                {/* Vault Status */}
                <div className="flex items-center justify-center px-2 sm:px-4">
                    <Link to={createPageUrl("AutofillVault")} className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm">
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
                            className="p-3 sm:p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm flex items-start gap-2 sm:gap-3 hover:bg-accent transition-all active:scale-[0.98]"
                        >
                            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex-shrink-0">
                                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-semibold text-foreground text-sm sm:text-base">Analyze JD</div>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">Paste a job description or URL for instant insights.</p>
                            </div>
                        </Link>

                        <Link
                            to={createPageUrl("MyResumes")}
                            className="p-3 sm:p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm flex items-start gap-2 sm:gap-3 hover:bg-accent transition-all active:scale-[0.98]"
                        >
                            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 flex-shrink-0">
                                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-semibold text-foreground text-sm sm:text-base">Upload Resume</div>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">Use your master resume for tailored optimization.</p>
                            </div>
                        </Link>

                        <Link
                            to={createPageUrl("ApplicationQnA")}
                            className="p-3 sm:p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm flex items-start gap-2 sm:gap-3 hover:bg-accent transition-all active:scale-[0.98] sm:col-span-2 lg:col-span-1"
                        >
                            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-semibold text-foreground text-sm sm:text-base">Generate Materials</div>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">Answer application questions using your CV & JD.</p>
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
                        <Card className="shadow-lg border-0 bg-card/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">Master CV Quality</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                                        {masterQuality.overall || 0}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {masterQuality.overall >= 85 ? "🎯 Excellent" : masterQuality.overall >= 70 ? "✓ Good" : "⚠ Needs work"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )}

                {masterQuality && masterQuality.overall < 70 && (
                    <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-sm">
                            <span className="text-amber-800 dark:text-amber-200">
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

                    <div className="space-y-6">
                        <SubscriptionStatus user={userData} />
                        <ApplicationInsightsWidget applications={applications} />
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
                        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border-blue-200 dark:border-blue-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-base sm:text-lg md:text-xl">
                                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Get Started with CareerCraft
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 sm:space-y-4">
                                    <p className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm md:text-base">
                                        Ready to supercharge your job applications? Follow these simple steps:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">1</div>
                                            <div>
                                                <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-xs sm:text-sm md:text-base">Analyze Job Posting</h4>
                                                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Paste a job URL or description</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">2</div>
                                            <div>
                                                <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-xs sm:text-sm md:text-base">Upload Resume</h4>
                                                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Let AI optimize your resume</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">3</div>
                                            <div>
                                                <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-xs sm:text-sm md:text-base">Generate Materials</h4>
                                                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Cover letter & application help</p>
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