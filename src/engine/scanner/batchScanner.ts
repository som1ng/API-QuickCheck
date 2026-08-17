/**
 * Models Discovery & High-Concurrency Batch Scanner Engine
 */

import { ModelCheckItem, ModelStatus } from '../../types/scanner';
import { silentFetch } from '../transport/silentTransport';
import { buildChatCompletionsUrl, getCandidateModelsUrls, normalizeBaseUrl } from '../transport/urlNormalizer';

export function extractUniversalModels(data: unknown): { id: string; name: string }[] {
  if (!data) return [];

  // If string, attempt JSON parse
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return extractUniversalModels(parsed);
    } catch {
      return [];
    }
  }

  // Case 1: Direct Array
  if (Array.isArray(data)) {
    return data.flatMap(parseModelItem).filter(Boolean);
  }

  if (typeof data !== 'object' || data === null) return [];
  const obj = data as Record<string, any>;

  // Case 2: Standard and known array container keys
  const candidateKeys = ['data', 'models', 'result', 'list', 'items', 'model_list', 'available_models', 'channels'];
  for (const key of candidateKeys) {
    const val = obj[key];
    if (Array.isArray(val)) {
      const parsed = val.flatMap(parseModelItem).filter(Boolean);
      if (parsed.length > 0) return parsed;
    } else if (val && typeof val === 'object') {
      const parsed = extractUniversalModels(val);
      if (parsed.length > 0) return parsed;
    }
  }

  // Case 3: Object where keys themselves are model identifiers
  const entries = Object.entries(obj);
  if (entries.length > 0 && entries.every(([k, v]) => typeof k === 'string' && !k.startsWith('_') && k.length > 2 && (typeof v === 'object' || typeof v === 'boolean' || typeof v === 'number'))) {
    const found: { id: string; name: string }[] = [];
    for (const [k, v] of entries) {
      if (['object', 'success', 'code', 'msg', 'message', 'status', 'created', 'usage'].includes(k.toLowerCase())) continue;
      const displayName = (v as any)?.name || (v as any)?.display_name || k;
      found.push({ id: k, name: displayName });
    }
    if (found.length > 0) return found;
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
    const id =
      typeof record.id === 'string'
        ? record.id
        : typeof record.name === 'string'
        ? record.name
        : typeof record.model === 'string'
        ? record.model
        : typeof record.model_name === 'string'
        ? record.model_name
        : typeof record.model_id === 'string'
        ? record.model_id
        : typeof record.slug === 'string'
        ? record.slug
        : undefined;

    if (id && typeof id === 'string' && id.trim().length > 0) {
      const cleanId = id.trim().replace(/^models\//, '');
      const displayName =
        typeof record.display_name === 'string'
          ? record.display_name
          : typeof record.displayName === 'string'
          ? record.displayName
          : cleanId;
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
  const proxyTargets = typeof window !== 'undefined' ? candidateUrls.slice(0, 2) : [];
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
    let unauthorizedProbeCount = 0;

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

        if (res.status === 401 || res.status === 403) {
          unauthorizedProbeCount += 1;
        }

        const errorText = res.rawText.toLowerCase();
        const explicitlyMissingModel = [
          'model_not_found',
          'model not found',
          'model does not exist',
          'unknown model',
          'invalid model',
          'no available channel',
          '模型不存在',
          '无可用渠道',
        ].some((message) => errorText.includes(message));

        if (res.ok || res.status === 200 || res.status === 402 || res.status === 429 || (res.status === 400 && !explicitlyMissingModel)) {
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

    if (unauthorizedProbeCount === COMMON_CANDIDATE_MODELS.length) {
      sawUnauthorized = true;
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
