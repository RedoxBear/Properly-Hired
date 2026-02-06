import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { endpoint, params } = await req.json();
        
        const username = Deno.env.get("ONET_API_USERNAME");
        const password = Deno.env.get("ONET_API_PASSWORD");
        
        if (!username || !password) {
            return Response.json({ error: 'O*NET API credentials not configured' }, { status: 500 });
        }

        const auth = btoa(`${username}:${password}`);
        const baseUrl = 'https://services.onetcenter.org/ws';
        
        // Build query string
        const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
        const url = `${baseUrl}${endpoint}${queryString}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return Response.json({ 
                error: 'O*NET API request failed',
                status: response.status 
            }, { status: response.status });
        }

        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});