import React from "react";
import { base44 } from "@/api/base44Client";
import { JobListing } from "@/entities/JobListing";
import { Application } from "@/entities/Application";
import { hasAccess, TIERS } from "@/components/utils/accessControl";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
    ClipboardList, AlertTriangle, CheckCircle2, Clock, XCircle,
    ChevronDown, ChevronUp, ExternalLink, Plus, RefreshCw,
    Building2, MapPin, DollarSign, Wifi, Loader2, FileText,
    Image, Mail, Eye, Edit3, ThumbsDown, BookmarkX, Search,
    TrendingUp, Send, Inbox, Wand2, Download, ShieldCheck,
    ShieldAlert, Sparkles
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

// ── Helpers ──────────────────────────────────────────────────────

function timeAgo(ts) {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const min = Math.round(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.round(hr / 24)}d ago`;
}

function formatSalary(min, max) {
    if (!min && !max) return null;
    const fmt = (n) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
    if (min && max) return `${fmt(min)}–${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `up to ${fmt(max)}`;
}

function matchColor(score) {
    if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
}

function statusConfig(status) {
    const map = {
        pending_review:  { label: "Pending Review", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",   icon: Clock },
        needs_attention: { label: "Needs Attention", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300", icon: AlertTriangle },
        approved:        { label: "Approved", color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",  icon: CheckCircle2 },
        submitted:       { label: "Submitted", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300", icon: Send },
        rejected:        { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",    icon: XCircle },
        manual:          { label: "Manual", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",  icon: BookmarkX },
        discovered:      { label: "Discovered", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Eye },
        tailoring:       { label: "Tailoring", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300", icon: FileText },
        filling:         { label: "Filling Form", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300", icon: Edit3 },
    };
    return map[status] || { label: status, color: "bg-slate-100 text-slate-700", icon: Clock };
}

function fillSourceBadge(source) {
    if (source === "profile")  return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
    if (source === "resume")   return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    if (source === "kyle")     return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
    return "bg-slate-100 text-slate-600";
}

// ── Expandable Section ────────────────────────────────────────────

function Section({ label, icon: Icon, children, defaultOpen = false }) {
    const [open, setOpen] = React.useState(defaultOpen);
    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
                <span className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {label}
                </span>
                {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            {open && <div className="px-3 py-3 border-t border-border bg-muted/20">{children}</div>}
        </div>
    );
}

// ── Needs Attention Banner ────────────────────────────────────────

function AttentionBanner({ reason, url }) {
    const isLogin    = reason?.includes("LOGIN_REQUIRED") || reason?.includes("Account required");
    const isCaptcha  = reason?.includes("CAPTCHA");
    const isUpload   = reason?.includes("upload");

    return (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800 dark:text-amber-200 ml-1">
                <span className="font-semibold">
                    {isLogin ? "Account required — " : isCaptcha ? "CAPTCHA detected — " : isUpload ? "Upload failed — " : "Action needed — "}
                </span>
                {reason}
                {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="ml-2 underline font-medium">
                        Open link <ExternalLink className="w-3 h-3 inline" />
                    </a>
                )}
            </AlertDescription>
        </Alert>
    );
}

// ── Application Card ──────────────────────────────────────────────

function ApplicationCard({ listing, application, onApprove, onReject, onManual, onStatusUpdate, onTailor, tailoring, tailorResult }) {
    const [editing, setEditing]         = React.useState(false);
    const [editAnswers, setEditAnswers] = React.useState("");
    const [editCoverLetter, setEditCoverLetter] = React.useState("");
    const [saving, setSaving]           = React.useState(false);
    const [tailorFormat, setTailorFormat] = React.useState("standard");

    const sc   = statusConfig(listing.status);
    const Icon = sc.icon;
    const salary = formatSalary(listing.salary_min, listing.salary_max);
    const fillSummary      = application?.fill_summary || {};
    const screeningAnswers = application?.screening_answers || {};
    const hasFillData      = Object.keys(fillSummary).length > 0;
    const hasScreening     = Object.keys(screeningAnswers).length > 0;
    const isNeedsAttention = listing.status === "needs_attention";
    const isPending        = listing.status === "pending_review";
    const isApproved       = listing.status === "approved";

    const startEdit = () => {
        setEditAnswers(
            hasScreening
                ? Object.entries(screeningAnswers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join("\n\n")
                : ""
        );
        setEditCoverLetter(application?.cover_letter_text || "");
        setEditing(true);
    };

    const saveEdit = async () => {
        if (!application) return;
        setSaving(true);
        try {
            // Parse edited Q&A back into object
            const pairs = {};
            editAnswers.split(/\n\n+/).forEach(block => {
                const qLine = block.match(/^Q:\s*(.+)/m);
                const aLine = block.match(/^A:\s*([\s\S]+)/m);
                if (qLine && aLine) pairs[qLine[1].trim()] = aLine[1].trim();
            });
            await Application.update(application.id, {
                screening_answers: pairs,
                cover_letter_text: editCoverLetter,
            });
            setEditing(false);
            onStatusUpdate(listing.id, listing.status);
        } catch (e) {
            console.error("Save failed", e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className={`transition-all ${isNeedsAttention ? "border-amber-300 dark:border-amber-700" : "border-border"}`}>
            <CardHeader className="pb-2 pt-4 px-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-bold text-foreground text-base truncate">{listing.company}</span>
                            {listing.match_score > 0 && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${matchColor(listing.match_score)}`}>
                                    {listing.match_score}% match
                                </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.color}`}>
                                <Icon className="w-3 h-3" />{sc.label}
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{listing.title}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                            {listing.location && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />{listing.location}
                                </span>
                            )}
                            {listing.remote && (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <Wifi className="w-3 h-3" />Remote
                                </span>
                            )}
                            {salary && (
                                <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />{salary}
                                </span>
                            )}
                            {listing.posted_at && <span>Posted {timeAgo(listing.posted_at)}</span>}
                            {listing.created_at && <span>Found {timeAgo(listing.created_at)}</span>}
                            <span className="capitalize text-muted-foreground/70">via {listing.source}</span>
                        </div>
                    </div>
                    {listing.url && (
                        <a href={listing.url} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 p-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </a>
                    )}
                </div>

                {/* Needs Attention banner */}
                {isNeedsAttention && listing.flagged_reason && (
                    <div className="mt-2">
                        <AttentionBanner reason={listing.flagged_reason} url={listing.url} />
                    </div>
                )}

                {/* Simon's summary */}
                {listing.simon_summary && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed border-l-2 border-blue-300 dark:border-blue-700 pl-2">
                        {listing.simon_summary}
                    </p>
                )}
            </CardHeader>

            <CardContent className="px-4 pb-4 space-y-2">
                {/* Expandable sections */}
                {listing.jd_text && (
                    <Section label="Job Description" icon={FileText}>
                        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                            {listing.jd_text}
                        </p>
                    </Section>
                )}

                {hasFillData && (
                    <Section label="Form Fill Summary" icon={Edit3}>
                        <div className="space-y-1.5">
                            {Object.entries(fillSummary).map(([field, info]) => (
                                <div key={field} className="flex items-start gap-2 text-xs">
                                    <span className="text-muted-foreground w-32 flex-shrink-0 truncate">{field}</span>
                                    <span className="flex-1 text-foreground">{typeof info === "object" ? info.value : info}</span>
                                    {typeof info === "object" && info.source && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${fillSourceBadge(info.source)}`}>
                                            {info.source}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {(hasScreening || editing) && (
                    <Section label="Screening Answers" icon={FileText} defaultOpen={editing}>
                        {editing ? (
                            <Textarea
                                value={editAnswers}
                                onChange={e => setEditAnswers(e.target.value)}
                                className="text-xs font-mono min-h-[160px]"
                                placeholder="Q: Question text&#10;A: Answer text&#10;&#10;Q: Next question&#10;A: Next answer"
                            />
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(screeningAnswers).map(([q, a]) => (
                                    <div key={q}>
                                        <p className="text-xs font-medium text-foreground">{q}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{a}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                )}

                {(application?.cover_letter_text || editing) && (
                    <Section label="Cover Letter" icon={Mail} defaultOpen={false}>
                        {editing ? (
                            <Textarea
                                value={editCoverLetter}
                                onChange={e => setEditCoverLetter(e.target.value)}
                                className="text-xs min-h-[200px]"
                            />
                        ) : (
                            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                                {application.cover_letter_text}
                            </p>
                        )}
                    </Section>
                )}

                {application?.screenshot_url && (
                    <Section label="Form Screenshot" icon={Image}>
                        <img
                            src={application.screenshot_url}
                            alt="Form screenshot"
                            className="w-full rounded border border-border max-h-64 object-top object-cover"
                        />
                    </Section>
                )}

                {/* ── Tailor error ── */}
                {tailorResult?.error && (
                    <Alert className="border-red-300 bg-red-50 dark:bg-red-950/30 py-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-xs text-red-800 dark:text-red-200 ml-1">
                            <span className="font-semibold">Tailoring failed — </span>{tailorResult.error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* ── Simon Audit Panel ── */}
                {tailorResult && !tailorResult.error && (
                    <Section label={`Simon's Audit · ATS ${tailorResult.ats_score}/100`} icon={tailorResult.audit?.passed ? ShieldCheck : ShieldAlert} defaultOpen>
                        <div className="space-y-2">
                            {/* ATS score bar */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${tailorResult.ats_score >= 75 ? "bg-green-500" : tailorResult.ats_score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                                        style={{ width: `${tailorResult.ats_score}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold tabular-nums w-12 text-right">{tailorResult.ats_score}/100</span>
                            </div>

                            {/* Audit badges */}
                            <div className="flex flex-wrap gap-1.5">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tailorResult.audit?.passed ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                                    {tailorResult.audit?.passed ? "✓ Clean Room" : "⚠ Review Needed"}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                    {tailorResult.keyword_gaps_filled?.length || 0} keywords injected
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    Round {tailorResult.round}
                                </span>
                                {tailorResult.audit?.section_parse && Object.entries(tailorResult.audit.section_parse).filter(([,v])=>v).map(([k]) => (
                                    <span key={k} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        ✓ {k}
                                    </span>
                                ))}
                            </div>

                            {/* Keywords injected list */}
                            {tailorResult.keyword_gaps_filled?.length > 0 && (
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    <span className="font-medium text-foreground">Injected: </span>
                                    {tailorResult.keyword_gaps_filled.join(" · ")}
                                </p>
                            )}

                            {/* Audit issues */}
                            {tailorResult.audit?.ghost_strings?.length > 0 && (
                                <Alert className="py-1.5 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                                    <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                                        ⚠ Ghost string detected — manual review recommended
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* DOCX download */}
                            {tailorResult.docx_base64 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-1"
                                    onClick={() => {
                                        const bytes = atob(tailorResult.docx_base64);
                                        const arr = new Uint8Array(bytes.length);
                                        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                                        const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                                        const a = document.createElement("a");
                                        a.href = URL.createObjectURL(blob);
                                        a.download = tailorResult.docx_filename || "resume.docx";
                                        a.click();
                                    }}
                                >
                                    <Download className="w-3.5 h-3.5 mr-1.5" />
                                    Download Tailored Resume (.docx)
                                </Button>
                            )}
                        </div>
                    </Section>
                )}

                <Separator className="my-2" />

                {/* Action row */}
                {editing ? (
                    <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} disabled={saving} className="flex-1">
                            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                            Save Changes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Tailor Resume row */}
                        {listing.status !== "submitted" && listing.status !== "rejected" && (
                            <div className="flex gap-2 items-center">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                                    onClick={() => onTailor(listing.id, tailorFormat)}
                                    disabled={tailoring}
                                >
                                    {tailoring
                                        ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Tailoring…</>
                                        : <><Wand2 className="w-3.5 h-3.5 mr-1.5" />Tailor Resume</>
                                    }
                                </Button>
                                <select
                                    value={tailorFormat}
                                    onChange={e => setTailorFormat(e.target.value)}
                                    className="text-xs border border-border rounded px-2 py-1.5 bg-background text-foreground h-8"
                                    disabled={tailoring}
                                >
                                    <option value="standard">Standard (ATS)</option>
                                    <option value="v4">V4 Two-Column</option>
                                    <option value="v5">V5 Executive</option>
                                </select>
                            </div>
                        )}

                        {/* Primary actions */}
                        <div className="flex gap-2 flex-wrap">
                            {(isPending || isNeedsAttention || isApproved) && (
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => onApprove(listing)}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                    Approve & Submit
                                </Button>
                            )}
                            {(isPending || isNeedsAttention) && application && (
                                <Button size="sm" variant="outline" onClick={startEdit}>
                                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                                    Edit First
                                </Button>
                            )}
                            {listing.status !== "rejected" && listing.status !== "submitted" && (
                                <Button size="sm" variant="outline" onClick={() => onReject(listing.id)}>
                                    <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
                                    Reject
                                </Button>
                            )}
                            {listing.status !== "manual" && listing.status !== "submitted" && (
                                <Button size="sm" variant="ghost" onClick={() => onManual(listing.id)}>
                                    <BookmarkX className="w-3.5 h-3.5 mr-1.5" />
                                    Manual
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ── Stat Card ─────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color = "text-foreground" }) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${color}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function ReviewQueue() {
    const [currentUser, setCurrentUser]         = React.useState(null);
    const [isLoadingUser, setIsLoadingUser]     = React.useState(true);
    const [listings, setListings]               = React.useState([]);
    const [applications, setApplications]       = React.useState([]);
    const [loading, setLoading]                 = React.useState(true);
    const [statusFilter, setStatusFilter]       = React.useState("active");
    const [searchTerm, setSearchTerm]           = React.useState("");
    const [sortBy, setSortBy]                   = React.useState("newest");
    const [minScore, setMinScore]               = React.useState([60]);
    const [showAddDialog, setShowAddDialog]     = React.useState(false);
    const [addForm, setAddForm]                 = React.useState({ title: "", company: "", url: "", location: "" });
    const [addLoading, setAddLoading]           = React.useState(false);
    const [addError, setAddError]               = React.useState("");
    const [confirmApprove, setConfirmApprove]   = React.useState(null);
    const [discoverLoading, setDiscoverLoading] = React.useState(false);
    const [discoverResult, setDiscoverResult]   = React.useState(null);
    const [showDiscover, setShowDiscover]       = React.useState(false);
    const [discoverQuery, setDiscoverQuery]     = React.useState("");
    const [discoverLocation, setDiscoverLocation] = React.useState("");
    const [tailoringIds, setTailoringIds]       = React.useState(new Set());
    const [tailorResults, setTailorResults]     = React.useState({});

    // ── Auth ──
    React.useEffect(() => {
        (async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
            } catch {
                setCurrentUser(null);
            } finally {
                setIsLoadingUser(false);
            }
        })();
    }, []);

    // ── Load data ──
    const loadData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [listingData, appData] = await Promise.all([
                JobListing.list("-created_date", 200),
                Application.list("-created_date", 200),
            ]);
            setListings(listingData || []);
            setApplications(appData || []);
        } catch (e) {
            console.error("ReviewQueue load error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!isLoadingUser) loadData();
    }, [isLoadingUser, loadData]);

    // ── Application map ──
    const appByListing = React.useMemo(() => {
        const map = {};
        applications.forEach(a => { map[a.job_listing_id] = a; });
        return map;
    }, [applications]);

    // ── Stats ──
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const stats = React.useMemo(() => ({
        pending:       listings.filter(l => l.status === "pending_review").length,
        needs_attention: listings.filter(l => l.status === "needs_attention").length,
        submitted:     applications.filter(a => a.status === "submitted" && new Date(a.submitted_at) > weekAgo).length,
        avg_match:     (() => {
            const scored = listings.filter(l => l.match_score > 0);
            return scored.length ? Math.round(scored.reduce((s, l) => s + l.match_score, 0) / scored.length) : 0;
        })(),
    }), [listings, applications]);

    // ── Filtered + sorted listings ──
    const filtered = React.useMemo(() => {
        let result = listings.filter(l => {
            if (statusFilter === "active")         return ["pending_review","needs_attention","discovered"].includes(l.status);
            if (statusFilter === "pending_review") return l.status === "pending_review";
            if (statusFilter === "needs_attention") return l.status === "needs_attention";
            if (statusFilter === "approved")       return l.status === "approved";
            if (statusFilter === "submitted")      return l.status === "submitted";
            return true; // "all"
        });

        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.company?.toLowerCase().includes(t) ||
                l.title?.toLowerCase().includes(t) ||
                l.location?.toLowerCase().includes(t)
            );
        }

        if (minScore[0] > 0) {
            result = result.filter(l => !l.match_score || l.match_score >= minScore[0]);
        }

        result.sort((a, b) => {
            // Needs attention always first
            if (a.status === "needs_attention" && b.status !== "needs_attention") return -1;
            if (b.status === "needs_attention" && a.status !== "needs_attention") return 1;
            if (sortBy === "match")   return (b.match_score || 0) - (a.match_score || 0);
            if (sortBy === "company") return (a.company || "").localeCompare(b.company || "");
            return new Date(b.created_at) - new Date(a.created_at); // newest
        });

        return result;
    }, [listings, statusFilter, searchTerm, minScore, sortBy]);

    // ── Actions ──
    const handleTailor = async (listingId, format = "standard") => {
        if (tailoringIds.has(listingId)) return;
        setTailoringIds(prev => new Set([...prev, listingId]));
        try {
            const result = await base44.functions.invoke("orchestrateTailoring", {
                user_id: currentUser?.id,
                job_listing_id: listingId,
                format,
            });
            setTailorResults(prev => ({ ...prev, [listingId]: result }));
            // Refresh listings so status badge updates
            await loadData();
        } catch (e) {
            console.error("Tailoring failed:", e);
            setTailorResults(prev => ({ ...prev, [listingId]: { error: e.message } }));
        } finally {
            setTailoringIds(prev => { const s = new Set(prev); s.delete(listingId); return s; });
        }
    };

    const handleApprove = (listing) => setConfirmApprove(listing);

    const confirmAndApprove = async () => {
        if (!confirmApprove) return;
        try {
            await JobListing.update(confirmApprove.id, { status: "approved" });
            const app = appByListing[confirmApprove.id];
            if (app) await Application.update(app.id, { status: "approved" });
            window.open(confirmApprove.url, "_blank");
            setListings(prev => prev.map(l => l.id === confirmApprove.id ? { ...l, status: "approved" } : l));
        } catch (e) {
            console.error("Approve failed", e);
        } finally {
            setConfirmApprove(null);
        }
    };

    const handleReject = async (id) => {
        try {
            await JobListing.update(id, { status: "rejected" });
            setListings(prev => prev.map(l => l.id === id ? { ...l, status: "rejected" } : l));
        } catch (e) {
            console.error("Reject failed", e);
        }
    };

    const handleManual = async (id) => {
        try {
            await JobListing.update(id, { status: "manual" });
            setListings(prev => prev.map(l => l.id === id ? { ...l, status: "manual" } : l));
        } catch (e) {
            console.error("Manual flag failed", e);
        }
    };

    const handleStatusUpdate = (id, status) => {
        setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    };

    // ── Manual add job ──
    const handleAddJob = async () => {
        if (!addForm.url.trim()) { setAddError("Job URL is required."); return; }
        if (!addForm.title.trim()) { setAddError("Job title is required."); return; }
        if (!addForm.company.trim()) { setAddError("Company name is required."); return; }
        setAddError("");
        setAddLoading(true);
        try {
            const newListing = await JobListing.create({
                user_id:    currentUser?.id || "",
                source:     "manual",
                title:      addForm.title.trim(),
                company:    addForm.company.trim(),
                location:   addForm.location.trim(),
                url:        addForm.url.trim(),
                status:     "pending_review",
                match_score: 0,
                created_at: new Date().toISOString(),
            });
            setListings(prev => [newListing, ...prev]);
            setAddForm({ title: "", company: "", url: "", location: "" });
            setShowAddDialog(false);
        } catch (e) {
            setAddError("Failed to add job. Please try again.");
            console.error("Add job failed", e);
        } finally {
            setAddLoading(false);
        }
    };

    // ── Discover jobs ──
    const handleDiscover = async () => {
        if (!discoverQuery.trim()) return;
        setDiscoverLoading(true);
        setDiscoverResult(null);
        try {
            const result = await base44.functions.invoke("discoverJobs", {
                user_id:      currentUser?.id,
                search_query: discoverQuery.trim(),
                location:     discoverLocation.trim(),
                remote_only:  false,
            });
            setDiscoverResult(result);
            await loadData();
        } catch (e) {
            setDiscoverResult({ error: e.message });
        } finally {
            setDiscoverLoading(false);
        }
    };

    // ── Upgrade gate ──
    if (!isLoadingUser && currentUser && !hasAccess(currentUser, TIERS.PRO)) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <UpgradePrompt feature="Review Queue" currentTier={currentUser?.subscription_tier} />
            </div>
        );
    }

    // ── Loading ──
    if (isLoadingUser || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ClipboardList className="w-6 h-6" /> Review Queue
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Review and approve every application before it's submitted
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setShowDiscover(true)}>
                        <Search className="w-3.5 h-3.5 mr-1.5" /> Discover Jobs
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Job Manually
                    </Button>
                    <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Pending Review"   value={stats.pending}          icon={Clock}        color="text-blue-600" />
                <StatCard label="Needs Attention"  value={stats.needs_attention}  icon={AlertTriangle} color="text-amber-600" />
                <StatCard label="Submitted (7d)"   value={stats.submitted}        icon={Send}         color="text-green-600" />
                <StatCard label="Avg Match Score"  value={stats.avg_match ? `${stats.avg_match}%` : "—"} icon={TrendingUp} color="text-purple-600" />
            </div>

            {/* Filters */}
            <div className="space-y-3">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList className="flex-wrap h-auto gap-1">
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
                        <TabsTrigger value="needs_attention">
                            Needs Attention
                            {stats.needs_attention > 0 && (
                                <span className="ml-1.5 bg-amber-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                                    {stats.needs_attention}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="submitted">Submitted</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-3 flex-wrap items-center">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search company or role..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Min match: {minScore[0]}%</span>
                        <Slider
                            value={minScore}
                            onValueChange={setMinScore}
                            min={0} max={100} step={5}
                            className="w-28"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="h-8 text-sm rounded-md border border-input bg-background px-2 text-foreground"
                    >
                        <option value="newest">Newest first</option>
                        <option value="match">Highest match</option>
                        <option value="company">Company A–Z</option>
                    </select>
                </div>
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Inbox className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    {listings.length === 0 ? (
                        <>
                            <p className="text-base font-medium text-muted-foreground">No jobs discovered yet</p>
                            <p className="text-sm text-muted-foreground mt-1">Click "Discover Jobs" to start scanning, or add one manually.</p>
                            <Button className="mt-4" onClick={() => setShowDiscover(true)}>
                                <Search className="w-4 h-4 mr-2" /> Discover Jobs
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-base font-medium text-muted-foreground">You're all caught up</p>
                            <p className="text-sm text-muted-foreground mt-1">No items match your current filters.</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</p>
                    {filtered.map(listing => (
                        <ApplicationCard
                            key={listing.id}
                            listing={listing}
                            application={appByListing[listing.id] || null}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onManual={handleManual}
                            onStatusUpdate={handleStatusUpdate}
                            onTailor={handleTailor}
                            tailoring={tailoringIds.has(listing.id)}
                            tailorResult={tailorResults[listing.id] || null}
                        />
                    ))}
                </div>
            )}

            {/* Approve confirmation dialog */}
            <Dialog open={!!confirmApprove} onOpenChange={() => setConfirmApprove(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve & Submit Application</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will open your browser to{" "}
                        <span className="font-semibold text-foreground">{confirmApprove?.company}</span>{" "}
                        — {confirmApprove?.title}.<br />
                        You will need to manually click Submit on the application page.
                    </p>
                    <div className="flex gap-2 justify-end mt-2">
                        <Button variant="outline" onClick={() => setConfirmApprove(null)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmAndApprove}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open & Approve
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add job manually dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Job Manually</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs">Job URL *</Label>
                            <Input
                                placeholder="https://company.com/jobs/..."
                                value={addForm.url}
                                onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Job Title *</Label>
                            <Input
                                placeholder="HR Director"
                                value={addForm.title}
                                onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Company *</Label>
                            <Input
                                placeholder="Acme Corp"
                                value={addForm.company}
                                onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Location</Label>
                            <Input
                                placeholder="Los Angeles, CA"
                                value={addForm.location}
                                onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        {addError && (
                            <Alert variant="destructive" className="py-2">
                                <AlertDescription className="text-xs">{addError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                            <Button onClick={handleAddJob} disabled={addLoading}>
                                {addLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                                Add to Queue
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Discover jobs dialog */}
            <Dialog open={showDiscover} onOpenChange={setShowDiscover}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Discover Jobs</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs">Search Query *</Label>
                            <Input
                                placeholder="HR Director, People Operations Manager..."
                                value={discoverQuery}
                                onChange={e => setDiscoverQuery(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Location (optional)</Label>
                            <Input
                                placeholder="Los Angeles, CA"
                                value={discoverLocation}
                                onChange={e => setDiscoverLocation(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        {discoverResult && !discoverResult.error && (
                            <Alert className="py-2 border-green-300 bg-green-50 dark:bg-green-950/30">
                                <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                                    Found <strong>{discoverResult.new_listings}</strong> new listings
                                    ({discoverResult.high_match} high match, {discoverResult.duplicates_skipped} duplicates skipped)
                                </AlertDescription>
                            </Alert>
                        )}
                        {discoverResult?.error && (
                            <Alert variant="destructive" className="py-2">
                                <AlertDescription className="text-xs">{discoverResult.error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowDiscover(false)}>Close</Button>
                            <Button onClick={handleDiscover} disabled={discoverLoading || !discoverQuery.trim()}>
                                {discoverLoading
                                    ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Scanning...</>
                                    : <><Search className="w-3.5 h-3.5 mr-1.5" />Discover</>
                                }
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
