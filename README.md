<div align="center">

<table>
  <tr>
    <td width="28%" align="center" style="border:none; background: transparent; vertical-align: middle;">
      <img src="./public/logo.png" width="130" height="130" alt="API-QuickCheck Logo" style="border-radius: 26px; box-shadow: 0 12px 36px rgba(204,120,92,0.35);" />
      <br />
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: bold; color: #cc785c; letter-spacing: 0.5px;">API-QUICKCHECK 3.3</span>
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
  <a href="#一设计理念"><strong>设计理念</strong></a> ·
  <a href="#二核心能力"><strong>核心能力</strong></a> ·
  <a href="#三批量测活"><strong>批量测活</strong></a> ·
  <a href="#四cli-与-agent-接入"><strong>Agent/CLI</strong></a> ·
  <a href="#五审计探针"><strong>审计探针</strong></a> ·
  <a href="#六快速开始"><strong>快速开始</strong></a> ·
  <a href="./README_EN.md"><strong>English Documentation</strong></a>
</p>

</div>

---

## 一、设计理念

中转站偷换模型,难就难在从回复文本上看不出来。量化小模型也能把话说明白,降智路由对简单问题毫无影响。等你从文风里觉出不对劲,订阅费已经交了一个月。

所以这个项目不看文风,只看协议和证据:

- **签名回传验签**:Claude 的 thinking 块带 Anthropic 服务端签名。第一轮捕获,第二轮原样回传,官方验签通过才算数。签名被重写或伪造,官方端直接 400。这是目前唯一能做加密级定论的检查。
- **协议硬断言**:SSE 事件顺序、严格 JSON Schema、`tool_use_id` 字节级闭环。错了就是错了,不存在"感觉不太像"。
- **批量测活**:上百个 Key 的池子,并发可调,随时能停,结果导出成能直接用的格式。
- **纯本地**:浏览器或 CLI 内存里跑完即走,Key 不经过任何第三方服务器。

---

## 二、核心能力

| 批量测活 | CLI / Agent | 审计探针 |
| :--- | :--- | :--- |
| 1~50 线程并发可调,随时取消 | `npx api-quickcheck` 免安装直接跑 | 覆盖 9 个 2026 前沿旗舰模型 |
| 请求间加 ±25% 随机抖动,降低触发风控的概率 | `--json` 纯净输出,日志走 stderr | Claude thinking 签名回传验签 |
| 从文本 / CSV / JSON / .env 混杂内容里正则提取 Key | 独立 Node CLI,可进 GitHub Actions | SSE 事件顺序、严格 JSON、工具调用闭环 |
| 嗅探 OneAPI / NewAPI / OpenRouter 等面板余额 | 为 Claude Code、Cursor 等 Agent 提供 Skill | Token 拆解与端到端耗时 |

---

## 三、批量测活

面向手里攥着一堆 Key 需要快速分拣的场景:团队采购、聚合站、密钥池维护。

**输入随便喂**。Key 混在纯文本、换行、逗号、分号、CSV 表格、JSON 数组里,带 `key:`、`sk-` 前缀甚至夹着中文注释,都能自动提取成干净的 Key 列表。

**并发 1~50 实时可调**,基于 AbortController,随时暂停或终止。三档预设:

- **防封档**:单线程,每次请求间隔加 ±25% 随机抖动,适合风控严的站;
- **标准档**:10 线程,速度和稳定性折中;
- **极速档**:30~50 线程,几百个 Key 十几秒跑完。

**顺手查余额**。自动探测 Base URL 背后的计费面板,取账户总额度、已用、剩余和币种。兼容:

- OneAPI / NewAPI / DoneAPI / V3 API(`/dashboard/billing/subscription`、`/api/user/self`)
- OpenRouter(`/api/v1/credits`)
- DeepSeek / SiliconFlow 等聚合站(`/v1/user/balance`、`/user/balance`)

**结果能直接用**:

- **TXT**:有效 Key 纯文本列表;
- **CSV**:自动注入 UTF-8 BOM,Excel 打开不乱码,含脱敏 Key、延迟、余额、报错详情;
- **JSON**:完整批次元数据(时间、Provider、端点、汇总统计);
- 最近 20 个批次自动存 localStorage,可回看。

---

## 四、CLI 与 Agent 接入

CLI 工具叫 `apiqc`,和 Web 端共用同一套审计引擎,Key 只在进程内存中出现。

### batch 命令(v3.3 新增)

支持 `.json` / `.csv` / `.env` / `.txt` 文件或管道输入,多模型并发探测:

```bash
# 批量检测文件中的 API-Key 并输出纯净 JSON(为 Agent 消费设计)
npx api-quickcheck batch --input ./keys.json --models "claude-3-7-sonnet,gpt-4o,deepseek-r1" --json

# 批量检测并导出仅含有效 Key 的 .env
npx apiqc batch --input ./keys.csv --export-valid ./valid_keys.env

# 管道输入
cat keys.txt | npx apiqc batch --base-url https://api.relay.com/v1 --models "gpt-4o"
```

### audit 命令

