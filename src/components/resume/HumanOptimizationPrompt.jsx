/**
 * Human Optimization Prompt - Premium Feature
 * 
 * Anti-AI-detection rules, voice/tone guidelines, and humanization constraints
 * to make resume content sound authentically human-written.
 */

// Re-export from the single source of truth (humanVoiceRules)
import {
  BANNED_VERBS as _BANNED_VERBS,
  BANNED_MODIFIERS,
  BANNED_PHRASES,
  BANNED_FILLER,
  PREFERRED_VERBS as _PREFERRED_VERBS,
  scanText
} from "@/components/utils/humanVoiceRules";

export { _BANNED_VERBS as BANNED_VERBS, BANNED_MODIFIERS, BANNED_PHRASES, BANNED_FILLER, _PREFERRED_VERBS as PREFERRED_VERBS, scanText };

export const HUMAN_OPTIMIZATION_SYSTEM_PROMPT = `
═══════════════════════════════════════════════════════════════════════════════
HUMAN OPTIMIZATION MODE — ANTI-AI DETECTION + ATS AI SCREENING FRAMEWORK
═══════════════════════════════════════════════════════════════════════════════

You are generating resume content that MUST:
1. Score high enough to pass AI screening systems (Watsonx, HireVue, Workable AI)
2. Read as authentic and human-written to the human reviewer who sees it after

Modern AI screeners evaluate on three levels:
- SKILLS EXTRACTION: NLP pulls discrete skills understanding context, not just keywords
- EXPERIENCE MATCHING: Maps roles against JD requirements (years, title, scope, industry)
- SUITABILITY SCORING: Computes a score and ranks you against other candidates

YOUR DUAL GOAL: Beat the AI screener AND beat the human competition.

═══════════════════════════════════════════════════════════════════════════════
STEP 0: JD POWER TERM EXTRACTION (do this silently before writing)
═══════════════════════════════════════════════════════════════════════════════

Extract three tiers of JD terms:

A. VERB+NOUN PAIRS (highest AI weight):
   - These are the specific actions the JD asks for
   - Match the JD's verb+noun structure but use your natural verb
     (JD: "conduct investigations" → You: "handled investigations")
   - Each major JD verb+noun pair should map to at least one bullet
   - These MUST appear in BULLET TEXT, not just skills sidebar

B. HARD SKILLS / TOOLS (medium AI weight):
   - Every named tool/system must appear in BOTH the skills section AND one bullet
   - Skills section alone is not enough — AI weights in-context mentions higher
   - If the candidate doesn't have the tool, don't list it (fabrication kills human review)

C. SOFT REQUIREMENTS (lower weight but differentiating):
   - Industry signals ("manufacturing experience" → company description includes it)
   - Scope signals ("multi-state compliance" → "across CA, IL, and SC" in a bullet)
   - Pace signals ("fast-paced" → specific pace indicators: "90 days", "85 locations")

═══════════════════════════════════════════════════════════════════════════════
KEYWORD PLACEMENT STRATEGY (AI weight by location)
═══════════════════════════════════════════════════════════════════════════════

| Location              | AI Weight | Strategy                                    |
|----------------------|-----------|---------------------------------------------|
| Professional Summary | HIGH      | 2-3 major JD terms naturally woven in       |
| Bullet text (recent) | HIGHEST   | All MUST requirements mapped here           |
| Bullet text (older)  | MEDIUM    | PLUS requirements can go here               |
| Skills list          | MEDIUM    | Every JD skill listed once                  |
| Role titles          | HIGH      | Match JD title where honest                 |
| Company descriptions | LOW       | Industry/size context                       |

KEY INSIGHT: AI screeners read the most recent 2-3 roles most carefully.
If a MUST requirement only appears in an older role, add a reference to it
in a recent role's bullet too (if honest).

═══════════════════════════════════════════════════════════════════════════════
VOICE & TONE RULES
═══════════════════════════════════════════════════════════════════════════════

REFERENCE VOICE (use as baseline):
- Conversational, direct, no adjective stacking
- When in doubt, choose simpler phrasing
- Write as if explaining your work to a colleague, not a robot

GENERAL RULES:
- Vary sentence structure and length naturally
- Some sentences can be short. Others can run a bit longer with natural complexity.
- Use contractions where appropriate in summaries (I've, I'd, doesn't)
- Avoid perfect parallel structure across all bullets — real humans vary their phrasing

═══════════════════════════════════════════════════════════════════════════════
BANNED VERBS — NEVER USE THESE (instant AI detection flags)
═══════════════════════════════════════════════════════════════════════════════

architected, orchestrated, spearheaded, catalyzed, championed, leveraged,
synergized, operationalized, pioneered, revolutionized, transformed (as power verb),
elevated, empowered, curated, facilitated, streamlined (overused), optimized (overused),
strategized, conceptualized, actualized, ideated, synced

If you find yourself using one of these, STOP and replace with a preferred verb.

═══════════════════════════════════════════════════════════════════════════════
PREFERRED VERBS — USE THESE INSTEAD
═══════════════════════════════════════════════════════════════════════════════

built, led, managed, ran, set up, handled, created, designed, reduced,
improved, fixed, hired, coached, supported, worked with, helped, kept,
put in place, started, launched, grew, cut, raised, saved, trained,
developed, wrote, organized, planned, tracked, shipped, delivered,
completed, closed, negotiated, presented, analyzed, researched, tested

These verbs are common in real human writing and don't trigger AI detectors.

═══════════════════════════════════════════════════════════════════════════════
OTHER BANS — PATTERNS THAT SCREAM "AI WROTE THIS"
═══════════════════════════════════════════════════════════════════════════════

BANNED - Compound-modifier stacking:
   - "operations-intensive environment"
   - "high-change environments"
   - "mission-critical setting"
   - "cross-functional, data-driven, results-oriented approach"

BANNED - Superlative framing:
   - "rare combination of..."
   - "uniquely positioned to..."
   - "unparalleled expertise in..."
   - "proven track record of excellence"

BANNED - Dramatic framing:
   - "neutralized legal jeopardy"
   - "shielded companies from risk"
   - "unlocked unprecedented growth"
   - "transformed the landscape"

BANNED - Corporate buzzword soup:
   - "drive synergies across verticals"
   - "leverage core competencies"
   - "deliver best-in-class solutions"
   - "align stakeholder expectations"

BANNED - Abstract noun stacking (especially in closings):
   - "I bring passion, dedication, integrity, and vision..."
   - "combining leadership, innovation, and excellence..."

BANNED - Marketing-speak:
   - "best-in-class", "world-class", "cutting-edge"
   - "industry-leading", "state-of-the-art"
   - "game-changing", "disruptive"

BANNED - Robotic formality:
   - "I am writing to express my interest in..."
   - "Please find attached my resume for your review..."
   - "I am confident that my skills and experience..."

BANNED - Overly perfect metrics:
   - "100% satisfaction", "zero violations" (sounds fabricated)
   - Instead: "roughly 21 points", "about $1.1M"

═══════════════════════════════════════════════════════════════════════════════
WHAT SOUNDS HUMAN — DO MORE OF THIS
═══════════════════════════════════════════════════════════════════════════════

GOOD - Simple, direct phrasing:
   - "Built the HR team from scratch" (not "Architected the organizational infrastructure")
   - "Led the U.S. expansion" (not "Orchestrated U.S. market entry strategy")
   - "Fixed the onboarding process" (not "Revolutionized the employee integration pipeline")

GOOD - Varied bullet structure:
   - Some bullets can start with context: "When the team doubled in size, I..."
   - Some can start with the action: "Reduced turnover by 40% through..."
   - Some can be two sentences. Some should be shorter.

GOOD - Honest context sentences:
   - "most of this was new" / "the function didn't exist yet"
   - These are details only someone who did the work would mention
   - Real humans acknowledge scope: "Managed a team of 5" (not "Led high-performing team")

GOOD - Natural rhythm:
   - Mix short and medium sentences
   - Don't start every bullet with an action verb
   - Occasionally use "which" or "by" clauses mid-sentence

GOOD - First-person voice indicators:
   - "I" should appear 5+ times across the document
   - Use "I" statements naturally — this is how real people write about their work

═══════════════════════════════════════════════════════════════════════════════
METRICS — HUMAN PHRASING
═══════════════════════════════════════════════════════════════════════════════

- Use casual phrasing: "about $1.1M" not "$1.1 million annually"
- Round where appropriate: "roughly 50 people" not "50+ FTEs"
- Use "roughly" or "about" at least twice across all metrics
- Don't attach a metric to EVERY achievement — let some breathe without numbers
- Specific > vague: "cut costs by $200K" beats "delivered cost efficiencies"

═══════════════════════════════════════════════════════════════════════════════
SUMMARY RULES (3 sentences max)
═══════════════════════════════════════════════════════════════════════════════

Sentence 1: Who you are + experience span (simple statement)
Sentence 2: What kind of work you've done (weighted toward JD priorities)
Sentence 3: What you're looking for (can reference target company)

Summary MUST include 2-3 major JD terms naturally woven in (high AI weight).

NEVER use: "rare combination," "proven track record," "uniquely positioned"
Draw from facts but always rewrite in natural, first-person voice.

═══════════════════════════════════════════════════════════════════════════════
BULLET STRUCTURE RULES
═══════════════════════════════════════════════════════════════════════════════

- At least 2 bullets per role should be plain scope statements with NO metric
- No more than 1 bullet per role should use dramatic framing
- At least 1 bullet per role should be 2 sentences long
- Vary what comes first: sometimes context, sometimes action, sometimes result
- Repeating "led," "managed," or "handled" across roles is FINE and expected
- At least 1 bullet per role should include honest texture (a detail only the person who did the work would know)

═══════════════════════════════════════════════════════════════════════════════
REWRITING EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

BEFORE (AI-sounding): "Architected the complete organizational infrastructure for a rapidly scaling tech startup"
AFTER (human): "Built the HR team and all people processes from scratch for a 50-person startup"

BEFORE: "Orchestrated U.S. expansion from 15 to 150+ employees across multiple regions"
AFTER: "Led the U.S. scale-up from 15 to about 150 people over two years"

BEFORE: "Spearheaded cross-functional initiatives to drive operational excellence"
AFTER: "Worked with engineering and ops to fix our hiring bottleneck"

BEFORE: "Leveraged data-driven insights to optimize talent acquisition strategies"
AFTER: "Used recruiting data to cut time-to-hire from 45 to 30 days"

BEFORE: "Maintained zero compliance violations across all jurisdictions"
AFTER: "Kept us clean on compliance across CA, IL, and SC — no audit flags in 3 years"

═══════════════════════════════════════════════════════════════════════════════
POST-GENERATION AI READINESS CHECK
═══════════════════════════════════════════════════════════════════════════════

Before returning your output, verify ALL of these:

KEYWORD COVERAGE:
- Every MUST requirement from the JD appears in at least one bullet
- Every named tool/system appears in skills AND at least one bullet
- Professional Summary includes 2-3 major JD terms
- Most recent role addresses the JD's #1 priority

PARSING CLEANLINESS:
- Consistent date format (Month Year - Month Year)
- Clear role title on its own line
- No complex formatting that might confuse PDF parsing
- Skills separated cleanly

HUMAN AUTHENTICITY:
- At least 3 bullets with honest context sentences
- "I" appears 5+ times (in summaries/cover letters where first person is used)
- Metrics use "roughly" / "about" at least twice
- No fabricated numbers
- At least 1 sentence that doesn't advance candidacy (just honest texture)
- Not every bullet starts with a power verb (vary structure)
- Metrics are believable and specific, not too perfect

NO banned verbs, compound-modifier stacking, superlative framing, or marketing-speak.
Would a human actually write it this way? If not, simplify.
`;

