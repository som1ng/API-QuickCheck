import { fetchRemoteModels } from '../scanner/batchScanner';
import { silentFetch, silentStreamingFetch, TransportResponse } from '../transport/silentTransport';
import { AuditProfile, AuditProvider, AuditReportV4, BaselineSnapshot, CapabilityMetric, ProtocolEvidence } from '../../types/audit';
import { PROVIDER_ADAPTERS, ProviderAdapter, NativeResult, NativeRequest, detectAuditProvider } from './providerAdapters';
import { hashFixture, selectSuite } from './suite';
import { determineConclusion } from './statistics';
import { validateAnthropicMessage, validateChatCompletionEnvelope, validateGeminiGenerateContent, validateResponsesEnvelope } from './protocolValidators';
import { createCodeRepairFixture, createNeedleFixture, scoreCodeRepairResponse, scoreNeedleResponse } from './localFixtures';
import { bootstrapDifference } from './statistics';
import { findStoredBaseline, loadBaselineSnapshot } from './baseline';
import { readSSEEvents } from '../transport/sseReader';
import { getProbeRoute, ProbeRoute } from './capabilityRouting';
import { buildAuditSummary } from './reportSummary';

export interface AuditRunOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  provider?: AuditProvider | 'auto';
  profile?: AuditProfile;
  selectedProbeIds?: string[];
  baselineId?: string;
  baselineSnapshot?: BaselineSnapshot;
  seed?: string;
  signal?: AbortSignal;
  onProgress?: (completed: number, total: number, label: string) => void;
}

const CAPABILITY_DOMAINS: CapabilityMetric['domain'][] = [
  'reasoning',
  'tools',
  'code',
  'vision',
  'context',
  'structured_output',
];

function unavailableMetric(domain: CapabilityMetric['domain'], baselineId?: string, targetScores: number[] = []): CapabilityMetric {
  return {
    domain,
    targetScores,
    baselineScores: [],
    status: 'unavailable',
    detail: baselineId
      ? targetScores.length > 0 ? `已完成 ${targetScores.length} 次能力采样，但当前未加载参考基线快照。` : '本轮浏览器执行器尚未运行该能力域。'
      : targetScores.length > 0 ? `已完成 ${targetScores.length} 次能力采样，但未提供参考基线；不能将单次能力表现转换为一致性结论。` : '未提供参考基线快照；不能将单次能力表现转换为一致性结论。',
  };
}

function unavailableEvidence(id: string, title: string, detail: string): ProtocolEvidence {
  return { id, title, status: 'unavailable', detail };
}

function routeStatus(response: TransportResponse<unknown>): 'pass' | 'fail' | 'unavailable' {
  if (response.ok) return 'pass';
  if ([0, 402, 404, 405, 408, 429].includes(response.status)) return 'unavailable';
  return 'fail';
}

export function containsFixtureText(text: string, expected: string): boolean {
  const normalized = text.trim().replace(/[.!?]+$/g, '');
  return normalized.includes(expected.replace(/[.!?]+$/g, ''));
}

