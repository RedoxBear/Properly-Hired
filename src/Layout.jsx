import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useDeviceDetection } from "@/components/utils/deviceDetection";
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
    Boxes,
    Crown,
    Target,
    User
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

const PRAGUE_DAY_CIRCLE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af4e866eafaf5bc320af8a/8925775c9_PragueDayLogo-Circle.png";
const PRAGUE_DAY_FULL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af4e866eafaf5bc320af8a/50e0a16e9_image.png";

function AppShell({ children, currentPageName }) {
    const location = useLocation();
    const { isMobile, isTablet, deviceType } = useDeviceDetection();

    const navigationItems = [
        { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard, description: "Overview & Quick Actions" },
        { title: "My Profile", url: createPageUrl("UserProfile"), icon: User, description: "Preferences & Settings" },
        { title: "My Resumes", url: createPageUrl("MyResumes"), icon: Archive, description: "Manage all your resumes" },
        { title: "New Build", url: createPageUrl("ResumeBuilder"), icon: Sparkles, description: "Start from scratch" },
        { title: "Job Matcher", url: createPageUrl("JobMatcher"), icon: Target, description: "AI job matching & fit analysis" },
        { title: "App Tracker", url: createPageUrl("ApplicationTracker"), icon: Briefcase, description: "Track all your applications" },
        { title: "Company Research", url: createPageUrl("CompanyResearchDashboard"), icon: Building2, description: "Research & fit analysis" },
        { title: "Job Analysis", url: createPageUrl("JobAnalysis"), icon: Search, description: "Analyze Job Postings" },
        { title: "Resume Optimizer", url: createPageUrl("ResumeOptimizer"), icon: FileText, description: "Tailor Your Resume" },
        { title: "Autofill Vault", url: createPageUrl("AutofillVault"), icon: Boxes, description: "Keep answers." },
        { title: "Transferable Skills", url: createPageUrl("TransferableSkills"), icon: ArrowRightLeft, description: "Identify & Retarget Skills" },
        { title: "Cover Letters", url: createPageUrl("CoverLetters"), icon: Mail, description: "Generate Cover Letters" },
        { title: "Application Q&A", url: createPageUrl("ApplicationQnA"), icon: MessageCircleQuestion, description: "Prepare portal answers" },
        { title: "Resume Templates", url: createPageUrl("ResumeTemplates"), icon: Palette, description: "Choose & Print Templates" },
        { title: "Insights", url: createPageUrl("ActivityInsights"), icon: TrendingUp, description: "Activity & Timing Insights" },
        { title: "Upgrade", url: createPageUrl("Pricing"), icon: Crown, description: "View Plans & Pricing" }
    ];

    return (
        <SidebarProvider>
            <style>
                {`
                    :root {
                        --background: #fefefe;
                        --foreground: #1f2937;
                        --primary: #1e40af;
                        --primary-foreground: #ffffff;
                        --secondary: #f8fafc;
                        --secondary-foreground: #475569;
                        --accent: #059669;
                        --accent-foreground: #ffffff;
                        --muted: #f1f5f9;
                        --muted-foreground: #64748b;
                        --border: #e2e8f0;
                        --success: #059669;
                    }
                    
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
                    
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        color: var(--foreground);
                        background-color: var(--background);
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                        position: fixed;
                        width: 100%;
                        height: 100%;
                    }
                    
                    .app-container {
                        width: 100vw;
                        height: 100vh;
                        height: 100dvh; /* Dynamic viewport height for mobile */
                        overflow: hidden;
                        display: flex;
                    }
                    
                    .app-main {
                        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                        width: 100%;
                        height: 100%;
                        overflow-y: auto;
                        overflow-x: hidden;
                        -webkit-overflow-scrolling: touch;
                    }
                    
                    .app-sidebar {
                        background-color: rgba(255, 255, 255, 0.85);
                        backdrop-filter: blur(20px);
                        height: 100vh;
                        height: 100dvh;
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
            <div className="app-container bg-slate-50 text-slate-800">
                <Sidebar className="border-r border-slate-200/60 app-sidebar">
                    <SidebarHeader className="border-b border-slate-200/60 p-4 md:p-6">
                        <div className="flex items-center justify-between gap-2 md:gap-3">
                            <div className="flex items-center gap-2 md:gap-3">
                                <img
                                    src={PRAGUE_DAY_CIRCLE}
                                    alt="Prague Day"
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-lg object-contain bg-white"
                                    onError={(e) => {
                                        const el = e.currentTarget;
                                        if (el.dataset.fallback !== "1") {
                                            el.dataset.fallback = "1";
                                            el.src = PRAGUE_DAY_FULL;
                                        }
                                    }}
                                />
                                <div>
                                    <h2 className="font-bold text-slate-800 text-base md:text-lg">Prague Day</h2>
                                    <p className="text-xs text-slate-500 font-medium hidden sm:block">Career Navigation</p>
                                </div>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="p-2 md:p-3">
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 md:px-3 py-2 md:py-3">
                                Navigation
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-1">
                                    {navigationItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                className={`hover:bg-slate-50 transition-all duration-200 rounded-xl mb-1 group min-h-[44px] ${
                                                    location.pathname === item.url ? 'bg-blue-50 text-blue-700 border-blue-200 border shadow-sm' : 'hover:shadow-sm'
                                                }`}
                                            >
                                                <RouterLink to={item.url} className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3">
                                                    <item.icon className={`w-5 h-5 transition-colors flex-shrink-0 ${
                                                        location.pathname === item.url ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                                                    }`} />
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-sm truncate">{item.title}</div>
                                                        {!isMobile && (
                                                            <div className="text-xs text-slate-500 font-normal truncate hidden md:block sidebar-description">
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

                        {/* AI Tools section */}
                        <SidebarGroup className="mt-4 md:mt-6">
                            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 md:px-3 py-2 md:py-3">
                                AI Tools
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <div className="px-2 md:px-3 py-2 grid grid-cols-2 gap-2 md:gap-3">
                                    <RouterLink to={createPageUrl("ResumeOptimizer")} className="flex items-center justify-center p-3 rounded-lg border hover:bg-slate-50 min-h-[44px] active:scale-95 transition-transform">
                                        <Sparkles className="w-5 h-5 text-blue-600" />
                                    </RouterLink>
                                    <RouterLink to={createPageUrl("CoverLetters")} className="flex items-center justify-center p-3 rounded-lg border hover:bg-slate-50 min-h-[44px] active:scale-95 transition-transform">
                                        <Mail className="w-5 h-5 text-green-600" />
                                    </RouterLink>
                                </div>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-slate-200/60 p-3 md:p-4">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                                <img
                                    src={PRAGUE_DAY_CIRCLE}
                                    alt="Prague Day small"
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                        const el = e.currentTarget;
                                        if (el.dataset.fallback !== "1") {
                                            el.dataset.fallback = "1";
                                            el.src = PRAGUE_DAY_FULL;
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 text-sm truncate">Prague Day</p>
                                <p className="text-xs text-slate-500 truncate">AI Career Assistant</p>
                            </div>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 flex flex-col app-main">
                    {/* Mobile Header */}
                    <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 md:hidden sticky top-0 z-10">
                        <div className="flex items-center justify-between gap-4">
                            <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200 min-w-[44px] min-h-[44px]" />
                            <div className="flex items-center gap-2">
                                <img
                                    src={PRAGUE_DAY_CIRCLE}
                                    alt="Prague Day"
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                        const el = e.currentTarget;
                                        if (el.dataset.fallback !== "1") {
                                            el.dataset.fallback = "1";
                                            el.src = PRAGUE_DAY_FULL;
                                        }
                                    }}
                                />
                                <h1 className="text-base font-bold text-slate-800">Prague Day</h1>
                            </div>
                            {isMobile && (
                                <div className="text-xs text-slate-500 font-mono">📱</div>
                            )}
                        </div>
                    </header>

                    <div className="flex-1">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}

export default function Layout({ children, currentPageName }) {
    return (
        <AppShell currentPageName={currentPageName}>{children}</AppShell>
    );
}