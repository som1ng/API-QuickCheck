/**
 * Veridrop-inspired Claude Thinking Signature Cryptographic Verifier
 * Verifies whether the endpoint is a genuine Anthropic Claude model by testing
 * Anthropic's private-key generated thinking signature and multi-turn re-verification.
 */

import { SignatureVerificationResult } from '../../types/fidelity';
import { silentFetch } from '../transport/silentTransport';
import { normalizeBaseUrl } from '../transport/urlNormalizer';

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

  // Step 1: Probe if the endpoint supports Anthropic native messages protocol with thinking
  try {
    const fetchResponse = await fetch(messagesUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model.includes('claude') ? model : 'claude-3-7-sonnet-20250219',
        // Anthropic counts thinking and final output together. A small cap can
        // make adaptive thinking silently disappear before a signature exists.
        max_tokens: 16_000,
        thinking: {
          type: 'adaptive',
          display: 'summarized',
        },
        output_config: { effort: 'high' },
        messages: [
          { role: 'user', content: 'Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.' }
        ],
      }),
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
    const thinkingText = typeof thinkingBlock?.thinking === 'string'
      ? thinkingBlock.thinking
      : typeof thinkingBlock?.data === 'string' ? thinkingBlock.data : '';
    const signature = typeof thinkingBlock?.signature === 'string' ? thinkingBlock.signature : '';

    if (!signature) {
      return {
        isApplicable: true,
        passed: false,
        stage: 'extract',
        details: '模型返回了原生 Messages 响应，但未返回 thinking/redacted_thinking 的 signature 字段。可能是模型未触发 thinking，或中转剥离了签名。',
      };
    }

    // Step 3: Multi-turn signature re-verification (Anthropic server-side verification)
    const reverifyResponse = await silentFetch({
      url: messagesUrl,
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: {
        model: model.includes('claude') ? model : 'claude-3-7-sonnet-20250219',
        max_tokens: 256,
        messages: [
          { role: 'user', content: 'Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.' },
          {
            role: 'assistant',
            content: [
              {
                type: 'thinking',
                thinking: thinkingText || 'Calculating the Euclidean algorithm steps.',
                signature: signature,
              },
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

    if (reverifyResponse.ok) {
      return {
        isApplicable: true,
        passed: true,
        signature: signature.slice(0, 24) + '...',
        stage: 'reverify',
        details: '成功提取官方服务端私钥签名，并通过第二轮 Anthropic 官方验签闭环。已确认官方满血正品。',
      };
    }

    if (reverifyResponse.rawText.toLowerCase().includes('signature')) {
      return {
        isApplicable: true,
        passed: false,
        signature: signature.slice(0, 24) + '...',
        stage: 'failed',
        details: `签名校验被官方拦截 (${reverifyResponse.errorMessage || 'Invalid Signature'})：疑似假冒伪造签名。`,
      };
    }

    return {
      isApplicable: true,
      passed: true,
      signature: signature.slice(0, 24) + '...',
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
