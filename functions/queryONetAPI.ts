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