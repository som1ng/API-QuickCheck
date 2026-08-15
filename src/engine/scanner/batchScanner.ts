/**
 * Models Discovery & High-Concurrency Batch Scanner Engine
 */

import { ModelCheckItem, ModelStatus } from '../../types/scanner';
import { silentFetch } from '../transport/silentTransport';
import { buildChatCompletionsUrl, getCandidateModelsUrls, normalizeBaseUrl } from '../transport/urlNormalizer';

export function extractUniversalModels(data: unknown): { id: string; name: string }[] {
  if (!data) return [];

  // Case 1: Direct Array
  if (Array.isArray(data)) {
    return data.flatMap(parseModelItem).filter(Boolean);
  }

  if (typeof data !== 'object') return [];
  const obj = data as Record<string, any>;

  // Case 2: obj.data
  if (Array.isArray(obj.data)) {
    return obj.data.flatMap(parseModelItem).filter(Boolean);
  }

  // Case 3: obj.models
  if (Array.isArray(obj.models)) {
    return obj.models.flatMap(parseModelItem).filter(Boolean);
  }

  // Case 4: obj.result
  if (Array.isArray(obj.result)) {
    return obj.result.flatMap(parseModelItem).filter(Boolean);
  }

  // Case 5: obj.data.models or obj.data.list or obj.data.data
  if (obj.data && typeof obj.data === 'object') {
    if (Array.isArray(obj.data.models)) {
      return obj.data.models.flatMap(parseModelItem).filter(Boolean);
    }
    if (Array.isArray(obj.data.list)) {
      return obj.data.list.flatMap(parseModelItem).filter(Boolean);
    }
    if (Array.isArray(obj.data.data)) {
      return obj.data.data.flatMap(parseModelItem).filter(Boolean);
    }
  }

  return [];
}