```bash
# 免安装运行(推荐)
npx api-quickcheck audit \
  --model anthropic/claude-3.7-sonnet \
  --base-url https://openrouter.ai/api/v1 \
  --api-key sk-or-v1-xxxxxx \
  --profile balanced

# 或全局安装
npm install -g api-quickcheck

apiqc audit \
  --model gpt-5.6-sol \
  --base-url https://api.your-relay.com/v1 \
  --api-key sk-xxxxxx \
  --profile quick
```

### 参数一览

| 参数 | 类型 | 说明 | 适用命令 |
| :--- | :--- | :--- | :--- |
| `--input` | `string` | 待测文件路径(支持 `.json`, `.csv`, `.env`, `.txt`,传 `-` 为 stdin) | `batch` |
| `--models` | `string` | 逗号分隔的待测模型列表(默认 `claude-3-7-sonnet,gpt-4o,deepseek-r1`) | `batch` |
| `--concurrency` | `number` | 并发限制(默认 `5`),防止单 IP 触发限流 | `batch` |
| `--export-valid` | `string` | 有效 Key 清单导出路径(支持 `.env`, `.json`, `.csv`) | `batch` |
| `--model` | `string` | 待审计模型 ID(如 `gpt-5.6-sol`, `claude-3-7-sonnet`) | `audit` |
| `--base-url` | `string` | 中转站或官方 Base URL | `audit`, `batch` |
| `--api-key` | `string` | 待测 API Key(仅在进程内存中使用) | `audit` |
| `--profile` | `string` | 探测档位:`quick`(探活) / `balanced`(标准) / `deep`(全量) | `audit` |
| `--json` | `boolean` | 纯 JSON 输出,进度日志走 stderr | 全部 |
| `--out` | `string` | 结构化 JSON 报告保存路径 | 全部 |

### Agent Skill

内置 [`skills/batch-api-audit/SKILL.md`](./skills/batch-api-audit/SKILL.md)。在 Claude Code、Cursor 这类 Agent 里装上它,之后用户往对话里丢一批 Key,Agent 会自己调用 `npx apiqc batch` 跑检测、汇报分类结论,不需要手把手教。

---

## 五、审计探针

### 支持的模型

| 厂商 | 模型 ID | 定位与鉴伪重点 |
| :--- | :--- | :--- |
| OpenAI | `gpt-5.6-sol` | 顶级旗舰:复杂工具规划、自主代码修复、64K 针尖检索 |
| | `gpt-5.6-terra` | 全能工作马:Responses API、严格 JSON Schema |
| | `gpt-5.6-luna` | 高吞吐低延迟:Agent 执行 |
| Anthropic | `claude-fable-5` | 新代旗舰:Adaptive Thinking 签名连续性 |
| | `claude-opus-5` | 顶尖编程与深度推理:Agent 工具链闭环 |
| | `claude-sonnet-5` | 均衡主力:Messages 原生路由、Prompt 缓存 |
| Google | `gemini-3.1-pro-preview` | 200 万上下文:Thought Signature 保持 |
| | `gemini-3.7-flash` | 极速 Agent 调度:Interactions 协议流 |
| xAI | `grok-4.6` | 实时推理:受控工具回合、代码沙箱 |

### 24 项探针分四层

- **P0 协议层(7 项)**:模型发现、原生路由、鉴权错误语义、流式事件顺序、严格 JSON、工具结构、非法参数回显
- **P1 架构层(5 项)**:推理配置透传、跨轮状态连续性、受控工具回合、思考签名连续性、缓存语义
- **P2 能力层(8 项)**:约束 JSON、工具规划、代码修复(算术/集合)、图表提取、64K 针尖检索(前/中/后)
- **P3 质量层(4 项)**:运行质量重复样本 A / B / C / D

几项值得单独说的:

- **思考签名连续性(`p1-signature-continuity`)**:第一轮捕获 thinking 块的服务端签名(`redacted_thinking` 加密块按原形状回传),第二轮塞回 assistant 消息验签。中转重写、截断或伪造签名,官方端 400。目前全套探针里唯一能做加密级定论的检查。
- **流式事件顺序(`p0-stream-events`)**:适配 OpenAI Responses、Anthropic Messages、Gemini、OpenRouter / ChatCompletions 四种流式格式,校验事件类型与出现顺序。这比看回复文风便宜且硬。
- **报告可读**:协议覆盖率、探针通过率、Token 拆解、端到端耗时,每项探针给出证据和耗时,不堆术语。

---

## 六、快速开始

**在线 Web 端**:直接访问 [https://api-quick-check.vercel.app/](https://api-quick-check.vercel.app/),输入 Base URL 和 Key 就能测。

**CLI 免安装**:

```bash
npx api-quickcheck audit --model gpt-5.6-sol --base-url https://api.your-relay.com/v1 --api-key sk-xxx
```

**本地开发**:

```bash
git clone https://github.com/som1ng/API-QuickCheck.git
cd API-QuickCheck
npm install
npm run dev      # 本地开发服务
npm test         # 单元测试
npm run build    # 生产构建
```

---

## 七、技术栈

- React 18 + TypeScript + Vite
- TailwindCSS + Anthropic Claude Warm-Dark Editorial 视觉体系(无 Emoji)
- Lucide React 图标
- 原生 Fetch + 自研 SSE Wire Reader
- esbuild 打包 CLI,Rollup 打包 Web

---

## 八、许可证

MIT License。Issue 和 PR 都欢迎。
