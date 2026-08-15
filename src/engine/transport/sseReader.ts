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

export async function* readSSEStream(
  response: Response,
  signal?: AbortSignal
): AsyncGenerator<SSEChunkEvent, void, unknown> {
  if (!response.body) {
    throw new Error('Response body is null, cannot stream');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) {
          continue; // Ping / comment line
        }

        if (trimmed === 'data: [DONE]' || trimmed === 'event: message_stop') {
          return;
        }

        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const data = JSON.parse(jsonStr);
            const event = parseSSEData(data);
            if (event) {
              yield event;
            }
          } catch {
            // Ignore non-JSON chunks or incomplete lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
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
