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
 ⚡ Universal AI Relay Forensics, Batch Key Testing & Agent Automation
      </pre>
    </td>
  </tr>
</table>

<p>
  <a href="https://www.npmjs.com/package/api-quickcheck"><img src="https://img.shields.io/npm/v/api-quickcheck?style=flat-square&color=cc785c&logo=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/api-quickcheck"><img src="https://img.shields.io/npm/dm/api-quickcheck?style=flat-square&color=5db872&logo=npm" alt="npm downloads"></a>
  <a href="https://github.com/som1ng/API-QuickCheck/stargazers"><img src="https://img.shields.io/github/stars/som1ng/API-QuickCheck?style=flat-square&color=cc785c" alt="Stars"></a>
  <a href="https://github.com/som1ng/API-QuickCheck/blob/main/LICENSE"><img src="https://img.shields.io/github/license/som1ng/API-QuickCheck?style=flat-square&color=383531" alt="License"></a>
  <a href="https://api-quick-check.vercel.app/"><img src="https://img.shields.io/badge/Vercel-Live%20Demo-141413?style=flat-square&logo=vercel" alt="Vercel"></a>
</p>

<p>
  <a href="https://api-quick-check.vercel.app/"><strong>Live Demo</strong></a> ·
  <a href="#1-design-philosophy--vision"><strong>Philosophy</strong></a> ·
  <a href="#2-key-advantages--highlights"><strong>Highlights</strong></a> ·
  <a href="#3-industrial-batch-api-key-testing--scrubbing"><strong>Batch Testing</strong></a> ·
  <a href="#4-headless-cli--autonomous-ai-agent-integration"><strong>Agent/CLI</strong></a> ·
  <a href="#5-fidelity-forensics--24-probe-matrix"><strong>24 Probes</strong></a> ·
  <a href="#6-quick-start"><strong>Quick Start</strong></a> ·
  <a href="./README.md"><strong>中文主页</strong></a>
</p>

</div>

---

## 1. Design Philosophy & Vision

### Why API-QuickCheck?

In today's fast-growing LLM API relay, proxy, and aggregator markets, developers and autonomous AI Agent builders frequently face hidden **black-box pitfalls**:

- **Model Substitution Fraud**: Routing requests to cheap, quantized models (e.g. masquerading small checkpoints as Claude 3.7 / GPT-5) or downgrading difficult queries;
- **Fake Thought Stream Injections**: Hardcoding text tags like `<think>` into standard text completions to simulate reasoning;
- **Gateway Packet Alteration & Credential Stripping**: Middlewares dropping Anthropic's private-key Thinking Signatures or flattening Token Usage fields, breaking downstream agent continuation;
- **Silent Context Truncation**: Claiming 128K/200K token windows but silently cutting inputs beyond 16K;
- **Opaque Rate Limits & Stolen Quotas**: Lack of billing transparency or standard error echoes.

### The Four Pillars of API-QuickCheck

1. **Deterministic Protocol Forensics**:
   Instead of subjective LLM-as-a-Judge grading, API-QuickCheck employs **Anthropic Thinking Signature turn-2 cryptographic validation**, **Native SSE Wire Event State Machines**, and **Strict JSON Schema hidden fixtures** for 100% deterministic verdicts.
2. **Industrial High-Throughput Key Scrubbing**:
   Engineered for teams and gateway administrators managing hundreds of API keys, featuring a 1~50 dynamic worker pool, anti-ban jitter scheduling, billing endpoint penetration, and multi-format export.
3. **Headless CLI for Autonomous AI Agents**:
   Designed for Claude Code, Cursor, Cline, AutoGPT, and CI/CD pipelines to autonomously verify endpoints, check protocol fidelity, and trigger failovers.
4. **Client-Only Execution & Zero Data Logging**:
   100% in-memory browser and CLI execution. API Keys never touch third-party servers.

---

## 2. Key Advantages & Highlights

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   API-QUICKCHECK 3.2 ARCHITECTURE                                │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│  🚀 Batch Key Testing Engine   │   🤖 Headless CLI & Agent Engine  │  🛡️ 24-Probe Forensics Suite  │
│  • 1~50 Dynamic Worker Pool   │  • Standalone Node/TS CLI        │  • 9 Frontier Flagship Models │
│  • ±25% Jitter Anti-Ban Jitter│  • npx api-quickcheck zero-setup │  • Claude Thinking Signature  │
│  • Smart Regex Key Extraction │  • Standardized --json Output    │  • Native reasoning_content   │
│  • Quota & Balance Sniffing   │  • Agent Auto-Discovery & Health │  • Strict JSON & Tool Loops   │
│  • TXT / CSV(BOM) / JSON Exp  │  • CI/CD Quality Gate Compatible │  • Real-Time Token & Time UI  │
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

---

## 3. Industrial Batch API Key Testing & Scrubbing (Highlight)

### 1. Smart Unstructured Text Key Extraction
Automatically extracts clean API keys from raw text, newlines, commas, semicolons, CSV columns, JSON arrays, or messy blocks with prefixes like `sk-` and `key:`.

### 2. Dynamic 1~50 Worker Pool with Graceful Cancellation
- Real-time slider controlling concurrency from 1 to 50 threads;
- Microsecond-level cancellation via `AbortController`.

### 3. Three-Tier Rate Limiting with ±25% Jitter Scheduling
- **Safe Mode**: Single-thread serialized dispatch with randomized jitter;
- **Balanced Mode**: 10 threads, balancing throughput and network stability;
- **Turbo Mode**: 30~50 threads, scrubbing hundreds of keys within 10 seconds.

