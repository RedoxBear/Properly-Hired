import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action = 'ingest_one', offset = 0 } = await req.json();

    // Check what's already ingested to avoid duplicates
    const existingSources = await base44.asServiceRole.entities.KnowledgeSource.filter(
      {},
      '-created_date',
      500
    );
    const existingPaths = new Set(existingSources.map(s => s.source_path));

    if (action === 'list') {
      // Light listing — fetch one at a time to avoid memory issues
      // Just return titles + agents, not full content
      const records = [];
      let currentOffset = 0;
      let hasMore = true;

      while (hasMore && currentOffset < 100) {
        const batch = await base44.asServiceRole.entities.KnowledgeBase.filter(
          { is_active: true },
          'created_date',
          1,
          currentOffset
        );
        if (batch.length === 0) {
          hasMore = false;
          break;
        }
        const kb = batch[0];
        const title = kb.title || `kb-${kb.id}`;
        let agent = 'both';
        if (title.toLowerCase().startsWith('kyle/')) agent = 'kyle';
        else if (title.toLowerCase().startsWith('simon/')) agent = 'simon';
        else if (kb.agent_access?.length === 1) agent = kb.agent_access[0];

        records.push({
          index: currentOffset,
          title,
          agent,
          category: kb.category,
          content_length: (kb.content || '').length,
          estimated_chunks: Math.ceil((kb.content || '').length / 850),
          already_ingested: existingPaths.has(title)
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

    // action === 'ingest_one': ingest a single record at the given offset
    const batch = await base44.asServiceRole.entities.KnowledgeBase.filter(
      { is_active: true },
      'created_date',
      1,
      offset
    );

    if (batch.length === 0) {
      return Response.json({ success: true, message: 'No more records to ingest', done: true });
    }

    const kb = batch[0];
    const title = kb.title || `kb-${kb.id}`;
    const content = kb.content || '';

    // Skip if already ingested
    if (existingPaths.has(title)) {
      return Response.json({
        success: true,
        title,
        status: 'skipped',
        reason: 'Already ingested',
        next_offset: offset + 1
      });
    }

    // Skip if too short
    if (content.trim().length < 50) {
      return Response.json({
        success: true,
        title,
        status: 'skipped',
        reason: 'Content too short',
        next_offset: offset + 1
      });
    }

    // Determine agent
    let agent = 'both';
    if (title.toLowerCase().startsWith('kyle/')) agent = 'kyle';
    else if (title.toLowerCase().startsWith('simon/')) agent = 'simon';
    else if (kb.agent_access?.length === 1) agent = kb.agent_access[0];

    // Create KnowledgeSource
    const source = await base44.asServiceRole.entities.KnowledgeSource.create({
      agent,
      source_path: title,
      file_type: 'knowledgebase',
      tags: [agent, kb.category || 'general', ...(kb.keywords || [])].filter(Boolean),
      status: 'processing'
    });

    // Chunk the text
    const CHUNK_SIZE = 1000;
    const OVERLAP = 150;
    const chunks = [];
    let start = 0;

    while (start < content.length) {
      let end = Math.min(start + CHUNK_SIZE, content.length);

      if (end < content.length) {
        const slice = content.substring(start, Math.min(start + CHUNK_SIZE + 200, content.length));
        const breakPoints = ['\n\n', '.\n', '. ', '\n'];
        let bestBreak = -1;
        for (const bp of breakPoints) {
          const idx = slice.lastIndexOf(bp, CHUNK_SIZE + 100);
          if (idx >= CHUNK_SIZE * 0.7) {
            bestBreak = idx + bp.length;
            break;
          }
        }
        if (bestBreak > 0) end = start + bestBreak;
      }

      const chunkText = content.substring(start, end).trim();
      if (chunkText.length > 20) chunks.push(chunkText);

      start = end - OVERLAP;
      if (start >= content.length) break;
    }

    // Extract tags from title
    const fileKeywords = title
      .replace(/\.[^.]+$/, '')
      .replace(/[_\-\/]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .map(w => w.toLowerCase());

    const allTags = [...new Set([agent, kb.category || 'general', ...fileKeywords])];

    // Create chunks in batches
    const BATCH_SIZE = 25;
    let chunksCreated = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const chunkBatch = chunks.slice(i, i + BATCH_SIZE).map((text, idx) => {
        const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const wordFreq = {};
        words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
        const topKeywords = Object.entries(wordFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([w]) => w);

        return {
          source_id: source.id,
          agent,
          content: text,
          chunk_index: i + idx,
          tags: allTags,
          keywords: topKeywords,
          query_count: 0
        };
      });

      await base44.asServiceRole.entities.KnowledgeChunk.bulkCreate(chunkBatch);
      chunksCreated += chunkBatch.length;
    }

    // Update source
    await base44.asServiceRole.entities.KnowledgeSource.update(source.id, {
      status: 'completed',
      chunk_count: chunksCreated,
      ingested_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      title,
      agent,
      content_length: content.length,
      chunks_created: chunksCreated,
      status: 'ingested',
      next_offset: offset + 1
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});