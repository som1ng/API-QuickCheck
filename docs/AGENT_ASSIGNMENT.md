# 🤖 API-QuickCheck 2.0 多 Agent 精细化分工规划

---

## 一、开发文档最终扫描：4 个工程级问题

在正式排 Agent 任务前，对现有文档和代码做最后一轮扫描，发现以下需要在开发中明确处理的实际问题：

### 问题 1：Claude Thinking Signature 验签需要 Anthropic **原生端点**
- **现状**：大部分中转站走 OpenAI 兼容协议 (`/v1/chat/completions`)，**不支持 Anthropic 原生的 `/v1/messages` 端点**，也不透传 `thinking` 参数和 `signature` 字段。
- **影响**：这意味着 Thinking Signature 验签**只对支持 Anthropic 原生协议的中转站有效**（如直接转发到 Anthropic 的正规中转站、OpenRouter 等）。对于那些只暴露 OpenAI 兼容协议的中转站，该探针会直接失败。
- **处理方案**：
  1. `signatureVerifier.ts` 必须**先探测端点是否支持 Anthropic 协议**（尝试 POST `/v1/messages`，看是否返回合理响应而非 404）。
  2. 若不支持，该维度自动标记为 `"不适用 (N/A)"`，降级使用行为指纹探针，**不能误报为"假冒"**。
  3. 在 UI 上清晰告知用户："该中转站未开放 Anthropic 原生端点，无法进行加密级验签，已使用行为指纹替代分析。"

