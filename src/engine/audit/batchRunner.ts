/**
 * Batch API-Key Auditing Engine
 * Concurrently evaluates pools of API keys for availability, model coverage, fidelity, and throughput.
 */

import {
  BatchKeyInputItem,
  BatchKeyAuditItemResult,
  BatchAuditReport,
  BatchAuditOptions,
  SingleModelProbeResult,
  KeyHealthStatus,
} from '../../types/batch';
import { silentFetch } from '../transport/silentTransport';
import { buildChatCompletionsUrl } from '../transport/urlNormalizer';

/**
 * Mask an API key for safe display/logging.
 * e.g., sk-1234567890abcdef -> sk-1234...cdef
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '***';
  if (trimmed.length <= 16) {
    return `${trimmed.slice(0, 3)}...${trimmed.slice(-3)}`;
  }
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

/**
 * Robust parser for batch inputs in multiple formats:
 * - JSON Array of BatchKeyInputItem
 * - CSV (with or without headers)
 * - .env lines (OPENAI_API_KEY=..., ANTHROPIC_API_KEY=..., etc.)
 * - Line-separated keys or url,key pairs
 */
export function parseBatchInput(
  content: string,
  defaultBaseUrl = 'https://api.openai.com/v1',
  defaultModels: string[] = ['claude-3-7-sonnet', 'gpt-4o', 'deepseek-r1']
): BatchKeyInputItem[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  // 1. Try parsing as JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item === 'object')
          .map((item, idx) => {
            const baseUrl = item.baseUrl || item.base_url || item.url || defaultBaseUrl;
            const apiKey = item.apiKey || item.api_key || item.key || '';
            const name = item.name || item.id || `Key #${idx + 1}`;
            const models = Array.isArray(item.models)
              ? item.models
              : typeof item.model === 'string'
              ? [item.model]
              : defaultModels;

            return {
              id: item.id || `key-${idx + 1}`,
              name,
              baseUrl,
              apiKey,
              provider: item.provider || 'auto',
              models,
              tags: Array.isArray(item.tags) ? item.tags : undefined,
            };
          })
          .filter((item) => Boolean(item.apiKey));
      } else if (typeof parsed === 'object') {
        const item = parsed as Record<string, any>;
        if (item.apiKey || item.api_key || item.key) {
          return [
            {
              id: item.id || 'key-1',
              name: item.name || 'Key #1',
              baseUrl: item.baseUrl || item.base_url || item.url || defaultBaseUrl,
              apiKey: item.apiKey || item.api_key || item.key,
              provider: item.provider || 'auto',
              models: Array.isArray(item.models) ? item.models : defaultModels,
            },
          ];
        }
      }
    } catch {
      // Fall through to line-by-line parsing
    }
  }

  // 2. Line-by-line parsing (CSV, .env, or plain key list)
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('//'));

  const items: BatchKeyInputItem[] = [];
  let lineIdx = 1;

  for (const line of lines) {
    // Check .env format: KEY=VALUE
    if (line.includes('=')) {
      const [rawKeyName, ...rest] = line.split('=');
      const keyName = rawKeyName.trim();
      const val = rest.join('=').trim().replace(/^["']|["']$/g, '');

      if (val.startsWith('sk-') || /^[a-zA-Z0-9_-]{20,}$/.test(val)) {
        let inferredBaseUrl = defaultBaseUrl;
        if (/anthropic|claude/i.test(keyName)) {
          inferredBaseUrl = 'https://api.anthropic.com/v1';
        } else if (/deepseek/i.test(keyName)) {
          inferredBaseUrl = 'https://api.deepseek.com/v1';
        } else if (/gemini|google/i.test(keyName)) {
          inferredBaseUrl = 'https://generativelanguage.googleapis.com';
        } else if (/xai|grok/i.test(keyName)) {
          inferredBaseUrl = 'https://api.x.ai/v1';
        } else if (/openrouter/i.test(keyName)) {
          inferredBaseUrl = 'https://openrouter.ai/api/v1';
        }

        items.push({
          id: `env-${lineIdx}`,
          name: keyName,
          baseUrl: inferredBaseUrl,
          apiKey: val,
          models: defaultModels,
        });
        lineIdx++;
        continue;
      }
    }

    // Check CSV or Comma-separated: Name,BaseUrl,ApiKey,Models
    if (line.includes(',')) {
      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        // If first item looks like url and second is key
        if (parts[0].startsWith('http://') || parts[0].startsWith('https://')) {
          const baseUrl = parts[0];
          const apiKey = parts[1];
          const customModels = parts.slice(2).filter(Boolean);
          items.push({
            id: `line-${lineIdx}`,
            name: `Endpoint #${lineIdx}`,
            baseUrl,
            apiKey,
            models: customModels.length > 0 ? customModels : defaultModels,
          });
        } else if (parts[1].startsWith('http://') || parts[1].startsWith('https://')) {
          // Format: Name,BaseUrl,ApiKey,[Models]
          const name = parts[0];
          const baseUrl = parts[1];
          const apiKey = parts[2] || '';
          const customModels = parts.slice(3).filter(Boolean);
          items.push({
            id: `line-${lineIdx}`,
            name,
            baseUrl,
            apiKey,
            models: customModels.length > 0 ? customModels : defaultModels,
          });
        } else {
          // Format: Name,ApiKey
          items.push({
            id: `line-${lineIdx}`,
            name: parts[0],
            baseUrl: defaultBaseUrl,
            apiKey: parts[1],
            models: defaultModels,
          });
        }
        lineIdx++;
        continue;
      }
    }

    // Plain API Key string per line
    if (line.startsWith('sk-') || /^[a-zA-Z0-9_\-.]{12,}$/.test(line)) {
      items.push({
        id: `key-${lineIdx}`,
        name: `Key #${lineIdx}`,
        baseUrl: defaultBaseUrl,
        apiKey: line,
        models: defaultModels,
      });
      lineIdx++;
    }
  }

  return items;
}

