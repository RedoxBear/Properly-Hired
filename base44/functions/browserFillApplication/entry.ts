import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * browserFillApplication — Browser-Based ATS Form Filling
 *
 * For ATS platforms that don't expose public APIs (Workday, iCIMS, Taleo,
 * SmartRecruiters, etc.), this function queues a browser automation task.
 *
 * Architecture:
 *   1. Receives autofill packet + job URL from fillApplication
 *   2. Creates an ApplicationEvent record with status "queued"
 *   3. If BRIGHTDATA_BROWSER_WS is configured, attempts a Bright Data
 *      Scraping Browser session to navigate and fill the form
 *   4. Returns status so fillApplication can decide next steps
 *
 * Body: { user_id, job_listing_id, job_url, ats_type, autofill_packet }
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    user_id = user.id,
    job_listing_id = '',
    job_url = '',
    ats_type = 'other',
    autofill_packet = {},
  } = body;

  const BRIGHT_WS = Deno.env.get('BRIGHTDATA_BROWSER_WS');

  // Log the queue event
  const ApplicationEvent = base44.asServiceRole.entities.ApplicationEvent;
  await ApplicationEvent.create({
    application_id: job_listing_id,
    user_id,
    event_type: 'manual_required',
    event_data: {
      ats_type,
      job_url: job_url.substring(0, 300),
      has_browser_ws: !!BRIGHT_WS,
      queued_at: new Date().toISOString(),
      autofill_fields: Object.keys(autofill_packet),
    },
    created_at: new Date().toISOString(),
  }).catch((e) => console.error('[browserFill] Event log failed:', e));

  if (!BRIGHT_WS) {
    console.log(`[browserFill] No BRIGHTDATA_BROWSER_WS — manual required for ${ats_type} | ${job_url.substring(0, 60)}`);
    return Response.json({
      success: false,
      status: 'manual_required',
      flagged_reason: `${ats_type.charAt(0).toUpperCase() + ats_type.slice(1)} requires manual application — browser automation not configured.`,
      autofill_packet,
      ats_type,
      job_url,
    });
  }

  // ── Bright Data Scraping Browser attempt ──
  // This uses the Scraping Browser WebSocket API to navigate and interact
  // with ATS pages. For complex multi-step forms (Workday, iCIMS), this
  // is a best-effort attempt that may still require human review.
  console.log(`[browserFill] Attempting Bright Data session for ${ats_type} | ${job_url.substring(0, 80)}`);

  try {
    // For now, use the Bright Data Web Scraper API to capture the form structure
    // Full Puppeteer-style automation requires an external worker process
    const scrapeResp = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('BRIGHTDATA_API_KEY')}`,
      },
      body: JSON.stringify({
        zone: 'scraping_browser',
        url: job_url,
        format: 'raw',
      }),
    });

    if (scrapeResp.ok) {
      const pageContent = await scrapeResp.text();
      const hasForm = /<form/i.test(pageContent);
      const hasApplyButton = /apply|submit.*application/i.test(pageContent);

      console.log(`[browserFill] Page captured — form:${hasForm} applyBtn:${hasApplyButton} size:${pageContent.length}`);

      // Log form detection result
      await ApplicationEvent.create({
        application_id: job_listing_id,
        user_id,
        event_type: 'manual_required',
        event_data: {
          phase: 'browser_capture',
          ats_type,
          has_form: hasForm,
          has_apply_button: hasApplyButton,
          page_size: pageContent.length,
          captured_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      }).catch(() => {});

      return Response.json({
        success: false,
        status: 'manual_required',
        note: `Form structure captured for ${ats_type}. Full browser automation requires external worker — use the autofill packet to apply manually.`,
        flagged_reason: `${ats_type} form detected (${hasForm ? 'form found' : 'no form'}) — apply manually with the provided data.`,
        autofill_packet,
        ats_type,
        job_url,
        form_detected: hasForm,
      });
    }

    console.warn(`[browserFill] Bright Data request failed: ${scrapeResp.status}`);
  } catch (e) {
    console.error(`[browserFill] Bright Data error:`, e.message);
  }

  // Fallback: couldn't reach Bright Data
  return Response.json({
    success: false,
    status: 'manual_required',
    flagged_reason: `Browser automation unavailable for ${ats_type} — apply manually using the provided autofill data.`,
    autofill_packet,
    ats_type,
    job_url,
  });
});