function usageNumber(result: NativeResult, path: string[]): number | undefined {
  let value: unknown = result.usage;
  for (const key of path) {
    if (typeof value !== 'object' || value === null) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function promptTokenCount(result: NativeResult): number | undefined {
  return usageNumber(result, ['prompt_tokens'])
    ?? usageNumber(result, ['input_tokens'])
    ?? usageNumber(result, ['promptTokenCount'])
    ?? usageNumber(result, ['inputTokenCount']);
}

function completionTokenCount(result: NativeResult): number | undefined {
  return usageNumber(result, ['completion_tokens'])
    ?? usageNumber(result, ['output_tokens'])
    ?? usageNumber(result, ['candidatesTokenCount'])
    ?? usageNumber(result, ['outputTokenCount']);
}

function totalTokenCount(result: NativeResult): number | undefined {
  return usageNumber(result, ['total_tokens'])
    ?? usageNumber(result, ['totalTokenCount']);
}

function cachedInputTokens(result: NativeResult): number | undefined {
  return usageNumber(result, ['input_tokens_details', 'cached_tokens'])
    ?? usageNumber(result, ['cache_read_input_tokens'])
    ?? usageNumber(result, ['cached_content_token_count']);
}

function reasoningTokenCount(result: NativeResult): number | undefined {
  return usageNumber(result, ['thoughtsTokenCount'])
    ?? usageNumber(result, ['thoughts_token_count'])
    ?? usageNumber(result, ['reasoning_tokens'])
    ?? usageNumber(result, ['output_tokens_details', 'reasoning_tokens']);
}

function basicEvidence(result: NativeResult, provider: AuditProvider, model: string, allowRelayEnvelope = false): ProtocolEvidence {
  const status = routeStatus(result.response);
  const validation = provider === 'anthropic'
    ? validateAnthropicMessage(result.response.data, model, !allowRelayEnvelope)
    : provider === 'gemini'
    ? validateGeminiGenerateContent(result.response.data, model)
    : provider === 'openrouter'
    ? validateChatCompletionEnvelope(result.response.data, model, false)
    : validateResponsesEnvelope(result.response.data, model);
  if (status === 'pass' && containsFixtureText(result.text, 'audit-ready.') && validation.pass) {
    return { id: 'p0-native-route', title: '原生 API 路由', status, detail: '原生请求成功，响应 envelope 和固定夹具均符合。', latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes };
  }
  const validationStatus = status === 'pass' ? 'fail' : status;
  const responseShape = validation.issues.includes('response_not_object')
    ? `（响应数据非 JSON 对象，rawText ${result.response.rawText.length} 字符，Content-Type ${result.response.headers.get('content-type') || 'unknown'}）`
    : '';
  return {
    id: 'p0-native-route',
    title: '原生 API 路由',
    status: validationStatus,
    detail: status === 'unavailable'
      ? result.response.errorMessage || '原生路由未开放或代理链路不可用。'
      : `响应未通过协议或固定夹具校验：${validation.issues.join(', ') || result.text.slice(0, 120)}${responseShape}`,
    latencyMs: result.response.latencyMs,
    rawEventTypes: result.eventTypes,
  };
}

async function execute(
  adapter: ProviderAdapter,
  request: NativeRequest,
  signal?: AbortSignal,
): Promise<NativeResult> {
  const response = await silentFetch<Record<string, unknown>>({
    url: request.url,
    method: 'POST',
    headers: request.headers,
    body: request.body,
    timeoutMs: 30_000,
    signal,
  });
  return adapter.parse(response);
}

export function runtimeFrom(results: NativeResult[]) {
  const latencies = results.map((result) => result.response.latencyMs).filter((value) => value >= 0).sort((a, b) => a - b);
  const percentile = (p: number) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))];

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let hasTokens = false;
  let totalDurationMs = 0;

  for (const result of results) {
    if (result.response.latencyMs && result.response.latencyMs > 0) {
      totalDurationMs += result.response.latencyMs;
    }
    const pTokens = promptTokenCount(result);
    const cTokens = completionTokenCount(result);
    const tTokens = totalTokenCount(result);

    if (pTokens !== undefined || cTokens !== undefined || tTokens !== undefined) {
      hasTokens = true;
      if (pTokens !== undefined) totalPromptTokens += pTokens;
      if (cTokens !== undefined) totalCompletionTokens += cTokens;
      if (pTokens === undefined && cTokens === undefined && tTokens !== undefined) {
        totalCompletionTokens += tTokens;
      }
    }
  }

  const calculatedTotalTokens = hasTokens ? (totalPromptTokens + totalCompletionTokens) : undefined;

  return {
    attempts: results.length,
    successRate: results.length > 0 ? results.filter((result) => result.response.ok).length / results.length : 0,
    p50LatencyMs: latencies.length > 0 ? percentile(0.5) : undefined,
    p95LatencyMs: latencies.length > 0 ? percentile(0.95) : undefined,
    totalDurationMs: totalDurationMs > 0 ? totalDurationMs : (latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) : undefined),
    totalPromptTokens: hasTokens ? totalPromptTokens : undefined,
    totalCompletionTokens: hasTokens ? totalCompletionTokens : undefined,
    totalTokens: calculatedTotalTokens,
  };
}

interface StreamRunResult {
  ok: boolean;
  status: number;
  eventTypes: string[];
  latencyMs: number;
  errorMessage?: string;
}

async function executeStream(request: NativeRequest, signal?: AbortSignal): Promise<StreamRunResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  const abortExternal = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abortExternal, { once: true });
  const startedAt = performance.now();
  try {
    const response = await silentStreamingFetch(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...request.headers },
      body: JSON.stringify(request.body),
      signal: controller.signal,
    });
    if (!response.ok) {
      return { ok: false, status: response.status, eventTypes: [], latencyMs: Math.round(performance.now() - startedAt), errorMessage: `HTTP ${response.status}` };
    }
    const eventTypes: string[] = [];
    for await (const event of readSSEEvents(response, controller.signal)) {
      if (typeof event.data === 'object' && event.data !== null) {
        const obj = event.data as Record<string, unknown>;
        if (typeof obj.type === 'string') {
          eventTypes.push(obj.type);
        } else if (obj.object === 'chat.completion.chunk' || Array.isArray(obj.choices)) {
          const choices = obj.choices as Record<string, unknown>[] | undefined;
          const delta = choices?.[0]?.delta as Record<string, unknown> | undefined;
          const finishReason = choices?.[0]?.finish_reason;
          if (finishReason) {
            eventTypes.push('chat.completion.chunk.finish');
          } else if (delta && (delta.content !== undefined || delta.reasoning_content !== undefined || delta.tool_calls !== undefined)) {
            eventTypes.push('chat.completion.chunk.delta');
          } else {
            eventTypes.push('chat.completion.chunk.start');
          }
        } else {
          eventTypes.push(event.event);
        }
      } else {
        eventTypes.push(event.event);
      }
    }
    return { ok: true, status: response.status, eventTypes, latencyMs: Math.round(performance.now() - startedAt) };
  } catch (error: unknown) {
    return { ok: false, status: controller.signal.aborted ? 408 : 0, eventTypes: [], latencyMs: Math.round(performance.now() - startedAt), errorMessage: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortExternal);
  }
}

