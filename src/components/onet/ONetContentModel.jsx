import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export default function ONetContentModel() {
    const domains = [
        { name: "Worker Characteristics", desc: "Abilities, Interests, Work Values, Work Styles" },
        { name: "Worker Requirements", desc: "Skills, Knowledge, Education" },
        { name: "Experience Requirements", desc: "Training, Experience, Licensing" },
        { name: "Occupational Requirements", desc: "Work Activities, Context, Organizational Context" },
        { name: "Workforce Characteristics", desc: "Labor Market Info, Outlook" },
        { name: "Occupation-Specific Info", desc: "Tasks, Tools, Technology" }
    ];

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                    <BookOpen className="w-5 h-5" />
                    O*NET Content Model
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-blue-700">
                    O*NET organizes occupational information into six domains:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                    {domains.map((domain, i) => (
                        <div key={i} className="p-3 bg-white rounded-lg border border-blue-200">
                            <Badge className="mb-2 bg-blue-600">{i + 1}</Badge>
                            <h4 className="font-semibold text-sm text-slate-800 mb-1">{domain.name}</h4>
                            <p className="text-xs text-slate-600">{domain.desc}</p>
                        </div>
                    ))}
                </div>
                <a 
                    href="https://www.onetcenter.org/content.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline inline-block mt-2"
                >
                    Learn more about the O*NET Content Model →
                </a>
            </CardContent>
        </Card>
    );
}