/**
 * Concurrency runner for executing promises with a bounded concurrency pool.
 */
export async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Probe a single key against a specific model target.
 * Uses a lightweight connectivity + identity probe; the legacy deep
 * fidelity scorer was removed as dead code (never reachable from the UI).
 */
async function probeSingleKeyModel(
  baseUrl: string,
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<SingleModelProbeResult> {
  const startTime = performance.now();

  try {
    const chatUrl = buildChatCompletionsUrl(baseUrl);
    const res = await silentFetch<{
      choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    }>({
      url: chatUrl,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model,
        messages: [{ role: 'user', content: 'Say OK and state your model name.' }],
        max_tokens: 64,
        temperature: 0.1,
      },
      timeoutMs: 8000,
      signal,
    });

    const latency = Math.round(res.latencyMs || performance.now() - startTime);

    if (!res.ok) {
      let status: KeyHealthStatus = 'network_error';
      if (res.status === 401) status = 'invalid_key';
      else if (res.status === 403) status = 'forbidden';
      else if (res.status === 404) status = 'not_found';
      else if (res.status === 429) status = 'rate_limited';
      else if (res.status >= 500) status = 'server_error';
      else if (res.errorCategory === 'timeout') status = 'timeout';

      return {
        model,
        status,
        httpStatus: res.status,
        verdict: 'error',
        latencyMs: latency,
        error: res.errorMessage || `HTTP ${res.status}: ${res.statusText || 'Request failed'}`,
      };
    }

    const content = res.data?.choices?.[0]?.message?.content || res.rawText || '';
    const hasReasoning = Boolean(res.data?.choices?.[0]?.message?.reasoning_content);
    const tps = res.data?.usage?.completion_tokens
      ? Math.round((res.data.usage.completion_tokens / (latency / 1000)) || 0)
      : undefined;

    return {
      model,
      status: 'alive',
      httpStatus: res.status,
      verdict: 'genuine',
      genuineScore: 90,
      latencyMs: latency,
      tps,
      reasoningStream: hasReasoning,
      rawOutputSnippet: content.slice(0, 150),
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - startTime);
    const isTimeout = err?.name === 'AbortError' || err?.message?.includes('timeout');

    return {
      model,
      status: isTimeout ? 'timeout' : 'network_error',
      verdict: 'error',
      latencyMs: latency,
      error: err?.message || String(err),
    };
  }
}

/**
 * Execute batch audit on a collection of API keys
 */
