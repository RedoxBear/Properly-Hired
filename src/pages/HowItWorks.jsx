import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, FileText, Send, BarChart3, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: "Analyze the Job",
      desc: "Paste a job description or URL. Our AI decodes the requirements, keywords, and cultural fit markers instantly.",
      icon: Search,
      color: "blue"
    },
    {
      id: 2,
      title: "Optimize Your Resume",
      desc: "We tailor your master resume to the specific role, re-phrasing bullets and highlighting transferable skills to beat the ATS.",
      icon: FileText,
      color: "purple"
    },
    {
      id: 3,
      title: "Generate Materials",
      desc: "Create a persuasive cover letter and get AI-predicted interview questions with suggested STAR-method answers.",
      icon: Send,
      color: "green"
    },
    {
      id: 4,
      title: "Track & Succeed",
      desc: "Manage all your applications in one Kanban board. Track status, schedule follow-ups, and measure your conversion rates.",
      icon: BarChart3,
      color: "orange"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="font-bold text-xl tracking-tight text-slate-800">Prague Day</Link>
          <div className="flex gap-3">
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-20 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            From Application to Offer in <br/><span className="text-blue-600">4 Simple Steps</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Prague Day streamlines the chaotic job hunt into a repeatable, scientific process.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={step.id} className={`flex flex-col md:flex-row gap-8 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-1 space-y-4">
                  <div className={`w-12 h-12 rounded-xl bg-${step.color}-100 flex items-center justify-center text-${step.color}-600 font-bold text-xl`}>
                    {step.id}
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">{step.title}</h2>
                  <p className="text-lg text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
                <div className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl aspect-video flex items-center justify-center shadow-sm">
                  <step.icon className={`w-24 h-24 text-${step.color}-200`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 bg-slate-900 text-white text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Ready to Optimize Your Search?</h2>
            <Link to="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
                Start Now - It's Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
