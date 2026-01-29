import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, PlayCircle, Search, FileText, Briefcase, Mail, MessageCircleQuestion, Boxes } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Search,
      title: "Job Analysis",
      desc: "Decode job descriptions to find cultural fit, keywords, and hidden requirements instantly.",
      color: "blue"
    },
    {
      icon: FileText,
      title: "Resume Optimizer",
      desc: "Tailor your CV for every single application. Beat the ATS with AI-driven keyword matching.",
      color: "purple"
    },
    {
      icon: Briefcase,
      title: "Application Tracker",
      desc: "A Kanban-style board to manage all your applications, interviews, and offers in one place.",
      color: "orange"
    },
    {
      icon: Mail,
      title: "Cover Letter Gen",
      desc: "Create persuasive, personalized cover letters in seconds that actually get read.",
      color: "green"
    },
    {
      icon: MessageCircleQuestion,
      title: "Interview Q&A",
      desc: "Predict interview questions based on the job description and practice your STAR answers.",
      color: "red"
    },
    {
      icon: Boxes,
      title: "Autofill Vault",
      desc: "Store your best answers and demographic data to fill out complex forms with one click.",
      color: "cyan"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Prague Day</span>
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <Link to="/about" className="hover:text-blue-600 transition-colors">About Us</Link>
            <Link to="/how-it-works" className="hover:text-blue-600 transition-colors">How it Works</Link>
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          </div>
          <div className="flex gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-slate-600">Log In</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              v2.0 Now Live
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1]">
              Land Your Next Role with <span className="text-blue-600">AI Precision.</span>
            </h1>
            
            <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
              The ultimate command center for job seekers. Optimize resumes, track applications, and master interviews—all in one self-contained platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 h-14 w-full sm:w-auto shadow-lg shadow-blue-200 gap-2">
                  Start Your Hunt <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 w-full sm:w-auto gap-2 border-slate-200">
                  <PlayCircle className="w-5 h-5 text-slate-400" /> How it Works
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                ))}
              </div>
              <span>Joined by <span className="font-bold text-slate-800">20,000+</span> job seekers this month</span>
            </div>
          </div>

          <div className="relative">
            <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl aspect-[4/3] shadow-2xl flex items-center justify-center group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
              <div className="text-center">
                <p className="text-slate-400 font-medium mb-2 group-hover:scale-110 transition-transform duration-500">
                  [ Dashboard Preview ]
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-[200px] mx-auto opacity-50">
                  <div className="h-16 bg-white rounded-lg shadow-sm"></div>
                  <div className="h-16 bg-white rounded-lg shadow-sm"></div>
                  <div className="h-16 bg-white rounded-lg shadow-sm col-span-2"></div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 bg-green-500 rounded-full" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Resume Optimized</p>
                    <p className="text-[10px] text-slate-500">Match Score: 94%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need to Get Hired</h2>
            <p className="text-lg text-slate-600">
              Stop juggling spreadsheets, documents, and random tools. Prague Day brings your entire job search into one intelligent workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 bg-${feature.color}-50 rounded-xl flex items-center justify-center text-${feature.color}-600 mb-6`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}