export function validateStreamSequence(provider: AuditProvider, eventTypes: string[]): { pass: boolean; detail: string } {
  if (provider === 'anthropic') {
    // If relayed as ChatCompletions
    if (eventTypes.some((t) => t.startsWith('chat.completion.chunk'))) {
      const hasDelta = eventTypes.includes('chat.completion.chunk.delta');
      return eventTypes.length >= 1 && hasDelta
        ? { pass: true, detail: `ChatCompletions 兼容流式顺序通过（捕获 ${eventTypes.length} 个 Chunk 事件）` }
        : { pass: false, detail: `ChatCompletions 缺少增量数据包：${eventTypes.join(' -> ')}` };
    }
    const required = ['message_start', 'content_block_start', 'content_block_delta', 'message_stop'];
    const missing = required.filter((type) => !eventTypes.includes(type));
    const ordered = required.every((type, index) => eventTypes.indexOf(type) >= (index === 0 ? 0 : eventTypes.indexOf(required[index - 1])));
    return missing.length === 0 && ordered
      ? { pass: true, detail: `Anthropic 原生 SSE 顺序通过：${eventTypes.join(' -> ')}` }
      : { pass: false, detail: `Anthropic SSE 缺少或乱序：${missing.join(', ') || eventTypes.join(' -> ')}` };
  }

  if (provider === 'openrouter') {
    const hasDelta = eventTypes.some((t) => t === 'chat.completion.chunk.delta' || t === 'message' || t.includes('delta'));
    const pass = eventTypes.length > 0 && (hasDelta || eventTypes.length >= 1);
    return pass
      ? { pass: true, detail: `OpenRouter / ChatCompletions 流式事件流通过（捕获 ${eventTypes.length} 个 Chunk）` }
      : { pass: false, detail: `流式事件序列为空或未捕获有效 Delta 数据块` };
  }

  // OpenAI / xAI surface
  if (eventTypes.some((t) => t.startsWith('chat.completion.chunk'))) {
    const hasDelta = eventTypes.includes('chat.completion.chunk.delta') || eventTypes.length >= 2;
    return hasDelta
      ? { pass: true, detail: `ChatCompletions 流式顺序通过（捕获 ${eventTypes.length} 个 Chunk）` }
      : { pass: false, detail: `ChatCompletions 缺少增量数据包：${eventTypes.join(' -> ')}` };
  }
  const hasDelta = eventTypes.some((type) => type === 'response.output_text.delta' || type === 'response.content_part.added');
  const completionIndex = Math.max(eventTypes.indexOf('response.completed'), eventTypes.indexOf('response.done'));
  const deltaIndex = eventTypes.findIndex((type) => type === 'response.output_text.delta' || type === 'response.content_part.added');
  const pass = eventTypes.includes('response.created') && hasDelta && completionIndex > deltaIndex;
  return pass
    ? { pass: true, detail: `Responses SSE 顺序通过：${eventTypes.join(' -> ')}` }
    : { pass: false, detail: `Responses SSE 缺少或乱序：${eventTypes.join(' -> ') || '无事件'}` };
}

