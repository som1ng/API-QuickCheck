/**
 * DeepSeek-R1 / OpenAI o1 Reasoning Stream Protocol Verifier
 * Verifies native reasoning_content delta streaming vs faked <think> text tags.
 */

import { ReasoningVerificationResult } from '../../types/fidelity';
import { readSSEStream } from '../transport/sseReader';
import { buildChatCompletionsUrl } from '../transport/urlNormalizer';

export async function verifyReasoningStream(
  baseUrl: string,
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<ReasoningVerificationResult> {
  const url = buildChatCompletionsUrl(baseUrl);
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: 'Which is larger: 3.14159 or 3.1416? Explain briefly in two sentences.' }
        ],
        stream: true,
        max_tokens: 512,
      }),
      signal,
    });

    if (!response.ok) {
      return {
        hasReasoningStream: false,
        thinkingTimeMs: 0,
        passed: false,
        details: `请求模型返回 HTTP ${response.status}`,
      };
    }

    let reasoningText = '';
    let contentText = '';
    let firstReasoningTime = 0;
    let firstContentTime = 0;
    let reasoningField: 'reasoning_content' | 'reasoning' | 'text_think_tag' | undefined = undefined;

    for await (const chunk of readSSEStream(response, signal)) {
      if (chunk.reasoningDelta) {
        if (!firstReasoningTime) {
          firstReasoningTime = performance.now();
          reasoningField = chunk.rawJson && typeof chunk.rawJson === 'object' && 'reasoning_content' in ((chunk.rawJson as any)?.choices?.[0]?.delta || {})
            ? 'reasoning_content'
            : 'reasoning';
        }
        reasoningText += chunk.reasoningDelta;
      }

      if (chunk.textDelta) {
        if (!firstContentTime) {
          firstContentTime = performance.now();
        }
        contentText += chunk.textDelta;
      }
    }

    const totalThinkingMs = firstContentTime > firstReasoningTime 
      ? Math.round(firstContentTime - firstReasoningTime)
      : Math.round(firstContentTime - startTime);

    // Case 1: Native reasoning_content / reasoning stream captured
    if (reasoningText.length > 0) {
      return {
        hasReasoningStream: true,
        reasoningFieldUsed: reasoningField,
        thinkingTimeMs: totalThinkingMs,
        passed: true,
        details: `捕获原生 \`${reasoningField}\` 协议思维流（思考耗时 ~${totalThinkingMs}ms，产出 ${reasoningText.length} 字符思考链）。`,
      };
    }

    // Case 2: Fake <think> tags injected in normal content
    if (contentText.includes('<think>') && contentText.includes('</think>')) {
      return {
        hasReasoningStream: false,
        reasoningFieldUsed: 'text_think_tag',
        thinkingTimeMs: 0,
        passed: false,
        details: '响应中缺少原生 reasoning_content 字段，仅在正文中拼接了 <think> 标签（疑似伪造思维链的中转站）。',
      };
    }

    // Case 3: Standard non-thinking model or thinking stripped
    const isSupposedToHaveThinking = /r1|reasoner|o1|o3|thinking/i.test(model);
    return {
      hasReasoningStream: false,
      thinkingTimeMs: 0,
      passed: !isSupposedToHaveThinking,
      details: isSupposedToHaveThinking
        ? '目标模型为推理模型，但未捕获到思维链数据（可能已被中转站剥离或降级为普通模型）。'
        : '标准模型，正常返回正文流。',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      hasReasoningStream: false,
      thinkingTimeMs: 0,
      passed: false,
      details: `思维链协议测试异常: ${msg}`,
    };
  }
}
