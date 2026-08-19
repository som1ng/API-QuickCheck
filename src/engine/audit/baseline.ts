import { AuditProvider, AuditReportV4, AuditSurface, BaselineSnapshot, CapabilityMetric } from '../../types/audit';

export interface BaselineCaptureInput {
  id: string;
  provider: AuditProvider;
  model: string;
  surface: AuditSurface;
  region: string;
  serviceTier: string;
  report: AuditReportV4;
  estimatedCostUsd?: number;
  source?: BaselineSnapshot['source'];
}

export function createBaselineSnapshot(input: BaselineCaptureInput): BaselineSnapshot {
  const capabilityDistributions = Object.fromEntries(
    input.report.capabilities.map((metric) => [metric.domain, metric.targetScores]),
  ) as Record<CapabilityMetric['domain'], number[]>;

  return {
    schemaVersion: '1.0',
    id: input.id,
    provider: input.provider,
    model: input.model,
    surface: input.surface,
    region: input.region,
    serviceTier: input.serviceTier,
    capturedAt: input.report.testedAt,
    fixtureHashes: input.report.fixtureHashes,
    protocolEventTypes: input.report.protocol.flatMap((evidence) => evidence.rawEventTypes || []),
    capabilityDistributions,
    runtime: {
      p50LatencyMs: input.report.runtime.p50LatencyMs,
      p95LatencyMs: input.report.runtime.p95LatencyMs,
      successRate: input.report.runtime.successRate,
    },
    estimatedCostUsd: input.estimatedCostUsd || 0,
    source: input.source || 'unknown',
    coverage: input.report.coverage,
  };
}

export function validateBaselineSnapshot(value: unknown): value is BaselineSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<BaselineSnapshot>;
  return snapshot.schemaVersion === '1.0'
    && typeof snapshot.id === 'string'
    && typeof snapshot.provider === 'string'
    && typeof snapshot.model === 'string'
    && typeof snapshot.surface === 'string'
    && typeof snapshot.capturedAt === 'string'
    && typeof snapshot.fixtureHashes === 'object'
    && typeof snapshot.capabilityDistributions === 'object'
    && Object.values(snapshot.capabilityDistributions || {}).every((values) => Array.isArray(values) && values.every((score) => typeof score === 'number' && Number.isFinite(score)))
    && typeof snapshot.runtime === 'object'
    && typeof snapshot.coverage === 'object'
    && (snapshot.source === 'official' || snapshot.source === 'reference' || snapshot.source === 'user' || snapshot.source === 'unknown');
}

const STORAGE_PREFIX = 'apiqc:baseline:';

export function saveBaselineSnapshot(snapshot: BaselineSnapshot): void {
  if (typeof localStorage === 'undefined') throw new Error('当前环境不支持本地基线存储。');
  localStorage.setItem(`${STORAGE_PREFIX}${snapshot.id}`, serializeBaselineSnapshot(snapshot));
}

export function loadBaselineSnapshot(id: string): BaselineSnapshot | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateBaselineSnapshot(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function findStoredBaseline(provider: AuditProvider, model: string, surface: AuditSurface): BaselineSnapshot | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    const snapshot = loadBaselineSnapshot(key.slice(STORAGE_PREFIX.length));
    if (snapshot?.provider === provider && snapshot.model === model && snapshot.surface === surface) return snapshot;
  }
  return undefined;
}

export function serializeBaselineSnapshot(snapshot: BaselineSnapshot): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}
