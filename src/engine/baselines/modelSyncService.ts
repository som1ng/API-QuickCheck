// ==========================================================
// API-QuickCheck 2026 Frontier Models Baseline Synchronizer
// Supports both in-browser client fetch and Node.js CLI scripts
// ==========================================================

export interface FrontierModelEntry {
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'DeepSeek' | 'xAI' | 'Meta' | string;
  modelId: string;
  name: string;
  tier: string;
  surface: 'Responses' | 'Messages' | 'Interactions' | 'ChatCompletions';
  contextLength?: number;
  releaseDate?: string;
  notes: string;
}

export interface ModelSyncResult {
  updatedAt: string;
  totalModels: number;
  models: FrontierModelEntry[];
  rawMarkdown: string;
}

export const FALLBACK_2026_MODELS: FrontierModelEntry[] = [
  {
    provider: 'OpenAI',
    modelId: 'gpt-5.6-sol',
    name: 'GPT-5.6 Sol',
    tier: '旗舰复杂推理与自主代码 (Flagship)',
    surface: 'Responses',
    contextLength: 256000,
    notes: 'OpenAI 新代旗舰推理与代码模型；`gpt-5.6` 别名自动路由至此',
  },
  {
    provider: 'OpenAI',
    modelId: 'gpt-5.6-terra',
    name: 'GPT-5.6 Terra',
    tier: '均衡全能工作马 (Balanced)',
    surface: 'Responses',
    contextLength: 200000,
    notes: '通用均衡型高性价比旗舰，适合大部分复杂 Agent 编排',
  },
  {
    provider: 'OpenAI',
    modelId: 'gpt-5.6-luna',
    name: 'GPT-5.6 Luna',
    tier: '极速低延迟轻量级 (High-Throughput)',
    surface: 'Responses',
    contextLength: 128000,
    notes: '高吞吐成本敏感型，亚秒级延迟',
  },
  {
    provider: 'OpenAI',
    modelId: 'o3',
    name: 'OpenAI o3',
    tier: '深度强化推理系统 (Deep Reasoning)',
    surface: 'Responses',
    contextLength: 200000,
    notes: '前沿思维链强化推理模型，用于数学、竞赛代码与科学推演',
  },
  {
    provider: 'OpenAI',
    modelId: 'gpt-4.5-preview',
    name: 'GPT-4.5',
    tier: '知识与文风密集型旗舰 (Creative & Knowledge)',
    surface: 'Responses',
    contextLength: 128000,
    notes: '超大参数规模知识检索与创作模型',
  },
  {
    provider: 'Anthropic',
    modelId: 'claude-fable-5',
    name: 'Claude Fable 5',
    tier: '全能旗舰与顶尖编程 (Next-Gen Flagship)',
    surface: 'Messages',
    contextLength: 500000,
    notes: '广泛可用最高能力，原生支持 Adaptive Thinking',
  },
  {
    provider: 'Anthropic',
    modelId: 'claude-mythos-5',
    name: 'Claude Mythos 5',
    tier: 'Project Glasswing 邀请制 (Enterprise Frontier)',
    surface: 'Messages',
    contextLength: 1000000,
    notes: '顶级企业与战略研究专用，需独立官方签名基线验证',
  },
  {
    provider: 'Anthropic',
    modelId: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    tier: '混合推理与代码旗舰 (Hybrid Reasoning)',
    surface: 'Messages',
    contextLength: 200000,
    notes: '行业标准编程与复杂架构分析基准，支持动态思考预算控制',
  },
  {
    provider: 'Anthropic',
    modelId: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet v2',
    tier: '生产级高能稳定 (Production Benchmark)',
    surface: 'Messages',
    contextLength: 200000,
    notes: '成熟生产环境首选基线，用于常规降级与防冒充检测',
  },
  {
    provider: 'Google',
    modelId: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    tier: '多模态与长上下文旗舰 (Multimodal Frontier)',
    surface: 'Interactions',
    contextLength: 2000000,
    notes: '超长上下文深度推演，支持 Thought Signatures 跨轮保持',
  },
  {
    provider: 'Google',
    modelId: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    tier: '极速代码与 Agent 工作马 (Ultra Fast)',
    surface: 'Interactions',
    contextLength: 1000000,
    notes: 'GA 生产级 Agent 调度模型，低延迟高并发吞吐',
  },
  {
    provider: 'Google',
    modelId: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    tier: '通用高效多模态 (Universal Speed)',
    surface: 'Interactions',
    contextLength: 1000000,
    notes: '高性价比实时交互与视觉理解基线',
  },
  {
    provider: 'DeepSeek',
    modelId: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    tier: '开源深度推理领航 (Deep Reasoning R1)',
    surface: 'ChatCompletions',
    contextLength: 128000,
    notes: '开源思维链推理模型，包含完整推理思考内容 (reasoning_content)',
  },
  {
    provider: 'DeepSeek',
    modelId: 'deepseek-chat',
    name: 'DeepSeek V3',
    tier: 'MoE 超高性价比全能 (MoE General V3)',
    surface: 'ChatCompletions',
    contextLength: 128000,
    notes: '671B MoE 架构通用基线，代码与中英双语能力强劲',
  },
  {
    provider: 'xAI',
    modelId: 'grok-4.6',
    name: 'Grok 4.6',
    tier: '全模态实时推理与代码 (Realtime Agent)',
    surface: 'Responses',
    contextLength: 256000,
    notes: '原生集成 X 实时搜索、Python 代码沙箱与结构化工具消费',
  },
  {
    provider: 'xAI',
    modelId: 'grok-3',
    name: 'Grok 3',
    tier: '旗舰推理与通用计算 (Flagship Reasoning)',
    surface: 'Responses',
    contextLength: 131072,
    notes: 'xAI 核心主力推理模型',
  },
  {
    provider: 'Meta',
    modelId: 'llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    tier: '开源生态主流基准 (Open-Source Standard)',
    surface: 'ChatCompletions',
    contextLength: 128000,
    notes: '开源权重顶尖指令微调模型，常作为私有中转站对照',
  },
];

