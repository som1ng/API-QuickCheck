import { AuditProvider, AuditSurface, EvidenceStatus, ProtocolEvidence } from '../../types/audit';
import { normalizeBaseUrl } from '../transport/urlNormalizer';
import { silentFetch, TransportResponse } from '../transport/silentTransport';

export interface NativeRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

export interface NativeResult {
  response: TransportResponse<Record<string, unknown>>;
  text: string;
  eventTypes: string[];
  signature?: string;
  toolCalled: boolean;
}

export interface ProviderAdapter {
  provider: AuditProvider;
  surface: AuditSurface;
  basic(baseUrl: string, apiKey: string, model: string): NativeRequest;
  strictJson?: ((baseUrl: string, apiKey: string, model: string) => NativeRequest) | undefined;
  tool?: ((baseUrl: string, apiKey: string, model: string) => NativeRequest) | undefined;
  reasoning?: ((baseUrl: string, apiKey: string, model: string) => NativeRequest) | undefined;
  parse(response: TransportResponse<Record<string, unknown>>): NativeResult;
}

const endpoint = (baseUrl: string, suffix: string) => {
  const base = normalizeBaseUrl(baseUrl);
  return base.endsWith(suffix) ? base : `${base}${suffix}`;
};

const textFromContent = (content: unknown): string => Array.isArray(content)
  ? content.map((part) => typeof part === 'object' && part !== null && 'text' in part ? String((part as Record<string, unknown>).text ?? '') : '').join('')
  : typeof content === 'string' ? content : '';

const parseResponses = (response: TransportResponse<Record<string, unknown>>): NativeResult => {
  const output = Array.isArray(response.data?.output) ? response.data?.output as Record<string, unknown>[] : [];
  const text = typeof response.data?.output_text === 'string'
    ? response.data.output_text
    : output.map((item) => textFromContent(item.content)).join('');
  const toolCalled = output.some((item) => item.type === 'function_call');
  return { response, text, eventTypes: output.map((item) => String(item.type ?? 'unknown')), toolCalled };
};

const parseMessages = (response: TransportResponse<Record<string, unknown>>): NativeResult => {
  const content = Array.isArray(response.data?.content) ? response.data.content as Record<string, unknown>[] : [];
  const thinking = content.find((item) => item.type === 'thinking');
  return {
    response,
    text: content.filter((item) => item.type === 'text').map((item) => String(item.text ?? '')).join(''),
    eventTypes: content.map((item) => String(item.type ?? 'unknown')),
    signature: typeof thinking?.signature === 'string' ? thinking.signature : undefined,
    toolCalled: content.some((item) => item.type === 'tool_use'),
  };
};

const parseInteractions = (response: TransportResponse<Record<string, unknown>>): NativeResult => {
  const output = Array.isArray(response.data?.output) ? response.data.output as Record<string, unknown>[] : [];
  const text = typeof response.data?.output_text === 'string'
    ? response.data.output_text
    : output.map((item) => textFromContent(item.content)).join('');
  return {
    response,
    text,
    eventTypes: output.map((item) => String(item.type ?? 'unknown')),
    toolCalled: output.some((item) => item.type === 'function_call' || item.type === 'tool_call'),
  };
};

const openAiLike = (provider: 'openai' | 'xai'): ProviderAdapter => ({
  provider,
  surface: 'responses',
  basic: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, '/responses'), headers: { Authorization: `Bearer ${apiKey}` }, body: { model, input: 'Return exactly: audit-ready.' },
  }),
  strictJson: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, '/responses'), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model, input: 'Return a JSON object with exactly one property named status and value ok.',
      text: { format: { type: 'json_schema', name: 'audit_status', strict: true, schema: { type: 'object', properties: { status: { type: 'string', enum: ['ok'] } }, required: ['status'], additionalProperties: false } } },
    },
  }),
  tool: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, '/responses'), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model, input: 'Call audit_sum with a=19 and b=23. Do not answer in prose.',
      tools: [{ type: 'function', name: 'audit_sum', description: 'Adds two integers.', parameters: { type: 'object', properties: { a: { type: 'integer' }, b: { type: 'integer' } }, required: ['a', 'b'], additionalProperties: false }, strict: true }],
    },
  }),
  reasoning: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, '/responses'), headers: { Authorization: `Bearer ${apiKey}` }, body: { model, input: 'What is 19 multiplied by 23? Return only the number.', reasoning: { effort: 'high' } },
  }),
  parse: parseResponses,
});

