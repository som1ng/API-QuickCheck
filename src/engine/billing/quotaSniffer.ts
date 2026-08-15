/**
 * Detects optional account/credit endpoints exposed by common AI relays.
 * A missing billing endpoint is a valid result: most OpenAI-compatible APIs
 * intentionally expose only model and completion routes.
 */

import { RelayBalance, RelayProfile } from '../../types/config';
import { silentFetch } from '../transport/silentTransport';
import { getBaseRootUrl, normalizeBaseUrl } from '../transport/urlNormalizer';

interface BalanceCandidate {
  url: string;
  systemType: RelayProfile['systemType'];
  label: string;
}

function buildCandidates(baseUrl: string): BalanceCandidate[] {
  const clean = normalizeBaseUrl(baseUrl);
  const root = getBaseRootUrl(baseUrl);

  return [
    { url: `${clean}/dashboard/billing/subscription`, systemType: 'official', label: 'OpenAI billing subscription' },
    { url: `${root}/v1/dashboard/billing/subscription`, systemType: 'official', label: 'OpenAI billing subscription' },
    { url: `${root}/dashboard/billing/subscription`, systemType: 'official', label: 'OpenAI billing subscription' },
    { url: `${clean}/api/usage`, systemType: 'custom', label: 'API usage' },
    { url: `${root}/api/usage`, systemType: 'custom', label: 'API usage' },
    { url: `${root}/api/v1/credits`, systemType: 'openrouter', label: 'OpenRouter credits' },
    { url: `${root}/v1/user/balance`, systemType: 'custom', label: 'DeepSeek balance' },
    { url: `${root}/user/balance`, systemType: 'custom', label: 'DeepSeek balance' },
    { url: `${root}/v1/user/info`, systemType: 'custom', label: 'Provider account info' },
    { url: `${root}/api/user/self`, systemType: 'new-api', label: 'OneAPI/NewAPI account info' },
    { url: `${root}/api/user/info`, systemType: 'new-api', label: 'OneAPI/NewAPI account info' },
  ];
}

function inferSystemType(candidate: BalanceCandidate, data: unknown): RelayProfile['systemType'] {
  if (candidate.systemType !== 'custom') return candidate.systemType;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if ('balance_infos' in record) return 'official';
    if ('total_granted' in record || 'remain_quota' in record || 'used_quota' in record) return 'new-api';
  }
  return 'custom';
}

