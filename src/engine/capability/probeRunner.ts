/**
 * Advanced Capabilities Matrix Probe Engine
 * Tests SSE Stream, Function/Tool Calling, Vision Base64, and JSON Mode Structured Outputs.
 */

import { CapabilityMatrixResult, CapabilityItemResult } from '../../types/capability';
import { silentFetch } from '../transport/silentTransport';
import { readSSEStream } from '../transport/sseReader';
import { buildChatCompletionsUrl } from '../transport/urlNormalizer';

export async function runCapabilityProbes(
  baseUrl: string,
  apiKey: string,
  model: string,
  onProgress?: (probeName: string, status: 'testing' | 'done') => void,
  signal?: AbortSignal
): Promise<CapabilityMatrixResult> {
  const chatUrl = buildChatCompletionsUrl(baseUrl);

  // 1. Stream Probe
  onProgress?.('SSE Stream 流式传输', 'testing');
  const streamResult = await probeStream(chatUrl, apiKey, model, signal);

  // 2. Tools (Function Calling) Probe
  onProgress?.('Tools / Function Calling (函数调用)', 'testing');
  const toolsResult = await probeTools(chatUrl, apiKey, model, signal);

  // 3. Vision Probe (1x1 Base64 PNG)
  onProgress?.('Vision (多模态图片理解)', 'testing');
  const visionResult = await probeVision(chatUrl, apiKey, model, signal);

  // 4. JSON Mode Probe
  onProgress?.('JSON Mode (结构化输出)', 'testing');
  const jsonResult = await probeJsonMode(chatUrl, apiKey, model, signal);

  return {
    model,
    testedAt: Date.now(),
    capabilities: {
      stream: streamResult,
      tools: toolsResult,
      vision: visionResult,
      json: jsonResult,
    },
  };
}

async function probeStream(
  chatUrl: string,
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<CapabilityItemResult> {
  const startTime = performance.now();
  try {
    const res = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say hi in one word' }],
        stream: true,
        max_tokens: 10,
      }),
      signal,
    });

    if (!res.ok) {
      return {
        id: 'stream',
        name: 'SSE 流式传输 (Stream)',
        description: '支持逐字流式输出，打字机体验必备。',
        status: 'unsupported',
        latencyMs: Math.round(performance.now() - startTime),
        details: `返回 HTTP ${res.status}，无法建立 SSE 流。`,
      };
    }

    let chunksCount = 0;
    for await (const _ of readSSEStream(res, signal)) {
      chunksCount++;
      if (chunksCount >= 2) break;
    }

    const latencyMs = Math.round(performance.now() - startTime);
    return {
      id: 'stream',
      name: 'SSE 流式传输 (Stream)',
      description: '支持逐字流式输出，打字机体验必备。',
      status: chunksCount > 0 ? 'supported' : 'unsupported',
      latencyMs,
      details: chunksCount > 0 ? `成功建立 SSE 流连接并正常接收数据块 (${latencyMs}ms)。` : '未能收到有效流式数据块。',
    };
  } catch (err: unknown) {
    return {
      id: 'stream',
      name: 'SSE 流式传输 (Stream)',
      description: '支持逐字流式输出，打字机体验必备。',
      status: 'error',
      details: `测试流式异常: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function probeTools(
  chatUrl: string,
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<CapabilityItemResult> {
  const res = await silentFetch<any>({
    url: chatUrl,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model,
      messages: [{ role: 'user', content: 'What is the weather in Tokyo right now?' }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_current_weather',
            description: 'Get the current weather for a given city',
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string', description: 'The city name' },
              },
              required: ['location'],
            },
          },
        },
      ],
      tool_choice: 'auto',
      max_tokens: 150,
    },
    timeoutMs: 8000,
    signal,
  });

  const toolCalls = res.data?.choices?.[0]?.message?.tool_calls;
  const isSupported = Array.isArray(toolCalls) && toolCalls.length > 0 && toolCalls[0]?.function?.name === 'get_current_weather';

  return {
    id: 'tools',
    name: 'Tool / Function Calling (工具调用)',
    description: '支持 Cline、Cursor、Claude Code 等 Agent 执行函数与调用外部工具。',
    status: isSupported ? 'supported' : 'unsupported',
    latencyMs: res.latencyMs,
    details: isSupported 
      ? `成功触发结构化工具调用 \`${toolCalls[0]?.function?.name}\`，网关未损坏 tools 参数。`
      : `未触发标准 tool_calls (${res.errorMessage || '网关可能过滤或不支持 tools 参数'})。`,
    rawResponseSnippet: JSON.stringify(res.data?.choices?.[0]?.message || {}).slice(0, 150),
  };
}

async function probeVision(
  chatUrl: string,
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<CapabilityItemResult> {
  const redDotBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const res = await silentFetch<any>({
    url: chatUrl,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is in this tiny image? Reply with one word.' },
            { type: 'image_url', image_url: { url: redDotBase64 } },
          ],
        },
      ],
      max_tokens: 50,
    },
    timeoutMs: 8000,
    signal,
  });

  const content = res.data?.choices?.[0]?.message?.content;
  const isSupported = res.ok && !!content;

  return {
    id: 'vision',
    name: 'Vision (多模态视觉)',
    description: '支持 Base64 / URL 图片理解与 OCR。',
    status: isSupported ? 'supported' : 'unsupported',
    latencyMs: res.latencyMs,
    details: isSupported 
      ? `成功解析多模态 Base64 图片输入并返回回答 (${res.latencyMs}ms)。`
      : `未能解析图片输入 (${res.errorMessage || '该模型或中转渠道不支持图片输入'})。`,
  };
}

async function probeJsonMode(
  chatUrl: string,
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<CapabilityItemResult> {
  const res = await silentFetch<any>({
    url: chatUrl,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model,
      messages: [
        { role: 'system', content: 'You must reply in JSON only.' },
        { role: 'user', content: 'Output a JSON object with key "status" and value "ok".' },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 50,
    },
    timeoutMs: 6000,
    signal,
  });

  let isValidJson = false;
  try {
    const rawContent = res.data?.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(rawContent);
    isValidJson = parsed && typeof parsed === 'object';
  } catch {
    isValidJson = false;
  }

  return {
    id: 'json',
    name: 'JSON Mode (结构化输出)',
    description: '支持 response_format: { type: "json_object" } 强制结构化输出。',
    status: isValidJson ? 'supported' : 'unsupported',
    latencyMs: res.latencyMs,
    details: isValidJson 
      ? `成功返回符合 JSON 模式的结构化数据 (${res.latencyMs}ms)。`
      : `无法按 JSON Mode 输出 (${res.errorMessage || '网关可能未适配 response_format'})。`,
  };
}
