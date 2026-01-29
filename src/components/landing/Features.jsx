import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, Sparkles, MessageSquare, BarChart3, Chrome } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Resume Optimization",
    description: "Kyle, your AI career coach, analyzes and optimizes your resume for each job application with personalized recommendations."
  },
  {
    icon: Sparkles,
    title: "Smart Job Matching",
    description: "Simon, our AI recruiter, analyzes job descriptions and matches them to your skills, experience, and career goals."
  },
  {
    icon: FileText,
    title: "Cover Letter Generator",
    description: "Generate tailored, professional cover letters in seconds that highlight your unique qualifications for each role."
  },
  {
    icon: MessageSquare,
    title: "Interview Prep Assistant",
    description: "Practice with AI-generated interview questions specific to your target role and get feedback on your answers."
  },
  {
    icon: BarChart3,
    title: "Application Tracking",
    description: "Track all your job applications in one place with status updates, deadlines, and follow-up reminders."
  },
  {
    icon: Chrome,
    title: "Browser Extension",
    description: "Auto-fill job applications with one click using our Chrome extension. Save hours of repetitive data entry."
  }
];

export default function Features() {
  return (
    <section id="features" className="container py-24 sm:py-32">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Powerful AI Features
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Everything you need to land your dream job, powered by cutting-edge AI technology
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
