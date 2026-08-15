<div align="center">
  <img src="./public/logo.png" width="108" height="108" alt="API-QuickCheck Logo" style="border-radius: 22px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);" />
  <h1>API-QuickCheck 2.0</h1>
  <p><strong>Universal AI API Relay Authenticity Forensics, Streaming Benchmark & Agent Adapter Suite</strong></p>

  <p>
    <a href="https://github.com/som1ng/API-QuickCheck/stargazers"><img src="https://img.shields.io/github/stars/som1ng/API-QuickCheck?style=flat-square&color=cc785c" alt="Stars"></a>
    <a href="https://github.com/som1ng/API-QuickCheck/network/members"><img src="https://img.shields.io/github/forks/som1ng/API-QuickCheck?style=flat-square&color=383531" alt="Forks"></a>
    <a href="https://github.com/som1ng/API-QuickCheck/blob/main/LICENSE"><img src="https://img.shields.io/github/license/som1ng/API-QuickCheck?style=flat-square&color=5db872" alt="License"></a>
    <a href="https://github.com/som1ng/API-QuickCheck/releases"><img src="https://img.shields.io/badge/version-2.2.0-cc785c.svg?style=flat-square" alt="Version"></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-Serverless%20Edge-black?style=flat-square&logo=vercel" alt="Vercel"></a>
  </p>

  <p>
    <a href="https://api-quick-check.vercel.app/"><strong>Live Demo</strong></a> ·
    <a href="#-why-api-quickcheck-20"><strong>Why QuickCheck</strong></a> ·
    <a href="#-core-modules"><strong>Features</strong></a> ·
    <a href="#-quick-start"><strong>Quick Start</strong></a> ·
    <a href="#-deploy-to-vercel"><strong>Deploy</strong></a> ·
    <a href="./README_zh.md"><strong>中文说明</strong></a>
  </p>
</div>

---

## ⭐ Why API-QuickCheck 2.0?

In today's crowded AI API proxy/middleman ecosystem, **model substitution fraud** (e.g. routing Claude 3.7 / o1 to cheap alternatives, faking `<think>` tags in text, silent context truncation, and severe gateway queueing) has become a common trap for developers and agent builders.

**API-QuickCheck 2.0** is purpose-built to solve this:
- **No Guesswork**: Features **Anthropic official private-key Thinking Signature turn-2 cryptographic verification**;
- **No Shallow Pings**: Provides comprehensive **microsecond TTFT, real-time TPS throughput, and inter-chunk Jitter variance**;
- **No Dead Ends**: Built-in **Dual-Engine model discovery** and **Vercel Serverless Edge proxy**, completely eliminating browser CORS and Cloudflare blocking;
- **Strict Privacy**: Crafted in the **Anthropic Claude Editorial Design System**, with zero backend databases and zero data persistence.

---

## ⭐ Core Modules

```
                                 ┌── [ 1. Fidelity ] ➔ Claude Thinking Signature / R1 Reasoning Stream
                                 ├── [ 2. Benchmark ] ➔ Microsecond TTFT / Real-time TPS / Jitter Variance
                                 ├── [ 3. Scanner ] ➔ Dual-Engine Discovery / 5-Thread Pool Classifier
API-QuickCheck 2.0 ──────────────┼── [ 4. Capability ] ➔ SSE Stream / Tool Calling / Vision / JSON Mode
                                 ├── [ 5. Balance ] ➔ OneAPI / NewAPI / DoneAPI / OpenRouter Quota Sniffing
                                 └── [ 6. Adapter ] ➔ Claude Code / Cline / Cursor / Dify 1-Click Configs
```

### 1. Deep Fidelity & Downgrade Forensics
- **Anthropic Official Thinking Signature Cryptographic Validation**:
  Extracts Anthropic's private-key signature from `thinking` blocks and submits it back to Anthropic in turn 2 for official cryptographic verification. **Spoofing or relaying with cheap models is mathematically impossible!**
- **DeepSeek-R1 / OpenAI o1 Native Reasoning Stream Check**:
  Verifies the native `delta.reasoning_content` protocol layer, instantly detecting fake `<think>` text tags.
