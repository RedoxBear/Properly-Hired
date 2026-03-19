import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useDeviceDetection } from "@/components/utils/deviceDetection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import { base44 } from "@/api/base44Client";
import { isAdmin, isSuperAdmin } from "@/components/utils/accessControl";
import { AppContextProvider } from "@/context/AppContextProvider";
import GuidedTour from "@/components/GuidedTour";
import {
    LayoutDashboard,
    Search,
    FileText,
    Mail,
    MessageCircleQuestion,
    Briefcase,
    Sparkles,
    Archive,
    Palette,
    ArrowRightLeft,
    TrendingUp,
    Inbox,
    Search as SearchIcon,
    Brain,
    Users as UsersIcon,
    Boxes,
    Crown,
    Target,
    ClipboardList,
    User,
    Users,
    Gift,
    Settings,
    Compass,
    Shield,
    Upload,
    Link2,
    AlertTriangle,
    Building2
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Light mode logos
const LOGO_CIRCLE_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af4e866eafaf5bc320af8a/3bc95c8f4_Prague-DayCircleTransparent.jpg";
const LOGO_FULL_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af4e866eafaf5bc320af8a/0cf860df6_Prague-DayAcceptedConcept.jpg";

// Dark mode logos
const LOGO_CIRCLE_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af4e866eafaf5bc320af8a/3477e6b96_Prague-DayAcceptedConcept-DarkMode-Circle.jpg";
const LOGO_FULL_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af4e866eafaf5bc320af8a/468690cdf_Prague-DayAcceptedConcept-DarkMode.jpg";

function AppShell({ children, currentPageName }) {
    const location = useLocation();
    const { isMobile } = useDeviceDetection();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [currentUser, setCurrentUser] = React.useState(null);
    const { resolvedTheme } = useTheme();

    React.useEffect(() => {
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
        } catch (e) {
            console.error("Error loading current user:", e);
        }
    };

    const isDarkMode = resolvedTheme === "dark";
    const LOGO_CIRCLE = isDarkMode ? LOGO_CIRCLE_DARK : LOGO_CIRCLE_LIGHT;
    const LOGO_FULL = isDarkMode ? LOGO_FULL_DARK : LOGO_FULL_LIGHT;

    const allSections = [
        {
            label: "Start Here",
            items: [
                { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard, description: "Overview & Quick Actions" },
                { title: "How to Use", url: createPageUrl("HowTo"), icon: Compass, description: "Step-by-step guidance" },
                { title: "My Resumes", url: createPageUrl("MyResumes"), icon: Archive, description: "Manage all your resumes" },
                { title: "New Build", url: createPageUrl("ResumeBuilder"), icon: Sparkles, description: "Start from scratch" }
            ]
        },
        {
            label: "Free AI (Weekly Limits)",
            items: [
                { title: "Job Analysis", url: createPageUrl("JobAnalysis"), icon: Search, description: "Analyze Job Postings", badge: "Free" },
                { title: "Resume Optimizer", url: createPageUrl("ResumeOptimizer"), icon: FileText, description: "Tailor Your Resume", badge: "Free" },
                { title: "Cover Letters", url: createPageUrl("CoverLetters"), icon: Mail, description: "Generate Cover Letters", badge: "Free" }
            ]
        },
        {
            label: "Premium & Growth",
            items: [
                { title: "Job Matcher", url: createPageUrl("JobMatcher"), icon: Target, description: "AI job matching & fit analysis", badge: "Pro" },
                { title: "App Tracker", url: createPageUrl("ApplicationTracker"), icon: Briefcase, description: "Track all your applications", badge: "Pro" },
                { title: "Review Queue", url: createPageUrl("ReviewQueue"), icon: ClipboardList, description: "Review & approve applications", badge: "Pro" },
                { title: "Interview Prep", url: createPageUrl("InterviewPrep"), icon: MessageCircleQuestion, description: "AI interview strategy", badge: "Pro" },
                { title: "Autofill Vault", url: createPageUrl("AutofillVault"), icon: Boxes, description: "Keep answers.", badge: "Pro" },
                { title: "Transferable Skills", url: createPageUrl("TransferableSkills"), icon: ArrowRightLeft, description: "Identify & Retarget Skills", badge: "Pro" },
                { title: "Application Q&A", url: createPageUrl("ApplicationQnA"), icon: MessageCircleQuestion, description: "Prepare portal answers", badge: "Pro" },
                { title: "Resume Templates", url: createPageUrl("ResumeTemplates"), icon: Palette, description: "Choose & Print Templates", badge: "Pro" },
                { title: "Insights", url: createPageUrl("ActivityInsights"), icon: TrendingUp, description: "Activity & Timing Insights", badge: "Pro" },
                { title: "Networking Hub", url: createPageUrl("NetworkingHub"), icon: Users, description: "Professional Networking", badge: "Pro" },
            ]
        },
        {
            label: "Intelligence",
            items: [
                { title: "Search Hub", url: createPageUrl("SearchHub"), icon: SearchIcon, description: "Search all agent data", badge: "Pro" },
                { title: "External Resources", url: createPageUrl("ExternalResources"), icon: Link2, description: "Link knowledge bases", badge: "Pro" },
            ]
        },
        {
            label: "Plans",
            items: [
                { title: "Referral Program", url: createPageUrl("ReferralProgram"), icon: Gift, description: "Refer & Get Rewards" },
                { title: "Upgrade", url: createPageUrl("Pricing"), icon: Crown, description: "View Plans & Pricing" }
            ]
        }
    ];

    return (
        <SidebarProvider>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    html, body, #root {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        overflow-x: hidden;
                    }

                    body, button, input, textarea, select {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }

                    body {
                        color: hsl(var(--foreground));
                        background-color: hsl(var(--background));
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                        position: fixed;
                        width: 100%;
                        height: 100%;
                    }

                    .app-container {
                        width: 100vw;
                        height: 100vh;
                        height: 100dvh;
                        overflow: hidden;
                        display: flex;
                        background-color: hsl(var(--background));
                        color: hsl(var(--foreground));
                    }

                    .app-main {
                        background: hsl(var(--background));
                        width: 100%;
                        height: 100%;
                        overflow-y: auto;
                        overflow-x: hidden;
                        -webkit-overflow-scrolling: touch;
                    }

                    .app-sidebar {
                        background-color: hsl(var(--sidebar-background));
                        backdrop-filter: blur(20px);
                        height: 100vh;
                        height: 100dvh;
                    }

                    .dark .app-main {
                        background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%);
                    }

                    :root .app-main {
                        background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%);
                    }

                    /* Better mobile touch targets */
                    @media (max-width: 768px) {
                        button, a {
                            min-height: 44px;
                            min-width: 44px;
                        }

                        .sidebar-description {
                            display: none !important;
                        }
                    }

                    /* Prevent zoom on input focus on iOS */
                    @media (max-width: 768px) {
                        input, textarea, select {
                            font-size: 16px !important;
                        }
                    }

                    /* Handle orientation changes */
                    @media (orientation: landscape) and (max-height: 500px) {
                        .app-container {
                            height: 100vh;
                        }
                    }
                `}
            </style>
            <div className="app-container bg-background text-foreground">
                {/* Backdrop for mobile */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <Sidebar isOpen={isSidebarOpen} className="border-r border-border/60 app-sidebar">
                    <SidebarHeader className="border-b border-border/60 p-4 md:p-6">
                        <div className="flex items-center justify-between gap-2 md:gap-3">
                            <div className="flex items-center gap-2 md:gap-3">
                                <img
                                    src={LOGO_CIRCLE}
                                    alt="Properly Hired"
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-lg object-contain bg-card"
                                    onError={(e) => {
                                        const el = e.currentTarget;
                                        if (el.dataset.fallback !== "1") {
                                            el.dataset.fallback = "1";
                                            el.src = LOGO_FULL;
                                        }
                                    }}
                                />
                                <div>
                                    <h2 className="font-bold text-foreground text-base md:text-lg">Properly Hired</h2>
                                    <p className="text-xs text-muted-foreground font-medium hidden sm:block">Career Navigation</p>
                                </div>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="p-2 md:p-3">
                        {allSections.map((section) => (
                            <SidebarGroup key={section.label}>
                                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 md:px-3 py-2 md:py-3">
                                    {section.label}
                                </SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu className="space-y-1">
                                        {section.items.map((item) => (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    className={`hover:bg-accent transition-all duration-200 rounded-xl mb-1 group min-h-[44px] ${
                                                        location.pathname === item.url
                                                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 border shadow-sm'
                                                            : 'hover:shadow-sm'
                                                    }`}
                                                >
                                                    <RouterLink
                                                        to={item.url}
                                                        className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3"
                                                        onClick={() => setIsSidebarOpen(false)}
                                                    >
                                                        <item.icon className={`w-5 h-5 transition-colors flex-shrink-0 ${
                                                            location.pathname === item.url
                                                                ? 'text-blue-600 dark:text-blue-400'
                                                                : 'text-muted-foreground group-hover:text-foreground'
                                                        }`} />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="font-medium text-sm truncate">{item.title}</div>
                                                                {item.badge && (
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                                                                        item.badge === "Free"
                                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200"
                                                                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200"
                                                                    }`}>
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!isMobile && (
                                                                <div className="text-xs text-muted-foreground font-normal truncate hidden md:block sidebar-description">
                                                                    {item.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </RouterLink>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        ))}

                        {/* AI Tools section */}
                        <SidebarGroup className="mt-4 md:mt-6">
                            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 md:px-3 py-2 md:py-3">
                                AI Tools
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <div className="px-2 md:px-3 py-2 grid grid-cols-2 gap-2 md:gap-3">
                                    <RouterLink
                                        to={createPageUrl("ResumeOptimizer")}
                                        className="flex items-center justify-center p-3 rounded-lg border border-border hover:bg-accent min-h-[44px] active:scale-95 transition-transform"
                                        onClick={() => setIsSidebarOpen(false)}
                                    >
                                        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </RouterLink>
                                    <RouterLink
                                        to={createPageUrl("CoverLetters")}
                                        className="flex items-center justify-center p-3 rounded-lg border border-border hover:bg-accent min-h-[44px] active:scale-95 transition-transform"
                                        onClick={() => setIsSidebarOpen(false)}
                                    >
                                        <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </RouterLink>
                                </div>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Admin Section (bottom, small font) */}
                        {isAdmin(currentUser) && (
                            <SidebarGroup className="mt-4">
                                <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 md:px-3 py-2">
                                    Admin
                                </SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                className={`hover:bg-accent transition-all duration-200 rounded-xl group min-h-[40px] text-xs ${
                                                    location.pathname === createPageUrl("AgentWorkspace")
                                                        ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 border shadow-sm'
                                                        : 'hover:shadow-sm'
                                                }`}
                                            >
                                                <RouterLink
                                                    to={createPageUrl("AgentWorkspace")}
                                                    className="flex items-center gap-2 px-3 py-2"
                                                    onClick={() => setIsSidebarOpen(false)}
                                                >
                                                    <Inbox className={`w-4 h-4 transition-colors flex-shrink-0 ${
                                                        location.pathname === createPageUrl("AgentWorkspace")
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-muted-foreground group-hover:text-foreground'
                                                    }`} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-xs">Agent Workspace</div>
                                                    </div>
                                                </RouterLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                className={`hover:bg-accent transition-all duration-200 rounded-xl group min-h-[40px] text-xs ${
                                                    location.pathname === createPageUrl("AgentTraining")
                                                        ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 border shadow-sm'
                                                        : 'hover:shadow-sm'
                                                }`}
                                            >
                                                <RouterLink
                                                    to={createPageUrl("AgentTraining")}
                                                    className="flex items-center gap-2 px-3 py-2"
                                                    onClick={() => setIsSidebarOpen(false)}
                                                >
                                                    <Brain className={`w-4 h-4 transition-colors flex-shrink-0 ${
                                                        location.pathname === createPageUrl("AgentTraining")
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-muted-foreground group-hover:text-foreground'
                                                    }`} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-xs">Training Center</div>
                                                    </div>
                                                </RouterLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                className={`hover:bg-accent transition-all duration-200 rounded-xl group min-h-[40px] text-xs ${
                                                    location.pathname === createPageUrl("AgentFeedbackInsights")
                                                        ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 border shadow-sm'
                                                        : 'hover:shadow-sm'
                                                }`}
                                            >
                                                <RouterLink
                                                    to={createPageUrl("AgentFeedbackInsights")}
                                                    className="flex items-center gap-2 px-3 py-2"
                                                    onClick={() => setIsSidebarOpen(false)}
                                                >
                                                    <AlertTriangle className={`w-4 h-4 transition-colors flex-shrink-0 ${
                                                        location.pathname === createPageUrl("AgentFeedbackInsights")
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-muted-foreground group-hover:text-foreground'
                                                    }`} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-xs">Feedback Insights</div>
                                                    </div>
                                                </RouterLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                className={`hover:bg-accent transition-all duration-200 rounded-xl group min-h-[40px] text-xs ${
                                                    location.pathname === createPageUrl("CompanyResearchTool")
                                                        ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 border shadow-sm'
                                                        : 'hover:shadow-sm'
                                                }`}
                                            >
                                                <RouterLink
                                                    to={createPageUrl("CompanyResearchTool")}
                                                    className="flex items-center gap-2 px-3 py-2"
                                                    onClick={() => setIsSidebarOpen(false)}
                                                >
                                                    <Building2 className={`w-4 h-4 transition-colors flex-shrink-0 ${
                                                        location.pathname === createPageUrl("CompanyResearchTool")
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-muted-foreground group-hover:text-foreground'
                                                    }`} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-xs">Company Research Tool</div>
                                                    </div>
                                                </RouterLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                className={`hover:bg-accent transition-all duration-200 rounded-xl group min-h-[40px] text-xs ${
                                                    location.pathname === createPageUrl("CollaborationDashboard")
                                                        ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 border shadow-sm'
                                                        : 'hover:shadow-sm'
                                                }`}
                                            >
                                                <RouterLink
                                                    to={createPageUrl("CollaborationDashboard")}
                                                    className="flex items-center gap-2 px-3 py-2"
                                                    onClick={() => setIsSidebarOpen(false)}
                                                >
                                                    <UsersIcon className={`w-4 h-4 transition-colors flex-shrink-0 ${
                                                        location.pathname === createPageUrl("CollaborationDashboard")
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-muted-foreground group-hover:text-foreground'
                                                    }`} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-xs">Collaboration Dashboard</div>
                                                    </div>
                                                </RouterLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                className={`hover:bg-accent transition-all duration-200 rounded-xl group min-h-[40px] text-xs ${
                                                    location.pathname === createPageUrl("Users")
                                                        ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 border shadow-sm'
                                                        : 'hover:shadow-sm'
                                                }`}
                                            >
                                                <RouterLink
                                                    to={createPageUrl("Users")}
                                                    className="flex items-center gap-2 px-3 py-2"
                                                    onClick={() => setIsSidebarOpen(false)}
                                                >
                                                    <Shield className={`w-4 h-4 transition-colors flex-shrink-0 ${
                                                        location.pathname === createPageUrl("Users")
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-muted-foreground group-hover:text-foreground'
                                                    }`} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-xs">User Management</div>
                                                    </div>
                                                </RouterLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                                <SidebarMenuButton
                                                    asChild
                                                    className={`hover:bg-accent transition-all duration-200 rounded-xl group min-h-[40px] text-xs ${
                                                        location.pathname === createPageUrl("ONetImport")
                                                            ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 border shadow-sm'
                                                            : 'hover:shadow-sm'
                                                    }`}
                                                >
                                                    <RouterLink
                                                        to={createPageUrl("ONetImport")}
                                                        className="flex items-center gap-2 px-3 py-2"
                                                        onClick={() => setIsSidebarOpen(false)}
                                                    >
                                                        <Upload className={`w-4 h-4 transition-colors flex-shrink-0 ${
                                                            location.pathname === createPageUrl("ONetImport")
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-muted-foreground group-hover:text-foreground'
                                                        }`} />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-xs">O*NET Import</div>
                                                        </div>
                                                    </RouterLink>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        <SidebarMenuItem>
                                                <SidebarMenuButton
                                                    asChild
                                                    className={`hover:bg-accent transition-all duration-200 rounded-xl group min-h-[40px] text-xs ${
                                                        location.pathname === createPageUrl("RAGMonitor")
                                                            ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 border shadow-sm'
                                                            : 'hover:shadow-sm'
                                                    }`}
                                                >
                                                    <RouterLink
                                                        to={createPageUrl("RAGMonitor")}
                                                        className="flex items-center gap-2 px-3 py-2"
                                                        onClick={() => setIsSidebarOpen(false)}
                                                    >
                                                        <Brain className={`w-4 h-4 transition-colors flex-shrink-0 ${
                                                            location.pathname === createPageUrl("RAGMonitor")
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-muted-foreground group-hover:text-foreground'
                                                        }`} />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-xs">RAG Monitor</div>
                                                        </div>
                                                    </RouterLink>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>

                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        )}
                    </SidebarContent>

                    <SidebarFooter className="border-t border-border/60 p-3 md:p-4">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 bg-muted rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                                <img
                                    src={LOGO_CIRCLE}
                                    alt="Properly Hired"
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                        const el = e.currentTarget;
                                        if (el.dataset.fallback !== "1") {
                                            el.dataset.fallback = "1";
                                            el.src = LOGO_FULL;
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">Properly Hired</p>
                                <p className="text-xs text-muted-foreground truncate">AI Career Assistant</p>
                            </div>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 flex flex-col app-main">
                    {/* Desktop Header */}
                    <header className="hidden md:flex bg-card/90 backdrop-blur-xl border-b border-border/60 px-6 py-3 sticky top-0 z-10">
                        <div className="flex items-center justify-end w-full gap-2">
                            <ThemeToggle />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-accent">
                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">My Account</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <RouterLink to={createPageUrl("UserProfile")} className="flex items-center gap-2 cursor-pointer">
                                            <Settings className="w-4 h-4" />
                                            <span>Profile & Settings</span>
                                        </RouterLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => window.dispatchEvent(new CustomEvent("guided-tour:start"))}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>Start Guided Tour</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* Mobile Header */}
                    <header className="bg-card/90 backdrop-blur-xl border-b border-border/60 px-4 py-3 md:hidden sticky top-0 z-10">
                        <div className="flex items-center justify-between gap-2">
                            <SidebarTrigger
                                onClick={() => setIsSidebarOpen(true)}
                                className="hover:bg-accent p-2 rounded-lg transition-colors duration-200 min-w-[44px] min-h-[44px]"
                            />
                            <div className="flex items-center gap-2">
                                <img
                                    key={LOGO_CIRCLE}
                                    src={LOGO_CIRCLE}
                                    alt="Properly Hired"
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                        const el = e.currentTarget;
                                        if (el.dataset.fallback !== "1") {
                                            el.dataset.fallback = "1";
                                            el.src = LOGO_FULL;
                                        }
                                    }}
                                />
                                <h1 className="text-base font-bold text-foreground">Properly Hired</h1>
                            </div>
                            <div className="flex items-center gap-1">
                                <ThemeToggle />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
                                            <User className="w-5 h-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <RouterLink to={createPageUrl("UserProfile")} className="flex items-center gap-2">
                                                <Settings className="w-4 h-4" />
                                                <span>Profile & Settings</span>
                                            </RouterLink>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => window.dispatchEvent(new CustomEvent("guided-tour:start"))}
                                            className="flex items-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <span>Start Guided Tour</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1">
                        {children}
                    </div>
                </main>
            </div>
            <GuidedTour />
        </SidebarProvider>
    );
}

export default function Layout({ children, currentPageName }) {
    return (
        <AppContextProvider>
            <AppShell currentPageName={currentPageName}>{children}</AppShell>
        </AppContextProvider>
    );
}