const anthropic: ProviderAdapter = {
  provider: 'anthropic', surface: 'messages',
  basic: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/messages'), headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: { model, max_tokens: 128, messages: [{ role: 'user', content: 'Return exactly: audit-ready.' }] } }),
  strictJson: undefined,
  tool: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/messages'), headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: { model, max_tokens: 256, tools: [{ name: 'audit_sum', description: 'Adds two integers.', input_schema: { type: 'object', properties: { a: { type: 'integer' }, b: { type: 'integer' } }, required: ['a', 'b'], additionalProperties: false } }], messages: [{ role: 'user', content: 'Call audit_sum with a=19 and b=23. Do not answer in prose.' }] } }),
  reasoning: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/messages'), headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: { model, max_tokens: 256, thinking: { type: 'adaptive' }, output_config: { effort: 'high' }, messages: [{ role: 'user', content: 'What is 19 multiplied by 23? Return only the number.' }] } }),
  parse: parseMessages,
};

const gemini: ProviderAdapter = {
  provider: 'gemini', surface: 'interactions',
  basic: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/interactions'), headers: { 'x-goog-api-key': apiKey }, body: { model, input: 'Return exactly: audit-ready.', store: true } }),
  strictJson: undefined,
  tool: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/interactions'), headers: { 'x-goog-api-key': apiKey }, body: { model, input: 'Call audit_sum with a=19 and b=23. Do not answer in prose.', tools: [{ function_declarations: [{ name: 'audit_sum', description: 'Adds two integers.', parameters_json_schema: { type: 'object', properties: { a: { type: 'integer' }, b: { type: 'integer' } }, required: ['a', 'b'] } }] }] } }),
  reasoning: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/interactions'), headers: { 'x-goog-api-key': apiKey }, body: { model, input: 'What is 19 multiplied by 23? Return only the number.', generation_config: { thinking_level: 'high' } } }),
  parse: parseInteractions,
};

export const PROVIDER_ADAPTERS: Record<AuditProvider, ProviderAdapter> = {
  openai: openAiLike('openai'), xai: openAiLike('xai'), anthropic, gemini,
};

export function detectAuditProvider(model: string, requested: AuditProvider | 'auto' = 'auto'): AuditProvider {
  if (requested !== 'auto') return requested;
  const id = model.toLowerCase();
  if (id.includes('claude') || id.includes('fable') || id.includes('opus') || id.includes('sonnet')) return 'anthropic';
  if (id.includes('gemini')) return 'gemini';
  if (id.includes('grok')) return 'xai';
  return 'openai';
}

export async function sendNative(request: NativeRequest): Promise<NativeResult> {
  const response = await silentFetch<Record<string, unknown>>({ url: request.url, headers: request.headers, body: request.body, timeoutMs: 12_000 });
  const adapter = request.url.includes('/messages') ? anthropic : request.url.includes('/interactions') ? gemini : request.url.includes('x.ai') ? PROVIDER_ADAPTERS.xai : PROVIDER_ADAPTERS.openai;
  return adapter.parse(response);
}

export const resultStatus = (result: NativeResult, predicate: boolean, unavailable = false): EvidenceStatus => unavailable ? 'unavailable' : result.response.ok && predicate ? 'pass' : 'fail';

export const evidence = (id: string, title: string, result: NativeResult, status: EvidenceStatus, detail: string): ProtocolEvidence => ({ id, title, status, detail, latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
