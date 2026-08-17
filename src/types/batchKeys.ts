export type KeyHealthStatus = 
  | 'active' 
  | 'quota_exhausted' 
  | 'invalid' 
  | 'rate_limited' 
  | 'duplicate'
  | 'network_error' 
  | 'pending' 
  | 'testing';

export interface KeyBalanceDetails {
  total?: number;
  used?: number;
  remain?: number;
  currency?: string;
}

export interface KeyCheckResult {
  index: number;
  key: string;
  maskedKey: string;
  status: KeyHealthStatus;
  httpStatus?: number;
  balance?: string;
  balanceDetails?: KeyBalanceDetails;
  availableModels?: string[];
  checkModel?: string;
  latencyMs?: number;
  errorMessage?: string;
}

export interface BatchKeySummary {
  id?: string | number;
  timestamp?: number;
  providerId?: string;
  providerName?: string;
  baseUrl?: string;
  testModel?: string;
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
