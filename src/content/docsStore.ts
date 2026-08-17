// =========================================================================
// API-QuickCheck Builtin Docs Content Store
// Static string embeddings to guarantee 100% bundle reliability across all
// cloud environments (Vercel, GitHub Pages, Netlify, Cloudflare Workers)
// =========================================================================

export const EMBEDDED_DOCS: Record<string, string> = {
  './docs/01-intro/about.md': `---
title: 关于 API-QuickCheck
category: intro
categoryTitle: 简介
order: 1
subtitle: 专为开发者与企业打造的开源、无状态、高透明度的 AI API 质量审计平台。
---

## 1. 平台简介

随着大语言模型（LLM）生态的快速演进，API 中转服务、企业网关与聚合路由层出不穷。然而，市场上充斥着“劣质中转”、“偷换底层小模型”、“虚假流式缓冲”、“截断长上下文”以及“伪造推理思考链”等欺诈与损耗现象。

**API-QuickCheck** 应运而生。我们拒绝简单的黑盒二元标签，致力于打造一个面向开发者社区与企业采购的 **AI API 质量审计平台（AI API Audit Platform）** —— 类似 AI API 领域的 **“CPU-Z + Geekbench + VirusTotal”**。

平台提供一键式、非侵入式、多维度的自动化探针探测，实时输出权威的接口质量指纹、协议完整性诊断与详细证据链报告。

## 2. 平台核心理念

### 1. 绝对透明与客观公正
我们坚持所有测试探针、打分规则、统计学算法及判定逻辑完全开源、公开透明，不掺杂任何商业排名偏见，为开发者提供可复现、可追溯的客观基准。

### 2. 纯前端无状态安全（Zero-Data Retention）
安全是接口测试的底线。API-QuickCheck 采用纯前端客户端直连架构：
* **零服务端中转**：所有的 API 探测请求直接由用户的浏览器向目标 Base URL 发起，不经过任何第三方服务器中继；
* **内存即抛**：您的 API Key 与端点配置仅保存在本地浏览器内存中，页面刷新即销毁，绝不在任何数据库中持久化或上传；
* **企业网络合规**：天然支持内网专线与私有网关的连通性测试，不泄露任何企业网络拓扑。

### 3. 从“猜真伪”到“全景质量审计”
不再局限于问“你是不是某个模型”，而是全面审计：
* **协议完整性**：原生流式事件、Structured Outputs、工具调用与参数是否完好透传；
* **能力一致性**：受控工具闭环、代码修复补丁与长上下文针尖检索；
* **运行质量**：真实 TTFT、TPS 流速吞吐、Jitter 抖动方差与首字延迟波动。

## 3. 快速接入与使用

在顶部导航栏切换至 **「中转站检测」** 或 **「API Key 批量」** 即可立即开始快速评估。您也可以通过右上角的「复制配置」将测通的 API 快速导入 Claude Code、Cline、Cursor 等编程 Agent 工具中。
`,

  './docs/01-intro/frontier-model-baseline-2026-08-16.md': `---
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
| OpenAI | \`gpt-5.6-sol\` | 旗舰复杂推理与自主代码 (Flagship) | Responses |
| OpenAI | \`gpt-5.6-terra\` | 均衡全能工作马 (Balanced) | Responses |
| OpenAI | \`gpt-5.6-luna\` | 极速低延迟轻量级 (High-Throughput) | Responses |
| OpenAI | \`o3\` | 深度强化推理系统 (Deep Reasoning) | Responses |
| OpenAI | \`gpt-4.5-preview\` | 知识与文风密集型旗舰 (Creative & Knowledge) | Responses |
| Anthropic | \`claude-fable-5\` | 全能旗舰与顶尖编程 (Next-Gen Flagship) | Messages |
| Anthropic | \`claude-opus-5\` | 顶尖编程与深度推理 (Enterprise Reasoning) | Messages |
| Anthropic | \`claude-sonnet-5\` | 均衡主力工作马 (Balanced Agent) | Messages |
| Google | \`gemini-3.1-pro-preview\` | 多模态与长上下文旗舰 (Multimodal Frontier) | Interactions |
| Google | \`gemini-3.7-flash\` | 极速代码与 Agent 工作马 (Ultra Fast) | Interactions |
| Google | \`gemini-2.0-flash\` | 通用高效多模态 (Universal Speed) | Interactions |
| DeepSeek | \`deepseek-reasoner\` | 开源深度推理领航 (Deep Reasoning R1) | ChatCompletions |
| DeepSeek | \`deepseek-chat\` | MoE 超高性价比全能 (MoE General V3) | ChatCompletions |
| xAI | \`grok-4.6\` | 全模态实时推理与代码 (Realtime Agent) | Responses |
| xAI | \`grok-3\` | 旗舰推理与通用计算 (Flagship Reasoning) | Responses |

## 2. 官方依据与资料索引

- [OpenAI 官方开发文档与模型目录](https://developers.openai.com/api/docs/models)
- [Anthropic 官方模型与 Messages API 指南](https://docs.anthropic.com/en/docs/about-claude/models/overview)
- [Google Gemini API 官方文档与 Interactions 规范](https://ai.google.dev/gemini-api/docs/models)
- [xAI 官方 API 文档与 Grok 4.6 规格](https://docs.x.ai/developers/models)
`,

  './docs/02-algorithms/overview.md': `---
title: 前沿模型 API 鉴别框架
category: algorithms
categoryTitle: 鉴别算法
order: 1
subtitle: 面向 2026 前沿模型的证据分层、原生协议与差分能力评估框架；避免将黑盒猜测包装为身份认证。
---

## 1. 审计目标与边界

API-QuickCheck 审计的是**某个端点对其声明模型与能力的符合程度**，不是从单次文本回答中“证明模型来源”。除非厂商提供可独立验证的来源证明，黑盒测试只能给出带置信度的证据，不应输出“100% 官方正品”。

报告必须拆分为三个独立结论：

| 结论层 | 回答的问题 | 不能回答的问题 |
| :--- | :--- | :--- |
| **协议保真** | 原生请求、事件流、工具和参数是否被正确转发 | 底层究竟是哪一个模型 |
| **能力一致性** | 目标端点在可复现实验中是否接近同版本官方基线 | 代理的地区、服务等级或负载原因 |
| **运行质量** | 上下文、延迟、稳定性、usage 与计费是否符合声明 | 模型身份 |

## 2. 版本化参考基线

每一个 \`provider + model_id + API surface + region + service tier\` 都是独立基线。基线必须来自同日或近似日期的官方端点，记录：请求 JSON、完整事件序列、功能声明、模型快照、随机种子、响应与费用。

不要把以下项目当作身份指纹：回答文风、幽默程度、Tokenizer 估算、固定 TPS 阈值、知识截止日期或“是否自称某模型”。它们都容易被系统提示、联网工具、地区负载和网关缓存改变。

## 3. 探针分层

### P0：声明与原生协议
验证 Models API 元数据、实际路由、认证头、请求字段、错误码、SSE/Responses/Interactions 事件顺序、工具调用 ID 与严格 JSON Schema。P0 失败说明**兼容性或透传问题**，不自动说明模型造假。

### P1：参数与状态连续性
随机化并成对对比 \`reasoning_effort\` / \`thinking_level\` / adaptive thinking、缓存、跨轮会话、工具回传、拒答和中止状态。须保留厂商规定的不透明思考签名；签名连续可作为协议证据。

### P2：能力差分
对目标端点、官方基线和若干负样本同时运行动态题集：受控工具闭环、代码补丁与测试、长上下文多位置检索、图像/图表理解、约束 JSON。

### P3：运行质量
按地区、时段和并发级别采集 TTFT、流式间隔、成功率、p50/p95 延迟、可接受上下文上限与 usage。
`,

  './docs/02-algorithms/claude.md': `---
title: Anthropic Claude 鉴别算法
category: algorithms
categoryTitle: 鉴别算法
order: 2
subtitle: 以 Messages API、adaptive thinking、工具/缓存连续性和差分能力基线评估 Claude Fable 5、Opus 5、Sonnet 5。
---

## 1. 目标与前提

当前优先目标是 \`claude-fable-5\`、\`claude-opus-5\`、\`claude-sonnet-5\`。Fable 5 是广泛可用的最高能力型号；Claude 5 系列使用 **adaptive thinking**。

## 2. Claude 原生协议探针

使用 \`/v1/messages\` 与 \`anthropic-version\`，而不是仅使用 OpenAI 兼容端点。每项记录请求、SSE 原始事件、响应头与错误体。

| 探针 | 验证内容 | 失败含义 |
| :--- | :--- | :--- |
| Adaptive thinking | \`thinking: {type:"adaptive"}\` 与 \`output_config.effort\` 的接受和语义 | 可能是旧模型、兼容层或参数未透传 |
| 工具事件 | \`tool_use\`、\`input_json_delta\`、工具回传后的下一轮行为 | 工具协议损耗，不直接证明换模型 |
| 思考签名连续性 | 将原样保留的 thinking block 与 opaque \`signature\` 回传下一轮 | 签名/会话被网关破坏 |
| Prompt cache | 受支持的 cache control 与 usage 的缓存字段、跨轮一致性 | 缓存不可用、服务层限制或转换损耗 |
| 模型元数据 | \`/v1/models\` 的 ID、能力和上下文声明 | 仅为声明证据，不能单独认证 |

## 3. 能力一致性实验

对每个声明型号与同日官方基线做成对测试，至少覆盖：
- 动态工具链：模型必须选择工具、参数通过 schema、消费工具结果并修正最终答案；
- 代码修复：在固定小型仓库中提交补丁并通过隐藏测试；
- 长上下文：多位置、多轮 needle 检索与冲突消解；
- 图像/文档：OCR、图表字段提取与跨模态约束。
`,

  './docs/02-algorithms/openai.md': `---
title: OpenAI GPT 鉴别算法
category: algorithms
categoryTitle: 鉴别算法
order: 3
subtitle: 以 GPT-5.6 的 Responses API、严格结构化输出、工具调用闭环和版本化官方差分基线为核心。
---

## 1. 目标模型与 API 面

当前目标为 \`gpt-5.6-sol\`（旗舰能力）、\`gpt-5.6-terra\`（能力/成本平衡）与 \`gpt-5.6-luna\`（高吞吐）。优先使用 \`/v1/responses\`。

## 2. 协议保真探针

| 探针 | 必测行为 | 正确的判定方式 |
| :--- | :--- | :--- |
| Strict structured output | \`text.format\` 下嵌套 JSON Schema、\`strict: true\` | 校验完整 schema；必须区分 \`refusal\`、\`incomplete\` 与格式错误 |
| Function tools | 输出 function call、arguments 增量、回传 \`function_call_output\` 后的最终答案 | 必须验证模型确实使用工具结果 |
| Reasoning 配置 | 改变 \`reasoning.effort\`，观察合法响应、usage/延迟分布与任务收益 | 不要求暴露内部思维链；缺少字段不是造假证据 |
| 多模态与长上下文 | 图像/图表任务和多位置 NIAH | 按具体型号已声明能力选择长度与模态 |

## 3. 差分能力集

使用随机化、可自动判分的任务集：约束式 JSON、工具回合、代码补丁 + 隐藏测试、图像表格提取、长上下文冲突检索。每题同时运行目标、官方 Sol/Terra/Luna 基线及必要的负样本，比较通过率差与置信区间。
`,

  './docs/02-algorithms/gemini.md': `---
title: Google Gemini 鉴别算法
category: algorithms
categoryTitle: 鉴别算法
order: 4
subtitle: 围绕 Gemini 3.1 Pro Preview 与 Gemini 3.7 Flash 的原生 Interactions 路由与多模态审计。
---

## 1. 目标与适配器

当前以 \`gemini-3.1-pro-preview\`（高能力推理）和 \`gemini-3.7-flash\`（GA 工作马）为主要基线。Gemini 3 的新开发应优先使用 **Interactions API**。

## 2. 原生协议与状态探针

| 探针 | 验证内容 | 边界 |
| :--- | :--- | :--- |
| Stateful interaction | \`store: true\`、\`previous_interaction_id\` 的跨轮连续性 | 应由服务端管理上下文与 thought blocks |
| Stateless thought signature | 需要手动维护历史时，原样回传 thought blocks 与 signatures | signature 用于连续推理 |
| Thinking level | \`thinking_level\` 的合法值、配置响应与任务/延迟分布 | 不以是否公开思考文本评分 |
| 工具与结构化输出 | 函数工具、工具结果、JSON schema 的端到端闭环 | 必须执行工具并验证最终答案受结果影响 |

## 3. 多模态与上下文差分

Gemini 的高价值探针是可判分的图像、图表、PDF/视频片段理解，以及多位置 NIAH。每次试验都随机化 needle、位置、干扰项和问题形式。
`,

  './docs/02-algorithms/grok.md': `---
title: xAI Grok 鉴别算法
category: algorithms
categoryTitle: 鉴别算法
order: 5
subtitle: 围绕 Grok 4.6 的 Responses API、可配置推理、工具闭环和 500k 上下文的证据分层审计。
---

## 1. 目标模型

当前主要目标为 \`grok-4.6\`：xAI 将其定义为面向代码与通用任务的旗舰模型，支持可配置 reasoning、图像输入、文本输出、500k 上下文及 function/web/X/code 工具。

## 2. 原生协议探针

优先使用 \`/v1/responses\`；Chat Completions 作为兼容性补充。对于每个任务记录 Responses 输出项、工具调用 ID、参数增量、工具结果回传和中止/拒答状态。

| 探针 | 验证内容 |
| :--- | :--- |
| Reasoning 配置 | \`reasoning_effort\` 的 low / medium / high / xhigh 可用性与任务表现分布 |
| Agent 工具闭环 | function、web search、X search、code execution 的选择、参数、真实执行和结果消费 |
| Structured output | 严格 JSON schema 与工具组合时的 schema 完整性 |
| 上下文和视觉 | 不超过 500k 的多位置检索、图像/图表问答和跨模态约束 |
`
};
