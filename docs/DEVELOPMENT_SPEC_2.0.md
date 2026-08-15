# ⚡ API-QuickCheck 2.0 技术架构与重构开发规范文档

> **文档版本**：v2.2.0-Final (融合 Veridrop 加密级 Thinking 签名验真算法)  
> **核心突破**：**100% 官方服务端加密签名验真 (Claude Thinking Signature)** + 双轨思维链协议 + 纯前端零泄露  

---

## 1. 行业顶级验真技术整合：Veridrop 加密级验真算法

通过对 `veridrop.org` (GitHub: `canarybyte/veridrop`) 与 Anthropic 官方底层协议的深度分析，我们正式将 **Claude Thinking Signature (思维链加密签名)** 纳入核心鉴别引擎：

```text
===================================================================================================
                   API-QuickCheck 2.0 全维度真伪与性能检测矩阵
===================================================================================================

  【维度 1: 100% 加密级验真 (Claude)】 ──► 启用 thinking: { type: "enabled", budget_tokens: 1024 }
                                            • 捕获 Anthropic 服务端签发的 cryptographic signature
                                            • 第二轮回传签名验真：由 Anthropic 官方验签，中转站绝无法伪造！

  【维度 2: 思考链协议验真 (R1 / o1)】 ──► 校验 delta.reasoning_content 字段与 SSE 产出时序
                                            • 识别正则替换的假冒 <think> 标签与截断偷工减料

  【维度 3: 行为指纹与空间几何拓扑】   ──► 认知冲突探针 + SVG 空间逻辑 + 知识时间窗
                                            • 针对未开启思考的普通模型 (如 Claude 3.5 / GPT-4o)

  【维度 4: 流式测速基准 (TTFT / TPS)】 ──► ReadableStream 高精度微秒计时 + 实时打字机
                                            • 统计首字延迟、真实 TPS 吞吐、Chunk 到达方差 (Jitter)

  【维度 5: 批量 Key 盘点与 Agent 导出】 ──► 异步并发队列 + 智能协议自适应
                                            • 批量清洗导出有效 Key；一键生成 Claude Code / Cline / Cursor 配置
===================================================================================================
```

---

## 2. 核心真伪鉴别算法规范 (`src/engine/fidelity/`)

### 2.1 Claude 加密级 Thinking 签名验真 (`signatureVerifier.ts`)
1. **第一阶段（签名提取）**：
   - 请求 Anthropic 原生端点 `/v1/messages` 或支持 thinking 的中转站，配置：
     ```json
     {
       "model": "claude-3-7-sonnet-20250219",
       "max_tokens": 2048,
       "thinking": { "type": "enabled", "budget_tokens": 1024 },
       "messages": [{ "role": "user", "content": "Compute 17 * 29 step by step." }]
     }
     ```
   - 监听 `content_block_start` (`type: "thinking"`) 与 `signature_delta`，提取加密签名 `signature`。
2. **第二阶段（回传验签）**：
   - 构造第二轮对话，将带有 `signature` 的 thinking block 回传给 API。
   - **判定准则**：
     - 若中转站使用国产模型/假冒模型，无法生成合规签名，回传时官方验签直接报错 `400 invalid thinking signature`；
     - 若顺利完成第二轮对话并返回正确答案，**100% 确定为 Anthropic 原生官方正品**。

### 2.2 DeepSeek-R1 / OpenAI o1 思维链协议验真
- 必须严格捕获 `delta.reasoning_content`；
- 检查思考过程持续时间（真实思考模型存在明显的思考时间，而非正文与思考瞬时并发）。

### 2.3 综合置信度打分体系 (`fidelityScorer.ts`)
| 判定等级 | 置信度 | 触发条件 |
| :--- | :---: | :--- |
| 🟢 **100% 官方正品 (Genuine Certified)** | 100% | 成功通过 Claude Thinking Signature 加密验签，或通过原生 R1 reasoning_content 严格时序校验 |
| 🟢 **高置信度正品 (Highly Authentic)** | 85~99% | 系统指纹对齐、知识截止期与空间几何拓扑探针全部通过 |
| 🟡 **疑似降级/掺假 (Suspect Downgraded)** | 40~84% | 缺少思维链字段、思考时长异常、或空间拓扑探针发生畸变 |
| 🔴 **假冒冒充/换皮 (Fake Imposter)** | 0~39% | 签名验签失败、暴露注入的系统 Prompt、或基础认知冲突探针失败 |

