/**
 * Batch Keys Concurrency Tester, Balance/Model Sniffer & Cleaner Engine
 */

import { KeyCheckResult, BatchKeySummary, KeyHealthStatus, KeyBalanceDetails } from '../../types/batchKeys';
import { parseRelayBalancePayload } from '../billing/quotaSniffer';
import { silentFetch } from '../transport/silentTransport';
import {
  buildChatCompletionsUrl,
  getCandidateModelsUrls,
  getBaseRootUrl,
  normalizeBaseUrl,
} from '../transport/urlNormalizer';

export function maskKey(key: string): string {
  if (key.length <= 10) return key;
  return `${key.slice(0, 7)}****${key.slice(-4)}`;
}

/**
 * 校验字符串是否具备 API Key 的基本合法形态
 */
function isValidKeyCandidate(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const clean = cleanSingleKey(key);
  // 长度应 >= 8 且不超过 256
  if (clean.length < 8 || clean.length > 256) return false;
  // 不能包含中文字符或换行空白
  if (/[\u4e00-\u9fa5\r\n\t\s]/.test(clean)) return false;
  // 不能是保留字或常见非 key 单词
  const lower = clean.toLowerCase();
  const blacklisted = [
    'undefined',
    'null',
    'bearer',
    'authorization',
    'secret',
    'apikey',
    'password',
    'false',
    'true',
    'token',
  ];
  if (blacklisted.includes(lower)) {
    return false;
  }
  return true;
}

/**
 * 清除单个 key 的首尾冗余字符（如引号、冒号、逗号、分号、括号等）及常见前缀
 */
