import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { ONetDataService } from "@/components/onet/ONetDataService";
import ONetAttribution from "@/components/onet/ONetAttribution";

const CHART_COLORS = ["#2563eb", "#f97316", "#0ea5e9", "#16a34a", "#8b5cf6", "#facc15"]; 

export default function ONetInsights() {
    const [keyword, setKeyword] = React.useState("");
    const [results, setResults] = React.useState([]);
    const [selected, setSelected] = React.useState(null);
    const [skills, setSkills] = React.useState([]);
    const [tasks, setTasks] = React.useState([]);
    const [jobZone, setJobZone] = React.useState(null);
    const [isSearching, setIsSearching] = React.useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
    const serviceRef = React.useRef(new ONetDataService());

    const searchOccupations = async () => {
        if (!keyword.trim()) return;
        setIsSearching(true);
        try {
            const response = await serviceRef.current.query("Occupation", { keyword: keyword.trim() });
            const data = response?.data || [];
            setResults(Array.isArray(data) ? data : []);
            if (data.length > 0) {
                setSelected(data[0]);
            }
        } catch (e) {
            console.error("Failed to search occupations:", e);
            setResults([]);
        }
        setIsSearching(false);
    };

    const normalizeValue = (item) => {
        const candidates = [
            item?.data_value,
            item?.importance?.data_value,
            item?.level?.data_value,
            item?.scale_value,
            item?.value
        ];
        const numeric = candidates.find((val) => typeof val === "number" || (typeof val === "string" && !Number.isNaN(Number(val))));
        return numeric ? Number(numeric) : 0;
    };

    const normalizeLabel = (item) => item?.element_name || item?.name || item?.title || item?.task || "Unknown";

    const loadDetails = React.useCallback(async (occupation) => {
        if (!occupation?.code && !occupation?.soc_code) return;
        const socCode = occupation.code || occupation.soc_code;
        setIsLoadingDetails(true);
        try {
            const [skillRes, taskRes, occupationRes] = await Promise.all([
                serviceRef.current.query("Skill", { socCode }),
                serviceRef.current.query("Task", { socCode }),
                serviceRef.current.query("Occupation", { code: socCode })
            ]);

            const skillData = (skillRes?.data || []).map((item) => ({
                name: normalizeLabel(item),
                value: normalizeValue(item)
            })).filter((item) => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 12);

            const taskData = (taskRes?.data || []).map((item) => ({
                name: normalizeLabel(item),
                value: normalizeValue(item)
            })).filter((item) => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);

            const occupationDetail = Array.isArray(occupationRes?.data) ? occupationRes.data[0] : occupationRes?.data;
            const zone = occupationDetail?.job_zone || occupationDetail?.job_zone_id || occupation?.job_zone;
            const zoneDesc = occupationDetail?.job_zone_description || occupationDetail?.job_zone_desc || "";

            setSkills(skillData);
            setTasks(taskData);
            setJobZone(zone ? { value: zone, description: zoneDesc } : null);
        } catch (e) {
            console.error("Failed to load O*NET details:", e);
            setSkills([]);
            setTasks([]);
            setJobZone(null);
        }
        setIsLoadingDetails(false);
    }, []);

    React.useEffect(() => {
        if (selected) {
            loadDetails(selected);
        }
    }, [selected, loadDetails]);

    const jobZoneDistribution = React.useMemo(() => {
        const counts = {};
        results.forEach((item) => {
            const zone = item?.job_zone || item?.job_zone_id;
            if (!zone) return;
            counts[zone] = (counts[zone] || 0) + 1;
        });
        return Object.entries(counts).map(([key, value]) => ({ name: `Zone ${key}`, value }));
    }, [results]);

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-3">
                        <TrendingUp className="w-4 h-4" />
                        O*NET Insights
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Explore O*NET Data</h1>
                    <p className="text-slate-600">Compare skills, job zones, and task frequency across occupations.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Search Occupations</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
                        <Input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Try: data analyst, nurse, product manager"
                            className="flex-1"
                        />
                        <Button onClick={searchOccupations} disabled={isSearching} className="gap-2">
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Search
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Select Occupation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selected?.code || selected?.soc_code || ""}
                            onValueChange={(val) => {
                                const next = results.find((item) => item.code === val || item.soc_code === val);
                                setSelected(next || null);
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select an occupation" />
                            </SelectTrigger>
                            <SelectContent>
                                {results.map((item) => (
                                    <SelectItem key={item.code || item.soc_code} value={item.code || item.soc_code}>
                                        {item.title || item.name || item.occupation}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selected && (
                            <p className="text-sm text-slate-500 mt-2">SOC Code: {selected.code || selected.soc_code}</p>
                        )}
                    </CardContent>
                </Card>

                <Tabs defaultValue="skills" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="skills">Skill Importance</TabsTrigger>
                        <TabsTrigger value="tasks">Task Frequency</TabsTrigger>
                        <TabsTrigger value="zones">Job Zones</TabsTrigger>
                    </TabsList>

                    <TabsContent value="skills">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Top Skills</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[360px]">
                                {isLoadingDetails ? (
                                    <div className="flex items-center justify-center h-full text-slate-500">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading skills...
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={skills} layout="vertical" margin={{ left: 16, right: 16 }}>
                                            <XAxis type="number" />
                                            <YAxis type="category" dataKey="name" width={180} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="value" name="Importance" fill="#2563eb" radius={[4, 4, 4, 4]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tasks">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Top Tasks</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[360px]">
                                {isLoadingDetails ? (
                                    <div className="flex items-center justify-center h-full text-slate-500">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tasks...
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={tasks} layout="vertical" margin={{ left: 16, right: 16 }}>
                                            <XAxis type="number" />
                                            <YAxis type="category" dataKey="name" width={180} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="value" name="Frequency" fill="#f97316" radius={[4, 4, 4, 4]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="zones">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Selected Occupation Job Zone</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {jobZone ? (
                                        <div className="space-y-2">
                                            <p className="text-2xl font-semibold text-slate-800">Zone {jobZone.value}</p>
                                            <p className="text-sm text-slate-600">{jobZone.description || "Job zone description not available."}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">Job zone data not available.</p>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Job Zone Distribution (Search Results)</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[280px]">
                                    {jobZoneDistribution.length === 0 ? (
                                        <p className="text-sm text-slate-500">Run a search to see distribution.</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={jobZoneDistribution} dataKey="value" nameKey="name" outerRadius={90}>
                                                    {jobZoneDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                <ONetAttribution />
            </div>
        </div>
    );
}