---

## 3. 系统分层架构与目录组织

```text
src/
├── types/                               # 【契约层】严格 TypeScript 类型定义
│   ├── config.ts                        # 全局配置、服务商画像
│   ├── fidelity.ts                      # 签名验真、思维链、指纹探针与评分契约
│   ├── benchmark.ts                     # TTFT、TPS、流式块明细
│   ├── scanner.ts                       # 模型元数据与批量巡检
│   ├── capability.ts                    # Tools、Vision、JSON Mode
│   └── batchKeys.ts                     # 批量 Key 检测与导出
│
├── engine/                              # 【引擎层】纯 TS 编写，零 UI 依赖、易测试
│   ├── transport/                       # 底层网络与流式解析
│   │   ├── silentTransport.ts           # 100% 浏览器直连与 5s 熔断保护
│   │   ├── sseReader.ts                 # 标准 SSE 流解析器
│   │   └── urlNormalizer.ts             # BaseURL 智能规范化
│   ├── fidelity/                        # 真伪鉴别引擎
│   │   ├── signatureVerifier.ts         # 🌟 Claude Thinking Signature 100% 加密验签
│   │   ├── reasoningVerifier.ts         # R1 / o1 思维链协议与时序校验
│   │   ├── fingerprintProbes.ts         # 认知冲突与行为指纹探针库
│   │   └── fidelityScorer.ts            # 多维置信度综合打分算法
│   ├── benchmark/                       # 性能基准引擎
│   │   └── speedTester.ts               # TTFT、实时 TPS、Chunk 抖动计算
│   ├── scanner/                         # 模型批量巡检引擎
│   │   └── batchScanner.ts              # /v1/models 解析与并发巡检队列 (P-Limit)
│   ├── capability/                      # 高级能力探针
│   │   └── probeRunner.ts               # Tools、Vision、JSON 模式探针
│   ├── billing/                         # 额度与系统画像
│   │   └── quotaSniffer.ts              # NewAPI / OneAPI 余额与点数嗅探
│   └── batchKeys/                       # 批量 Key 检测引擎
│       └── keyPoolTester.ts             # 多 Key 并发测试与清洗器
│
├── components/                          # 【视图层】现代 SaaS UI 组件
│   ├── layout/                          # 全局布局 (Header, GlobalConfigBar, TabNav)
│   ├── tabs/                            # 业务功能 Tab
│   │   ├── FidelityTab.tsx              # 🕵️ 真伪鉴别面板 (含 Thinking Signature 验真状态)
│   │   ├── BenchmarkTab.tsx             # ⚡ 性能测速与流式体验面板
│   │   ├── BatchScannerTab.tsx          # 📋 模型清单与批量巡检面板
│   │   ├── QuickPingTab.tsx             # ⚡ 极速单测 / 批量 Key 综合面板
│   │   ├── CapabilityTab.tsx            # 🧩 高级能力探测面板
│   │   └── ClientExportTab.tsx          # 🚀 Agent / 客户端配置生成器
│   └── common/                          # 通用原子 UI 组件 (MetricCard, CodeBlock, etc.)
│
├── context/                             # 全局状态管理 (React Context + useReducer)
│   └── AppContext.tsx
│
├── utils/                               # 格式化与持久化工具
├── App.tsx                              # 组装入口
└── main.tsx
```

---

## 4. 多 Agent 分工与实施流水线

```text
       [ 主控 Architect Agent ]
                  │
                  ├─ 步骤 1: 创建 src/types/ 契约与 src/engine/transport/ 传输底座
                  │
      ┌───────────┼───────────┬───────────┐
      ▼           ▼           ▼           ▼
[ Subagent 1 ] [ Subagent 2 ] [ Subagent 3 ] [ Subagent 4 ]
负责:          负责:          负责:          负责:
🕵️ 真伪鉴别   ⚡ 性能测速   📋 模型巡检    ⚡ 批量Key检测与
(含Signature)  引擎与视图     与能力探针     Agent配置导出
      │           │           │           │
      └───────────┼───────────┴───────────┘
                  │
                  ├─ 步骤 2: 组装 App.tsx 与 AppContext 全局状态
                  ├─ 步骤 3: 运行 npm run build 进行全量类型检查与构建测试
                  └─ 步骤 4: 交付可直接运行的 API-QuickCheck 2.0
```
