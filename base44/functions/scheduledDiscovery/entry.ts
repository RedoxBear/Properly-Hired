import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * scheduledDiscovery — Scheduled automation wrapper for discoverJobs.
 *
 * Iterates over all users who have UserPreferences with target_roles set
 * and job_search_status = "actively_looking". For each user, invokes
 * discoverJobs with their preferred search queries and locations.
 *
 * Designed to be called by a scheduled automation (e.g. daily at 7am PST).
 * Admin-only: verifies the caller is an admin.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const UserPreferences = base44.asServiceRole.entities.UserPreferences;
    const allPrefs = await UserPreferences.list('-created_date', 200);

    const activePrefs = allPrefs.filter(
      (p) => p.job_search_status === 'actively_looking' && p.target_roles?.length > 0
    );

    if (activePrefs.length === 0) {
      return Response.json({
        success: true,
        message: 'No active job seekers with target roles configured.',
        users_processed: 0,
      });
    }

    const results = [];

    for (const pref of activePrefs) {
      const userId = pref.created_by;
      const locations = pref.location_preferences?.preferred_locations || [''];
      const remoteOnly = pref.location_preferences?.remote_preference === 'remote_only';

      for (const role of pref.target_roles.slice(0, 3)) {
        const location = locations[0] || '';

        try {
          const resp = await base44.asServiceRole.functions.invoke('discoverJobs', {
            user_id: userId,
            search_query: role,
            location,
            remote_only: remoteOnly,
          });

          results.push({
            user: userId,
            query: role,
            location,
            success: true,
            new_listings: resp?.new_listings ?? 0,
            high_match: resp?.high_match ?? 0,
          });

          console.log(`[scheduledDiscovery] ${userId} — "${role}" in "${location}" → ${resp?.new_listings ?? 0} new`);
        } catch (e) {
          results.push({
            user: userId,
            query: role,
            location,
            success: false,
            error: e.message,
          });
          console.error(`[scheduledDiscovery] ${userId} — "${role}" failed:`, e.message);
        }
      }
    }

    const totalNew = results.filter(r => r.success).reduce((sum, r) => sum + (r.new_listings || 0), 0);
    const totalHigh = results.filter(r => r.success).reduce((sum, r) => sum + (r.high_match || 0), 0);

    // Send email notification for high-match jobs if any found
    if (totalHigh > 0) {
      for (const pref of activePrefs) {
        const notify = pref.notification_settings?.email_high_score_matches !== false;
        if (!notify) continue;

        const userResults = results.filter(r => r.user === pref.created_by && r.success && r.high_match > 0);
        if (userResults.length === 0) continue;

        const totalUserHigh = userResults.reduce((sum, r) => sum + (r.high_match || 0), 0);

        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: pref.created_by,
            subject: `🎯 ${totalUserHigh} high-match job${totalUserHigh > 1 ? 's' : ''} found!`,
            body: `<h2>New High-Match Jobs Discovered</h2>
<p>Our automated job discovery found <strong>${totalUserHigh}</strong> jobs scoring 80+ that match your profile.</p>
<p>Searches run: ${userResults.map(r => `"${r.query}"`).join(', ')}</p>
<p>Log in to review these matches in your <strong>Review Queue</strong>.</p>
<br/>
<p style="color:#666;font-size:12px;">Properly Hired — AI Career Navigation</p>`,
          });
        } catch (emailErr) {
          console.warn(`[scheduledDiscovery] Email to ${pref.created_by} failed:`, emailErr.message);
        }
      }
    }

    return Response.json({
      success: true,
      users_processed: activePrefs.length,
      searches_run: results.length,
      total_new_listings: totalNew,
      total_high_match: totalHigh,
      details: results,
    });

  } catch (error) {
    console.error('[scheduledDiscovery] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});