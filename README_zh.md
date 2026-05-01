# ⚡ API-QuickCheck

<p align="center">
  <img src="https://img.shields.io/github/license/som1ng/API-QuickCheck?style=flat-square&color=blue" alt="license">
  <img src="https://img.shields.io/github/stars/som1ng/API-QuickCheck?style=flat-square&color=gold" alt="stars">
  <img src="https://img.shields.io/github/forks/som1ng/API-QuickCheck?style=flat-square&color=gray" alt="forks">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel" alt="Vercel">
</p>

[**English**](./README.md) | [**中文说明**](./README_zh.md)

**在线体验：[https://api-quick-check.vercel.app/](https://api-quick-check.vercel.app/)**

---

## 🌟 什么是 API-QuickCheck？

**API-QuickCheck** 是一款专业、极速、且**纯前端运行**的 LLM API Key 检测工具。告别繁琐的 `curl` 命令和来源不明的第三方中转。您可以放心地验证 **DeepSeek**, **OpenAI**, **Claude**, **Gemini** 等主流密钥的有效性与隐私安全。

### 🚀 为什么选择我们？
- **零后端支持**：所有请求均直接从您的浏览器发起。您的 API Key 绝不会上传到我们的服务器。
- **精准额度探测**：深度处理 `402 Payment Required` (欠费) 和 `401 Unauthorized` (无效) 错误，精准判断是 Key 填错了，还是额度用完了。
- **Agent 一键配置**：测通 Key 后，自动生成 **Claude Code**, **Cline**, **OpenClaw** 等工具的配置代码块。

---

## ✨ 核心特性

- 🔒 **绝对隐私**：100% 客户端运行。数据不出浏览器，安全无忧。
- 💸 **智能余额探测**：精准检测账户有效性与额度状态。完美解决：“如何查询 DeepSeek API 余额？”等痛点。
- 🔀 **协议转换指南**：内置 **LiteLLM** 配置引导，轻松将非 Anthropic 模型接入 **Claude Code**。
- 🎨 **SaaS 级 UI**：基于现代 SaaS 审美设计的极简界面，支持毛玻璃效果与丝滑的微动画。
- 🌐 **广泛的服务商支持**：
  - **国际**：OpenAI, Claude (Anthropic), Gemini (Google), OpenRouter, Groq, Together AI, NVIDIA NIM。
  - **国内**：DeepSeek (深度求索), 硅基流动 (SiliconFlow), Kimi (月之暗面), 通义千问 (DashScope), 智谱 GLM 等。

---

## 🛠️ 极速开始

### 在线使用
直接访问 [在线版](https://api-quick-check.vercel.app/) 即可开始测试。

### 本地开发
1. **克隆并安装依赖**
   ```bash
   git clone https://github.com/som1ng/API-QuickCheck.git
   cd API-QuickCheck
   npm install
   ```
2. **运行开发服务器**
   ```bash
   npm run dev
   ```
3. **生产环境构建**
   ```bash
   npm run build
   ```

---

## 🔍 SEO 与使用场景

无论您是在寻找 **OpenAI 余额查询工具**，还是想**测试 Claude API Key 有效性**，亦或是需要**验证 DeepSeek API 连通性**，API-QuickCheck 都是您的终极选择。

- **检查 DeepSeek API Key**：验证您的 Key 是否支持 `deepseek-chat` 或 `deepseek-reasoner`。
- **OpenAI 密钥验证**：即时查看密钥是处于激活状态还是已被撤销。
- **Agent 接入引导**：为您的 AI Agent 获取正确的 `BASE_URL` 和环境变量。

---

## 🛡️ 隐私声明

本项目专为开发者和 AI 爱好者打造。
- **不收集数据**：我们不使用 Cookie，不进行任何形式的追踪，更没有后端数据库。
- **安全性**：由于项目完全开源，您可以随时审计源代码，确保您的 API Key 仅发送给您指定的官方接口。

---

## 📜 许可证

基于 **MIT License** 开源。详见 `LICENSE` 文件。

---

<p align="center">Made with ❤️ for the AI Open Source Community.</p>
