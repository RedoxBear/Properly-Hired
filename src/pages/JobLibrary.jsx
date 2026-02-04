import React from "react";
import { JobApplication } from "@/entities/JobApplication";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDistanceToNow } from "date-fns";
import {
    Briefcase,
    Search,
    ListFilter,
    ArrowRight,
    Building,
    Target,
    Trash2,
    ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox import
import { schedule48_72 } from "@/components/utils/followups";
import { logEvent } from "@/components/utils/telemetry";

export default function JobLibrary() {
    const [applications, setApplications] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [selectedIds, setSelectedIds] = React.useState([]); // NEW: selection for bulk delete

    // Dynamically create statusConfig using plain English for labels
    const statusConfig = {
        analyzing: { color: "bg-yellow-100 text-yellow-800", label: "Analyzing" },
        ready: { color: "bg-green-100 text-green-800", label: "Ready" },
        applied: { color: "bg-blue-100 text-blue-800", label: "Applied" },
        interview: { color: "bg-purple-100 text-purple-800", label: "Interview" },
        rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
        offer: { color: "bg-emerald-100 text-emerald-800", label: "Offer" }
    };

    React.useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        setIsLoading(true);
        setError("");
        try {
            const fetchedApplications = await JobApplication.list("-created_date");
            setApplications(fetchedApplications);
        } catch (error) {
            console.error("Error loading applications:", error);
            setError("Failed to load applications. Please refresh the page.");
        }
        setIsLoading(false);
    };

    const handleDelete = async (id) => {
        const ok = window.confirm("Delete this job application? This cannot be undone.");
        if (!ok) return;
        try {
            await JobApplication.delete(id);
            setSelectedIds(prev => prev.filter(x => x !== id)); // Remove from selection if deleted
            await loadApplications();
        } catch (error) {
            console.error("Failed to delete application:", error);
            setError("Failed to delete application. Please try again.");
        }
    };

    // Toggle between Applied and Not Applied (Ready)
    const handleAppliedToggle = async (app, checked) => {
        const newStatus = checked ? "applied" : "ready";
        try {
            if (checked) {
                const now = new Date().toISOString();
                const scheduled = schedule48_72(now);
                await JobApplication.update(app.id, {
                    application_status: newStatus,
                    applied: true,
                    applied_at: now,
                    follow_up_policy: "48-72",
                    scheduled_follow_ups: scheduled,
                    next_follow_up_at: scheduled[0]
                });
                // NEW: telemetry for applied click
                try {
                    await logEvent({ type: "job_applied_click", ts: now, app_id: app.id });
                } catch (error) {
                    console.error("Telemetry logging failed for job_applied_click:", error);
                }
            } else {
                await JobApplication.update(app.id, {
                    application_status: newStatus,
                    applied: false,
                    next_follow_up_at: null
                });
            }
            await loadApplications();
        } catch (error) {
            console.error("Failed to update application status:", error);
            setError("Failed to update application status. Please try again.");
        }
    };

    // NEW: bulk helpers
    const toggleSelected = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const isSelected = (id) => selectedIds.includes(id);
    const clearSelection = () => setSelectedIds([]);
    const selectAllVisible = () => setSelectedIds(filteredApplications.map(a => a.id));
    const bulkDelete = async () => {
        if (!selectedIds.length) return;
        const ok = window.confirm(`Delete ${selectedIds.length} selected application(s)? This cannot be undone.`);
        if (!ok) return;
        await Promise.all(selectedIds.map(id => JobApplication.delete(id)));
        setSelectedIds([]);
        await loadApplications();
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) || app.company_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || app.application_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-4">
                        <Briefcase className="w-4 h-4" />
                        Job Library
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Job Library</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Track and manage all your saved job applications.
                    </p>
                </motion.div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-6">
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input
                                placeholder="Search by title or company"
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                             <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <ListFilter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {Object.entries(statusConfig).map(([status, config]) => (
                                        <SelectItem key={status} value={status}>{config.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Link to={createPageUrl("JobAnalysis")}>
                                <Button className="w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700" aria-label="New Application">
                                    <Search className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* NEW: Bulk selection bar */}
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="sticky top-4 z-20 mb-6"
                    >
                        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border bg-white/90 shadow-lg backdrop-blur-md">
                            <div className="text-sm font-semibold text-slate-700">
                                {selectedIds.length} selected
                            </div>
                            <Button variant="destructive" size="sm" onClick={bulkDelete} className="flex-shrink-0">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
                            </Button>
                            <Button variant="outline" size="sm" onClick={selectAllVisible} className="flex-shrink-0">Select All Visible</Button>
                            <Button variant="ghost" size="sm" onClick={clearSelection} className="flex-shrink-0">Clear</Button>
                        </div>
                    </motion.div>
                )}


                {isLoading ? (
                    <p className="text-center text-slate-600">Loading applications...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredApplications.map(app => (
                            <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <Card className="h-full flex flex-col hover:shadow-xl transition-shadow duration-300">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={isSelected(app.id)}
                                                    onCheckedChange={() => toggleSelected(app.id)}
                                                    aria-label="Select application"
                                                />
                                                <Badge className={`${statusConfig[app.application_status]?.color || 'bg-gray-100 text-gray-800'} border`}>
                                                    {statusConfig[app.application_status]?.label || "Unknown"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {app.optimization_score && (
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                                                        <Target className="w-4 h-4" />
                                                        <span>{app.optimization_score}%</span>
                                                    </div>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleDelete(app.id)}
                                                    title="Delete application"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardTitle className="pt-2">{app.job_title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                                            <Building className="w-4 h-4" />
                                            <span>{app.company_name}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">
                                            Added {formatDistanceToNow(new Date(app.created_date), { addSuffix: true })}
                                        </p>
                                        {app.analysis_summary_md ? (
                                            <div className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap">
                                                {app.analysis_summary_md}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400">No summary yet</div>
                                        )}
                                        <div className="mt-2">
                                            <Link to={createPageUrl(`JobSummary?id=${app.id}`)} className="text-blue-600 text-sm hover:underline">Open Summary →</Link>
                                        </div>
                                    </CardContent>

                                    {/* Actions */}
                                    <div className="p-4 pt-0 space-y-3">
                                        {/* Ready to Apply -> link to original posting */}
                                        {app.application_status === "ready" && (
                                            <div className="flex flex-wrap gap-2">
                                                <a
                                                    href={app.job_posting_url || "#"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-disabled={!app.job_posting_url}
                                                    className={!app.job_posting_url ? "pointer-events-none" : ""} // Disable link visually
                                                >
                                                    <Button
                                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                                                        disabled={!app.job_posting_url}
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Apply on Site
                                                    </Button>
                                                </a>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            {/* Applied / Not Applied toggle */}
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    id={`applied-${app.id}`}
                                                    checked={app.application_status === "applied"}
                                                    onCheckedChange={(checked) => handleAppliedToggle(app, checked)}
                                                    // Disable if status is not 'ready' or 'applied'
                                                    disabled={!["ready", "applied"].includes(app.application_status)}
                                                />
                                                <Label htmlFor={`applied-${app.id}`} className="text-sm">
                                                    {app.application_status === "applied" ? "Applied" : "Not Applied"}
                                                </Label>
                                            </div>

                                            <Link to={createPageUrl(`JobDetails?applicationId=${app.id}`)}>
                                                <Button variant="outline" className="w-full sm:w-auto group">
                                                    View Details
                                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
                 {filteredApplications.length === 0 && !isLoading && (
                    <div className="text-center py-16">
                        <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-slate-600 mb-2">No applications found</h3>
                        <p className="text-slate-500 mb-4">
                            Try clearing filters or add a new job to analyze.
                        </p>
                        <Link to={createPageUrl("JobAnalysis")}>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                Analyze a Job
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}