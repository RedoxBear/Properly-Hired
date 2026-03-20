import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { endpoint, params } = await req.json();

        if (!endpoint) {
            return Response.json({ error: 'endpoint is required' }, { status: 400 });
        }

        const apiKey = Deno.env.get("ONET_API_KEY");

        if (!apiKey) {
            return Response.json({ error: 'O*NET API key not configured' }, { status: 500 });
        }

        // Validate endpoint against allowed O*NET API paths to prevent SSRF
        const cleanEndpoint = endpoint.replace(/^\//, '');
        const allowedPatterns = [
            /^online\/search$/,
            /^online\/occupations\/[\w.-]+$/,
            /^online\/occupations\/[\w.-]+\/summary\/(skills|abilities|knowledge|tasks|interests|work_activities|work_context|technology_skills)$/,
            /^online\/occupations\/[\w.-]+\/related\/occupations$/,
            /^ws\/online\/search$/,
            /^ws\/mnm\/search$/,
        ];

        if (!allowedPatterns.some(pattern => pattern.test(cleanEndpoint))) {
            return Response.json({ error: 'Invalid O*NET API endpoint' }, { status: 400 });
        }

        // ── Try local ONetProfile first for occupation detail queries ──
        if (/^online\/occupations\/[\w.-]+$/.test(cleanEndpoint)) {
            const socCode = cleanEndpoint.match(/[\d]{2}-[\d]{4}\.[\d]{2}/)?.[0];
            if (socCode) {
                try {
                    const results = await base44.asServiceRole.entities.ONetProfile.filter(
                        { onet_soc_code: socCode }, '-created_date', 1
                    );
                    if (results && results.length > 0) {
                        const p = results[0];
                        return Response.json({
                            code: p.onet_soc_code,
                            title: p.title,
                            description: p.description,
                            job_zone: p.job_zone,
                            education_level: p.education_level,
                            skills: p.skills,
                            knowledge: p.knowledge,
                            abilities: p.abilities,
                            work_activities: p.work_activities,
                            work_values: p.work_values,
                            work_styles: p.work_styles,
                            riasec_profile: p.riasec_profile,
                            tasks: p.tasks,
                            emerging_tasks: p.emerging_tasks,
                            tech: p.tech,
                            related_socs: p.related_socs,
                            alternate_titles: p.alternate_titles,
                            source: "local",
                        });
                    }
                } catch (_) { /* fall through to live API */ }
            }
        }

        // ── Fall through: live O*NET API ──
        const baseUrl = 'https://api-v2.onetcenter.org';
        const url = new URL(`${baseUrl}/${cleanEndpoint}`);

        // Append query params
        if (params && typeof params === 'object') {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, String(value));
                }
            });
        }

        const response = await fetch(url.toString(), {
            headers: {
                'X-API-Key': apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            return Response.json({
                error: 'O*NET API request failed',
                status: response.status,
                details: errorBody
            }, { status: response.status });
        }

        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});