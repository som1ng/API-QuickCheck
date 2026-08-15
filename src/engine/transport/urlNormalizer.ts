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

  // If clean does not end with /v1, standard OpenAI / OneAPI format is /v1/chat/completions
  if (!clean.includes('/v1/')) {
    return `${clean}/v1/chat/completions`;
  }

  return `${clean}/chat/completions`;
}

export function getCandidateModelsUrls(baseUrl: string): string[] {
  const clean = normalizeBaseUrl(baseUrl);
  if (!clean) return [];

  const root = getBaseRootUrl(baseUrl);
  const candidates: string[] = [];

  // Priority 1: Universal /v1/models standard
  if (clean.endsWith('/v1')) {
    candidates.push(`${clean}/models`);
  } else if (!clean.endsWith('/models')) {
    candidates.push(`${clean}/v1/models`);
    candidates.push(`${root}/v1/models`);
    candidates.push(`${clean}/models`);
  } else {
    candidates.push(clean);
  }

  // Priority 2: Alternative relay endpoints
  candidates.push(`${root}/api/v1/models`);
  candidates.push(`${root}/api/models`);
  candidates.push(`${clean}/models`);

  return Array.from(new Set(candidates));
}
