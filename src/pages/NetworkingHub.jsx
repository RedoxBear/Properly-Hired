import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Calendar, ExternalLink, Search, Sparkles, GraduationCap, Linkedin, CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AgentChat from "@/components/agents/AgentChat";

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

        {/* Career Coaches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-orange-600" />
            Career Coaches
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Connect with certified career coaches through our affiliate network. Coaches set their own rates and are independent 3rd party services.
          </p>
          
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-200">
                    <img
                      src="https://media.licdn.com/dms/image/v2/D5603AQHhqCKP8EtVew/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1690583267886?e=1744243200&v=beta&t=Fw5Y-O_xFOCIKXhJ5sN1FI8xYzl5cXNqvyW5aVA8nck"
                      alt="Richard Xiong"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">Richard Xiong, CPCC</h3>
                  <p className="text-sm text-orange-700 font-medium mb-3">Career Coach</p>
                  <p className="text-slate-700 mb-4">
                    Certified Professional Co-Active Coach (CPCC) specializing in career transitions, leadership development, and helping professionals navigate their career journey with clarity and confidence.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href="https://calendar.google.com/calendar/u/0/r/eventedit?text=Career+Coaching+Session+with+Richard+Xiong&add=reedxiong@gmail.com&details=Career+coaching+consultation+session" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                        <CalendarCheck className="w-4 h-4" />
                        Book Appointment
                      </Button>
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/reedxiong" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="gap-2">
                        <Linkedin className="w-4 h-4" />
                        View LinkedIn Profile
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

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

      {/* Simon AI Agent Chat */}
      <AgentChat
        agentName="simon"
        agentTitle="Simon - Recruiting Expert"
        context={{
          page: "Networking Hub",
          features: ["People Search", "AI Messages", "Recruiter Connect", "My Network"]
        }}
      />
    </div>
  );
}