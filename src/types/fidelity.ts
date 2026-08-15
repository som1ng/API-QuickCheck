export type FidelityLevel = 'genuine' | 'suspect_downgraded' | 'fake_imposter' | 'inconclusive' | 'error';

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
  targetFamily: 'claude' | 'reasoning_r1_o1' | 'gpt4o' | 'general';
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
  passed: boolean;
  details: string;
}

export interface FidelityReport {
  targetModel: string;
  overallScore: number; // 0 ~ 100
  level: FidelityLevel;
  summary: string;
  signatureResult?: SignatureVerificationResult;
  reasoningResult?: ReasoningVerificationResult;
  probes: ProbeExecutionResult[];
  systemFingerprint?: string;
  testedAt: number;
}
