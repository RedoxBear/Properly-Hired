import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { file_url, file_name, agent, tags = [] } = await req.json();

    if (!file_url || !agent) {
      return Response.json({ error: 'file_url and agent are required' }, { status: 400 });
    }

    // Determine file type
    const ext = (file_name || file_url).split('.').pop()?.toLowerCase() || 'txt';

    // Create KnowledgeSource record
    const source = await base44.asServiceRole.entities.KnowledgeSource.create({
      agent,
      source_path: file_name || file_url,
      file_type: ext,
      file_url,
      tags,
      status: 'processing'
    });

    // Extract text from the file
    let text = '';
    try {
      if (['txt', 'md'].includes(ext)) {
        const resp = await fetch(file_url);
        text = await resp.text();
      } else {
        // Use extractDocumentText for docx, pdf, etc.
        const extractResult = await base44.asServiceRole.functions.invoke('extractDocumentText', {
          file_url
        });
        text = extractResult?.data?.text || extractResult?.text || '';
      }
    } catch (extractErr) {
      await base44.asServiceRole.entities.KnowledgeSource.update(source.id, {
        status: 'failed',
        error_message: `Text extraction failed: ${extractErr.message}`
      });
      return Response.json({ error: `Text extraction failed: ${extractErr.message}`, source_id: source.id });
    }

    if (!text || text.trim().length < 10) {
      await base44.asServiceRole.entities.KnowledgeSource.update(source.id, {
        status: 'failed',
        error_message: 'File produced no usable text'
      });
      return Response.json({ error: 'File produced no usable text', source_id: source.id });
    }

    // Chunk the text: ~800-1200 chars with ~150 overlap
    const CHUNK_SIZE = 1000;
    const OVERLAP = 150;
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(start + CHUNK_SIZE, text.length);

      // Try to break at a sentence or paragraph boundary
      if (end < text.length) {
        const slice = text.substring(start, Math.min(start + CHUNK_SIZE + 200, text.length));
        const breakPoints = ['\n\n', '.\n', '. ', '\n'];
        let bestBreak = -1;
        for (const bp of breakPoints) {
          const idx = slice.lastIndexOf(bp, CHUNK_SIZE + 100);
          if (idx >= CHUNK_SIZE * 0.7) {
            bestBreak = idx + bp.length;
            break;
          }
        }
        if (bestBreak > 0) {
          end = start + bestBreak;
        }
      }

      const chunkText = text.substring(start, end).trim();
      if (chunkText.length > 20) {
        chunks.push(chunkText);
      }

      start = end - OVERLAP;
      if (start >= text.length) break;
    }

    // Extract keywords from file name for tagging
    const fileKeywords = (file_name || '')
      .replace(/\.[^.]+$/, '')
      .replace(/[_\-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .map(w => w.toLowerCase());

    const allTags = [...new Set([...tags, agent, ...fileKeywords])];

    // Create chunk records in batches
    const BATCH_SIZE = 25;
    let totalCreated = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE).map((content, idx) => {
        // Extract simple keywords from chunk content
        const words = content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const wordFreq = {};
        words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
        const topKeywords = Object.entries(wordFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([w]) => w);

        return {
          source_id: source.id,
          agent,
          content,
          chunk_index: i + idx,
          tags: allTags,
          keywords: topKeywords,
          query_count: 0
        };
      });

      await base44.asServiceRole.entities.KnowledgeChunk.bulkCreate(batch);
      totalCreated += batch.length;
    }

    // Update source with chunk count
    await base44.asServiceRole.entities.KnowledgeSource.update(source.id, {
      status: 'completed',
      chunk_count: totalCreated,
      ingested_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      source_id: source.id,
      file_name: file_name || file_url,
      agent,
      chunks_created: totalCreated,
      text_length: text.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});