/**
 * Generates the full Markdown content for 2026 Frontier Models Baseline
 */
export function generateFrontierModelsMarkdown(models: FrontierModelEntry[], dateStr: string): string {
  const tableRows = models
    .map(
      (m) =>
        `| ${m.provider} | \`${m.modelId}\` | ${m.tier} | ${m.surface} |`
    )
    .join('\n');

  const formattedDate = dateStr;

  return `---
title: 2026 前沿模型基线清单
category: intro
categoryTitle: 简介
order: 2
subtitle: 截止 ${formattedDate}，用于 API 审计的官方模型目标与原生 API 基线；支持自动与手动定时同步。
---

## 1. 2026 前沿模型基线总览

此清单由 **API-QuickCheck 自动化基线引擎** 定期维护更新，是审计器的**版本化参考基线**，而非硬编码的静态死名单。每次审计应调用对应厂商的 Models API 或读取官方目录，严格匹配型号 ID、采样日期、地区、服务层和 API 面。

| 厂商 | 主要审计目标 | 定位与能力档位 | 优先原生 API |
| :--- | :--- | :--- | :--- |
${tableRows}

## 2. 各厂商核心型号特性与审计注意事项

### OpenAI GPT-5.6 & Reasoning 系列

- **Sol、Terra、Luna 分级**：属于不同设计目标档位，不能把其中任一档的评分当作另一档“缩水”的充分证据。
- **审计重点**：优先测试 Responses API 的严格结构化 JSON Schema 输出、原生函数工具调用闭环、配置化推理思考预算和多模态图像/音频能力。
- **防冒充判定**：检查 \`system_fingerprint\` 抖动分布以及对于高难逻辑陷阱题的拒答/反思特征。

### Anthropic Claude 5 & 3.7 系列

- **Adaptive Thinking**：Claude 5 (Fable/Opus/Sonnet) 及 3.7 Sonnet 具备自适应思考机制；不可使用旧版固定字数探针强行约束。
- **Thinking Signatures**：Claude 回传的 \`signature\` 是思考块上下文连续性的加密凭据；中转站若伪造或丢失该字段，将无法正常进行多轮深入推演。

### Google Gemini 3 & 2.0 系列

- **推荐 API 界面**：优先使用 Google 官方 Interactions API 端点进行审计。
- **Thought Signatures 状态机**：用于维持跨轮深度思考状态；在 stateful interaction 模式下由服务端原生处理。Preview 预览型号的行为和可用性会动态迭代，报告中必须打上采样时间戳。

### DeepSeek R1 & V3 系列

- **Reasoning Content 完整性**：DeepSeek R1 原生返回 \`reasoning_content\` 思考过程字段，审计器将检测该字段是否被中转站二次转译、截断或由廉价模型充填。
- **MoE 响应吞吐**：DeepSeek V3 采用 671B MoE 架构，对前导 Token 生成速率有明显特征指纹。

### xAI Grok 4.6 系列

- **工具生态消费**：Grok 4.6 原生提供 function calling、实时 X 搜索检索、代码执行沙箱等集成能力。
- **审计准则**：文风和自称不能作为 100% 鉴伪依据，必须在隔离的受控测试环境中验证其函数签名和证据解析行为。

## 3. 基线更新与同步规则

1. **自动更新频率**：每 3 天由 GitHub Actions / 服务器后台脚本自动探测全球主流模型目录并更新本清单。
2. **重大发布响应**：厂商发布全新大版本（如新旗舰上线）时，自动触发基线快照重构，并对废弃型号归档并标注失效日期。
3. **证据充足性原则**：没有官方账号对照或官方文档公开验证的型号，系统仅输出协议与连接质量，绝不妄下“降级/假冒”的官方级定论。

## 4. 官方权威开发者索引

- [OpenAI Models](https://developers.openai.com/api/docs/models)
- [Anthropic Claude Models](https://docs.anthropic.com/en/docs/about-claude/models/overview)
- [Google Gemini API Models](https://ai.google.dev/gemini-api/docs/models)
- [DeepSeek Documentation](https://api-docs.deepseek.com/)
- [xAI Developer Platform](https://docs.x.ai/developers/models)
`;
}

