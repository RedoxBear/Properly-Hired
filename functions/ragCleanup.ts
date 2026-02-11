import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function retry(fn, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (err) {
      if (err?.message?.includes('Rate limit') && i < attempts) {
        await sleep(5000 * i); // Aggressive backoff for rate limits
        continue;
      }
      if (i === attempts) throw err;
      await sleep(2000 * i);
    }
  }
}

// Normalize a title to detect duplicates
// "kyle/How - Google - Works - - Eric - Schmidt.txt" and
// "kyle/How Google Works - Eric Schmidt, Jonathan Rosenberg.txt"
// should both normalize to something like "how google works eric schmidt"
function normalizeTitle(title) {
  // Extract agent prefix to keep it in the grouping key
  const agentMatch = title.match(/^(kyle|simon)\//i);
  const agentPrefix = agentMatch ? agentMatch[1].toLowerCase() : 'both';
  
  const normalized = title
    .toLowerCase()
    .replace(/^(kyle|simon)\//, '') // strip agent prefix for content matching
    .replace(/\.[^.]+$/, '')        // strip extension
    .replace(/[^a-z0-9]+/g, ' ')    // replace non-alphanumeric with spaces
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 2)
    // Remove common filler words for better matching
    .filter(w => !['the', 'and', 'for', 'how', 'what', 'novel', 'txt'].includes(w))
    .sort()
    .join(' ');
  
  return `${agentPrefix}:${normalized}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // ════════════════════════════════════════════════════════
    // AUDIT: Identify duplicates and issues without changing anything
    // ════════════════════════════════════════════════════════
    if (action === 'audit') {
      // Get all KB records (just metadata, not content)
      const kbRecords = [];
      let offset = 0;
      while (offset < 500) {
        let page;
        try {
          page = await retry(() =>
            base44.asServiceRole.entities.KnowledgeBase.list('created_date', 1, offset)
          );
        } catch (_) { offset++; continue; }
        if (!page?.length) break;
        const kb = page[0];
        kbRecords.push({
          id: kb.id,
          title: kb.title || `kb-${kb.id}`,
          category: kb.category,
          agent_access: kb.agent_access,
          content_length: typeof kb.content === 'string' ? kb.content.length : 0,
          normalized: normalizeTitle(kb.title || '')
        });
        page[0] = null;
        offset++;
        await sleep(100);
      }

      // Get all sources
      const sources = await retry(() =>
        base44.asServiceRole.entities.KnowledgeSource.list('-created_date', 500)
      ) || [];

      // Get chunk counts per agent
      const [kyleChunks, simonChunks, bothChunks] = await Promise.all([
        retry(() => base44.asServiceRole.entities.KnowledgeChunk.filter({ agent: 'kyle' }, '-created_date', 500)).catch(() => []),
        retry(() => base44.asServiceRole.entities.KnowledgeChunk.filter({ agent: 'simon' }, '-created_date', 500)).catch(() => []),
        retry(() => base44.asServiceRole.entities.KnowledgeChunk.filter({ agent: 'both' }, '-created_date', 500)).catch(() => []),
      ]);
      const totalChunks = (kyleChunks?.length || 0) + (simonChunks?.length || 0) + (bothChunks?.length || 0);

      // Find duplicate groups
      const groups = {};
      for (const kb of kbRecords) {
        if (!groups[kb.normalized]) groups[kb.normalized] = [];
        groups[kb.normalized].push(kb);
      }
      const duplicateGroups = Object.entries(groups)
        .filter(([, items]) => items.length > 1)
        .map(([key, items]) => ({
          normalized_key: key,
          count: items.length,
          records: items.map(i => ({ id: i.id, title: i.title, content_length: i.content_length }))
        }));

      // Find orphan sources (source_path doesn't match any KB title)
      const kbTitles = new Set(kbRecords.map(k => k.title));
      const orphanSources = sources.filter(s => !kbTitles.has(s.source_path));

      // Chunks without summaries (sample)
      const allChunks = [...(kyleChunks || []), ...(simonChunks || []), ...(bothChunks || [])];
      const noSummary = allChunks.filter(c => !c.summary || c.summary.length < 5);
      const tinyChunks = allChunks.filter(c => c.content && c.content.trim().length < 80);

      return Response.json({
        kb_records: kbRecords.length,
        sources: sources.length,
        total_chunks: totalChunks,
        chunks_by_agent: {
          kyle: kyleChunks?.length || 0,
          simon: simonChunks?.length || 0,
          both: bothChunks?.length || 0
        },
        duplicate_groups: duplicateGroups,
        duplicate_kb_count: duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0),
        orphan_sources: orphanSources.length,
        chunks_no_summary: noSummary.length,
        tiny_chunks: tinyChunks.length,
        recommendation: duplicateGroups.length > 0 
          ? `Found ${duplicateGroups.length} duplicate groups. Run 'deduplicate' to remove duplicate KB records, then 'nuke_chunks' to clear old chunks, then re-ingest.`
          : 'No duplicates found. Run nuke_chunks to clear old raw chunks, then re-ingest with condensation.'
      });
    }

    // ════════════════════════════════════════════════════════
    // DEDUPLICATE: Remove duplicate KnowledgeBase records
    // Keep the one with the longest content in each duplicate group
    // ════════════════════════════════════════════════════════
    if (action === 'deduplicate') {
      const kbRecords = [];
      let offset = 0;
      while (offset < 500) {
        let page;
        try {
          page = await retry(() =>
            base44.asServiceRole.entities.KnowledgeBase.list('created_date', 1, offset)
          );
        } catch (_) { offset++; continue; }
        if (!page?.length) break;
        const kb = page[0];
        kbRecords.push({
          id: kb.id,
          title: kb.title || `kb-${kb.id}`,
          content_length: typeof kb.content === 'string' ? kb.content.length : 0,
          normalized: normalizeTitle(kb.title || '')
        });
        page[0] = null;
        offset++;
        await sleep(100);
      }

      // Group by normalized title
      const groups = {};
      for (const kb of kbRecords) {
        if (!groups[kb.normalized]) groups[kb.normalized] = [];
        groups[kb.normalized].push(kb);
      }

      let deleted = 0;
      const deletedTitles = [];

      for (const [, items] of Object.entries(groups)) {
        if (items.length <= 1) continue;
        // Keep the one with the longest content
        items.sort((a, b) => b.content_length - a.content_length);
        const keeper = items[0];
        for (let i = 1; i < items.length; i++) {
          const dupe = items[i];
          // Delete the KB record
          await retry(() =>
            base44.asServiceRole.entities.KnowledgeBase.delete(dupe.id)
          );
          deletedTitles.push(dupe.title);
          deleted++;
          await sleep(300);
        }
      }

      return Response.json({
        success: true,
        duplicates_deleted: deleted,
        deleted_titles: deletedTitles,
        remaining_records: kbRecords.length - deleted
      });
    }

    // ════════════════════════════════════════════════════════
    // NUKE_CHUNKS: Delete ALL chunks and sources (but keep KB records)
    // This prepares for a clean re-ingest with the new condensation strategy
    // ════════════════════════════════════════════════════════
    if (action === 'nuke_chunks') {
      let dc = 0, ds = 0;

      // Delete all chunks in batches
      while (true) {
        const batch = await retry(() =>
          base44.asServiceRole.entities.KnowledgeChunk.list('created_date', 50)
        ).catch(() => []);
        if (!batch?.length) break;
        for (const c of batch) {
          await retry(() => base44.asServiceRole.entities.KnowledgeChunk.delete(c.id));
          dc++;
        }
        await sleep(500);
      }

      // Delete all sources
      const srcs = await retry(() =>
        base44.asServiceRole.entities.KnowledgeSource.list('created_date', 500)
      ).catch(() => []);
      for (const s of (srcs || [])) {
        await retry(() => base44.asServiceRole.entities.KnowledgeSource.delete(s.id));
        ds++;
        await sleep(200);
      }

      return Response.json({
        success: true,
        deleted_chunks: dc,
        deleted_sources: ds,
        next_step: 'All chunks and sources cleared. Now run ingestion from RAG Monitor to re-ingest with the new condensation strategy.'
      });
    }

    // ════════════════════════════════════════════════════════
    // FULL_CLEANUP: Deduplicate KB records + nuke chunks in one call
    // ════════════════════════════════════════════════════════
    if (action === 'full_cleanup') {
      // Step 1: Deduplicate KB records
      const kbRecords = [];
      let offset = 0;
      while (offset < 500) {
        let page;
        try {
          page = await retry(() =>
            base44.asServiceRole.entities.KnowledgeBase.list('created_date', 1, offset)
          );
        } catch (_) { offset++; continue; }
        if (!page?.length) break;
        const kb = page[0];
        kbRecords.push({
          id: kb.id,
          title: kb.title || `kb-${kb.id}`,
          content_length: typeof kb.content === 'string' ? kb.content.length : 0,
          normalized: normalizeTitle(kb.title || '')
        });
        page[0] = null;
        offset++;
        await sleep(100);
      }

      const groups = {};
      for (const kb of kbRecords) {
        if (!groups[kb.normalized]) groups[kb.normalized] = [];
        groups[kb.normalized].push(kb);
      }

      let kbDeleted = 0;
      for (const [, items] of Object.entries(groups)) {
        if (items.length <= 1) continue;
        items.sort((a, b) => b.content_length - a.content_length);
        for (let i = 1; i < items.length; i++) {
          await retry(() =>
            base44.asServiceRole.entities.KnowledgeBase.delete(items[i].id)
          );
          kbDeleted++;
          await sleep(1500); // Slower to avoid rate limits
        }
      }

      // Step 2: Nuke all chunks (in smaller batches with longer delays)
      let dc = 0;
      while (true) {
        const batch = await retry(() =>
          base44.asServiceRole.entities.KnowledgeChunk.list('created_date', 20)
        ).catch(() => []);
        if (!batch?.length) break;
        for (const c of batch) {
          await retry(() => base44.asServiceRole.entities.KnowledgeChunk.delete(c.id));
          dc++;
          await sleep(300); // Delay between each delete
        }
        await sleep(2000); // Longer pause between batches
      }

      // Step 3: Nuke all sources
      let ds = 0;
      const srcs = await retry(() =>
        base44.asServiceRole.entities.KnowledgeSource.list('created_date', 500)
      ).catch(() => []);
      for (const s of (srcs || [])) {
        await retry(() => base44.asServiceRole.entities.KnowledgeSource.delete(s.id));
        ds++;
        await sleep(1000); // Slower to avoid rate limits
      }

      return Response.json({
        success: true,
        kb_duplicates_deleted: kbDeleted,
        kb_remaining: kbRecords.length - kbDeleted,
        chunks_deleted: dc,
        sources_deleted: ds,
        next_step: 'Cleanup complete. Go to RAG Monitor and run "Ingest Pending" to re-ingest all records with the new AI condensation strategy.'
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});