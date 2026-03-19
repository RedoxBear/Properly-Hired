import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ADZUNA_APP_ID = Deno.env.get("ADZUNA_APP_ID");
const ADZUNA_APP_KEY = Deno.env.get("ADZUNA_APP_KEY");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { query, location, country, page, results_per_page, salary_min, full_time, sort_by } = await req.json();

  const cc = country || "us"; // country code: us, gb, ca, au, etc.
  const pg = page || 1;
  const rpp = results_per_page || 20;

  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: String(rpp),
    "content-type": "application/json",
  });
  if (query) params.set("what", query);
  if (location) params.set("where", location);
  if (salary_min) params.set("salary_min", String(salary_min));
  if (full_time) params.set("full_time", "1");
  if (sort_by) params.set("sort_by", sort_by); // date, salary, relevance

  const url = `https://api.adzuna.com/v1/api/jobs/${cc}/search/${pg}?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: `Adzuna API error: ${res.status}`, detail: text }, { status: 502 });
  }

  const data = await res.json();

  const jobs = (data.results || []).map((j) => ({
    source: "adzuna",
    external_id: j.id ? String(j.id) : "",
    title: j.title || "",
    company: j.company?.display_name || "",
    location: j.location?.display_name || "",
    remote: (j.title || "").toLowerCase().includes("remote") || (j.description || "").toLowerCase().includes("remote"),
    url: j.redirect_url || "",
    jd_text: j.description || "",
    salary_min: j.salary_min || null,
    salary_max: j.salary_max || null,
    posted_at: j.created || null,
  }));

  return Response.json({ jobs, total: data.count || jobs.length });
});