/**
 * Online Fetcher for latest models (Supports OpenRouter API + Fallback enricher)
 */
export async function fetchLatestFrontierModels(): Promise<ModelSyncResult> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const openRouterModels = Array.isArray(data.data) ? data.data : [];

      // Map and enrich with our authoritative 2026 frontier registry
      const mappedModels: FrontierModelEntry[] = [...FALLBACK_2026_MODELS];

      // Dynamically discover newer models if present
      for (const item of openRouterModels) {
        const id = item.id ? String(item.id).toLowerCase() : '';
        const name = item.name || id;

        const isKnown = mappedModels.some(
          (m) => m.modelId.toLowerCase() === id || id.includes(m.modelId.toLowerCase())
        );

        if (!isKnown) {
          // Check if it is a major frontier model of 2025/2026
          if (
            (id.includes('claude-3-7') || id.includes('claude-4') || id.includes('claude-5')) &&
            id.includes('anthropic')
          ) {
            mappedModels.push({
              provider: 'Anthropic',
              modelId: item.id,
              name,
              tier: '前沿检测发现 (Auto-Discovered)',
              surface: 'Messages',
              contextLength: item.context_length || 200000,
              notes: item.description?.slice(0, 80) || '自动发现的最新 Anthropic 前沿模型',
            });
          } else if (
            (id.includes('gpt-5') || id.includes('o3') || id.includes('o4')) &&
            id.includes('openai')
          ) {
            mappedModels.push({
              provider: 'OpenAI',
              modelId: item.id,
              name,
              tier: '前沿检测发现 (Auto-Discovered)',
              surface: 'Responses',
              contextLength: item.context_length || 200000,
              notes: item.description?.slice(0, 80) || '自动发现的最新 OpenAI 前沿模型',
            });
          } else if (
            (id.includes('gemini-3') || id.includes('gemini-2.5')) &&
            id.includes('google')
          ) {
            mappedModels.push({
              provider: 'Google',
              modelId: item.id,
              name,
              tier: '前沿检测发现 (Auto-Discovered)',
              surface: 'Interactions',
              contextLength: item.context_length || 1000000,
              notes: item.description?.slice(0, 80) || '自动发现的最新 Google 前沿模型',
            });
          } else if (
            (id.includes('deepseek-r2') || id.includes('deepseek-v4')) &&
            id.includes('deepseek')
          ) {
            mappedModels.push({
              provider: 'DeepSeek',
              modelId: item.id,
              name,
              tier: '前沿检测发现 (Auto-Discovered)',
              surface: 'ChatCompletions',
              contextLength: item.context_length || 128000,
              notes: item.description?.slice(0, 80) || '自动发现的最新 DeepSeek 前沿模型',
            });
          }
        }
      }

      const rawMarkdown = generateFrontierModelsMarkdown(mappedModels, dateStr);
      return {
        updatedAt: dateStr,
        totalModels: mappedModels.length,
        models: mappedModels,
        rawMarkdown,
      };
    }
  } catch (err) {
    console.warn('[ModelSync] Remote fetch failed or timed out, using fallback 2026 registry:', err);
  }

  // Fallback to built-in comprehensive 2026 registry
  const rawMarkdown = generateFrontierModelsMarkdown(FALLBACK_2026_MODELS, dateStr);
  return {
    updatedAt: dateStr,
    totalModels: FALLBACK_2026_MODELS.length,
    models: FALLBACK_2026_MODELS,
    rawMarkdown,
  };
}
