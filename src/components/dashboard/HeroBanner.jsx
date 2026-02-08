import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HeroBanner() {
    const [logoUrl, setLogoUrl] = React.useState("");

    React.useEffect(() => {
        const updateLogo = () => {
            const hasDarkClass = document.documentElement.classList.contains('dark');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark = hasDarkClass || prefersDark;
            
            const LOGO_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af4e866eafaf5bc320af8a/0cf860df6_Prague-DayAcceptedConcept.jpg";
            const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af4e866eafaf5bc320af8a/468690cdf_Prague-DayAcceptedConcept-DarkMode.jpg";
            // TODO: Replace these logos with Properly Hired branded assets when available
            
            setLogoUrl(isDark ? LOGO_DARK : LOGO_LIGHT);
        };
        
        // Update immediately
        updateLogo();
        
        // Watch for class changes on documentElement
        const observer = new MutationObserver(updateLogo);
        observer.observe(document.documentElement, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
        
        // Watch for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateLogo);
        }
        
        return () => {
            observer.disconnect();
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', updateLogo);
            }
        };
    }, []);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-indigo-900 dark:to-slate-900 p-8 md:p-12 shadow-2xl mb-8">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-300 rounded-full blur-3xl animate-pulse delay-75"></div>
            </div>

            {/* Circuit pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Left content */}
                <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        AI-Powered Career Navigation
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        Your Career.
                        <br />
                        <span className="text-orange-300">Your Control.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-xl">
                        We provide the tools and insights you need to take charge of your professional journey and build the future you envision.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <Link to={createPageUrl("ResumeOptimizer")}>
                            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg w-full sm:w-auto">
                                <Target className="w-5 h-5 mr-2" />
                                Optimize Resume
                            </Button>
                        </Link>
                        <Link to={createPageUrl("JobAnalysis")}>
                            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm w-full sm:w-auto [&:hover]:text-white">
                                Analyze Job
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Right content - Logo */}
                <div className="flex-shrink-0">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur-2xl scale-110"></div>
                        
                        {/* Logo container */}
                        <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            {logoUrl && (
                                <img
                                    key={logoUrl}
                                    src={logoUrl}
                                    alt="Properly Hired"
                                    className="w-48 md:w-64 h-auto object-contain"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}