import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * generateScreeningAnswers — Phase 4: Kyle Screening Q Integration
 *
 * Extracts screening questions from a job's JD text, checks the
 * AutofillVault for existing answers, then calls Kyle for any
 * unanswered questions. Saves results to Application.screening_answers.
 *
 * Body params:
 *   user_id         (string) — defaults to authenticated user
 *   job_listing_id  (string, required)
 *   save_to_vault   (boolean) — whether to write Kyle answers back to vault (default: false)
 *   questions       (string[]) — optional manual question list; extracted from JD if omitted
 *
 * Returns:
 *   { answers, vault_hits, kyle_generated, total, saved_to_application }
 */

// ─── Question Extraction ──────────────────────────────────────────────────────

type AnsweredQuestion = {
  question: string;
  answer:   string;
  source:   'vault' | 'kyle' | 'template';
  category: string;
};

function classifyQuestion(q: string): string {
  const l = q.toLowerCase();
  if (/authorized|authorization|eligible to work|work in (the )?us|visa|sponsorship/i.test(l)) return 'work_authorization';
  if (/years of experience|years experience|how many years/i.test(l))                          return 'years_experience';
  if (/salary|compensation|pay rate|hourly|annual salary|expected pay/i.test(l))               return 'salary';
  if (/relocat|willing to move/i.test(l))                                                       return 'relocation';
  if (/remote|hybrid|on.?site|in.?person|work from home/i.test(l))                            return 'remote_preference';
  if (/start date|available|availability|notice period|when can you start/i.test(l))           return 'availability';
  if (/clearance|security clearance/i.test(l))                                                  return 'clearance';
  if (/linkedin|portfolio|github|personal (website|site|url)/i.test(l))                       return 'links';
  if (/why (do you|are you|this|the company)|what (attract|interest|draw)/i.test(l))          return 'motivation';
  if (/certif|licens|phr|sphr|shrm|credential/i.test(l))                                      return 'certifications';
  if (/education|degree|bachelor|master|phd|diploma/i.test(l))                                return 'education';
  if (/travel|overnight|percentage of time/i.test(l))                                          return 'travel';
  return 'general';
}

function extractQuestionsFromJD(jdText: string): Array<{ question: string; category: string }> {
  const seen = new Set<string>();
  const results: Array<{ question: string; category: string }> = [];

  const addQ = (q: string) => {
    const normalized = q.trim().replace(/\s+/g, ' ');
    if (normalized.length < 15 || normalized.length > 400) return;
    if (seen.has(normalized.toLowerCase())) return;
    seen.add(normalized.toLowerCase());
    results.push({ question: normalized, category: classifyQuestion(normalized) });
  };

  // Lines that end with a question mark
  for (const line of jdText.split('\n')) {
    const t = line.trim();
    if (t.endsWith('?') && t.length > 15) addQ(t);
  }

  // Lines that start with common implicit question starters
  for (const line of jdText.split('\n')) {
    const t = line.trim();
    if (/^(are you|do you|can you|have you|will you|would you|please (describe|explain|provide|list)|tell us)/i.test(t)) {
      addQ(t.endsWith('?') ? t : t + '?');
    }
  }

  // Common application questions that appear without '?' in many ATS systems
  const implicitPatterns: Array<[RegExp, string]> = [
    [/authorized to work/i,         'Are you authorized to work in the United States?'],
    [/require.*sponsorship/i,        'Will you now or in the future require sponsorship for employment visa status?'],
    [/salary.*expectation|expected.*salary/i, 'What are your salary expectations?'],
    [/years.*experience/i,           'How many years of relevant experience do you have?'],
    [/notice period|when.*start/i,   'What is your notice period / when can you start?'],
  ];

  for (const [pattern, question] of implicitPatterns) {
    if (pattern.test(jdText)) addQ(question);
  }

  return results.slice(0, 15);
}

// ─── Vault Lookup ─────────────────────────────────────────────────────────────

function lookupVault(
  vault: Record<string, unknown> | null,
  category: string,
): string | null {
  if (!vault) return null;
  const qa     = (vault.qa_snippets  as Record<string, string>) ?? {};
  const ats    = (vault.ats_profile  as Record<string, string>) ?? {};

  if (qa[category]) return qa[category];

  switch (category) {
    case 'work_authorization':  return ats.work_authorization  ?? null;
    case 'salary':              return ats.salary_expectation  ?? null;
    case 'remote_preference':   return ats.remote_preference   ?? null;
    case 'availability':        return ats.notice_period        ?? null;
    case 'clearance':           return ats.clearance_level      ?? null;
    case 'travel':              return ats.willing_to_travel    ?? null;
    case 'links':               return ats.linkedin             ?? null;
  }
  return null;
}

