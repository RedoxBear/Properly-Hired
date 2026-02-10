import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, agent, top_k = 5 } = await req.json();
    if (!query || !agent) {
      return Response.json({ error: 'query and agent are required' }, { status: 400 });
    }

    const startTime = Date.now();

    const stops = new Set([
      'the','is','at','which','on','a','an','and','or','but','in','with','to','for',
      'of','not','from','by','it','as','be','this','that','are','was','were','been',
      'have','has','had','do','does','did','will','would','could','should','may',
      'might','can','how','what','when','where','who','why','than','then','them',
      'they','their','there','these','those','its','into','also','about','more',
      'some','such','other','any','each','only','very','just','own','our','your',
      'all','most','after','before','between','over','under','again','further',
      'once','here','out','up','down','off','through','during','both','same',
      'few','many','much','well','still','even','back','new','first','last','long',
      'great','little','said','way','get','got','make','know','take','come','see',
      'think','look','want','give','use','find','tell','need','keep','let','begin',
      'show','part','going','thing','something','every','without','because','another',
      'while','however','though','although','yet','since','until','unless','being',
      'right','made','like','one','two','three','four','five'
    ]);

    // Step 1: Extract base query terms
    const baseTerms = query.toLowerCase()
      .match(/\b[a-z]{3,}\b/g)
      ?.filter(w => !stops.has(w)) || [];

    if (baseTerms.length === 0) {
      return Response.json({ chunks: [], query, agent, retrieval_ms: Date.now() - startTime });
    }

    // Step 2: LLM Query Expansion — find synonyms and related terms
    let expandedTerms = [...baseTerms];
    try {
      const expansion = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Given this search query about career coaching, resumes, or recruiting: "${query}"

Return 5-10 alternative search terms, synonyms, and related concepts that would help find relevant content. Focus on terms likely to appear in career advice documents.

Examples:
- "cover letter tips" → ["cover letter", "application letter", "motivation letter", "hiring manager", "opening paragraph", "value proposition"]
- "ghost jobs" → ["fake listings", "phantom positions", "job scams", "inactive postings", "reposted jobs", "hiring intent"]`,
        response_json_schema: {
          type: "object",
          properties: {
            terms: { type: "array", items: { type: "string" } }
          }
        }
      });
      if (expansion?.terms?.length) {
        const extraTerms = expansion.terms
          .flatMap(t => t.toLowerCase().match(/\b[a-z]{3,}\b/g) || [])
          .filter(w => !stops.has(w));
        expandedTerms = [...new Set([...baseTerms, ...extraTerms])];
      }
    } catch (_) {
      // LLM expansion failed — use base terms only
    }

    // Step 3: Fetch candidate chunks
    const [agentChunks, sharedChunks] = await Promise.all([
      base44.asServiceRole.entities.KnowledgeChunk.filter(
        { agent }, '-created_date', 500
      ).catch(() => []),
      agent !== 'both'
        ? base44.asServiceRole.entities.KnowledgeChunk.filter(
            { agent: 'both' }, '-created_date', 200
          ).catch(() => [])
        : Promise.resolve([])
    ]);

    const candidates = [...(agentChunks || []), ...(sharedChunks || [])];

    // Step 4: Multi-signal scoring with dedup
    const seenHashes = new Set();
    const scored = [];
    const queryLower = query.toLowerCase();

    // Bigrams from base AND expanded terms
    const allBigrams = [];
    for (let i = 0; i < baseTerms.length - 1; i++) {
      allBigrams.push(baseTerms[i] + ' ' + baseTerms[i + 1]);
    }

    for (const chunk of candidates) {
      const content = (chunk.content || '').toLowerCase();
      const summary = (chunk.summary || '').toLowerCase();
      const heading = (chunk.heading_context || '').toLowerCase();
      const keywords = (chunk.keywords || []).map(k => k.toLowerCase());
      const tags = (chunk.tags || []).map(t => t.toLowerCase());

      // Dedup
      const hash = chunk.content_hash || content.substring(0, 200).replace(/\s+/g, '');
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);
      if (content.length < 40) continue;

      let score = 0;

      // Signal 1: Full phrase match in content or summary
      if (content.includes(queryLower)) score += 15;
      if (summary.includes(queryLower)) score += 12;

      // Signal 2: Bigram matches
      for (const bg of allBigrams) {
        if (content.includes(bg)) score += 5;
        if (summary.includes(bg)) score += 4;
      }

      // Signal 3: Term matches — base terms weighted higher than expanded
      let baseHits = 0, expandedHits = 0;
      for (const term of baseTerms) {
        const regex = new RegExp(`\\b${term}`, 'gi');
        const contentMatches = content.match(regex);
        if (contentMatches) {
          baseHits++;
          score += 3 + Math.min(Math.log2(contentMatches.length), 2);
        }
        if (summary.includes(term)) score += 3;
        if (heading.includes(term)) score += 2;
        if (keywords.includes(term)) score += 2.5;
        if (tags.some(t => t.includes(term))) score += 1;
      }

      // Expanded terms (lower weight)
      const extraTerms = expandedTerms.filter(t => !baseTerms.includes(t));
      for (const term of extraTerms) {
        if (content.includes(term)) { expandedHits++; score += 1.5; }
        if (summary.includes(term)) score += 1.5;
        if (keywords.includes(term)) score += 1;
      }

      // Signal 4: Coverage bonus
      const totalTerms = baseTerms.length + extraTerms.length;
      const coverage = totalTerms > 0 ? (baseHits + expandedHits * 0.5) / totalTerms : 0;
      score *= (0.5 + coverage * 0.5);

      // Signal 5: Summary exists = better indexed chunk
      if (chunk.summary) score *= 1.15;

      // Signal 6: Heading match bonus
      if (heading && baseTerms.some(t => heading.includes(t))) score *= 1.1;

      // Signal 7: Length penalty for noise
      if (content.length < 80) score *= 0.4;
      else if (content.length < 150) score *= 0.7;

      // Signal 8: Historical success boost
      if (chunk.query_count > 0) score += Math.min(Math.log2(chunk.query_count + 1), 1.5);

      if (score > 0.5) {
        scored.push({
          id: chunk.id,
          source_id: chunk.source_id,
          content: chunk.content,
          summary: chunk.summary,
          heading_context: chunk.heading_context,
          tags: chunk.tags,
          keywords: chunk.keywords,
          relevance_score: Math.round(score * 100) / 100,
          chunk_index: chunk.chunk_index,
          coverage: Math.round(coverage * 100)
        });
      }
    }

    // Sort by score
    scored.sort((a, b) => b.relevance_score - a.relevance_score);

    // Step 5: LLM Reranking of top candidates (if we have enough)
    let topChunks = scored.slice(0, Math.min(top_k * 3, 15));
    
    if (topChunks.length > top_k) {
      try {
        const rerankInput = topChunks.map((c, i) => 
          `[${i}] ${(c.summary || c.content?.substring(0, 200) || '')}`
        ).join('\n');

        const rerank = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Given the search query: "${query}"

Rank these text passages by relevance. Return the indices of the ${top_k} MOST relevant passages, ordered by relevance (best first). Only return passages that are actually relevant to the query.

${rerankInput}`,
          response_json_schema: {
            type: "object",
            properties: {
              ranked_indices: { type: "array", items: { type: "number" } }
            }
          }
        });

        if (rerank?.ranked_indices?.length) {
          const reranked = rerank.ranked_indices
            .filter(i => i >= 0 && i < topChunks.length)
            .slice(0, top_k)
            .map(i => topChunks[i])
            .filter(Boolean);
          if (reranked.length > 0) topChunks = reranked;
        }
      } catch (_) {
        // Reranking failed — use keyword-scored order
      }
    }

    topChunks = topChunks.slice(0, top_k);

    // Update query_count (fire and forget)
    for (const chunk of topChunks) {
      base44.asServiceRole.entities.KnowledgeChunk.update(chunk.id, {
        query_count: (chunk.query_count || 0) + 1,
        relevance_score: chunk.relevance_score
      }).catch(() => {});
    }

    return Response.json({
      chunks: topChunks,
      query,
      query_terms: baseTerms,
      expanded_terms: expandedTerms.filter(t => !baseTerms.includes(t)),
      agent,
      total_candidates: candidates.length,
      retrieval_ms: Date.now() - startTime
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});