import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, Compass } from "lucide-react";
import { createPageUrl } from "@/utils";

const SIMON_ACTIONS = [
    { label: "Apply now", icon: ExternalLink, variant: "default" },
    { label: "Research deeper", icon: Search, variant: "outline" },
    { label: "Keep exploring", icon: Compass, variant: "outline" }
];

/**
 * Detect whether Simon's last response is in Company Role Match mode
 * by checking for the structured section headers.
 */
export function isCompanyRoleMatchResponse(text) {
    if (!text || typeof text !== "string") return false;
    const lower = text.toLowerCase();
    return (
        (lower.includes("role match") || lower.includes("🎯")) &&
        (lower.includes("interviewer map") || lower.includes("👥") || lower.includes("application link") || lower.includes("🔗")) &&
        (lower.includes("apply now") || lower.includes("research deeper") || lower.includes("keep exploring"))
    );
}

export default function SimonActionChips({ onAction }) {
    return (
        <div className="flex flex-wrap gap-2 mt-1">
            {SIMON_ACTIONS.map((action) => (
                <Button
                    key={action.label}
                    size="sm"
                    variant={action.variant}
                    className="h-7 px-3 text-xs gap-1"
                    onClick={() => onAction(action.label)}
                >
                    <action.icon className="w-3 h-3" />
                    {action.label}
                </Button>
            ))}
        </div>
    );
}