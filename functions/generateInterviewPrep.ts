import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, job_application_id } = await req.json();

    if (!job_application_id) {
      return Response.json({ error: 'job_application_id is required' }, { status: 400 });
    }

    // === FETCH action: return cached prep ===
    if (action === 'fetch') {
      const app = await base44.entities.JobApplication.get(job_application_id);
      return Response.json({ interview_prep: app?.summary?.interview_prep ?? null });
    }

    // === GENERATE action ===
    if (action !== 'generate') {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const app = await base44.entities.JobApplication.get(job_application_id);
    if (!app) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    const { summary = {}, job_title, company_name, job_description } = app;
    const simonBrief = summary?.simon_brief;

    // Fetch ONetProfile if soc_code available
    let onetData = null;
    if (simonBrief?.soc_code) {
      try {
        const profiles = await base44.asServiceRole.entities.ONetProfile.filter(
          { onet_soc_code: simonBrief.soc_code }, '-created_date', 1
        );
        onetData = profiles?.[0] ?? null;
      } catch (e) { /* graceful degradation */ }
    }

    // If no ONetProfile from simon_brief, try by job title
    if (!onetData && job_title) {
      try {
        const res = await base44.functions.invoke('getONetProfile', { role_title: job_title });
        if (res?.profile) onetData = res.profile;
      } catch (e) { /* graceful degradation */ }
    }

    // Fetch optimized resume if available
    let resumeText = '';
    if (app.optimized_resume_id) {
      try {
        const resume = await base44.entities.Resume.get(app.optimized_resume_id);
        resumeText = resume?.optimized_content || resume?.parsed_content || '';
      } catch (e) { /* graceful degradation */ }
    }

    // RAG context
    let ragContext = '';
    try {
      const ragRes = await base44.functions.invoke('ragRetrieve', {
        query: `interview preparation behavioral questions ${job_title}`,
        agent: 'kyle',
        top_k: 5
      });
      if (ragRes?.chunks?.length) {
        ragContext = ragRes.chunks.map(c => c.content).join('\n\n');
      }
    } catch (e) { /* graceful degradation */ }

    // Build AI prompt
    const systemPrompt = `You are Kyle, an elite career coach and interview strategist.
Your task is to generate a comprehensive, personalized interview preparation guide.
Output MUST be valid JSON matching the schema exactly.`;

    const onetContext = onetData ? JSON.stringify({
      work_styles: onetData.work_styles,
      work_values: onetData.work_values,
      riasec_profile: onetData.riasec_profile,
      tasks: (onetData.tasks || []).slice(0, 5),
      emerging_tasks: (onetData.emerging_tasks || []).slice(0, 3)
    }, null, 2) : 'Not available';

    const userPrompt = `Generate an interview prep guide for this candidate:

JOB: ${job_title} at ${company_name}
JD: ${(job_description || '').slice(0, 2000) || 'Not provided'}

SIMON'S STRATEGIC BRIEF:
${simonBrief ? JSON.stringify(simonBrief, null, 2) : 'Not available'}

CANDIDATE'S OPTIMIZED RESUME:
${(resumeText || '').slice(0, 2000) || 'Not available'}

O*NET PROFILE:
${onetContext}

KNOWLEDGE BASE CONTEXT:
${ragContext || 'Not available'}

Output a JSON object with EXACTLY this structure:
{
  "likely_questions": [
    {
      "question": "string",
      "category": "behavioral|situational|technical|culture",
      "why_they_ask": "string",
      "best_answer_guide": "string (reference resume bullets)",
      "star_hook": "string (specific story anchor from resume)"
    }
  ],
  "questions_to_ask": {
    "strategic": ["string"],
    "narrative": ["string"],
    "value_driving": ["string"],
    "insightful": ["string"]
  },
  "star_templates": [
    {
      "scenario": "string",
      "situation": "string",
      "task": "string",
      "action": "string",
      "result": "string",
      "coaching_note": "string"
    }
  ],
  "preparation_checklist": ["string"],
  "onet_context": {
    "work_styles_to_demonstrate": ["string"],
    "role_values_alignment": ["string"],
    "riasec_fit": "string"
  }
}

Generate 8-12 likely_questions, 3-4 items per questions_to_ask category, 3 star_templates, 10-12 checklist items.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      response_json_schema: {
        type: 'object',
        properties: {
          likely_questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                category: { type: 'string' },
                why_they_ask: { type: 'string' },
                best_answer_guide: { type: 'string' },
                star_hook: { type: 'string' }
              }
            }
          },
          questions_to_ask: {
            type: 'object',
            properties: {
              strategic: { type: 'array', items: { type: 'string' } },
              narrative: { type: 'array', items: { type: 'string' } },
              value_driving: { type: 'array', items: { type: 'string' } },
              insightful: { type: 'array', items: { type: 'string' } }
            }
          },
          star_templates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                scenario: { type: 'string' },
                situation: { type: 'string' },
                task: { type: 'string' },
                action: { type: 'string' },
                result: { type: 'string' },
                coaching_note: { type: 'string' }
              }
            }
          },
          preparation_checklist: { type: 'array', items: { type: 'string' } },
          onet_context: {
            type: 'object',
            properties: {
              work_styles_to_demonstrate: { type: 'array', items: { type: 'string' } },
              role_values_alignment: { type: 'array', items: { type: 'string' } },
              riasec_fit: { type: 'string' }
            }
          }
        }
      }
    });

    const interviewPrep = aiResponse;

    // Persist to JobApplication.summary.interview_prep
    await base44.asServiceRole.entities.JobApplication.update(job_application_id, {
      summary: { ...summary, interview_prep: interviewPrep }
    });

    return Response.json({ interview_prep: interviewPrep });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});