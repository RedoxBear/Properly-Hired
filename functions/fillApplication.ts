import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * fillApplication — Phase 3: Autonomous Form Filling
 *
 * Detects the ATS platform from the job URL, attempts automatic API
 * submission for supported platforms (Greenhouse, Lever), and returns
 * a pre-filled autofill packet for manual submission on unsupported
 * platforms (Workday, SmartRecruiters, etc.).
 *
 * Body params:
 *   user_id           (string) — defaults to authenticated user
 *   job_listing_id    (string, required)
 *   resume_version_id (string) — latest version used if omitted
 *
 * Returns:
 *   { success, status, ats_type, confirmation, error, autofill_packet }
 *
 * Statuses:
 *   applied           — API submission succeeded
 *   manual_required   — ATS not supported; autofill_packet provided
 *   application_error — API submission attempted but failed
 */

// ─── ATS Detection ────────────────────────────────────────────────────────────

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

// Extract board token + job ID from Greenhouse URL
// Patterns: boards.greenhouse.io/{token}/jobs/{id}
//           jobs.greenhouse.io/{token}/jobs/{id}
//           {company}.greenhouse.io/jobs/{id}
function parseGreenhouseUrl(url: string): { boardToken: string; jobId: string } | null {
  const m1 = url.match(/greenhouse\.io\/([^/?#]+)\/jobs\/(\d+)/);
  if (m1) return { boardToken: m1[1], jobId: m1[2] };
  return null;
}

// Extract posting ID (UUID) from Lever URL
// Pattern: jobs.lever.co/{company}/{uuid}
function parseLeverUrl(url: string): { postingId: string } | null {
  const m = url.match(/lever\.co\/[^/?#]+\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (m) return { postingId: m[1] };
  return null;
}

// ─── Autofill Packet ──────────────────────────────────────────────────────────

function buildAutofillPacket(
  vault: Record<string, unknown> | null,
  resumeVersion: Record<string, unknown> | null,
  jobListing: Record<string, unknown>,
): Record<string, unknown> {
  const personal = (vault?.personal as Record<string, string>) ?? {};
  const atsProfile = (vault?.ats_profile as Record<string, string>) ?? {};

  const fullName = personal.full_name ?? '';
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') ?? '';

  return {
    first_name:          firstName,
    last_name:           lastName,
    full_name:           fullName,
    email:               personal.email ?? '',
    phone:               personal.phone ?? '',
    location:            personal.location ?? '',
    linkedin:            atsProfile.linkedin ?? '',
    portfolio:           atsProfile.portfolio ?? '',
    github:              atsProfile.github ?? '',
    work_authorization:  atsProfile.work_authorization ?? '',
    sponsorship_needed:  atsProfile.sponsorship_needed ?? 'no',
    salary_expectation:  atsProfile.salary_expectation ?? '',
    remote_preference:   atsProfile.remote_preference ?? '',
    notice_period:       atsProfile.notice_period ?? '',
    willing_to_travel:   atsProfile.willing_to_travel ?? '',
    clearance_level:     atsProfile.clearance_level ?? '',
    cover_letter:        (resumeVersion?.cover_letter_text as string) ?? '',
    resume_filename:     (resumeVersion?.docx_filename as string) ?? '',
    apply_url:           (jobListing.url as string) ?? '',
    role:                (jobListing.title as string) ?? '',
    company:             (jobListing.company as string) ?? '',
  };
}

// ─── Greenhouse Submission ────────────────────────────────────────────────────

async function submitGreenhouse(
  boardToken: string,
  jobId: string,
  packet: Record<string, unknown>,
  resumeVersion: Record<string, unknown> | null,
): Promise<{ success: boolean; confirmation?: string; error?: string }> {
  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}/applications`;
  const form = new FormData();

  form.append('first_name', String(packet.first_name ?? ''));
  form.append('last_name',  String(packet.last_name ?? ''));
  form.append('email',      String(packet.email ?? ''));
  if (packet.phone)    form.append('phone',    String(packet.phone));
  if (packet.linkedin) form.append('website',  String(packet.linkedin));

  // Resume — DOCX as base64-decoded binary
  const docxBase64 = resumeVersion?.docx_base64 as string | undefined;
  const docxFilename = (resumeVersion?.docx_filename as string) ?? 'resume.docx';
  if (docxBase64) {
    try {
      const bytes = Uint8Array.from(atob(docxBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      form.append('resume', blob, docxFilename);
    } catch {
      // Resume attachment failed — continue without it (some boards still accept)
      console.warn('[fillApplication] Failed to attach resume blob');
    }
  }

  // Cover letter as plain text file
  const coverLetter = packet.cover_letter as string | undefined;
  if (coverLetter) {
    const clBlob = new Blob([coverLetter], { type: 'text/plain' });
    form.append('cover_letter', clBlob, 'cover_letter.txt');
  }

  console.log(`[fillApplication] Submitting to Greenhouse: ${boardToken}/jobs/${jobId}`);
  const resp = await fetch(apiUrl, { method: 'POST', body: form });

  if (resp.ok || resp.status === 201 || resp.status === 200) {
    return { success: true, confirmation: `Submitted via Greenhouse job board API (${boardToken}/${jobId})` };
  }

  const errBody = await resp.text().catch(() => '');
  const errSnippet = errBody.substring(0, 300);

  // 401 / 403 = this board requires an auth token we don't have
  if (resp.status === 401 || resp.status === 403) {
    return {
      success: false,
      error: `manual_required: Greenhouse board requires Authorization-Key (${resp.status}). Use autofill packet to apply manually.`,
    };
  }

  return { success: false, error: `Greenhouse API ${resp.status}: ${errSnippet}` };
}

// ─── Lever Submission ─────────────────────────────────────────────────────────

async function submitLever(
  postingId: string,
  packet: Record<string, unknown>,
  resumeVersion: Record<string, unknown> | null,
): Promise<{ success: boolean; confirmation?: string; error?: string }> {
  const apiUrl = `https://api.lever.co/v0/postings/${postingId}/apply`;
  const form = new FormData();

  form.append('name',  String(packet.full_name ?? ''));
  form.append('email', String(packet.email ?? ''));
  if (packet.phone)        form.append('phone',    String(packet.phone));
  if (packet.cover_letter) form.append('comments', String(packet.cover_letter));

  // Resume
  const docxBase64 = resumeVersion?.docx_base64 as string | undefined;
  const docxFilename = (resumeVersion?.docx_filename as string) ?? 'resume.docx';
  if (docxBase64) {
    try {
      const bytes = Uint8Array.from(atob(docxBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      form.append('resume', blob, docxFilename);
    } catch {
      console.warn('[fillApplication] Failed to attach resume blob for Lever');
    }
  }

  console.log(`[fillApplication] Submitting to Lever posting: ${postingId}`);
  const resp = await fetch(apiUrl, { method: 'POST', body: form });

  if (resp.ok || resp.status === 200 || resp.status === 201) {
    return { success: true, confirmation: `Submitted via Lever job board API (${postingId})` };
  }

  const errBody = await resp.text().catch(() => '');
  const errSnippet = errBody.substring(0, 300);

  if (resp.status === 404) {
    return {
      success: false,
      error: `manual_required: Lever posting not found or closed. Use autofill packet to apply manually.`,
    };
  }
  if (resp.status === 401 || resp.status === 403) {
    return {
      success: false,
      error: `manual_required: Lever posting requires authentication. Use autofill packet to apply manually.`,
    };
  }

  return { success: false, error: `Lever API ${resp.status}: ${errSnippet}` };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { user_id = user.id, job_listing_id, resume_version_id } = body;

    if (!job_listing_id) {
      return Response.json({ error: 'job_listing_id is required' }, { status: 400 });
    }

    const JobListing      = base44.asServiceRole.entities.JobListing;
    const ResumeVersion   = base44.asServiceRole.entities.ResumeVersion;
    const AutofillVault   = base44.asServiceRole.entities.AutofillVault;
    const ApplicationEvent = base44.asServiceRole.entities.ApplicationEvent;

    // ── Load JobListing ──
    let jobListing: Record<string, unknown> | null = null;
    try {
      jobListing = (await JobListing.get(job_listing_id)) ?? null;
    } catch {
      const rows = await JobListing.filter({ id: job_listing_id }).catch(() => []);
      jobListing = rows?.[0] ?? null;
    }
    if (!jobListing) return Response.json({ error: 'Job listing not found' }, { status: 404 });

    // ── Load ResumeVersion ──
    let resumeVersion: Record<string, unknown> | null = null;
    if (resume_version_id) {
      try {
        resumeVersion = (await ResumeVersion.get(resume_version_id)) ?? null;
      } catch {
        const rows = await ResumeVersion.filter({ id: resume_version_id }).catch(() => []);
        resumeVersion = rows?.[0] ?? null;
      }
    }
    // Fallback: latest version for this listing
    if (!resumeVersion) {
      const rows: Record<string, unknown>[] = await ResumeVersion
        .filter({ user_id, job_listing_id })
        .catch(() => []);
      resumeVersion = rows
        .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())[0]
        ?? null;
    }

    // ── Load AutofillVault ──
    const vaultRows = await AutofillVault.filter({ user_id }).catch(() => []);
    const vault: Record<string, unknown> | null = vaultRows?.[0] ?? null;

    // ── Build autofill packet ──
    const autofillPacket = buildAutofillPacket(vault, resumeVersion, jobListing);

    // ── Detect ATS ──
    const jobUrl = (jobListing.url ?? jobListing.apply_url ?? '') as string;
    const atsType = detectATS(jobUrl);
    console.log(`[fillApplication] ATS: ${atsType} | URL: ${jobUrl.substring(0, 80)}`);

    // ── Attempt submission ──
    let submitResult: { success: boolean; confirmation?: string; error?: string };

    if (atsType === 'greenhouse') {
      const parsed = parseGreenhouseUrl(jobUrl);
      if (parsed) {
        submitResult = await submitGreenhouse(parsed.boardToken, parsed.jobId, autofillPacket, resumeVersion);
      } else {
        submitResult = { success: false, error: 'manual_required: Could not parse Greenhouse URL. Use autofill packet.' };
      }
    } else if (atsType === 'lever') {
      const parsed = parseLeverUrl(jobUrl);
      if (parsed) {
        submitResult = await submitLever(parsed.postingId, autofillPacket, resumeVersion);
      } else {
        submitResult = { success: false, error: 'manual_required: Could not parse Lever posting ID. Use autofill packet.' };
      }
    } else {
      // Workday, SmartRecruiters, iCIMS, Taleo, other
      const label = atsType === 'other' ? 'this ATS' : atsType.charAt(0).toUpperCase() + atsType.slice(1);
      submitResult = {
        success: false,
        error: `manual_required: ${label} does not support automated API submission. Use the autofill packet below to apply manually.`,
      };
    }

    // ── Resolve final status ──
    let finalStatus: string;
    if (submitResult.success) {
      finalStatus = 'applied';
    } else if (submitResult.error?.startsWith('manual_required')) {
      finalStatus = 'manual_required';
    } else {
      finalStatus = 'application_error';
    }

    // ── Create ApplicationEvent ──
    await ApplicationEvent.create({
      user_id,
      job_listing_id,
      resume_version_id: resumeVersion?.id ?? null,
      event_type:        finalStatus,
      ats_type:          atsType,
      notes:             submitResult.confirmation ?? submitResult.error ?? '',
      created_at:        new Date().toISOString(),
    }).catch((e: unknown) => console.error('[fillApplication] ApplicationEvent create failed:', e));

    // ── Update JobListing ──
    const updatePayload: Record<string, unknown> = { status: finalStatus };
    if (finalStatus === 'applied') {
      updatePayload.applied_at = new Date().toISOString();
    }
    await JobListing.update(job_listing_id, updatePayload).catch(
      (e: unknown) => console.error('[fillApplication] JobListing update failed:', e),
    );

    // Strip binary from response
    const { cover_letter: _cl, ...safePacket } = autofillPacket as Record<string, unknown>;

    return Response.json({
      success:           submitResult.success,
      status:            finalStatus,
      ats_type:          atsType,
      job_listing_id,
      resume_version_id: resumeVersion?.id ?? null,
      confirmation:      submitResult.confirmation ?? null,
      error:             submitResult.error ?? null,
      // Always return autofill packet — used for both manual fallback and record-keeping
      autofill_packet:   safePacket,
      // Include cover letter separately so ReviewQueue can display it
      cover_letter:      autofillPacket.cover_letter ?? '',
    });

  } catch (err) {
    console.error('[fillApplication] Unhandled error:', err);
    return Response.json({ error: 'Internal server error', detail: String(err) }, { status: 500 });
  }
});
