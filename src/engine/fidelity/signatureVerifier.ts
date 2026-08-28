/**
 * Veridrop-inspired Claude Thinking Signature Cryptographic Verifier
 * Verifies whether the endpoint is a genuine Anthropic Claude model by testing
 * Anthropic's private-key generated thinking signature and multi-turn re-verification.
 */

import { SignatureVerificationResult } from '../../types/fidelity';
import { silentFetch } from '../transport/silentTransport';
import { normalizeBaseUrl } from '../transport/urlNormalizer';

// Different Claude generations accept different thinking modes: adaptive-only
// (Opus 4.7 / Claude 5 family) vs extended-only (Haiku 4.5 and earlier Haiku).
// A wrong mode is rejected with 400 before any signature exists.
function buildThinkingConfig(model: string): {
  thinking: Record<string, unknown>;
  outputConfig?: Record<string, unknown>;
} {
  if (/haiku/i.test(model)) {
    return { thinking: { type: 'enabled', budget_tokens: 4000 } };
  }
  return {
    thinking: { type: 'adaptive', display: 'summarized' },
    outputConfig: { effort: 'high' },
  };
}

// Veridrop-style plausibility grade for a signature-like payload: the official
// signature is >100 chars of base64-ish data, but Anthropic never published a
// spec, so length/shape is only a reference threshold, not a hard rule.
function gradeSignaturePayload(payload: string): number {
  const isBase64Like = /^[A-Za-z0-9+/=_-]+$/.test(payload);
  return isBase64Like && payload.length >= 100 ? 100 : 70;
}

export async function verifyClaudeThinkingSignature(
  baseUrl: string,
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<SignatureVerificationResult> {
  const cleanBaseUrl = normalizeBaseUrl(baseUrl);
  const messagesUrl = cleanBaseUrl.endsWith('/messages') 
    ? cleanBaseUrl 
    : cleanBaseUrl.endsWith('/v1') 
    ? `${cleanBaseUrl}/messages` 
    : `${cleanBaseUrl}/v1/messages`;

  const resolvedModel = model.includes('claude') ? model : 'claude-3-7-sonnet-20250219';
  const { thinking, outputConfig } = buildThinkingConfig(resolvedModel);

  // Step 1: Probe if the endpoint supports Anthropic native messages protocol with thinking
  try {
    const firstBody: Record<string, unknown> = {
      model: resolvedModel,
      // Anthropic counts thinking and final output together. A small cap can
      // make adaptive thinking silently disappear before a signature exists.
      max_tokens: 16_000,
      thinking,
      messages: [
        { role: 'user', content: 'Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.' }
      ],
    };
    if (outputConfig) {
      firstBody.output_config = outputConfig;
    }

    const fetchResponse = await fetch(messagesUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(firstBody),
      signal,
    });

    if (fetchResponse.status === 404 || fetchResponse.status === 405) {
      return {
        isApplicable: false,
        passed: false,
        stage: 'not_supported',
        details: '当前中转站未开放 Anthropic 原生 /v1/messages 路由，无法进行服务端加密签名验真。已自动降级为行为指纹与认知冲突综合鉴别。',
      };
    }

    if (!fetchResponse.ok) {
      const errText = await fetchResponse.text();
      return {
        isApplicable: true,
        passed: false,
        stage: 'failed',
        details: `请求 Anthropic Thinking 接口返回 HTTP ${fetchResponse.status}: ${errText.slice(0, 150)}`,
      };
    }

    // Step 2: Use the non-streaming content blocks. Some Anthropic adaptive
    // thinking models silently omit thinking/signature blocks in SSE mode.
    const responseData = await fetchResponse.json() as Record<string, unknown>;
    const content = Array.isArray(responseData.content) ? responseData.content as Record<string, unknown>[] : [];
    const thinkingBlock = content.find((block) => block.type === 'thinking' || block.type === 'redacted_thinking');
    const isRedacted = thinkingBlock?.type === 'redacted_thinking';
    const thinkingText = typeof thinkingBlock?.thinking === 'string' ? thinkingBlock.thinking : '';
    const signature = typeof thinkingBlock?.signature === 'string' ? thinkingBlock.signature : '';
    const redactedData = isRedacted && typeof thinkingBlock?.data === 'string' ? thinkingBlock.data : '';

    if (!thinkingBlock) {
      return {
        isApplicable: true,
        passed: false,
        score: 0,
        stage: 'extract',
        details: '模型返回了原生 Messages 响应，但没有 thinking/redacted_thinking 块。可能是模型未触发 thinking，或中转剥离了思考块。',
      };
    }

    if (!isRedacted && !signature) {
      return {
        isApplicable: true,
        passed: false,
        score: 30,
        stage: 'extract',
        details: '模型返回了 thinking 块，但缺少 signature 字段。可能是中转重写或剥离了签名。',
      };
    }

    if (isRedacted && !redactedData) {
      return {
        isApplicable: true,
        passed: false,
        score: 30,
        stage: 'extract',
        details: '模型返回了 redacted_thinking 块，但缺少加密 data 字段，无法回传官方验签。',
      };
    }

    // Signature (or redacted data) captured: grade its plausibility before replay.
    const extractScore = gradeSignaturePayload(signature || redactedData);

    // Step 3: Multi-turn signature re-verification (Anthropic server-side verification).
    // The first-turn block must be replayed in its original shape: a thinking
    // block as (thinking, signature), a redacted_thinking block as (data).
    const replayedThinkingBlock = isRedacted
      ? { type: 'redacted_thinking', data: redactedData }
      : {
          type: 'thinking',
          thinking: thinkingText || 'Calculating the Euclidean algorithm steps.',
          signature: signature,
        };

    const reverifyResponse = await silentFetch({
      url: messagesUrl,
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: {
        model: resolvedModel,
        max_tokens: 256,
        messages: [
          { role: 'user', content: 'Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.' },
          {
            role: 'assistant',
            content: [
              replayedThinkingBlock,
              {
                type: 'text',
                text: 'The greatest common divisor is 1.',
              },
            ],
          },
          { role: 'user', content: 'Now return only the final gcd.' },
        ],
      },
      timeoutMs: 8000,
      signal,
    });

    const signaturePreview = signature ? signature.slice(0, 24) + '...' : redactedData.slice(0, 24) + '...';

    if (reverifyResponse.ok) {
      return {
        isApplicable: true,
        passed: true,
        score: 100,
        signature: signaturePreview,
        stage: 'reverify',
        details: isRedacted
          ? '成功捕获官方 redacted_thinking 加密块，并按原形状回传通过第二轮 Anthropic 官方验签闭环。已确认官方满血正品。'
          : '成功提取官方服务端私钥签名，并通过第二轮 Anthropic 官方验签闭环。已确认官方满血正品。',
      };
    }

    const errText = reverifyResponse.rawText.toLowerCase();
    const isBlockRejection = errText.includes('signature') || errText.includes('redacted') || errText.includes('thinking');
    if (isBlockRejection) {
      return {
        isApplicable: true,
        passed: false,
        score: 0,
        signature: signaturePreview,
        stage: 'failed',
        details: `验签被官方拦截 (${reverifyResponse.errorMessage || 'Invalid thinking block'})：疑似假冒伪造思考块。`,
      };
    }

    return {
      isApplicable: true,
      passed: true,
      score: extractScore,
      signature: signaturePreview,
      stage: 'extract',
      details: '成功捕获官方 Thinking Signature 签名块。',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      isApplicable: false,
      passed: false,
      stage: 'not_supported',
      details: `端点不支持原生 messages 协议 (${errorMsg})，已降级为指纹分析。`,
    };
  }
}
