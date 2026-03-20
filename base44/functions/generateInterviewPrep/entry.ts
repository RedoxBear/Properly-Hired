import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * generateInterviewPrep — AI-powered interview preparation
 *
 * Generates a personalized prep guide by combining:
 *   - Application + JobListing data (role, company, JD text, screening answers)
 *   - ResumeVersion content (tailored resume for this specific role)
 *   - O*NET profile (work styles, values, RIASEC — via getONetProfile)
 *   - RAG knowledge base (interview frameworks, STAR method — via ragRetrieve)
 *   - Simon's company intel (interviewer map, leadership style — from AgentCollabInbox)
 *
 * Body params:
 *   application_id  (string) — Application entity ID (preferred)
 *   job_listing_id  (string) — fallback: finds Application by listing + user
 *   action          ('generate' | 'fetch') — default: 'generate'
 *
 * Returns:
 *   { interview_prep: { likely_questions, questions_to_ask, star_templates,
 *                       preparation_checklist, onet_context } }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      application_id,
      job_listing_id,
      action = 'generate',
    } = body;

    if (!application_id && !job_listing_id) {
      return Response.json(
        { error: 'application_id or job_listing_id is required' },
        { status: 400 }
      );
    }

    const db = base44.asServiceRole.entities;

    // ── Resolve Application ──────────────────────────────────────────────────
    let app: Record<string, unknown> | null = null;

    if (application_id) {
      try {
        app = (await db.Application.get(application_id)) ?? null;
      } catch {
        const rows = await db.Application.filter({ id: application_id }).catch(() => []);
        app = rows?.[0] ?? null;
      }
    }

    if (!app && job_listing_id) {
      const rows = await db.Application
        .filter({ job_listing_id, user_id: user.id })
        .catch(() => []);
      app = rows?.[0] ?? null;
    }

    if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });

    // ── FETCH action: return cached prep ────────────────────────────────────
    if (action === 'fetch') {
      return Response.json({ interview_prep: (app.interview_prep ?? null) });
    }

    if (action !== 'generate') {
      return Response.json({ error: 'Invalid action. Use "generate" or "fetch".' }, { status: 400 });
    }

    // ── Load JobListing ──────────────────────────────────────────────────────
    const listingId = (app.job_listing_id as string) ?? job_listing_id ?? null;
    let jobListing: Record<string, unknown> | null = null;

    if (listingId) {
      try {
        jobListing = (await db.JobListing.get(listingId)) ?? null;
      } catch {
        const rows = await db.JobListing.filter({ id: listingId }).catch(() => []);
        jobListing = rows?.[0] ?? null;
      }
    }

    const jobTitle   = (jobListing?.title   as string) ?? '';
    const companyName = (jobListing?.company as string) ?? '';
    const jdText     = (jobListing?.jd_text  as string) ?? '';

    // ── Load tailored ResumeVersion ──────────────────────────────────────────
    let resumeText = '';

    // Primary: the version attached to this application
    const rvId = app.resume_version_id as string | null;
    if (rvId) {
      try {
        const rv = await db.ResumeVersion.get(rvId);
        resumeText = ((rv?.resume_text ?? rv?.parsed_content ?? rv?.optimized_content) as string) ?? '';
      } catch { /* graceful degradation */ }
    }

    // Fallback: latest version for this listing
    if (!resumeText && listingId) {
      const rows: Record<string, unknown>[] = await db.ResumeVersion
        .filter({ user_id: user.id, job_listing_id: listingId })
        .catch(() => []);
      const latest = rows.sort((a, b) =>
        new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
      )[0] ?? null;
      resumeText = ((latest?.resume_text ?? latest?.parsed_content ?? latest?.optimized_content) as string) ?? '';
    }

    // ── O*NET profile ────────────────────────────────────────────────────────
    let onetData: Record<string, unknown> | null = null;

    if (jobTitle) {
      try {
        const res = await base44.asServiceRole.functions.invoke('getONetProfile', { role_title: jobTitle });
        if (res?.profile) onetData = res.profile as Record<string, unknown>;
      } catch { /* graceful degradation */ }
    }

    // ── RAG context ──────────────────────────────────────────────────────────
    let ragContext = '';

    try {
      const ragRes = await base44.asServiceRole.functions.invoke('ragRetrieve', {
        query: `interview preparation behavioral questions STAR method ${jobTitle}`,
        agent: 'kyle',
        top_k: 5,
      });
      if (ragRes?.chunks?.length) {
        ragContext = (ragRes.chunks as Array<{ content: string }>)
          .map(c => c.content)
          .join('\n\n')
          .substring(0, 1000);
      }
    } catch { /* graceful degradation */ }

    // ── Simon's company intel from AgentCollabInbox ──────────────────────────
    let companyIntel = '';

    try {
      const inboxItems: Record<string, unknown>[] = await db.AgentCollabInbox
        .filter({ from_agent: 'simon', to_agent: 'kyle' }, '-created_date', 5)
        .catch(() => []);

      const match = inboxItems.find(item =>
        companyName && (item.summary as string ?? '').toLowerCase().includes(companyName.toLowerCase())
      ) ?? inboxItems[0] ?? null;

      if (match?.highlights) {
        companyIntel = (match.highlights as string[]).join('\n');
      }
    } catch { /* graceful degradation */ }

    // ── Screening answers context ────────────────────────────────────────────
    const screeningAnswers = (app.screening_answers as Record<string, Record<string, string>>) ?? {};
    const screeningSummary = Object.entries(screeningAnswers)
      .slice(0, 5)
      .map(([q, v]) => `Q: ${q}\nA: ${v?.answer ?? String(v)}`)
      .join('\n\n');

    // ── Build prompt ─────────────────────────────────────────────────────────
    const onetContext = onetData ? JSON.stringify({
      work_styles:    onetData.work_styles,
      work_values:    onetData.work_values,
      riasec_profile: onetData.riasec_profile,
      tasks:          (onetData.tasks          as string[] ?? []).slice(0, 5),
      emerging_tasks: (onetData.emerging_tasks as string[] ?? []).slice(0, 3),
    }, null, 2) : 'Not available';

    const sections = [
      `You are Kyle, an elite career coach. Generate a comprehensive, personalized interview preparation guide.`,
      `Do NOT fabricate resume experience. Reference only what is provided below.`,
      ``,
      `JOB: ${jobTitle || 'Not specified'} at ${companyName || 'Not specified'}`,
      jdText     ? `JOB DESCRIPTION:\n${jdText.substring(0, 1500)}`              : '',
      resumeText ? `CANDIDATE RESUME:\n${resumeText.substring(0, 1800)}`         : '',
      companyIntel   ? `COMPANY INTEL (from Simon):\n${companyIntel}`            : '',
      screeningSummary ? `SCREENING ANSWERS SUBMITTED:\n${screeningSummary}`     : '',
      `O*NET PROFILE:\n${onetContext}`,
      ragContext ? `KNOWLEDGE BASE CONTEXT:\n${ragContext}`                       : '',
      ``,
      `Generate 8–12 likely_questions, 3–4 items per questions_to_ask category, 3 STAR templates, 10–12 checklist items.`,
    ].filter(Boolean).join('\n\n');

    // ── Call LLM ─────────────────────────────────────────────────────────────
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: sections,
      response_json_schema: {
        type: 'object',
        properties: {
          likely_questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question:          { type: 'string' },
                category:          { type: 'string' },
                why_they_ask:      { type: 'string' },
                best_answer_guide: { type: 'string' },
                star_hook:         { type: 'string' },
              },
            },
          },
          questions_to_ask: {
            type: 'object',
            properties: {
              strategic:     { type: 'array', items: { type: 'string' } },
              narrative:     { type: 'array', items: { type: 'string' } },
              value_driving: { type: 'array', items: { type: 'string' } },
              insightful:    { type: 'array', items: { type: 'string' } },
            },
          },
          star_templates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                scenario:      { type: 'string' },
                situation:     { type: 'string' },
                task:          { type: 'string' },
                action:        { type: 'string' },
                result:        { type: 'string' },
                coaching_note: { type: 'string' },
              },
            },
          },
          preparation_checklist: { type: 'array', items: { type: 'string' } },
          onet_context: {
            type: 'object',
            properties: {
              work_styles_to_demonstrate: { type: 'array', items: { type: 'string' } },
              role_values_alignment:      { type: 'array', items: { type: 'string' } },
              riasec_fit:                 { type: 'string' },
            },
          },
        },
      },
    });

    // ── Persist to Application entity ─────────────────────────────────────────
    await db.Application.update(app.id as string, {
      interview_prep: aiResponse,
    }).catch((e: unknown) => console.error('[generateInterviewPrep] Application update failed:', e));

    return Response.json({ interview_prep: aiResponse });

  } catch (error) {
    console.error('[generateInterviewPrep] Unhandled error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
