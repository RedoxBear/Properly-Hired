import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Compass, ExternalLink, FileText, CheckCircle2, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ExtensionGuide() {
  const APP_BASE = typeof window !== "undefined" ? `${window.location.origin}` : "https://app.pragueday.com";
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium mb-3">
            <Compass className="w-4 h-4" />
            Properly Hired Browser Extension
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Track Jobs from Any Site</h1>
          <p className="text-slate-600 mt-2">Capture roles on LinkedIn, Indeed, Greenhouse, Lever, Workday, and deep-link straight into Job Analysis.</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-600" />
              Deep Link Format
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-700">Open Job Analysis with prefilled fields from the extension:</p>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-auto">{`${APP_BASE}${createPageUrl("JobAnalysis")}?url=<ENCODED_JOB_URL>&title=<TITLE>&company=<COMPANY>&autostart=1`}</pre>
            <div className="flex flex-wrap gap-2">
              <Link to={createPageUrl("JobAnalysis")}>
                <Button className="bg-blue-600 hover:bg-blue-700">Open Job Analysis</Button>
              </Link>
              <Link to={createPageUrl("ApplicationQnA")}>
                <Button variant="outline">Application Q&A</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-600" />
              Sample manifest.json (Chrome MV3 + Firefox)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-auto">{`{
  "manifest_version": 3,
  "name": "Properly Hired – Job Tracker",
  "version": "1.0.0",
  "description": "Track job applications across the web. Send to Properly Hired and schedule follow-ups.",
  "action": { "default_title": "Properly Hired", "default_popup": "popup.html" },
  "background": { "service_worker": "background.js", "type": "module" },
  "host_permissions": ["*://*.linkedin.com/*","*://*.indeed.com/*","*://*.workdayjobs.com/*","*://*.myworkdayjobs.com/*","*://*.greenhouse.io/*","*://*.lever.co/*"],
  "permissions": ["storage","contextMenus","scripting","activeTab"],
  "content_scripts": [{ "matches": ["*://*.linkedin.com/*","*://*.indeed.com/*","*://*.workdayjobs.com/*","*://*.myworkdayjobs.com/*","*://*.greenhouse.io/*","*://*.lever.co/*"], "js": ["content-script.js"], "run_at": "document_idle" }],
  "icons": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" },
  "browser_specific_settings": { "gecko": { "id": "pragueday@base44.app", "strict_min_version": "109.0" } }
}`}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Content Script: Inject “Track with Properly Hired”
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-auto">{`function trackNow() {
  const url = location.href;
  const title = document.querySelector('h1')?.innerText?.trim() || document.title;
  const company = document.querySelector('[data-company-name], .topcard__org-name-link, .jobs-unified-top-card__company-name')?.innerText?.trim() || "";
  chrome.runtime.sendMessage({ type: "PD_TRACK", payload: { title, company, url, capturedAt: new Date().toISOString() }});
}
// Inject a floating button
// On click -> send message; background opens ${APP_BASE}${createPageUrl("JobAnalysis")}?url=...&title=...&company=...&autostart=1`}</pre>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="text-sm text-slate-700">
                Notes: For posting via API (/api/applications) and follow-up scheduling from the extension, enable backend functions or API access in Settings. Until then, deep-linking works without login and stores a local log inside the extension.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}