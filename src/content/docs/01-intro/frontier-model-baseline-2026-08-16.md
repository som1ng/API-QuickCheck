---
title: 2026 前沿模型基线清单
category: intro
categoryTitle: 简介
order: 2
subtitle: 截止 2026-08-17，用于 API 审计的官方模型目标与原生 API 基线；支持自动与手动定时同步。
---

## 1. 2026 前沿模型基线总览

此清单由 **API-QuickCheck 自动化基线引擎** 定期维护更新，是审计器的**版本化参考基线**，而非硬编码的静态死名单。每次审计应调用对应厂商的 Models API 或读取官方目录，严格匹配型号 ID、采样日期、地区、服务层和 API 面。

| 厂商 | 主要审计目标 | 定位与能力档位 | 优先原生 API |
| :--- | :--- | :--- | :--- |
| OpenAI | `gpt-5.6-sol` | 旗舰复杂推理与自主代码 (Flagship) | Responses |
| OpenAI | `gpt-5.6-terra` | 均衡全能工作马 (Balanced) | Responses |
| OpenAI | `gpt-5.6-luna` | 极速低延迟轻量级 (High-Throughput) | Responses |
| OpenAI | `o3` | 深度强化推理系统 (Deep Reasoning) | Responses |
| OpenAI | `gpt-4.5-preview` | 知识与文风密集型旗舰 (Creative & Knowledge) | Responses |
| Anthropic | `claude-fable-5` | 全能旗舰与顶尖编程 (Next-Gen Flagship) | Messages |
| Anthropic | `claude-mythos-5` | Project Glasswing 邀请制 (Enterprise Frontier) | Messages |
| Anthropic | `claude-3-7-sonnet-20250219` | 混合推理与代码旗舰 (Hybrid Reasoning) | Messages |
| Anthropic | `claude-3-5-sonnet-20241022` | 生产级高能稳定 (Production Benchmark) | Messages |
| Google | `gemini-3.1-pro-preview` | 多模态与长上下文旗舰 (Multimodal Frontier) | Interactions |
| Google | `gemini-3.7-flash` | 极速代码与 Agent 工作马 (Ultra Fast) | Interactions |
| Google | `gemini-2.0-flash` | 通用高效多模态 (Universal Speed) | Interactions |
| DeepSeek | `deepseek-reasoner` | 开源深度推理领航 (Deep Reasoning R1) | ChatCompletions |
| DeepSeek | `deepseek-chat` | MoE 超高性价比全能 (MoE General V3) | ChatCompletions |
| xAI | `grok-4.6` | 全模态实时推理与代码 (Realtime Agent) | Responses |
| xAI | `grok-3` | 旗舰推理与通用计算 (Flagship Reasoning) | Responses |
| Meta | `llama-3.3-70b-instruct` | 开源生态主流基准 (Open-Source Standard) | ChatCompletions |
| DeepSeek | `deepseek/deepseek-v4-pro-0813` | 前沿检测发现 (Auto-Discovered) | ChatCompletions |
| DeepSeek | `~deepseek/deepseek-v4-flash-latest` | 前沿检测发现 (Auto-Discovered) | ChatCompletions |
| DeepSeek | `deepseek/deepseek-v4-flash-0731` | 前沿检测发现 (Auto-Discovered) | ChatCompletions |
| Google | `google/gemini-3.6-flash` | 前沿检测发现 (Auto-Discovered) | Interactions |
| Google | `google/gemini-3.5-flash-lite` | 前沿检测发现 (Auto-Discovered) | Interactions |
| Google | `google/gemini-3.1-flash-lite-image` | 前沿检测发现 (Auto-Discovered) | Interactions |
| Google | `google/gemini-3.1-flash-image` | 前沿检测发现 (Auto-Discovered) | Interactions |
| Google | `google/gemini-3-pro-image` | 前沿检测发现 (Auto-Discovered) | Interactions |
| Google | `google/gemini-3.5-flash` | 前沿检测发现 (Auto-Discovered) | Interactions |
| Google | `google/gemini-3.1-flash-lite` | 前沿检测发现 (Auto-Discovered) | Interactions |
| OpenAI | `openai/gpt-5.5-pro` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.5` | 前沿检测发现 (Auto-Discovered) | Responses |
| DeepSeek | `deepseek/deepseek-v4-pro` | 前沿检测发现 (Auto-Discovered) | ChatCompletions |
| DeepSeek | `deepseek/deepseek-v4-flash` | 前沿检测发现 (Auto-Discovered) | ChatCompletions |
| OpenAI | `openai/gpt-5.4-image-2` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.4-nano` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.4-mini` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.4-pro` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.4` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.3-codex` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.2-codex` | 前沿检测发现 (Auto-Discovered) | Responses |
| Google | `google/gemini-3-flash-preview` | 前沿检测发现 (Auto-Discovered) | Interactions |
| OpenAI | `openai/gpt-5.2-chat` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.2-pro` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.2` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.1-codex-max` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5.1` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5-image-mini` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5-image` | 前沿检测发现 (Auto-Discovered) | Responses |
| Google | `google/gemini-2.5-flash-image` | 前沿检测发现 (Auto-Discovered) | Interactions |
| OpenAI | `openai/gpt-5-pro` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5-codex:batch` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/gpt-5` | 前沿检测发现 (Auto-Discovered) | Responses |
| Google | `google/gemini-2.5-flash-lite` | 前沿检测发现 (Auto-Discovered) | Interactions |
| Google | `google/gemini-2.5-flash` | 前沿检测发现 (Auto-Discovered) | Interactions |
| Google | `google/gemini-2.5-pro` | 前沿检测发现 (Auto-Discovered) | Interactions |
| OpenAI | `openai/o4-mini-high` | 前沿检测发现 (Auto-Discovered) | Responses |
| OpenAI | `openai/o4-mini` | 前沿检测发现 (Auto-Discovered) | Responses |

## 2. 各厂商核心型号特性与审计注意事项

### OpenAI GPT-5.6 & Reasoning 系列

- **Sol、Terra、Luna 分级**：属于不同设计目标档位，不能把其中任一档的评分当作另一档“缩水”的充分证据。
- **审计重点**：优先测试 Responses API 的严格结构化 JSON Schema 输出、原生函数工具调用闭环、配置化推理思考预算和多模态图像/音频能力。
- **防冒充判定**：检查 `system_fingerprint` 抖动分布以及对于高难逻辑陷阱题的拒答/反思特征。

### Anthropic Claude 5 & 3.7 系列

- **Adaptive Thinking**：Claude 5 (Fable/Opus/Sonnet) 及 3.7 Sonnet 具备自适应思考机制；不可使用旧版固定字数探针强行约束。
- **Thinking Signatures**：Claude 回传的 `signature` 是思考块上下文连续性的加密凭据；中转站若伪造或丢失该字段，将无法正常进行多轮深入推演。

### Google Gemini 3 & 2.0 系列

- **推荐 API 界面**：优先使用 Google 官方 Interactions API 端点进行审计。
- **Thought Signatures 状态机**：用于维持跨轮深度思考状态；在 stateful interaction 模式下由服务端原生处理。Preview 预览型号的行为和可用性会动态迭代，报告中必须打上采样时间戳。

### DeepSeek R1 & V3 系列

- **Reasoning Content 完整性**：DeepSeek R1 原生返回 `reasoning_content` 思考过程字段，审计器将检测该字段是否被中转站二次转译、截断或由廉价模型充填。
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
