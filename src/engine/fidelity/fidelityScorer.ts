/**
 * Fidelity Report & Confidence Scorer Orchestrator
 */

import { FidelityReport, FidelityLevel, ProbeExecutionResult } from '../../types/fidelity';
import { verifyClaudeThinkingSignature } from './signatureVerifier';
import { verifyReasoningStream } from './reasoningVerifier';
import { FINGERPRINT_PROBES } from './fingerprintProbes';
import { silentFetch } from '../transport/silentTransport';
import { buildChatCompletionsUrl } from '../transport/urlNormalizer';

export async function runFidelityAudit(
  baseUrl: string,
  apiKey: string,
  model: string,
  onProgress?: (step: string, percent: number) => void,
  signal?: AbortSignal
): Promise<FidelityReport> {
  const isClaude = /claude/i.test(model);
  const isReasoning = /r1|reasoner|o1|o3|thinking/i.test(model);

  onProgress?.('正在探测 Thinking Signature 加密级验真...', 15);
  let signatureResult = undefined;
  if (isClaude) {
    signatureResult = await verifyClaudeThinkingSignature(baseUrl, apiKey, model, signal);
  }

  onProgress?.('正在检验原生思维链协议 (Reasoning Protocol)...', 35);
  const reasoningResult = await verifyReasoningStream(baseUrl, apiKey, model, signal);

  // Run fingerprint probes sequentially
  const probeResults: ProbeExecutionResult[] = [];
  const chatUrl = buildChatCompletionsUrl(baseUrl);

  for (let i = 0; i < FINGERPRINT_PROBES.length; i++) {
    const probe = FINGERPRINT_PROBES[i];
    const progressPercent = 50 + Math.round(((i + 1) / FINGERPRINT_PROBES.length) * 45);
    onProgress?.(`正在运行探针: ${probe.title}...`, progressPercent);

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
    });
  }

  // Calculate Overall Score and Level
  let totalScore = 0;
  let weights = 0;

  // 1. Signature Result (High Weight if applicable)
  if (signatureResult && signatureResult.isApplicable) {
    weights += 40;
    totalScore += signatureResult.passed ? 40 : 0;
  }

  // 2. Reasoning Result
  if (isReasoning) {
    weights += 30;
    totalScore += reasoningResult.passed ? 30 : 0;
  } else {
    weights += 10;
    totalScore += reasoningResult.passed ? 10 : 0;
  }

  // 3. Probes Result
  const probesScoreAvg = probeResults.reduce((acc, p) => acc + p.score, 0) / (probeResults.length || 1);
  const remainingWeight = Math.max(100 - weights, 30);
  totalScore += (probesScoreAvg / 100) * remainingWeight;
  weights += remainingWeight;

  const normalizedScore = Math.min(100, Math.max(0, Math.round((totalScore / weights) * 100)));

  let level: FidelityLevel = 'genuine';
  let summary = '';

  if (signatureResult?.passed) {
    level = 'genuine';
    summary = '经 Anthropic 官方服务端私钥加密验签，100% 确认为官方原版 Claude 模型。';
  } else if (isReasoning && !reasoningResult.passed) {
    level = 'suspect_downgraded';
    summary = '目标为推理模型，但未捕获到真正的思维链协议数据，疑似降级或假冒思维链。';
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

  return {
    targetModel: model,
    overallScore: normalizedScore,
    level,
    summary,
    signatureResult,
    reasoningResult,
    probes: probeResults,
    systemFingerprint: probeResults[0]?.actualOutput,
    testedAt: Date.now(),
  };
}
