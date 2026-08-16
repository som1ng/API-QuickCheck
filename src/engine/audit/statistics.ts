import { AuditConclusion, CapabilityMetric } from '../../types/audit';

const quantile = (values: number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[index] ?? 0;
};

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

/** Deterministic pseudo-random source so reports are reproducible from their seed. */
export function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i += 1) state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bootstrapDifference(target: number[], baseline: number[], seed: string, rounds = 10_000): { delta: number; interval: [number, number] } {
  if (!target.length || !baseline.length) return { delta: 0, interval: [0, 0] };
  const rng = seededRandom(seed);
  const differences: number[] = [];
  for (let round = 0; round < rounds; round += 1) {
    const sample = (source: number[]) => Array.from({ length: source.length }, () => source[Math.floor(rng() * source.length)] ?? 0);
    differences.push(mean(sample(target)) - mean(sample(baseline)));
  }
  return { delta: mean(target) - mean(baseline), interval: [quantile(differences, 0.025), quantile(differences, 0.975)] };
}

export function determineConclusion(metrics: CapabilityMetric[]): AuditConclusion {
  const degradedDomains = metrics.filter((metric) => metric.confidenceInterval && metric.confidenceInterval[1] <= -0.15);
  const independentDomains = new Set(degradedDomains.map((metric) => metric.domain));
  if (independentDomains.size >= 2) return 'suspect_downgraded';
  if (!metrics.some((metric) => metric.baselineScores?.length)) return 'inconclusive';
  return 'consistent';
}