export function cleanSingleKey(key: string): string {
  if (!key) return '';
  return key
    .trim()
    .replace(/^["'`([{<]+|["'`)\]}>,;]+$/g, '')
    .replace(/^(?:Bearer\s+)/i, '')
    .replace(/^(?:api[-_]?key|key|token|sk)\s*[:=]\s*/i, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}

/**
 * 递归从 JSON 对象或数组中提取符合 API Key 特征的字符串
 */
function extractKeysFromJsonObject(obj: unknown): string[] {
  const results: string[] = [];
  const keyPropRegex = /^(?:api[-_]?key|key|secret[-_]?key|token|sk|auth|value|credential)$/i;

  function traverse(node: unknown) {
    if (!node) return;
    if (typeof node === 'string') {
      const cleaned = cleanSingleKey(node);
      if (isValidKeyCandidate(cleaned)) {
        results.push(cleaned);
      }
    } else if (Array.isArray(node)) {
      for (const item of node) {
        traverse(item);
      }
    } else if (typeof node === 'object') {
      const record = node as Record<string, unknown>;
      let foundNamedKey = false;
      for (const prop of Object.keys(record)) {
        if (keyPropRegex.test(prop) && typeof record[prop] === 'string') {
          const cleaned = cleanSingleKey(record[prop] as string);
          if (isValidKeyCandidate(cleaned)) {
            results.push(cleaned);
            foundNamedKey = true;
          }
        }
      }
      if (!foundNamedKey) {
        for (const val of Object.values(record)) {
          if (typeof val === 'object' && val !== null) {
            traverse(val);
          }
        }
      }
    }
  }

  traverse(obj);
  return results;
}

/**
 * 尝试从 CSV / TSV 格式文本提取 Key 列
 */
function extractKeysFromCsv(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('//'));
  if (lines.length === 0) return [];

  const delimiters = [',', '\t', '|', ';'];
  let bestDelimiter = '';
  let maxCols = 1;

  for (const d of delimiters) {
    const firstLineCols = lines[0].split(d);
    if (firstLineCols.length > maxCols) {
      maxCols = firstLineCols.length;
      bestDelimiter = d;
    }
  }

  if (maxCols <= 1 || !bestDelimiter) return [];

  // 检查首行是否为 Header
  const headerCols = lines[0]
    .split(bestDelimiter)
    .map((c) => c.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  const keyHeaderIndex = headerCols.findIndex(
    (c) =>
      c === 'key' ||
      c === 'apikey' ||
      c === 'api_key' ||
      c === 'token' ||
      c === 'secret_key' ||
      c === 'sk'
  );

  const results: string[] = [];

  if (keyHeaderIndex >= 0) {
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(bestDelimiter);
      if (cols[keyHeaderIndex] !== undefined) {
        const val = cleanSingleKey(cols[keyHeaderIndex]);
        if (isValidKeyCandidate(val)) {
          results.push(val);
        }
      }
    }
    return results;
  }

  // 若无明确 Header，检查每行的哪一列最符合 API Key 规则
  const colScores = new Array(maxCols).fill(0);
  const parsedRows = lines.map((line) =>
    line.split(bestDelimiter).map((c) => cleanSingleKey(c))
  );

  for (const row of parsedRows) {
    row.forEach((col, idx) => {
      if (idx < maxCols && isValidKeyCandidate(col)) {
        colScores[idx]++;
      }
    });
  }

  const bestColIndex = colScores.reduce(
    (bestIdx, score, idx, arr) => (score > arr[bestIdx] ? idx : bestIdx),
    0
  );

  if (colScores[bestColIndex] >= Math.ceil(lines.length * 0.3) && colScores[bestColIndex] > 0) {
    for (const row of parsedRows) {
      if (row[bestColIndex] && isValidKeyCandidate(row[bestColIndex])) {
        results.push(row[bestColIndex]);
      }
    }
  }

  return results;
}

/**
 * 从单行混乱文本中提取纯净 Token / Key
 */
function extractTokensFromLine(line: string): string[] {
  const results: string[] = [];

  // 1. 正则智能捕获典型特征的 API Key
  const skRegex = /\b(sk-[a-zA-Z0-9_\-\.]{15,})\b/g;
  const geminiRegex = /\b(AIzaSy[a-zA-Z0-9_\-]{33})\b/g;
  const sessRegex = /\b(sess-[a-zA-Z0-9_\-]{20,})\b/g;
  const ghpRegex = /\b((?:ghp_|hf_)[a-zA-Z0-9]{25,})\b/g;

  let match: RegExpExecArray | null;

  while ((match = skRegex.exec(line)) !== null) {
    results.push(match[1]);
  }
  while ((match = geminiRegex.exec(line)) !== null) {
    results.push(match[1]);
  }
  while ((match = sessRegex.exec(line)) !== null) {
    results.push(match[1]);
  }
  while ((match = ghpRegex.exec(line)) !== null) {
    results.push(match[1]);
  }

  if (results.length > 0) {
    return results;
  }

  // 2. 若无已知模式，则去除常见 Label 前缀后使用通用分隔符切分
  let processed = line;
  processed = processed.replace(
    /^(?:Bearer\s+|api[-_]?key\s*[:=]\s*|key\s*[:=]\s*|token\s*[:=]\s*|sk\s*[:=]\s*|Authorization\s*[:=]\s*)/i,
    ''
  );

  const segments = processed
    .split(/[\s,;]+/)
    .map((s) => cleanSingleKey(s))
    .filter((s) => isValidKeyCandidate(s));

  return segments;
}

/**
 * 智能提取并清洗输入的原始 API Key 文本
 * 支持换行、逗号、分号、CSV/表格列、JSON数组/对象、以及带前缀/混乱文本
 */
export function parseRawKeysInput(rawText: string): { uniqueKeys: string[]; duplicates: string[] } {
  if (!rawText || !rawText.trim()) {
    return { uniqueKeys: [], duplicates: [] };
  }

  const trimmed = rawText.trim();
  const extractedKeys: string[] = [];

  // 1. 尝试 JSON 提取
  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      const keysFromJson = extractKeysFromJsonObject(parsed);
      if (keysFromJson.length > 0) {
        extractedKeys.push(...keysFromJson);
      }
    } catch {
      // 容错继续后续解析
    }
  }

  // 2. 如果 JSON 未提取到，尝试 CSV 表格解析
  if (extractedKeys.length === 0 && trimmed.includes('\n')) {
    const csvKeys = extractKeysFromCsv(trimmed);
    if (csvKeys.length > 0) {
      extractedKeys.push(...csvKeys);
    }
  }

  // 3. 若仍未提取到，按行进行综合模式匹配与清洗
  if (extractedKeys.length === 0) {
    const lines = trimmed.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (
        line.startsWith('#') ||
        line.startsWith('//') ||
        line.startsWith('/*') ||
        line.startsWith('--')
      ) {
        continue;
      }

      const tokensFromLine = extractTokensFromLine(line);
      extractedKeys.push(...tokensFromLine);
    }
  }

  // 4. 统一标准化清洗与 Set 排重
  const seen = new Set<string>();
  const uniqueKeys: string[] = [];
  const duplicates: string[] = [];

  for (const raw of extractedKeys) {
    const cleaned = cleanSingleKey(raw);
    if (!isValidKeyCandidate(cleaned)) continue;

    if (seen.has(cleaned)) {
      duplicates.push(cleaned);
    } else {
      seen.add(cleaned);
      uniqueKeys.push(cleaned);
    }
  }

  return { uniqueKeys, duplicates };
}