- **Metacognitive Conflict & SVG Topology Probes**:
  Detects injected `"You are Claude"` system prompts; verifies SVG 3D spatial geometry and knowledge cutoffs.

### 2. Streaming Latency & Performance Benchmark
- **Microsecond TTFT (Time to First Token)**: Precisely measures network handshake and queueing delay until the first data chunk arrives.
- **Real-Time TPS Throughput**: Tracks live token velocity with an integrated streaming terminal typewriter.
- **Jitter Variance**: Calculates inter-chunk arrival variance to diagnose rate limits and proxy buffer congestion.

### 3. Dual-Engine 100% Model Discovery
- **Engine 1 (Standard Cascade)**: Concurrently polls `/v1/models`, `/models`, `/api/models` with universal payload extractors.
- **Engine 2 (Fast Chat Prober Fallback)**: **Even if the relay admin hides `/v1/models`**, fast concurrent probing across top 16 models in 500ms will 100% discover all active models.

### 4. Capability & Agent Readiness Matrix
- **SSE Stream**: Tests if persistent connections are broken by reverse proxies.
- **Tool / Function Calling**: Validates if middleman gateways strip or corrupt `tools` schemas (essential for **Cline, Cursor, Claude Code**).
- **Vision Multimodal**: Sends 1x1 base64 image probes to verify multimodal pipeline viability.
- **JSON Mode**: Validates `response_format` strict compliance.

### 5. Universal Relay Balance & Quota Sniffer
- Compatible with **OneAPI, NewAPI, DoneAPI, VoAPI, V3, OpenRouter, SiliconFlow, DeepSeek**.
- Normalizes 500,000-point ratios to USD / CNY amounts.

### 6. Coding Agent 1-Click Auto-Adapter
- Instantly generates validated configuration code for:
  - **Claude Code** (Anthropic CLI)
  - **Cline / Roo Code** (VS Code Agent)
  - **Cursor IDE**
  - **Cherry Studio / Chatbox**
  - **NextChat / Dify / FastGPT**

---

## ⭐ Technical Comparison Matrix

| Evaluation Dimension | Traditional Shell Scripts | Common Online Ping Sites | **API-QuickCheck 2.0** |
| :--- | :---: | :---: | :---: |
| **Claude Private-Key Auth** | Not Supported | ⚠️ Incomplete text heuristic | ✅ **100% Official Cryptographic Turn-2 Check** |
| **Reasoning Stream Check** | Not Supported | Not Supported | ✅ **Native `reasoning_content` validation** |
| **Browser CORS Resolution** | ⚠️ Network Error | ⚠️ Centralized private server | ✅ **Local Middleware + Vercel Serverless Edge** |
| **Hidden Model Discovery** | Exits on 404 | Not Supported | ✅ **Candidate Routes + 16-Model Fast Prober** |
| **Design Aesthetics** | Basic / Cluttered | Chaotic dashboard | ✅ **Anthropic Claude Editorial System** |
| **API Key Privacy** | Uploaded to server | Saved to cloud DB | ✅ **100% In-Memory · Never Leaves Browser** |

---

## ⭐ Quick Start

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/som1ng/API-QuickCheck.git
cd API-QuickCheck

# 2. Install dependencies
npm install

# 3. Start development server (with CORS-free transparent proxy middleware)
npm run dev

# 4. Open in browser
open http://localhost:5173/
```

---

## ⭐ Deploy to Vercel

Optimized for **Vercel Serverless Edge Runtime** (`api/proxy.ts` and `vercel.json`):

1. **Fork** this repository to your GitHub account;
2. Log into [Vercel](https://vercel.com/), import the repository, and click **Deploy**;
3. Vercel automatically deploys the proxy as an Edge Function and the frontend to global CDN!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsom1ng%2FAPI-QuickCheck)

---

## ⚠️ Privacy & Security Commitment

- **Zero Data Persistence**: All keys are processed in client memory and never saved to any database.
- **100% Open Source**: Every network call and scoring algorithm is fully auditable.

---

## License

Released under the **[MIT License](./LICENSE)**.

<div align="center">
  <sub>Designed with Anthropic Editorial Aesthetics · Built for the Global AI Developer & Agent Community.</sub>
</div>
