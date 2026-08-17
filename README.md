<div align="center">

<table>
  <tr>
    <td width="28%" align="center" style="border:none; background: transparent; vertical-align: middle;">
      <img src="./public/logo.png" width="130" height="130" alt="API-QuickCheck Logo" style="border-radius: 26px; box-shadow: 0 12px 36px rgba(204,120,92,0.35);" />
      <br />
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: bold; color: #cc785c; letter-spacing: 0.5px;">API-QUICKCHECK 2.0</span>
    </td>
    <td width="72%" align="left" style="border:none; background: transparent; vertical-align: middle;">
      <pre lang="text">
   █████╗ ██████╗ ██╗     ██████╗ ██╗   ██╗██╗ ██████╗██╗  ██╗
  ██╔══██╗██╔══██╗██║    ██╔═══██╗██║   ██║██║██╔════╝██║ ██╔╝
  ███████║██████╔╝██║    ██║   ██║██║   ██║██║██║     █████╔╝ 
  ██╔══██║██╔═══╝ ██║    ██║▄▄ ██║██║   ██║██║██║     ██╔═██╗ 
  ██║  ██║██║     ██║    ╚██████╔╝╚██████╔╝██║╚██████╗██║  ██╗
  ╚═╝  ╚═╝╚═╝     ╚═╝     ╚══▀▀═╝  ╚═════╝ ╚═╝ ╚═════╝╚═╝  ╚═╝
  ─────────────────────────────────────────────────────────────
  ⚡ Universal AI Relay Forensics, Batch Testing & Agent Adapter
      </pre>
    </td>
  </tr>
</table>

<p>
  <a href="https://github.com/som1ng/API-QuickCheck/stargazers"><img src="https://img.shields.io/github/stars/som1ng/API-QuickCheck?style=flat-square&color=cc785c" alt="Stars"></a>
  <a href="https://github.com/som1ng/API-QuickCheck/network/members"><img src="https://img.shields.io/github/forks/som1ng/API-QuickCheck?style=flat-square&color=383531" alt="Forks"></a>
  <a href="https://github.com/som1ng/API-QuickCheck/blob/main/LICENSE"><img src="https://img.shields.io/github/license/som1ng/API-QuickCheck?style=flat-square&color=5db872" alt="License"></a>
  <a href="https://github.com/som1ng/API-QuickCheck/releases"><img src="https://img.shields.io/badge/version-2.2.0-cc785c.svg?style=flat-square" alt="Version"></a>
  <a href="https://api-quick-check.vercel.app/"><img src="https://img.shields.io/badge/Vercel-Live%20Demo-141413?style=flat-square&logo=vercel" alt="Vercel"></a>
</p>

<p>
  <a href="https://api-quick-check.vercel.app/"><strong>🚀 Live Demo</strong></a> ·
  <a href="#-why-api-quickcheck-20"><strong>Why QuickCheck</strong></a> ·
  <a href="#-core-capabilities"><strong>Core Features</strong></a> ·
  <a href="#-2026-frontier-model-baseline-matrix"><strong>2026 Baseline</strong></a> ·
  <a href="#-quick-start"><strong>Quick Start</strong></a> ·
  <a href="./README_zh.md"><strong>🇨🇳 中文说明</strong></a>
</p>

</div>

---

## ⚡ Why API-QuickCheck 2.0?

In today's crowded AI proxy and middleman ecosystem, **model substitution fraud** (e.g. silently routing Claude 3.7 / OpenAI o3 to cheap alternatives, faking `<think>` tags in raw text, silent context truncation, and severe gateway queueing) has become a rampant trap for developers and AI agent builders.

**API-QuickCheck 2.0** provides an end-to-end cryptographic and runtime forensics engine:

- 🛡️ **Zero Guesswork**: Anthropic official private-key **Thinking Signature turn-2 cryptographic verification**;
- 🧠 **Native Stream Forensics**: Validates raw `reasoning_content` delta chunks to uncover hardcoded `<think>` text fakes;
- ⚡ **Microsecond Benchmarks**: Measures **TTFT (Time to First Token)**, real-time **TPS throughput**, and **Chunk Jitter variance**;
- 🔑 **Intelligent Batch Key Tester**: High-concurrency ping pool with **±25% jitter anti-ban delay**, memory-cached endpoint routing, and quota extraction;
- 🔄 **2026 Frontier Baseline Auto-Sync**: Automated CI/CD pipelines & manual triggers keep official capability baselines up to date every 3 days;
- 🔒 **Absolute Privacy**: Crafted in the **Anthropic Claude Warm Dark Editorial Design System**, with **zero backend databases and zero data logging**.

---

## 🎯 Core Capabilities

