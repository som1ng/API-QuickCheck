export type FidelityLevel = 'genuine' | 'suspect_downgraded' | 'fake_imposter' | 'inconclusive' | 'error';

export type FidelityDepth = 'quick' | 'standard' | 'deep';

export type ModelVerificationProfile = 'auto' | 'claude' | 'deepseek' | 'openai' | 'gemini' | 'universal';

export interface ProbeResponseMeta {
  reasoningContent?: string;
  systemFingerprint?: string;
  signature?: string;
  usageTokens?: { prompt: number; completion: number };
  latencyMs: number;
  httpStatus: number;
  rawText?: string;
}

export interface ProbeVerdict {
  passed: boolean;
  score: number; // 0 ~ 100
  details: string;
  extractedValue?: string;
  isApplicable?: boolean;
}

export interface FingerprintProbeDefinition {
  probeId: string;
  title: string;
  targetFamily: 'claude' | 'deepseek' | 'openai' | 'gemini' | 'general';
  minDepth: FidelityDepth;
  prompt: string;
  description: string;
  judge: (output: string, meta: ProbeResponseMeta) => ProbeVerdict;
}

export interface ProbeExecutionResult {
  probeId: string;
  title: string;
  passed: boolean;
  score: number;
  actualOutput: string;
  reasoningContent?: string;
  details: string;
  latencyMs: number;
  tokensUsed?: { prompt: number; completion: number; total: number };
  isApplicable?: boolean;
}

export interface SignatureVerificationResult {
  isApplicable: boolean; // 是否支持 Anthropic 原生 messages 端点
  passed: boolean;
  signature?: string;
  stage: 'extract' | 'reverify' | 'failed' | 'not_supported';
  details: string;
}

export interface ReasoningVerificationResult {
  hasReasoningStream: boolean;
  reasoningFieldUsed?: 'reasoning_content' | 'reasoning' | 'text_think_tag';
  thinkingTimeMs: number;
  firstTokenLatencyMs?: number; // 首字延迟
  generationTps?: number;       // 流式生成吞吐
  passed: boolean;
  details: string;
}

export interface FidelityReport {
  targetModel: string;
  verificationProfile: ModelVerificationProfile;
  depth: FidelityDepth;
  overallScore: number; // 0 ~ 100
  level: FidelityLevel;
  summary: string;
  signatureResult?: SignatureVerificationResult;
  reasoningResult?: ReasoningVerificationResult;
  probes: ProbeExecutionResult[];
  systemFingerprint?: string;
  firstTokenLatencyMs?: number; // 真实首字响应速度 (First Token Latency)
  generationTps?: number;       // 真实生成吞吐 (Tokens/s)
  thinkingTimeMs?: number;      // 纯思考链耗时
  totalDurationMs: number;
  totalTokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  estimatedCostUsd: number;
  testedAt: number;
}