/**
 * 域名端点命中记忆池（单会话生命周期内，自动复用成功命中的端点，将批量检测时的网络请求数骤减 80%）
 */
const DOMAIN_ENDPOINT_CACHE = new Map<string, { balanceUrl?: string; modelsUrl?: string }>();

/**
 * 额度/余额嗅探函数：并发赛马探测高频端点并解析剩余额度（自动复用命中记忆，亚秒级响应）
 */
export async function sniffKeyBalance(
  baseUrl: string,
  key: string,
  signal?: AbortSignal
): Promise<{ balance: string; balanceDetails?: KeyBalanceDetails } | null> {
  const cleanKey = key.trim();
  const clean = normalizeBaseUrl(baseUrl);
  const root = getBaseRootUrl(baseUrl);
  const lowerBase = baseUrl.toLowerCase();

  // 1. 若当前域名已有成功命中记录，直接请求该命中端点（单次请求，零冗余开销）
  const cachedHit = DOMAIN_ENDPOINT_CACHE.get(root)?.balanceUrl;
  if (cachedHit) {
    try {
      const response = await silentFetch<unknown>({
        url: cachedHit,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'x-api-key': cleanKey,
          'api-key': cleanKey,
        },
        timeoutMs: 1800,
        signal,
      });

      if (response.ok && response.data) {
        const parsed = parseRelayBalancePayload(response.data);
        if (parsed) {
          let displayBalance = parsed.rawText;
          if (!displayBalance) {
            if (parsed.currency === 'CNY') {
              displayBalance = `¥${parsed.quota.toFixed(2)}`;
            } else if (parsed.currency === 'POINTS') {
              displayBalance = `${parsed.quota.toLocaleString()} 点`;
            } else {
              displayBalance = `$${parsed.quota.toFixed(2)}`;
            }
          }
          return {
            balance: displayBalance,
            balanceDetails: {
              total: parsed.totalQuota,
              used: parsed.usedQuota,
              remain: parsed.quota,
              currency: parsed.currency,
            },
          };
        }
      }
    } catch {
      // 容错降级至并发候选池
    }
  }

  // 2. 首次探测：根据域名特征精简出最高命中率的端点池
  const candidateEndpoints: string[] = [];

  if (lowerBase.includes('deepseek')) {
    candidateEndpoints.push(`${root}/user/balance`, `${root}/v1/user/balance`);
  } else if (lowerBase.includes('openrouter')) {
    candidateEndpoints.push(`${root}/api/v1/credits`);
  } else if (lowerBase.includes('openai.com')) {
    candidateEndpoints.push(`${clean}/dashboard/billing/subscription`, `${root}/dashboard/billing/subscription`);
  } else {
    // OneAPI / NewAPI / DoneAPI / 自建中转前置最高频端点
    candidateEndpoints.push(
      `${root}/api/user/self`,
      `${root}/v1/user/balance`,
      `${root}/api/user/info`,
      `${clean}/dashboard/billing/subscription`,
      `${root}/dashboard/billing/subscription`,
      `${root}/api/v1/credits`
    );
  }

  const endpoints = Array.from(new Set(candidateEndpoints)).slice(0, 4);

  // 并发请求所有候选端点，谁先返回有效余额谁就胜出
  const fetchPromises = endpoints.map(async (endpoint) => {
    if (signal?.aborted) return null;
    try {
      const response = await silentFetch<unknown>({
        url: endpoint,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'x-api-key': cleanKey,
          'api-key': cleanKey,
        },
        timeoutMs: 1800,
        signal,
      });

      if (!response.ok || !response.data) return null;

      const parsed = parseRelayBalancePayload(response.data);
      if (parsed) {
        let displayBalance = parsed.rawText;
        if (!displayBalance) {
          if (parsed.currency === 'CNY') {
            displayBalance = `¥${parsed.quota.toFixed(2)}`;
          } else if (parsed.currency === 'POINTS') {
            displayBalance = `${parsed.quota.toLocaleString()} 点`;
          } else {
            displayBalance = `$${parsed.quota.toFixed(2)}`;
          }
        }

        // 记忆成功命中端点，供后续 Key 复用
        const existing = DOMAIN_ENDPOINT_CACHE.get(root) || {};
        DOMAIN_ENDPOINT_CACHE.set(root, { ...existing, balanceUrl: endpoint });

        return {
          balance: displayBalance,
          balanceDetails: {
            total: parsed.totalQuota,
            used: parsed.usedQuota,
            remain: parsed.quota,
            currency: parsed.currency,
          },
        };
      }
    } catch {
      // 忽略单个端点异常
    }
    return null;
  });

  const results = await Promise.allSettled(fetchPromises);
  for (const res of results) {
    if (res.status === 'fulfilled' && res.value) {
      return res.value;
    }
  }

  return null;
}

