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
               ██████╗██╗  ██║███████╗ ██████╗██╗  ██╗
              ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝
              ██║     ███████║█████╗  ██║     █████╔╝
              ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗
              ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗
               ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝
 ─────────────────────────────────────────────────────────────
 ⚡ Relay authenticity forensics, batch key testing & agent automation
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
  <a href="#1-design"><strong>Design</strong></a> ·
  <a href="#2-core-capabilities"><strong>Capabilities</strong></a> ·
  <a href="#3-batch-testing"><strong>Batch Testing</strong></a> ·
  <a href="#4-cli--agent-integration"><strong>Agent/CLI</strong></a> ·
  <a href="#5-audit-probes"><strong>Probes</strong></a> ·
  <a href="#6-quick-start"><strong>Quick Start</strong></a> ·
  <a href="./README.md"><strong>中文主页</strong></a>
</p>

</div>

---

## 1. Design

Model swapping at relay stations is hard to catch because the replies look fine on the surface. A quantized small model can still hold a conversation, and a downgraded route makes no difference on easy questions. By the time the writing feels off, you've already paid for another month.

So this project ignores writing style and looks at protocol and evidence instead:

- **Signature replay verification**: Claude's thinking blocks carry a server-side signature from Anthropic. Round one captures it, round two replays it verbatim, and only an official verification pass counts. A rewritten or forged signature gets an instant 400 from the official endpoint. This is the only check in the suite that can reach an encryption-level verdict.
- **Hard protocol assertions**: SSE event order, strict JSON schema, byte-level `tool_use_id` round trips. Wrong is wrong — there is no "feels a bit off".
- **Batch key testing**: pools of hundreds of keys, tunable concurrency, stoppable at any moment, results exported in formats you can use directly.
- **Fully local**: everything runs in browser or CLI memory and exits. Keys never touch a third-party server.

---

## 2. Core Capabilities

| Batch Testing | CLI / Agent | Audit Probes |
| :--- | :--- | :--- |
| 1–50 concurrent workers, adjustable live | `npx api-quickcheck` runs without install | Covers 9 frontier 2026 flagship models |
| ±25% random jitter between requests to stay under risk control | `--json` clean output, logs go to stderr | Claude thinking signature replay verification |
| Regex-extracts keys from mixed text / CSV / JSON / .env | Standalone Node CLI, fits GitHub Actions | SSE event order, strict JSON, tool-call round trips |
| Sniffs OneAPI / NewAPI / OpenRouter panel balances | Ships a Skill for Claude Code, Cursor and other agents | Token breakdown and end-to-end latency |

---

## 3. Batch Testing

Built for the moment you're holding a pile of keys and need to sort them fast: team procurement, aggregator sites, key-pool maintenance.

**Feed it anything.** Keys buried in plain text, newlines, commas, semicolons, CSV tables or JSON arrays — with `key:` or `sk-` prefixes, even Chinese comments mixed in — all get extracted into a clean key list.

**Concurrency 1–50, adjustable in real time**, built on AbortController, pausable and stoppable at any point. Three presets:

- **Cautious**: single thread, ±25% random jitter between requests, for sites with strict risk control;
- **Standard**: 10 workers, a compromise between speed and stability;
- **Fast**: 30–50 workers, a few hundred keys done in seconds.

**Balance lookup along the way.** Auto-detects the billing panel behind the Base URL and pulls total quota, used, remaining and currency. Compatible with:

- OneAPI / NewAPI / DoneAPI / V3 API (`/dashboard/billing/subscription`, `/api/user/self`)
- OpenRouter (`/api/v1/credits`)
- DeepSeek / SiliconFlow and similar aggregators (`/v1/user/balance`, `/user/balance`)

**Results you can use directly**:

- **TXT**: plain list of valid keys;
- **CSV**: UTF-8 BOM injected so Excel opens it without mojibake; masked keys, latency, balance, error details included;
- **JSON**: full batch metadata (time, provider, endpoint, summary stats);
- The last 20 batches are auto-saved to localStorage for review.

---

## 4. CLI & Agent Integration

The CLI is called `apiqc` and shares the same audit engine as the web app. Keys exist only in process memory.

### batch command (new in v3.3)

Accepts `.json` / `.csv` / `.env` / `.txt` files or piped input, probing multiple models concurrently:

```bash
# Batch-test keys from a file, clean JSON output (designed for agent consumption)
npx api-quickcheck batch --input ./keys.json --models "claude-3-7-sonnet,gpt-4o,deepseek-r1" --json

# Batch-test and export only the valid keys as .env
npx apiqc batch --input ./keys.csv --export-valid ./valid_keys.env

# Piped input
cat keys.txt | npx apiqc batch --base-url https://api.relay.com/v1 --models "gpt-4o"
```

### audit command

