# ⚡ API-QuickCheck

<p align="center">
  <img src="https://img.shields.io/github/license/som1ng/API-QuickCheck?style=flat-square&color=blue" alt="license">
  <img src="https://img.shields.io/github/stars/som1ng/API-QuickCheck?style=flat-square&color=gold" alt="stars">
  <img src="https://img.shields.io/github/forks/som1ng/API-QuickCheck?style=flat-square&color=gray" alt="forks">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel" alt="Vercel">
</p>

[**English**](./README.md) | [**中文说明**](./README_zh.md)

**Live Demo: [https://api-quick-check.vercel.app/](https://api-quick-check.vercel.app/)**

---

## 🌟 What is API-QuickCheck?

**API-QuickCheck** is a professional, high-speed, and **frontend-only** utility designed to validate LLM API keys instantly. Stop wrestling with `curl` commands or suspicious third-party proxies. Check your **DeepSeek**, **OpenAI**, **Claude**, and **Gemini** keys with absolute confidence and privacy.

### 🚀 Why choose us?
- **Zero Backend**: All requests originate directly from your browser. Your API keys never touch our servers.
- **Accurate Quota Detection**: Specifically handles `402 Payment Required` and `401 Unauthorized` errors to tell you if your key is invalid or just out of balance.
- **One-Click Agent Config**: Automatically generates configuration snippets for **Claude Code**, **Cline**, and **OpenClaw** once your key is verified.

---

## ✨ Key Features

- 🔒 **Absolute Privacy**: 100% Client-side execution. Your data stays in your browser.
- 💸 **Smart Balance Probe**: Precise detection of account validity and quota status. Perfect for answering: *"How to check DeepSeek API key balance?"*
- 🔀 **Protocol Translation**: Built-in guides for using **LiteLLM** to bridge protocol gaps between non-Anthropic models and **Claude Code**.
- 🎨 **Premium UI**: Modern SaaS-style minimalist interface with glassmorphism effects and smooth micro-animations.
- 🌐 **Wide Provider Support**: 
  - **Global**: OpenAI, Claude (Anthropic), Gemini (Google), OpenRouter, Groq, Together AI, NVIDIA NIM.
  - **Regional**: DeepSeek, SiliconFlow, Kimi (Moonshot), Qwen (DashScope), Zhipu GLM, and more.

---

## 🛠️ Quick Start

### Online Usage
Visit the [Web Version](https://api-quick-check.vercel.app/) and start testing immediately.

### Local Development
1. **Clone & Install**
   ```bash
   git clone https://github.com/som1ng/API-QuickCheck.git
   cd API-QuickCheck
   npm install
   ```
2. **Run Dev Server**
   ```bash
   npm run dev
   ```
3. **Build for Production**
   ```bash
   npm run build
   ```

---

## 🔍 SEO & Use Cases

Whether you are looking for an **OpenAI balance checker**, trying to **test Claude API key validity**, or need to **verify DeepSeek API connectivity**, API-QuickCheck is the ultimate tool.

- **Check DeepSeek API Key**: Verify if your key supports `deepseek-chat` or `deepseek-reasoner`.
- **OpenAI Key Validation**: Instantly see if your key is active or revoked.
- **Agent Integration**: Seamlessly get the `BASE_URL` and `ENV` variables for your favorite AI agents.

---

## 🛡️ Privacy & Disclaimer

This project is built for developers and AI enthusiasts.
- **No data collection**: We do not use cookies, tracking, or any backend storage.
- **Security**: Since it is open-source, you can audit the source code to verify that your API keys are only sent to the official endpoints you specify.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">Made with ❤️ for the AI Open Source Community.</p>
