/**
 * Veridrop-inspired Claude Thinking Signature Cryptographic Verifier
 * Verifies whether the endpoint is a genuine Anthropic Claude model by testing
 * Anthropic's private-key generated thinking signature and multi-turn re-verification.
 */

import { SignatureVerificationResult } from '../../types/fidelity';
import { silentFetch } from '../transport/silentTransport';
import { readSSEStream } from '../transport/sseReader';
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
        max_tokens: 1024,
        thinking: {
          type: 'enabled',
          budget_tokens: 512,
        },
        stream: true,
        messages: [
          { role: 'user', content: 'What is 19 * 23? Think step by step.' }
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

    // Step 2: Stream and extract signature
    let thinkingText = '';
    let signature = '';

    for await (const chunk of readSSEStream(fetchResponse, signal)) {
      if (chunk.reasoningDelta) {
        thinkingText += chunk.reasoningDelta;
      }
      if (chunk.signatureDelta) {
        signature += chunk.signatureDelta;
      }
      if (chunk.fullSignature) {
        signature = chunk.fullSignature;
      }
    }

    if (!signature) {
      return {
        isApplicable: true,
        passed: false,
        stage: 'extract',
        details: '模型产生了文本但未返回 Anthropic 服务端加密 Signature（可能为逆向/剥离签名的渠道）。',
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
          { role: 'user', content: 'What is 19 * 23? Think step by step.' },
          {
            role: 'assistant',
            content: [
              {
                type: 'thinking',
                thinking: thinkingText || 'Calculating 19 * 23 = 437.',
                signature: signature,
              },
              {
                type: 'text',
                text: '19 * 23 = 437.',
              },
            ],
          },
          { role: 'user', content: 'Now add 10 to that result.' },
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
