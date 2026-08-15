export interface StreamChunkMetric {
  chunkIndex: number;
  timestamp: number;
  deltaMs: number;
  tokenCount: number;
  textChunk: string;
}

export interface BenchmarkRoundResult {
  round: number;
  ttftMs: number;
  totalDurationMs: number;
  outputTokens: number;
  tps: number;
  jitterVariance: number;
  fullText: string;
  status: 'completed' | 'failed' | 'timeout';
  errorMessage?: string;
}

export interface BenchmarkSummary {
  model: string;
  roundsCount: number;
  avgTtftMs: number;
  minTtftMs: number;
  maxTtftMs: number;
  avgTps: number;
  maxTps: number;
  isTpsEstimated: boolean;
  stabilityScore: 'excellent' | 'good' | 'fair' | 'poor';
  avgJitterVariance: number;
  rounds: BenchmarkRoundResult[];
}
