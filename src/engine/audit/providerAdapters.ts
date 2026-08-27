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
  finishReason?: string;
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
  codeRepair?: ((baseUrl: string, apiKey: string, model: string, instruction: string, source: string) => NativeRequest) | undefined;
  stream?: ((baseUrl: string, apiKey: string, model: string) => NativeRequest) | undefined;
  state?: ((baseUrl: string, apiKey: string, model: string, marker: string) => NativeRequest) | undefined;
  stateContinuation?: ((baseUrl: string, apiKey: string, model: string, result: NativeResult, marker: string) => NativeRequest) | undefined;
  cache?: ((baseUrl: string, apiKey: string, model: string, prefix: string) => NativeRequest) | undefined;
  toolContinuation?: ((baseUrl: string, apiKey: string, model: string, result: NativeResult, toolOutput: string) => NativeRequest) | undefined;
  signatureContinuation?: ((baseUrl: string, apiKey: string, model: string, thinkingText: string, signature: string, assistantText?: string) => NativeRequest) | undefined;
  parse(response: TransportResponse<Record<string, unknown>>): NativeResult;
}

const endpoint = (baseUrl: string, suffix: string) => {
  const base = normalizeBaseUrl(baseUrl);
  return base.endsWith(suffix) ? base : `${base}${suffix}`;
};

const anthropicEndpoint = (baseUrl: string) => {
  const base = normalizeBaseUrl(baseUrl);
  if (base.endsWith('/messages')) return base;
  return base.endsWith('/v1') ? `${base}/messages` : `${base}/v1/messages`;
};

const chatCompletionsEndpoint = (baseUrl: string) => {
  const base = normalizeBaseUrl(baseUrl);
  if (base.endsWith('/chat/completions')) return base;
  return base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
};

const geminiGenerateContentEndpoint = (baseUrl: string, model: string) => {
  const base = normalizeBaseUrl(baseUrl);
  return `${base}/models/${encodeURIComponent(model)}:generateContent`;
};

const textFromContent = (content: unknown): string => Array.isArray(content)
  ? content.map((part) => typeof part === 'object' && part !== null && 'text' in part ? String((part as Record<string, unknown>).text ?? '') : '').join('')
  : typeof content === 'string' ? content : '';

const parseToolArguments = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
};

const usageFromResponse = (response: TransportResponse<Record<string, unknown>>): Record<string, unknown> | undefined => {
  const usage = response.data?.usage;
  return typeof usage === 'object' && usage !== null ? usage as Record<string, unknown> : undefined;
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
    usage: usageFromResponse(response),
    finishReason: typeof response.data?.status === 'string' ? response.data.status : undefined,
    toolCalled: Boolean(toolCall),
    toolCall: toolCall ? { id: String(toolCall.call_id ?? toolCall.id ?? ''), name: String(toolCall.name ?? ''), arguments: parseToolArguments(toolCall.arguments) } : undefined,
  };
};

const parseMessages = (response: TransportResponse<Record<string, unknown>>): NativeResult => {
  const content = Array.isArray(response.data?.content) ? response.data.content as Record<string, unknown>[] : [];
  const thinking = content.find((item) => item.type === 'thinking' || item.type === 'redacted_thinking');
  const toolCall = content.find((item) => item.type === 'tool_use');
  return {
    response,
    text: content.filter((item) => item.type === 'text').map((item) => String(item.text ?? '')).join(''),
    eventTypes: content.map((item) => String(item.type ?? 'unknown')),
    usage: usageFromResponse(response),
    finishReason: typeof response.data?.stop_reason === 'string' ? response.data.stop_reason : undefined,
    signature: typeof thinking?.signature === 'string' ? thinking.signature : undefined,
    thinkingText: typeof thinking?.thinking === 'string' ? thinking.thinking : typeof thinking?.data === 'string' ? thinking.data : undefined,
    toolCalled: Boolean(toolCall),
    toolCall: toolCall ? { id: String(toolCall.id ?? ''), name: String(toolCall.name ?? ''), arguments: toolCall.input } : undefined,
  };
};