// ─── Template Fallback ────────────────────────────────────────────────────────

function templateAnswer(
  category: string,
  vault: Record<string, unknown> | null,
): string {
  const ats = (vault?.ats_profile as Record<string, string>) ?? {};
  switch (category) {
    case 'work_authorization':
      return ats.work_authorization
        ? `Yes, I am ${ats.work_authorization}.`
        : 'Yes, I am authorized to work without employer sponsorship.';
    case 'salary':
      return ats.salary_expectation
        ? `My target is ${ats.salary_expectation}, though I am open to discussion based on the full compensation package.`
        : 'I am flexible and open to discussing compensation based on the full package and scope of the role.';
    case 'remote_preference':
      return ats.remote_preference
        ? `My preference is ${ats.remote_preference}. I am adaptable to the team's needs.`
        : 'I am comfortable with remote, hybrid, or on-site arrangements.';
    case 'availability':
      return ats.notice_period
        ? `I can start with ${ats.notice_period} notice.`
        : 'I am available to discuss start dates during the interview process.';
    case 'relocation':
      return 'I am open to discussing relocation depending on the opportunity.';
    case 'clearance':
      return ats.clearance_level
        ? `I currently hold ${ats.clearance_level} clearance.`
        : 'I do not currently hold a clearance but am eligible and willing to obtain one.';
    case 'motivation':
      return 'I am excited by this opportunity because of its alignment with my experience and career goals. I look forward to sharing more during the interview.';
    case 'travel':
      return ats.willing_to_travel
        ? `I am ${ats.willing_to_travel}.`
        : 'I am willing to travel as required by the role.';
    default:
      return 'I would be happy to discuss this in detail during the interview process.';
  }
}

// ─── Kyle Invocation ──────────────────────────────────────────────────────────

