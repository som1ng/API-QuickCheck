export type ModelStatus = 
  | 'available' 
  | 'unauthorized' 
  | 'rate_limited' 
  | 'quota_exhausted' 
  | 'not_found' 
  | 'server_error' 
  | 'pending' 
  | 'testing';

export interface ModelCheckItem {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'deepseek' | 'google' | 'meta' | 'other';
  status: ModelStatus;
  httpStatus?: number;
  latencyMs?: number;
  errorMessage?: string;
  supportsStreaming?: boolean;
}

export interface ModelScannerState {
  isScanning: boolean;
  total: number;
  completed: number;
  availableCount: number;
  errorCount: number;
  items: ModelCheckItem[];
  filterProvider: string;
  searchQuery: string;
}
