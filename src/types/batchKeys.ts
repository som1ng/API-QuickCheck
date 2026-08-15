export type KeyHealthStatus = 
  | 'active' 
  | 'quota_exhausted' 
  | 'invalid' 
  | 'rate_limited' 
  | 'duplicate'
  | 'network_error' 
  | 'pending' 
  | 'testing';

export interface KeyCheckResult {
  index: number;
  key: string;
  maskedKey: string;
  status: KeyHealthStatus;
  httpStatus?: number;
  balance?: string;
  latencyMs?: number;
  errorMessage?: string;
}

export interface BatchKeySummary {
  total: number;
  completed: number;
  activeCount: number;
  exhaustedCount: number;
  rateLimitedCount: number;
  invalidCount: number;
  duplicateCount: number;
  errorCount: number;
  results: KeyCheckResult[];
  duplicates: string[];
}
