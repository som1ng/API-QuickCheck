/**
 * High-Performance SSE (Server-Sent Events) Reader
 * Supports both OpenAI streaming format and Anthropic extended thinking SSE format.
 */

export interface SSEChunkEvent {
  textDelta?: string;
  reasoningDelta?: string;
  signatureDelta?: string;
  fullSignature?: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  systemFingerprint?: string;
  rawJson?: unknown;
}

export interface SSEWireEvent {
  event: string;
  data: unknown;
}

export async function* readSSEEvents(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<SSEWireEvent, void, unknown> {
  if (!response.body) throw new Error('Response body is null, cannot stream');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let eventName = '';
  let dataLines: string[] = [];

  const flush = (): SSEWireEvent | null => {
    if (dataLines.length === 0) {
      eventName = '';
      return null;
    }
    const rawData = dataLines.join('\n');
    dataLines = [];
    const currentEvent = eventName || 'message';
    eventName = '';
    // Drop the OpenAI [DONE] sentinel only. message_stop must still be yielded:
    // the Anthropic stream-order probe requires it in the event sequence.
    if (rawData === '[DONE]') return null;
    try {
      return { event: currentEvent, data: JSON.parse(rawData) };
    } catch {
      return { event: currentEvent, data: rawData };
    }
  };

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line === '') {
          const event = flush();
          if (event) yield event;
          continue;
        }
        if (line.startsWith(':')) continue;
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
      }
    }
    const event = flush();
    if (event) yield event;
  } finally {
    reader.releaseLock();
  }
}

export async function* readSSEStream(
  response: Response,
  signal?: AbortSignal
): AsyncGenerator<SSEChunkEvent, void, unknown> {
  for await (const wireEvent of readSSEEvents(response, signal)) {
    if (typeof wireEvent.data === 'object' && wireEvent.data !== null) {
      const event = parseSSEData(wireEvent.data);
      if (event) yield event;
    }
  }
}

function parseSSEData(data: unknown): SSEChunkEvent | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  // OpenAI format
  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    const choice = obj.choices[0] as Record<string, unknown>;
    const delta = (choice.delta || {}) as Record<string, unknown>;
    const usage = (obj.usage || {}) as Record<string, unknown>;

    return {
      textDelta: typeof delta.content === 'string' ? delta.content : undefined,
      reasoningDelta: typeof delta.reasoning_content === 'string' 
        ? delta.reasoning_content 
        : typeof delta.reasoning === 'string' 
        ? delta.reasoning 
        : undefined,
      finishReason: typeof choice.finish_reason === 'string' ? choice.finish_reason : undefined,
      promptTokens: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : undefined,
      completionTokens: typeof usage.completion_tokens === 'number' ? usage.completion_tokens : undefined,
      systemFingerprint: typeof obj.system_fingerprint === 'string' ? obj.system_fingerprint : undefined,
      rawJson: obj,
    };
  }

  // Anthropic format
  if (obj.type === 'content_block_delta') {
    const delta = (obj.delta || {}) as Record<string, unknown>;
    if (delta.type === 'text_delta') {
      return { textDelta: typeof delta.text === 'string' ? delta.text : undefined };
    }
    if (delta.type === 'thinking_delta') {
      return { reasoningDelta: typeof delta.thinking === 'string' ? delta.thinking : undefined };
    }
    if (delta.type === 'signature_delta') {
      return { signatureDelta: typeof delta.signature === 'string' ? delta.signature : undefined };
    }
  }

  if (obj.type === 'content_block_start') {
    const block = (obj.content_block || {}) as Record<string, unknown>;
    if (block.type === 'thinking' && typeof block.signature === 'string') {
      return { fullSignature: block.signature };
    }
  }

  if (obj.type === 'message_delta') {
    const usage = (obj.usage || {}) as Record<string, unknown>;
    return {
      completionTokens: typeof usage.output_tokens === 'number' ? usage.output_tokens : undefined,
    };
  }

  return null;
}