const parseGeminiGenerateContent = (response: TransportResponse<Record<string, unknown>>): NativeResult => {
  const candidates = Array.isArray(response.data?.candidates) ? response.data.candidates as Record<string, unknown>[] : [];
  const content = typeof candidates[0]?.content === 'object' && candidates[0].content !== null
    ? candidates[0].content as Record<string, unknown>
    : {};
  const parts = Array.isArray(content.parts) ? content.parts as Record<string, unknown>[] : [];
  const functionCall = parts.find((part) => typeof part.functionCall === 'object' && part.functionCall !== null);
  const call = functionCall?.functionCall as Record<string, unknown> | undefined;
  const firstCandidate = candidates[0];
  return {
    response,
    text: parts.filter((part) => typeof part.text === 'string').map((part) => String(part.text)).join(''),
    eventTypes: parts.map((part) => part.functionCall ? 'function_call' : 'text'),
    usage: typeof response.data?.usageMetadata === 'object' && response.data.usageMetadata !== null
      ? response.data.usageMetadata as Record<string, unknown>
      : undefined,
    finishReason: typeof firstCandidate?.finishReason === 'string' ? firstCandidate.finishReason : undefined,
    toolCalled: Boolean(call),
    toolCall: call ? { id: String(call.id ?? call.name ?? ''), name: String(call.name ?? ''), arguments: call.args } : undefined,
  };
};

const parseChatCompletions = (response: TransportResponse<Record<string, unknown>>): NativeResult => {
  const choices = Array.isArray(response.data?.choices) ? response.data.choices as Record<string, unknown>[] : [];
  const message = typeof choices[0]?.message === 'object' && choices[0].message !== null
    ? choices[0].message as Record<string, unknown>
    : {};
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls as Record<string, unknown>[] : [];
  const toolCall = toolCalls[0];
  const functionCall = typeof toolCall?.function === 'object' && toolCall.function !== null
    ? toolCall.function as Record<string, unknown>
    : undefined;
  return {
    response,
    text: textFromContent(message.content),
    eventTypes: toolCall ? ['tool_call'] : ['message'],
    usage: usageFromResponse(response),
    finishReason: typeof choices[0]?.finish_reason === 'string' ? choices[0].finish_reason : undefined,
    toolCalled: Boolean(toolCall && functionCall),
    toolCall: toolCall && functionCall ? {
      id: String(toolCall.id ?? ''),
      name: String(functionCall.name ?? ''),
      arguments: parseToolArguments(functionCall.arguments),
    } : undefined,
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
  codeRepair: (baseUrl, apiKey, model, instruction, source) => ({
    url: endpoint(baseUrl, '/responses'),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, input: `${instruction}\n\n源码：\n${source}`, max_output_tokens: 512 },
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

const anthropicHeaders = (apiKey: string) => ({
  'x-api-key': apiKey,
  Authorization: `Bearer ${apiKey}`,
  'anthropic-version': '2023-06-01',
});

const anthropic: ProviderAdapter = {
  provider: 'anthropic', surface: 'messages',
  basic: (baseUrl, apiKey, model) => ({ url: anthropicEndpoint(baseUrl), headers: anthropicHeaders(apiKey), body: { model, max_tokens: 128, messages: [{ role: 'user', content: 'Return exactly: audit-ready.' }] } }),
  strictJson: (baseUrl, apiKey, model) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: {
      model,
      max_tokens: 256,
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: { status: { type: 'string', enum: ['ok'] } },
            required: ['status'],
            additionalProperties: false,
          },
        },
      },
      messages: [{ role: 'user', content: 'Return a JSON object with exactly one property named status and value ok.' }],
    },
  }),
  tool: (baseUrl, apiKey, model) => ({ url: anthropicEndpoint(baseUrl), headers: anthropicHeaders(apiKey), body: { model, max_tokens: 256, tools: [{ name: 'audit_sum', description: 'Adds two integers.', input_schema: { type: 'object', properties: { a: { type: 'integer' }, b: { type: 'integer' } }, required: ['a', 'b'], additionalProperties: false } }], tool_choice: { type: 'tool', name: 'audit_sum' }, messages: [{ role: 'user', content: 'Call audit_sum with a=19 and b=23. Do not answer in prose.' }] } }),
  reasoning: (baseUrl, apiKey, model) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: {
      model,
      // Anthropic counts thinking and final output against max_tokens. A small
      // cap can make adaptive thinking silently disappear.
      max_tokens: 16_000,
      thinking: { type: 'adaptive', display: 'summarized' },
      output_config: { effort: 'high' },
      messages: [{ role: 'user', content: 'Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.' }],
    },
  }),
  context: (baseUrl, apiKey, model, document) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: {
      model,
      max_tokens: 64,
      messages: [{ role: 'user', content: `Find the exact value after FIXED_CONTEXT_MARKER in this document. Return only that value.\n\n${document}` }],
    },
  }),
  codeRepair: (baseUrl, apiKey, model, instruction, source) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: { model, max_tokens: 512, messages: [{ role: 'user', content: `${instruction}\n\n源码：\n${source}` }] },
  }),
  stream: (baseUrl, apiKey, model) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: { model, max_tokens: 128, messages: [{ role: 'user', content: 'Return exactly: audit-ready.' }], stream: true },
  }),
  state: (baseUrl, apiKey, model, marker) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: { model, max_tokens: 128, messages: [{ role: 'user', content: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }] },
  }),
  stateContinuation: (baseUrl, apiKey, model, result, marker) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: { model, max_tokens: 128, messages: [{ role: 'user', content: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }, { role: 'assistant', content: result.response.data?.content }, { role: 'user', content: `What was the exact state marker? Return only ${marker}.` }] },
  }),
  cache: (baseUrl, apiKey, model, prefix) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: { model, max_tokens: 128, messages: [{ role: 'user', content: [{ type: 'text', text: prefix, cache_control: { type: 'ephemeral' } }, { type: 'text', text: 'Return exactly: cache-ready.' }] }] },
  }),
  toolContinuation: (baseUrl, apiKey, model, result, toolOutput) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
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
  signatureContinuation: (baseUrl, apiKey, model, thinkingText, signature, assistantText) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: {
      model,
      max_tokens: 256,
      messages: [
        { role: 'user', content: 'Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.' },
        {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: thinkingText, signature },
            { type: 'text', text: assistantText || 'The greatest common divisor is 1.' },
          ],
        },
        { role: 'user', content: 'Now return only the final gcd.' },
      ],
    },
  }),
  parse: parseMessages,
};

