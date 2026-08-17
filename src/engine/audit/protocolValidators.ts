export interface ProtocolValidation {
  pass: boolean;
  score: number;
  issues: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isNonNegativeInteger = (value: unknown): boolean => typeof value === 'number' && Number.isInteger(value) && value >= 0;

export function validateResponsesEnvelope(data: unknown, requestedModel: string): ProtocolValidation {
  const issues: string[] = [];
  if (!isRecord(data)) return { pass: false, score: 0, issues: ['response_not_object'] };
  if (typeof data.id !== 'string' || !data.id.startsWith('resp_')) issues.push('id_prefix_invalid');
  if (typeof data.object !== 'string' || data.object !== 'response') issues.push('object_invalid');
  if (typeof data.model !== 'string' || !modelMatches(data.model, requestedModel)) issues.push('model_mismatch');
  if (!Array.isArray(data.output)) issues.push('output_not_array');
  if (data.status !== undefined && !['completed', 'incomplete', 'failed'].includes(String(data.status))) issues.push('status_invalid');
  return scoreValidation(issues, 5);
}

export function validateChatCompletionEnvelope(data: unknown, requestedModel: string, strictId = true): ProtocolValidation {
  const issues: string[] = [];
  if (!isRecord(data)) return { pass: false, score: 0, issues: ['response_not_object'] };
  if (typeof data.id !== 'string' || (strictId && !data.id.startsWith('chatcmpl-'))) issues.push('id_prefix_invalid');
  if (data.object !== 'chat.completion') issues.push('object_invalid');
  if (typeof data.model !== 'string' || !modelMatches(data.model, requestedModel)) issues.push('model_mismatch');
  if (!Array.isArray(data.choices) || data.choices.length === 0) {
    issues.push('choices_invalid');
  } else {
    const firstChoice = data.choices[0];
    if (!isRecord(firstChoice)) issues.push('choice_not_object');
    else {
      if (!['stop', 'length', 'tool_calls', 'content_filter', 'function_call', null].includes(firstChoice.finish_reason as string | null)) issues.push('finish_reason_invalid');
      const message = firstChoice.message;
      if (!isRecord(message) || message.role !== 'assistant') issues.push('assistant_message_invalid');
    }
  }
  const usage = data.usage;
  if (!isRecord(usage)) {
    issues.push('usage_missing');
  } else {
    for (const field of ['prompt_tokens', 'completion_tokens', 'total_tokens']) {
      if (!isNonNegativeInteger(usage[field])) issues.push(`usage_${field}_invalid`);
    }
  }
  return scoreValidation(issues, 7);
}

export function validateAnthropicMessage(data: unknown, requestedModel: string): ProtocolValidation {
  const issues: string[] = [];
  if (!isRecord(data)) return { pass: false, score: 0, issues: ['response_not_object'] };
  if (typeof data.id !== 'string' || !data.id.startsWith('msg_')) issues.push('id_prefix_invalid');
  if (data.type !== 'message') issues.push('type_invalid');
  if (data.role !== 'assistant') issues.push('role_invalid');
  if (typeof data.model !== 'string' || !modelMatches(data.model, requestedModel)) issues.push('model_mismatch');
  if (!Array.isArray(data.content)) issues.push('content_not_array');
  if (!['end_turn', 'max_tokens', 'stop_sequence', 'tool_use', null].includes(data.stop_reason as string | null)) issues.push('stop_reason_invalid');
  const usage = data.usage;
  if (!isRecord(usage)) {
    issues.push('usage_missing');
  } else {
    for (const field of ['input_tokens', 'output_tokens']) {
      if (!isNonNegativeInteger(usage[field])) issues.push(`usage_${field}_invalid`);
    }
  }
  return scoreValidation(issues, 7);
}

function modelMatches(actual: string, requested: string): boolean {
  return actual === requested || actual.includes(requested) || requested.includes(actual);
}

function scoreValidation(issues: string[], checks: number): ProtocolValidation {
  const score = Math.max(0, Math.round(((checks - issues.length) / checks) * 100));
  return { pass: issues.length === 0, score, issues };
}
