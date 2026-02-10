import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

const STORAGE_KEY = "guided-tour-dismissed";
const VERSION_KEY = "guided-tour-version";
const VERSION = "v1";

const steps = [
    {
        title: "Meet Your AI Agents",
        body: "Kyle (resume/career coach) and Simon (recruiter/market analyst) support you throughout the app.",
    },
    {
        title: "Open Chat",
        body: "Use the floating chat button to start a conversation with Kyle or Simon.",
    },
    {
        title: "Dock or Expand",
        body: "Dock the chat to the right for side-by-side work, or expand for a larger focus view.",
    },
    {
        title: "Tag + Handoff",
        body: "Tag the other agent or handoff context when you want a specialist view.",
    },
    {
        title: "Collaborate",
        body: "Use the Agent Workspace to review tagged items and Team Workspace for shared chats.",
    }
];

export default function GuidedTour() {
    const [open, setOpen] = React.useState(false);
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        const handler = () => {
            const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
            const version = localStorage.getItem(VERSION_KEY);
            if (!dismissed || version !== VERSION) {
                localStorage.setItem(VERSION_KEY, VERSION);
            }
            setIndex(0);
            setOpen(true);
        };
        window.addEventListener("guided-tour:start", handler);
        return () => window.removeEventListener("guided-tour:start", handler);
    }, []);

    const close = (dismiss) => {
        setOpen(false);
        if (dismiss) {
            localStorage.setItem(STORAGE_KEY, "true");
        }
    };

    const next = () => {
        if (index >= steps.length - 1) {
            close(true);
        } else {
            setIndex((prev) => prev + 1);
        }
    };

    const prev = () => {
        setIndex((prev) => Math.max(0, prev - 1));
    };

    if (!open) return null;

    const step = steps[index];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
            <Card className="w-full max-w-lg p-5 bg-white dark:bg-slate-900 dark:text-slate-100">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm font-semibold">Guided Tour</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => close(true)} aria-label="Close tour">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="mt-4">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{step.body}</p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        Step {index + 1} of {steps.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={prev} disabled={index === 0}>
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>
                        <Button size="sm" onClick={next}>
                            {index === steps.length - 1 ? "Finish" : "Next"}
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