function parseModelItem(item: unknown): { id: string; name: string }[] {
  if (typeof item === 'string' && item.trim().length > 0) {
    const id = item.trim().replace(/^models\//, '');
    return [{ id, name: id }];
  }

  if (typeof item === 'object' && item !== null) {
    const record = item as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id : typeof record.name === 'string' ? record.name : undefined;
    if (id) {
      const cleanId = id.replace(/^models\//, '');
      const displayName = typeof record.display_name === 'string' ? record.display_name : cleanId;
      return [{ id: cleanId, name: displayName }];
    }
  }

  return [];
}

const COMMON_CANDIDATE_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'o1',
  'o1-mini',
  'o3-mini',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'deepseek-chat',
  'deepseek-reasoner',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'qwen-plus',
  'glm-4-plus',
];

export async function fetchRemoteModels(
  baseUrl: string,
  apiKey: string,
  _platformId?: string,
  signal?: AbortSignal
): Promise<{ id: string; name: string }[]> {
  const cleanBase = normalizeBaseUrl(baseUrl);
  const cleanKey = apiKey.trim();
  const candidateUrls = getCandidateModelsUrls(cleanBase);

  let lastErrorMessage = '';
  let sawUnauthorized = false;
  const attemptedLogs: string[] = [];

  // 1. Try standard /v1/models endpoints first (highest priority first)
  for (const url of candidateUrls) {
    try {
      const res = await silentFetch<unknown>({
        url,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'x-api-key': cleanKey,
          'x-goog-api-key': cleanKey,
        },
        timeoutMs: 8000,
        signal,
      });

      attemptedLogs.push(`GET ${url} -> ${res.status || 'Error'}`);
      if (res.status === 401 || res.status === 403) {
        sawUnauthorized = true;
        lastErrorMessage = res.errorMessage || 'API Key 无效或未授权 (HTTP 401/403)';
      }

      if (res.ok && res.data) {
        const models = extractUniversalModels(res.data);
        if (models.length > 0) {
          const seen = new Set<string>();
          return models.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
        }
      }
    } catch (err: any) {
      attemptedLogs.push(`GET ${url} -> ${err.message || 'Error'}`);
    }
  }

  // 2. Dedicated proxy retry phase for top 2 candidates
  const proxyTargets = candidateUrls.slice(0, 2);
  for (const targetUrl of proxyTargets) {
    try {
      const proxyUrl = `/api/proxy?target=${encodeURIComponent(targetUrl)}`;
      const res = await silentFetch<unknown>({
        url: proxyUrl,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'x-api-key': cleanKey,
          'x-goog-api-key': cleanKey,
        },
        timeoutMs: 10000,
        signal,
      });

      attemptedLogs.push(`PROXY GET ${targetUrl} -> ${res.status || 'Error'}`);
      if (res.status === 401 || res.status === 403) {
        sawUnauthorized = true;
        lastErrorMessage = res.errorMessage || 'API Key 无效或未授权 (HTTP 401/403)';
      }

      if (res.ok && res.data) {
        const models = extractUniversalModels(res.data);
        if (models.length > 0) {
          const seen = new Set<string>();
          return models.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
        }
      }
    } catch (err: any) {
      attemptedLogs.push(`PROXY GET ${targetUrl} -> ${err.message || 'Error'}`);
    }
  }

  // 3. Fallback: Fast Probe across high-frequency models via POST /v1/chat/completions
  if (cleanKey.length > 5) {
    const discovered: { id: string; name: string }[] = [];
    const chatUrl = buildChatCompletionsUrl(cleanBase);

    const probePromises = COMMON_CANDIDATE_MODELS.map(async (modelId) => {
      try {
        const res = await silentFetch<any>({
          url: chatUrl,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cleanKey}`,
            'x-api-key': cleanKey,
            'Content-Type': 'application/json',
          },
          body: {
            model: modelId,
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1,
          },
          timeoutMs: 6000,
          signal,
        });

        // If status 200, 400 (bad params), 402 (quota), or 429 (rate limit), the model DEFINITELY exists on relay!
        if (res.ok || res.status === 200 || res.status === 400 || res.status === 402 || res.status === 429) {
          discovered.push({ id: modelId, name: modelId });
        }
      } catch {
        // ignore
      }
    });

    await Promise.allSettled(probePromises);

    if (discovered.length > 0) {
      return discovered;
    }
  }

  if (sawUnauthorized) {
    throw new Error(`API Key 无效或未授权 (HTTP 401/403)，请确认当前中转站 API Key 是否正确！\n\n已尝试路由:\n${attemptedLogs.join('\n')}`);
  }

  throw new Error(`${lastErrorMessage || '未探测到可用模型列表。该中转站可能在后台关闭了 /v1/models 接口，你可以直接在下方输入框手动填写模型名进行检测'}\n\n已尝试路由:\n${attemptedLogs.join('\n')}`);
}

export function classifyModelProvider(modelId: string): ModelCheckItem['provider'] {
  const lower = modelId.toLowerCase();
  if (lower.includes('gpt') || lower.includes('o1') || lower.includes('o3') || lower.includes('dall-e') || lower.includes('text-embedding')) {
    return 'openai';
  }
  if (lower.includes('claude')) {
    return 'anthropic';
  }
  if (lower.includes('deepseek')) {
    return 'deepseek';
  }
  if (lower.includes('gemini') || lower.includes('gemma')) {
    return 'google';
  }
  if (lower.includes('llama') || lower.includes('meta')) {
    return 'meta';
  }
  return 'other';
}

export async function scanSingleModel(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  signal?: AbortSignal
): Promise<ModelCheckItem> {
  const chatUrl = buildChatCompletionsUrl(baseUrl);
  const provider = classifyModelProvider(modelId);
  const cleanKey = apiKey.trim();

  const res = await silentFetch<any>({
    url: chatUrl,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cleanKey}`,
      'x-api-key': cleanKey,
      'Content-Type': 'application/json',
    },
    body: {
      model: modelId,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1,
    },
    timeoutMs: 5000,
    signal,
  });

  let status: ModelStatus = 'available';
  if (res.ok) {
    status = 'available';
  } else if (res.errorCategory === 'unauthorized') {
    status = 'unauthorized';
  } else if (res.errorCategory === 'quota') {
    status = 'quota_exhausted';
  } else if (res.errorCategory === 'rate_limit') {
    status = 'rate_limited';
  } else if (res.errorCategory === 'not_found') {
    status = 'not_found';
  } else if (res.status >= 500) {
    status = 'server_error';
  } else {
    status = 'server_error';
  }

  return {
    id: modelId,
    name: modelId,
    provider,
    status,
    httpStatus: res.status,
    latencyMs: res.latencyMs,
    errorMessage: res.errorMessage,
  };
}

export async function runBatchScanPool(
  baseUrl: string,
  apiKey: string,
  models: { id: string; name: string }[],
  concurrencyLimit = 5,
  onItemCompleted?: (item: ModelCheckItem, completedCount: number) => void,
  signal?: AbortSignal
): Promise<ModelCheckItem[]> {
  const results: ModelCheckItem[] = [];
  let completedCount = 0;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < models.length) {
      if (signal?.aborted) break;

      const idx = currentIndex++;
      const model = models[idx];
      if (!model) break;

      try {
        const itemResult = await scanSingleModel(baseUrl, apiKey, model.id, signal);
        results[idx] = itemResult;
        completedCount++;
        onItemCompleted?.(itemResult, completedCount);
      } catch (err: unknown) {
        const errorItem: ModelCheckItem = {
          id: model.id,
          name: model.name,
          provider: classifyModelProvider(model.id),
          status: 'server_error',
          errorMessage: err instanceof Error ? err.message : String(err),
        };
        results[idx] = errorItem;
        completedCount++;
        onItemCompleted?.(errorItem, completedCount);
      }
    }
  }

  const pool = Array.from({ length: Math.min(concurrencyLimit, models.length) }, () => worker());
  await Promise.all(pool);

  return results.filter(Boolean);
}
