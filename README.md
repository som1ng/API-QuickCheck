<div align="center">

<table>
  <tr>
    <td width="28%" align="center" style="border:none; background: transparent; vertical-align: middle;">
      <img src="./public/logo.png" width="130" height="130" alt="API-QuickCheck Logo" style="border-radius: 26px; box-shadow: 0 12px 36px rgba(204,120,92,0.35);" />
      <br />
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: bold; color: #cc785c; letter-spacing: 0.5px;">API-QUICKCHECK 3.2</span>
    </td>
    <td width="72%" align="left" style="border:none; background: transparent; vertical-align: middle;">
      <pre lang="text">
  █████╗ ██████╗ ██╗    ██████╗ ██╗   ██╗██╗ ██████╗██╗  ██╗
 ██╔══██╗██╔══██╗██║   ██╔═══██╗██║   ██║██║██╔════╝██║ ██╔╝
 ███████║██████╔╝██║   ██║   ██║██║   ██║██║██║     █████╔╝ 
 ██╔══██║██╔═══╝ ██║   ██║▄▄ ██║██║   ██║██║██║     ██╔═██╗ 
 ██║  ██║██║     ██║   ╚██████╔╝╚██████╔╝██║╚██████╗██║  ██╗
 ╚═╝  ╚═╝╚═╝     ╚═╝    ╚══▀▀═╝  ╚═════╝ ╚═╝ ╚═════╝╚═╝  ╚═╝
               ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗
              ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝
              ██║     ███████║█████╗  ██║     █████╔╝ 
              ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗ 
              ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗
               ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝
 ─────────────────────────────────────────────────────────────
 ⚡ 面向 AI 中转站的全能真伪鉴别、批量测活与 Agent 自动化适配引擎
      </pre>
    </td>
  </tr>
</table>

<p>
  <a href="https://www.npmjs.com/package/api-quickcheck"><img src="https://img.shields.io/npm/v/api-quickcheck?style=flat-square&color=cc785c&logo=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/api-quickcheck"><img src="https://img.shields.io/npm/dm/api-quickcheck?style=flat-square&color=5db872&logo=npm" alt="npm downloads"></a>
  <a href="https://github.com/som1ng/API-QuickCheck/stargazers"><img src="https://img.shields.io/github/stars/som1ng/API-QuickCheck?style=flat-square&color=cc785c" alt="Stars"></a>
  <a href="https://github.com/som1ng/API-QuickCheck/blob/main/LICENSE"><img src="https://img.shields.io/github/license/som1ng/API-QuickCheck?style=flat-square&color=383531" alt="License"></a>
  <a href="https://api-quick-check.vercel.app/"><img src="https://img.shields.io/badge/Vercel-在线体验-141413?style=flat-square&logo=vercel" alt="Vercel"></a>
</p>

<p>
  <a href="https://api-quick-check.vercel.app/"><strong>在线体验</strong></a> ·
  <a href="#一-设计理念与项目愿景"><strong>设计理念</strong></a> ·
  <a href="#二-核心亮点与项目优势"><strong>核心亮点</strong></a> ·
  <a href="#三-工业级-api-key-海量批量测活与智能清洗引擎亮点功能"><strong>批量测活</strong></a> ·
  <a href="#四-无头-cli-引擎与-ai-agent-自动化测试接入亮点功能"><strong>Agent/CLI</strong></a> ·
  <a href="#五-中转站保真度鉴真与-24-项探针矩阵"><strong>24项探针</strong></a> ·
  <a href="#六-快速开始"><strong>快速开始</strong></a> ·
  <a href="./README_EN.md"><strong>English Documentation</strong></a>
</p>

</div>

---

## 一、 设计理念与项目愿景

### 1. 为什么发起 API-QuickCheck？

在日益繁荣的大语言模型（LLM）中转代理市场中，服务商质量参差不齐，开发者与 AI Agent 构建者常常面临极为隐蔽的“**黑盒陷阱**”：

