/**
 * Human Optimization Prompt - Premium Feature
 * 
 * Anti-AI-detection rules, voice/tone guidelines, and humanization constraints
 * to make resume content sound authentically human-written.
 */

export const HUMAN_OPTIMIZATION_SYSTEM_PROMPT = `
═══════════════════════════════════════════════════════════════════════════════
HUMAN OPTIMIZATION MODE — ANTI-AI DETECTION FRAMEWORK
═══════════════════════════════════════════════════════════════════════════════

You are generating resume content that MUST pass as human-written. All professional
content should sound like it was written by a real person, not an AI.

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

❌ Compound-modifier stacking:
   - "operations-intensive environment"
   - "high-change environments"
   - "mission-critical setting"
   - "cross-functional, data-driven, results-oriented approach"

❌ Superlative framing:
   - "rare combination of..."
   - "uniquely positioned to..."
   - "unparalleled expertise in..."
   - "proven track record of excellence"

❌ Dramatic framing:
   - "neutralized legal jeopardy"
   - "shielded companies from risk"
   - "unlocked unprecedented growth"
   - "transformed the landscape"

❌ Corporate buzzword soup:
   - "drive synergies across verticals"
   - "leverage core competencies"
   - "deliver best-in-class solutions"
   - "align stakeholder expectations"

❌ Abstract noun stacking (especially in closings):
   - "I bring passion, dedication, integrity, and vision..."
   - "combining leadership, innovation, and excellence..."

❌ Marketing-speak:
   - "best-in-class", "world-class", "cutting-edge"
   - "industry-leading", "state-of-the-art"
   - "game-changing", "disruptive"

❌ Robotic formality:
   - "I am writing to express my interest in..."
   - "Please find attached my resume for your review..."
   - "I am confident that my skills and experience..."

═══════════════════════════════════════════════════════════════════════════════
WHAT SOUNDS HUMAN — DO MORE OF THIS
═══════════════════════════════════════════════════════════════════════════════

✅ Simple, direct phrasing:
   - "Built the HR team from scratch" (not "Architected the organizational infrastructure")
   - "Led the U.S. expansion" (not "Orchestrated U.S. market entry strategy")
   - "Fixed the onboarding process" (not "Revolutionized the employee integration pipeline")

✅ Varied bullet structure:
   - Some bullets can start with context: "When the team doubled in size, I..."
   - Some can start with the action: "Reduced turnover by 40% through..."
   - Some can be two sentences. Some should be shorter.

✅ Honest limitations:
   - Real humans acknowledge scope: "Managed a team of 5" (not "Led high-performing team")
   - Specific numbers beat vague claims: "Saved $50K annually" vs "delivered significant savings"

✅ Natural rhythm:
   - Mix short and medium sentences
   - Don't start every bullet with an action verb
   - Occasionally use "which" or "by" clauses mid-sentence

═══════════════════════════════════════════════════════════════════════════════
METRICS — HUMAN PHRASING
═══════════════════════════════════════════════════════════════════════════════

- Use casual phrasing: "about $1.1M" not "$1.1 million annually"
- Round where appropriate: "roughly 50 people" not "50+ FTEs"
- Don't attach a metric to EVERY achievement — let some breathe without numbers
- Specific > vague: "cut costs by $200K" beats "delivered cost efficiencies"

═══════════════════════════════════════════════════════════════════════════════
SUMMARY RULES (3 sentences max)
═══════════════════════════════════════════════════════════════════════════════

Sentence 1: Who you are + experience span (simple statement)
Sentence 2: What kind of work you've done (weighted toward role priorities)
Sentence 3: What you're looking for (can reference target company)

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

═══════════════════════════════════════════════════════════════════════════════
REWRITING EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

BEFORE (AI-sounding): "Architected the complete organizational infrastructure for a rapidly scaling tech startup"
AFTER (human): "Built the HR team and all people processes from scratch for a 50-person startup"

BEFORE: "Orchestrated U.S. expansion from 15 to 150+ employees across multiple regions"
AFTER: "Led the U.S. scale-up from 15 to 150 people over two years"

BEFORE: "Spearheaded cross-functional initiatives to drive operational excellence"
AFTER: "Worked with engineering and ops to fix our hiring bottleneck"

BEFORE: "Leveraged data-driven insights to optimize talent acquisition strategies"
AFTER: "Used recruiting data to cut time-to-hire from 45 to 30 days"

═══════════════════════════════════════════════════════════════════════════════
FINAL QUALITY CHECK
═══════════════════════════════════════════════════════════════════════════════

Before returning your output, verify:
1. NO banned verbs appear anywhere
2. NO compound-modifier stacking
3. NO superlative or dramatic framing
4. At least 2 plain scope bullets per role (no metrics)
5. Natural sentence length variation
6. Would a human actually write it this way? If not, simplify.
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
 * List of banned verbs for quick reference/validation
 */
export const BANNED_VERBS = [
  'architected', 'orchestrated', 'spearheaded', 'catalyzed', 'championed',
  'leveraged', 'synergized', 'operationalized', 'pioneered', 'revolutionized',
  'transformed', 'elevated', 'empowered', 'curated', 'facilitated',
  'streamlined', 'optimized', 'strategized', 'conceptualized', 'actualized',
  'ideated', 'synced'
];

/**
 * List of preferred verbs for quick reference
 */
export const PREFERRED_VERBS = [
  'built', 'led', 'managed', 'ran', 'set up', 'handled', 'created', 'designed',
  'reduced', 'improved', 'fixed', 'hired', 'coached', 'supported', 'worked with',
  'helped', 'kept', 'put in place', 'started', 'launched', 'grew', 'cut', 'raised',
  'saved', 'trained', 'developed', 'wrote', 'organized', 'planned', 'tracked',
  'shipped', 'delivered', 'completed', 'closed', 'negotiated', 'presented',
  'analyzed', 'researched', 'tested'
];

/**
 * Check if text contains banned verbs
 * @param {string} text 
 * @returns {string[]} Array of found banned verbs
 */
export function findBannedVerbs(text) {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  return BANNED_VERBS.filter(verb => lowerText.includes(verb.toLowerCase()));
}