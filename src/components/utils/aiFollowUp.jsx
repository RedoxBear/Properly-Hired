import { InvokeLLM } from "@/integrations/Core";
import { retryWithBackoff } from "./retry";

/**
 * AI-powered follow-up scheduler
 * Analyzes application context and recommends optimal follow-up timing
 */
export async function generateFollowUpSchedule(application, userPrefs = {}) {
    const prompt = `You are an expert career advisor specializing in job application follow-up strategies.

**Application Context:**
- Job Title: ${application.job_title}
- Company: ${application.company_name}
- Status: ${application.application_status}
- Applied Date: ${application.applied_at || "Not yet applied"}
- Industry: ${application.summary?.research_snapshot?.industry || "Unknown"}
- Company Size: ${application.summary?.research_snapshot?.size || "Unknown"}

**User Preferences:**
- Notification Frequency: ${userPrefs.notification_settings?.email_frequency || "daily"}
- Job Search Status: ${userPrefs.job_search_status || "actively_looking"}

**Your Task:**
Analyze this application and recommend an optimal follow-up schedule. Consider:
- Industry norms (tech moves fast, government/healthcare slower)
- Company size (startups respond faster, enterprise slower)
- Application status and typical hiring timelines
- User's job search urgency

Return JSON with:
{
  "follow_up_schedule": [
    {
      "days_after_application": number, // e.g., 3, 7, 14
      "action": string, // "email", "linkedin", "phone", "portal_check"
      "message_template": string, // Brief template for what to say
      "reasoning": string // Why this timing is optimal
    }
  ], // 2-4 follow-ups recommended
  "overall_strategy": string, // 2-3 sentences on approach
  "red_flags": string[], // Any concerns (e.g., "company may be ghosting")
  "green_flags": string[] // Positive signals (e.g., "they responded quickly")
}

**Guidelines:**
- Be realistic - don't over-follow-up or seem desperate
- First follow-up typically 3-5 days for most roles
- Adjust based on industry (tech: faster, academic: slower)
- Consider if they have clear "we'll contact you by X" messaging
- If already rejected, don't schedule any follow-ups`;

    try {
        const response = await retryWithBackoff(() =>
            InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        follow_up_schedule: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    days_after_application: { type: "number" },
                                    action: { type: "string" },
                                    message_template: { type: "string" },
                                    reasoning: { type: "string" }
                                }
                            }
                        },
                        overall_strategy: { type: "string" },
                        red_flags: { type: "array", items: { type: "string" } },
                        green_flags: { type: "array", items: { type: "string" } }
                    }
                }
            }),
            { retries: 2, baseDelay: 1000 }
        );

        return response;
    } catch (e) {
        console.error("Error generating follow-up schedule:", e);
        // Fallback to simple schedule
        return {
            follow_up_schedule: [
                {
                    days_after_application: 3,
                    action: "email",
                    message_template: "Follow up to express continued interest",
                    reasoning: "Standard first follow-up timing"
                }
            ],
            overall_strategy: "Follow up once after 3 days, then wait for response.",
            red_flags: [],
            green_flags: []
        };
    }
}

/**
 * Calculate follow-up dates from application date
 */
export function calculateFollowUpDates(appliedDate, schedule) {
    if (!appliedDate) return [];
    
    const applied = new Date(appliedDate);
    return schedule.map(item => {
        const date = new Date(applied);
        date.setDate(date.getDate() + item.days_after_application);
        return {
            date: date.toISOString(),
            ...item
        };
    });
}

/**
 * Get next pending follow-up
 */
export function getNextFollowUp(followUpDates) {
    const now = new Date();
    const pending = followUpDates
        .filter(f => new Date(f.date) > now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return pending[0] || null;
}