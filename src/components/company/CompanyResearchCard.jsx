import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Building2,
    TrendingUp,
    Users,
    MapPin,
    Calendar,
    Globe,
    Newspaper,
    DollarSign,
    Heart,
    AlertTriangle,
    CheckCircle2,
    Edit2,
    Save,
    Plus,
    X,
    ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function CompanyResearchCard({ research, onUpdate, onRefresh }) {
    const [isEditing, setIsEditing] = useState(false);
    const [notes, setNotes] = useState(research.user_notes || "");
    const [pros, setPros] = useState(research.user_pros || []);
    const [cons, setCons] = useState(research.user_cons || []);
    const [newPro, setNewPro] = useState("");
    const [newCon, setNewCon] = useState("");

    const handleSave = async () => {
        await onUpdate({
            user_notes: notes,
            user_pros: pros,
            user_cons: cons
        });
        setIsEditing(false);
    };

    const addPro = () => {
        if (newPro.trim()) {
            setPros([...pros, newPro.trim()]);
            setNewPro("");
        }
    };

    const addCon = () => {
        if (newCon.trim()) {
            setCons([...cons, newCon.trim()]);
            setNewCon("");
        }
    };

    const removePro = (index) => setPros(pros.filter((_, i) => i !== index));
    const removeCon = (index) => setCons(cons.filter((_, i) => i !== index));

    const getFitColor = (score) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-blue-600";
        if (score >= 40) return "text-amber-600";
        return "text-red-600";
    };

    const autoResearch = research.auto_research || {};
    const fitAnalysis = research.fit_analysis || {};

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="border-b">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-2xl flex items-center gap-2 mb-2">
                                <Building2 className="w-6 h-6 text-blue-600" />
                                {research.company_name}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                {research.website && (
                                    <a href={research.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                                        <Globe className="w-4 h-4" />
                                        {research.website.replace(/^https?:\/\//, '')}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                {research.headquarters && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {research.headquarters}
                                    </span>
                                )}
                                {research.founded && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Founded {research.founded}
                                    </span>
                                )}
                                {research.size && (
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {research.size}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge className={research.research_status === "completed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                                {research.research_status}
                            </Badge>
                            {research.last_researched_at && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Updated {format(new Date(research.last_researched_at), 'MMM d, yyyy')}
                                </p>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Fit Score */}
                    {typeof research.fit_score === "number" && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-slate-800">Company Fit Score</h3>
                                <span className={`text-3xl font-bold ${getFitColor(research.fit_score)}`}>
                                    {research.fit_score}
                                </span>
                            </div>
                            <Progress value={research.fit_score} className="h-2 mb-4" />
                            
                            {fitAnalysis.culture_fit !== undefined && (
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <div className="text-slate-600 mb-1">Culture Fit</div>
                                        <Progress value={fitAnalysis.culture_fit} className="h-1.5" />
                                    </div>
                                    <div>
                                        <div className="text-slate-600 mb-1">Values Alignment</div>
                                        <Progress value={fitAnalysis.values_alignment} className="h-1.5" />
                                    </div>
                                    <div>
                                        <div className="text-slate-600 mb-1">Growth Potential</div>
                                        <Progress value={fitAnalysis.growth_potential} className="h-1.5" />
                                    </div>
                                    <div>
                                        <div className="text-slate-600 mb-1">Work-Life Balance</div>
                                        <Progress value={fitAnalysis.work_life_balance} className="h-1.5" />
                                    </div>
                                </div>
                            )}
                            
                            {fitAnalysis.reasoning && (
                                <p className="text-sm text-slate-700 mt-3 italic">{fitAnalysis.reasoning}</p>
                            )}
                        </div>
                    )}

                    {/* Red/Green Flags */}
                    {(fitAnalysis.green_flags?.length > 0 || fitAnalysis.red_flags?.length > 0) && (
                        <div className="grid md:grid-cols-2 gap-4">
                            {fitAnalysis.green_flags?.length > 0 && (
                                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Green Flags
                                    </h4>
                                    <ul className="space-y-1">
                                        {fitAnalysis.green_flags.map((flag, idx) => (
                                            <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                                                <span className="text-green-500 mt-0.5">✓</span>
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {fitAnalysis.red_flags?.length > 0 && (
                                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                                    <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Red Flags
                                    </h4>
                                    <ul className="space-y-1">
                                        {fitAnalysis.red_flags.map((flag, idx) => (
                                            <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                                                <span className="text-red-500 mt-0.5">⚠</span>
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Company Overview */}
                    {autoResearch.overview && (
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Company Overview
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">{autoResearch.overview}</p>
                        </div>
                    )}

                    {/* Recent News */}
                    {autoResearch.recent_news?.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                <Newspaper className="w-4 h-4" />
                                Recent News
                            </h3>
                            <div className="space-y-3">
                                {autoResearch.recent_news.map((news, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border">
                                        <h4 className="font-medium text-slate-800 text-sm mb-1">{news.title}</h4>
                                        <p className="text-xs text-slate-600 mb-1">{news.summary}</p>
                                        {news.date && <p className="text-xs text-slate-500">{news.date}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Funding Info */}
                    {autoResearch.funding_info && (
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Funding Information
                            </h3>
                            <div className="grid md:grid-cols-3 gap-3">
                                {autoResearch.funding_info.stage && (
                                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                                        <div className="text-xs text-purple-700 mb-1">Stage</div>
                                        <div className="font-semibold text-purple-900">{autoResearch.funding_info.stage}</div>
                                    </div>
                                )}
                                {autoResearch.funding_info.total_raised && (
                                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                        <div className="text-xs text-green-700 mb-1">Total Raised</div>
                                        <div className="font-semibold text-green-900">{autoResearch.funding_info.total_raised}</div>
                                    </div>
                                )}
                                {autoResearch.funding_info.last_round && (
                                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                        <div className="text-xs text-blue-700 mb-1">Last Round</div>
                                        <div className="font-semibold text-blue-900">{autoResearch.funding_info.last_round}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Culture Insights */}
                    {autoResearch.culture_insights?.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                Culture Insights
                            </h3>
                            <ul className="space-y-1">
                                {autoResearch.culture_insights.map((insight, idx) => (
                                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        {insight}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Tech Stack */}
                    {autoResearch.tech_stack?.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-2">Tech Stack</h3>
                            <div className="flex flex-wrap gap-2">
                                {autoResearch.tech_stack.map((tech, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-slate-50">
                                        {tech}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User Notes Section */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-800">Your Research Notes</h3>
                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Notes
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button onClick={handleSave} size="sm">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save
                                    </Button>
                                    <Button onClick={() => setIsEditing(false)} size="sm" variant="outline">
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Notes</label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add your research notes, impressions, contacts, etc..."
                                        className="min-h-[120px]"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Pros</label>
                                    <div className="space-y-2">
                                        {pros.map((pro, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <Input value={pro} readOnly className="flex-1" />
                                                <Button onClick={() => removePro(idx)} size="sm" variant="ghost">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <Input
                                                value={newPro}
                                                onChange={(e) => setNewPro(e.target.value)}
                                                placeholder="Add a pro..."
                                                onKeyDown={(e) => e.key === "Enter" && addPro()}
                                            />
                                            <Button onClick={addPro} size="sm">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Cons</label>
                                    <div className="space-y-2">
                                        {cons.map((con, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <Input value={con} readOnly className="flex-1" />
                                                <Button onClick={() => removeCon(idx)} size="sm" variant="ghost">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <Input
                                                value={newCon}
                                                onChange={(e) => setNewCon(e.target.value)}
                                                placeholder="Add a con..."
                                                onKeyDown={(e) => e.key === "Enter" && addCon()}
                                            />
                                            <Button onClick={addCon} size="sm">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notes ? (
                                    <div className="p-3 rounded-lg bg-slate-50">
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{notes}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">No notes yet. Click "Edit Notes" to add your research.</p>
                                )}

                                {pros.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700 mb-2">Your Pros</h4>
                                        <ul className="space-y-1">
                                            {pros.map((pro, idx) => (
                                                <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                                    {pro}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {cons.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700 mb-2">Your Cons</h4>
                                        <ul className="space-y-1">
                                            {cons.map((con, idx) => (
                                                <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                                    {con}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Refresh Button */}
                    <div className="pt-4 border-t">
                        <Button onClick={onRefresh} variant="outline" className="w-full">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Refresh Company Research
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}