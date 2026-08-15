export type CapabilityStatus = 'supported' | 'unsupported' | 'error' | 'pending' | 'testing';

export interface CapabilityItemResult {
  id: 'stream' | 'tools' | 'vision' | 'json';
  name: string;
  description: string;
  status: CapabilityStatus;
  latencyMs?: number;
  details: string;
  rawResponseSnippet?: string;
}

export interface CapabilityMatrixResult {
  model: string;
  testedAt: number;
  capabilities: Record<'stream' | 'tools' | 'vision' | 'json', CapabilityItemResult>;
}