export async function runAudit(options: AuditRunOptions): Promise<AuditReportV4> {
  const profile = options.profile || 'balanced';
  const provider = detectAuditProvider(options.model, options.provider || 'auto', options.baseUrl);
  const adapter = PROVIDER_ADAPTERS[provider];
  const baselineSnapshot = options.baselineSnapshot
    || (options.baselineId ? loadBaselineSnapshot(options.baselineId) : findStoredBaseline(provider, options.model, adapter.surface));
  const suite = selectSuite(profile, options.selectedProbeIds);
  const selectedProbeIds = new Set(suite.map((item) => item.id));
  const routes = new Map(suite.map((item) => [item.id, getProbeRoute(provider, options.model, item.id)]));
  const routeFor = (id: string): ProbeRoute => routes.get(id) || getProbeRoute(provider, options.model, id);
  const shouldExecute = (id: string) => selectedProbeIds.has(id) && routeFor(id).disposition !== 'not_claimed';
  const protocol: ProtocolEvidence[] = [];
  const nativeResults: NativeResult[] = [];
  const measuredScores: Partial<Record<CapabilityMetric['domain'], number[]>> = {};
  const exploratoryScores: Partial<Record<CapabilityMetric['domain'], number[]>> = {};
  const recordScore = (domain: CapabilityMetric['domain'], score: number, probeId?: string) => {
    const scores = routeFor(probeId || '').disposition === 'exploratory_test' ? exploratoryScores : measuredScores;
    measuredScores[domain] = measuredScores[domain] || [];
    exploratoryScores[domain] = exploratoryScores[domain] || [];
    scores[domain] = [...(scores[domain] || []), score];
  };
  let reasoningResult: NativeResult | undefined;
  let completed = 0;

  const progress = (label: string) => {
    completed += 1;
    options.onProgress?.(completed, suite.length, label);
  };

  if (shouldExecute('p0-model-discovery')) try {
    const models = await fetchRemoteModels(options.baseUrl, options.apiKey, provider, options.signal);
    protocol.push({
      id: 'p0-model-discovery',
      title: '模型与版本发现',
      status: models.length > 0 ? 'pass' : 'unavailable',
      detail: models.length > 0 ? `发现 ${models.length} 个模型。` : '模型列表为空或被中转站隐藏。',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    protocol.push({
      id: 'p0-model-discovery',
      title: '模型与版本发现',
      status: /401|403|API Key/i.test(message) ? 'fail' : 'unavailable',
      detail: message.slice(0, 240),
    });
  }
  if (shouldExecute('p0-model-discovery')) progress('模型发现');

  if (shouldExecute('p0-native-route') || shouldExecute('p0-auth-shape')) try {
    const basicResult = await execute(adapter, adapter.basic(options.baseUrl, options.apiKey, options.model), options.signal);
    nativeResults.push(basicResult);
    if (shouldExecute('p0-native-route')) protocol.push(basicEvidence(basicResult, provider, options.model, provider === 'anthropic' && /openrouter\.ai/i.test(options.baseUrl)));
    if (shouldExecute('p0-auth-shape')) protocol.push({
        id: 'p0-auth-shape',
        title: '认证头与错误语义',
        status: basicResult.response.status === 401 || basicResult.response.status === 403 ? 'fail' : routeStatus(basicResult.response),
        detail: basicResult.response.ok ? '认证头被接受。' : basicResult.response.errorMessage || `HTTP ${basicResult.response.status}`,
        latencyMs: basicResult.response.latencyMs,
      });
  } catch (error: unknown) {
    if (shouldExecute('p0-native-route')) protocol.push({ id: 'p0-native-route', title: '原生 API 路由', status: 'unavailable', detail: String(error) });
    if (shouldExecute('p0-auth-shape')) protocol.push({ id: 'p0-auth-shape', title: '认证头与错误语义', status: 'unavailable', detail: '请求未能完成。' });
  }
  if (shouldExecute('p0-native-route') || shouldExecute('p0-auth-shape')) progress('原生路由与认证');

  if (shouldExecute('p0-strict-json') && adapter.strictJson) {
    try {
      const result = await execute(adapter, adapter.strictJson(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(result);
      let parsed: unknown = null;
      try { parsed = JSON.parse(result.text); } catch { parsed = null; }
      const pass = result.response.ok && typeof parsed === 'object' && parsed !== null && (parsed as Record<string, unknown>).status === 'ok';
      protocol.push({ id: 'p0-strict-json', title: '严格 JSON Schema', status: result.response.ok ? (pass ? 'pass' : 'fail') : routeStatus(result.response), detail: pass ? '响应符合固定 JSON 夹具。' : '响应未通过严格 JSON 夹具。', latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
    } catch { protocol.push(unavailableEvidence('p0-strict-json', '严格 JSON Schema', '严格 JSON 请求未能完成。')); }
  } else if (shouldExecute('p0-strict-json')) {
    protocol.push(unavailableEvidence('p0-strict-json', '严格 JSON Schema', '当前原生适配器没有该能力声明。'));
  }
  if (shouldExecute('p0-strict-json')) progress('严格 JSON');

  if (shouldExecute('p0-tool-shape') && adapter.tool) {
    try {
      const result = await execute(adapter, adapter.tool(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(result);
      protocol.push({ id: 'p0-tool-shape', title: '工具调用结构', status: result.response.ok ? (result.toolCalled ? 'pass' : 'fail') : routeStatus(result.response), detail: result.toolCalled ? '捕获到原生工具调用事件。' : '请求成功但未捕获工具调用事件。', latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
    } catch { protocol.push(unavailableEvidence('p0-tool-shape', '工具调用结构', '工具调用请求未能完成。')); }
  } else if (shouldExecute('p0-tool-shape')) {
    protocol.push(unavailableEvidence('p0-tool-shape', '工具调用结构', '当前原生适配器没有工具能力声明。'));
  }
  if (shouldExecute('p0-tool-shape')) progress('工具结构');

  if (shouldExecute('p0-stream-events')) {
    if (!adapter.stream) {
      protocol.push(unavailableEvidence('p0-stream-events', '流式事件顺序', provider === 'gemini' ? 'Gemini Interaction streaming 端点契约尚未完成验证。' : '当前 Provider Adapter 没有流式能力声明。'));
    } else {
      try {
        const stream = await executeStream(adapter.stream(options.baseUrl, options.apiKey, options.model), options.signal);
        const validation = stream.ok ? validateStreamSequence(provider, stream.eventTypes) : { pass: false, detail: stream.errorMessage || `HTTP ${stream.status}` };
        protocol.push({ id: 'p0-stream-events', title: '流式事件顺序', status: stream.ok ? (validation.pass ? 'pass' : 'fail') : routeStatus({ ok: false, status: stream.status } as TransportResponse<unknown>), detail: validation.detail, latencyMs: stream.latencyMs, rawEventTypes: stream.eventTypes });
      } catch {
        protocol.push(unavailableEvidence('p0-stream-events', '流式事件顺序', 'SSE 请求未能完成。'));
      }
    }
  }
  if (shouldExecute('p0-invalid-parameter')) protocol.push(unavailableEvidence('p0-invalid-parameter', '非法参数回显', '为避免对真实端点造成破坏性请求，当前浏览器不执行非法参数测试。'));
  if (['p0-stream-events', 'p0-invalid-parameter'].some(shouldExecute)) progress('P0 协议覆盖');

  if ((shouldExecute('p1-reasoning-config') || shouldExecute('p1-signature-continuity')) && adapter.reasoning) {
    try {
      reasoningResult = await execute(adapter, adapter.reasoning(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(reasoningResult);
      const reasoningTokens = reasoningTokenCount(reasoningResult);
      const hasReasoning = reasoningResult.eventTypes.some((type) => /reason|thinking/i.test(type)) || (reasoningTokens !== undefined && reasoningTokens > 0);
      const reasoningStatus = !reasoningResult.response.ok
        ? routeStatus(reasoningResult.response)
        : hasReasoning ? 'pass' : 'unavailable';
      const usageDetail = reasoningTokens === undefined ? '' : ` thoughts tokens=${reasoningTokens}.`;
      protocol.push({ id: 'p1-reasoning-config', title: '推理配置透传', status: reasoningStatus, detail: hasReasoning ? `捕获到原生推理证据。${usageDetail}` : `响应成功但未暴露可验证的推理事件或 token usage。${usageDetail}`, latencyMs: reasoningResult.response.latencyMs, rawEventTypes: reasoningResult.eventTypes });
    } catch { protocol.push(unavailableEvidence('p1-reasoning-config', '推理配置透传', '推理请求未能完成。')); }
  } else if (shouldExecute('p1-reasoning-config')) {
    protocol.push(unavailableEvidence('p1-reasoning-config', '推理配置透传', '当前原生适配器没有推理能力声明。'));
  }
  if (shouldExecute('p1-reasoning-config') || shouldExecute('p1-signature-continuity')) progress('推理配置');

  if (shouldExecute('p1-state-continuity')) {
    const marker = `STATE_MARKER_${options.model.replace(/[^a-zA-Z0-9]/g, '_')}`;
    if (!adapter.state || !adapter.stateContinuation) {
      protocol.push(unavailableEvidence('p1-state-continuity', '跨轮状态连续性', provider === 'gemini' ? 'Gemini Interaction continuation 的字段契约尚未完成验证。' : '当前 Provider Adapter 没有状态连续性能力声明。'));
    } else {
      try {
        const first = await execute(adapter, adapter.state(options.baseUrl, options.apiKey, options.model, marker), options.signal);
        nativeResults.push(first);
        const continuation = first.response.ok
          ? await execute(adapter, adapter.stateContinuation(options.baseUrl, options.apiKey, options.model, first, marker), options.signal)
          : undefined;
        if (continuation) nativeResults.push(continuation);
        const passed = Boolean(first.response.ok && continuation?.response.ok && containsFixtureText(continuation.text, marker));
        if (first.response.ok && continuation) recordScore('tools', passed ? 1 : 0, 'p1-state-continuity');
        protocol.push({
          id: 'p1-state-continuity',
          title: '跨轮状态连续性',
          status: !first.response.ok ? routeStatus(first.response) : !continuation ? 'unavailable' : continuation.response.ok ? (passed ? 'pass' : 'fail') : routeStatus(continuation.response),
          detail: passed ? '第二轮请求通过 provider 原生状态引用恢复并回显 marker。' : continuation?.response.errorMessage || '第二轮未恢复第一轮保存的状态 marker。',
          latencyMs: continuation?.response.latencyMs ?? first.response.latencyMs,
          rawEventTypes: [...first.eventTypes, ...(continuation?.eventTypes || [])],
        });
      } catch {
        protocol.push(unavailableEvidence('p1-state-continuity', '跨轮状态连续性', '跨轮状态请求未能完成。'));
      }
    }
  }

  const runToolRoundtrip = async (id: string, title: string) => {
    if (!adapter.tool || !adapter.toolContinuation) {
      protocol.push(unavailableEvidence(id, title, provider === 'gemini' ? 'Gemini Interaction continuation 的字段契约尚未完成验证。' : '当前 Provider Adapter 没有工具回传能力声明。'));
      return;
    }
    try {
      const first = await execute(adapter, adapter.tool(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(first);
      const args = first.toolCall?.arguments;
      const validArguments = typeof args === 'object' && args !== null && (args as Record<string, unknown>).a === 19 && (args as Record<string, unknown>).b === 23;
      if (!first.response.ok || !first.toolCall || first.toolCall.name !== 'audit_sum' || !validArguments) {
        protocol.push({ id, title, status: first.response.ok ? 'fail' : routeStatus(first.response), detail: first.response.ok ? '首轮未产生符合预期的 audit_sum 工具调用。' : first.response.errorMessage || `HTTP ${first.response.status}`, latencyMs: first.response.latencyMs, rawEventTypes: first.eventTypes });
        recordScore('tools', 0, id);
        return;
      }
      const continuation = await execute(adapter, adapter.toolContinuation(options.baseUrl, options.apiKey, options.model, first, '42'), options.signal);
      nativeResults.push(continuation);
      const consumed = continuation.response.ok && /(^|\D)42(\D|$)/.test(continuation.text);
      recordScore('tools', consumed ? 1 : 0, id);
      protocol.push({ id, title, status: continuation.response.ok ? (consumed ? 'pass' : 'fail') : routeStatus(continuation.response), detail: consumed ? '模型发起 audit_sum，收到固定 mock 结果 42，并在第二轮消费该结果。' : continuation.response.ok ? '第二轮响应未消费固定 mock 结果 42。' : continuation.response.errorMessage || `HTTP ${continuation.response.status}`, latencyMs: continuation.response.latencyMs, rawEventTypes: [...first.eventTypes, ...continuation.eventTypes] });
    } catch {
      recordScore('tools', 0, id);
      protocol.push(unavailableEvidence(id, title, '工具回传第二轮请求未能完成。'));
    }
  };

  if (shouldExecute('p1-tool-roundtrip')) await runToolRoundtrip('p1-tool-roundtrip', '受控工具回合');
  if (shouldExecute('p2-tool-planning')) await runToolRoundtrip('p2-tool-planning', '双回合工具规划');
  if (shouldExecute('p1-signature-continuity') && provider === 'anthropic' && reasoningResult) {
    const signature = reasoningResult.signature || '';
    const thinkingText = reasoningResult.thinkingText || '';
    if (signature && thinkingText && adapter.signatureContinuation) {
      try {
        const continuation = await execute(adapter, adapter.signatureContinuation(options.baseUrl, options.apiKey, options.model, thinkingText, signature), options.signal);
        nativeResults.push(continuation);
        protocol.push({
          id: 'p1-signature-continuity',
          title: '思考签名连续性',
          status: continuation.response.ok ? 'pass' : routeStatus(continuation.response),
          detail: continuation.response.ok ? `捕获并成功回传 Anthropic thinking signature（长度 ${signature.length}）。` : continuation.response.errorMessage || `签名回传 HTTP ${continuation.response.status}`,
          latencyMs: continuation.response.latencyMs,
          rawEventTypes: continuation.eventTypes,
        });
      } catch {
        protocol.push(unavailableEvidence('p1-signature-continuity', '思考签名连续性', '签名第二轮回传请求未能完成。'));
      }
    } else {
      protocol.push({ id: 'p1-signature-continuity', title: '思考签名连续性', status: reasoningResult.response.ok ? (reasoningResult.thinkingText ? 'fail' : 'unavailable') : routeStatus(reasoningResult.response), detail: reasoningResult.response.ok ? (reasoningResult.thinkingText ? '原生 thinking 响应未提供可回传的 signature。' : '本次 adaptive thinking 未触发，无法检查 signature。') : '推理路由不可用，无法检查签名。', latencyMs: reasoningResult.response.latencyMs });
    }
  } else if (shouldExecute('p1-signature-continuity')) {
    protocol.push(unavailableEvidence('p1-signature-continuity', '思考签名连续性', '该检查仅适用于 Anthropic Messages thinking 协议。'));
  }
  if (shouldExecute('p1-cache-semantics')) {
    if (!adapter.cache) {
      protocol.push(unavailableEvidence('p1-cache-semantics', '缓存语义', provider === 'gemini' ? 'Gemini context caching 请求字段尚未完成验证。' : '当前 Provider Adapter 没有缓存请求能力声明。'));
    } else {
      const cachePrefix = Array.from({ length: 1_400 }, (_, index) => `cache-prefix-token-${index}`).join(' ');
      try {
        const first = await execute(adapter, adapter.cache(options.baseUrl, options.apiKey, options.model, cachePrefix), options.signal);
        nativeResults.push(first);
        const second = await execute(adapter, adapter.cache(options.baseUrl, options.apiKey, options.model, cachePrefix), options.signal);
        nativeResults.push(second);
        const firstCached = cachedInputTokens(first);
        const secondCached = cachedInputTokens(second);
        const hasEvidence = firstCached !== undefined && secondCached !== undefined;
        const passed = hasEvidence && (secondCached ?? 0) > (firstCached ?? 0);
        protocol.push({
          id: 'p1-cache-semantics',
          title: '缓存语义',
          status: !first.response.ok ? routeStatus(first.response) : !second.response.ok ? routeStatus(second.response) : !hasEvidence ? 'unavailable' : passed ? 'pass' : 'fail',
          detail: passed ? `第二次请求缓存输入 token 增加（${firstCached} -> ${secondCached}）。` : !first.response.ok ? first.response.errorMessage || `HTTP ${first.response.status}` : !second.response.ok ? second.response.errorMessage || `HTTP ${second.response.status}` : hasEvidence ? `未观察到第二次请求缓存命中增加（${firstCached} -> ${secondCached}）。` : '响应未暴露可验证的缓存 token usage 字段。',
          latencyMs: second.response.latencyMs,
          rawEventTypes: [...first.eventTypes, ...second.eventTypes],
        });
      } catch {
        protocol.push(unavailableEvidence('p1-cache-semantics', '缓存语义', '缓存语义请求未能完成。'));
      }
    }
  }
  if (['p1-state-continuity', 'p1-tool-roundtrip', 'p1-signature-continuity', 'p1-cache-semantics'].some(shouldExecute)) progress('P1 状态覆盖');

  const contextProbeIds = ['p2-context-start', 'p2-context-middle', 'p2-context-end'].filter(shouldExecute);
  if (contextProbeIds.length > 0) {
    for (const probeId of contextProbeIds) {
      const position = probeId.endsWith('start') ? 'start' : probeId.endsWith('middle') ? 'middle' : 'end';
      const fixture = createNeedleFixture(`${options.model}-${position}`, position, 64_000);
      if (!adapter.context) {
        protocol.push(unavailableEvidence(probeId, suite.find((item) => item.id === probeId)?.title || probeId, '当前 Provider Adapter 未实现长上下文请求。'));
        continue;
      }
      try {
        const result = await execute(adapter, adapter.context(options.baseUrl, options.apiKey, options.model, fixture.document), options.signal);
        nativeResults.push(result);
        const score = scoreNeedleResponse(result.text, fixture.expectedAnswer);
        recordScore('context', score.score / 100, probeId);
        protocol.push({
          id: probeId,
          title: suite.find((item) => item.id === probeId)?.title || probeId,
          status: result.response.ok ? (score.passed ? 'pass' : 'fail') : routeStatus(result.response),
          detail: result.response.ok ? `needle ${position} 检索得分 ${score.score}/100，输入约 ${fixture.estimatedTokens.toLocaleString()} tokens。` : result.response.errorMessage || `HTTP ${result.response.status}`,
          latencyMs: result.response.latencyMs,
          rawEventTypes: result.eventTypes,
        });
      } catch {
        protocol.push(unavailableEvidence(probeId, suite.find((item) => item.id === probeId)?.title || probeId, '长上下文请求未能完成。'));
      }
    }
    progress('长上下文检索');
  }

  if (shouldExecute('p2-constraint-json')) {
    if (!adapter.strictJson) {
      protocol.push(unavailableEvidence('p2-constraint-json', '约束 JSON 任务', '当前 Provider Adapter 未实现严格 JSON。'));
    } else {
      try {
        const result = await execute(adapter, adapter.strictJson(options.baseUrl, options.apiKey, options.model), options.signal);
        nativeResults.push(result);
        let parsed: unknown = null;
        try { parsed = JSON.parse(result.text); } catch { parsed = null; }
        const passed = result.response.ok && typeof parsed === 'object' && parsed !== null && (parsed as Record<string, unknown>).status === 'ok';
        recordScore('structured_output', passed ? 1 : 0, 'p2-constraint-json');
        protocol.push({ id: 'p2-constraint-json', title: '约束 JSON 任务', status: result.response.ok ? (passed ? 'pass' : 'fail') : routeStatus(result.response), detail: passed ? '约束 JSON 任务通过。' : '约束 JSON 任务未通过。', latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
      } catch {
        protocol.push(unavailableEvidence('p2-constraint-json', '约束 JSON 任务', '约束 JSON 请求未能完成。'));
      }
    }
  }

  for (const probeId of ['p2-chart-extraction', 'p2-code-repair-a', 'p2-code-repair-b']) {
    if (shouldExecute(probeId)) {
      const title = suite.find((item) => item.id === probeId)?.title || probeId;
      if (!probeId.startsWith('p2-code-repair')) {
        protocol.push(unavailableEvidence(probeId, title, '该 P2 任务需要视觉输入适配器，当前网页阶段尚未实现。'));
        continue;
      }
      if (!adapter.codeRepair) {
        protocol.push(unavailableEvidence(probeId, title, '当前 Provider Adapter 未实现代码修复请求。'));
        continue;
      }
      try {
        const fixture = createCodeRepairFixture(probeId.endsWith('-a') ? 'arithmetic' : 'set');
        const result = await execute(adapter, adapter.codeRepair(options.baseUrl, options.apiKey, options.model, fixture.instruction, fixture.source), options.signal);
        nativeResults.push(result);
        const score = scoreCodeRepairResponse(result.text, fixture);
        recordScore('code', score.score / 100, probeId);
        protocol.push({ id: probeId, title, status: result.response.ok ? (score.passed ? 'pass' : 'fail') : routeStatus(result.response), detail: result.response.ok ? `隐藏断言通过 ${score.matched.length}/${fixture.expectedTokens.length} 项。` : result.response.errorMessage || `HTTP ${result.response.status}`, latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
      } catch {
        protocol.push(unavailableEvidence(probeId, title, '代码修复请求未能完成。'));
      }
    }
  }

  const repeatProbeIds = ['p3-repeat-a', 'p3-repeat-b', 'p3-repeat-c', 'p3-repeat-d'].filter(shouldExecute);
  for (const probeId of repeatProbeIds) {
    try {
      const result = await execute(adapter, adapter.basic(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(result);
      protocol.push({ id: probeId, title: suite.find((item) => item.id === probeId)?.title || probeId, status: result.response.ok ? 'pass' : routeStatus(result.response), detail: result.response.ok ? '重复运行样本请求成功。' : result.response.errorMessage || `HTTP ${result.response.status}`, latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
    } catch {
      protocol.push(unavailableEvidence(probeId, suite.find((item) => item.id === probeId)?.title || probeId, '重复运行样本请求未能完成。'));
    }
  }
  if (repeatProbeIds.length > 0) progress('重复运行质量');

  const capabilities = CAPABILITY_DOMAINS.map((domain) => ({ ...unavailableMetric(domain, options.baselineId, measuredScores[domain] || []), exploratoryScores: exploratoryScores[domain] || [] }));
  const seed = options.seed || `audit-${provider}-${options.model}-${profile}`;
  const comparedCapabilities = capabilities.map((metric) => {
    const baselineScores = baselineSnapshot?.capabilityDistributions[metric.domain] || [];
    if (!metric.targetScores.length || !baselineScores.length) return metric;
    const comparison = bootstrapDifference(metric.targetScores, baselineScores, `${seed}:${metric.domain}`, 2_000);
    return {
      ...metric,
      baselineScores,
      delta: comparison.delta,
      confidenceInterval: comparison.interval,
      status: comparison.interval[1] <= -0.15 ? 'fail' : 'pass',
      detail: `目标样本 ${metric.targetScores.length} 个，基线样本 ${baselineScores.length} 个；差异 ${(comparison.delta * 100).toFixed(1)} 个百分点，95% 区间 ${(comparison.interval[0] * 100).toFixed(1)} 至 ${(comparison.interval[1] * 100).toFixed(1)} 个百分点。`,
    } satisfies CapabilityMetric;
  });
  for (const item of suite) {
    const route = routeFor(item.id);
    if (route.disposition === 'not_claimed' && !protocol.some((evidence) => evidence.id === item.id)) {
      protocol.push(unavailableEvidence(item.id, item.title, `未声明该能力，已跳过正式评分：${route.reason}`));
    }
  }
  const visibleProtocol = protocol.filter((item) => selectedProbeIds.has(item.id)).map((item) => ({
    ...item,
    disposition: routeFor(item.id).disposition,
    countsTowardReferenceConclusion: routeFor(item.id).countsTowardReferenceConclusion,
  }));
  const coverage = {
    executed: visibleProtocol.filter((item) => item.status !== 'unavailable').length,
    total: suite.length,
    unavailable: visibleProtocol.filter((item) => item.status === 'unavailable' && item.disposition !== 'not_claimed').length,
    notClaimed: visibleProtocol.filter((item) => item.disposition === 'not_claimed').length,
    exploratory: visibleProtocol.filter((item) => item.disposition === 'exploratory_test').length,
  };
  const conclusion = determineConclusion(comparedCapabilities);
  options.onProgress?.(suite.length, suite.length, '审计完成');

  return {
    schemaVersion: '4.0',
    target: { provider, model: options.model, baseUrl: options.baseUrl },
    profile,
    baselineId: baselineSnapshot?.id || options.baselineId,
    protocol: visibleProtocol,
    capabilities: comparedCapabilities,
    runtime: runtimeFrom(nativeResults),
    conclusion,
    summary: buildAuditSummary({
      schemaVersion: '4.0',
      target: { provider, model: options.model, baseUrl: options.baseUrl },
      profile,
      baselineId: baselineSnapshot?.id || options.baselineId,
      protocol: visibleProtocol,
      capabilities: comparedCapabilities,
      runtime: runtimeFrom(nativeResults),
      conclusion,
      summary: '',
      candidateDistances: [],
      fixtureHashes: Object.fromEntries(suite.map((item) => [item.id, hashFixture(item.fixture)])),
      coverage,
      selectedProbeIds: suite.map((item) => item.id),
      seed,
      testedAt: new Date().toISOString(),
    }),
    candidateDistances: [],
    fixtureHashes: Object.fromEntries(suite.map((item) => [item.id, hashFixture(item.fixture)])),
    coverage,
    selectedProbeIds: suite.map((item) => item.id),
    seed,
    testedAt: new Date().toISOString(),
  };
}