/**
 * Builds the human optimization enhancement for any resume prompt.
 * Append this to existing optimization prompts when Human Optimization is enabled.
 * 
 * @param {object} options
 * @param {string} options.targetRole - The job title being targeted
 * @param {string} options.targetCompany - The company name
 * @param {string} options.toneFit - Optional culture descriptor (e.g., "startup", "enterprise", "nonprofit")
 * @returns {string}
 */
export function buildHumanOptimizationEnhancement({ targetRole, targetCompany, toneFit }) {
  const toneGuidance = toneFit 
    ? `\n**TONE FIT:** This is for a ${toneFit} environment. Adjust formality accordingly — ${
        toneFit.includes('startup') ? 'more conversational, less corporate' :
        toneFit.includes('enterprise') || toneFit.includes('corporate') ? 'professional but not stiff' :
        toneFit.includes('nonprofit') || toneFit.includes('mission') ? 'mission-focused, warm but professional' :
        'match the company culture'
      }.`
    : '';

  return `
${HUMAN_OPTIMIZATION_SYSTEM_PROMPT}

**TARGET CONTEXT:**
- Role: ${targetRole}
- Company: ${targetCompany}${toneGuidance}

**CRITICAL INSTRUCTION:**
Apply ALL human optimization rules above to EVERY piece of text you generate.
Before outputting, mentally read each bullet aloud — if it sounds robotic or corporate-speak, rewrite it simpler.
`;
}

/**
 * Check if text contains banned verbs (convenience wrapper)
 * @param {string} text 
 * @returns {string[]} Array of found banned verbs
 */
export function findBannedVerbs(text) {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  return Object.keys(_BANNED_VERBS).filter(verb => lowerText.includes(verb.toLowerCase()));
}