```bash
# Run without installing (recommended)
npx api-quickcheck audit \
  --model anthropic/claude-3.7-sonnet \
  --base-url https://openrouter.ai/api/v1 \
  --api-key sk-or-v1-xxxxxx \
  --profile balanced

# Or install globally
npm install -g api-quickcheck

apiqc audit \
  --model gpt-5.6-sol \
  --base-url https://api.your-relay.com/v1 \
  --api-key sk-xxxxxx \
  --profile quick
```

### Parameters

| Parameter | Type | Description | Commands |
| :--- | :--- | :--- | :--- |
| `--input` | `string` | Input file path (`.json`, `.csv`, `.env`, `.txt`; `-` for stdin) | `batch` |
| `--models` | `string` | Comma-separated models to test (default `claude-3-7-sonnet,gpt-4o,deepseek-r1`) | `batch` |
| `--concurrency` | `number` | Concurrency limit (default `5`), avoids per-IP rate limits | `batch` |
| `--export-valid` | `string` | Export path for valid keys (`.env`, `.json`, `.csv`) | `batch` |
| `--model` | `string` | Model ID to audit (e.g. `gpt-5.6-sol`, `claude-3-7-sonnet`) | `audit` |
| `--base-url` | `string` | Relay or official Base URL | `audit`, `batch` |
| `--api-key` | `string` | Key under test (used in process memory only) | `audit` |
| `--profile` | `string` | Probe tier: `quick` (liveness) / `balanced` (standard) / `deep` (full) | `audit` |
| `--json` | `boolean` | Pure JSON output, progress logs go to stderr | all |
| `--out` | `string` | Path to save the structured JSON report | all |

### Agent Skill

Ships with [`skills/batch-api-audit/SKILL.md`](./skills/batch-api-audit/SKILL.md). Install it in Claude Code, Cursor and similar agents, and from then on you can drop a pile of keys into the conversation — the agent runs `npx apiqc batch` itself and reports the classification, no hand-holding required.

---

## 5. Audit Probes

### Supported models

| Vendor | Model ID | Positioning & verification focus |
| :--- | :--- | :--- |
| OpenAI | `gpt-5.6-sol` | Top flagship: complex tool planning, autonomous code repair, 64K needle retrieval |
| | `gpt-5.6-terra` | All-round workhorse: Responses API, strict JSON schema |
| | `gpt-5.6-luna` | High throughput, low latency: agent execution |
| Anthropic | `claude-fable-5` | Next-gen flagship: adaptive thinking signature continuity |
| | `claude-opus-5` | Top coding and deep reasoning: agent tool-loop closure |
| | `claude-sonnet-5` | Balanced mainline: native Messages routing, prompt caching |
| Google | `gemini-3.1-pro-preview` | 2M context: thought signature retention |
| | `gemini-3.7-flash` | Fast agent dispatch: Interactions protocol streaming |
| xAI | `grok-4.6` | Realtime reasoning: controlled tool turns, code sandbox |

### 24 probes in four layers

- **P0 protocol (7)**: model discovery, native routing, auth error semantics, stream event order, strict JSON, tool structure, invalid-param echo
- **P1 architecture (5)**: reasoning config passthrough, cross-turn state continuity, controlled tool turns, thinking signature continuity, cache semantics
- **P2 capability (8)**: constrained JSON, tool planning, code repair (arithmetic / sets), chart extraction, 64K needle retrieval (start / middle / end)
- **P3 quality (4)**: repeat-run samples A / B / C / D

A few worth calling out:

- **Thinking signature continuity (`p1-signature-continuity`)**: round one captures the server signature on the thinking block (a `redacted_thinking` encrypted block is replayed in its original shape); round two stuffs it back into the assistant message for verification. A relay that rewrites, truncates or forges the signature gets a 400 from the official endpoint. The only check in the suite that can reach an encryption-level verdict.
- **Stream event order (`p0-stream-events`)**: adapts to four streaming formats — OpenAI Responses, Anthropic Messages, Gemini, OpenRouter / ChatCompletions — and validates event types and their order. Cheaper and harder evidence than reading writing style.
- **Readable reports**: protocol coverage, probe pass rate, token breakdown, end-to-end latency. Every probe comes with evidence and timing, no jargon pile-up.

---

## 6. Quick Start

**Web app**: open [https://api-quick-check.vercel.app/](https://api-quick-check.vercel.app/), enter a Base URL and a key, and test.

**CLI without install**:

```bash
npx api-quickcheck audit --model gpt-5.6-sol --base-url https://api.your-relay.com/v1 --api-key sk-xxx
```

**Local development**:

```bash
git clone https://github.com/som1ng/API-QuickCheck.git
cd API-QuickCheck
npm install
npm run dev      # dev server
npm test         # unit tests
npm run build    # production build
```

---

## 7. Tech Stack

- React 18 + TypeScript + Vite
- TailwindCSS with an Anthropic Claude warm-dark editorial visual system (no emoji)
- Lucide React icons
- Native fetch + in-house SSE wire reader
- esbuild bundles the CLI, Rollup bundles the web app

---

## 8. License

MIT License. Issues and PRs welcome.