### 4. Deep Quota & Balance Sniffing Across Major Gateway Panels
Penetrates target endpoints to extract total allowance, used tokens, remaining balance, and currencies:
- **OneAPI / NewAPI / DoneAPI / V3 API** (`/dashboard/billing/subscription`, `/api/user/self`)
- **OpenRouter** (`/api/v1/credits`)
- **DeepSeek / SiliconFlow / Common Relays** (`/v1/user/balance`, `/user/balance`)

### 5. Multi-Format Export & Local History Persistence
- **Clean TXT Export**: Newline-delimited active keys (`api-keys-active-20260820.txt`);
- **Excel-Compatible CSV**: Injected **UTF-8 BOM** preventing character corruption in Excel, including Key, Masked Key, Status, Latency, Balance, and Error details;
- **Structured JSON Report**: Complete batch metadata and statistics;
- **Local Persistence**: Stores up to 20 historical batches in `localStorage` for instant 1-click restoration.

---

## 4. Headless CLI & Autonomous AI Agent Integration (Highlight)

API-QuickCheck includes a zero-dependency headless CLI (`apiqc`) designed for modern autonomous coding agents and automated quality gates:

```bash
# 1. Zero-install instant run via npx (Recommended)
npx api-quickcheck audit \
  --model anthropic/claude-3.7-sonnet \
  --base-url https://openrouter.ai/api/v1 \
  --api-key sk-or-v1-xxxxxx \
  --json > audit-report.json

# 2. Global npm installation
npm install -g api-quickcheck

apiqc audit \
  --model gpt-5.6-sol \
  --base-url https://api.your-relay.com/v1 \
  --api-key sk-xxxxxx \
  --profile quick
```

### CLI Parameters Reference

| Option | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `--model` | `string` | **Required**. Target model ID (e.g. `gpt-5.6-sol`, `claude-3-7-sonnet`) | - |
| `--base-url` | `string` | **Required** (or via `APIQC_BASE_URL` env). Relay or official base URL | - |
| `--api-key` | `string` | **Required** (or via `APIQC_API_KEY` env). Kept in-memory only | - |
| `--provider` | `string` | Provider adapter: `auto`, `openai`, `anthropic`, `gemini`, `xai`, `openrouter` | `auto` |
| `--profile` | `string` | Audit tier: `quick` (~15s), `balanced` (~30s), `deep` (~50s) | `balanced` |
| `--probes` | `string` | Comma-separated probe IDs (e.g. `p0-stream-events,p0-strict-json`) | Preset default |
| `--out` | `string` | Output JSON report file path | `audit-report.json` |
| `--json` | `boolean` | Output raw clean JSON for automated Agent pipelines | `false` |

---

## 5. Fidelity Forensics & 24-Probe Matrix

### 1. Supported 9 Frontier Models

```text
┌─────────────────────────┬───────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Provider                │ Model ID                      │ Frontier Tier & Forensics Focus                             │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ OpenAI                  │ gpt-5.6-sol                   │ Flagship Frontier · Hard Tool Planning, Code Repair, 64K    │
│                         │ gpt-5.6-terra                 │ Balanced Workhorse · Responses API & Strict JSON Schema     │
│                         │ gpt-5.6-luna                  │ Low-Latency Agent Execution Engine                          │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Anthropic               │ claude-fable-5                │ Frontier · Adaptive Thinking Signature Continuity           │
│                         │ claude-opus-5                 │ Coding & Reasoning · Complex Multi-Step Tool Loops          │
│                         │ claude-sonnet-5               │ Mainstream Agent Engine · Messages API & Prompt Caching     │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Google                  │ gemini-3.1-pro-preview        │ 2M Context Frontier · Thought Signature & Multimodal Vision │
│                         │ gemini-3.7-flash              │ Ultra-Fast Agent Orchestrator · Interactions API            │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ xAI                     │ grok-4.6                      │ Realtime Frontier · Controlled Tools, Live Search & Sandbox │
└─────────────────────────┴───────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

### 2. The 24-Probe Matrix

```text
                                 ┌── [ P0 Protocol (7) ] ➔ Discovery, Route, Auth, SSE Stream, Strict JSON, Tool Shape, Invalid Param
                                 ├── [ P1 Architecture (5) ] ➔ Reasoning Config, State Continuity, Tool Roundtrip, Signature, Cache
API-QuickCheck 3.2 ──────────────┼── [ P2 Capabilities (8) ] ➔ JSON Benchmark, Tool Plan, Code Repair (A/B), Needle in Haystack (64K)
                                 └── [ P3 Runtime Quality (4) ] ➔ Repeat Sample Probes A / B / C / D
```

---

## 6. Quick Start

### Option 1: Live Web App (Zero Deployment)
Access the live application at: **[https://api-quick-check.vercel.app/](https://api-quick-check.vercel.app/)**

### Option 2: Run Headless CLI via npx
```bash
npx api-quickcheck audit --model gpt-5.6-sol --base-url https://api.your-relay.com/v1 --api-key sk-xxx
```

### Option 3: Local Repository Development
```bash
# 1. Clone repository
git clone https://github.com/som1ng/API-QuickCheck.git
cd API-QuickCheck

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run full unit test suite
npm test

# 5. Full production build
npm run build
```

---

## 7. Tech Stack

- **Frontend Core**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Anthropic Claude Warm-Dark Editorial System (Strict Zero-Emoji UI)
- **Icons**: Lucide React
- **Transport**: Native Fetch + High-Performance SSE Wire Reader
- **Build**: esbuild (CLI Bundle) + Rollup (Web App)

---

## 8. License

Distributed under the **MIT License**. See `LICENSE` for details.