- **李代桃僵与暗中降配**：用经过低比特量化的开源小模型冒充顶级旗舰（如用 Qwen 冒充 Claude 3.7 / GPT-5），或将高难度请求路由到低成本小模型；
- **假思维流欺骗**：在非思考模型输出正文中硬编码注入 `<think>` 标签，伪造思考链假象；
- **协议改包与凭据剥离**：网关中间件肆意丢弃 Claude 私钥 Thinking Signature 签名、抹平 Token Usage 真实计费字段，导致下游 Agent 上下文连续性断裂；
- **静默截断上下文**：声称支持 128K/200K 上下文，实际在 16K 处即静默截断前端内容，导致复杂任务推理完全崩溃；
- **不透明限流与偷跑额度**：缺乏合规的错误回显与余额审计机制。

### 2. API-QuickCheck 的四大核心哲学

1. **密码学与协议确定性验真 (Deterministic Protocol Forensics)**：
   不依赖主观打分或模糊文字匹配，通过 **Anthropic 官方私钥签名二次回传验证**、**原生 SSE Wire 事件流状态机**、**严格 JSON Schema 夹具** 等密码学与协议硬断言，实现 100% 确定性的真伪定论。
2. **端到端极速高并发批量清洗 (Industrial High-Throughput Key Scrubbing)**：
   面向拥有成百上千 Key 的站长、团队与企业，提供 1~50 线程动态并发池、防封抖动调度、全网计费端点余额穿透嗅探与多格式导出。
3. **面向 AI Agent 与自动化流水线的无头 CLI (Headless CLI for Autonomous Agents)**：
   专为 Claude Code、Cursor、Cline、AutoGPT 等新一代自主编码智能体（AI Agent）及 CI/CD 自动化检测设计，支持一键命令注入与标准化 JSON 遥测报表输出。
4. **零服务端存储与隐私绝对安全 (Client-Only & Zero Data Logging)**：
   基于纯前端浏览器与本地 CLI 内存运行，API Key 绝不上传至任何第三方服务器或数据库。

---

## 二、 核心亮点与项目优势

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     API-QUICKCHECK 3.2 核心架构                                  │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│    🚀 海量并发批量测活与清洗   │    🤖 无头 CLI 与 Agent 自动化   │    🛡️ 中转保真度 24 项深度审计 │
│  • 1~50 线程动态并发池        │  • 独立 Node.js / TS CLI 引擎    │  • 覆盖 9 大最新前沿旗舰模型  │
│  • ±25% Jitter 防封随机抖动   │  • npx api-quickcheck 零安装秒开 │  • Claude 私钥签名二次回传验真│
│  • 智能全格式 Key 正则提取    │  • 标准化 --json 结构化报表      │  • 原生 reasoning_content 鉴伪 │
│  • 穿透主流面板深度嗅探余额   │  • Agent 自主环境检测与容灾切换  │  • 严格 JSON / 工具调用闭环   │
│  • TXT / CSV(BOM) / JSON 导出 │  • 完美契合 GitHub Actions CI/CD │  • Token 消耗拆解与总耗时遥测 │
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

---

## 三、 工业级 API Key 海量批量测活与智能清洗引擎（亮点功能）

针对团队采购、中转站聚合与密钥池管理场景，API-QuickCheck 提供了极速并发清洗系统：

### 1. 智能杂乱文本一键清洗提取
无论您的 Key 混杂在纯文本、换行、逗号、分号、CSV 导出表格（提取第一列或特定列）、JSON 数组，甚至带有 `key:`、`sk-` 等复杂前缀与中文注释的混乱文本中，系统均可自动基于高精度正则表达式秒级提取纯净 Key 数组。

### 2. 1~50 线程动态无级并发池与优雅取消
- 搭载高性能并发调度引擎，支持 1 到 50 线程实时滑动调节；
- 支持微秒级任务打断与优雅取消（AbortController），随时暂停或终止检测。

### 3. 三档频率与 ±25% Jitter 动态防封调度
- **安全防封档**：单线程平缓请求 + 动态抖动延时，适合风控严格的官方中转；
- **标准平衡档**：10 线程并发，平衡检测速度与网络稳定性；
- **极速清洗档**：30~50 线程全力并发，可在 10 秒内完成数百个 Key 的清洗。

