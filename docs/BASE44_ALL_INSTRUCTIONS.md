# Base44 — All Outstanding Instructions
## Phases 1–4 · Autonomous Job Pipeline

**Date:** 2026-03-19
**GitHub branch:** `main` · commit `25a4faa`
**Frontend:** Auto-deployed by Base44 from `main` — no manual action needed for ReviewQueue.jsx

---

## Current Deployment Status

| Component | Status | Action Required |
|-----------|--------|----------------|
| `discoverJobs` function | ✅ Deployed & correct | None |
| `orchestrateTailoring` function | ✅ Deployed & correct | None |
| `fillApplication` function | ⚠️ Phase 3 only — missing Phase 4 | **Paste updated version** |
| `generateScreeningAnswers` function | ❌ Does not exist yet | **Create new + paste** |
| `ReviewQueue.jsx` (frontend) | ✅ Auto-deployed from main | None |
| `JobListing` entity schema | ⚠️ Missing 2 fields, outdated enum | **Edit schema** |
| `Application` entity schema | ⚠️ Missing `cover_letter_text` | **Edit schema** |
| `ApplicationEvent` entity schema | ⚠️ Wrong `event_type` enum values | **Edit schema** |

---

## TASK 1 — Create New Function: `generateScreeningAnswers`

Go to **Base44 → Functions → New Function**
Name it exactly: `generateScreeningAnswers`
Paste the following complete script:

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

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

  for (const line of jdText.split('\n')) {
    const t = line.trim();
    if (t.endsWith('?') && t.length > 15) addQ(t);
  }

  for (const line of jdText.split('\n')) {
    const t = line.trim();
    if (/^(are you|do you|can you|have you|will you|would you|please (describe|explain|provide|list)|tell us)/i.test(t)) {
      addQ(t.endsWith('?') ? t : t + '?');
    }
  }

  const implicitPatterns: Array<[RegExp, string]> = [
    [/authorized to work/i,                       'Are you authorized to work in the United States?'],
    [/require.*sponsorship/i,                      'Will you now or in the future require sponsorship for employment visa status?'],
    [/salary.*expectation|expected.*salary/i,      'What are your salary expectations?'],
    [/years.*experience/i,                         'How many years of relevant experience do you have?'],
    [/notice period|when.*start/i,                 'What is your notice period / when can you start?'],
  ];

  for (const [pattern, question] of implicitPatterns) {
    if (pattern.test(jdText)) addQ(question);
  }

  return results.slice(0, 15);
}

function lookupVault(vault: Record<string, unknown> | null, category: string): string | null {
  if (!vault) return null;
  const qa  = (vault.qa_snippets  as Record<string, string>) ?? {};
  const ats = (vault.ats_profile  as Record<string, string>) ?? {};
  if (qa[category]) return qa[category];
  switch (category) {
    case 'work_authorization': return ats.work_authorization ?? null;
    case 'salary':             return ats.salary_expectation ?? null;
    case 'remote_preference':  return ats.remote_preference  ?? null;
    case 'availability':       return ats.notice_period      ?? null;
    case 'clearance':          return ats.clearance_level    ?? null;
    case 'travel':             return ats.willing_to_travel  ?? null;
    case 'links':              return ats.linkedin           ?? null;
  }
  return null;
}

function templateAnswer(category: string, vault: Record<string, unknown> | null): string {
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
      return ats.willing_to_travel ? `I am ${ats.willing_to_travel}.` : 'I am willing to travel as required by the role.';
    default:
      return 'I would be happy to discuss this in detail during the interview process.';
  }
}

