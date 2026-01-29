# Simon 2.0: The "Hiring Committee" Architect
**Role:** Employer-Side Intelligence (Recruiter Persona)
**Goal:** Reverse-engineer the hiring process to give the user an "Insider Advantage."

## Core Philosophy
Simon 1.0 was a text analyzer. Simon 2.0 is a **Simulator**.
Instead of just reading the JD, Simon 2.0 simulates the *Hiring Committee meeting* that wrote it.

## New Module: `HiringIntentDecoder`
*   **The Problem:** JDs are often copy-pasted generic text.
*   **The Solution:** Simon will deconstruct the JD into three hidden layers:
    1.  **The "Hair on Fire" Pain:** Why are they hiring *now*? (e.g., "They just raised Series B and need to scale," vs "They are backfilling a fired employee.")
    2.  **The Political Landscape:** Is this role an "Individual Contributor" or a "Change Agent"? (inferred from words like "drive," "spearhead" vs "support," "assist").
    3.  **The Gatekeeper's Checklist:** The secret list of 3 keywords the recruiter searches for (Ctrl+F) before reading a single word.

## New Module: `SalaryRangeEstimator` (Local Logic)
*   **Logic:** Since we can't call external APIs, Simon 2.0 will use a **Heuristic Logic Tree** based on:
    *   **Title/Level:** (Senior vs Staff vs Principal)
    *   **Location:** (Tier 1 City vs Remote vs Tier 2)
    *   **Tech Stack:** (High demand "Rust/AI" vs Legacy "Java/Spring")
    *   **Company Tier:** (FAANG vs Startup vs Enterprise - inferred from description style)
*   **Output:** A calculated confidence interval (e.g., "$140k - $160k with 80% confidence").

## New Module: `AIDetector_Pro`
*   **Logic:** Enhanced pattern matching for "ChatGPT-isms" in JDs.
*   **Action:** If Simon detects a lazy, AI-written JD, he tells Kyle: *"This employer doesn't know what they want. You can define the role for them."* (This is a huge strategic advantage).

## Data Structure (Output to App)
```json
{
  "hiring_intent": "Growth-Phase Scalability",
  "hidden_signals": {
    "urgency": "High",
    "political_capital": "Medium",
    "stability": "Low (Startup chaos detected)"
  },
  "gatekeeper_keywords": ["Kubernetes", "0-to-1", "System Design"],
  "estimated_comp": {
    "base": "$150k",
    "equity": "High",
    "reasoning": "SF-based Series B terminology"
  },
  "kyle_brief": "Focus on speed and autonomy. Ignore the '5 years experience' requirement; they need someone who can build without supervision."
}
```