const openRouter: ProviderAdapter = {
  provider: 'openrouter', surface: 'chat_completions',
  basic: (baseUrl, apiKey, model) => ({
    url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model, messages: [{ role: 'user', content: 'Return exactly: audit-ready.' }], max_tokens: 128,
    },
  }),
  stream: (baseUrl, apiKey, model) => ({
    url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model, messages: [{ role: 'user', content: 'Return exactly: audit-ready.' }], max_tokens: 128, stream: true,
    },
  }),
  strictJson: (baseUrl, apiKey, model) => ({
    url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model,
      max_tokens: 256,
      messages: [{ role: 'user', content: 'Return a JSON object with exactly one property named status and value ok.' }],
      response_format: { type: 'json_schema', json_schema: { name: 'audit_status', strict: true, schema: { type: 'object', properties: { status: { type: 'string', enum: ['ok'] } }, required: ['status'], additionalProperties: false } } },
    },
  }),
  tool: (baseUrl, apiKey, model) => ({
    url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model,
      max_tokens: 256,
      messages: [{ role: 'user', content: 'Call audit_sum with a=19 and b=23. Do not answer in prose.' }],
      tools: [{ type: 'function', function: { name: 'audit_sum', description: 'Adds two integers.', parameters: { type: 'object', properties: { a: { type: 'integer' }, b: { type: 'integer' } }, required: ['a', 'b'], additionalProperties: false } } }],
      tool_choice: 'required',
    },
  }),
  reasoning: (baseUrl, apiKey, model) => ({
    url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model,
      max_tokens: 256,
      messages: [{ role: 'user', content: 'Solve this multi-step arithmetic constraint and return only the final integer: ((19 * 23) + (17 * 11)) - 29.' }],
      include_reasoning: true,
      reasoning: { effort: 'high' },
    },
  }),
  context: (baseUrl, apiKey, model, document) => ({
    url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model, messages: [{ role: 'user', content: `Find the exact value after FIXED_CONTEXT_MARKER in this document. Return only that value.\n\n${document}` }], max_tokens: 64,
    },
  }),
  codeRepair: (baseUrl, apiKey, model, instruction, source) => ({
    url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model, messages: [{ role: 'user', content: `${instruction}\n\n源码：\n${source}` }], max_tokens: 512,
    },
  }),
  state: (baseUrl, apiKey, model, marker) => ({
    url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model, messages: [{ role: 'user', content: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }], max_tokens: 128,
    },
  }),
  stateContinuation: (baseUrl, apiKey, model, result, marker) => {
    const choices = Array.isArray(result.response.data?.choices) ? result.response.data.choices as Record<string, unknown>[] : [];
    const assistant = choices[0]?.message || { role: 'assistant', content: result.text };
    return {
      url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
        model,
        messages: [
          { role: 'user', content: `Remember this exact state marker: ${marker}. Reply with acknowledged.` },
          assistant,
          { role: 'user', content: `What was the exact state marker? Return only ${marker}.` },
        ],
        max_tokens: 128,
      },
    };
  },
  cache: (baseUrl, apiKey, model, prefix) => ({
    url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
      model,
      messages: [
        { role: 'user', content: [{ type: 'text', text: prefix, cache_control: { type: 'ephemeral' } }, { type: 'text', text: 'Return exactly: cache-ready.' }] },
      ],
      max_tokens: 128,
    },
  }),
  toolContinuation: (baseUrl, apiKey, model, result, toolOutput) => {
    const choices = Array.isArray(result.response.data?.choices) ? result.response.data.choices as Record<string, unknown>[] : [];
    const assistant = choices[0]?.message;
    return {
      url: chatCompletionsEndpoint(baseUrl), headers: { Authorization: `Bearer ${apiKey}` }, body: {
        model,
        max_tokens: 256,
        messages: [
          { role: 'user', content: 'Call audit_sum with a=19 and b=23. Do not answer in prose.' },
          assistant,
          { role: 'tool', tool_call_id: result.toolCall?.id, content: toolOutput },
        ],
      },
    };
  },
  parse: parseChatCompletions,
};

