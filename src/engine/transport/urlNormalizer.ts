/**
 * URL and Endpoint Normalization Utilities
 */

export function normalizeBaseUrl(url: string): string {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
}

export function getBaseRootUrl(baseUrl: string): string {
  const clean = normalizeBaseUrl(baseUrl);
  return clean.replace(/\/v1$/, '').replace(/\/api$/, '');
}

export function buildChatCompletionsUrl(baseUrl: string, platformId?: string): string {
  const clean = normalizeBaseUrl(baseUrl);
  if (!clean) return '';

  if (platformId === 'anthropic') {
    return clean.endsWith('/messages') ? clean : `${clean}/messages`;
  }

  if (clean.endsWith('/chat/completions')) {
    return clean;
  }

  if (clean.endsWith('/v1')) {
    return `${clean}/chat/completions`;
  }

  // If URL has no path or ends at domain, default to /v1/chat/completions
  const urlObj = tryParseUrl(clean);
  if (urlObj && (urlObj.pathname === '/' || urlObj.pathname === '')) {
    return `${clean}/v1/chat/completions`;
  }

  return `${clean}/chat/completions`;
}

export function getCandidateModelsUrls(baseUrl: string): string[] {
  const clean = normalizeBaseUrl(baseUrl);
  if (!clean) return [];

  const root = getBaseRootUrl(baseUrl);
  const candidates: string[] = [];

  // 1. Direct endpoint appended
  if (clean.endsWith('/models')) {
    candidates.push(clean);
  } else {
    candidates.push(`${clean}/models`);
  }

  // 2. /v1/models if clean didn't have /v1
  if (!clean.endsWith('/v1') && !clean.includes('/v1/')) {
    candidates.push(`${clean}/v1/models`);
    candidates.push(`${root}/v1/models`);
  }

  // 3. Root models and OpenRouter
  candidates.push(`${root}/api/v1/models`);
  candidates.push(`${root}/api/models`);

  return Array.from(new Set(candidates));
}

function tryParseUrl(urlStr: string): URL | null {
  try {
    return new URL(urlStr);
  } catch {
    return null;
  }
}
