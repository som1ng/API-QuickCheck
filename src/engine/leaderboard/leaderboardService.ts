import aaSnapshotRaw from '../../content/leaderboards/aa-models.json';
import arenaSnapshotRaw from '../../content/leaderboards/arena-agents.json';
import { AaModelRow, ArenaAgentRow, LeaderboardSnapshot } from '../../types/leaderboard';

export type AaSortKey =
  | 'intelligence'
  | 'speed'
  | 'latency'
  | 'totalResponse'
  | 'cost'
  | 'context'
  | 'rank';

export type ArenaSortKey =
  | 'netImprovement'
  | 'confirmedSuccess'
  | 'praiseVsComplaint'
  | 'steerability'
  | 'bashRecovery'
  | 'toolHallucination'
  | 'sessions'
  | 'cost'
  | 'outputTokens'
  | 'rank';

export type SortDirection = 'asc' | 'desc';

export type CapabilityDimension =
  | 'all'
  | 'reasoning'
  | 'longContext'
  | 'highSpeed'
  | 'lowLatency'
  | 'costEfficient'
  | 'lowHallucination';

export const aaSnapshot: LeaderboardSnapshot<AaModelRow> = aaSnapshotRaw as LeaderboardSnapshot<AaModelRow>;
export const arenaSnapshot: LeaderboardSnapshot<ArenaAgentRow> = arenaSnapshotRaw as LeaderboardSnapshot<ArenaAgentRow>;

export function getAaModelsSnapshot(): LeaderboardSnapshot<AaModelRow> {
  return aaSnapshot;
}

export function getArenaAgentsSnapshot(): LeaderboardSnapshot<ArenaAgentRow> {
  return arenaSnapshot;
}

/**
 * Extracts reasoning level tag from model name if present
 */
