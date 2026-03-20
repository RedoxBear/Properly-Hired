import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

function detectATS(url) {
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

function parseGreenhouseUrl(url) {
  const m = url.match(/greenhouse\.io\/([^/?#]+)\/jobs\/(\d+)/);
  if (m) return { boardToken: m[1], jobId: m[2] };
  return null;
}

function parseLeverUrl(url) {
  const m = url.match(/lever\.co\/[^/?#]+\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (m) return { postingId: m[1] };
  return null;
}

function buildAutofillPacket(vault, resumeVersion, jobListing) {
  const personal = vault?.personal ?? {};
  const atsProfile = vault?.ats_profile ?? {};
  const fullName = personal.full_name ?? '';
  const nameParts = fullName.trim().split(/\s+/);
  return {
    first_name: nameParts[0] ?? '',
    last_name: nameParts.slice(1).join(' ') ?? '',
    full_name: fullName,
    email: personal.email ?? '',
    phone: personal.phone ?? '',
    location: personal.location ?? '',
    linkedin: atsProfile.linkedin ?? '',
    portfolio: atsProfile.portfolio ?? '',
    github: atsProfile.github ?? '',
    work_authorization: atsProfile.work_authorization ?? '',
    sponsorship_needed: atsProfile.sponsorship_needed ?? 'no',
    salary_expectation: atsProfile.salary_expectation ?? '',
    remote_preference: atsProfile.remote_preference ?? '',
    notice_period: atsProfile.notice_period ?? '',
    willing_to_travel: atsProfile.willing_to_travel ?? '',
    clearance_level: atsProfile.clearance_level ?? '',
    cover_letter: resumeVersion?.cover_letter_text ?? '',
    resume_filename: resumeVersion?.docx_filename ?? '',
    apply_url: jobListing.url ?? '',
    role: jobListing.title ?? '',
    company: jobListing.company ?? '',
  };
}

async function submitGreenhouse(boardToken, jobId, packet, resumeVersion) {
  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}/applications`;
  const form = new FormData();
  form.append('first_name', packet.first_name ?? '');
  form.append('last_name', packet.last_name ?? '');
  form.append('email', packet.email ?? '');
  if (packet.phone) form.append('phone', packet.phone);
  if (packet.linkedin) form.append('website', packet.linkedin);
  if (resumeVersion?.docx_base64) {
    try {
      const bytes = Uint8Array.from(atob(resumeVersion.docx_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      form.append('resume', blob, resumeVersion.docx_filename ?? 'resume.docx');
    } catch { console.warn('[fillApplication] Resume blob failed'); }
  }
  if (packet.cover_letter) {
    form.append('cover_letter', new Blob([packet.cover_letter], { type: 'text/plain' }), 'cover_letter.txt');
  }
  console.log(`[fillApplication] Greenhouse: ${boardToken}/jobs/${jobId}`);
  const resp = await fetch(apiUrl, { method: 'POST', body: form });
  if (resp.ok || resp.status === 200 || resp.status === 201) {
    return { success: true, confirmation: `Submitted via Greenhouse boards API (${boardToken}/${jobId})` };
  }
  const err = (await resp.text().catch(() => '')).substring(0, 300);
  if (resp.status === 401 || resp.status === 403) {
    return { success: false, error: `manual_required: Greenhouse board requires Authorization-Key (${resp.status}). Use autofill packet.` };
  }
  return { success: false, error: `Greenhouse API ${resp.status}: ${err}` };
}

async function submitLever(postingId, packet, resumeVersion) {
  const apiUrl = `https://api.lever.co/v0/postings/${postingId}/apply`;
  const form = new FormData();
  form.append('name', packet.full_name ?? '');
  form.append('email', packet.email ?? '');
  if (packet.phone) form.append('phone', packet.phone);
  if (packet.cover_letter) form.append('comments', packet.cover_letter);
  if (resumeVersion?.docx_base64) {
    try {
      const bytes = Uint8Array.from(atob(resumeVersion.docx_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      form.append('resume', blob, resumeVersion.docx_filename ?? 'resume.docx');
    } catch { console.warn('[fillApplication] Resume blob failed'); }
  }
  console.log(`[fillApplication] Lever: ${postingId}`);
  const resp = await fetch(apiUrl, { method: 'POST', body: form });
  if (resp.ok || resp.status === 200 || resp.status === 201) {
    return { success: true, confirmation: `Submitted via Lever job board API (${postingId})` };
  }
  const err = (await resp.text().catch(() => '')).substring(0, 300);
  if (resp.status === 404) return { success: false, error: `manual_required: Lever posting not found or closed. Use autofill packet.` };
  if (resp.status === 401 || resp.status === 403) return { success: false, error: `manual_required: Lever posting requires auth. Use autofill packet.` };
  return { success: false, error: `Lever API ${resp.status}: ${err}` };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { user_id = user.id, job_listing_id, resume_version_id } = body;
    if (!job_listing_id) return Response.json({ error: 'job_listing_id is required' }, { status: 400 });

    const JobListing = base44.asServiceRole.entities.JobListing;
    const ResumeVersion = base44.asServiceRole.entities.ResumeVersion;
    const AutofillVault = base44.asServiceRole.entities.AutofillVault;
    const ApplicationEvent = base44.asServiceRole.entities.ApplicationEvent;

    let jobListing = null;
    try { jobListing = await JobListing.get(job_listing_id) ?? null; }
    catch { const r = await JobListing.filter({ id: job_listing_id }).catch(() => []); jobListing = r?.[0] ?? null; }
    if (!jobListing) return Response.json({ error: 'Job listing not found' }, { status: 404 });

    let resumeVersion = null;
    if (resume_version_id) {
      try { resumeVersion = await ResumeVersion.get(resume_version_id) ?? null; }
      catch { const r = await ResumeVersion.filter({ id: resume_version_id }).catch(() => []); resumeVersion = r?.[0] ?? null; }
    }
    if (!resumeVersion) {
      const rows = await ResumeVersion.filter({ user_id, job_listing_id }).catch(() => []);
      resumeVersion = rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null;
    }

    const vaultRows = await AutofillVault.filter({ user_id }).catch(() => []);
    const vault = vaultRows?.[0] ?? null;

    const autofillPacket = buildAutofillPacket(vault, resumeVersion, jobListing);
    const jobUrl = jobListing.url ?? jobListing.apply_url ?? '';
    const atsType = detectATS(jobUrl);
    console.log(`[fillApplication] ATS: ${atsType} | ${jobUrl.substring(0, 80)}`);

    let submitResult;
    if (atsType === 'greenhouse') {
      const parsed = parseGreenhouseUrl(jobUrl);
      submitResult = parsed
        ? await submitGreenhouse(parsed.boardToken, parsed.jobId, autofillPacket, resumeVersion)
        : { success: false, error: 'manual_required: Could not parse Greenhouse URL. Use autofill packet.' };
    } else if (atsType === 'lever') {
      const parsed = parseLeverUrl(jobUrl);
      submitResult = parsed
        ? await submitLever(parsed.postingId, autofillPacket, resumeVersion)
        : { success: false, error: 'manual_required: Could not parse Lever posting ID. Use autofill packet.' };
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
      event_type: finalStatus,
      ats_type: atsType,
      notes: submitResult.confirmation ?? submitResult.error ?? '',
      created_at: new Date().toISOString(),
    }).catch((e) => console.error('[fillApplication] ApplicationEvent failed:', e));

    const updatePayload = { status: finalStatus };
    if (finalStatus === 'applied') updatePayload.applied_at = new Date().toISOString();
    await JobListing.update(job_listing_id, updatePayload).catch((e) => console.error('[fillApplication] JobListing update failed:', e));

    const { cover_letter: _cl, ...safePacket } = autofillPacket;
    return Response.json({
      success: submitResult.success,
      status: finalStatus,
      ats_type: atsType,
      job_listing_id,
      resume_version_id: resumeVersion?.id ?? null,
      confirmation: submitResult.confirmation ?? null,
      error: submitResult.error ?? null,
      autofill_packet: safePacket,
      cover_letter: autofillPacket.cover_letter ?? '',
    });

  } catch (err) {
    console.error('[fillApplication] Error:', err);
    return Response.json({ error: 'Internal server error', detail: String(err) }, { status: 500 });
  }
});