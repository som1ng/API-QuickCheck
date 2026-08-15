/**
 * Batch Keys Concurrency Tester & Cleaner Engine
 */

import { KeyCheckResult, BatchKeySummary, KeyHealthStatus } from '../../types/batchKeys';
import { silentFetch } from '../transport/silentTransport';
import { buildChatCompletionsUrl } from '../transport/urlNormalizer';

export function maskKey(key: string): string {
  if (key.length <= 10) return key;
  return `${key.slice(0, 7)}****${key.slice(-4)}`;
}

export function parseRawKeysInput(rawText: string): { uniqueKeys: string[]; duplicates: string[] } {
  // Support newline, comma, semicolon, space delimiters
  const rawList = rawText
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 5 && !l.startsWith('#') && !l.startsWith('//'));

  const seen = new Set<string>();
  const uniqueKeys: string[] = [];
  const duplicates: string[] = [];

  for (const k of rawList) {
    if (seen.has(k)) {
      duplicates.push(k);
    } else {
      seen.add(k);
      uniqueKeys.push(k);
    }
  }

  return { uniqueKeys, duplicates };
}

export async function testSingleKey(
  baseUrl: string,
  key: string,
  model = 'gpt-4o',
  index: number,
  isStream = false,
  customHeaders?: Record<string, string>,
  signal?: AbortSignal
): Promise<KeyCheckResult> {
  const chatUrl = buildChatCompletionsUrl(baseUrl);
  const cleanKey = key.trim();

  const reqHeaders: Record<string, string> = {
    Authorization: `Bearer ${cleanKey}`,
    'x-api-key': cleanKey,
    'x-goog-api-key': cleanKey,
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const bodyPayload: any = {
    model,
    messages: [{ role: 'user', content: 'hi' }],
    max_tokens: 1,
  };

  if (isStream) {
    bodyPayload.stream = true;
  }

  const res = await silentFetch<any>({
    url: chatUrl,
    method: 'POST',
    headers: reqHeaders,
    body: bodyPayload,
    timeoutMs: 6000,
    signal,
  });

  let status: KeyHealthStatus = 'active';
  if (res.ok || res.status === 200) {
    status = 'active';
  } else if (res.status === 401 || res.errorCategory === 'unauthorized') {
    status = 'invalid';
  } else if (res.status === 402 || res.errorCategory === 'quota') {
    status = 'quota_exhausted';
  } else if (res.status === 429 || res.errorCategory === 'rate_limit') {
    status = 'rate_limited';
  } else if (res.status === 404) {
    // 404 might mean model doesn't exist on this key, but the key is active
    status = 'active';
  } else {
    status = 'network_error';
  }

  return {
    index,
    key: cleanKey,
    maskedKey: maskKey(cleanKey),
    status,
    httpStatus: res.status,
    latencyMs: res.latencyMs,
    errorMessage: res.errorMessage || (res.ok ? '有效可用' : `HTTP ${res.status}`),
  };
}

export async function runBatchKeyTestPool(
  baseUrl: string,
  keys: string[],
  model = 'gpt-4o',
  concurrencyLimit = 5,
  isStream = false,
  customHeaders?: Record<string, string>,
  onItemCompleted?: (item: KeyCheckResult, completedCount: number) => void,
  signal?: AbortSignal
): Promise<BatchKeySummary> {
  const { uniqueKeys, duplicates } = parseRawKeysInput(keys.join('\n'));
  const results: KeyCheckResult[] = [];
  let completedCount = 0;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < uniqueKeys.length) {
      if (signal?.aborted) break;

      const idx = currentIndex++;
      const key = uniqueKeys[idx];
      if (!key) break;

      try {
        const itemResult = await testSingleKey(
          baseUrl,
          key,
          model,
          idx + 1,
          isStream,
          customHeaders,
          signal
        );
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

  const pool = Array.from(
    { length: Math.min(concurrencyLimit, uniqueKeys.length) },
    () => worker()
  );
  await Promise.all(pool);

  const finalResults = results.filter(Boolean);
  const activeCount = finalResults.filter((r) => r.status === 'active').length;
  const exhaustedCount = finalResults.filter((r) => r.status === 'quota_exhausted').length;
  const rateLimitedCount = finalResults.filter((r) => r.status === 'rate_limited').length;
  const invalidCount = finalResults.filter((r) => r.status === 'invalid').length;
  const errorCount = finalResults.filter((r) => r.status === 'network_error').length;

  return {
    total: uniqueKeys.length + duplicates.length,
    completed: completedCount,
    activeCount,
    exhaustedCount,
    rateLimitedCount,
    invalidCount,
    duplicateCount: duplicates.length,
    errorCount,
    results: finalResults,
    duplicates,
  };
}
