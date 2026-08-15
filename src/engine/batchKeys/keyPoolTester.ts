/**
 * Batch Keys Concurrency Tester & Cleaner Engine
 */

import { KeyCheckResult, BatchKeySummary, KeyHealthStatus } from '../../types/batchKeys';
import { silentFetch } from '../transport/silentTransport';
import { buildChatCompletionsUrl } from '../transport/urlNormalizer';

export function maskKey(key: string): string {
  if (key.length <= 10) return key;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export function parseKeyList(rawText: string): string[] {
  const lines = rawText.split('\n');
  const cleaned = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 5 && !l.startsWith('#'));
  
  // Deduplicate
  return Array.from(new Set(cleaned));
}

export async function testSingleKey(
  baseUrl: string,
  key: string,
  model = 'gpt-4o',
  index: number,
  signal?: AbortSignal
): Promise<KeyCheckResult> {
  const chatUrl = buildChatCompletionsUrl(baseUrl);

  const res = await silentFetch<any>({
    url: chatUrl,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: {
      model,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1,
    },
    timeoutMs: 5000,
    signal,
  });

  let status: KeyHealthStatus = 'active';
  if (res.ok) {
    status = 'active';
  } else if (res.errorCategory === 'unauthorized') {
    status = 'invalid';
  } else if (res.errorCategory === 'quota') {
    status = 'quota_exhausted';
  } else if (res.errorCategory === 'rate_limit') {
    status = 'rate_limited';
  } else {
    status = 'network_error';
  }

  return {
    index,
    key,
    maskedKey: maskKey(key),
    status,
    httpStatus: res.status,
    latencyMs: res.latencyMs,
    errorMessage: res.errorMessage,
  };
}

export async function runBatchKeyTestPool(
  baseUrl: string,
  keys: string[],
  model = 'gpt-4o',
  concurrencyLimit = 5,
  onItemCompleted?: (item: KeyCheckResult, completedCount: number) => void,
  signal?: AbortSignal
): Promise<BatchKeySummary> {
  const results: KeyCheckResult[] = [];
  let completedCount = 0;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < keys.length) {
      if (signal?.aborted) break;

      const idx = currentIndex++;
      const key = keys[idx];
      if (!key) break;

      try {
        const itemResult = await testSingleKey(baseUrl, key, model, idx + 1, signal);
        results[idx] = itemResult;
        completedCount++;
        onItemCompleted?.(itemResult, completedCount);
      } catch (err: unknown) {
        const errorItem: KeyCheckResult = {
          index: idx + 1,
          key,
          maskedKey: maskKey(key),
          status: 'network_error',
          errorMessage: err instanceof Error ? err.message : String(err),
        };
        results[idx] = errorItem;
        completedCount++;
        onItemCompleted?.(errorItem, completedCount);
      }
    }
  }

  const pool = Array.from({ length: Math.min(concurrencyLimit, keys.length) }, () => worker());
  await Promise.all(pool);

  const finalResults = results.filter(Boolean);
  const activeCount = finalResults.filter((r) => r.status === 'active').length;
  const exhaustedCount = finalResults.filter((r) => r.status === 'quota_exhausted').length;
  const invalidCount = finalResults.filter((r) => r.status === 'invalid').length;
  const errorCount = finalResults.filter((r) => r.status === 'rate_limited' || r.status === 'network_error').length;

  return {
    total: keys.length,
    completed: completedCount,
    activeCount,
    exhaustedCount,
    invalidCount,
    errorCount,
    results: finalResults,
  };
}
