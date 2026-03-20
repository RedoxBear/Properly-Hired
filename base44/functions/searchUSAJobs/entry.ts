import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const USAJOBS_API_KEY = Deno.env.get("USAJOBS_API_KEY");
const USAJOBS_EMAIL = Deno.env.get("USAJOBS_EMAIL");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { keyword, location, job_category_code, page, results_per_page, remote, salary_min } = await req.json();

  const params = new URLSearchParams({
    ResultsPerPage: String(results_per_page || 25),
    Page: String(page || 1),
  });
  if (keyword) params.set("Keyword", keyword);
  if (location) params.set("LocationName", location);
  if (job_category_code) params.set("JobCategoryCode", job_category_code);
  if (remote) params.set("RemoteIndicator", "True");
  if (salary_min) params.set("RemunerationMinimumAmount", String(salary_min));

  const url = `https://data.usajobs.gov/api/search?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      "Host": "data.usajobs.gov",
      "User-Agent": USAJOBS_EMAIL,
      "Authorization-Key": USAJOBS_API_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: `USAJOBS API error: ${res.status}`, detail: text }, { status: 502 });
  }

  const data = await res.json();
  const results = data.SearchResult?.SearchResultItems || [];

  const jobs = results.map((item) => {
    const m = item.MatchedObjectDescriptor || {};
    const pos = m.PositionLocation?.[0] || {};
    const salary = m.PositionRemuneration?.[0] || {};

    return {
      source: "usajobs",
      external_id: m.PositionID || "",
      title: m.PositionTitle || "",
      company: m.OrganizationName || m.DepartmentName || "U.S. Government",
      location: pos.LocationName || "",
      remote: pos.LocationName?.toLowerCase().includes("remote") || false,
      url: m.PositionURI || m.ApplyURI?.[0] || "",
      jd_text: m.UserArea?.Details?.MajorDuties?.join("\n") || m.QualificationSummary || "",
      salary_min: parseFloat(salary.MinimumRange) || null,
      salary_max: parseFloat(salary.MaximumRange) || null,
      posted_at: m.PublicationStartDate || null,
    };
  });

  return Response.json({ jobs, total: data.SearchResult?.SearchResultCount || jobs.length });
});