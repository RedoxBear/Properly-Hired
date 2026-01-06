import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Calendar, ExternalLink, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NetworkingHub() {
  const features = [
    {
      title: "People Search",
      description: "Find professionals in your target companies and industries",
      icon: Search,
      color: "from-blue-500 to-cyan-600",
      link: "PeopleSearch"
    },
    {
      title: "AI Message Generator",
      description: "Create personalized connection requests and outreach messages",
      icon: MessageSquare,
      color: "from-purple-500 to-pink-600",
      link: "NetworkingMessages"
    },
    {
      title: "Recruiter Connect",
      description: "Schedule virtual meetings with recruiters and hiring managers",
      icon: Calendar,
      color: "from-green-500 to-emerald-600",
      link: "RecruiterConnect"
    },
    {
      title: "My Network",
      description: "Manage your contacts and track connection status",
      icon: Users,
      color: "from-amber-500 to-orange-600",
      link: "MyNetwork"
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Professional Networking
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4">
            Networking <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Hub</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Connect with professionals, reach out to recruiters, and expand your network with AI-powered tools
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={createPageUrl(feature.link)}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm group cursor-pointer">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600">{feature.description}</p>
                      <Button variant="ghost" className="mt-4 gap-2 text-blue-600 group-hover:gap-3 transition-all">
                        Open
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Networking Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <div>
                  <div className="font-semibold text-slate-800">Research First</div>
                  <div className="text-slate-600">Learn about the person and company before reaching out</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <div>
                  <div className="font-semibold text-slate-800">Personalize Messages</div>
                  <div className="text-slate-600">Use AI to generate, but always add your personal touch</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <div>
                  <div className="font-semibold text-slate-800">Follow Up</div>
                  <div className="text-slate-600">Keep track of conversations and maintain relationships</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}