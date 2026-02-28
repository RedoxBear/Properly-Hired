import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const targetEmail = "rxdhgatemyyshop@gmail.com";

  // All user-data entities that have created_by
  const entities = [
    "JobApplication",
    "Resume",
    "JobMatch",
    "CompanyResearch",
    "NetworkContact",
    "RecruiterMeeting",
    "AutofillVault",
    "UserPreferences",
    "Referral",
    "AgentFeedback",
    "EncouragementQuote"
  ];

  const results = {};

  for (const entityName of entities) {
    try {
      const records = await base44.asServiceRole.entities[entityName].filter({ created_by: targetEmail });
      let deleted = 0;
      for (const record of records) {
        await base44.asServiceRole.entities[entityName].delete(record.id);
        deleted++;
      }
      results[entityName] = { found: records.length, deleted };
    } catch (e) {
      results[entityName] = { error: e.message };
    }
  }

  return Response.json({ message: `Data reset for ${targetEmail}`, results });
});