async function askKyle(
  base44: Record<string, unknown>,
  question: string,
  category: string,
  vault: Record<string, unknown> | null,
  resumeText: string,
  jobListing: Record<string, unknown>,
): Promise<{ answer: string; source: 'kyle' | 'template' }> {
  const personal  = (vault?.personal   as Record<string, string>) ?? {};
  const ats       = (vault?.ats_profile as Record<string, string>) ?? {};

  const prompt = [
    `You are Kyle, an expert job application specialist. Answer this screening question concisely and professionally.`,
    ``,
    `Candidate profile:`,
    `- Name: ${personal.full_name ?? 'the candidate'}`,
    `- Work authorization: ${ats.work_authorization ?? 'not specified'}`,
    `- Notice period: ${ats.notice_period ?? 'not specified'}`,
    `- Salary expectation: ${ats.salary_expectation ?? 'not specified'}`,
    ``,
    `Applying for: ${jobListing.title ?? 'unknown role'} at ${jobListing.company ?? 'unknown company'}`,
    ``,
    resumeText ? `Resume (excerpt): ${resumeText.substring(0, 600)}` : '',
    ``,
    `Screening question: ${question}`,
    ``,
    `Respond with 1–3 sentences. Be direct and professional. Do not fabricate experience or credentials.`,
  ].filter(l => l !== null && l !== undefined).join('\n');

  try {
    // Base44 agent invocation from a function
    const agents = (base44 as Record<string, unknown>).asServiceRole as Record<string, unknown>;
    const agentsApi = agents?.agents as Record<string, unknown> | undefined;

    let raw: unknown;
    if (typeof (agentsApi as Record<string, unknown>)?.invoke === 'function') {
      raw = await (agentsApi as { invoke: (name: string, body: unknown) => Promise<unknown> })
        .invoke('kyle', { message: prompt });
    } else {
      throw new Error('agent invoke not available');
    }

    const text =
      (raw as Record<string, string>)?.message ??
      (raw as Record<string, string>)?.content ??
      (raw as Record<string, string>)?.text ??
      null;

    if (text && text.length > 5) {
      return { answer: text.trim(), source: 'kyle' };
    }
    throw new Error('empty response');
  } catch (e) {
    console.warn('[generateScreeningAnswers] Kyle invocation failed, using template:', String(e));
    return { answer: templateAnswer(category, vault), source: 'template' };
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      user_id        = user.id,
      job_listing_id,
      save_to_vault  = false,
      questions: manualQuestions,
    } = body;

    if (!job_listing_id) {
      return Response.json({ error: 'job_listing_id is required' }, { status: 400 });
    }

    const JobListing    = base44.asServiceRole.entities.JobListing;
    const Application   = base44.asServiceRole.entities.Application;
    const AutofillVault = base44.asServiceRole.entities.AutofillVault;
    const ResumeVersion = base44.asServiceRole.entities.ResumeVersion;

    // ── Load records ──
    let jobListing: Record<string, unknown> | null = null;
    try {
      jobListing = (await JobListing.get(job_listing_id)) ?? null;
    } catch {
      const rows = await JobListing.filter({ id: job_listing_id }).catch(() => []);
      jobListing = rows?.[0] ?? null;
    }
    if (!jobListing) return Response.json({ error: 'Job listing not found' }, { status: 404 });

    const vaultRows = await AutofillVault.filter({ user_id }).catch(() => []);
    const vault     = vaultRows?.[0] ?? null;

    // Latest resume version for context
    const rvRows: Record<string, unknown>[] = await ResumeVersion
      .filter({ user_id, job_listing_id })
      .catch(() => []);
    const resumeVersion = rvRows.sort((a, b) =>
      new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
    )[0] ?? null;
    const resumeText = (resumeVersion?.resume_text as string) ?? '';

    // ── Extract questions ──
    const jdText   = (jobListing.jd_text as string) ?? '';
    const toAnswer: Array<{ question: string; category: string }> = manualQuestions
      ? (manualQuestions as string[]).map(q => ({ question: q, category: classifyQuestion(q) }))
      : extractQuestionsFromJD(jdText);

    if (toAnswer.length === 0) {
      return Response.json({
        success:            true,
        answers:            {},
        vault_hits:         0,
        kyle_generated:     0,
        template_fallbacks: 0,
        total:              0,
        saved_to_application: false,
        message:            'No screening questions detected in job description.',
      });
    }

    // ── Answer each question ──
    const answered: AnsweredQuestion[] = [];
    let vaultHits    = 0;
    let kyleGenerated = 0;
    let templateCount = 0;

    for (const { question, category } of toAnswer) {
      const vaultAnswer = lookupVault(vault, category);
      if (vaultAnswer) {
        answered.push({ question, answer: vaultAnswer, source: 'vault', category });
        vaultHits++;
        continue;
      }

      // Ask Kyle (with template fallback inside askKyle)
      const { answer, source } = await askKyle(
        base44 as unknown as Record<string, unknown>,
        question,
        category,
        vault,
        resumeText,
        jobListing,
      );
      answered.push({ question, answer, source, category });
      if (source === 'kyle') kyleGenerated++;
      else templateCount++;
    }

    // ── Convert to flat Q→A map for Application entity ──
    const screeningAnswers: Record<string, string> = {};
    const screeningMeta:    Record<string, { answer: string; source: string; category: string }> = {};
    for (const a of answered) {
      screeningAnswers[a.question] = a.answer;
      screeningMeta[a.question]    = { answer: a.answer, source: a.source, category: a.category };
    }

    // ── Save to Application entity ──
    let savedToApplication = false;
    try {
      const existingApps = await Application.filter({ job_listing_id, user_id }).catch(() => []);
      const existingApp  = existingApps?.[0] ?? null;
      if (existingApp) {
        await Application.update(existingApp.id, { screening_answers: screeningMeta });
      } else {
        await Application.create({
          user_id,
          job_listing_id,
          resume_version_id: resumeVersion?.id ?? null,
          screening_answers: screeningMeta,
          status:            'pending_review',
          created_at:        new Date().toISOString(),
        });
      }
      savedToApplication = true;
    } catch (e) {
      console.error('[generateScreeningAnswers] Application save failed:', e);
    }

    // ── Optionally write Kyle-generated answers back to AutofillVault ──
    if (save_to_vault && vault && kyleGenerated > 0) {
      try {
        const existingQA = (vault.qa_snippets as Record<string, string>) ?? {};
        const newQA = { ...existingQA };
        for (const a of answered) {
          if (a.source === 'kyle' && !existingQA[a.category]) {
            newQA[a.category] = a.answer;
          }
        }
        await AutofillVault.update(vault.id, { qa_snippets: newQA });
        console.log(`[generateScreeningAnswers] Wrote ${kyleGenerated} new answers to vault`);
      } catch (e) {
        console.warn('[generateScreeningAnswers] Vault write-back failed:', e);
      }
    }

    return Response.json({
      success:            true,
      answers:            screeningMeta,
      vault_hits:         vaultHits,
      kyle_generated:     kyleGenerated,
      template_fallbacks: templateCount,
      total:              answered.length,
      saved_to_application: savedToApplication,
    });

  } catch (err) {
    console.error('[generateScreeningAnswers] Unhandled error:', err);
    return Response.json({ error: 'Internal server error', detail: String(err) }, { status: 500 });
  }
});