async function askKyle(
  base44: Record<string, unknown>,
  question: string,
  category: string,
  vault: Record<string, unknown> | null,
  resumeText: string,
  jobListing: Record<string, unknown>,
): Promise<{ answer: string; source: 'kyle' | 'template' }> {
  const personal = (vault?.personal   as Record<string, string>) ?? {};
  const ats      = (vault?.ats_profile as Record<string, string>) ?? {};

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
  ].filter(Boolean).join('\n');

  try {
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
      (raw as Record<string, string>)?.text ?? null;
    if (text && text.length > 5) return { answer: text.trim(), source: 'kyle' };
    throw new Error('empty response');
  } catch (e) {
    console.warn('[generateScreeningAnswers] Kyle invocation failed, using template:', String(e));
    return { answer: templateAnswer(category, vault), source: 'template' };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { user_id = user.id, job_listing_id, save_to_vault = false, questions: manualQuestions } = body;

    if (!job_listing_id) return Response.json({ error: 'job_listing_id is required' }, { status: 400 });

    const JobListing    = base44.asServiceRole.entities.JobListing;
    const Application   = base44.asServiceRole.entities.Application;
    const AutofillVault = base44.asServiceRole.entities.AutofillVault;
    const ResumeVersion = base44.asServiceRole.entities.ResumeVersion;

    let jobListing: Record<string, unknown> | null = null;
    try { jobListing = (await JobListing.get(job_listing_id)) ?? null; }
    catch { const rows = await JobListing.filter({ id: job_listing_id }).catch(() => []); jobListing = rows?.[0] ?? null; }
    if (!jobListing) return Response.json({ error: 'Job listing not found' }, { status: 404 });

    const vaultRows = await AutofillVault.filter({ user_id }).catch(() => []);
    const vault     = vaultRows?.[0] ?? null;

    const rvRows: Record<string, unknown>[] = await ResumeVersion.filter({ user_id, job_listing_id }).catch(() => []);
    const resumeVersion = rvRows.sort((a, b) =>
      new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
    )[0] ?? null;
    const resumeText = (resumeVersion?.resume_text as string) ?? '';

    const jdText   = (jobListing.jd_text as string) ?? '';
    const toAnswer: Array<{ question: string; category: string }> = manualQuestions
      ? (manualQuestions as string[]).map((q: string) => ({ question: q, category: classifyQuestion(q) }))
      : extractQuestionsFromJD(jdText);

    if (toAnswer.length === 0) {
      return Response.json({ success: true, answers: {}, vault_hits: 0, kyle_generated: 0, template_fallbacks: 0, total: 0, saved_to_application: false, message: 'No screening questions detected.' });
    }

    const answered: AnsweredQuestion[] = [];
    let vaultHits = 0, kyleGenerated = 0, templateCount = 0;

    for (const { question, category } of toAnswer) {
      const vaultAnswer = lookupVault(vault, category);
      if (vaultAnswer) {
        answered.push({ question, answer: vaultAnswer, source: 'vault', category });
        vaultHits++;
        continue;
      }
      const { answer, source } = await askKyle(
        base44 as unknown as Record<string, unknown>, question, category, vault, resumeText, jobListing,
      );
      answered.push({ question, answer, source, category });
      if (source === 'kyle') kyleGenerated++;
      else templateCount++;
    }

    const screeningMeta: Record<string, { answer: string; source: string; category: string }> = {};
    for (const a of answered) {
      screeningMeta[a.question] = { answer: a.answer, source: a.source, category: a.category };
    }

    let savedToApplication = false;
    try {
      const existingApps = await Application.filter({ job_listing_id, user_id }).catch(() => []);
      const existingApp  = existingApps?.[0] ?? null;
      if (existingApp) {
        await Application.update(existingApp.id, { screening_answers: screeningMeta });
      } else {
        await Application.create({
          user_id, job_listing_id,
          resume_version_id: resumeVersion?.id ?? null,
          screening_answers: screeningMeta,
          status: 'pending_review',
          created_at: new Date().toISOString(),
        });
      }
      savedToApplication = true;
    } catch (e) {
      console.error('[generateScreeningAnswers] Application save failed:', e);
    }

    if (save_to_vault && vault && kyleGenerated > 0) {
      try {
        const existingQA = (vault.qa_snippets as Record<string, string>) ?? {};
        const newQA = { ...existingQA };
        for (const a of answered) {
          if (a.source === 'kyle' && !existingQA[a.category]) newQA[a.category] = a.answer;
        }
        await AutofillVault.update(vault.id, { qa_snippets: newQA });
      } catch (e) {
        console.warn('[generateScreeningAnswers] Vault write-back failed:', e);
      }
    }

    return Response.json({ success: true, answers: screeningMeta, vault_hits: vaultHits, kyle_generated: kyleGenerated, template_fallbacks: templateCount, total: answered.length, saved_to_application: savedToApplication });

  } catch (err) {
    console.error('[generateScreeningAnswers] Error:', err);
    return Response.json({ error: 'Internal server error', detail: String(err) }, { status: 500 });
  }
});
```

---

## TASK 2 — Update Function: `fillApplication`

Go to **Base44 → Functions → fillApplication → Edit**
Replace the entire script with the following:

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

type ATSType = 'greenhouse' | 'lever' | 'workday' | 'smartrecruiters' | 'workable' | 'icims' | 'taleo' | 'other';

function detectATS(url: string): ATSType {
  if (!url) return 'other';
  const u = url.toLowerCase();
  if (u.includes('greenhouse.io') || u.includes('grnh.se')) return 'greenhouse';
  if (u.includes('lever.co')) return 'lever';
  if (u.includes('myworkdayjobs.com') || u.includes('workday.com')) return 'workday';
  if (u.includes('smartrecruiters.com')) return 'smartrecruiters';
  if (u.includes('workable.com') || u.includes('apply.workable')) return 'workable';
  if (u.includes('icims.com')) return 'icims';
  if (u.includes('taleo.net') || u.includes('taleo.com')) return 'taleo';
  return 'other';
}

function parseGreenhouseUrl(url: string): { boardToken: string; jobId: string } | null {
  const m1 = url.match(/greenhouse\.io\/([^/?#]+)\/jobs\/(\d+)/);
  if (m1) return { boardToken: m1[1], jobId: m1[2] };
  return null;
}

function parseLeverUrl(url: string): { postingId: string } | null {
  const m = url.match(/lever\.co\/[^/?#]+\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (m) return { postingId: m[1] };
  return null;
}

function buildAutofillPacket(
  vault: Record<string, unknown> | null,
  resumeVersion: Record<string, unknown> | null,
  jobListing: Record<string, unknown>,
): Record<string, unknown> {
  const personal   = (vault?.personal    as Record<string, string>) ?? {};
  const atsProfile = (vault?.ats_profile as Record<string, string>) ?? {};
  const fullName   = personal.full_name ?? '';
  const nameParts  = fullName.trim().split(/\s+/);

  return {
    first_name:         nameParts[0] ?? '',
    last_name:          nameParts.slice(1).join(' ') ?? '',
    full_name:          fullName,
    email:              personal.email ?? '',
    phone:              personal.phone ?? '',
    location:           personal.location ?? '',
    linkedin:           atsProfile.linkedin ?? '',
    portfolio:          atsProfile.portfolio ?? '',
    github:             atsProfile.github ?? '',
    work_authorization: atsProfile.work_authorization ?? '',
    sponsorship_needed: atsProfile.sponsorship_needed ?? 'no',
    salary_expectation: atsProfile.salary_expectation ?? '',
    remote_preference:  atsProfile.remote_preference ?? '',
    notice_period:      atsProfile.notice_period ?? '',
    willing_to_travel:  atsProfile.willing_to_travel ?? '',
    clearance_level:    atsProfile.clearance_level ?? '',
    cover_letter:       (resumeVersion?.cover_letter_text as string) ?? '',
    resume_filename:    (resumeVersion?.docx_filename as string) ?? '',
    apply_url:          (jobListing.url as string) ?? '',
    role:               (jobListing.title as string) ?? '',
    company:            (jobListing.company as string) ?? '',
  };
}

async function submitGreenhouse(
  boardToken: string, jobId: string,
  packet: Record<string, unknown>,
  resumeVersion: Record<string, unknown> | null,
): Promise<{ success: boolean; confirmation?: string; error?: string }> {
  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}/applications`;
  const form = new FormData();
  form.append('first_name', String(packet.first_name ?? ''));
  form.append('last_name',  String(packet.last_name  ?? ''));
  form.append('email',      String(packet.email      ?? ''));
  if (packet.phone)    form.append('phone',   String(packet.phone));
  if (packet.linkedin) form.append('website', String(packet.linkedin));

  const docxBase64   = resumeVersion?.docx_base64   as string | undefined;
  const docxFilename = (resumeVersion?.docx_filename as string) ?? 'resume.docx';
  if (docxBase64) {
    try {
      const bytes = Uint8Array.from(atob(docxBase64), (c) => c.charCodeAt(0));
      form.append('resume', new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), docxFilename);
    } catch { console.warn('[fillApplication] Resume blob failed'); }
  }
  if (packet.cover_letter) {
    form.append('cover_letter', new Blob([packet.cover_letter as string], { type: 'text/plain' }), 'cover_letter.txt');
  }

  console.log(`[fillApplication] Greenhouse: ${boardToken}/jobs/${jobId}`);
  const resp = await fetch(apiUrl, { method: 'POST', body: form });
  if (resp.ok || resp.status === 201) return { success: true, confirmation: `Submitted via Greenhouse (${boardToken}/${jobId})` };
  const errSnippet = (await resp.text().catch(() => '')).substring(0, 300);
  if (resp.status === 401 || resp.status === 403) return { success: false, error: `manual_required: Greenhouse requires Authorization-Key (${resp.status}).` };
  return { success: false, error: `Greenhouse API ${resp.status}: ${errSnippet}` };
}