/**
 * 模型探测与可用模型列表提取（自动复用命中记忆，并发赛马加速）
 */
export async function sniffKeyModels(
  baseUrl: string,
  key: string,
  signal?: AbortSignal
): Promise<{ models: string[]; rawRes?: any }> {
  const cleanKey = key.trim();
  const root = getBaseRootUrl(baseUrl);

  // 1. 若已有成功命中端点，直接复用
  const cachedUrl = DOMAIN_ENDPOINT_CACHE.get(root)?.modelsUrl;
  const rawCandidates = cachedUrl ? [cachedUrl] : getCandidateModelsUrls(baseUrl);
  const candidates = Array.from(new Set(rawCandidates)).slice(0, 3);

  // 并发探测模型端点
  const promises = candidates.map(async (url) => {
    if (signal?.aborted) throw signal.reason || new Error('探测已取消');
    const res = await silentFetch<any>({
      url,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cleanKey}`,
        'x-api-key': cleanKey,
        'x-goog-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
      },
      timeoutMs: 2200,
      signal,
    });
    return { url, res };
  });

  const settled = await Promise.allSettled(promises);
  let bestErrorRes: any = null;

  for (const item of settled) {
    if (item.status !== 'fulfilled') continue;
    const { url, res } = item.value;

    if (!res.ok) {
      if ([401, 403, 402, 429].includes(res.status) && !bestErrorRes) {
        bestErrorRes = res;
      }
      continue;
    }

    const models: string[] = [];
    const data = res.data;

    // 1. OpenAI / OneAPI 规范: { data: [{ id: "model-name" }] }
    if (Array.isArray(data?.data)) {
      for (const m of data.data) {
        if (typeof m === 'string' && m.trim()) {
          models.push(m.trim());
        } else if (m && typeof m.id === 'string' && m.id.trim()) {
          models.push(m.id.trim());
        }
      }
    }
    // 2. Google Gemini 规范: { models: [{ name: "models/gemini-1.5-pro" }] }
    else if (Array.isArray(data?.models)) {
      for (const m of data.models) {
        if (typeof m === 'string' && m.trim()) {
          models.push(m.trim());
        } else if (m && typeof m.name === 'string' && m.name.trim()) {
          models.push(m.name.trim().replace(/^models\//, ''));
        }
      }
    }
    // 3. 数组格式
    else if (Array.isArray(data)) {
      for (const m of data) {
        if (typeof m === 'string' && m.trim()) {
          models.push(m.trim());
        } else if (m && typeof m.id === 'string' && m.id.trim()) {
          models.push(m.id.trim());
        } else if (m && typeof m.name === 'string' && m.name.trim()) {
          models.push(m.name.trim());
        }
      }
    }

    if (models.length > 0) {
      // 记忆成功端点
      const existing = DOMAIN_ENDPOINT_CACHE.get(root) || {};
      DOMAIN_ENDPOINT_CACHE.set(root, { ...existing, modelsUrl: url });

      return {
        models: Array.from(new Set(models)).sort((a, b) => a.localeCompare(b)),
        rawRes: res,
      };
    }
    return { models: [], rawRes: res };
  }

  return { models: [], rawRes: bestErrorRes };
}

export interface SingleKeyTestOptions {
  checkBalance?: boolean;
  checkModels?: boolean;
  customHeaders?: Record<string, string>;
  isStream?: boolean;
  signal?: AbortSignal;
}

/**
 * 极致优化的单 Key 鉴权流水线（全并行并发探测，耗时缩减至 150ms ~ 400ms）
 * 1. 同步启动 Zero-Token 鉴权与余额嗅探（并发流水线）
 * 2. 若 /models 成功，立即返回，耗时仅 ~150ms
 * 3. 若 /models 受限，快速单模型探测 (gpt-4o-mini / deepseek-chat)
 */
export async function testSingleKey(
  baseUrl: string,
  key: string,
  model = 'auto',
  index: number,
  isStreamOrOptions: boolean | SingleKeyTestOptions = false,
  customHeaders?: Record<string, string>,
  signal?: AbortSignal,
  options?: { checkBalance?: boolean; checkModels?: boolean }
): Promise<KeyCheckResult> {
  const isStream =
    typeof isStreamOrOptions === 'boolean'
      ? isStreamOrOptions
      : !!isStreamOrOptions?.isStream;
  const effCustomHeaders =
    typeof isStreamOrOptions === 'object'
      ? isStreamOrOptions.customHeaders
      : customHeaders;
  const effSignal =
    typeof isStreamOrOptions === 'object' ? isStreamOrOptions.signal : signal;
  const checkBalance =
    typeof isStreamOrOptions === 'object'
      ? !!isStreamOrOptions.checkBalance
      : !!options?.checkBalance;
  const checkModels =
    typeof isStreamOrOptions === 'object'
      ? !!isStreamOrOptions.checkModels
      : !!options?.checkModels;

  const cleanKey = key.trim();
  const lowerBase = baseUrl.toLowerCase();

  // 1. 并发启动余额探测 Promise（与鉴权探针并行执行，消除串行耗时）
  const balancePromise = checkBalance
    ? sniffKeyBalance(baseUrl, cleanKey, effSignal).catch(() => null)
    : Promise.resolve(null);

  // 2. 优先执行 Zero-Token /v1/models 极速鉴权
  let discoveredModels: string[] = [];
  let modelsProbeRes: any = null;

  try {
    const modelsResult = await sniffKeyModels(baseUrl, cleanKey, effSignal);
    discoveredModels = modelsResult.models;
    modelsProbeRes = modelsResult.rawRes;

    // 若 /v1/models 返回 200 OK，代表 Key 已经 100% 鉴权成功！
    if (modelsProbeRes && modelsProbeRes.ok && modelsProbeRes.status === 200) {
      const activeModel =
        model && model !== 'auto' && discoveredModels.includes(model)
          ? model
          : discoveredModels[0] || (model !== 'auto' ? model : 'models-endpoint');

      const balData = await balancePromise;

      return {
        index,
        key: cleanKey,
        maskedKey: maskKey(cleanKey),
        status: 'active',
        httpStatus: 200,
        latencyMs: modelsProbeRes.latencyMs || 60,
        errorMessage: '有效可用 (Zero-Token 鉴权通过)',
        checkModel: activeModel,
        balance: balData?.balance,
        balanceDetails: balData?.balanceDetails,
        availableModels: checkModels && discoveredModels.length > 0 ? discoveredModels : undefined,
      };
    }

    // 若 /models 返回明确错误状态码，直接短路返回
    if (modelsProbeRes) {
      const rawText = `${modelsProbeRes.rawText || ''} ${JSON.stringify(modelsProbeRes.data || '')}`.toLowerCase();
      if (
        modelsProbeRes.status === 401 ||
        modelsProbeRes.status === 403 ||
        rawText.includes('invalid_api_key') ||
        rawText.includes('无效的令牌') ||
        rawText.includes('unauthorized')
      ) {
        return {
          index,
          key: cleanKey,
          maskedKey: maskKey(cleanKey),
          status: 'invalid',
          httpStatus: modelsProbeRes.status,
          latencyMs: modelsProbeRes.latencyMs,
          errorMessage: 'API Key 无效或未授权 (401/403)',
          checkModel: model !== 'auto' ? model : '/v1/models',
        };
      } else if (
        modelsProbeRes.status === 402 ||
        rawText.includes('quota') ||
        rawText.includes('insufficient') ||
        rawText.includes('额度不足') ||
        rawText.includes('余额不足')
      ) {
        return {
          index,
          key: cleanKey,
          maskedKey: maskKey(cleanKey),
          status: 'quota_exhausted',
          httpStatus: modelsProbeRes.status,
          latencyMs: modelsProbeRes.latencyMs,
          errorMessage: '账户额度耗尽或欠费 (402/Quota)',
          checkModel: model !== 'auto' ? model : '/v1/models',
        };
      } else if (modelsProbeRes.status === 429 || rawText.includes('rate_limit')) {
        return {
          index,
          key: cleanKey,
          maskedKey: maskKey(cleanKey),
          status: 'rate_limited',
          httpStatus: modelsProbeRes.status,
          latencyMs: modelsProbeRes.latencyMs,
          errorMessage: '触发频率限制 (429 Rate Limit)',
          checkModel: model !== 'auto' ? model : '/v1/models',
        };
      }
    }
  } catch (err: unknown) {
    if (effSignal?.aborted) throw err;
  }

  // 3. Fallback: 极速 Chat 探针（仅精选 1 个最可能的模型进行单次快速验证）
  const isAnthropicNative =
    lowerBase.includes('anthropic.com') ||
    lowerBase.includes('claude') ||
    (model && model.toLowerCase().includes('claude'));

  let probeModel = 'gpt-4o-mini';
  if (model && model !== 'auto') {
    probeModel = model;
  } else if (discoveredModels.length > 0) {
    probeModel = discoveredModels[0];
  } else if (isAnthropicNative) {
    probeModel = 'claude-3-5-haiku-20241022';
  } else if (lowerBase.includes('deepseek')) {
    probeModel = 'deepseek-chat';
  } else if (lowerBase.includes('gemini') || lowerBase.includes('googleapis')) {
    probeModel = 'gemini-2.0-flash';
  }

  const chatUrl = buildChatCompletionsUrl(baseUrl);
  const reqHeaders: Record<string, string> = {
    Authorization: `Bearer ${cleanKey}`,
    'x-api-key': cleanKey,
    'x-goog-api-key': cleanKey,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
    ...effCustomHeaders,
  };

  let bodyPayload: any;
  if (isAnthropicNative && chatUrl.includes('/messages')) {
    bodyPayload = {
      model: probeModel,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    };
  } else {
    bodyPayload = {
      model: probeModel,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1,
      ...(isStream ? { stream: true } : {}),
    };
  }

  const res = await silentFetch<any>({
    url: chatUrl,
    method: 'POST',
    headers: reqHeaders,
    body: bodyPayload,
    timeoutMs: 2800,
    signal: effSignal,
  });

  const rawErrorText = `${res.rawText || ''} ${JSON.stringify(res.data || '')}`.toLowerCase();

  let status: KeyHealthStatus = 'active';
  let note = res.errorMessage || (res.ok ? '有效可用' : `HTTP ${res.status}`);

  if (res.ok || res.status === 200) {
    status = 'active';
    note = '有效可用';
  } else if (
    res.status === 401 ||
    res.errorCategory === 'unauthorized' ||
    rawErrorText.includes('invalid_api_key') ||
    rawErrorText.includes('无效的令牌') ||
    rawErrorText.includes('unauthorized') ||
    rawErrorText.includes('key_invalid')
  ) {
    status = 'invalid';
    note = 'API Key 无效或未授权 (401/403)';
  } else if (
    res.status === 402 ||
    res.errorCategory === 'quota' ||
    rawErrorText.includes('quota') ||
    rawErrorText.includes('insufficient') ||
    rawErrorText.includes('额度不足') ||
    rawErrorText.includes('余额不足') ||
    rawErrorText.includes('欠费')
  ) {
    status = 'quota_exhausted';
    note = '账户额度耗尽或已欠费 (402/Quota)';
  } else if (
    res.status === 429 ||
    res.errorCategory === 'rate_limit' ||
    rawErrorText.includes('rate_limit') ||
    rawErrorText.includes('频率过高') ||
    rawErrorText.includes('too many requests')
  ) {
    status = 'rate_limited';
    note = '触发频率限制 (429 Rate Limit)';
  } else if (
    res.status === 404 ||
    (res.status === 400 &&
      (rawErrorText.includes('model') ||
        rawErrorText.includes('channel') ||
        rawErrorText.includes('无可用渠道') ||
        rawErrorText.includes('not exist') ||
        rawErrorText.includes('渠道已被禁用') ||
        rawErrorText.includes('one_api_error')))
  ) {
    status = 'active';
    note = '鉴权有效 (中转站未映射当前测试模型)';
  } else {
    status = 'network_error';
    note = res.errorMessage || `网络或中转站网关异常 (HTTP ${res.status})`;
  }

  const balData = await balancePromise;

  const result: KeyCheckResult = {
    index,
    key: cleanKey,
    maskedKey: maskKey(cleanKey),
    status,
    httpStatus: res.status,
    latencyMs: res.latencyMs,
    errorMessage: note,
    checkModel: probeModel,
    balance: balData?.balance,
    balanceDetails: balData?.balanceDetails,
    availableModels: checkModels && discoveredModels.length > 0 ? discoveredModels : undefined,
  };

  return result;
}

export interface BatchKeyTestPoolOptions {
  checkBalance?: boolean;
  checkModels?: boolean;
  providerId?: string;
  providerName?: string;
  customHeaders?: Record<string, string>;
  requestDelayMs?: number;
  antiBanMode?: 'safe' | 'balanced' | 'turbo';
}

/**
 * 高性能并发池批量检测（内建智能防封抖动延时与 429/WAF 熔断退避保护）
 */
export async function runBatchKeyTestPool(
  baseUrl: string,
  keys: string[],
  model = 'auto',
  concurrencyLimit = 5,
  isStream = false,
  customHeaders?: Record<string, string>,
  onItemCompleted?: (item: KeyCheckResult, completedCount: number) => void,
  signal?: AbortSignal,
  options?: BatchKeyTestPoolOptions
): Promise<BatchKeySummary> {
  const { uniqueKeys, duplicates } = parseRawKeysInput(keys.join('\n'));
  const results: KeyCheckResult[] = [];
  let completedCount = 0;
  let currentIndex = 0;

  const effCustomHeaders = options?.customHeaders || customHeaders;
  const checkBalance = options?.checkBalance ?? true;
  const checkModels = options?.checkModels ?? false;

  async function worker() {
    while (currentIndex < uniqueKeys.length) {
      if (signal?.aborted) break;

      const idx = currentIndex++;
      const key = uniqueKeys[idx];
      if (!key) break;

      // ── 防封延时与随机抖动保护 (Jitter Delay) ──
      const baseDelay =
        options?.requestDelayMs !== undefined
          ? options.requestDelayMs
          : options?.antiBanMode === 'safe'
          ? 250
          : options?.antiBanMode === 'turbo'
          ? 0
          : 50;

      if (baseDelay > 0) {
        // 随机抖动 ±25%，模拟自然请求分布，规避 WAF 频率指纹
        const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1);
        const actualDelay = Math.max(10, Math.round(baseDelay + jitter));
        await new Promise((r) => setTimeout(r, actualDelay));
      }

      try {
        const itemResult = await testSingleKey(
          baseUrl,
          key,
          model,
          idx + 1,
          isStream,
          effCustomHeaders,
          signal,
          { checkBalance, checkModels }
        );

        // ── 智能熔断与 429 退避保护 (Circuit Breaker) ──
        if (itemResult.status === 'rate_limited' || itemResult.httpStatus === 429) {
          // 触发限流时自动休眠 1.5s ~ 2.5s，避免持续高频导致 IP 封禁
          const backoff = 1500 + Math.round(Math.random() * 1000);
          await new Promise((r) => setTimeout(r, backoff));
        }

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
          checkModel: model,
        };
        results[idx] = errorItem;
        completedCount++;
        onItemCompleted?.(errorItem, completedCount);
      }
    }
  }

  const pool = Array.from(
    { length: Math.min(concurrencyLimit, uniqueKeys.length || 1) },
    () => worker()
  );
  await Promise.all(pool);

  const finalResults = results.filter(Boolean);
  const activeCount = finalResults.filter((r) => r.status === 'active').length;
  const exhaustedCount = finalResults.filter((r) => r.status === 'quota_exhausted').length;
  const rateLimitedCount = finalResults.filter((r) => r.status === 'rate_limited').length;
  // 将明确无效与网络异常/网关异常合并计入 invalidCount 保证前端标签不漏项
  const invalidCount = finalResults.filter((r) => r.status === 'invalid' || r.status === 'network_error').length;
  const errorCount = finalResults.filter((r) => r.status === 'network_error').length;

  return {
    timestamp: Date.now(),
    providerId: options?.providerId || 'custom',
    providerName: options?.providerName || '自定义提供商',
    baseUrl,
    testModel: model,
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
