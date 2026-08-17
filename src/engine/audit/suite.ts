import { AuditProfile, ProbeDefinition } from '../../types/audit';

const providers = ['openai', 'anthropic', 'gemini', 'xai'] as const;

const probe = (id: string, layer: ProbeDefinition['layer'], title: string, domains: string[], fixture: string, scorer: string, maxInputTokens = 2_048, maxOutputTokens = 512): ProbeDefinition => ({
  id, layer, title, domains, applicableProviders: [...providers], fixture, scorer, maxInputTokens, maxOutputTokens, retries: 1,
});

/**
 * The balanced profile has 24 logical cases. A logical case may span an
 * expected tool round-trip, but its generated request budget is capped.
 */
export const BALANCED_SUITE: ProbeDefinition[] = [
  probe('p0-model-discovery', 'P0', '模型与版本发现', ['protocol'], 'model-discovery', 'metadata'),
  probe('p0-native-route', 'P0', '原生 API 路由', ['protocol'], 'native-route', 'http-status'),
  probe('p0-auth-shape', 'P0', '认证头与错误语义', ['protocol'], 'authentication', 'http-status'),
  probe('p0-stream-events', 'P0', '流式事件顺序', ['protocol'], 'stream-events', 'event-order'),
  probe('p0-strict-json', 'P0', '严格 JSON Schema', ['structured_output'], 'strict-json', 'json-schema'),
  probe('p0-tool-shape', 'P0', '工具调用结构', ['tools'], 'tool-shape', 'tool-schema'),
  probe('p0-invalid-parameter', 'P0', '非法参数回显', ['protocol'], 'invalid-parameter', 'error-contract'),

  probe('p1-reasoning-config', 'P1', '推理配置透传', ['reasoning'], 'reasoning-config', 'parameter-response'),
  probe('p1-state-continuity', 'P1', '跨轮状态连续性', ['tools'], 'state-continuity', 'continuation'),
  probe('p1-tool-roundtrip', 'P1', '受控工具回合', ['tools'], 'tool-roundtrip', 'tool-result-consumption'),
  probe('p1-signature-continuity', 'P1', '思考签名连续性', ['protocol'], 'signature-continuity', 'opaque-signature'),
  probe('p1-cache-semantics', 'P1', '缓存语义', ['protocol'], 'cache-semantics', 'cache-consistency'),

  probe('p2-constraint-json', 'P2', '约束 JSON 任务', ['structured_output', 'reasoning'], 'constraint-json', 'deterministic-json'),
  probe('p2-tool-planning', 'P2', '双回合工具规划', ['tools', 'reasoning'], 'tool-planning', 'tool-result-consumption'),
  probe('p2-code-repair-a', 'P2', '代码补丁：算术模块', ['code'], 'code-repair-arithmetic', 'patch-hidden-test'),
  probe('p2-code-repair-b', 'P2', '代码补丁：集合模块', ['code'], 'code-repair-set', 'patch-hidden-test'),
  probe('p2-chart-extraction', 'P2', '图表字段提取', ['vision'], 'chart-extraction', 'vision-fields'),
  probe('p2-context-start', 'P2', '长上下文针尖：开头', ['context'], 'context-start', 'needle-conflict', 64_000, 512),
  probe('p2-context-middle', 'P2', '长上下文针尖：中部', ['context'], 'context-middle', 'needle-conflict', 64_000, 512),
  probe('p2-context-end', 'P2', '长上下文针尖：结尾', ['context'], 'context-end', 'needle-conflict', 64_000, 512),

  probe('p3-repeat-a', 'P3', '运行质量样本 A', ['runtime'], 'repeat-a', 'latency-success'),
  probe('p3-repeat-b', 'P3', '运行质量样本 B', ['runtime'], 'repeat-b', 'latency-success'),
  probe('p3-repeat-c', 'P3', '运行质量样本 C', ['runtime'], 'repeat-c', 'latency-success'),
  probe('p3-repeat-d', 'P3', '运行质量样本 D', ['runtime'], 'repeat-d', 'latency-success'),
];

export const AUDIT_PRESETS: Record<AuditProfile, { label: string; description: string; probeIds: string[] }> = {
  quick: {
    label: '快速',
    description: '基础连通、认证、严格 JSON 和工具结构，适合先确认接口形状。',
    probeIds: ['p0-model-discovery', 'p0-native-route', 'p0-auth-shape', 'p0-strict-json'],
  },
  balanced: {
    label: '平衡',
    description: '完整选择 24 项平衡档计划，暂不可用项会明确标注。',
    probeIds: BALANCED_SUITE.map((item) => item.id),
  },
  deep: {
    label: '深度',
    description: '选择完整 24 项计划，为后续长上下文、工具闭环和本地任务预留。',
    probeIds: BALANCED_SUITE.map((item) => item.id),
  },
};

export function selectSuite(profile: AuditProfile, selectedProbeIds?: string[]): ProbeDefinition[] {
  if (selectedProbeIds) {
    const selected = new Set(selectedProbeIds);
    return BALANCED_SUITE.filter((item) => selected.has(item.id));
  }
  return BALANCED_SUITE.filter((item) => AUDIT_PRESETS[profile].probeIds.includes(item.id));
}

export function hashFixture(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