export async function sniffRelayProfile(
  baseUrl: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<RelayProfile> {
  const candidates = Array.from(
    new Map(buildCandidates(baseUrl).map((candidate) => [candidate.url, candidate])).values()
  );
  let lastStatus = 0;
  let lastErrorMessage = '';

  for (const candidate of candidates) {
    if (signal?.aborted) throw signal.reason || new Error('探测已取消');

    try {
      const response = await silentFetch<unknown>({
        url: candidate.url,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'x-api-key': apiKey.trim(),
          'api-key': apiKey.trim(),
        },
        timeoutMs: 3000,
        signal,
      });

      lastStatus = response.status;
      lastErrorMessage = response.errorMessage || '';
      if (!response.ok || !response.data) continue;

      const balance = parseRelayBalancePayload(response.data);
      if (!balance) continue;

      return {
        systemType: inferSystemType(candidate, response.data),
        status: 'detected',
        detectedBalance: {
          ...balance,
          endpoint: candidate.url,
          source: candidate.label,
        },
        detectedEndpoint: candidate.url,
        evidence: `命中 ${candidate.label}，返回字段符合额度数据结构`,
        checkedAt: Date.now(),
        supportedModelsCount: 0,
        supportsNativeAnthropic: false,
        supportsOpenAICompat: true,
      };
    } catch (error: unknown) {
      if (signal?.aborted) throw error;
      lastErrorMessage = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    systemType: 'custom',
    status: lastStatus === 401 || lastStatus === 403 ? 'error' : 'unavailable',
    evidence: lastStatus
      ? `已检查 ${candidates.length} 个候选路由，最后响应 HTTP ${lastStatus}`
      : `已检查 ${candidates.length} 个候选路由，未收到可解析响应`,
    errorMessage: lastErrorMessage || undefined,
    checkedAt: Date.now(),
    supportedModelsCount: 0,
    supportsNativeAnthropic: false,
    supportsOpenAICompat: true,
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[$,]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatBalance(value: number, currency: RelayBalance['currency']): string {
  if (currency === 'CNY') return `¥${value.toFixed(2)}`;
  if (currency === 'POINTS') return `${value.toFixed(0)} points`;
  return `$${value.toFixed(2)}`;
}

function fromQuotaPair(granted: number, used: number, source: string): RelayBalance {
  const isPoints = granted > 10000 || used > 10000;
  const divisor = isPoints ? 500000 : 1;
  const total = granted / divisor;
  const spent = used / divisor;
  const remaining = total - spent;
  const currency = isPoints ? 'USD' : 'USD';

  return {
    quota: round(remaining),
    totalQuota: round(total),
    usedQuota: round(spent),
    currency,
    source,
    rawText: formatBalance(remaining, currency),
  };
}

export function parseRelayBalancePayload(data: unknown): RelayBalance | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;

  const granted = toNumber(obj.total_granted);
  const used = toNumber(obj.total_used ?? obj.used_quota);
  if (granted !== null && used !== null) {
    return fromQuotaPair(granted, used, 'total_granted / total_used');
  }

  const rootQuota = toNumber(obj.quota);
  if (rootQuota !== null) {
    const spent = used ?? 0;
    const points = rootQuota > 10000 || spent > 10000;
    const divisor = points ? 500000 : 1;
    const remaining = rootQuota / divisor;
    return {
      quota: round(remaining),
      usedQuota: round(spent / divisor),
      currency: 'USD',
      source: 'quota / used_quota',
      rawText: formatBalance(remaining, 'USD'),
    };
  }

  const hardLimit = toNumber(obj.hard_limit_usd);
  if (hardLimit !== null) {
    return {
      quota: hardLimit,
      totalQuota: hardLimit,
      usedQuota: 0,
      currency: 'USD',
      source: 'hard_limit_usd',
      rawText: formatBalance(hardLimit, 'USD'),
    };
  }

  const nested = obj.data;
  if (nested && typeof nested === 'object') {
    const value = nested as Record<string, unknown>;
    const credits = toNumber(value.total_credits);
    const usage = toNumber(value.total_usage) ?? 0;
    if (credits !== null) {
      const remaining = credits - usage;
      return {
        quota: round(remaining),
        totalQuota: round(credits),
        usedQuota: round(usage),
        currency: 'USD',
        source: 'total_credits / total_usage',
        rawText: formatBalance(remaining, 'USD'),
      };
    }

    const balance = toNumber(value.balance);
    if (balance !== null) {
      return {
        quota: balance,
        totalQuota: balance,
        usedQuota: 0,
        currency: 'CNY',
        source: 'data.balance',
        rawText: formatBalance(balance, 'CNY'),
      };
    }

    const remainingQuota = toNumber(value.remain_quota ?? value.quota);
    if (remainingQuota !== null) {
      const points = remainingQuota > 10000;
      const normalized = points ? remainingQuota / 500000 : remainingQuota;
      return {
        quota: round(normalized),
        usedQuota: 0,
        currency: points ? 'USD' : 'USD',
        source: 'data.remain_quota',
        rawText: formatBalance(normalized, 'USD'),
      };
    }
  }

  if (Array.isArray(obj.balance_infos) && obj.balance_infos.length > 0) {
    const info = obj.balance_infos[0];
    if (info && typeof info === 'object') {
      const record = info as Record<string, unknown>;
      const balance = toNumber(record.total_balance);
      if (balance !== null) {
        const currency = record.currency === 'USD' ? 'USD' : 'CNY';
        return {
          quota: balance,
          totalQuota: balance,
          usedQuota: 0,
          currency,
          source: 'balance_infos[0].total_balance',
          rawText: formatBalance(balance, currency),
        };
      }
    }
  }

  return null;
}
