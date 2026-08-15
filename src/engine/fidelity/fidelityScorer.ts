/**
 * Fidelity Report & Confidence Scorer Orchestrator
 */

import {
  FidelityReport,
  FidelityLevel,
  FidelityDepth,
  ModelVerificationProfile,
  ProbeExecutionResult,
} from '../../types/fidelity';
import { verifyClaudeThinkingSignature } from './signatureVerifier';
import { verifyReasoningStream } from './reasoningVerifier';
import { FINGERPRINT_PROBES } from './fingerprintProbes';
import { silentFetch } from '../transport/silentTransport';
import { buildChatCompletionsUrl } from '../transport/urlNormalizer';

export interface FidelityAuditOptions {
  depth?: FidelityDepth;
  profile?: ModelVerificationProfile;
  onProgress?: (step: string, percent: number) => void;
  signal?: AbortSignal;
}

export async function runFidelityAudit(
  baseUrl: string,
  apiKey: string,
  model: string,
  options?: FidelityAuditOptions | ((step: string, percent: number) => void),
  legacySignal?: AbortSignal
): Promise<FidelityReport> {
  // Support legacy signature (onProgress, signal) or options object
  let depth: FidelityDepth = 'standard';
  let profile: ModelVerificationProfile = 'auto';
  let onProgress: ((step: string, percent: number) => void) | undefined = undefined;
  let signal: AbortSignal | undefined = legacySignal;

  if (typeof options === 'function') {
    onProgress = options;
  } else if (options) {
    depth = options.depth || 'standard';
    profile = options.profile || 'auto';
    onProgress = options.onProgress;
    signal = options.signal || legacySignal;
  }

  const startTime = performance.now();
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  // 1. Determine Model Family Profile
  const resolvedProfile: ModelVerificationProfile = profile === 'auto'
    ? detectModelFamily(model)
    : profile;

  const isClaude = resolvedProfile === 'claude' || /claude/i.test(model);
  const isReasoning = resolvedProfile === 'deepseek' || /r1|reasoner|o1|o3|thinking/i.test(model);

  // 2. Claude Thinking Signature Verification (if applicable or requested)
  let signatureResult = undefined;
  if (isClaude) {
    onProgress?.('正在探测 Thinking Signature 官方私钥验签...', 15);
    signatureResult = await verifyClaudeThinkingSignature(baseUrl, apiKey, model, signal);
    totalPromptTokens += 60;
    totalCompletionTokens += 150;
  }

  // 3. Reasoning Stream Protocol Check
  onProgress?.('正在检验原生思维链协议 (Reasoning Protocol)...', 30);
  const reasoningResult = await verifyReasoningStream(baseUrl, apiKey, model, signal);
  totalPromptTokens += 40;
  totalCompletionTokens += 80;

  // 4. Select Probes based on Depth and Profile
  const selectedProbes = FINGERPRINT_PROBES.filter((probe) => {
    // Check depth threshold
    if (depth === 'quick' && probe.minDepth !== 'quick') return false;
    if (depth === 'standard' && probe.minDepth === 'deep') return false;

    // Check profile applicability
    if (resolvedProfile !== 'universal' && probe.targetFamily !== 'general' && probe.targetFamily !== resolvedProfile) {
      // Allow claude probes if profile is claude, etc.
      return false;
    }
    return true;
  });

  const probeResults: ProbeExecutionResult[] = [];
  const chatUrl = buildChatCompletionsUrl(baseUrl);

  for (let i = 0; i < selectedProbes.length; i++) {
    const probe = selectedProbes[i];
    const progressPercent = 40 + Math.round(((i + 1) / (selectedProbes.length || 1)) * 55);
    onProgress?.(`正在运行探针 [${i + 1}/${selectedProbes.length}]: ${probe.title}...`, progressPercent);

    const probeRes = await silentFetch<any>({
      url: chatUrl,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: model,
        messages: [{ role: 'user', content: probe.prompt }],
        max_tokens: 256,
        temperature: 0.1,
      },
      timeoutMs: 6000,
      signal,
    });

    let outputText = '';
    if (probeRes.data?.choices?.[0]?.message?.content) {
      outputText = probeRes.data.choices[0].message.content;
    } else {
      outputText = probeRes.rawText;
    }

    const pTokens = probeRes.data?.usage?.prompt_tokens || Math.round(probe.prompt.length / 4);
    const cTokens = probeRes.data?.usage?.completion_tokens || Math.round(outputText.length / 4);
    totalPromptTokens += pTokens;
    totalCompletionTokens += cTokens;

    const meta = {
      systemFingerprint: probeRes.data?.system_fingerprint,
      latencyMs: probeRes.latencyMs,
      httpStatus: probeRes.status,
      rawText: probeRes.rawText,
    };

    const verdict = probe.judge(outputText, meta);

    probeResults.push({
      probeId: probe.probeId,
      title: probe.title,
      passed: verdict.passed,
      score: verdict.score,
      actualOutput: outputText.slice(0, 300),
      details: verdict.details,
      latencyMs: probeRes.latencyMs,
      tokensUsed: { prompt: pTokens, completion: cTokens, total: pTokens + cTokens },
    });
  }

  // 5. Compute Weighted Overall Score
  let totalScore = 0;
  let weights = 0;

  if (signatureResult && signatureResult.isApplicable) {
    weights += 45;
    totalScore += signatureResult.passed ? 45 : 0;
  }

  if (isReasoning) {
    weights += 30;
    totalScore += reasoningResult.passed ? 30 : 0;
  } else {
    weights += 10;
    totalScore += reasoningResult.passed ? 10 : 0;
  }

  const probesScoreAvg = probeResults.length > 0
    ? probeResults.reduce((acc, p) => acc + p.score, 0) / probeResults.length
    : 100;
  const remainingWeight = Math.max(100 - weights, 30);
  totalScore += (probesScoreAvg / 100) * remainingWeight;
  weights += remainingWeight;

  const normalizedScore = Math.min(100, Math.max(0, Math.round((totalScore / weights) * 100)));

  let level: FidelityLevel = 'genuine';
  let summary = '';

  if (signatureResult?.passed) {
    level = 'genuine';
    summary = '经 Anthropic 官方服务端私钥密码学验签，100% 确认为官方正品 Claude 模型。';
  } else if (isReasoning && !reasoningResult.passed) {
    level = 'suspect_downgraded';
    summary = '目标属于推理模型，但未捕获到原生 reasoning_content 思考流，疑似伪造或降级。';
  } else if (normalizedScore >= 85) {
    level = 'genuine';
    summary = '多项行为指纹、空间拓扑与知识边界探针全部通过，具备官方满血模型特征。';
  } else if (normalizedScore >= 50) {
    level = 'suspect_downgraded';
    summary = '部分探针未达标或空间生成畸变，疑似存在量化降级、小模型换皮或网关指令篡改。';
  } else {
    level = 'fake_imposter';
    summary = '关键探针失败或捕获到虚假注入指令，极大概率为虚假冒充模型。';
  }

  const totalDurationMs = Math.round(performance.now() - startTime);
  const totalTokens = {
    prompt: totalPromptTokens,
    completion: totalCompletionTokens,
    total: totalPromptTokens + totalCompletionTokens,
  };

  // Rough estimation: $3/M prompt tokens, $15/M completion tokens
  const estimatedCostUsd = Number(
    ((totalPromptTokens * 0.000003) + (totalCompletionTokens * 0.000015)).toFixed(5)
  );

  return {
    targetModel: model,
    verificationProfile: resolvedProfile,
    depth,
    overallScore: normalizedScore,
    level,
    summary,
    signatureResult,
    reasoningResult,
    firstTokenLatencyMs: reasoningResult?.firstTokenLatencyMs,
    generationTps: reasoningResult?.generationTps,
    thinkingTimeMs: reasoningResult?.thinkingTimeMs,
    probes: probeResults,
    systemFingerprint: probeResults[0]?.actualOutput,
    totalDurationMs,
    totalTokens,
    estimatedCostUsd,
    testedAt: Date.now(),
  };
}

function detectModelFamily(model: string): ModelVerificationProfile {
  const m = model.toLowerCase();
  if (m.includes('claude')) return 'claude';
  if (m.includes('gpt') || m.includes('o1') || m.includes('o3') || m.includes('chatgpt')) return 'openai';
  if (m.includes('grok') || m.includes('xai')) return 'xai';
  if (m.includes('gemini')) return 'gemini';
  if (m.includes('deepseek') || m.includes('r1')) return 'deepseek';
  return 'universal';
}