### 4. 全网主流中转计费面板余额深度穿透嗅探
自动穿透嗅探目标 Base URL 绑定的计费后端，精准提取账户总额度、已用额度、剩余余额与货币单位，深度兼容：
- **OneAPI / NewAPI / DoneAPI / V3 API**（`/dashboard/billing/subscription`、`/api/user/self` 等）
- **OpenRouter**（`/api/v1/credits`）
- **DeepSeek / SiliconFlow / 常见聚合中转**（`/v1/user/balance`、`/user/balance`）

### 5. 多格式防乱码导出与本地历史持久化
- **纯文本 TXT 导出**：导出有效 Key 换行纯文本（如 `api-keys-active-20260820.txt`）；
- **Excel 兼容 CSV 导出**：自动注入 **UTF-8 BOM**，解决 Excel 打开中文与符号乱码问题，包含序号、Key、脱敏 Key、有效状态、网络延迟、账户余额、报错详情等完整字段；
- **结构化 JSON 导出**：完整保留批次元数据（测试时间、Provider、端点、汇总统计）；
- **本地历史持久化**：基于 `localStorage` 自动存储最近 20 个批次检测记录，支持一键恢复历史报表。

---

## 四、 无头 CLI 引擎与 AI Agent 自动化测试接入（亮点功能）

API-QuickCheck 内置零外部侵入、完美适配 CI/CD 流水线与 AI Agent 调用的无头 CLI 工具（`apiqc`）。

### 1. 专为 AI Agent（Claude Code / Cursor / Cline / AutoGPT）打造
AI Agent 在调用第三方中转站前，可自主执行 CLI 探针，快速获取端点保真度、真实模型归属、流式事件响应与 Token 消耗，若发现欺瞒或降级可自动熔断并切换备份渠道：

```bash
# 方式 1：免安装 npx 零配置秒开（最推荐）
npx api-quickcheck audit \
  --model anthropic/claude-3.7-sonnet \
  --base-url https://openrouter.ai/api/v1 \
  --api-key sk-or-v1-xxxxxx \
  --json > audit-result.json

# 方式 2：全局安装为系统命令行工具
npm install -g api-quickcheck

apiqc audit \
  --model gpt-5.6-sol \
  --base-url https://api.your-relay.com/v1 \
  --api-key sk-xxxxxx \
  --profile quick
```

### 2. CLI 核心参数一览

| 参数 | 类型 | 说明 | 默认值 |
| :--- | :--- | :--- | :--- |
| `--model` | `string` | **必填**。待审计目标模型 ID（如 `gpt-5.6-sol`, `claude-3-7-sonnet`） | - |
| `--base-url` | `string` | **必填**（或注入 `APIQC_BASE_URL` 环境变量）。中转站或官方 Base URL | - |
| `--api-key` | `string` | **必填**（或注入 `APIQC_API_KEY` 环境变量）。进程内存使用，绝不落盘 | - |
| `--provider` | `string` | 指定协议适配器：`auto`, `openai`, `anthropic`, `gemini`, `xai`, `openrouter` | `auto` |
| `--profile` | `string` | 审计档位：`quick`（快速 ~15s）, `balanced`（标准 ~30s）, `deep`（全量 ~50s） | `balanced` |
| `--probes` | `string` | 逗号分隔的指定探针 ID（如 `p0-stream-events,p0-strict-json,p1-signature-continuity`） | 档位默认探针 |
| `--out` | `string` | 结构化 JSON 审计报告输出路径 | `audit-report.json` |
| `--json` | `boolean` | 启用纯净 JSON 输出，适合 Agent 与脚本解析管道 | `false` |

---

## 五、 中转站保真度鉴真与 24 项探针矩阵

### 1. 支持的 9 大前沿模型矩阵

