import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchQuery, endpoint = "search", maxResults = 20, strictFilter = false } = await req.json();

        if (!searchQuery) {
            return Response.json({ error: 'searchQuery is required' }, { status: 400 });
        }

        const hrKeywords = [
            "human resource", "organizational planning", "talent management",
            "workforce development", "employee engagement", "organizational behavior",
            "leadership development", "performance management", "recruiting",
            "talent acquisition", "organizational culture", "hr strategy",
            "personnel management", "workplace", "career development"
        ];

        const apiKey = Deno.env.get("LOC_API_KEY");
        const locUrl = new URL(`https://www.loc.gov/${endpoint}/`);
        locUrl.searchParams.set("q", searchQuery);
        locUrl.searchParams.set("fo", "json");
        locUrl.searchParams.set("c", String(maxResults));
        if (apiKey) {
            locUrl.searchParams.set("api_key", apiKey);
        }

        console.log("Querying LoC:", locUrl.toString());

        const response = await fetch(locUrl.toString());

        if (!response.ok) {
            throw new Error(`Library of Congress API error: ${response.statusText}`);
        }

        const data = await response.json();

        let processedResults = (data.results || []).map(item => ({
            title: item.title || "Untitled",
            description: item.description || [],
            subjects: item.subject || [],
            url: item.id || item.url,
            date: item.date,
            format: item.original_format || item.format,
            contributors: item.contributor || [],
            summary: item.summary || []
        }));

        let filteredResults = processedResults;
        if (strictFilter) {
            filteredResults = processedResults.filter(item => {
                const title = (item.title || "").toLowerCase();
                const description = (item.description || []).join(" ").toLowerCase();
                const subjects = (item.subjects || []).join(" ").toLowerCase();
                const summary = (item.summary || []).join(" ").toLowerCase();
                const fullText = `${title} ${description} ${subjects} ${summary}`;

                return hrKeywords.some(keyword => fullText.includes(keyword.toLowerCase()));
            });
        }

        return Response.json({
            success: true,
            total_found: data.results?.length || 0,
            returned: filteredResults.length,
            strict_filter_applied: strictFilter,
            results: filteredResults,
            query_used: searchQuery,
            loc_url: locUrl.toString()
        });

    } catch (error) {
        console.error("Error querying Library of Congress:", error);
        return Response.json({
            error: error.message || "Failed to query Library of Congress"
        }, { status: 500 });
    }
});