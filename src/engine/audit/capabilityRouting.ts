import claimsDocument from '../../content/baselines/official-model-claims.json';
import policyDocument from '../../content/baselines/probe-policy.json';
import { AuditProvider, ProbeDisposition } from '../../types/audit';

export type ClaimState = 'supported' | 'unsupported' | 'unknown';

interface ModelClaims {
  projectModelId: string;
  officialModelId: string | null;
  provider: AuditProvider;
  verificationStatus: string;
  claims: Record<string, unknown>;
  evidence: Array<Record<string, unknown>>;
}

interface ClaimsDocument {
  models: ModelClaims[];
}

interface ProbePolicy {
  requires?: string[];
  skipWhen?: string[];
}

interface PolicyDocument {
  probePolicy: Record<string, ProbePolicy>;
}

export interface ProbeRoute {
  state: ClaimState;
  disposition: ProbeDisposition;
  countsTowardReferenceConclusion: boolean;
  reason: string;
}

const claims = claimsDocument as ClaimsDocument;
const policy = policyDocument as PolicyDocument;

function findModelClaims(provider: AuditProvider, model: string): ModelClaims | undefined {
  const normalizedModel = model.replace(new RegExp(`^${provider}/`), '');
  return claims.models.find((entry) => entry.provider === provider && (entry.projectModelId === model || entry.officialModelId === model || entry.projectModelId === normalizedModel || entry.officialModelId === normalizedModel));
}

function readClaim(modelClaims: ModelClaims | undefined, provider: AuditProvider, path: string): unknown {
  if (path === 'provider') return provider;
  if (!modelClaims) return 'unknown';
  return path.split('.').reduce<unknown>((value, key) => {
    if (typeof value !== 'object' || value === null) return 'unknown';
    return key in value ? (value as Record<string, unknown>)[key] : 'unknown';
  }, modelClaims.claims);
}

function compareClaim(value: unknown, operator: string, expected: string): ClaimState {
  if (expected === 'unknown' && operator === '=') return value === 'unknown' ? 'supported' : 'unsupported';
  if (value === 'unknown' || value === undefined || value === null) return 'unknown';
  if (operator === '>=') return typeof value === 'number' ? (value >= Number(expected) ? 'supported' : 'unsupported') : 'unknown';
  if (operator === '<') return typeof value === 'number' ? (value < Number(expected) ? 'supported' : 'unsupported') : 'unknown';
  if (operator === '=' || operator === '!=') {
    const matches = String(value) === expected;
    return (operator === '=' ? matches : !matches) ? 'supported' : 'unsupported';
  }
  return 'unknown';
}

function evaluateExpression(expression: string, provider: AuditProvider, modelClaims?: ModelClaims): ClaimState {
  const match = expression.match(/^([\w.]+)\s*(>=|<|!=|=)\s*(.+)$/);
  if (!match) return 'unknown';
  const [, path, operator, expected] = match;
  return compareClaim(readClaim(modelClaims, provider, path), operator, expected);
}

function evaluatePolicy(probeId: string, provider: AuditProvider, modelClaims?: ModelClaims): ProbeRoute {
  if (provider === 'openrouter') {
    return { state: 'unknown', disposition: 'standard_benchmark', countsTowardReferenceConclusion: true, reason: 'OpenRouter 参考基线模式：执行已实现探针以生成可比较样本。' };
  }
  const probePolicy = policy.probePolicy[probeId];
  if (!probePolicy) {
    return { state: 'unknown', disposition: 'exploratory_test', countsTowardReferenceConclusion: false, reason: '未找到该探针的官方路由策略。' };
  }

  const skippedBy = probePolicy.skipWhen?.find((expression) => evaluateExpression(expression, provider, modelClaims) === 'supported');
  if (skippedBy) {
    return { state: 'unsupported', disposition: 'not_claimed', countsTowardReferenceConclusion: false, reason: `官方能力声明满足跳过条件：${skippedBy}` };
  }

  const requiredStates = (probePolicy.requires || []).map((expression) => ({ expression, state: evaluateExpression(expression, provider, modelClaims) }));
  const failedRequirement = requiredStates.find((item) => item.state === 'unsupported');
  if (failedRequirement) {
    return { state: 'unsupported', disposition: 'not_claimed', countsTowardReferenceConclusion: false, reason: `官方能力声明不满足要求：${failedRequirement.expression}` };
  }
  if (requiredStates.some((item) => item.state === 'unknown')) {
    return { state: 'unknown', disposition: 'exploratory_test', countsTowardReferenceConclusion: false, reason: '官方能力资料未明确覆盖该探针要求，仅作为探索性测试。' };
  }
  if (!modelClaims) {
    return { state: 'unknown', disposition: 'exploratory_test', countsTowardReferenceConclusion: false, reason: '未找到该型号的官方能力声明，仅作为探索性测试。' };
  }
  return { state: 'supported', disposition: 'standard_benchmark', countsTowardReferenceConclusion: true, reason: '官方能力声明满足探针要求。' };
}

export function getProbeRoute(provider: AuditProvider, model: string, probeId: string): ProbeRoute {
  return evaluatePolicy(probeId, provider, findModelClaims(provider, model));
}

export function getModelClaims(provider: AuditProvider, model: string): ModelClaims | undefined {
  return findModelClaims(provider, model);
}
