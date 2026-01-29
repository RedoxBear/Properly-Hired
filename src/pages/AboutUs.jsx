import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Heart, Target, ArrowRight } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation (Simplified for sub-pages) */}
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
        {/* Hero */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
              We Believe the Hiring Process is Broken. <br />
              <span className="text-blue-600">So We Fixed It.</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Prague Day isn't just a resume builder. It's a comprehensive career command center designed to give power back to the job seeker through data, AI, and streamlined workflows.
            </p>
          </div>
        </section>

        {/* Mission / Values */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Precision Matching</h3>
              <p className="text-slate-600">
                We don't spray and pray. We use advanced AI to analyze job descriptions against your skills to ensure every application you send is a high-percentage shot.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto text-red-600">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Human-Centric AI</h3>
              <p className="text-slate-600">
                Technology should amplify your voice, not replace it. Our tools help you articulate your unique value proposition with clarity and confidence.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto text-green-600">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Community Driven</h3>
              <p className="text-slate-600">
                Joined by over 20,000 job seekers, we are building a network of professionals who support each other in navigating the modern career landscape.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-blue-600 text-white text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Join the Movement</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Stop letting algorithms reject you. Start using them to get hired.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 gap-2">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