```text
                                 ┌── [ 1. Deep Forensics ] ➔ Claude Thinking Signature / R1 Reasoning Stream
                                 ├── [ 2. Speed Benchmark ] ➔ Microsecond TTFT / Real-time TPS / Jitter Variance
                                 ├── [ 3. Batch Key Ping ] ➔ Jitter Anti-Ban / Quota Sniffer / Multi-Format Export
API-QuickCheck 2.0 ──────────────┼── [ 4. Model Discovery ] ➔ Dual-Engine Sniffing / 100% Hidden Model Probing
                                 ├── [ 5. 2026 Baselines ] ➔ 24-Probe Policy / Automated 3-Day CI/CD Sync
                                 └── [ 6. Agent Adapter ] ➔ Claude Code / Cline / Cursor / Dify 1-Click Config
```

### 1. Deep Fidelity & Model Fraud Forensics
- **Anthropic Official Cryptographic Validation (Thinking Signature)**:
  Extracts Anthropic's private-key cryptographic signature from `thinking` blocks and submits it back to Anthropic in turn 2 for official cryptographic verification. **Spoofing or relaying via cheap models is mathematically impossible!**
- **DeepSeek-R1 / OpenAI o-Series Native Reasoning Stream Check**:
  Verifies the native `delta.reasoning_content` protocol layer, instantly exposing fake `<think>` text tags inserted by low-quality gateways.
- **Metacognitive Conflict & SVG Spatial Probes**:
  Uncovers stealthy `"You are Claude"` system prompt injections; verifies SVG 3D geometry and knowledge cutoff dates.

### 2. Microsecond Latency & Performance Benchmark
- **Time to First Token (TTFT)**: Precisely measures network handshake and gateway queueing delay before the first token arrives.
- **Live TPS Throughput**: Tracks real-time token generation velocity with an interactive typewriter terminal.
- **Jitter Variance**: Calculates inter-chunk arrival variance to diagnose rate limits, Nginx buffer delays, and gateway congestion.

### 3. Smart Batch API-Key Testing & Anti-Ban Pool
- **Intelligent Raw Input Cleaning**: Extracts clean API keys from plain text, commas, CSV columns, and JSON arrays.
- **Adaptive Anti-Ban Protection**:
  - **±25% Jitter Delay**: Randomizes concurrent request intervals to prevent IP rate-limit bans;
  - **Memory Endpoint Cache**: Remembers verified working endpoints to reduce subsequent payload traffic by 80%;
  - **429 Circuit Breaker**: Automatically backs off upon gateway congestion.
- **Balance & Quota Sniffer**: Auto-detects balances across **OneAPI, NewAPI, DoneAPI, OpenRouter, SiliconFlow, DeepSeek**.
- **Multi-Format Export & History**: 1-click export to TXT, CSV (Excel BOM compliant), JSON, with local persistent recovery.

### 4. 2026 Frontier Model Baselines & 24-Probe Policy
- Complete coverage across **24 logical audit probes** spanning Protocol (P0), Architecture (P1), Capability (P2), and Quality (P3);
- Built-in GitHub Actions workflow (`sync-model-baselines.yml`) syncing authoritative global models every 3 days;
- In-document **[🔄 Manual Sync]** button for instant in-browser updates.

---

## 📊 Technical Comparison Matrix

| Evaluation Dimension | Traditional Shell Scripts | Generic Online Ping Tools | **API-QuickCheck 2.0** |
| :--- | :---: | :---: | :---: |
| **Claude Private-Key Auth** | Not Supported | ⚠️ Incomplete text heuristic | ✅ **100% Official Turn-2 Cryptographic Check** |
| **Reasoning Stream Forensics** | Not Supported | Not Supported | ✅ **Native `reasoning_content` validation** |
| **Batch Key Anti-Ban Engine** | ⚠️ High ban risk | Basic sequential ping | ✅ **±25% Jitter + Endpoint Memory Cache** |
| **Hidden Model Discovery** | Exits on 404 | Not Supported | ✅ **Dual-Engine + 16-Model Fast Prober** |
| **2026 Model Baseline Sync** | Hardcoded | Outdated | ✅ **Every 3-Day CI/CD Auto-Sync & Manual UI** |
| **Design Aesthetics** | Basic / Cluttered | Chaotic dashboard | ✅ **Anthropic Warm Dark + Tactile Magic Slider** |
| **API Key Privacy** | Uploaded to server | Stored in cloud DB | ✅ **100% In-Memory · Never Leaves Browser** |

---

## 🚀 Quick Start

### Option 1: Live Web App (No Installation Needed)
Visit the live deployment directly: **[https://api-quick-check.vercel.app/](https://api-quick-check.vercel.app/)**

### Option 2: Local Development

```bash
# 1. Clone repository
git clone https://github.com/som1ng/API-QuickCheck.git
cd API-QuickCheck

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. (Optional) Run 24-probe audit test suite
npm test

# 5. (Optional) Sync latest 2026 model baselines
npm run sync:models
```

---

## 🛠️ Tech Stack

- **Core**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Anthropic Claude Warm-Dark Editorial System
- **Rendering & Math**: ReactMarkdown, KaTeX, Rehype-Katex, Mermaid.js
- **Icons**: Lucide React
- **Edge Deployment**: Vercel Serverless Edge Functions

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
