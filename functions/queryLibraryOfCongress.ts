import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchQuery, endpoint = "search", maxResults = 10 } = await req.json();

        if (!searchQuery) {
            return Response.json({ error: 'searchQuery is required' }, { status: 400 });
        }

        // HR-related keywords to filter results
        const hrKeywords = [
            "human resource", "organizational planning", "talent management",
            "workforce development", "employee engagement", "organizational behavior",
            "leadership development", "performance management", "recruiting",
            "talent acquisition", "organizational culture", "hr strategy",
            "personnel management", "workplace", "career development"
        ];

        // Build search query with HR context
        const hrFocusedQuery = `${searchQuery} (${hrKeywords.slice(0, 5).join(" OR ")})`;

        // Query Library of Congress API
        const locUrl = `https://www.loc.gov/${endpoint}/?q=${encodeURIComponent(hrFocusedQuery)}&fo=json&c=${maxResults}`;
        
        const response = await fetch(locUrl);
        
        if (!response.ok) {
            throw new Error(`Library of Congress API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Filter results to ensure HR relevance
        const filteredResults = (data.results || []).filter(item => {
            const title = (item.title || "").toLowerCase();
            const description = (item.description || []).join(" ").toLowerCase();
            const subjects = (item.subject || []).join(" ").toLowerCase();
            const fullText = `${title} ${description} ${subjects}`;

            return hrKeywords.some(keyword => fullText.includes(keyword.toLowerCase()));
        });

        return Response.json({
            success: true,
            total_found: data.results?.length || 0,
            hr_relevant: filteredResults.length,
            results: filteredResults.map(item => ({
                title: item.title || "Untitled",
                description: item.description || [],
                subjects: item.subject || [],
                url: item.id || item.url,
                date: item.date,
                format: item.original_format || item.format,
                contributors: item.contributor || []
            })),
            query_used: hrFocusedQuery
        });

    } catch (error) {
        console.error("Error querying Library of Congress:", error);
        return Response.json({ 
            error: error.message || "Failed to query Library of Congress" 
        }, { status: 500 });
    }
});