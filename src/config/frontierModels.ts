import { FrontierModelDefinition } from '../types/audit';

export const FRONTIER_MODELS: FrontierModelDefinition[] = [
  {
    id: 'gpt-5.6-sol', provider: 'openai', displayName: 'GPT-5.6 Sol', surface: 'responses', tier: 'frontier',
    protocolCapabilities: ['responses', 'strict-json', 'function-tools', 'reasoning-effort'],
    benchmarkFocus: ['hard-tool-planning', 'code-repair', 'vision', '64k-context'],
  },
  {
    id: 'gpt-5.6-terra', provider: 'openai', displayName: 'GPT-5.6 Terra', surface: 'responses', tier: 'balanced',
    protocolCapabilities: ['responses', 'strict-json', 'function-tools', 'reasoning-effort'],
    benchmarkFocus: ['tool-planning', 'code-repair', 'vision', '64k-context'],
  },
  {
    id: 'gpt-5.6-luna', provider: 'openai', displayName: 'GPT-5.6 Luna', surface: 'responses', tier: 'efficient',
    protocolCapabilities: ['responses', 'strict-json', 'function-tools', 'reasoning-effort'],
    benchmarkFocus: ['structured-output', 'routine-tools', 'data-extraction', 'runtime-quality'],
  },
  {
    id: 'claude-fable-5', provider: 'anthropic', displayName: 'Claude Fable 5', surface: 'messages', tier: 'frontier',
    protocolCapabilities: ['messages', 'adaptive-thinking', 'thinking-continuity', 'tool-use', 'prompt-cache'],
    benchmarkFocus: ['agent-tool-chain', 'two-turn-code-repair', 'vision', '64k-context'],
  },
  {
    id: 'claude-opus-5', provider: 'anthropic', displayName: 'Claude Opus 5', surface: 'messages', tier: 'frontier',
    protocolCapabilities: ['messages', 'adaptive-thinking', 'thinking-continuity', 'tool-use', 'prompt-cache'],
    benchmarkFocus: ['complex-code', 'tool-correction', 'context-conflict', 'vision'],
  },
  {
    id: 'claude-sonnet-5', provider: 'anthropic', displayName: 'Claude Sonnet 5', surface: 'messages', tier: 'balanced',
    protocolCapabilities: ['messages', 'adaptive-thinking', 'thinking-continuity', 'tool-use', 'prompt-cache'],
    benchmarkFocus: ['mid-high-tools', 'code-repair', 'vision', 'context'],
  },
  {
    id: 'gemini-3.1-pro-preview', provider: 'gemini', displayName: 'Gemini 3.1 Pro Preview', surface: 'interactions', tier: 'preview',
    protocolCapabilities: ['interactions', 'stateful-history', 'thought-signature', 'thinking-level', 'function-tools'],
    benchmarkFocus: ['pdf-chart', 'image-constraints', 'hard-reasoning', '64k-context'],
  },
  {
    id: 'gemini-3.7-flash', provider: 'gemini', displayName: 'Gemini 3.7 Flash', surface: 'interactions', tier: 'efficient',
    protocolCapabilities: ['interactions', 'stateful-history', 'thought-signature', 'thinking-level', 'function-tools'],
    benchmarkFocus: ['multimodal-extraction', 'routine-agent-tools', 'medium-context', 'runtime-quality'],
  },
  {
    id: 'grok-4.6', provider: 'xai', displayName: 'Grok 4.6', surface: 'responses', tier: 'frontier',
    protocolCapabilities: ['responses', 'reasoning-effort', 'strict-json', 'function-tools'],
    benchmarkFocus: ['controlled-tools', 'code-repair', 'vision', '64k-context'],
  },
];

export const findFrontierModel = (id: string) => FRONTIER_MODELS.find((model) => model.id === id);
