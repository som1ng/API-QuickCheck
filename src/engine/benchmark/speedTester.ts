/**
 * Streaming Latency & Performance Benchmark Engine
 * Accurately measures TTFT (Time to First Token), TPS (Tokens Per Second), and stream jitter.
 */

import { BenchmarkRoundResult, BenchmarkSummary } from '../../types/benchmark';
import { readSSEStream } from '../transport/sseReader';
import { buildChatCompletionsUrl } from '../transport/urlNormalizer';
import { silentStreamingFetch } from '../transport/silentTransport';

export async function runBenchmarkRound(
  baseUrl: string,
  apiKey: string,
  model: string,
  roundIndex: number,
  onChunk?: (text: string, currentTps: number, ttftMs: number) => void,
  signal?: AbortSignal
): Promise<BenchmarkRoundResult> {
  const url = buildChatCompletionsUrl(baseUrl);
  const prompt = 'Please write a concise 120-word explanation of how quantum computing principles work in practice.';

  const startTime = performance.now();
  let firstChunkTime = 0;
  let fullText = '';
  let chunkCount = 0;
  const chunkDeltas: number[] = [];
  let lastChunkTime = startTime;
  let completionTokensFromApi: number | undefined = undefined;

  try {
    const response = await silentStreamingFetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        max_tokens: 300,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        round: roundIndex,
        ttftMs: 0,
        totalDurationMs: Math.round(performance.now() - startTime),
        outputTokens: 0,
        tps: 0,
        jitterVariance: 0,
        fullText: '',
        status: 'failed',
        errorMessage: `HTTP ${response.status}: ${errText.slice(0, 100)}`,
      };
    }

    for await (const chunk of readSSEStream(response, signal)) {
      const now = performance.now();

      if (chunk.completionTokens !== undefined) {
        completionTokensFromApi = chunk.completionTokens;
      }

      if (chunk.textDelta) {
        if (!firstChunkTime) {
          firstChunkTime = now;
        }

        const delta = now - lastChunkTime;
        chunkDeltas.push(delta);
        lastChunkTime = now;

        fullText += chunk.textDelta;
        chunkCount++;

        const elapsedSinceFirstChunk = (now - firstChunkTime) / 1000;
        const currentTokens = Math.max(1, Math.round(fullText.length / 3.8));
        const currentTps = elapsedSinceFirstChunk > 0 ? Math.round((currentTokens / elapsedSinceFirstChunk) * 10) / 10 : 0;
        const currentTtft = Math.round(firstChunkTime - startTime);

        onChunk?.(fullText, currentTps, currentTtft);
      }
    }

    const endTime = performance.now();
    const ttftMs = firstChunkTime ? Math.round(firstChunkTime - startTime) : Math.round(endTime - startTime);
    const totalDurationMs = Math.round(endTime - startTime);
    const streamDurationSec = firstChunkTime ? (endTime - firstChunkTime) / 1000 : 0;

    const estimatedTokens = Math.round(fullText.length / 3.8);
    const finalTokens = completionTokensFromApi || estimatedTokens || chunkCount;
    const finalTps = streamDurationSec > 0 ? Math.round((finalTokens / streamDurationSec) * 10) / 10 : 0;

    // Calculate Jitter (Variance of inter-chunk arrival times)
    let variance = 0;
    if (chunkDeltas.length > 1) {
      const meanDelta = chunkDeltas.reduce((a, b) => a + b, 0) / chunkDeltas.length;
      variance = Math.round(chunkDeltas.reduce((acc, d) => acc + Math.pow(d - meanDelta, 2), 0) / chunkDeltas.length);
    }

    return {
      round: roundIndex,
      ttftMs,
      totalDurationMs,
      outputTokens: finalTokens,
      tps: finalTps,
      jitterVariance: variance,
      fullText,
      status: 'completed',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      round: roundIndex,
      ttftMs: 0,
      totalDurationMs: Math.round(performance.now() - startTime),
      outputTokens: 0,
      tps: 0,
      jitterVariance: 0,
      fullText: '',
      status: 'failed',
      errorMessage: errorMsg,
    };
  }
}

export function aggregateBenchmarkSummary(
  model: string,
  rounds: BenchmarkRoundResult[]
): BenchmarkSummary {
  const completed = rounds.filter((r) => r.status === 'completed');

  if (completed.length === 0) {
    return {
      model,
      roundsCount: rounds.length,
      avgTtftMs: 0,
      minTtftMs: 0,
      maxTtftMs: 0,
      avgTps: 0,
      maxTps: 0,
      isTpsEstimated: true,
      stabilityScore: 'poor',
      avgJitterVariance: 0,
      rounds,
    };
  }

  const ttfts = completed.map((r) => r.ttftMs);
  const tpsList = completed.map((r) => r.tps);
  const jitters = completed.map((r) => r.jitterVariance);

  const avgTtft = Math.round(ttfts.reduce((a, b) => a + b, 0) / ttfts.length);
  const minTtft = Math.min(...ttfts);
  const maxTtft = Math.max(...ttfts);

  const avgTps = Math.round((tpsList.reduce((a, b) => a + b, 0) / tpsList.length) * 10) / 10;
  const maxTps = Math.max(...tpsList);

  const avgJitter = Math.round(jitters.reduce((a, b) => a + b, 0) / jitters.length);

  let stability: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  if (avgJitter < 200 && avgTtft < 800) stability = 'excellent';
  else if (avgJitter < 800) stability = 'good';
  else if (avgJitter < 2000) stability = 'fair';
  else stability = 'poor';

  return {
    model,
    roundsCount: rounds.length,
    avgTtftMs: avgTtft,
    minTtftMs: minTtft,
    maxTtftMs: maxTtft,
    avgTps,
    maxTps,
    isTpsEstimated: true,
    stabilityScore: stability,
    avgJitterVariance: avgJitter,
    rounds,
  };
}
