import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { differenceInDays, isSameMonth, subMonths, parseISO } from "date-fns";

const EncouragementQuote = base44.entities.EncouragementQuote;

const FALLBACK_QUOTES = [
  { text: "Believe you can and you’re halfway there.", author: "Theodore Roosevelt" },
  { text: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
  { text: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
];

function dayIndex(len) {
  const d = new Date();
  const dayOfYear = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
  return len > 0 ? dayOfYear % len : 0;
}

export default function DailyEncouragement() {
  const [quote, setQuote] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        let list = await EncouragementQuote.list("-created_date", 200);
        const now = new Date();
        
        // 1. Cleanup: Remove quotes older than 6 months (no need to keep repository)
        const sixMonthsAgo = subMonths(now, 6);
        const oldQuotes = list.filter(q => new Date(q.created_date) < sixMonthsAgo);
        
        if (oldQuotes.length > 0) {
            // Delete old quotes in background to not block UI
            Promise.all(oldQuotes.map(q => EncouragementQuote.delete(q.id))).catch(console.error);
            list = list.filter(q => new Date(q.created_date) >= sixMonthsAgo);
        }

        // 2. Monthly Fetch Cycle
        const latest = list[0];
        const hasQuotesForThisMonth = latest && isSameMonth(new Date(latest.created_date), now);
        
        // Fetch if we don't have quotes for this month OR we have very few active quotes
        const shouldFetch = !hasQuotesForThisMonth || list.length < 10;

        if (shouldFetch) {
           try {
             // We want a fresh batch for the month
             const existingTexts = new Set(list.map(q => q.text));
             const prompt = `It is currently ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}.
             Find 20 distinct, fresh, and non-repetitive encouragement quotes for job seekers and career builders.
             
             Guidelines:
             - Focus on resilience, growth, and modern career challenges.
             - diverse mix of authors (tech leaders, stoics, modern thinkers).
             - Avoid generic clichés.
             - Ensure they are NOT in this list: ${Array.from(existingTexts).slice(0, 20).join(" | ")}.
             
             Return a JSON object with a "quotes" array.`;

             const response = await base44.integrations.Core.InvokeLLM({
                prompt,
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
                          source_url: { type: "string" }
                        }
                      }
                    }
                  }
                }
             });

             if (response?.quotes && Array.isArray(response.quotes)) {
                // Filter duplicates
                const newQuotes = response.quotes.filter(q => !existingTexts.has(q.text));
                
                if (newQuotes.length > 0) {
                   await Promise.all(newQuotes.map(q => EncouragementQuote.create({
                     ...q,
                     approved: true,
                     tags: [`monthly_batch_${now.getMonth()}_${now.getFullYear()}`]
                   })));
                   
                   // Refresh list after update
                   list = await EncouragementQuote.list("-created_date", 200);
                }
             }
           } catch (err) {
             console.error("Failed to fetch monthly quotes:", err);
           }
        }

        const approved = Array.isArray(list) ? list.filter(q => q.approved !== false) : [];
        const pick = approved.length ? approved[dayIndex(approved.length)] : FALLBACK_QUOTES[dayIndex(FALLBACK_QUOTES.length)];
        setQuote(pick);
      } catch (e) {
        console.error("Error loading quotes:", e);
        const pick = FALLBACK_QUOTES[dayIndex(FALLBACK_QUOTES.length)];
        setQuote(pick);
      }
    })();
  }, []);

  if (!quote) return null;

  return (
    <Card className="bg-white/90 border-0 shadow">
      <CardContent className="py-5 px-6 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-slate-800 text-base md:text-lg leading-relaxed">
            “{quote.text}”
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-slate-600">
              {quote.author || "Unknown"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}