```text
┌─────────────────────────┬───────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ 厂商 (Provider)         │ 模型 ID (Model ID)             │ 前沿定位 (Tier) 与核心鉴伪重点                              │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ OpenAI                  │ gpt-5.6-sol                   │ 顶级旗舰 · 复杂工具规划、自主代码修复、64K 针尖检索        │
│                         │ gpt-5.6-terra                 │ 通用全能工作马 · Responses API 与严格 JSON Schema 验证      │
│                         │ gpt-5.6-luna                  │ 极速高吞吐 · 亚秒级低延迟 Agent 执行引擎                   │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Anthropic               │ claude-fable-5                │ 新代前沿旗舰 · 自适应思考 (Adaptive Thinking) 签名连续性   │
│                         │ claude-opus-5                 │ 顶尖编程与深度推理 · 复杂 Agent 工具链闭环                  │
│                         │ claude-sonnet-5               │ 均衡主力工作马 · Messages API 原生路由与 Prompt 缓存       │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Google                  │ gemini-3.1-pro-preview        │ 200万超长上下文 · Thought Signature 保持与多模态图表提取   │
│                         │ gemini-3.7-flash              │ 极速 Agent 调度引擎 · 原生 Interactions 协议流             │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ xAI                     │ grok-4.6                      │ 实时推理旗舰 · 受控工具回合、实时搜索与代码沙箱验真        │
└─────────────────────────┴───────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

### 2. 24 项全量审计探针套件

```text
                                 ┌── [ P0 协议层 (7项) ] ➔ 模型发现、原生路由、鉴权错误、流式事件、严格JSON、工具结构、非法参数
                                 ├── [ P1 架构层 (5项) ] ➔ 推理配置透传、状态连续性、受控工具回合、思考签名连续性、缓存语义
API-QuickCheck 3.2 ──────────────┼── [ P2 能力层 (8项) ] ➔ 约束JSON任务、工具规划、代码补丁(算术/集合)、图表提取、64K针尖(前/中/后)
                                 └── [ P3 质量层 (4项) ] ➔ 运行质量重复样本 A / B / C / D
```

- **Anthropic 官方私钥签名二次回传验真 (`p1-signature-continuity`)**：捕获 thinking 块中的私钥签名并在第二轮会话中回传验证，任何套壳或中间件改包将在 1 秒内原形毕露；
- **多协议原生流式事件序列校验 (`p0-stream-events`)**：全面适配 OpenAI Responses、Anthropic Messages、Google Gemini 及 OpenRouter / ChatCompletions 标准流式 Chunk；
- **清晰直观的遥测卡片**：
  - **协议覆盖**：展示计划项数与执行覆盖比；
  - **探针通过率**：实事求是的通过百分比与状态徽标；
  - **Token 消耗**：精确统计总 Token、输入 Token 与输出 Token；
  - **总执行用时**：展示全套探针端到端总时间（如 `2.4s`），杜绝难以理解的晦涩术语。

---

## 六、 快速开始

### 方式 1：在线 Web 端开箱即用（免部署）
直接访问官方部署站点：**[https://api-quick-check.vercel.app/](https://api-quick-check.vercel.app/)**

### 方式 2：免安装 npx 零配置运行 CLI
```bash
npx api-quickcheck audit --model gpt-5.6-sol --base-url https://api.your-relay.com/v1 --api-key sk-xxx
```

### 方式 3：本地源码克隆运行 & 二次开发
```bash
# 1. 克隆代码仓库
git clone https://github.com/som1ng/API-QuickCheck.git
cd API-QuickCheck

# 2. 安装依赖
npm install

# 3. 启动本地开发服务
npm run dev

# 4. 运行全量单元测试
npm test

# 5. 全量生产构建
npm run build
```

---

## 七、 技术栈

- **前端框架**：React 18 + TypeScript + Vite
- **UI 风格**：TailwindCSS + Anthropic Claude Warm-Dark Editorial System（严格无 Emoji）
- **图标系统**：Lucide React
- **网络与解析**：原生 Fetch + 自研高效 SSE Wire Reader + 动态正则提取引擎
- **自动化构建**：esbuild (CLI Bundle) + Rollup (Web App)

---

## 八、 开源许可证

本项目基于 **MIT License** 开源协议，欢迎提交 Issue 与 Pull Request 共同完善！
