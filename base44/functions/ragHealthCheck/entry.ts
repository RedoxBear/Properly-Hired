import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 1) Source and chunk counts by agent
    const kyleSources = await base44.asServiceRole.entities.KnowledgeSource.filter({ agent: 'kyle' }, '-created_date', 500);
    const simonSources = await base44.asServiceRole.entities.KnowledgeSource.filter({ agent: 'simon' }, '-created_date', 500);
    const bothSources = await base44.asServiceRole.entities.KnowledgeSource.filter({ agent: 'both' }, '-created_date', 500);

    const kyleChunks = await base44.asServiceRole.entities.KnowledgeChunk.filter({ agent: 'kyle' }, '-created_date', 500);
    const simonChunks = await base44.asServiceRole.entities.KnowledgeChunk.filter({ agent: 'simon' }, '-created_date', 500);
    const bothChunks = await base44.asServiceRole.entities.KnowledgeChunk.filter({ agent: 'both' }, '-created_date', 500);

    // 2) Recent ingestions (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const allSources = [...kyleSources, ...simonSources, ...bothSources];
    const recentSources = allSources.filter(s => s.ingested_at && s.ingested_at > oneDayAgo);

    // 3) Sources with 0 chunks
    const sourcesNoChunks = allSources.filter(s => !s.chunk_count || s.chunk_count === 0);

    // 4) Failed sources
    const failedSources = allSources.filter(s => s.status === 'failed');

    // 5) Duplicate sources (same source_path)
    const pathCount = {};
    allSources.forEach(s => {
      pathCount[s.source_path] = (pathCount[s.source_path] || 0) + 1;
    });
    const duplicates = Object.entries(pathCount).filter(([, c]) => c > 1).map(([p, c]) => ({ path: p, count: c }));

    // 6) Top queried chunks
    const allChunks = [...kyleChunks, ...simonChunks, ...bothChunks];
    const topQueried = [...allChunks]
      .filter(c => c.query_count > 0)
      .sort((a, b) => (b.query_count || 0) - (a.query_count || 0))
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        agent: c.agent,
        query_count: c.query_count,
        relevance_score: c.relevance_score,
        content_preview: (c.content || '').substring(0, 100) + '...',
        tags: c.tags
      }));

    // 7) Chunks missing content
    const emptyChunks = allChunks.filter(c => !c.content || c.content.trim().length < 10);

    // 8) Run test queries for latency measurement
    const testQueries = [
      { agent: 'kyle', query: 'cover letter checklist' },
      { agent: 'kyle', query: 'resume length' },
      { agent: 'simon', query: 'ghost job detection' },
      { agent: 'simon', query: 'recruiting strategy' }
    ];

    const testResults = [];
    for (const tq of testQueries) {
      const start = Date.now();
      const result = await base44.asServiceRole.functions.invoke('ragRetrieve', {
        query: tq.query,
        agent: tq.agent,
        top_k: 5
      });
      const latency = Date.now() - start;
      const data = result?.data || result || {};
      testResults.push({
        agent: tq.agent,
        query: tq.query,
        hits: data.chunks?.length || 0,
        retrieval_ms: data.retrieval_ms || latency,
        top_chunk_preview: data.chunks?.[0]?.content?.substring(0, 120) || 'N/A',
        top_relevance: data.chunks?.[0]?.relevance_score || 0
      });
    }

    const latencies = testResults.map(r => r.retrieval_ms);
    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

    return Response.json({
      summary: {
        sources: {
          kyle: kyleSources.length,
          simon: simonSources.length,
          both: bothSources.length,
          total: allSources.length
        },
        chunks: {
          kyle: kyleChunks.length,
          simon: simonChunks.length,
          both: bothChunks.length,
          total: allChunks.length
        },
        recent_ingestions_24h: recentSources.length
      },
      data_integrity: {
        sources_with_no_chunks: sourcesNoChunks.map(s => ({ id: s.id, path: s.source_path, status: s.status })),
        failed_sources: failedSources.map(s => ({ id: s.id, path: s.source_path, error: s.error_message })),
        duplicate_sources: duplicates,
        empty_chunks: emptyChunks.length
      },
      retrieval_quality: {
        top_queried_chunks: topQueried,
        test_results: testResults
      },
      performance: {
        avg_retrieval_ms: avgLatency,
        max_retrieval_ms: maxLatency
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});