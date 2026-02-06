import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { seriesIds, startYear, endYear, options } = await req.json();

        if (!seriesIds || (Array.isArray(seriesIds) && seriesIds.length === 0)) {
            return Response.json({ error: 'seriesIds is required' }, { status: 400 });
        }

        const seriesid = Array.isArray(seriesIds) ? seriesIds : [seriesIds];
        const payload: Record<string, unknown> = { seriesid };

        if (startYear) payload.startyear = String(startYear);
        if (endYear) payload.endyear = String(endYear);

        if (options && typeof options === 'object') {
            Object.assign(payload, options);
        }

        const apiKey = Deno.env.get('BLS_API_KEY');
        if (apiKey) {
            payload.registrationkey = apiKey;
        }

        const response = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return Response.json({
                error: 'BLS API request failed',
                status: response.status,
                details: data
            }, { status: response.status });
        }

        return Response.json(data);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
