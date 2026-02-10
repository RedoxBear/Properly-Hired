import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function retry(fn, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === attempts) throw err;
      await sleep(2000 * i);
    }
  }
}

// ── HEADING-AWARE SMART CHUNKING ──────────────────────────
function smartChunk(text, maxSize = 1200) {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  if (cleaned.length <= maxSize && cleaned.length > 30) return [{ text: cleaned, heading: '' }];
  if (cleaned.length <= 30) return [];

  const chunks = [];
  // Split into sections by headings or double newlines
  const sections = cleaned.split(/\n(?=#{1,4}\s|[A-Z][A-Z\s]{5,}\n|Chapter\s|Part\s|Section\s)/i);
  
  let currentChunk = '';
  let currentHeading = '';

  for (const section of sections) {
    const lines = section.split('\n');
    // Detect heading: first line if it looks like a heading
    const firstLine = lines[0]?.trim() || '';
    const isHeading = /^#{1,4}\s/.test(firstLine) || 
                      (/^[A-Z]/.test(firstLine) && firstLine.length < 100 && !firstLine.endsWith('.'));
    
    if (isHeading && currentChunk.length > 100) {
      chunks.push({ text: currentChunk.trim(), heading: currentHeading });
      currentHeading = firstLine.replace(/^#+\s*/, '');
      currentChunk = section;
      continue;
    }
    
    if (isHeading) currentHeading = firstLine.replace(/^#+\s*/, '');

    if (currentChunk.length + section.length + 2 > maxSize && currentChunk.length > 100) {
      chunks.push({ text: currentChunk.trim(), heading: currentHeading });
      currentChunk = section;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + section;
    }

    // Break oversized chunks by paragraph
    while (currentChunk.length > maxSize * 1.3) {
      const breakIdx = currentChunk.lastIndexOf('\n\n', maxSize);
      const sentBreak = breakIdx > maxSize * 0.5 ? breakIdx : currentChunk.lastIndexOf('. ', maxSize);
      const splitAt = sentBreak > maxSize * 0.4 ? sentBreak + (breakIdx > 0 ? 2 : 2) : maxSize;
      chunks.push({ text: currentChunk.substring(0, splitAt).trim(), heading: currentHeading });
      currentChunk = currentChunk.substring(splitAt).trim();
    }
  }
  if (currentChunk.trim().length > 30) {
    chunks.push({ text: currentChunk.trim(), heading: currentHeading });
  }
  return chunks;
}

// ── KEYWORD EXTRACTION (expanded stop words) ──────────────
function extractKeywords(text, limit = 20) {
  const stops = new Set([
    'the','is','at','which','on','a','an','and','or','but','in','with','to','for',
    'of','not','from','by','it','as','be','this','that','are','was','were','been',
    'have','has','had','do','does','did','will','would','could','should','may',
    'might','can','how','what','when','where','who','why','than','then','them',
    'they','their','there','these','those','its','into','also','about','more',
    'some','such','other','any','each','only','very','just','own','our','your',
    'all','most','after','before','between','over','under','again','further',
    'once','here','out','up','down','off','through','during','both','same','few',
    'many','much','well','still','even','back','new','first','last','long','great',
    'little','said','way','get','got','make','know','take','come','see','think',
    'look','want','give','use','find','tell','need','keep','let','begin','show',
    'part','going','thing','something','every','without','because','another',
    'while','however','though','although','yet','since','until','unless','being',
    'right','made','like','one','two','three','four','five','would','could',
    'shall','must','may','might','will','should','says','able','upon','often',
    'around','never','always','already','really','quite','rather','enough','too',
    'perhaps','whether','either','neither','several','less','least','done',
    'went','came','took','gave','told','asked','used','called','found','left',
    'put','set','run','read','went','seen','known','become','say','work','seem',
    'feel','try','leave','call','turn','start','point','move','live','play'
  ]);
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq = {};
  for (const w of words) {
    if (!stops.has(w)) freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}

// ── CONTENT HASH for dedup ────────────────────────────────
function contentHash(str) {
  const s = str.trim().toLowerCase().replace(/\s+/g, ' ').substring(0, 600);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h = h & h;
  }
  return h.toString(36);
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
    // LIST: All KB records with ingestion status
    // ════════════════════════════════════════════════════════
    if (action === 'list') {
      const sources = await retry(() =>
        base44.asServiceRole.entities.KnowledgeSource.list('-created_date', 500)
      ) || [];
      const sourceMap = {};
      for (const s of sources) sourceMap[s.source_path] = s;

      // Fetch KB records ONE AT A TIME, immediately discard content to save memory
      const records = [];
      let offset = 0;
      let consecutiveErrors = 0;
      while (offset < 200 && consecutiveErrors < 3) {
        let page;
        try {
          page = await retry(() =>
            base44.asServiceRole.entities.KnowledgeBase.list('created_date', 1, offset)
          );
        } catch (_) { offset++; consecutiveErrors++; continue; }
        if (!page?.length) break;
        consecutiveErrors = 0;

        const kb = page[0];
        const title = kb.title || `kb-${kb.id}`;
        let agent = 'both';
        if (title.toLowerCase().startsWith('kyle/')) agent = 'kyle';
        else if (title.toLowerCase().startsWith('simon/')) agent = 'simon';
        else if (kb.agent_access?.length === 1) agent = kb.agent_access[0];
        const src = sourceMap[title];
        // Only store metadata — never hold content in memory during list
        const contentLen = typeof kb.content === 'string' ? kb.content.length : 0;
        records.push({
          id: kb.id, title, agent, category: kb.category,
          content_length: contentLen,
          status: src?.status || 'not_started',
          chunk_count: src?.chunk_count || 0,
          source_id: src?.id || null
        });
        // Explicitly null out content reference to help GC
        page[0] = null;
        offset++;
        await sleep(250);
      }

      return Response.json({
        total: records.length,
        completed: records.filter(r => r.status === 'completed').length,
        pending: records.filter(r => r.status !== 'completed').length,
        sources_total: sources.length,
        records
      });
    }

    // ════════════════════════════════════════════════════════
    // STATS: Quick chunk/source counts
    // ════════════════════════════════════════════════════════
    if (action === 'stats') {
      const [kyleSrc, simonSrc, bothSrc] = await Promise.all([
        retry(() => base44.asServiceRole.entities.KnowledgeSource.filter({ agent: 'kyle' }, '-created_date', 500)).catch(() => []),
        retry(() => base44.asServiceRole.entities.KnowledgeSource.filter({ agent: 'simon' }, '-created_date', 500)).catch(() => []),
        retry(() => base44.asServiceRole.entities.KnowledgeSource.filter({ agent: 'both' }, '-created_date', 500)).catch(() => []),
      ]);
      const [kyleChk, simonChk, bothChk] = await Promise.all([
        retry(() => base44.asServiceRole.entities.KnowledgeChunk.filter({ agent: 'kyle' }, '-created_date', 500)).catch(() => []),
        retry(() => base44.asServiceRole.entities.KnowledgeChunk.filter({ agent: 'simon' }, '-created_date', 500)).catch(() => []),
        retry(() => base44.asServiceRole.entities.KnowledgeChunk.filter({ agent: 'both' }, '-created_date', 500)).catch(() => []),
      ]);

      const allSrc = [...kyleSrc, ...simonSrc, ...bothSrc];
      const allChk = [...kyleChk, ...simonChk, ...bothChk];

      // Find issues
      const noChunks = allSrc.filter(s => !s.chunk_count || s.chunk_count === 0);
      const failed = allSrc.filter(s => s.status === 'failed');
      const stuck = allSrc.filter(s => s.status === 'processing');
      const pathCount = {};
      allSrc.forEach(s => { pathCount[s.source_path] = (pathCount[s.source_path] || 0) + 1; });
      const dupes = Object.entries(pathCount).filter(([, c]) => c > 1);
      const emptyChunks = allChk.filter(c => !c.content || c.content.trim().length < 30);
      const withSummary = allChk.filter(c => c.summary && c.summary.length > 5);

      return Response.json({
        sources: { kyle: kyleSrc.length, simon: simonSrc.length, both: bothSrc.length, total: allSrc.length },
        chunks: { kyle: kyleChk.length, simon: simonChk.length, both: bothChk.length, total: allChk.length },
        ai_summaries: withSummary.length,
        issues: {
          no_chunks: noChunks.length,
          failed: failed.length,
          stuck: stuck.length,
          duplicates: dupes.length,
          empty_chunks: emptyChunks.length
        }
      });
    }

    // ════════════════════════════════════════════════════════
    // NUKE: Delete ALL chunks and sources — fresh start
    // ════════════════════════════════════════════════════════
    if (action === 'nuke') {
      let dc = 0, ds = 0;
      // Delete chunks in batches
      while (true) {
        const batch = await retry(() =>
          base44.asServiceRole.entities.KnowledgeChunk.list('created_date', 50)
        ).catch(() => []);
        if (!batch?.length) break;
        for (const c of batch) {
          await retry(() => base44.asServiceRole.entities.KnowledgeChunk.delete(c.id));
          dc++;
        }
        await sleep(300);
      }
      // Delete sources
      const srcs = await retry(() =>
        base44.asServiceRole.entities.KnowledgeSource.list('created_date', 500)
      ).catch(() => []);
      for (const s of (srcs || [])) {
        await retry(() => base44.asServiceRole.entities.KnowledgeSource.delete(s.id));
        ds++;
        await sleep(200);
      }
      return Response.json({ success: true, deleted_chunks: dc, deleted_sources: ds });
    }

    // ════════════════════════════════════════════════════════
    // RESET_ONE: Delete a single source and its chunks
    // ════════════════════════════════════════════════════════
    if (action === 'reset_one') {
      const { source_id } = body;
      if (!source_id) return Response.json({ error: 'source_id required' }, { status: 400 });
      let deleted = 0;
      while (true) {
        const chunks = await retry(() =>
          base44.asServiceRole.entities.KnowledgeChunk.filter({ source_id }, 'created_date', 50)
        ).catch(() => []);
        if (!chunks?.length) break;
        for (const c of chunks) {
          await retry(() => base44.asServiceRole.entities.KnowledgeChunk.delete(c.id));
          deleted++;
        }
        await sleep(300);
      }
      await retry(() => base44.asServiceRole.entities.KnowledgeSource.delete(source_id));
      return Response.json({ success: true, deleted_chunks: deleted });
    }

    // ════════════════════════════════════════════════════════
    // INGEST_ONE: Process a single KB record with AI summaries
    // ════════════════════════════════════════════════════════
    if (action === 'ingest_one') {
      const { kb_id, chunk_start = 0, use_ai = true } = body;
      if (!kb_id) return Response.json({ error: 'kb_id required' }, { status: 400 });

      // Find the KB record — scan one at a time to keep memory low
      let kb = null;
      let scanOffset = 0;
      while (!kb && scanOffset < 500) {
        let page;
        try {
          page = await retry(() =>
            base44.asServiceRole.entities.KnowledgeBase.list('created_date', 1, scanOffset)
          );
        } catch (_) { scanOffset++; continue; }
        if (!page?.length) break;
        if (page[0].id === kb_id) { kb = page[0]; break; }
        // Null out to help GC before next iteration
        page[0] = null;
        scanOffset++;
        await sleep(80);
      }
      if (!kb) return Response.json({ error: 'KB record not found' }, { status: 404 });

      const title = kb.title || `kb-${kb.id}`;
      const content = kb.content || '';
      let agent = 'both';
      if (title.toLowerCase().startsWith('kyle/')) agent = 'kyle';
      else if (title.toLowerCase().startsWith('simon/')) agent = 'simon';
      else if (kb.agent_access?.length === 1) agent = kb.agent_access[0];

      if (content.trim().length < 50) {
        return Response.json({ success: true, title, status: 'skipped', reason: 'Content too short' });
      }

      // Find or create source
      const sources = await retry(() =>
        base44.asServiceRole.entities.KnowledgeSource.list('-created_date', 500)
      ) || [];
      let source = sources.find(s => s.source_path === title);
      if (source?.status === 'completed') {
        return Response.json({ success: true, title, status: 'already_done' });
      }

      const fileTags = title.replace(/\.[^.]+$/, '').replace(/[_\-\/]/g, ' ')
        .split(/\s+/).filter(w => w.length > 2).map(w => w.toLowerCase());
      const allTags = [...new Set([agent, kb.category || 'general', ...(kb.keywords || []), ...fileTags])].filter(Boolean);

      if (!source) {
        source = await retry(() =>
          base44.asServiceRole.entities.KnowledgeSource.create({
            agent, source_path: title, file_type: 'knowledgebase',
            tags: allTags, status: 'processing', chunk_count: 0
          })
        );
      }

      // Get existing hashes to avoid dupes
      const existingChunks = await retry(() =>
        base44.asServiceRole.entities.KnowledgeChunk.filter({ source_id: source.id }, 'created_date', 500)
      ).catch(() => []);
      const existingHashes = new Set((existingChunks || []).map(c => c.content_hash).filter(Boolean));

      // Smart-chunk from chunk_start
      const remaining = content.substring(chunk_start);
      const MAX_PER_CALL = 8; // fewer per call to leave room for AI summaries
      const allChunks = smartChunk(remaining, 1200);
      const batch = allChunks.slice(0, MAX_PER_CALL);

      // Dedup + filter
      const uniqueChunks = [];
      for (const c of batch) {
        const hash = contentHash(c.text);
        if (!existingHashes.has(hash) && c.text.trim().length > 30) {
          existingHashes.add(hash);
          uniqueChunks.push({ ...c, hash });
        }
      }

      // Calculate next position
      let charsConsumed = 0;
      for (let i = 0; i < Math.min(allChunks.length, MAX_PER_CALL); i++) {
        charsConsumed += allChunks[i].text.length;
      }
      const nextStart = chunk_start + Math.max(charsConsumed * 0.92, charsConsumed - 150);

      // Generate AI summaries in batch if enabled
      let summaries = {};
      if (use_ai && uniqueChunks.length > 0) {
        try {
          // Build a single LLM call for all chunks to save tokens
          const chunkTexts = uniqueChunks.map((c, i) => 
            `--- CHUNK ${i} ---\n${c.text.substring(0, 500)}`
          ).join('\n\n');

          const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `You are summarizing text chunks for a career coaching knowledge base. For each chunk below, write a 1-2 sentence summary that captures the KEY actionable insight. Focus on what advice or information someone could use.\n\n${chunkTexts}`,
            response_json_schema: {
              type: "object",
              properties: {
                summaries: {
                  type: "array",
                  items: { type: "string" },
                  description: "One summary per chunk, in order"
                }
              }
            }
          });
          
          if (aiResult?.summaries) {
            aiResult.summaries.forEach((s, i) => { summaries[i] = s; });
          }
        } catch (aiErr) {
          // AI failed — continue without summaries, not a blocker
          console.error('AI summary failed:', aiErr.message);
        }
      }

      // Insert chunks
      let created = 0;
      for (let i = 0; i < uniqueChunks.length; i++) {
        const c = uniqueChunks[i];
        const keywords = extractKeywords(c.text, 20);
        await retry(() =>
          base44.asServiceRole.entities.KnowledgeChunk.create({
            source_id: source.id, agent, content: c.text,
            summary: summaries[i] || null,
            content_hash: c.hash,
            heading_context: c.heading || null,
            chunk_index: (source.chunk_count || 0) + created,
            tags: allTags, keywords, query_count: 0
          })
        );
        created++;
        await sleep(400);
      }

      const newTotal = (source.chunk_count || 0) + created;
      const hasMore = allChunks.length > MAX_PER_CALL;

      if (!hasMore) {
        await retry(() =>
          base44.asServiceRole.entities.KnowledgeSource.update(source.id, {
            status: 'completed', chunk_count: newTotal, ingested_at: new Date().toISOString()
          })
        );
        return Response.json({
          success: true, title, agent, status: 'completed',
          chunks_created: created, deduped: batch.length - uniqueChunks.length,
          ai_summaries: Object.keys(summaries).length, total_chunks: newTotal
        });
      }

      await retry(() =>
        base44.asServiceRole.entities.KnowledgeSource.update(source.id, { chunk_count: newTotal })
      );
      return Response.json({
        success: true, title, agent, status: 'partial',
        chunks_created: created, deduped: batch.length - uniqueChunks.length,
        ai_summaries: Object.keys(summaries).length, total_so_far: newTotal,
        next_chunk_start: Math.round(nextStart),
        progress_pct: Math.min(99, Math.round((nextStart / content.length) * 100)),
        content_length: content.length
      });
    }

    // ════════════════════════════════════════════════════════
    // TEST_RETRIEVE: Run a test query and show results
    // ════════════════════════════════════════════════════════
    if (action === 'test_retrieve') {
      // Inline retrieval test — doesn't go through ragRetrieve function
      const { query: testQuery, test_agent = 'kyle', test_top_k = 5 } = body;
      if (!testQuery) return Response.json({ error: 'query required' }, { status: 400 });
      
      const start = Date.now();
      
      // Fetch candidate chunks directly
      const [agChunks, sharedChunks] = await Promise.all([
        retry(() => base44.asServiceRole.entities.KnowledgeChunk.filter(
          { agent: test_agent }, '-created_date', 500
        )).catch(() => []),
        test_agent !== 'both'
          ? retry(() => base44.asServiceRole.entities.KnowledgeChunk.filter(
              { agent: 'both' }, '-created_date', 200
            )).catch(() => [])
          : Promise.resolve([])
      ]);
      const allCandidates = [...(agChunks || []), ...(sharedChunks || [])];

      // Simple keyword scoring for test
      const queryTerms = testQuery.toLowerCase().match(/\b[a-z]{3,}\b/g)?.filter(w => w.length > 2) || [];
      const seenH = new Set();
      const scored = [];
      for (const chunk of allCandidates) {
        const ct = (chunk.content || '').toLowerCase();
        const sm = (chunk.summary || '').toLowerCase();
        const hash = (chunk.content_hash || ct.substring(0, 200)).replace(/\s+/g, '');
        if (seenH.has(hash)) continue;
        seenH.add(hash);
        if (ct.length < 40) continue;
        let score = 0;
        for (const term of queryTerms) {
          if (ct.includes(term)) score += 2;
          if (sm.includes(term)) score += 3;
          if ((chunk.keywords || []).some(k => k.includes(term))) score += 1.5;
        }
        if (score > 0) scored.push({ ...chunk, _score: score });
      }
      scored.sort((a, b) => b._score - a._score);
      const top = scored.slice(0, test_top_k);
      
      return Response.json({
        query: testQuery, agent: test_agent,
        retrieval_ms: Date.now() - start,
        total_candidates: allCandidates.length,
        chunks: top.map(c => ({
          id: c.id,
          score: c._score,
          summary: c.summary,
          heading: c.heading_context,
          content_preview: (c.content || '').substring(0, 200),
          keywords: (c.keywords || []).slice(0, 8)
        }))
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});