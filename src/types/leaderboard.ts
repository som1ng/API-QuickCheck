export type LeaderboardSource = 'aa-models' | 'arena-agent';

export interface LeaderboardSnapshot<T> {
  source: LeaderboardSource;
  sourceUrl: string;
  sourceName: string;
  fetchedAt: string; // ISO string
  asOf?: string; // source annotated date like 2026-08-19
  rowCount: number;
  rows: T[];
}

export interface AaModelRow {
  rank: number;
  name: string;
  slug?: string;
  creator: string;
  creatorLogo?: string;
  intelligenceIndex: number | null;
  estimated?: boolean;
  costPerTaskUsd: number | null;
  medianTokensPerSec: number | null;
  latencyFirstChunkSec: number | null;
  totalResponseSec: number | null;
  contextWindow: number | null;
  modelUrl?: string;
  providersUrl?: string;
}

export interface ArenaAgentRow {
  rank: number;
  name: string;
  lab: string;
  license?: string;
  netImprovementPct: number | null;
  netImprovementCi?: number | null;
  confirmedSuccessPct: number | null;
  confirmedSuccessCi?: number | null;
  praiseVsComplaintPct: number | null;
  praiseVsComplaintCi?: number | null;
  steerabilityPct: number | null;
  bashRecoveryPct: number | null;
  toolHallucinationPct: number | null;
  sessions: number | null;
  costPerTaskP50Usd: number | null;
  outputTokensP50?: number | null;
  outputTokensP50Raw?: string;
  pricePerM?: string;
  modelUrl?: string;
}