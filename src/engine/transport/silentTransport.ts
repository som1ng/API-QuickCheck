/**
 * Silent Network Transport Layer
 * Direct fetch with automatic silent fallback to local/edge proxy upon CORS, WAF, or 404/403 Origin blocks.
 */

export interface TransportRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  disableFallback?: boolean;
}

export interface TransportResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T | null;
  rawText: string;
  latencyMs: number;
  headers: Headers;
  errorCategory?: 'quota' | 'unauthorized' | 'rate_limit' | 'not_found' | 'server_error' | 'timeout' | 'network_cors' | 'other';
  errorMessage?: string;
}

export async function silentFetch<T = unknown>(
  options: TransportRequestOptions
): Promise<TransportResponse<T>> {
  const {
    url,
    method = 'POST',
    headers = {},
    body,
    timeoutMs = 6000,
    signal: userSignal,
    disableFallback = false,
  } = options;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort(new Error('Request Timeout'));
  }, timeoutMs);

  const combinedSignal = userSignal
    ? anySignal([userSignal, controller.signal])
    : controller.signal;

  const startTime = performance.now();

  try {
    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const response = await fetch(url, {
      method,
      headers: fetchHeaders,
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: combinedSignal,
    });

    window.clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    let rawText = '';
    let parsedData: T | null = null;

    try {
      rawText = await response.text();
      try {
        parsedData = rawText ? (JSON.parse(rawText) as T) : null;
      } catch {
        parsedData = null;
      }
    } catch {
      rawText = '';
    }

    // If direct browser request got 404, 403, 405, or 502 (often caused by Cloudflare WAF blocking Origin: localhost),
    // and fallback is not disabled, silently retry once through serverless proxy
    if (
      !response.ok &&
      !disableFallback &&
      !url.startsWith('/api/proxy') &&
      [404, 403, 405, 502, 503].includes(response.status)
    ) {
      const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`;
      return silentFetch<T>({
        ...options,
        url: proxyUrl,
        disableFallback: true,
      });
    }

    const lowerText = (rawText + JSON.stringify(parsedData || '')).toLowerCase();
    let errorCategory: TransportResponse<T>['errorCategory'] = undefined;
    let errorMessage: string | undefined = undefined;

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        errorCategory = 'unauthorized';
        errorMessage = 'API Key 无效或未授权 (401/403)';
      } else if (
        response.status === 402 ||
        response.status === 429 ||
        lowerText.includes('quota') ||
        lowerText.includes('insufficient') ||
        lowerText.includes('balance')
      ) {
        errorCategory = response.status === 429 && !lowerText.includes('quota') ? 'rate_limit' : 'quota';
        errorMessage = errorCategory === 'rate_limit' ? '触发频率限制 (429 Rate Limit)' : '账户额度不足或已欠费 (402/Quota Exhausted)';
      } else if (response.status === 404) {
        errorCategory = 'not_found';
        errorMessage = '接口或模型不存在 (404 Not Found)';
      } else if (response.status >= 500) {
        errorCategory = 'server_error';
        errorMessage = `中转站服务异常 (HTTP ${response.status})`;
      } else {
        errorCategory = 'other';
        errorMessage = `请求未成功 (HTTP ${response.status})`;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: parsedData,
      rawText,
      latencyMs,
      headers: response.headers,
      errorCategory,
      errorMessage,
    };
  } catch (err: unknown) {
    window.clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);
    const errorObj = err instanceof Error ? err : new Error(String(err));

    const isTimeout = errorObj.name === 'AbortError' || errorObj.message.includes('Timeout');
    const isCors = errorObj.name === 'TypeError' && (errorObj.message.includes('fetch') || errorObj.message.includes('NetworkError') || errorObj.message.includes('Failed'));

    // If blocked by CORS or NetworkError in browser, silently fallback to proxy
    if (!userSignal?.aborted && !disableFallback && !url.startsWith('/api/proxy')) {
      const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`;
      return silentFetch<T>({
        ...options,
        url: proxyUrl,
        disableFallback: true,
      });
    }

    return {
      ok: false,
      status: isTimeout ? 408 : 0,
      statusText: isTimeout ? 'Timeout' : 'Network Error',
      data: null,
      rawText: '',
      latencyMs,
      headers: new Headers(),
      errorCategory: isTimeout ? 'timeout' : isCors ? 'network_cors' : 'other',
      errorMessage: isTimeout
        ? `请求超时 (${timeoutMs}ms 熔断保护)`
        : isCors
        ? '网络连接异常或被浏览器跨域拦截 (CORS)'
        : errorObj.message || '网络请求发生未知错误',
    };
  }
}

export async function silentStreamingFetch(
  url: string,
  options: RequestInit
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    // If direct response was blocked with 404/403/502 by WAF, retry via proxy
    if (!res.ok && [404, 403, 405, 502].includes(res.status) && !url.startsWith('/api/proxy')) {
      const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`;
      return await fetch(proxyUrl, options);
    }
    return res;
  } catch (err: unknown) {
    if (!url.startsWith('/api/proxy')) {
      const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`;
      return await fetch(proxyUrl, options);
    }
    throw err;
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
