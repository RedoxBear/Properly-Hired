import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body = {};
  try {
    body = await req.json();
  } catch (_e) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const jobUrl = body.job_url || '';
  const atsType = body.ats_type || 'other';
  const autofillPacket = body.autofill_packet || {};

  const BRIGHT_WS = Deno.env.get('BRIGHTDATA_BROWSER_WS');
  if (!BRIGHT_WS) {
    return Response.json({
      success: false,
      status: 'manual_required',
      flagged_reason: 'Browser automation not configured (missing BRIGHTDATA_BROWSER_WS)',
      autofill_packet: autofillPacket,
      ats_type: atsType,
      job_url: jobUrl,
    });
  }

  console.log('[browserFill] ATS:', atsType, '| URL:', jobUrl.substring(0, 80));

  return Response.json({
    success: false,
    status: 'manual_required',
    note: 'Browser-based ATS filling is queued. Use the autofill packet to apply manually.',
    flagged_reason: 'Browser fill pending — apply manually using the provided autofill data.',
    autofill_packet: autofillPacket,
    ats_type: atsType,
    job_url: jobUrl,
  });
});