import { fetchRemoteModels } from '../scanner/batchScanner';
import { silentFetch, TransportResponse } from '../transport/silentTransport';
import { AuditProfile, AuditProvider, AuditReportV4, CapabilityMetric, ProtocolEvidence } from '../../types/audit';
import { PROVIDER_ADAPTERS, ProviderAdapter, NativeResult, NativeRequest, detectAuditProvider } from './providerAdapters';
import { hashFixture, selectSuite } from './suite';
import { determineConclusion } from './statistics';

export interface AuditRunOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  provider?: AuditProvider | 'auto';
  profile?: AuditProfile;
  baselineId?: string;
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

function unavailableMetric(domain: CapabilityMetric['domain'], baselineId?: string): CapabilityMetric {
  return {
    domain,
    targetScores: [],
    baselineScores: [],
    status: 'unavailable',
    detail: baselineId
      ? '本轮浏览器执行器尚未运行该能力域；需要本地 CLI 任务、固定夹具和官方基线快照。'
      : '未提供官方基线快照；不能将单次能力表现转换为身份结论。',
  };
}

function unavailableEvidence(id: string, title: string, detail: string): ProtocolEvidence {
  return { id, title, status: 'unavailable', detail };
}

function routeStatus(response: TransportResponse<unknown>): 'pass' | 'fail' | 'unavailable' {
  if (response.ok) return 'pass';
  if ([0, 404, 405, 408, 502, 503, 504].includes(response.status)) return 'unavailable';
  return 'fail';
}

function basicEvidence(result: NativeResult): ProtocolEvidence {
  const status = routeStatus(result.response);
  if (status === 'pass' && result.text.includes('audit-ready.')) {
    return { id: 'p0-native-route', title: '原生 API 路由', status, detail: '原生请求成功返回固定夹具文本。', latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes };
  }
  return {
    id: 'p0-native-route',
    title: '原生 API 路由',
    status,
    detail: status === 'unavailable' ? '原生路由未开放或代理链路不可用。' : `请求成功但响应未匹配固定夹具：${result.text.slice(0, 120)}`,
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
    timeoutMs: 12_000,
    signal,
  });
  return adapter.parse(response);
}

function runtimeFrom(results: NativeResult[]) {
  const latencies = results.map((result) => result.response.latencyMs).filter((value) => value >= 0).sort((a, b) => a - b);
  const percentile = (p: number) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))];
  return {
    attempts: results.length,
    successRate: results.length > 0 ? results.filter((result) => result.response.ok).length / results.length : 0,
    p50LatencyMs: latencies.length > 0 ? percentile(0.5) : undefined,
    p95LatencyMs: latencies.length > 0 ? percentile(0.95) : undefined,
  };
}