export function extractReasoningLevel(name: string): string | null {
  const match = name.match(/\((max|xhigh|high|medium|low|thinking|with fallback)\)/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Filter and sort Artificial Analysis models
 */
export function filterAndSortAaModels(
  rows: AaModelRow[],
  query: string,
  selectedCreator: string,
  sortKey: AaSortKey,
  sortDir: SortDirection = 'desc',
  dimension: CapabilityDimension = 'all'
): AaModelRow[] {
  let result = [...rows];

  // 1. Filter by Creator / Lab
  if (selectedCreator && selectedCreator !== 'all') {
    const creatorLower = selectedCreator.toLowerCase();
    result = result.filter((row) => {
      const rowCreator = row.creator.toLowerCase();
      if (creatorLower === 'xai' || creatorLower === 'spacexai') {
        return rowCreator.includes('xai') || rowCreator.includes('spacexai') || rowCreator.includes('x.ai');
      }
      if (creatorLower === 'z.ai' || creatorLower === 'zai' || creatorLower === 'z ai') {
        return rowCreator.includes('z ai') || rowCreator.includes('z.ai') || rowCreator.includes('zai');
      }
      return rowCreator.includes(creatorLower);
    });
  }

  // 2. Filter by Capability Dimension
  if (dimension && dimension !== 'all') {
    result = result.filter((row) => {
      switch (dimension) {
        case 'reasoning': {
          const lvl = extractReasoningLevel(row.name);
          return lvl === 'max' || lvl === 'xhigh' || lvl === 'high' || lvl === 'thinking' || row.name.toLowerCase().includes('reasoning');
        }
        case 'longContext':
          return (row.contextWindow || 0) >= 1000000;
        case 'highSpeed':
          return (row.medianTokensPerSec || 0) >= 100;
        case 'lowLatency':
          return row.latencyFirstChunkSec !== null && row.latencyFirstChunkSec <= 1.0;
        case 'costEfficient':
          return row.costPerTaskUsd !== null && row.costPerTaskUsd <= 0.10;
        default:
          return true;
      }
    });
  }

  // 3. Filter by search query
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.creator.toLowerCase().includes(q) ||
        (row.slug && row.slug.toLowerCase().includes(q))
    );
  }

  // 4. Sort
  result.sort((a, b) => {
    let valA: number | null = null;
    let valB: number | null = null;

    switch (sortKey) {
      case 'intelligence':
        valA = a.intelligenceIndex;
        valB = b.intelligenceIndex;
        break;
      case 'speed':
        valA = a.medianTokensPerSec;
        valB = b.medianTokensPerSec;
        break;
      case 'latency':
        valA = a.latencyFirstChunkSec;
        valB = b.latencyFirstChunkSec;
        break;
      case 'totalResponse':
        valA = a.totalResponseSec;
        valB = b.totalResponseSec;
        break;
      case 'cost':
        valA = a.costPerTaskUsd;
        valB = b.costPerTaskUsd;
        break;
      case 'context':
        valA = a.contextWindow;
        valB = b.contextWindow;
        break;
      case 'rank':
        valA = a.rank;
        valB = b.rank;
        break;
    }

    if (valA === null && valB === null) return 0;
    if (valA === null) return 1;
    if (valB === null) return -1;

    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  return result;
}

/**
 * Filter and sort Arena Agent models
 */
export function filterAndSortArenaAgents(
  rows: ArenaAgentRow[],
  query: string,
  selectedLab: string,
  sortKey: ArenaSortKey,
  sortDir: SortDirection = 'desc',
  dimension: CapabilityDimension = 'all'
): ArenaAgentRow[] {
  let result = [...rows];

  // 1. Filter by Lab / Creator
  if (selectedLab && selectedLab !== 'all') {
    const labLower = selectedLab.toLowerCase();
    result = result.filter((row) => {
      const rowLab = row.lab.toLowerCase();
      if (labLower === 'xai' || labLower === 'spacexai') {
        return rowLab.includes('xai') || rowLab.includes('spacexai') || rowLab.includes('x.ai');
      }
      if (labLower === 'z.ai' || labLower === 'zai' || labLower === 'z ai') {
        return rowLab.includes('z ai') || rowLab.includes('z.ai') || rowLab.includes('zai');
      }
      return rowLab.includes(labLower);
    });
  }

  // 2. Filter by Capability Dimension
  if (dimension && dimension !== 'all') {
    result = result.filter((row) => {
      switch (dimension) {
        case 'reasoning': {
          const lvl = extractReasoningLevel(row.name);
          return lvl === 'max' || lvl === 'xhigh' || lvl === 'high' || row.name.toLowerCase().includes('reasoning');
        }
        case 'lowHallucination':
          return row.toolHallucinationPct !== null && row.toolHallucinationPct <= 0.8;
        case 'costEfficient':
          return row.costPerTaskP50Usd !== null && row.costPerTaskP50Usd <= 0.10;
        default:
          return true;
      }
    });
  }

  // 3. Filter by search query
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.lab.toLowerCase().includes(q) ||
        (row.license && row.license.toLowerCase().includes(q))
    );
  }

  // 4. Sort
  result.sort((a, b) => {
    let valA: number | null = null;
    let valB: number | null = null;

    switch (sortKey) {
      case 'netImprovement':
        valA = a.netImprovementPct;
        valB = b.netImprovementPct;
        break;
      case 'confirmedSuccess':
        valA = a.confirmedSuccessPct;
        valB = b.confirmedSuccessPct;
        break;
      case 'praiseVsComplaint':
        valA = a.praiseVsComplaintPct;
        valB = b.praiseVsComplaintPct;
        break;
      case 'steerability':
        valA = a.steerabilityPct;
        valB = b.steerabilityPct;
        break;
      case 'bashRecovery':
        valA = a.bashRecoveryPct;
        valB = b.bashRecoveryPct;
        break;
      case 'toolHallucination':
        valA = a.toolHallucinationPct;
        valB = b.toolHallucinationPct;
        break;
      case 'sessions':
        valA = a.sessions;
        valB = b.sessions;
        break;
      case 'cost':
        valA = a.costPerTaskP50Usd;
        valB = b.costPerTaskP50Usd;
        break;
      case 'outputTokens':
        valA = a.outputTokensP50 ?? null;
        valB = b.outputTokensP50 ?? null;
        break;
      case 'rank':
        valA = a.rank;
        valB = b.rank;
        break;
    }

    if (valA === null && valB === null) return 0;
    if (valA === null) return 1;
    if (valB === null) return -1;

    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  return result;
}

/**
 * Maps model display names from leaderboards to standard API identifiers
 */
export function mapModelToApiId(rawName: string): string {
  if (!rawName) return 'gpt-4o';

  const clean = rawName.trim();
  const lower = clean.toLowerCase();

  // Claude Models
  if (lower.includes('claude opus 5')) return 'claude-opus-5';
  if (lower.includes('claude fable 5')) return 'claude-fable-5';
  if (lower.includes('claude sonnet 5')) return 'claude-sonnet-5';
  if (lower.includes('claude 3.7') || lower.includes('claude-3-7')) return 'claude-3-7-sonnet-20250219';
  if (lower.includes('claude 3.5 sonnet') || lower.includes('claude-3-5-sonnet')) return 'claude-3-5-sonnet-20241022';
  if (lower.includes('claude 3.5 haiku') || lower.includes('claude-3-5-haiku')) return 'claude-3-5-haiku-20241022';
  if (lower.includes('claude 3 opus') || lower.includes('claude-3-opus')) return 'claude-3-opus-20240229';
  if (lower.includes('claude opus 4.8')) return 'claude-opus-4-8';
  if (lower.includes('claude opus 4.7')) return 'claude-opus-4-7';
  if (lower.includes('claude opus 4.6')) return 'claude-opus-4-6';

  // OpenAI Models
  if (lower.includes('gpt-5.6 sol') || lower.includes('gpt 5.6 sol')) return 'gpt-5.6-sol';
  if (lower.includes('gpt-5.6 terra') || lower.includes('gpt 5.6 terra')) return 'gpt-5.6-terra';
  if (lower.includes('gpt-5.6 luna') || lower.includes('gpt 5.6 luna')) return 'gpt-5.6-luna';
  if (lower.includes('gpt 5.5') || lower.includes('gpt-5.5')) return 'gpt-5.5';
  if (lower.includes('gpt 5.4') || lower.includes('gpt-5.4')) return 'gpt-5.4';
  if (lower.includes('gpt-4o-mini') || lower.includes('gpt 4o mini')) return 'gpt-4o-mini';
  if (lower.includes('gpt-4o') || lower.includes('gpt 4o')) return 'gpt-4o';
  if (lower.includes('o3-mini') || lower.includes('o3 mini')) return 'o3-mini';
  if (lower.includes('o1-mini') || lower.includes('o1 mini')) return 'o1-mini';
  if (lower.includes('o1-preview') || lower.includes('o1 preview')) return 'o1-preview';
  if (lower.startsWith('o1')) return 'o1';
  if (lower.startsWith('o3')) return 'o3';
  if (lower.startsWith('o4')) return 'o4';

  // Google Gemini Models
  if (lower.includes('gemini 3.7 flash') || lower.includes('gemini-3.7-flash')) return 'gemini-3.7-flash';
  if (lower.includes('gemini 3.5 flash-lite') || lower.includes('gemini-3.5-flash-lite')) return 'gemini-3.5-flash-lite';
  if (lower.includes('gemini 3.1 pro') || lower.includes('gemini-3.1-pro')) return 'gemini-3.1-pro-preview';
  if (lower.includes('gemini 2.5 pro') || lower.includes('gemini-2.5-pro')) return 'gemini-2.5-pro';
  if (lower.includes('gemini 2.5 flash') || lower.includes('gemini-2.5-flash')) return 'gemini-2.5-flash';
  if (lower.includes('gemini 2.0 flash') || lower.includes('gemini-2.0-flash')) return 'gemini-2.0-flash';
  if (lower.includes('gemini 1.5 pro') || lower.includes('gemini-1.5-pro')) return 'gemini-1.5-pro';

  // DeepSeek Models
  if (lower.includes('deepseek v4') || lower.includes('deepseek-v4')) return 'deepseek-v4-pro';
  if (lower.includes('deepseek r1') || lower.includes('deepseek-r1')) return 'deepseek-reasoner';
  if (lower.includes('deepseek v3') || lower.includes('deepseek-v3') || lower.includes('deepseek')) return 'deepseek-chat';

  // xAI Grok Models
  if (lower.includes('grok 4.6') || lower.includes('grok-4.6')) return 'grok-4.6';
  if (lower.includes('grok 4.5') || lower.includes('grok-4.5')) return 'grok-4.5';
  if (lower.includes('grok 4.20') || lower.includes('grok-4.20')) return 'grok-4.20';
  if (lower.includes('grok 4.1') || lower.includes('grok-4.1')) return 'grok-4.1-fast';
  if (lower.includes('grok 3') || lower.includes('grok-3')) return 'grok-3';
  if (lower.includes('grok 2') || lower.includes('grok-2')) return 'grok-2';

  // Moonshot / Kimi
  if (lower.includes('kimi k3') || lower.includes('kimi-k3')) return 'kimi-k3';
  if (lower.includes('kimi') || lower.includes('moonshot')) return 'moonshot-v1-auto';

  // Z.ai / GLM
  if (lower.includes('glm-5.3') || lower.includes('glm 5.3')) return 'glm-5.3';
  if (lower.includes('glm-5.2') || lower.includes('glm 5.2')) return 'glm-5.2';
  if (lower.includes('glm-4') || lower.includes('glm 4')) return 'glm-4-plus';

  // Alibaba Qwen
  if (lower.includes('qwen3.8 max') || lower.includes('qwen3.8-max')) return 'qwen3.8-max';
  if (lower.includes('qwen3.8') || lower.includes('qwen3-8')) return 'qwen3.8';
  if (lower.includes('qwen 2.5') || lower.includes('qwen-2.5') || lower.includes('qwen2.5')) return 'qwen-2.5-72b-instruct';

  // Generic fallback: strip parenthesized notes and convert to kebab-case
  return clean
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-');
}

/**
 * Resolves creator/lab name to a standard ProviderIcon key
 */
export function resolveProviderLogoKey(creatorOrLab: string): string {
  const c = (creatorOrLab || '').toLowerCase().trim();
  if (!c) return 'custom';

  if (c.includes('anthropic') || c.includes('claude')) return 'claude';
  if (c.includes('openai') || c.includes('chatgpt')) return 'openai';
  if (c.includes('google') || c.includes('gemini')) return 'google';
  if (c.includes('deepseek')) return 'deepseek';
  if (c.includes('spacexai') || c.includes('xai') || c.includes('x.ai') || c.includes('grok')) return 'xai';
  if (c.includes('kimi') || c.includes('moonshot')) return 'kimi';
  if (c.includes('alibaba') || c.includes('qwen') || c.includes('aliyun') || c.includes('tongyi')) return 'qwen';
  if (c.includes('z ai') || c.includes('z.ai') || c.includes('zai') || c.includes('zhipu') || c.includes('glm') || c.includes('智谱')) return 'zhipu';
  if (c.includes('meta') || c.includes('llama') || c.includes('facebook')) return 'meta';
  if (c.includes('xiaomi') || c.includes('miai') || c.includes('小米')) return 'xiaomi';
  if (c.includes('tencent') || c.includes('hunyuan') || c.includes('腾讯')) return 'tencent';
  if (c.includes('minimax') || c.includes('hailuo') || c.includes('名之梦')) return 'minimax';
  if (c.includes('mistral') || c.includes('mixtral') || c.includes('codestral') || c.includes('pixtral')) return 'mistral';
  if (c.includes('upstage') || c.includes('solar')) return 'upstage';
  if (c.includes('nvidia') || c.includes('nemotron')) return 'nvidia';
  if (c.includes('thinking machines') || c.includes('thinky')) return 'thinky';
  if (c.includes('bytedance') || c.includes('doubao') || c.includes('seed') || c.includes('字节')) return 'bytedance';
  if (c.includes('baidu') || c.includes('ernie') || c.includes('wenxin') || c.includes('百度')) return 'baidu';
  if (c.includes('stepfun') || c.includes('step') || c.includes('阶跃')) return 'stepfun';
  if (c.includes('kwai') || c.includes('kling') || c.includes('kwaikat') || c.includes('快手')) return 'kwai';
  if (c.includes('cohere') || c.includes('command')) return 'cohere';
  if (c.includes('microsoft') || c.includes('msft') || c.includes('phi')) return 'microsoft';
  if (c.includes('amazon') || c.includes('aws') || c.includes('bedrock') || c.includes('nova')) return 'amazon';
  if (c.includes('perplexity')) return 'perplexity';
  if (c.includes('ai21') || c.includes('jamba')) return 'ai21';
  if (c.includes('cerebras')) return 'cerebras';
  if (c.includes('siliconflow') || c.includes('siliconcloud')) return 'siliconflow';
  if (c.includes('openrouter')) return 'openrouter';

  return 'custom';
}
