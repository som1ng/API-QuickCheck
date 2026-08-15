export interface PlatformConfig {
  id: string;
  name: string;
  category: '海外巨头' | '海外聚合与加速' | '国内大厂' | '国内新锐' | '自定义中转';
  defaultBaseUrl: string;
  modelsEndpoint: string;
  authType: 'Bearer' | 'Header' | 'Query';
  authHeaderKey?: string;
  extraHeaders?: Record<string, string>;
  modelExtractor: (responseData: unknown) => { id: string; name: string }[];
  litellmConfig: {
    envVar: string;
    prefix: string;
    requiresApiBase: boolean;
  };
}

export interface GlobalConfig {
  platformId: string;
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  timeoutMs: number;
}

export interface RelayBalance {
  quota: number;
  usedQuota: number;
  currency: 'USD' | 'CNY' | 'POINTS';
  totalQuota?: number;
  source?: string;
  endpoint?: string;
  rawText?: string;
}

export type RelayProbeStatus = 'detected' | 'unavailable' | 'error';

export interface RelayProfile {
  systemType: 'new-api' | 'one-api' | 'openrouter' | 'official' | 'custom';
  status: RelayProbeStatus;
  detectedBalance?: RelayBalance;
  detectedEndpoint?: string;
  evidence?: string;
  errorMessage?: string;
  checkedAt: number;
  supportedModelsCount: number;
  supportsNativeAnthropic: boolean;
  supportsOpenAICompat: boolean;
}

export type ActiveTabId = 'home' | 'quickping' | 'docs' | 'fidelity' | 'benchmark' | 'scanner' | 'capability' | 'export';