export async function runAudit(options: AuditRunOptions): Promise<AuditReportV4> {
  const profile = options.profile || 'balanced';
  const provider = detectAuditProvider(options.model, options.provider || 'auto');
  const adapter = PROVIDER_ADAPTERS[provider];
  const suite = selectSuite(profile);
  const protocol: ProtocolEvidence[] = [];
  const nativeResults: NativeResult[] = [];
  let completed = 0;

  const progress = (label: string) => {
    completed += 1;
    options.onProgress?.(completed, suite.length, label);
  };

  try {
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
  progress('模型发现');

  try {
    const basicResult = await execute(adapter, adapter.basic(options.baseUrl, options.apiKey, options.model), options.signal);
    nativeResults.push(basicResult);
    protocol.push(basicEvidence(basicResult));
    protocol.push({
      id: 'p0-auth-shape',
      title: '认证头与错误语义',
      status: basicResult.response.status === 401 || basicResult.response.status === 403 ? 'fail' : routeStatus(basicResult.response),
      detail: basicResult.response.ok ? '认证头被接受。' : basicResult.response.errorMessage || `HTTP ${basicResult.response.status}`,
      latencyMs: basicResult.response.latencyMs,
    });
  } catch (error: unknown) {
    protocol.push({ id: 'p0-native-route', title: '原生 API 路由', status: 'unavailable', detail: String(error) });
    protocol.push({ id: 'p0-auth-shape', title: '认证头与错误语义', status: 'unavailable', detail: '请求未能完成。' });
  }
  progress('原生路由与认证');

  if (adapter.strictJson) {
    try {
      const result = await execute(adapter, adapter.strictJson(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(result);
      let parsed: unknown = null;
      try { parsed = JSON.parse(result.text); } catch { parsed = null; }
      const pass = result.response.ok && typeof parsed === 'object' && parsed !== null && (parsed as Record<string, unknown>).status === 'ok';
      protocol.push({ id: 'p0-strict-json', title: '严格 JSON Schema', status: result.response.ok ? (pass ? 'pass' : 'fail') : routeStatus(result.response), detail: pass ? '响应符合固定 JSON 夹具。' : '响应未通过严格 JSON 夹具。', latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
    } catch { protocol.push(unavailableEvidence('p0-strict-json', '严格 JSON Schema', '严格 JSON 请求未能完成。')); }
  } else {
    protocol.push(unavailableEvidence('p0-strict-json', '严格 JSON Schema', '当前原生适配器没有该能力声明。'));
  }
  progress('严格 JSON');

  if (adapter.tool) {
    try {
      const result = await execute(adapter, adapter.tool(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(result);
      protocol.push({ id: 'p0-tool-shape', title: '工具调用结构', status: result.response.ok ? (result.toolCalled ? 'pass' : 'fail') : routeStatus(result.response), detail: result.toolCalled ? '捕获到原生工具调用事件。' : '请求成功但未捕获工具调用事件。', latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
    } catch { protocol.push(unavailableEvidence('p0-tool-shape', '工具调用结构', '工具调用请求未能完成。')); }
  } else {
    protocol.push(unavailableEvidence('p0-tool-shape', '工具调用结构', '当前原生适配器没有工具能力声明。'));
  }
  progress('工具结构');

  protocol.push(unavailableEvidence('p0-stream-events', '流式事件顺序', '浏览器第一阶段暂不执行长连接事件顺序测试，由 CLI 执行。'));
  protocol.push(unavailableEvidence('p0-invalid-parameter', '非法参数回显', '为避免对真实端点造成破坏性请求，非法参数测试由 CLI mock 网关执行。'));
  progress('P0 协议覆盖');

  if (adapter.reasoning) {
    try {
      const result = await execute(adapter, adapter.reasoning(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(result);
      const hasReasoning = result.eventTypes.some((type) => /reason|thinking/i.test(type));
      protocol.push({ id: 'p1-reasoning-config', title: '推理配置透传', status: result.response.ok ? (hasReasoning ? 'pass' : 'fail') : routeStatus(result.response), detail: hasReasoning ? '捕获到原生推理事件类型。' : '响应成功但未捕获原生推理事件。', latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
    } catch { protocol.push(unavailableEvidence('p1-reasoning-config', '推理配置透传', '推理请求未能完成。')); }
  } else {
    protocol.push(unavailableEvidence('p1-reasoning-config', '推理配置透传', '当前原生适配器没有推理能力声明。'));
  }
  progress('推理配置');

  protocol.push(unavailableEvidence('p1-state-continuity', '跨轮状态连续性', '需要 provider-specific 多轮执行器。'));
  protocol.push(unavailableEvidence('p1-tool-roundtrip', '受控工具回合', '当前浏览器执行器只验证工具事件，不执行工具回传闭环。'));
  protocol.push(unavailableEvidence('p1-signature-continuity', '思考签名连续性', '签名连续性需要原生流式事件和第二轮回传执行器。'));
  protocol.push(unavailableEvidence('p1-cache-semantics', '缓存语义', '缓存语义需要 provider-specific 成本与命中证据。'));
  progress('P1 状态覆盖');

  const capabilities = CAPABILITY_DOMAINS.map((domain) => unavailableMetric(domain, options.baselineId));
  const seed = options.seed || `audit-${provider}-${options.model}-${profile}`;
  const coverage = {
    executed: protocol.filter((item) => item.status !== 'unavailable').length,
    total: suite.length,
    unavailable: protocol.filter((item) => item.status === 'unavailable').length,
  };
  const conclusion = determineConclusion(capabilities);

  return {
    schemaVersion: '4.0',
    target: { provider, model: options.model, baseUrl: options.baseUrl },
    profile,
    baselineId: options.baselineId,
    protocol,
    capabilities,
    runtime: runtimeFrom(nativeResults),
    conclusion,
    summary: `已执行 ${coverage.executed}/${coverage.total} 项浏览器协议检查；P2/P3 能力评测与官方基线未在本次运行中提供，因此结论为证据不足。`,
    candidateDistances: [],
    fixtureHashes: Object.fromEntries(suite.map((item) => [item.id, hashFixture(item.fixture)])),
    coverage,
    seed,
    testedAt: new Date().toISOString(),
  };
}
