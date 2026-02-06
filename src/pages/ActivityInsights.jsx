import React from "react";
import { readEvents } from "@/components/utils/telemetry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart as BarChartIcon, Activity as ActivityIcon, PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const daysBack = (n) => {
  const arr = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    arr.push(d);
  }
  return arr;
};
const keyDay = (d) => d.toISOString().slice(0, 10);

function Kpi({ title, value, icon: Icon, color = "text-blue-600", bg = "bg-blue-50" }) {
  return (
    <Card className="border-0 shadow-sm bg-white/90">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">{title}</div>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
          </div>
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartRow({ title, data, color = "#3b82f6" }) {
  return (
    <Card className="bg-white/90 border-0 shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChartIcon className="w-4 h-4 text-slate-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Infer/normalize ATS vendor from host and vendor fields
const detectAtsVendor = (host = "", vendor = "") => {
  const h = String(host || "").toLowerCase();
  const v = String(vendor || "").toLowerCase();

  // trust normalized vendor if present
  if (["lever", "greenhouse", "workday", "ashby", "taleo", "icims", "smartrecruiters", "bamboohr", "successfactors"].includes(v)) {
    return v;
  }

  if (/lever\.co/.test(h)) return "lever";
  if (/greenhouse\.io/.test(h)) return "greenhouse";
  if (/myworkdayjobs\.com/.test(h) || /workdayjobs\.com/.test(h) || /(^|\.)wd\d+\./.test(h) || /\bworkday\b/.test(h)) return "workday";
  if (/ashbyhq\.com/.test(h) || /jobs\.ashbyhq\.com/.test(h)) return "ashby";
  if (/taleo\.net/.test(h) || /oraclecloud\.com/.test(h)) return "taleo";
  if (/icims\.com/.test(h)) return "icims";
  if (/smartrecruiters\.com/.test(h)) return "smartrecruiters";
  if (/bamboohr\.com/.test(h)) return "bamboohr";
  if (/successfactors\.com/.test(h) || /\bsap\.com\b/.test(h)) return "successfactors";
  return v || "other";
};

export default function ActivityInsights() {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const evs = await readEvents();
        setEvents(Array.isArray(evs) ? evs : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byType = React.useMemo(() => {
    const m = new Map();
    for (const e of events) {
      const a = m.get(e.type) || [];
      a.push(e);
      m.set(e.type, a);
    }
    return m;
  }, [events]);

  const series = (type) => {
    const days = daysBack(30);
    const idx = new Map(days.map((d) => [keyDay(d), 0]));
    (byType.get(type) || []).forEach((e) => {
      const d = new Date(e.ts);
      d.setHours(0, 0, 0, 0);
      const k = keyDay(d);
      if (idx.has(k)) idx.set(k, (idx.get(k) || 0) + 1);
    });
    return days.map((d) => ({ date: keyDay(d), count: idx.get(keyDay(d)) || 0 }));
  };

  const kpiCount = (type, n = 30) => {
    const allowed = new Set(daysBack(n).map(keyDay));
    return (byType.get(type) || []).filter((e) => allowed.has(keyDay(new Date(e.ts)))).length;
  };

  const kpis = {
    job_searched: kpiCount("job_searched"),
    job_applied_click: kpiCount("job_applied_click"),
    resume_rendered: kpiCount("resume_rendered"),
    cover_letter_generated: kpiCount("cover_letter_generated"),
    application_qna_used: kpiCount("application_qna_used"),
    ats_detected: kpiCount("ats_detected"),
  };

  const atsVendors = React.useMemo(() => {
    const rows = (byType.get("ats_detected") || []).reduce((acc, e) => {
      const vendor = detectAtsVendor(e.host, e.vendor);
      acc[vendor] = (acc[vendor] || 0) + 1;
      return acc;
    }, {});
    // sort by count desc
    return Object.entries(rows)
      .map(([vendor, count]) => ({ vendor, count }))
      .sort((a, b) => b.count - a.count);
  }, [byType]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm bg-white/90">
                <CardContent className="p-4">
                  <div className="h-5 bg-slate-200 rounded w-24 mb-2" />
                  <div className="h-7 bg-slate-200 rounded w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="bg-white/90 border-0 shadow">
            <CardHeader><CardTitle>Loading insights…</CardTitle></CardHeader>
            <CardContent><div className="h-48 bg-slate-100 rounded" /></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const noData = !events || events.length === 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Activity Insights</h1>
          <Badge variant="outline" className="bg-slate-50">Last 30 days</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Kpi title="Job Searched" value={kpis.job_searched} icon={ActivityIcon} color="text-cyan-700" bg="bg-cyan-50" />
          <Kpi title="Applied Clicks" value={kpis.job_applied_click} icon={ActivityIcon} color="text-emerald-700" bg="bg-emerald-50" />
          <Kpi title="Resume Rendered" value={kpis.resume_rendered} icon={BarChartIcon} color="text-indigo-700" bg="bg-indigo-50" />
          <Kpi title="Cover Letters" value={kpis.cover_letter_generated} icon={ActivityIcon} color="text-amber-700" bg="bg-amber-50" />
          <Kpi title="Q&A Sessions" value={kpis.application_qna_used} icon={ActivityIcon} color="text-rose-700" bg="bg-rose-50" />
          <Kpi title="ATS Detected" value={kpis.ats_detected} icon={PieChartIcon} color="text-teal-700" bg="bg-teal-50" />
        </div>

        {noData ? (
          <Card className="bg-white/90 border-0 shadow">
            <CardHeader>
              <CardTitle>No activity yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Start by analyzing a job posting on the Job Analysis page to see insights here.
                Events are captured automatically and stored locally if the server isn’t available.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <ChartRow title="Job Searches (30 days)" data={series("job_searched")} color="#38bdf8" />
            <ChartRow title="Resume Rendered (30 days)" data={series("resume_rendered")} color="#6366f1" />
            <ChartRow title="Applied Clicks (30 days)" data={series("job_applied_click")} color="#10b981" />

            <Card className="bg-white/90 border-0 shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-slate-500" />
                  ATS Systems Detected
                </CardTitle>
              </CardHeader>
              <CardContent style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={atsVendors}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="vendor" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {atsVendors.length === 0 && (
                  <div className="text-sm text-slate-500 mt-3">
                    No ATS detections yet. Use Fetch on a job URL in Job Analysis to populate this chart.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}