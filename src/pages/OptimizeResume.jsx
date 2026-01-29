
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { JobApplication } from "@/api/entities";
import { Resume } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ResumeLengthControls from "@/components/resume/ResumeLengthControls";
import ResumePreview from "@/components/resume/ResumePreview";
import { composeResume } from "@/components/utils/cvCompose";
import { tailorByJD } from "@/components/utils/tailorByJD";
import { scoreAlignment } from "@/components/utils/alignment";
import { createPageUrl } from "@/utils";

function getAppIdFromUrl() {
  const qp = new URLSearchParams(window.location.search);
  const qid = qp.get("id");
  const path = window.location.pathname || "";
  const m = path.match(/\/OptimizeResume\/([^/?#]+)/i);
  const pid = m && m[1] ? decodeURIComponent(m[1]) : null;
  return pid || qid || "";
}

function Meter({ label, v }) {
  return (
    <div className="rounded border p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 w-full bg-slate-200 h-2 rounded">
        <div className="h-2 bg-teal-600 rounded" style={{ width: `${Math.max(0, Math.min(100, v || 0))}%` }} />
      </div>
      <div className="text-xs mt-1">{Math.round(v || 0)}%</div>
    </div>
  );
}

function cvToPlain(cv) {
  if (!cv) return "";
  const blocks = [
    ...(cv.header || []),
    ...(cv.summary || []),
    ...(cv.skills || []),
    ...((cv.experience || []).flatMap(b => [b.heading, ...(b.lines || [])])),
    ...(cv.education || []),
    ...((cv.extra || []).flatMap(x => [x.heading, ...(x.lines || [])])),
  ];
  return blocks.join("\n");
}

export default function OptimizeResume() {
  const appId = getAppIdFromUrl();
  const [app, setApp] = useState(null);
  const [jdText, setJdText] = useState("");
  const [mode, setMode] = useState("ats_one_page"); // "ats_one_page" | "two_page" | "full_cv"
  const [parsedMaster, setParsedMaster] = useState(null); // structured ResumeData for composer

  useEffect(() => {
    (async () => {
      if (!appId) return;
      const a = await JobApplication.get(appId);
      setApp(a || null);
      setJdText((a?.jd_text || a?.job_description || "").trim());

      // Load latest Master Resume
      const masters = await Resume.filter({ is_master_resume: true }, "-created_date", 1);
      const master = masters && masters[0] ? masters[0] : null;

      // Build structured ResumeData from master JSON if possible
      let data = null;
      try {
        const src = master?.optimized_content || master?.parsed_content || "";
        const j = src ? JSON.parse(src) : null;

        if (j) {
          const pi = j.personal_info || {};
          const roles = Array.isArray(j.experience) ? j.experience.map((e) => {
            const duration = e?.duration || "";
            const parts = String(duration).replace("–", "-").split("-").map(s => (s || "").trim());
            const start = parts[0] || "";
            const end = parts[1] || "";
            return {
              title: e?.position || "",
              company: e?.company || "",
              location: e?.location || "",
              start,
              end,
              bullets: Array.isArray(e?.achievements) ? e.achievements : []
            };
          }) : [];
          data = {
            name: pi.name || (a?.user_name || "Candidate"),
            contact: [pi.email, pi.phone, pi.location, pi.linkedin, pi.portfolio].filter(Boolean).join(" | "),
            summary: j.summary || "",
            skills: Array.isArray(j.skills) ? j.skills : [],
            roles,
            education: Array.isArray(j.education) ? j.education.map(ed => ({
              degree: ed?.degree || "",
              school: ed?.institution || "",
              year: ed?.year || ""
            })) : [],
            extra: undefined
          };
        }
      } catch {
        // ignore parse errors and fallback below
      }

      // Fallback: build a minimal structure from master plain text first; otherwise from JD
      if (!data) {
        const masterPlainText = (master?.parsed_content || master?.optimized_content || "").trim();
        const sourceText = masterPlainText || jdText || "";
        const bullets = sourceText.split(/\n+/).map(s => s.trim()).filter(Boolean);
        data = {
          name: a?.user_name || "Candidate",
          contact: a?.user_contact || "",
          summary: "",
          skills: [],
          roles: [
            {
              title: a?.user_title || "Experience",
              company: "",
              location: "",
              start: "",
              end: "Present",
              bullets
            }
          ],
          education: [],
          extra: undefined
        };
      }

      setParsedMaster(data);
    })();
  }, [appId]);

  // Tailor by JD, then compose by mode
  const tailored = useMemo(
    () => (parsedMaster ? tailorByJD(parsedMaster, jdText || "") : null),
    [parsedMaster, jdText]
  );

  const composed = useMemo(
    () =>
      tailored
        ? composeResume(tailored, {
            mode,
            maxBulletsTop: 6,
            includeAllRoles: true
          })
        : null,
    [tailored, mode]
  );

  // Compute active optimized text and master full text for alignment
  const optimizedText = useMemo(() => cvToPlain(composed), [composed]);
  const masterFullPlain = useMemo(() => {
    if (!parsedMaster) return "";
    const full = composeResume(parsedMaster, { mode: "full_cv", maxBulletsTop: 12, includeAllRoles: true });
    return cvToPlain(full);
  }, [parsedMaster]);

  const alignment = useMemo(() => {
    if (!optimizedText) return null;
    return scoreAlignment(jdText || "", optimizedText || "", masterFullPlain || "");
  }, [jdText, optimizedText, masterFullPlain]);

  if (!app || !parsedMaster) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4">
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{app.job_title} @ {app.company_name} — Resume Optimizer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResumeLengthControls mode={mode} onChange={setMode} />

          {alignment && (
            <div className="grid sm:grid-cols-5 gap-3 text-sm">
              <Meter label="JD Overlap" v={alignment.jdOverlap} />
              <Meter label="Master Retention" v={alignment.masterRetention} />
              <Meter label="Clarity" v={alignment.clarity} />
              <Meter label="Redundancy" v={alignment.redundancy} />
              <Meter label="Overall" v={alignment.overall} />
            </div>
          )}

          {composed && <ResumePreview cv={composed} />}

          {composed && (
            <div className="text-xs text-slate-500">
              Mode: <b>{mode}</b> · Roles: <b>{composed.experience?.length ?? 0}</b> · First role bullets: <b>{composed.experience?.[0]?.lines?.length ?? 0}</b>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button disabled title="Disabled temporarily while persistence is updated">
              Save to My Resume (coming soon)
            </Button>
            <Link to={createPageUrl(`JobSummary?id=${app.id}`)}>
              <Button variant="outline">Back to Summary</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
