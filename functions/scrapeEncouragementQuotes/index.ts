import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const quotesData = await base44.integrations.Core.InvokeLLM({
            prompt: `Find 10 fresh, inspiring career and job search motivational quotes from the internet. 
            Focus on quotes about perseverance, career growth, resilience, job hunting, and professional development.
            Include the author name and source URL (Goodreads, BrainyQuote, etc.) if available.
            Return diverse quotes - some famous, some lesser-known but powerful.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    quotes: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                text: { type: "string" },
                                author: { type: "string" },
                                source_url: { type: "string" },
                                tags: {
                                    type: "array",
                                    items: { type: "string" }
                                }
                            },
                            required: ["text", "author"]
                        }
                    }
                },
                required: ["quotes"]
            }
        });

        const existingQuotes = await base44.asServiceRole.entities.EncouragementQuote.list();
        const existingTexts = new Set(existingQuotes.map(q => q.text.toLowerCase().trim()));

        const newQuotes = quotesData.quotes
            .filter(q => !existingTexts.has(q.text.toLowerCase().trim()))
            .map(q => ({
                text: q.text,
                author: q.author || "Unknown",
                source_url: q.source_url || null,
                tags: q.tags || ["inspirational", "motivation"],
                approved: true
            }));

        if (newQuotes.length > 0) {
            await base44.asServiceRole.entities.EncouragementQuote.bulkCreate(newQuotes);
        }

        return Response.json({
            success: true,
            found: quotesData.quotes.length,
            new_added: newQuotes.length,
            duplicates_skipped: quotesData.quotes.length - newQuotes.length
        });

    } catch (error) {
        console.error("Error scraping quotes:", error);
        return Response.json({
            error: error.message || "Failed to scrape quotes"
        }, { status: 500 });
    }
});