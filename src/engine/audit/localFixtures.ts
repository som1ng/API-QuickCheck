export type LocalTaskKind = 'code_patch' | 'needle_context' | 'tool_roundtrip' | 'repeat_quality';
export type NeedlePosition = 'start' | 'middle' | 'end';

export interface LocalTaskDefinition {
  id: string;
  kind: LocalTaskKind;
  domains: string[];
  fixture: string;
}

export interface NeedleFixture {
  seed: string;
  position: NeedlePosition;
  document: string;
  expectedAnswer: string;
  estimatedTokens: number;
}

export interface CodeRepairFixture {
  id: 'arithmetic' | 'set';
  instruction: string;
  source: string;
  expectedTokens: string[];
  acceptancePatterns: RegExp[][];
}

export interface RepeatSample {
  ok: boolean;
  latencyMs: number;
}

export interface RepeatSummary {
  attempts: number;
  successRate: number;
  p50LatencyMs?: number;
  p95LatencyMs?: number;
}

export const LOCAL_BALANCED_TASKS: LocalTaskDefinition[] = [
  { id: 'p2-constraint-json', kind: 'tool_roundtrip', domains: ['structured_output'], fixture: 'constraint-json' },
  { id: 'p2-tool-planning', kind: 'tool_roundtrip', domains: ['tools', 'reasoning'], fixture: 'tool-planning' },
  { id: 'p2-code-repair-a', kind: 'code_patch', domains: ['code'], fixture: 'code-repair-arithmetic' },
  { id: 'p2-code-repair-b', kind: 'code_patch', domains: ['code'], fixture: 'code-repair-set' },
  { id: 'p2-chart-extraction', kind: 'needle_context', domains: ['vision'], fixture: 'chart-extraction' },
  { id: 'p2-context-start', kind: 'needle_context', domains: ['context'], fixture: 'context-start' },
  { id: 'p2-context-middle', kind: 'needle_context', domains: ['context'], fixture: 'context-middle' },
  { id: 'p2-context-end', kind: 'needle_context', domains: ['context'], fixture: 'context-end' },
  { id: 'p3-repeat-a', kind: 'repeat_quality', domains: ['runtime'], fixture: 'repeat-a' },
  { id: 'p3-repeat-b', kind: 'repeat_quality', domains: ['runtime'], fixture: 'repeat-b' },
  { id: 'p3-repeat-c', kind: 'repeat_quality', domains: ['runtime'], fixture: 'repeat-c' },
  { id: 'p3-repeat-d', kind: 'repeat_quality', domains: ['runtime'], fixture: 'repeat-d' },
];

export function createNeedleFixture(seed: string, position: NeedlePosition, targetTokens = 8_000): NeedleFixture {
  const expectedAnswer = `needle-answer-${seed}-${position}`;
  const marker = `FIXED_CONTEXT_MARKER: ${expectedAnswer}`;
  const targetChars = Math.max(4_000, targetTokens * 4);
  const fillerUnit = `The archive record ${seed} contains stable reference text for controlled retrieval. `;
  const filler = fillerUnit.repeat(Math.ceil(targetChars / fillerUnit.length));
  const usable = filler.slice(0, targetChars - marker.length - 2);
  const split = position === 'start' ? 0 : position === 'middle' ? Math.floor(usable.length / 2) : usable.length;
  const document = `${usable.slice(0, split)}\n${marker}\n${usable.slice(split)}`;
  return { seed, position, document, expectedAnswer, estimatedTokens: Math.ceil(document.length / 4) };
}

export function scoreNeedleResponse(output: string, expectedAnswer: string): { score: number; passed: boolean } {
  const normalized = output.trim().toLowerCase();
  const expected = expectedAnswer.trim().toLowerCase();
  const passed = normalized.includes(expected);
  return { score: passed ? 100 : 0, passed };
}

export function createCodeRepairFixture(id: CodeRepairFixture['id']): CodeRepairFixture {
  if (id === 'arithmetic') {
    return {
      id,
      instruction: '修复算术模块中的税后总价计算，保留导出语句，并只返回修复后的代码。',
      source: 'function totalWithTax(price, taxRate) {\n  return price + taxRate;\n}\nmodule.exports = { totalWithTax };',
      expectedTokens: ['return price * (1 + taxRate);', 'module.exports = { totalWithTax };'],
      acceptancePatterns: [
        [/return\s+price\s*\*\s*\(\s*1\s*\+\s*taxRate\s*\)/i, /return\s+price\s*\+\s*price\s*\*\s*taxRate/i, /return\s+price\s*\+\s*\(\s*price\s*\*\s*taxRate\s*\)/i, /price\s*\*\s*\(\s*1\s*\+\s*taxRate\s*\)/i],
        [/module\.exports\s*=\s*\{\s*totalWithTax\s*\}/i, /export\s+(default\s+)?(function\s+)?totalWithTax/i, /export\s*\{\s*totalWithTax\s*\}/i, /function\s+totalWithTax/i],
      ],
    };
  }
  return {
    id,
    instruction: '修复集合模块，使函数返回去重后且保持首次出现顺序的数组，保留导出语句，并只返回修复后的代码。',
    source: 'function unique(values) {\n  return values.sort();\n}\nmodule.exports = { unique };',
    expectedTokens: ['return [...new Set(values)];', 'module.exports = { unique };'],
    acceptancePatterns: [
      [/return\s+\[\.\.\.\s*new\s+Set\s*\(\s*values\s*\)\s*\]/i, /return\s+Array\.from\s*\(\s*new\s+Set\s*\(\s*values\s*\)\s*\)/i, /new\s+Set\s*\(\s*values\s*\)/i, /values\.filter\s*\(/i],
      [/module\.exports\s*=\s*\{\s*unique\s*\}/i, /export\s+(default\s+)?(function\s+)?unique/i, /export\s*\{\s*unique\s*\}/i, /function\s+unique/i],
    ],
  };
}

export function scoreCodeRepairResponse(output: string, fixture: CodeRepairFixture): { score: number; passed: boolean; matched: string[]; missing: number[] } {
  const matched: string[] = [];
  const missing: number[] = [];
  const requirements = fixture.acceptancePatterns.length > 0
    ? fixture.acceptancePatterns
    : fixture.expectedTokens.map((token) => [new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')]);

  requirements.forEach((patterns, index) => {
    const pattern = patterns.find((candidate) => candidate.test(output));
    if (pattern) matched.push(pattern.source);
    else missing.push(index);
  });

  return { score: Math.round((matched.length / requirements.length) * 100), passed: missing.length === 0, matched, missing };
}

export function summarizeRepeatSamples(samples: RepeatSample[]): RepeatSummary {
  if (samples.length === 0) return { attempts: 0, successRate: 0 };
  const latencies = samples.map((sample) => sample.latencyMs).filter((value) => value >= 0).sort((a, b) => a - b);
  const percentile = (p: number) => latencies[Math.min(latencies.length - 1, Math.floor((latencies.length - 1) * p))];
  return {
    attempts: samples.length,
    successRate: samples.filter((sample) => sample.ok).length / samples.length,
    p50LatencyMs: latencies.length > 0 ? percentile(0.5) : undefined,
    p95LatencyMs: latencies.length > 0 ? percentile(0.95) : undefined,
  };
}
