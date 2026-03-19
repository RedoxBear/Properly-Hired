import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * GitHub integration — search repos, read files, analyze tech stacks.
 * Actions:
 *   search_repos    — search GitHub repositories
 *   get_repo        — get repo details (languages, topics, description)
 *   get_readme      — get a repo's README content
 *   get_file        — get a specific file's content
 *   search_code     — search code across GitHub
 *   get_user        — get a GitHub user/org profile
 */

const GH_API = "https://api.github.com";

function getHeaders() {
  const token = Deno.env.get("GITHUB_PAT");
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = Deno.env.get("GITHUB_PAT");
    if (!token) {
      return Response.json({ error: "GITHUB_PAT not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { action = "search_repos" } = body;
    const headers = getHeaders();

    if (action === "search_repos") {
      const { query, sort, order, per_page } = body;
      if (!query) {
        return Response.json({ error: "query is required" }, { status: 400 });
      }

      const params = new URLSearchParams({
        q: query,
        sort: sort || "stars",
        order: order || "desc",
        per_page: String(per_page || 10),
      });

      const resp = await fetch(`${GH_API}/search/repositories?${params}`, { headers });
      if (!resp.ok) {
        const err = await resp.text();
        return Response.json({ error: `GitHub search error: ${resp.status}`, details: err }, { status: resp.status });
      }

      const result = await resp.json();
      const repos = (result.items || []).map((r) => ({
        full_name: r.full_name,
        description: r.description,
        url: r.html_url,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        topics: r.topics || [],
        updated_at: r.updated_at,
        license: r.license?.spdx_id || null,
      }));

      return Response.json({ success: true, repos, total_count: result.total_count });
    }

    if (action === "get_repo") {
      const { owner, repo } = body;
      if (!owner || !repo) {
        return Response.json({ error: "owner and repo are required" }, { status: 400 });
      }

      const [repoResp, langResp] = await Promise.all([
        fetch(`${GH_API}/repos/${owner}/${repo}`, { headers }),
        fetch(`${GH_API}/repos/${owner}/${repo}/languages`, { headers }),
      ]);

      if (!repoResp.ok) {
        const err = await repoResp.text();
        return Response.json({ error: `Repo error: ${repoResp.status}`, details: err }, { status: repoResp.status });
      }

      const repoData = await repoResp.json();
      const languages = langResp.ok ? await langResp.json() : {};

      return Response.json({
        success: true,
        repo: {
          full_name: repoData.full_name,
          description: repoData.description,
          url: repoData.html_url,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          open_issues: repoData.open_issues_count,
          primary_language: repoData.language,
          languages,
          topics: repoData.topics || [],
          license: repoData.license?.spdx_id || null,
          created_at: repoData.created_at,
          updated_at: repoData.updated_at,
          default_branch: repoData.default_branch,
          size_kb: repoData.size,
        },
      });
    }

    if (action === "get_readme") {
      const { owner, repo } = body;
      if (!owner || !repo) {
        return Response.json({ error: "owner and repo are required" }, { status: 400 });
      }

      const resp = await fetch(`${GH_API}/repos/${owner}/${repo}/readme`, {
        headers: { ...headers, "Accept": "application/vnd.github.raw+json" },
      });

      if (!resp.ok) {
        if (resp.status === 404) {
          return Response.json({ success: true, readme: null, message: "No README found" });
        }
        const err = await resp.text();
        return Response.json({ error: `README error: ${resp.status}`, details: err }, { status: resp.status });
      }

      const content = await resp.text();
      return Response.json({
        success: true,
        readme: content.substring(0, 50000), // Cap at 50KB
      });
    }

    if (action === "get_file") {
      const { owner, repo, path, ref } = body;
      if (!owner || !repo || !path) {
        return Response.json({ error: "owner, repo, and path are required" }, { status: 400 });
      }

      const url = ref
        ? `${GH_API}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
        : `${GH_API}/repos/${owner}/${repo}/contents/${path}`;

      const resp = await fetch(url, {
        headers: { ...headers, "Accept": "application/vnd.github.raw+json" },
      });

      if (!resp.ok) {
        const err = await resp.text();
        return Response.json({ error: `File error: ${resp.status}`, details: err }, { status: resp.status });
      }

      const content = await resp.text();
      return Response.json({
        success: true,
        content: content.substring(0, 50000),
        path,
      });
    }

    if (action === "search_code") {
      const { query, per_page } = body;
      if (!query) {
        return Response.json({ error: "query is required" }, { status: 400 });
      }

      const params = new URLSearchParams({
        q: query,
        per_page: String(per_page || 10),
      });

      const resp = await fetch(`${GH_API}/search/code?${params}`, { headers });
      if (!resp.ok) {
        const err = await resp.text();
        return Response.json({ error: `Code search error: ${resp.status}`, details: err }, { status: resp.status });
      }

      const result = await resp.json();
      const items = (result.items || []).map((item) => ({
        name: item.name,
        path: item.path,
        repo: item.repository?.full_name,
        url: item.html_url,
      }));

      return Response.json({ success: true, items, total_count: result.total_count });
    }

    if (action === "get_user") {
      const { username } = body;
      if (!username) {
        return Response.json({ error: "username is required" }, { status: 400 });
      }

      const resp = await fetch(`${GH_API}/users/${username}`, { headers });
      if (!resp.ok) {
        const err = await resp.text();
        return Response.json({ error: `User error: ${resp.status}`, details: err }, { status: resp.status });
      }

      const u = await resp.json();
      return Response.json({
        success: true,
        user: {
          login: u.login,
          name: u.name,
          bio: u.bio,
          company: u.company,
          location: u.location,
          blog: u.blog,
          public_repos: u.public_repos,
          followers: u.followers,
          following: u.following,
          url: u.html_url,
          type: u.type,
          created_at: u.created_at,
        },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("githubQuery error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});