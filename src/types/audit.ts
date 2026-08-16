export type AuditProvider = 'openai' | 'anthropic' | 'gemini' | 'xai';
export type AuditSurface = 'responses' | 'messages' | 'interactions';
export type EvidenceStatus = 'pass' | 'fail' | 'unavailable';
export type AuditConclusion = 'consistent' | 'suspect_downgraded' | 'inconclusive';
export type AuditProfile = 'quick' | 'balanced' | 'deep';
export type AuditLayer = 'P0' | 'P1' | 'P2' | 'P3';

export interface FrontierModelDefinition {
  id: string;
  provider: AuditProvider;
  displayName: string;
  surface: AuditSurface;
  tier: 'frontier' | 'balanced' | 'efficient' | 'preview';
  protocolCapabilities: string[];
  benchmarkFocus: string[];
}

export interface ProbeDefinition {
  id: string;
  layer: AuditLayer;
  title: string;
  domains: string[];
  applicableProviders: AuditProvider[];
  maxInputTokens: number;
  maxOutputTokens: number;
  fixture: string;
  scorer: string;
  retries: number;
}

export interface ProtocolEvidence {
  id: string;
  title: string;
  status: EvidenceStatus;
  detail: string;
  latencyMs?: number;
  rawEventTypes?: string[];
}

export interface CapabilityMetric {
  domain: 'reasoning' | 'tools' | 'code' | 'vision' | 'context' | 'structured_output';
  targetScores: number[];
  baselineScores?: number[];
  delta?: number;
  confidenceInterval?: [number, number];
  status: EvidenceStatus;
  detail: string;
}

export interface RuntimeQuality {
  attempts: number;
  successRate: number;
  p50LatencyMs?: number;
  p95LatencyMs?: number;
  acceptedInputTokens?: number;
  usageConsistent?: boolean;
}

export interface AuditReportV4 {
  schemaVersion: '4.0';
  target: { provider: AuditProvider; model: string; baseUrl: string };
  profile: AuditProfile;
  baselineId?: string;
  protocol: ProtocolEvidence[];
  capabilities: CapabilityMetric[];
  runtime: RuntimeQuality;
  conclusion: AuditConclusion;
  summary: string;
  candidateDistances: Array<{ modelId: string; distance: number }>;
  fixtureHashes: Record<string, string>;
  coverage: { executed: number; total: number; unavailable: number };
  seed: string;
  testedAt: string;
}

export interface BaselineSnapshot {
  schemaVersion: '1.0';
  id: string;
  provider: AuditProvider;
  model: string;
  surface: AuditSurface;
  region: string;
  serviceTier: string;
  capturedAt: string;
  fixtureHashes: Record<string, string>;
  protocolEventTypes: string[];
  capabilityDistributions: Record<CapabilityMetric['domain'], number[]>;
  runtime: { p50LatencyMs?: number; p95LatencyMs?: number; successRate: number };
  estimatedCostUsd: number;
}
