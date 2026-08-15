/**
 * DeepSeek-R1 / OpenAI o1 Reasoning Stream Protocol Verifier & Speed Telemetry
 * Verifies native reasoning_content delta streaming vs faked <think> text tags,
 * and simultaneously measures First Token Latency (首字耗时) and generation TPS.
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
    let firstTokenTime = 0;
    let firstReasoningTime = 0;
    let firstContentTime = 0;
    let reasoningField: 'reasoning_content' | 'reasoning' | 'text_think_tag' | undefined = undefined;

    for await (const chunk of readSSEStream(response, signal)) {
      const now = performance.now();

      if (!firstTokenTime && (chunk.reasoningDelta || chunk.textDelta)) {
        firstTokenTime = now;
      }

      if (chunk.reasoningDelta) {
        if (!firstReasoningTime) {
          firstReasoningTime = now;
          reasoningField = chunk.rawJson && typeof chunk.rawJson === 'object' && 'reasoning_content' in ((chunk.rawJson as any)?.choices?.[0]?.delta || {})
            ? 'reasoning_content'
            : 'reasoning';
        }
        reasoningText += chunk.reasoningDelta;
      }

      if (chunk.textDelta) {
        if (!firstContentTime) {
          firstContentTime = now;
        }
        contentText += chunk.textDelta;
      }
    }

    const endTime = performance.now();
    const firstTokenLatencyMs = firstTokenTime ? Math.round(firstTokenTime - startTime) : Math.round(endTime - startTime);
    const totalStreamingSec = firstTokenTime ? (endTime - firstTokenTime) / 1000 : 0;
    const totalOutputChars = reasoningText.length + contentText.length;
    const estimatedTokens = Math.max(1, Math.round(totalOutputChars / 3.8));
    const generationTps = totalStreamingSec > 0 ? Math.round((estimatedTokens / totalStreamingSec) * 10) / 10 : 0;

    const totalThinkingMs = firstContentTime > firstReasoningTime 
      ? Math.round(firstContentTime - firstReasoningTime)
      : firstReasoningTime
      ? Math.round(firstTokenLatencyMs)
      : 0;

    // Case 1: Native reasoning_content / reasoning stream captured
    if (reasoningText.length > 0) {
      return {
        hasReasoningStream: true,
        reasoningFieldUsed: reasoningField,
        thinkingTimeMs: totalThinkingMs,
        firstTokenLatencyMs,
        generationTps,
        passed: true,
        details: `捕获原生 \`${reasoningField}\` 协议思维流（首字延迟 ${firstTokenLatencyMs}ms，思考耗时 ~${totalThinkingMs}ms，速率 ~${generationTps} tok/s）。`,
      };
    }

    // Case 2: Fake <think> tags injected in normal content
    if (contentText.includes('<think>') && contentText.includes('</think>')) {
      return {
        hasReasoningStream: false,
        reasoningFieldUsed: 'text_think_tag',
        thinkingTimeMs: 0,
        firstTokenLatencyMs,
        generationTps,
        passed: false,
        details: `缺少原生 reasoning_content 字段，仅在正文中拼接了 <think> 标签（首字延迟 ${firstTokenLatencyMs}ms，疑似假冒思考流）。`,
      };
    }

    // Case 3: Standard non-thinking model or thinking stripped
    const isSupposedToHaveThinking = /r1|reasoner|o1|o3|thinking/i.test(model);
    return {
      hasReasoningStream: false,
      thinkingTimeMs: 0,
      firstTokenLatencyMs,
      generationTps,
      passed: !isSupposedToHaveThinking,
      details: isSupposedToHaveThinking
        ? `目标为推理模型，但未捕获到思考流（首字延迟 ${firstTokenLatencyMs}ms，可能已被中转站剥离或降级为普通模型）。`
        : `标准模型，首字响应 ${firstTokenLatencyMs}ms，流式生成速率 ~${generationTps} tok/s。`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      hasReasoningStream: false,
      thinkingTimeMs: 0,
      passed: false,
      details: `流式协议与首字测试异常: ${msg}`,
    };
  }
}