async function submitLever(
  postingId: string,
  packet: Record<string, unknown>,
  resumeVersion: Record<string, unknown> | null,
): Promise<{ success: boolean; confirmation?: string; error?: string }> {
  const apiUrl = `https://api.lever.co/v0/postings/${postingId}/apply`;
  const form = new FormData();
  form.append('name',  String(packet.full_name ?? ''));
  form.append('email', String(packet.email     ?? ''));
  if (packet.phone)        form.append('phone',    String(packet.phone));
  if (packet.cover_letter) form.append('comments', String(packet.cover_letter));

  const docxBase64   = resumeVersion?.docx_base64   as string | undefined;
  const docxFilename = (resumeVersion?.docx_filename as string) ?? 'resume.docx';
  if (docxBase64) {
    try {
      const bytes = Uint8Array.from(atob(docxBase64), (c) => c.charCodeAt(0));
      form.append('resume', new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), docxFilename);
    } catch { console.warn('[fillApplication] Resume blob failed'); }
  }

  console.log(`[fillApplication] Lever: ${postingId}`);
  const resp = await fetch(apiUrl, { method: 'POST', body: form });
  if (resp.ok || resp.status === 200 || resp.status === 201) return { success: true, confirmation: `Submitted via Lever (${postingId})` };
  const errSnippet = (await resp.text().catch(() => '')).substring(0, 300);
  if (resp.status === 404) return { success: false, error: 'manual_required: Lever posting not found or closed.' };
  if (resp.status === 401 || resp.status === 403) return { success: false, error: 'manual_required: Lever posting requires authentication.' };
  return { success: false, error: `Lever API ${resp.status}: ${errSnippet}` };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { user_id = user.id, job_listing_id, resume_version_id } = body;
    if (!job_listing_id) return Response.json({ error: 'job_listing_id is required' }, { status: 400 });

    const JobListing       = base44.asServiceRole.entities.JobListing;
    const ResumeVersion    = base44.asServiceRole.entities.ResumeVersion;
    const AutofillVault    = base44.asServiceRole.entities.AutofillVault;
    const ApplicationEvent = base44.asServiceRole.entities.ApplicationEvent;
    const Application      = base44.asServiceRole.entities.Application;

    let jobListing: Record<string, unknown> | null = null;
    try { jobListing = (await JobListing.get(job_listing_id)) ?? null; }
    catch { const r = await JobListing.filter({ id: job_listing_id }).catch(() => []); jobListing = r?.[0] ?? null; }
    if (!jobListing) return Response.json({ error: 'Job listing not found' }, { status: 404 });

    let resumeVersion: Record<string, unknown> | null = null;
    if (resume_version_id) {
      try { resumeVersion = (await ResumeVersion.get(resume_version_id)) ?? null; }
      catch { const r = await ResumeVersion.filter({ id: resume_version_id }).catch(() => []); resumeVersion = r?.[0] ?? null; }
    }
    if (!resumeVersion) {
      const rows: Record<string, unknown>[] = await ResumeVersion.filter({ user_id, job_listing_id }).catch(() => []);
      resumeVersion = rows.sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())[0] ?? null;
    }

    const vaultRows = await AutofillVault.filter({ user_id }).catch(() => []);
    const vault     = vaultRows?.[0] ?? null;

    const autofillPacket = buildAutofillPacket(vault, resumeVersion, jobListing);
    const jobUrl  = (jobListing.url ?? jobListing.apply_url ?? '') as string;
    const atsType = detectATS(jobUrl);
    console.log(`[fillApplication] ATS: ${atsType} | ${jobUrl.substring(0, 80)}`);

    let submitResult: { success: boolean; confirmation?: string; error?: string };
    if (atsType === 'greenhouse') {
      const parsed = parseGreenhouseUrl(jobUrl);
      submitResult = parsed
        ? await submitGreenhouse(parsed.boardToken, parsed.jobId, autofillPacket, resumeVersion)
        : { success: false, error: 'manual_required: Could not parse Greenhouse URL.' };
    } else if (atsType === 'lever') {
      const parsed = parseLeverUrl(jobUrl);
      submitResult = parsed
        ? await submitLever(parsed.postingId, autofillPacket, resumeVersion)
        : { success: false, error: 'manual_required: Could not parse Lever posting ID.' };
    } else {
      const label = atsType === 'other' ? 'This ATS' : atsType.charAt(0).toUpperCase() + atsType.slice(1);
      submitResult = { success: false, error: `manual_required: ${label} does not support automated submission. Use autofill packet.` };
    }

    const finalStatus = submitResult.success ? 'applied'
      : submitResult.error?.startsWith('manual_required') ? 'manual_required'
      : 'application_error';

    await ApplicationEvent.create({
      user_id, job_listing_id,
      resume_version_id: resumeVersion?.id ?? null,
      event_type: finalStatus, ats_type: atsType,
      notes: submitResult.confirmation ?? submitResult.error ?? '',
      created_at: new Date().toISOString(),
    }).catch((e: unknown) => console.error('[fillApplication] ApplicationEvent failed:', e));

    const updatePayload: Record<string, unknown> = { status: finalStatus };
    if (finalStatus === 'applied') updatePayload.applied_at = new Date().toISOString();
    await JobListing.update(job_listing_id, updatePayload).catch((e: unknown) => console.error('[fillApplication] JobListing update failed:', e));

    // Generate screening answers via generateScreeningAnswers function
    let screeningAnswers: Record<string, unknown> = {};
    try {
      const jdText = (jobListing.jd_text as string) ?? '';
      if (jdText.length > 100) {
        const origin = new URL(req.url).origin;
        const saResp = await fetch(`${origin}/functions/generateScreeningAnswers`, {
          method: 'POST',
          headers: { ...Object.fromEntries(req.headers), 'content-type': 'application/json' },
          body: JSON.stringify({ user_id, job_listing_id, save_to_vault: false }),
        }).catch(() => null);
        if (saResp?.ok) {
          const saResult = await saResp.json().catch(() => ({}));
          screeningAnswers = saResult.answers ?? {};
        }
      }
    } catch (e) {
      console.warn('[fillApplication] Screening answers failed (non-fatal):', e);
    }

    // Persist to Application entity
    const { cover_letter: coverLetterForApp, ...fillSummaryPacket } = autofillPacket as Record<string, unknown>;
    const existingApps = await Application.filter({ job_listing_id, user_id }).catch(() => []);
    const existingApp  = existingApps?.[0] ?? null;
    if (existingApp) {
      await Application.update(existingApp.id, {
        cover_letter_text: coverLetterForApp ?? '',
        fill_summary:      fillSummaryPacket,
        screening_answers: Object.keys(screeningAnswers).length > 0 ? screeningAnswers : existingApp.screening_answers,
        status:            finalStatus,
      }).catch((e: unknown) => console.error('[fillApplication] Application update failed:', e));
    } else {
      await Application.create({
        user_id, job_listing_id,
        resume_version_id: resumeVersion?.id ?? null,
        cover_letter_text: coverLetterForApp ?? '',
        fill_summary:      fillSummaryPacket,
        screening_answers: screeningAnswers,
        status:            finalStatus,
        created_at:        new Date().toISOString(),
      }).catch((e: unknown) => console.error('[fillApplication] Application create failed:', e));
    }

    const { cover_letter: _cl, ...safePacket } = autofillPacket as Record<string, unknown>;
    return Response.json({
      success:           submitResult.success,
      status:            finalStatus,
      ats_type:          atsType,
      job_listing_id,
      resume_version_id: resumeVersion?.id ?? null,
      confirmation:      submitResult.confirmation ?? null,
      error:             submitResult.error ?? null,
      autofill_packet:   safePacket,
      cover_letter:      autofillPacket.cover_letter ?? '',
    });

  } catch (err) {
    console.error('[fillApplication] Error:', err);
    return Response.json({ error: 'Internal server error', detail: String(err) }, { status: 500 });
  }
});
```

---

## TASK 3 — Fix Entity: `JobListing`

Go to **Base44 → Data → JobListing → Edit Schema**

### Add field: `flagged_reason`
- Type: String · Optional · No default

### Add field: `applied_at`
- Type: DateTime · Optional · No default

### Update field: `status` enum — add if missing
```
manual_required
application_error
```
Remove `tailoring` from the enum (deprecated — no function writes it anymore).

---

## TASK 4 — Fix Entity: `Application`

Go to **Base44 → Data → Application → Edit Schema**

### Add field: `cover_letter_text`
- Type: Long Text / Text Area · Optional

---

## TASK 5 — Fix Entity: `ApplicationEvent`

Go to **Base44 → Data → ApplicationEvent → Edit Schema**

### Replace `event_type` enum with exactly these values:
```
applied
manual_required
application_error
submitted
rejected
```
Remove legacy values if present: `created`, `fill_started`, `fill_complete`, `flagged`, `approved`

---

## Verification Checklist

After completing all 5 tasks, confirm each item:

### Functions
- [ ] `generateScreeningAnswers` exists in Base44 Functions list
- [ ] Invoking `generateScreeningAnswers` with a `job_listing_id` returns `{ success, answers, vault_hits, kyle_generated, total }`
- [ ] `fillApplication` response includes `cover_letter` field
- [ ] `fillApplication` response includes `autofill_packet` object (no `docx_base64` in it)

### Entities
- [ ] `JobListing` has `flagged_reason` and `applied_at` fields
- [ ] `JobListing.status` enum includes `manual_required` and `application_error`
- [ ] `Application` has `cover_letter_text` field
- [ ] `ApplicationEvent.event_type` enum is: applied, manual_required, application_error, submitted, rejected

### End-to-end flow test
1. Open ReviewQueue
2. Pick any listing with `jd_text` set
3. Click **Generate Screening Answers** (purple button)
4. Verify: answers appear in the Screening Answers section with source badges
5. Verify: summary strip shows `X answered · Y from vault · Z by Kyle`
6. Click **Save to vault** — re-invokes with `save_to_vault: true`
7. Run the same listing again — vault hits should increase (Kyle hits decrease)

---

## What Does NOT Need to Be Pasted

| Component | Reason |
|-----------|--------|
| `orchestrateTailoring` | ✅ Already fully correct in Base44 (flagged_reason, fallback chain, no tailoring status) |
| `discoverJobs` | ✅ Already fully correct in Base44 |
| `ReviewQueue.jsx` | ✅ Auto-deployed from GitHub main branch — Phase 4 UI already live |
