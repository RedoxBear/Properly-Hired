import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const JSEARCH_API_KEY = Deno.env.get("JSEARCH_API_KEY");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { query, location, remote_only, page, num_pages, date_posted } = await req.json();

  const params = new URLSearchParams({
    query: query || "software engineer",
    page: String(page || 1),
    num_pages: String(num_pages || 1),
  });
  if (location) params.set("query", `${query} in ${location}`);
  if (remote_only) params.set("remote_jobs_only", "true");
  if (date_posted) params.set("date_posted", date_posted); // all, today, 3days, week, month

  const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params.toString()}`, {
    headers: {
      "X-RapidAPI-Key": JSEARCH_API_KEY,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: `JSearch API error: ${res.status}`, detail: text }, { status: 502 });
  }

  const data = await res.json();

  // Normalize to our JobListing shape
  const jobs = (data.data || []).map((j) => ({
    source: "jsearch",
    external_id: j.job_id || "",
    title: j.job_title || "",
    company: j.employer_name || "",
    location: j.job_city ? `${j.job_city}, ${j.job_state || ""}`.trim() : j.job_country || "",
    remote: j.job_is_remote || false,
    url: j.job_apply_link || j.job_google_link || "",
    jd_text: j.job_description || "",
    salary_min: j.job_min_salary || null,
    salary_max: j.job_max_salary || null,
    posted_at: j.job_posted_at_datetime_utc || null,
  }));

  return Response.json({ jobs, total: data.total || jobs.length });
});