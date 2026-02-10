import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function retryOp(fn, retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.message?.includes('429') || err.message?.includes('Rate limit');
      if (attempt < retries && is429) {
        await sleep(3000 * attempt);
      } else {
        throw err;
      }
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action = 'ingest_one' } = body;

    // ── LIST ──────────────────────────────────────────────
    if (action === 'list') {
      // Fetch KB records in pages to avoid large payload issues
      let allKB = [];
      let listOffset = 0;
      while (listOffset < 200) {
        const page = await retryOp(() =>
          base44.asServiceRole.entities.KnowledgeBase.filter({ is_active: true }, 'created_date', 20, listOffset)
        );
        if (!page || !Array.isArray(page) || page.length === 0) break;
        allKB = allKB.concat(page);
        listOffset += page.length;
        if (page.length < 20) break;
        await sleep(500);
      }
      
      // Fetch existing sources
      let existingSources = [];
      try {
        const srcResult = await retryOp(() =>
          base44.asServiceRole.entities.KnowledgeSource.filter({}, '-created_date', 500)
        );
        if (Array.isArray(srcResult)) existingSources = srcResult;
      } catch (_) { /* no sources yet */ }
      const sourceMap = {};
      existingSources.forEach(s => { sourceMap[s.source_path] = s; });

      const records = allKB.map((kb, i) => {
        const title = kb.title || `kb-${kb.id}`;
        let agent = 'both';
        if (title.toLowerCase().startsWith('kyle/')) agent = 'kyle';
        else if (title.toLowerCase().startsWith('simon/')) agent = 'simon';
        else if (kb.agent_access?.length === 1) agent = kb.agent_access[0];
        const src = sourceMap[title];
        return {
          index: i, id: kb.id, title, agent, category: kb.category,
          content_length: (kb.content || '').length,
          estimated_chunks: Math.ceil((kb.content || '').length / 850),
          already_ingested: src?.status === 'completed',
          ingestion_status: src?.status || null,
          chunk_count: src?.chunk_count || 0,
          source_id: src?.id || null
        };
      });

      return Response.json({
        total_records: records.length,
        already_ingested: records.filter(r => r.already_ingested).length,
        pending: records.filter(r => !r.already_ingested).length,
        records
      });
    }

    // ── RESET ONE ────────────────────────────────────────
    // Reset a stuck/partial source so it can be re-ingested cleanly
    if (action === 'reset') {
      const { source_id } = body;
      if (!source_id) return Response.json({ error: 'source_id required' }, { status: 400 });
      
      // Delete all chunks for this source
      const chunks = await retryOp(() =>
        base44.asServiceRole.entities.KnowledgeChunk.filter({ source_id }, 'created_date', 500)
      );
      for (const c of chunks) {
        await retryOp(() => base44.asServiceRole.entities.KnowledgeChunk.delete(c.id));
        await sleep(200);
      }
      // Delete the source itself
      await retryOp(() => base44.asServiceRole.entities.KnowledgeSource.delete(source_id));
      return Response.json({ success: true, deleted_chunks: chunks.length });
    }

    // ── INGEST ONE ───────────────────────────────────────
    const { kb_id, chunk_start = 0 } = body;
    
    if (!kb_id) {
      return Response.json({ error: 'kb_id is required' }, { status: 400 });
    }

    // Fetch the specific KB record by ID — paginate to find it
    let kb = null;
    let searchOffset = 0;
    while (!kb && searchOffset < 200) {
      const page = await retryOp(() =>
        base44.asServiceRole.entities.KnowledgeBase.filter({ is_active: true }, 'created_date', 20, searchOffset)
      );
      if (!page || !Array.isArray(page) || page.length === 0) break;
      kb = page.find(r => r.id === kb_id);
      searchOffset += page.length;
      if (!kb && page.length < 20) break;
      if (!kb) await sleep(300);
    }
    if (!kb) {
      return Response.json({ error: `KB record ${kb_id} not found` }, { status: 404 });
    }

    const title = kb.title || `kb-${kb.id}`;
    const content = kb.content || '';

    let agent = 'both';
    if (title.toLowerCase().startsWith('kyle/')) agent = 'kyle';
    else if (title.toLowerCase().startsWith('simon/')) agent = 'simon';
    else if (kb.agent_access?.length === 1) agent = kb.agent_access[0];

    if (content.trim().length < 50) {
      return Response.json({ success: true, title, status: 'skipped', reason: 'Too short' });
    }

    // Find or create source
    let existingSources = [];
    try {
      const srcResult = await retryOp(() =>
        base44.asServiceRole.entities.KnowledgeSource.filter({}, '-created_date', 500)
      );
      if (Array.isArray(srcResult)) existingSources = srcResult;
    } catch (_) { /* no sources yet */ }
    let source = existingSources.find(s => s.source_path === title);

    if (source?.status === 'completed') {
      return Response.json({ success: true, title, status: 'skipped', reason: 'Already completed' });
    }

    if (!source) {
      const keywords = title.replace(/\.[^.]+$/, '').replace(/[_\-\/]/g, ' ').split(/\s+/).filter(w => w.length > 2).map(w => w.toLowerCase());
      source = await retryOp(() =>
        base44.asServiceRole.entities.KnowledgeSource.create({
          agent, source_path: title, file_type: 'knowledgebase',
          tags: [...new Set([agent, kb.category || 'general', ...keywords, ...(kb.keywords || [])])].filter(Boolean),
          status: 'processing', chunk_count: 0
        })
      );
    }

    // Chunk content from chunk_start position
    const CHUNK_SIZE = 1000;
    const OVERLAP = 150;
    const MAX_CHUNKS = 20; // Keep small to avoid rate limits
    const chunks = [];
    let pos = chunk_start;

    while (pos < content.length && chunks.length < MAX_CHUNKS) {
      let end = Math.min(pos + CHUNK_SIZE, content.length);
      if (end < content.length) {
        const slice = content.substring(pos, Math.min(pos + CHUNK_SIZE + 200, content.length));
        const breakPoints = ['\n\n', '.\n', '. ', '\n'];
        for (const bp of breakPoints) {
          const idx = slice.lastIndexOf(bp, CHUNK_SIZE + 100);
          if (idx >= CHUNK_SIZE * 0.7) { end = pos + idx + bp.length; break; }
        }
      }
      const chunkText = content.substring(pos, end).trim();
      if (chunkText.length > 20) chunks.push({ text: chunkText, index: chunks.length });
      pos = end - OVERLAP;
      if (pos >= content.length) break;
    }

    const allTags = [...new Set([agent, kb.category || 'general'])];

    // Insert chunks one small batch at a time with generous delays
    if (chunks.length > 0) {
      const BATCH = 5;
      for (let i = 0; i < chunks.length; i += BATCH) {
        const batchData = chunks.slice(i, i + BATCH).map(c => {
          const words = c.text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
          const freq = {};
          words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
          const topKW = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([w]) => w);
          return {
            source_id: source.id, agent, content: c.text,
            chunk_index: (source.chunk_count || 0) + chunk_start + c.index,
            tags: allTags, keywords: topKW, query_count: 0
          };
        });
        await retryOp(() => base44.asServiceRole.entities.KnowledgeChunk.bulkCreate(batchData));
        await sleep(1000); // 1s between batches
      }
    }

    const hasMore = pos < content.length;
    const newChunkCount = (source.chunk_count || 0) + chunks.length;

    if (!hasMore) {
      await retryOp(() =>
        base44.asServiceRole.entities.KnowledgeSource.update(source.id, {
          status: 'completed', chunk_count: newChunkCount, ingested_at: new Date().toISOString()
        })
      );
      return Response.json({
        success: true, title, agent, status: 'completed',
        chunks_this_call: chunks.length, total_chunks: newChunkCount
      });
    } else {
      await retryOp(() =>
        base44.asServiceRole.entities.KnowledgeSource.update(source.id, { chunk_count: newChunkCount })
      );
      return Response.json({
        success: true, title, agent, status: 'partial',
        chunks_this_call: chunks.length, next_chunk_start: pos,
        content_total: content.length, progress_pct: Math.round((pos / content.length) * 100),
        total_chunks_so_far: newChunkCount
      });
    }

  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.substring(0, 300) }, { status: 500 });
  }
});