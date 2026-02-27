import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, Compass, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

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

/**
 * Extract company name from Simon's company-role-match response text.
 */
export function extractCompanyName(text) {
    if (!text || typeof text !== "string") return null;
    // Try to find "Company: X" or "company_name: X" patterns
    const patterns = [
        /company:\s*(.+?)(?:\n|\||$)/i,
        /company signals.*?(?:for|at|about)\s+(.+?)(?:\n|\||$)/i,
        /role match.*?(?:at|for)\s+(.+?)(?:\n|\||$)/i,
    ];
    for (const p of patterns) {
        const match = text.match(p);
        if (match?.[1]) return match[1].trim().replace(/[*#]/g, "").trim();
    }
    return null;
}

export default function SimonActionChips({ onAction, companyName }) {
    const searchHubUrl = companyName
        ? `${createPageUrl("SearchHub")}?agent=simon&type=company_research&query=${encodeURIComponent(companyName)}`
        : null;

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
            {searchHubUrl && (
                <Link to={searchHubUrl}>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                        <ArrowRight className="w-3 h-3" />
                        Open Search Hub Deep Research
                    </Button>
                </Link>
            )}
        </div>
    );
}