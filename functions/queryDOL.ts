import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { endpoint, params, baseUrl, useApiKeyQuery } = await req.json();

        if (!endpoint) {
            return Response.json({ error: 'endpoint is required' }, { status: 400 });
        }

        const apiKey = Deno.env.get('DOL_API_KEY');
        const isFullUrl = /^https?:\/\//i.test(endpoint);
        const base = baseUrl || 'https://data.dol.gov';

        const url = new URL(isFullUrl ? endpoint : `${base.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`);

        if (params && typeof params === 'object') {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, String(value));
                }
            });
        }

        if (useApiKeyQuery && apiKey) {
            url.searchParams.set('KEY', apiKey);
        }

        const response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json',
                ...(apiKey && !useApiKeyQuery ? { 'X-API-KEY': apiKey } : {})
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return Response.json({
                error: 'DOL API request failed',
                status: response.status,
                details: data
            }, { status: response.status });
        }

        return Response.json(data);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
