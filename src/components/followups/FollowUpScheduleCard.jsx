import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Mail, Linkedin, Phone, CheckCircle2, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const actionIcons = {
    email: Mail,
    linkedin: Linkedin,
    phone: Phone,
    portal_check: CheckCircle2
};

export default function FollowUpScheduleCard({ application, schedule, onLogFollowUp, onGenerateSchedule, isGenerating }) {
    const [selectedFollowUp, setSelectedFollowUp] = useState(null);
    const [note, setNote] = useState("");

    const handleLogFollowUp = async () => {
        if (!selectedFollowUp) return;
        
        await onLogFollowUp({
            ts: new Date().toISOString(),
            channel: selectedFollowUp.action,
            note: note.trim() || `Followed up via ${selectedFollowUp.action}`
        });
        
        setSelectedFollowUp(null);
        setNote("");
    };

    if (!schedule) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">AI Follow-Up Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                        Generate an AI-powered follow-up schedule based on industry norms and company insights.
                    </p>
                    <Button 
                        onClick={onGenerateSchedule} 
                        disabled={isGenerating}
                        className="w-full"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Generate Smart Schedule
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const now = new Date();
    const upcoming = schedule.follow_up_schedule?.filter(f => 
        f.date && new Date(f.date) > now
    ) || [];
    const completed = application.follow_up_history || [];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Follow-Up Schedule
                        </span>
                        <Button onClick={onGenerateSchedule} size="sm" variant="outline">
                            Refresh
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Strategy Overview */}
                    {schedule.overall_strategy && (
                        <Alert className="border-blue-200 bg-blue-50">
                            <AlertDescription className="text-blue-800 text-sm">
                                <strong>Strategy:</strong> {schedule.overall_strategy}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Flags */}
                    {(schedule.green_flags?.length > 0 || schedule.red_flags?.length > 0) && (
                        <div className="grid md:grid-cols-2 gap-3">
                            {schedule.green_flags?.length > 0 && (
                                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                    <h4 className="text-sm font-semibold text-green-800 mb-2">Positive Signals</h4>
                                    <ul className="space-y-1">
                                        {schedule.green_flags.map((flag, idx) => (
                                            <li key={idx} className="text-xs text-green-700 flex items-start gap-1">
                                                <span className="text-green-600 mt-0.5">✓</span>
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {schedule.red_flags?.length > 0 && (
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                    <h4 className="text-sm font-semibold text-amber-800 mb-2">Watch Out</h4>
                                    <ul className="space-y-1">
                                        {schedule.red_flags.map((flag, idx) => (
                                            <li key={idx} className="text-xs text-amber-700 flex items-start gap-1">
                                                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upcoming Follow-Ups */}
                    {upcoming.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-3">Upcoming Follow-Ups</h4>
                            <div className="space-y-3">
                                {upcoming.map((followUp, idx) => {
                                    const Icon = actionIcons[followUp.action] || Mail;
                                    const isOverdue = new Date(followUp.date) < now;
                                    
                                    return (
                                        <div 
                                            key={idx}
                                            className={`p-3 rounded-lg border ${
                                                isOverdue 
                                                    ? 'bg-red-50 border-red-200' 
                                                    : 'bg-slate-50 border-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                                                    <span className="font-medium text-slate-800 capitalize">
                                                        {followUp.action.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <Badge variant={isOverdue ? "destructive" : "outline"}>
                                                    {format(new Date(followUp.date), 'MMM d')}
                                                    {isOverdue && " (Overdue)"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-700 mb-2 italic">
                                                "{followUp.message_template}"
                                            </p>
                                            <p className="text-xs text-slate-500 mb-3">
                                                {followUp.reasoning}
                                            </p>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => setSelectedFollowUp(followUp)}
                                            >
                                                Mark as Done
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Completed Follow-Ups */}
                    {completed.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-3">Completed Follow-Ups</h4>
                            <div className="space-y-2">
                                {completed.map((followUp, idx) => {
                                    const Icon = actionIcons[followUp.channel] || Mail;
                                    return (
                                        <div key={idx} className="flex items-start gap-2 p-2 rounded bg-green-50">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Icon className="w-3 h-3 text-green-700" />
                                                    <span className="font-medium text-green-800 capitalize">
                                                        {followUp.channel}
                                                    </span>
                                                    <span className="text-green-600 text-xs">
                                                        {formatDistanceToNow(new Date(followUp.ts), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                {followUp.note && (
                                                    <p className="text-xs text-green-700 mt-1">{followUp.note}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Log Follow-Up Dialog */}
                    {selectedFollowUp && (
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-slate-800 mb-3">Log Follow-Up</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                                        Add notes (optional)
                                    </label>
                                    <Textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="e.g., Spoke with recruiter, they'll get back next week..."
                                        className="min-h-[80px]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleLogFollowUp} className="flex-1">
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Log Follow-Up
                                    </Button>
                                    <Button variant="outline" onClick={() => setSelectedFollowUp(null)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}