### 问题 2：现有 `platforms.ts` 数据资产需迁移复用
- **现状**：[src/config/platforms.ts](file:///E:/AI_workspace/Active_Projects/API-QuickCheck/src/config/platforms.ts) 已包含 **22 个服务商**的完整配置（BaseURL、认证方式、模型提取器、LiteLLM 配置），质量很高。
- **处理方案**：重构时**必须完整保留并增强**该文件，不可从零重写。子 Agent 在开发 `GlobalConfigBar` 和 `ClientExportTab` 时，必须基于此文件的 `PlatformConfig` 接口构建。

### 问题 3：Tailwind v3 暗色主题与新组件的兼容
- **现状**：项目使用 Tailwind CSS v3 + 暗色主题（`bg-[#0B0F19]` 等硬编码深色值）。没有 `darkMode` 配置，也没有 CSS 变量 Design Token。
- **处理方案**：新组件统一采用与原版一致的暗色色板（`slate-900` 系 + `blue/indigo` 强调色），保持视觉一致性。**不引入新的 Design Token 系统**，避免重构范围膨胀。

### 问题 4：OpenAI 兼容协议下的 R1 思维链字段名差异
- **现状**：DeepSeek-R1 通过 OpenAI 兼容协议返回思维链时，字段是 `delta.reasoning_content`。但部分中转站在转换时可能使用不同的字段名（如 `delta.reasoning` 或包裹在正文 `<think>` 标签中）。
- **处理方案**：`reasoningVerifier.ts` 必须同时检查 `delta.reasoning_content`、`delta.reasoning`，并额外检测正文中是否存在 `<think>` 标签（标记为"疑似伪造"而非"确认伪造"）。

---

## 二、精细化 Agent 分工与流水线

```text
时间线  ──────────────────────────────────────────────────────────────────►

步骤 0  [ 主控 Agent: 创建契约层与传输底座 ]
        ▪ src/types/ (全部 6 个契约文件)
        ▪ src/engine/transport/ (silentTransport + sseReader + urlNormalizer)
        ▪ src/context/AppContext.tsx
        ▪ src/components/common/ (MetricCard, StatusBadge, CodeBlock, Toast, ErrorBoundary)
                              │
                              ▼ (契约与底座就绪后，4 个子 Agent 并行启动)
步骤 1  ┌─────────────┬───────────────┬──────────────────┬──────────────────┐
        │ Subagent A  │ Subagent B    │ Subagent C       │ Subagent D       │
        │ 真伪鉴别    │ 性能测速      │ 模型巡检+能力    │ 批量Key+配置导出 │
        └─────────────┴───────────────┴──────────────────┴──────────────────┘
                              │
                              ▼ (全部子 Agent 交付后)
步骤 2  [ 主控 Agent: 总装与集成 ]
        ▪ 迁移 platforms.ts，整合 Header + GlobalConfigBar + TabNav
        ▪ 组装 App.tsx (Tab 路由 + 全局状态注入)

步骤 3  [ 主控 Agent: 构建验证 ]
        ▪ npm run build 全量 TypeScript 编译零报错
```

---

## 三、各 Agent 逐文件任务清单

### 步骤 0：主控 Agent 直接完成

| 文件 | 职责 | 说明 |
|:---|:---|:---|
| `src/types/config.ts` | GlobalConfig, RelayProfile, PlatformConfig 接口 | 复用现有 platforms.ts 的接口并增强 |
| `src/types/fidelity.ts` | 探针定义、ProbeResponseMeta、ProbeVerdict、FidelityReport | 含 Signature 与 Reasoning 两条验真路径的完整类型 |
| `src/types/benchmark.ts` | StreamChunkMetric, BenchmarkResult (含 isTpsEstimated 标识) | |
| `src/types/scanner.ts` | ModelStatus, ModelCheckItem | |
| `src/types/capability.ts` | CapabilityMatrix (stream/tools/vision/json) | |
| `src/types/batchKeys.ts` | KeyHealthStatus, KeyCheckResult, BatchKeySummary | |
| `src/engine/transport/silentTransport.ts` | 统一 fetch 封装 + AbortController 5s 熔断 + 错误分类 | 不引入第三方代理，直连模式 |
| `src/engine/transport/sseReader.ts` | ReadableStream + TextDecoder 逐行解析 `data: {...}` | 支持 OpenAI 与 Anthropic 两种 SSE 格式 |
| `src/engine/transport/urlNormalizer.ts` | 去除尾部 `/`、自动补全 `/v1`、端点拼接 | |
| `src/context/AppContext.tsx` | React Context + useReducer 管理全局 config/relay/tab 状态 | |
| `src/components/common/*.tsx` | MetricCard, StatusBadge, CodeBlock, Toast, ErrorBoundary | 统一暗色视觉风格的原子组件 |

---

### 步骤 1A：Subagent A — 🕵️ 真伪鉴别专家

**职责范围**：`src/engine/fidelity/` 全部 4 个引擎文件 + `src/components/tabs/FidelityTab.tsx`

| 文件 | 核心实现要点 |
|:---|:---|
| `signatureVerifier.ts` | ① 先探测 `/v1/messages` 端点是否可用（Anthropic 原生协议检测）；② 发送 thinking-enabled 请求，从 SSE 中提取 `signature`；③ 构造第二轮请求回传 signature 验签；④ 端点不支持时返回 `{ applicable: false }` 而非误报 |
| `reasoningVerifier.ts` | ① 发送标准推理请求，流式捕获 `delta.reasoning_content` 或 `delta.reasoning`；② 记录思维链首字时间与正文首字时间的时差（正常 R1 先思考再输出，差值 > 500ms）；③ 检测正文中 `<think>` 标签是否存在（标记为"疑似伪造"） |
| `fingerprintProbes.ts` | ① 元认知冲突探针（诱导暴露注入的系统 Prompt）；② 知识截止期探针（测试 2024-11 之后事件）；③ 代码空间逻辑探针（SVG 几何约束验证） |
| `fidelityScorer.ts` | 多维加权评分算法：signature 权重 40%、reasoning 权重 25%、fingerprint 权重 25%、system_fingerprint 权重 10%，输出 0~100 分与四级判定 |
| `FidelityTab.tsx` | 模型选择 → 点击开始 → 逐项探针执行进度条 → 结果表格与综合评分卡片 |

**输入依赖**：`src/types/fidelity.ts`、`src/engine/transport/*`、`src/components/common/*`  
**禁止事项**：不可修改 `types/`、`transport/`、`context/` 目录下的任何文件  
**验收标准**：`FidelityTab` 能独立渲染，引擎模块纯 TS 无 React 依赖，所有导出函数有完整类型签名

---

### 步骤 1B：Subagent B — ⚡ 性能测速专家

**职责范围**：`src/engine/benchmark/speedTester.ts` + `src/components/tabs/BenchmarkTab.tsx`

| 文件 | 核心实现要点 |
|:---|:---|
| `speedTester.ts` | ① 使用 `performance.now()` 记录请求发起时刻；② 通过 `sseReader` 监听首个有效 text chunk → 计算 TTFT；③ 逐 chunk 累计字符数、记录时间戳、计算 deltaMs；④ 流结束后读取 `usage.completion_tokens`（若存在用精确值，否则用 `charCount / 4` 估算并标记 `isTpsEstimated: true`）；⑤ 计算 chunk 间隔方差（Jitter） |
| `BenchmarkTab.tsx` | 模型选择 + 测试轮数（1~5）→ 实时打字机动画（逐字显示生成内容）→ 三个 MetricCard (TTFT / TPS / Jitter) → 多轮结果对比表格 |

**输入依赖**：`src/types/benchmark.ts`、`src/engine/transport/*`、`src/components/common/MetricCard.tsx`  
**禁止事项**：不可修改 `types/`、`transport/`、`context/` 目录下的任何文件  
**验收标准**：`BenchmarkTab` 能独立渲染，打字机动画流畅，TTFT/TPS 数值准确

---

### 步骤 1C：Subagent C — 📋 模型巡检与能力探测专家

**职责范围**：`src/engine/scanner/`、`src/engine/capability/`、`src/engine/billing/` + 对应的两个 Tab

| 文件 | 核心实现要点 |
|:---|:---|
| `batchScanner.ts` | ① 请求 `GET {baseUrl}/models`，使用现有 `platforms.ts` 的 `modelExtractor` 解析响应；② 内置 `concurrencyLimit = 5` 的异步并发队列，对每个模型发送 `max_tokens: 1` 的最小请求探测连通性；③ 按 HTTP 状态码分类（200 / 401 / 402 / 429 / 404 / 500）；④ 自动识别 provider（通过模型 ID 前缀匹配 claude / gpt / deepseek / gemini 等） |
| `probeRunner.ts` | ① Tool Calling 探针：发送带 `tools` 参数的请求，验证响应中是否包含 `tool_calls`；② Vision 探针：发送内嵌 1x1 像素 base64 PNG 的请求；③ JSON Mode 探针：设置 `response_format: { type: "json_object" }`，验证返回是否为合法 JSON |
| `quotaSniffer.ts` | 静默竞速并发探测 `/api/usage`、`/v1/dashboard/billing/subscription`、`/api/user/self`，任一成功即解析余额与点数，全失败静默标记 N/A |
| `BatchScannerTab.tsx` | 模型列表表格（ID / 分类 / 状态徽章 / 延迟）+ 筛选栏（全部 / OpenAI / Claude / DeepSeek / 免费）+ 一键巡检进度条 |
| `CapabilityTab.tsx` | 四个能力卡片（Stream / Tools / Vision / JSON），每个显示支持状态徽章与探测详情 |

**输入依赖**：`src/types/scanner.ts`、`src/types/capability.ts`、`src/engine/transport/*`、`src/config/platforms.ts`  
**禁止事项**：不可修改 `types/`、`transport/`、`config/`、`context/` 目录下的任何文件  
**验收标准**：`BatchScannerTab` 和 `CapabilityTab` 能独立渲染，并发巡检正确分类

---

### 步骤 1D：Subagent D — ⚡ 批量 Key 检测与客户端配置导出专家

**职责范围**：`src/engine/batchKeys/` + `QuickPingTab.tsx` + `ClientExportTab.tsx`

| 文件 | 核心实现要点 |
|:---|:---|
| `keyPoolTester.ts` | ① 接收多行文本解析出 Key 列表（去空行、去重、trim）；② 内置 `concurrencyLimit = 5` 异步并发，对每个 Key 发送 `max_tokens: 1` 的最小请求；③ 按结果分类（active / quota_exhausted / invalid / rate_limited / network_error）；④ 生成 `maskedKey`（仅显示前 6 位和后 4 位）；⑤ 汇总统计 |
| `QuickPingTab.tsx` | **双模式切换**：① 单 Key 模式（输入框 + 一键 Ping + 状态卡片 + 错误诊断建议）；② 批量模式（多行文本框 + 一键并发检测 + 结果表格 + 一键导出有效 Key）|
| `ClientExportTab.tsx` | ① 从全局 Context 读取当前 BaseURL + Key + 选中模型；② 基于 `platforms.ts` 的 `litellmConfig` 数据，动态生成 Claude Code / Cline / Cursor / Roo Code / Cherry Studio / NextChat 的环境变量与配置代码块；③ 每个配置块附带一键复制按钮 |

**输入依赖**：`src/types/batchKeys.ts`、`src/types/config.ts`、`src/engine/transport/*`、`src/config/platforms.ts`、`src/context/AppContext.tsx`  
**禁止事项**：不可修改 `types/`、`transport/`、`config/`、`context/` 目录下的任何文件  
**验收标准**：`QuickPingTab` 双模式均可独立运行，`ClientExportTab` 配置代码块正确可复制

---

### 步骤 2：主控 Agent 总装

| 文件 | 职责 |
|:---|:---|
| `src/config/platforms.ts` | 保持原有 22 个服务商完整不变，补充"自定义中转站"选项 |
| `src/components/layout/Header.tsx` | 品牌 Logo + GitHub Star 链接 + 隐私安全标语 |
| `src/components/layout/TabNav.tsx` | 6 个 Tab 切换导航（真伪鉴别 / 性能测速 / 批量巡检 / 能力矩阵 / 极速单测 / 客户端导出） |
| `src/components/layout/GlobalConfigBar.tsx` | BaseURL 输入 + Key 输入 + 服务商预设下拉 + 模型自动拉取下拉 + 额度小卡片 |
| `src/App.tsx` | 注入 AppContext → Header → GlobalConfigBar → TabNav → 条件渲染对应 Tab 组件 |
| `src/index.css` | 保持暗色主题基础样式 |

### 步骤 3：构建验证

```bash
npm run build   # 必须 0 error, 0 warning
npm run dev     # 本地启动验证所有 Tab 可渲染
```

---

## 四、子 Agent 间的隔离与通信契约

```text
┌──────────────────────────────────────────────────────────────────┐
│                    共享只读区 (子 Agent 只能读取)                │
│  src/types/*           所有 TypeScript 接口契约                  │
│  src/engine/transport/*  统一网络请求与 SSE 解析底座             │
│  src/config/platforms.ts 22 个服务商配置数据                     │
│  src/context/AppContext.tsx  全局状态接口                        │
│  src/components/common/*   原子 UI 组件                          │
├──────────────────────────────────────────────────────────────────┤
│                    各子 Agent 独占写入区                         │
│  Subagent A → src/engine/fidelity/* + tabs/FidelityTab.tsx      │
│  Subagent B → src/engine/benchmark/* + tabs/BenchmarkTab.tsx    │
│  Subagent C → src/engine/scanner/* + capability/* + billing/*   │
│               + tabs/BatchScannerTab.tsx + CapabilityTab.tsx     │
│  Subagent D → src/engine/batchKeys/* + tabs/QuickPingTab.tsx    │
│               + tabs/ClientExportTab.tsx                         │
└──────────────────────────────────────────────────────────────────┘
```

**核心规则**：每个子 Agent **只写自己的独占区文件**，**绝不碰其他子 Agent 的文件或共享只读区**。这保证了并行开发零冲突。
