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

    // Extract search terms from the query
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'not', 'from', 'by', 'it', 'as', 'be', 'this', 'that', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'how', 'what', 'when', 'where', 'who', 'why']);
    const queryTerms = query.toLowerCase()
      .match(/\b[a-z]{3,}\b/g)
      ?.filter(w => !stopWords.has(w)) || [];

    if (queryTerms.length === 0) {
      return Response.json({ chunks: [], query, agent, retrieval_ms: Date.now() - startTime });
    }

    // Fetch chunks for this agent — get a reasonable pool to score
    const allChunks = await base44.asServiceRole.entities.KnowledgeChunk.filter(
      { agent },
      '-created_date',
      200
    );

    // Also include chunks tagged "both"
    const bothChunks = await base44.asServiceRole.entities.KnowledgeChunk.filter(
      { agent: 'both' },
      '-created_date',
      100
    );

    const candidateChunks = [...allChunks, ...bothChunks];

    // Score chunks by keyword overlap
    const scored = candidateChunks.map(chunk => {
      const contentLower = (chunk.content || '').toLowerCase();
      const keywords = chunk.keywords || [];
      const tags = chunk.tags || [];

      let score = 0;

      // Exact phrase match (highest signal)
      if (contentLower.includes(query.toLowerCase())) {
        score += 10;
      }

      // Term-level scoring
      for (const term of queryTerms) {
        // Content contains term
        if (contentLower.includes(term)) {
          score += 2;
        }
        // Keywords contain term
        if (keywords.some(k => k.includes(term) || term.includes(k))) {
          score += 1.5;
        }
        // Tags contain term
        if (tags.some(t => t.toLowerCase().includes(term) || term.includes(t.toLowerCase()))) {
          score += 1;
        }
      }

      // Normalize by number of query terms
      const normalizedScore = queryTerms.length > 0 ? score / queryTerms.length : 0;

      return { ...chunk, relevance_score: normalizedScore };
    });

    // Sort by score descending, take top_k
    scored.sort((a, b) => b.relevance_score - a.relevance_score);
    const topChunks = scored.slice(0, top_k).filter(c => c.relevance_score > 0);

    // Update query_count for retrieved chunks (fire and forget)
    for (const chunk of topChunks) {
      base44.asServiceRole.entities.KnowledgeChunk.update(chunk.id, {
        query_count: (chunk.query_count || 0) + 1,
        relevance_score: chunk.relevance_score
      }).catch(() => {});
    }

    const retrievalMs = Date.now() - startTime;

    return Response.json({
      chunks: topChunks.map(c => ({
        id: c.id,
        source_id: c.source_id,
        content: c.content,
        tags: c.tags,
        keywords: c.keywords,
        relevance_score: c.relevance_score,
        chunk_index: c.chunk_index
      })),
      query,
      agent,
      total_candidates: candidateChunks.length,
      retrieval_ms: retrievalMs
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});