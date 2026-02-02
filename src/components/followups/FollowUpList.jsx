import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { nextFollowUp } from "@/components/utils/followups";

const JobApplication = base44.entities.JobApplication;

export default function FollowUpList({ apps = [], onUpdated }) {
  const now = new Date();
  const due = apps.filter(a => a.next_follow_up_at && new Date(a.next_follow_up_at) <= now);

  if (!due.length) return null;

  const handleLog = async (app) => {
    const rec = await JobApplication.get(app.id);
    const history = Array.isArray(rec.follow_up_history) ? rec.follow_up_history.slice() : [];
    history.push({ ts: new Date().toISOString(), channel: "email", note: "Logged follow-up" });
    const next = nextFollowUp(rec.scheduled_follow_ups || [], history);
    await JobApplication.update(app.id, { follow_up_history: history, next_follow_up_at: next });
    onUpdated?.(app.id);
  };

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20">
      <CardHeader>
        <CardTitle className="text-amber-900 dark:text-amber-200">Follow-ups due</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {due.map(a => (
          <div key={a.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium truncate text-foreground">{a.job_title} @ {a.company_name}</div>
              <div className="text-xs text-amber-800 dark:text-amber-300">
                Scheduled: {new Date(a.next_follow_up_at).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleLog(a)}>Log Follow-up</Button>
              {a.job_posting_url && (
                <a href={a.job_posting_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">Open Job</Button>
                </a>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}