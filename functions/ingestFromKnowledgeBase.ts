import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action = 'ingest_one', offset = 0, chunk_start = 0 } = await req.json();

    // Check existing sources
    const existingSources = await base44.asServiceRole.entities.KnowledgeSource.filter({}, '-created_date', 500);
    const existingPathMap = {};
    existingSources.forEach(s => { existingPathMap[s.source_path] = s; });

    if (action === 'list') {
      const records = [];
      let currentOffset = 0;
      let hasMore = true;
      while (hasMore && currentOffset < 100) {
        const batch = await base44.asServiceRole.entities.KnowledgeBase.filter({ is_active: true }, 'created_date', 1, currentOffset);
        if (batch.length === 0) { hasMore = false; break; }
        const kb = batch[0];
        const title = kb.title || `kb-${kb.id}`;
        let agent = 'both';
        if (title.toLowerCase().startsWith('kyle/')) agent = 'kyle';
        else if (title.toLowerCase().startsWith('simon/')) agent = 'simon';
        else if (kb.agent_access?.length === 1) agent = kb.agent_access[0];
        const existing = existingPathMap[title];
        records.push({
          index: currentOffset, title, agent, category: kb.category,
          content_length: (kb.content || '').length,
          estimated_chunks: Math.ceil((kb.content || '').length / 850),
          already_ingested: !!existing,
          ingestion_status: existing?.status || null,
          chunk_count: existing?.chunk_count || 0
        });
        currentOffset++;
      }
      return Response.json({
        total_records: records.length,
        already_ingested: records.filter(r => r.already_ingested).length,
        pending: records.filter(r => !r.already_ingested).length,
        records
      });
    }

    // action === 'ingest_one': ingest a window of chunks from a single KB record
    const batch = await base44.asServiceRole.entities.KnowledgeBase.filter({ is_active: true }, 'created_date', 1, offset);
    if (batch.length === 0) {
      return Response.json({ success: true, message: 'No more records', done: true });
    }

    const kb = batch[0];
    const title = kb.title || `kb-${kb.id}`;
    const content = kb.content || '';

    // Determine agent
    let agent = 'both';
    if (title.toLowerCase().startsWith('kyle/')) agent = 'kyle';
    else if (title.toLowerCase().startsWith('simon/')) agent = 'simon';
    else if (kb.agent_access?.length === 1) agent = kb.agent_access[0];

    // Skip too-short content
    if (content.trim().length < 50) {
      return Response.json({ success: true, title, status: 'skipped', reason: 'Too short', next_offset: offset + 1, chunk_start: 0 });
    }

    // Find or create KnowledgeSource
    let source = existingPathMap[title];
    if (!source) {
      const fileKeywords = title.replace(/\.[^.]+$/, '').replace(/[_\-\/]/g, ' ').split(/\s+/).filter(w => w.length > 2).map(w => w.toLowerCase());
      source = await base44.asServiceRole.entities.KnowledgeSource.create({
        agent, source_path: title, file_type: 'knowledgebase',
        tags: [...new Set([agent, kb.category || 'general', ...fileKeywords, ...(kb.keywords || [])])].filter(Boolean),
        status: 'processing'
      });
    } else if (source.status === 'completed') {
      return Response.json({ success: true, title, status: 'skipped', reason: 'Already completed', next_offset: offset + 1, chunk_start: 0 });
    }

    // Chunk a WINDOW of content starting at chunk_start character position
    // Process max ~50 chunks per call (~50K chars) to stay under memory limits
    const CHUNK_SIZE = 1000;
    const OVERLAP = 150;
    const MAX_CHUNKS_PER_CALL = 100;
    const chunks = [];
    let pos = chunk_start;

    while (pos < content.length && chunks.length < MAX_CHUNKS_PER_CALL) {
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

    // Bulk create this window of chunks
    if (chunks.length > 0) {
      const BATCH = 25;
      for (let i = 0; i < chunks.length; i += BATCH) {
        const batchData = chunks.slice(i, i + BATCH).map(c => {
          const words = c.text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
          const freq = {};
          words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
          const topKW = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([w]) => w);
          return {
            source_id: source.id, agent, content: c.text,
            chunk_index: chunk_start + c.index, tags: allTags, keywords: topKW, query_count: 0
          };
        });
        await base44.asServiceRole.entities.KnowledgeChunk.bulkCreate(batchData);
      }
    }

    const hasMoreContent = pos < content.length;

    if (!hasMoreContent) {
      // This file is done — count all chunks and update source
      const totalChunks = (source.chunk_count || 0) + chunks.length;
      await base44.asServiceRole.entities.KnowledgeSource.update(source.id, {
        status: 'completed',
        chunk_count: totalChunks,
        ingested_at: new Date().toISOString()
      });
      return Response.json({
        success: true, title, agent, status: 'completed',
        chunks_this_call: chunks.length, total_chunk_count: totalChunks,
        next_offset: offset + 1, chunk_start: 0
      });
    } else {
      // More content to process — update partial count
      await base44.asServiceRole.entities.KnowledgeSource.update(source.id, {
        chunk_count: (source.chunk_count || 0) + chunks.length
      });
      return Response.json({
        success: true, title, agent, status: 'partial',
        chunks_this_call: chunks.length, content_position: pos, content_total: content.length,
        progress_pct: Math.round((pos / content.length) * 100),
        next_offset: offset, chunk_start: pos
      });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});