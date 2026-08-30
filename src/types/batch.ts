/**
 * Types for Batch API-Key Auditing & Matrix Testing
 */

import { FidelityLevel } from './fidelity';
import { AuditProfile, AuditProvider } from './audit';

export type KeyHealthStatus =
  | 'alive'
  | 'invalid_key' // 401
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'rate_limited' // 429
  | 'quota_exceeded' // Quota exhausted
  | 'server_error' // 500/502/503
  | 'timeout' // Network timeout
  | 'network_error'; // DNS/Connection refused

export interface BatchKeyInputItem {
  id?: string;
  name?: string;
  baseUrl: string;
  apiKey: string;
  provider?: AuditProvider | 'auto';
  models?: string[]; // Models to test for this key
  tags?: string[];
}

export interface SingleModelProbeResult {
  model: string;
  status: KeyHealthStatus;
  httpStatus?: number;
  verdict: FidelityLevel | 'untested' | 'error';
  genuineScore?: number; // 0 - 100
  latencyMs?: number; // TTFT (Time to First Token)
  tps?: number; // Output tokens per second
  signatureVerified?: boolean | null; // Claude thinking signature verified
  reasoningStream?: boolean | null; // DeepSeek / o1 reasoning content verified
  error?: string;
  rawOutputSnippet?: string;
}

export interface BatchKeyAuditItemResult {
  id: string;
  name: string;
  baseUrl: string;
  maskedKey: string;
  rawKey: string;
  overallStatus: 'healthy' | 'degraded' | 'dead';
  testedModels: SingleModelProbeResult[];
  successCount: number;
  failedCount: number;
  avgLatencyMs?: number;
  maxGenuineScore?: number;
  errorSummary?: string;
  testedAt: string;
}

export interface BatchAuditSummary {
  totalKeys: number;
  healthyKeys: number;
  degradedKeys: number;
  deadKeys: number;
  totalModelProbes: number;
  passedModelProbes: number;
  failedModelProbes: number;
  durationMs: number;
  asOf: string;
}

export interface BatchAuditReport {
  summary: BatchAuditSummary;
  results: BatchKeyAuditItemResult[];
  validKeys: {
    name: string;
    baseUrl: string;
    apiKey: string;
    supportedModels: string[];
    avgLatencyMs?: number;
  }[];
}

export interface BatchAuditOptions {
  items: BatchKeyInputItem[];
  defaultModels?: string[];
  concurrency?: number;
  profile?: AuditProfile;
  timeoutMs?: number;
  signal?: AbortSignal;
  onItemProgress?: (completed: number, total: number, currentItem: BatchKeyInputItem) => void;
}
