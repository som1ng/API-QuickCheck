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
  usage?: Record<string, unknown>;
  signature?: string;
  thinkingText?: string;
  toolCalled: boolean;
  toolCall?: { id: string; name: string; arguments: unknown };
}

export interface ProviderAdapter {
  provider: AuditProvider;
  surface: AuditSurface;
  basic(baseUrl: string, apiKey: string, model: string): NativeRequest;
  strictJson?: ((baseUrl: string, apiKey: string, model: string) => NativeRequest) | undefined;
  tool?: ((baseUrl: string, apiKey: string, model: string) => NativeRequest) | undefined;
  reasoning?: ((baseUrl: string, apiKey: string, model: string) => NativeRequest) | undefined;
  context?: ((baseUrl: string, apiKey: string, model: string, document: string) => NativeRequest) | undefined;
  stream?: ((baseUrl: string, apiKey: string, model: string) => NativeRequest) | undefined;
  state?: ((baseUrl: string, apiKey: string, model: string, marker: string) => NativeRequest) | undefined;
  stateContinuation?: ((baseUrl: string, apiKey: string, model: string, result: NativeResult, marker: string) => NativeRequest) | undefined;
  cache?: ((baseUrl: string, apiKey: string, model: string, prefix: string) => NativeRequest) | undefined;
  toolContinuation?: ((baseUrl: string, apiKey: string, model: string, result: NativeResult, toolOutput: string) => NativeRequest) | undefined;
  signatureContinuation?: ((baseUrl: string, apiKey: string, model: string, thinkingText: string, signature: string) => NativeRequest) | undefined;
  parse(response: TransportResponse<Record<string, unknown>>): NativeResult;
}

const endpoint = (baseUrl: string, suffix: string) => {
  const base = normalizeBaseUrl(baseUrl);
  return base.endsWith(suffix) ? base : `${base}${suffix}`;
};

const textFromContent = (content: unknown): string => Array.isArray(content)
  ? content.map((part) => typeof part === 'object' && part !== null && 'text' in part ? String((part as Record<string, unknown>).text ?? '') : '').join('')
  : typeof content === 'string' ? content : '';

const parseToolArguments = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
};

const parseResponses = (response: TransportResponse<Record<string, unknown>>): NativeResult => {
  const output = Array.isArray(response.data?.output) ? response.data?.output as Record<string, unknown>[] : [];
  const text = typeof response.data?.output_text === 'string'
    ? response.data.output_text
    : output.map((item) => textFromContent(item.content)).join('');
  const toolCall = output.find((item) => item.type === 'function_call');
  return {
    response,
    text,
    eventTypes: output.map((item) => String(item.type ?? 'unknown')),
    usage: response.data?.usage,
    toolCalled: Boolean(toolCall),
    toolCall: toolCall ? { id: String(toolCall.call_id ?? toolCall.id ?? ''), name: String(toolCall.name ?? ''), arguments: parseToolArguments(toolCall.arguments) } : undefined,
  };
};

const parseMessages = (response: TransportResponse<Record<string, unknown>>): NativeResult => {
  const content = Array.isArray(response.data?.content) ? response.data.content as Record<string, unknown>[] : [];
  const thinking = content.find((item) => item.type === 'thinking');
  const toolCall = content.find((item) => item.type === 'tool_use');
  return {
    response,
    text: content.filter((item) => item.type === 'text').map((item) => String(item.text ?? '')).join(''),
    eventTypes: content.map((item) => String(item.type ?? 'unknown')),
    usage: response.data?.usage,
    signature: typeof thinking?.signature === 'string' ? thinking.signature : undefined,
    thinkingText: typeof thinking?.thinking === 'string' ? thinking.thinking : undefined,
    toolCalled: Boolean(toolCall),
    toolCall: toolCall ? { id: String(toolCall.id ?? ''), name: String(toolCall.name ?? ''), arguments: toolCall.input } : undefined,
  };
};

const parseInteractions = (response: TransportResponse<Record<string, unknown>>): NativeResult => {
  const output = Array.isArray(response.data?.output) ? response.data.output as Record<string, unknown>[] : [];
  const text = typeof response.data?.output_text === 'string'
    ? response.data.output_text
    : output.map((item) => textFromContent(item.content)).join('');
  const toolCall = output.find((item) => item.type === 'function_call' || item.type === 'tool_call');
  return {
    response,
    text,
    eventTypes: output.map((item) => String(item.type ?? 'unknown')),
    usage: response.data?.usage,
    toolCalled: Boolean(toolCall),
    toolCall: toolCall ? { id: String(toolCall.call_id ?? toolCall.id ?? ''), name: String(toolCall.name ?? ''), arguments: toolCall.arguments ?? toolCall.input } : undefined,
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
  context: (baseUrl, apiKey, model, document) => ({
    url: endpoint(baseUrl, '/responses'),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      input: `Find the exact value after FIXED_CONTEXT_MARKER in this document. Return only that value.\n\n${document}`,
      max_output_tokens: 64,
    },
  }),
  stream: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, '/responses'),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, input: 'Return exactly: audit-ready.', stream: true },
  }),
  state: (baseUrl, apiKey, model, marker) => ({
    url: endpoint(baseUrl, '/responses'),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, input: `Remember this exact state marker: ${marker}. Reply with acknowledged.`, store: true },
  }),
  stateContinuation: (baseUrl, apiKey, model, result, marker) => ({
    url: endpoint(baseUrl, '/responses'),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, previous_response_id: result.response.data?.id, input: `What was the exact state marker? Return only ${marker}.` },
  }),
  cache: (baseUrl, apiKey, model, prefix) => ({
    url: endpoint(baseUrl, '/responses'),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, input: [{ role: 'user', content: [{ type: 'input_text', text: prefix }, { type: 'input_text', text: 'Return exactly: cache-ready.' }] }] },
  }),
  toolContinuation: (baseUrl, apiKey, model, result, toolOutput) => ({
    url: endpoint(baseUrl, '/responses'),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      previous_response_id: result.response.data?.id,
      input: [{ type: 'function_call_output', call_id: result.toolCall?.id, output: toolOutput }],
    },
  }),
  parse: parseResponses,
});