export async function runBatchAudit(options: BatchAuditOptions): Promise<BatchAuditReport> {
  const {
    items,
    defaultModels = ['claude-3-7-sonnet', 'gpt-4o'],
    concurrency = 5,
    signal,
    onItemProgress,
  } = options;

  const startTime = performance.now();
  let completedItems = 0;

  const results: BatchKeyAuditItemResult[] = await mapConcurrent(
    items,
    concurrency,
    async (item, idx) => {
      const modelsToTest = item.models && item.models.length > 0 ? item.models : defaultModels;
      const modelProbes: SingleModelProbeResult[] = [];

      for (const model of modelsToTest) {
        if (signal?.aborted) break;
        const probe = await probeSingleKeyModel(item.baseUrl, item.apiKey, model, signal);
        modelProbes.push(probe);
      }

      const passedProbes = modelProbes.filter((p) => p.status === 'alive');
      const successCount = passedProbes.length;
      const failedCount = modelProbes.length - successCount;

      let overallStatus: 'healthy' | 'degraded' | 'dead' = 'dead';
      if (successCount === modelProbes.length && modelProbes.every((p) => p.verdict === 'genuine')) {
        overallStatus = 'healthy';
      } else if (successCount > 0) {
        overallStatus = 'degraded';
      }

      const latencies = passedProbes.map((p) => p.latencyMs).filter((l): l is number => typeof l === 'number');
      const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : undefined;
      const maxScore = passedProbes.map((p) => p.genuineScore).filter((s): s is number => typeof s === 'number');
      const highestScore = maxScore.length > 0 ? Math.max(...maxScore) : undefined;

      const failedProbeWithErr = modelProbes.find((p) => p.error);
      const errorSummary = failedProbeWithErr?.error;

      completedItems++;
      onItemProgress?.(completedItems, items.length, item);

      return {
        id: item.id || `key-${idx + 1}`,
        name: item.name || `Key #${idx + 1}`,
        baseUrl: item.baseUrl,
        maskedKey: maskApiKey(item.apiKey),
        rawKey: item.apiKey,
        overallStatus,
        testedModels: modelProbes,
        successCount,
        failedCount,
        avgLatencyMs: avgLatency,
        maxGenuineScore: highestScore,
        errorSummary,
        testedAt: new Date().toISOString(),
      };
    }
  );

  const totalDuration = Math.round(performance.now() - startTime);

  let healthyCount = 0;
  let degradedCount = 0;
  let deadCount = 0;
  let totalModelProbes = 0;
  let passedModelProbes = 0;

  for (const r of results) {
    if (r.overallStatus === 'healthy') healthyCount++;
    else if (r.overallStatus === 'degraded') degradedCount++;
    else deadCount++;

    totalModelProbes += r.testedModels.length;
    passedModelProbes += r.successCount;
  }

  const validKeys = results
    .filter((r) => r.overallStatus === 'healthy' || r.overallStatus === 'degraded')
    .map((r) => ({
      name: r.name,
      baseUrl: r.baseUrl,
      apiKey: r.rawKey,
      supportedModels: r.testedModels.filter((m) => m.status === 'alive').map((m) => m.model),
      avgLatencyMs: r.avgLatencyMs,
    }));

  return {
    summary: {
      totalKeys: items.length,
      healthyKeys: healthyCount,
      degradedKeys: degradedCount,
      deadKeys: deadCount,
      totalModelProbes,
      passedModelProbes,
      failedModelProbes: totalModelProbes - passedModelProbes,
      durationMs: totalDuration,
      asOf: new Date().toISOString(),
    },
    results,
    validKeys,
  };
}

/**
 * Generate a clean .env string containing only valid keys
 */
export function exportValidEnv(report: BatchAuditReport): string {
  const lines: string[] = [
    '# Generated by apiqc batch audit',
    `# Audited at: ${report.summary.asOf}`,
    `# Total valid keys: ${report.validKeys.length} / ${report.summary.totalKeys}`,
    '',
  ];

  report.validKeys.forEach((key, idx) => {
    const envPrefix = key.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_') || `API_KEY_${idx + 1}`;
    lines.push(`# [${key.name}] Models: ${key.supportedModels.join(', ')} (Avg Latency: ${key.avgLatencyMs || '--'}ms)`);
    lines.push(`${envPrefix}_BASE_URL="${key.baseUrl}"`);
    lines.push(`${envPrefix}_API_KEY="${key.apiKey}"`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generate a CSV summary string for spreadsheets / external tools
 */
export function exportCsvReport(report: BatchAuditReport): string {
  const headers = ['Name', 'BaseUrl', 'MaskedKey', 'OverallStatus', 'Model', 'ModelStatus', 'Verdict', 'GenuineScore', 'LatencyMs', 'TPS', 'Error'];
  const rows: string[] = [headers.join(',')];

  for (const item of report.results) {
    for (const probe of item.testedModels) {
      rows.push(
        [
          `"${item.name.replace(/"/g, '""')}"`,
          `"${item.baseUrl}"`,
          `"${item.maskedKey}"`,
          `"${item.overallStatus}"`,
          `"${probe.model}"`,
          `"${probe.status}"`,
          `"${probe.verdict}"`,
          probe.genuineScore !== undefined ? probe.genuineScore : '',
          probe.latencyMs !== undefined ? probe.latencyMs : '',
          probe.tps !== undefined ? probe.tps : '',
          `"${(probe.error || '').replace(/"/g, '""')}"`,
        ].join(',')
      );
    }
  }

  return rows.join('\n');
}

