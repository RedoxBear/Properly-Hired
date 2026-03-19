import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * orchestrateTailoring — Full ATS-safe resume tailoring pipeline
 * 
 * Accepts a JobListing ID (or job_listing_id) and optionally a base_resume_id.
 * Steps:
 *   1. Load the JobListing and user's master resume
 *   2. Extract keywords from the JD
 *   3. Call InvokeLLM to tailor the resume text for ATS
 *   4. Score the tailored version
 *   5. Create a ResumeVersion record
 *   6. Log an ApplicationEvent
 */

function extractKeywords(text) {
  const stopwords = new Set(['the','and','or','of','in','a','an','to','for','with','on','at','by','is','are','be','was','were','has','have','this','that','which','from','as','it','its','we','our','you','your','their','will','can','may','should','must','not','no','if','but','so','than','then','when','where','how','what','who','also','would','could','about','into','over','after','before','between','through','during','under','above','below','each','every','both','either','neither','such','own','same','other','another','these','those','all','any','some','most','more','less','few','only','very','just','now','even','still','already','yet']);
  return [...new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w))
  )];
}

function findKeywordGaps(resumeText, jdKeywords) {
  const resumeKw = new Set(extractKeywords(resumeText));
  return jdKeywords.filter(kw => !resumeKw.has(kw));
}

function computeATSScore(tailoredText, jdKeywords) {
  if (!tailoredText || jdKeywords.length === 0) return 0;
  const tailoredKw = new Set(extractKeywords(tailoredText));
  const matched = jdKeywords.filter(kw => tailoredKw.has(kw));
  return Math.round((matched.length / jdKeywords.length) * 100);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { job_listing_id, base_resume_id } = body;

    if (!job_listing_id) {
      return Response.json({ error: 'job_listing_id is required' }, { status: 400 });
    }

    const JobListing = base44.asServiceRole.entities.JobListing;
    const Resume = base44.asServiceRole.entities.Resume;
    const ResumeVersion = base44.asServiceRole.entities.ResumeVersion;
    const ApplicationEvent = base44.asServiceRole.entities.ApplicationEvent;

    // 1. Load the job listing
    const listings = await JobListing.filter({ id: job_listing_id });
    const job = listings[0];
    if (!job) return Response.json({ error: 'JobListing not found' }, { status: 404 });

    // 2. Load the master resume
    let masterResume;
    if (base_resume_id) {
      const resumes = await Resume.filter({ id: base_resume_id });
      masterResume = resumes[0];
    }
    if (!masterResume) {
      const resumes = await Resume.filter({ created_by: user.email, is_master_resume: true });
      masterResume = resumes[0];
    }
    if (!masterResume) {
      return Response.json({ error: 'No master resume found. Please upload a resume first.' }, { status: 400 });
    }

    const resumeText = masterResume.parsed_content || masterResume.optimized_content || '';
    const jdText = job.jd_text || '';

    // 3. Extract JD keywords and find gaps
    const jdKeywords = extractKeywords(jdText);
    const gaps = findKeywordGaps(resumeText, jdKeywords);

    console.log(`[orchestrateTailoring] Job: ${job.title} at ${job.company}`);
    console.log(`[orchestrateTailoring] JD keywords: ${jdKeywords.length}, Gaps: ${gaps.length}`);

    // 4. Call LLM to tailor the resume
    const tailorPrompt = `You are an expert ATS resume optimizer. Your task is to tailor a resume to match a specific job description while maintaining authenticity and human-sounding language.

**TARGET JOB:**
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'}

**JOB DESCRIPTION:**
${jdText.substring(0, 4000)}

**KEYWORD GAPS TO ADDRESS (missing from resume but present in JD):**
${gaps.slice(0, 50).join(', ')}

**CURRENT RESUME CONTENT:**
${resumeText.substring(0, 6000)}

**INSTRUCTIONS:**
1. Rewrite the resume to naturally incorporate the missing keywords where truthful
2. Reorder and emphasize experience bullets that align with the JD requirements
3. Keep the tone professional and human — avoid robotic phrasing
4. Do NOT fabricate experience or skills the candidate doesn't have
5. Preserve all factual details (company names, dates, degrees)
6. Optimize the professional summary/objective for this specific role
7. Use action verbs that mirror the JD language

Return the full tailored resume text, ready to use.`;

    const tailoredResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: tailorPrompt,
    });

    const tailoredText = typeof tailoredResult === 'string' ? tailoredResult : (tailoredResult?.text || tailoredResult?.content || JSON.stringify(tailoredResult));

    // 5. Score the tailored version
    const atsScore = computeATSScore(tailoredText, jdKeywords);
    const gapsFilled = gaps.filter(kw => tailoredText.toLowerCase().includes(kw));
    const needsManualReview = atsScore < 70 || gapsFilled.length < gaps.length * 0.5;

    console.log(`[orchestrateTailoring] ATS Score: ${atsScore}, Gaps filled: ${gapsFilled.length}/${gaps.length}`);

    // 6. Check existing versions for version numbering
    const existingVersions = await ResumeVersion.filter({ 
      user_id: user.id, 
      job_listing_id: job_listing_id 
    }).catch(() => []);
    const versionNumber = existingVersions.length + 1;

    // 7. Create the ResumeVersion record
    const versionData = {
      user_id: user.id,
      job_listing_id: job_listing_id,
      base_resume_id: masterResume.id,
      resume_text: tailoredText,
      cover_letter_text: '',
      ats_score: atsScore,
      keyword_gaps: { total: gaps.length, filled: gapsFilled.length, remaining: gaps.filter(g => !gapsFilled.includes(g)) },
      keyword_gaps_filled: gapsFilled,
      simon_audit_passed: atsScore >= 75,
      audit_log: {
        jd_keywords_count: jdKeywords.length,
        gaps_found: gaps.length,
        gaps_filled: gapsFilled.length,
        ats_score: atsScore,
        tailored_at: new Date().toISOString(),
      },
      tailor_round: versionNumber,
      needs_manual_review: needsManualReview,
      version_number: versionNumber,
      created_at: new Date().toISOString(),
    };

    const createdVersion = await ResumeVersion.create(versionData);

    // 8. Log an ApplicationEvent
    await ApplicationEvent.create({
      application_id: job_listing_id,
      user_id: user.id,
      event_type: 'fill_complete',
      event_data: {
        resume_version_id: createdVersion.id,
        ats_score: atsScore,
        gaps_filled: gapsFilled.length,
        total_gaps: gaps.length,
        tailor_round: versionNumber,
      },
      created_at: new Date().toISOString(),
    });

    // 9. Update the JobListing status
    await JobListing.update(job.id, {
      status: needsManualReview ? 'needs_attention' : 'pending_review',
    });

    return Response.json({
      success: true,
      resume_version_id: createdVersion.id,
      ats_score: atsScore,
      keywords: { total_jd: jdKeywords.length, gaps_found: gaps.length, gaps_filled: gapsFilled.length },
      needs_manual_review: needsManualReview,
      tailor_round: versionNumber,
      status: needsManualReview ? 'needs_attention' : 'pending_review',
    });

  } catch (error) {
    console.error('[orchestrateTailoring] Unhandled error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});