const geminiHeaders = (apiKey: string): Record<string, string> => {
  if (apiKey.startsWith('ya29.') || apiKey.startsWith('eyJ') || apiKey.length > 100) {
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  }
  return { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' };
};

const gemini: ProviderAdapter = {
  provider: 'gemini', surface: 'interactions',
  basic: (baseUrl, apiKey, model) => ({ url: geminiGenerateContentEndpoint(baseUrl, model), headers: geminiHeaders(apiKey), body: { contents: [{ role: 'user', parts: [{ text: 'Return exactly: audit-ready.' }] }] } }),
  strictJson: (baseUrl, apiKey, model) => ({
    url: geminiGenerateContentEndpoint(baseUrl, model),
    headers: geminiHeaders(apiKey),
    body: {
      contents: [{ role: 'user', parts: [{ text: 'Return a JSON object with exactly one property named status and value ok.' }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: { type: 'OBJECT', properties: { status: { type: 'STRING', enum: ['ok'] } }, required: ['status'] },
      },
    },
  }),
  tool: (baseUrl, apiKey, model) => ({
    url: geminiGenerateContentEndpoint(baseUrl, model),
    headers: geminiHeaders(apiKey),
    body: {
      contents: [{ role: 'user', parts: [{ text: 'Call audit_sum with a=19 and b=23. Do not answer in prose.' }] }],
      tools: [{ functionDeclarations: [{ name: 'audit_sum', description: 'Adds two integers.', parameters: { type: 'OBJECT', properties: { a: { type: 'INTEGER' }, b: { type: 'INTEGER' } }, required: ['a', 'b'] } }] }],
      toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['audit_sum'] } },
    },
  }),
  reasoning: (baseUrl, apiKey, model) => ({ url: geminiGenerateContentEndpoint(baseUrl, model), headers: geminiHeaders(apiKey), body: { contents: [{ role: 'user', parts: [{ text: 'Solve this multi-step arithmetic constraint and return only the final integer: ((19 * 23) + (17 * 11)) - 29.' }] }], generationConfig: { thinkingConfig: { thinkingLevel: 'HIGH' } } } }),
  context: (baseUrl, apiKey, model, document) => ({
    url: geminiGenerateContentEndpoint(baseUrl, model),
    headers: geminiHeaders(apiKey),
    body: {
      contents: [{ role: 'user', parts: [{ text: `Find the exact value after FIXED_CONTEXT_MARKER in this document. Return only that value.\n\n${document}` }] }],
      generationConfig: { maxOutputTokens: 64 },
    },
  }),
  codeRepair: (baseUrl, apiKey, model, instruction, source) => ({
    url: geminiGenerateContentEndpoint(baseUrl, model),
    headers: geminiHeaders(apiKey),
    body: { contents: [{ role: 'user', parts: [{ text: `${instruction}\n\n源码：\n${source}` }] }], generationConfig: { maxOutputTokens: 512 } },
  }),
  state: (baseUrl, apiKey, model, marker) => ({
    url: geminiGenerateContentEndpoint(baseUrl, model),
    headers: geminiHeaders(apiKey),
    body: {
      contents: [{ role: 'user', parts: [{ text: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }] }],
      generationConfig: { maxOutputTokens: 128 },
    },
  }),
  stateContinuation: (baseUrl, apiKey, model, result, marker) => {
    const candidates = Array.isArray(result.response.data?.candidates) ? (result.response.data.candidates as Array<Record<string, unknown>>) : [];
    const firstCandidate = candidates[0];
    const content = typeof firstCandidate === 'object' && firstCandidate !== null ? (firstCandidate.content as Record<string, unknown> | undefined) : undefined;
    const parts = Array.isArray(content?.parts) ? (content?.parts as unknown[]) : [];
    const modelPart = parts[0] || { text: result.text || 'acknowledged' };
    return {
      url: geminiGenerateContentEndpoint(baseUrl, model),
      headers: geminiHeaders(apiKey),
      body: {
        contents: [
          { role: 'user', parts: [{ text: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }] },
          { role: 'model', parts: [modelPart] },
          { role: 'user', parts: [{ text: `What was the exact state marker? Return only ${marker}.` }] },
        ],
        generationConfig: { maxOutputTokens: 128 },
      },
    };
  },
  toolContinuation: (baseUrl, apiKey, model, result, toolOutput) => {
    const candidates = Array.isArray(result.response.data?.candidates) ? (result.response.data.candidates as Array<Record<string, unknown>>) : [];
    const firstCandidate = candidates[0];
    const content = typeof firstCandidate === 'object' && firstCandidate !== null ? (firstCandidate.content as Record<string, unknown> | undefined) : undefined;
    const parts = Array.isArray(content?.parts) ? (content?.parts as unknown[]) : [];
    const modelPart = parts[0] || {
      functionCall: { name: result.toolCall?.name || 'audit_sum', args: (result.toolCall?.arguments as Record<string, unknown>) || { a: 19, b: 23 } },
    };
    return {
      url: geminiGenerateContentEndpoint(baseUrl, model),
      headers: geminiHeaders(apiKey),
      body: {
        contents: [
          { role: 'user', parts: [{ text: 'Call audit_sum with a=19 and b=23. Do not answer in prose.' }] },
          { role: 'model', parts: [modelPart] },
          { role: 'user', parts: [{ functionResponse: { name: result.toolCall?.name || 'audit_sum', response: { result: Number(toolOutput) || 42 } } }] },
        ],
      },
    };
  },
  parse: parseGeminiGenerateContent,
};

export const PROVIDER_ADAPTERS: Record<AuditProvider, ProviderAdapter> = {
  openai: openAiLike('openai'), xai: openAiLike('xai'), anthropic, gemini, openrouter: openRouter,
};

export function detectAuditProvider(model: string, requested?: AuditProvider | 'auto'): AuditProvider {
  if (requested && requested !== 'auto') return requested;
  const id = model.toLowerCase();
  if (id.includes('claude') || id.includes('fable') || id.includes('opus') || id.includes('sonnet') || id.includes('haiku')) {
    return 'anthropic';
  }
  if (id.includes('gemini')) return 'gemini';
  if (id.includes('grok')) return 'xai';
  if (id.includes('gpt') || id.includes('o1') || id.includes('o3') || id.includes('o4') || id.includes('chatgpt')) {
    return 'openai';
  }
  return 'openrouter';
}

export async function sendNative(request: NativeRequest): Promise<NativeResult> {
  const response = await silentFetch<Record<string, unknown>>({ url: request.url, headers: request.headers, body: request.body, timeoutMs: 12_000 });
  const adapter = request.url.includes('/messages') ? anthropic : request.url.includes('/interactions') || request.url.includes(':generateContent') ? gemini : request.url.includes('/chat/completions') ? openRouter : request.url.includes('x.ai') ? PROVIDER_ADAPTERS.xai : PROVIDER_ADAPTERS.openai;
  return adapter.parse(response);
}

export const resultStatus = (result: NativeResult, predicate: boolean, unavailable = false): EvidenceStatus => unavailable ? 'unavailable' : result.response.ok && predicate ? 'pass' : 'fail';

export const evidence = (id: string, title: string, result: NativeResult, status: EvidenceStatus, detail: string): ProtocolEvidence => ({ id, title, status, detail, latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