const anthropic: ProviderAdapter = {
  provider: 'anthropic', surface: 'messages',
  basic: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/messages'), headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: { model, max_tokens: 128, messages: [{ role: 'user', content: 'Return exactly: audit-ready.' }] } }),
  strictJson: undefined,
  tool: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/messages'), headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: { model, max_tokens: 256, tools: [{ name: 'audit_sum', description: 'Adds two integers.', input_schema: { type: 'object', properties: { a: { type: 'integer' }, b: { type: 'integer' } }, required: ['a', 'b'], additionalProperties: false } }], messages: [{ role: 'user', content: 'Call audit_sum with a=19 and b=23. Do not answer in prose.' }] } }),
  reasoning: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/messages'), headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: { model, max_tokens: 256, thinking: { type: 'adaptive' }, output_config: { effort: 'high' }, messages: [{ role: 'user', content: 'What is 19 multiplied by 23? Return only the number.' }] } }),
  context: (baseUrl, apiKey, model, document) => ({
    url: endpoint(baseUrl, '/messages'),
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: {
      model,
      max_tokens: 64,
      messages: [{ role: 'user', content: `Find the exact value after FIXED_CONTEXT_MARKER in this document. Return only that value.\n\n${document}` }],
    },
  }),
  stream: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, '/messages'),
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: { model, max_tokens: 128, messages: [{ role: 'user', content: 'Return exactly: audit-ready.' }], stream: true },
  }),
  state: (baseUrl, apiKey, model, marker) => ({
    url: endpoint(baseUrl, '/messages'),
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: { model, max_tokens: 128, messages: [{ role: 'user', content: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }] },
  }),
  stateContinuation: (baseUrl, apiKey, model, result, marker) => ({
    url: endpoint(baseUrl, '/messages'),
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: { model, max_tokens: 128, messages: [{ role: 'user', content: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }, { role: 'assistant', content: result.response.data?.content }, { role: 'user', content: `What was the exact state marker? Return only ${marker}.` }] },
  }),
  cache: (baseUrl, apiKey, model, prefix) => ({
    url: endpoint(baseUrl, '/messages'),
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: { model, max_tokens: 128, messages: [{ role: 'user', content: [{ type: 'text', text: prefix, cache_control: { type: 'ephemeral' } }, { type: 'text', text: 'Return exactly: cache-ready.' }] }] },
  }),
  toolContinuation: (baseUrl, apiKey, model, result, toolOutput) => ({
    url: endpoint(baseUrl, '/messages'),
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: {
      model,
      max_tokens: 256,
      messages: [
        { role: 'user', content: 'Call audit_sum with a=19 and b=23. Do not answer in prose.' },
        { role: 'assistant', content: result.response.data?.content },
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: result.toolCall?.id, content: toolOutput }] },
      ],
    },
  }),
  signatureContinuation: (baseUrl, apiKey, model, thinkingText, signature) => ({
    url: endpoint(baseUrl, '/messages'),
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: {
      model,
      max_tokens: 256,
      messages: [
        { role: 'user', content: 'What is 19 multiplied by 23? Return only the number.' },
        {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: thinkingText, signature },
            { type: 'text', text: '19 * 23 = 437.' },
          ],
        },
        { role: 'user', content: 'Now add 10 to that result.' },
      ],
    },
  }),
  parse: parseMessages,
};

const gemini: ProviderAdapter = {
  provider: 'gemini', surface: 'interactions',
  basic: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/interactions'), headers: { 'x-goog-api-key': apiKey }, body: { model, input: 'Return exactly: audit-ready.', store: true } }),
  strictJson: undefined,
  tool: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/interactions'), headers: { 'x-goog-api-key': apiKey }, body: { model, input: 'Call audit_sum with a=19 and b=23. Do not answer in prose.', tools: [{ function_declarations: [{ name: 'audit_sum', description: 'Adds two integers.', parameters_json_schema: { type: 'object', properties: { a: { type: 'integer' }, b: { type: 'integer' } }, required: ['a', 'b'] } }] }] } }),
  reasoning: (baseUrl, apiKey, model) => ({ url: endpoint(baseUrl, '/interactions'), headers: { 'x-goog-api-key': apiKey }, body: { model, input: 'What is 19 multiplied by 23? Return only the number.', generation_config: { thinking_level: 'high' } } }),
  context: (baseUrl, apiKey, model, document) => ({
    url: endpoint(baseUrl, '/interactions'),
    headers: { 'x-goog-api-key': apiKey },
    body: {
      model,
      input: `Find the exact value after FIXED_CONTEXT_MARKER in this document. Return only that value.\n\n${document}`,
      generation_config: { max_output_tokens: 64 },
    },
  }),
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
