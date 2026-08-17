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
  ⚡ 面向 AI 中转站的全能真伪鉴别、批量测活与 Agent 适配引擎
      </pre>
    </td>
  </tr>
</table>

<p>
  <a href="https://github.com/som1ng/API-QuickCheck/stargazers"><img src="https://img.shields.io/github/stars/som1ng/API-QuickCheck?style=flat-square&color=cc785c" alt="Stars"></a>
  <a href="https://github.com/som1ng/API-QuickCheck/network/members"><img src="https://img.shields.io/github/forks/som1ng/API-QuickCheck?style=flat-square&color=383531" alt="Forks"></a>
  <a href="https://github.com/som1ng/API-QuickCheck/blob/main/LICENSE"><img src="https://img.shields.io/github/license/som1ng/API-QuickCheck?style=flat-square&color=5db872" alt="License"></a>
  <a href="https://github.com/som1ng/API-QuickCheck/releases"><img src="https://img.shields.io/badge/version-2.2.0-cc785c.svg?style=flat-square" alt="Version"></a>
  <a href="https://api-quick-check.vercel.app/"><img src="https://img.shields.io/badge/Vercel-在线体验-141413?style=flat-square&logo=vercel" alt="Vercel"></a>
</p>

<p>
  <a href="https://api-quick-check.vercel.app/"><strong>🚀 在线体验 (Live Demo)</strong></a> ·
  <a href="#-为什么选择-api-quickcheck-20"><strong>核心优势</strong></a> ·
  <a href="#-六大核心功能矩阵"><strong>功能矩阵</strong></a> ·
  <a href="#-2026-前沿模型基线与探针体系"><strong>基线体系</strong></a> ·
  <a href="#-快速开始"><strong>快速开始</strong></a> ·
  <a href="./README.md"><strong>🌐 English Version</strong></a>
</p>

</div>

---

## ⚡ 为什么选择 API-QuickCheck 2.0？

在当前繁杂的大模型 API 中转市场中，“**挂羊头卖狗肉**”（用低配模型冒充 Claude 3.7 / OpenAI o3、伪造 `<think>` 标签、偷截断上下文、网关排队严重）已成为开发者和企业级 Agent 调用的重灾区。

**API-QuickCheck 2.0** 诞生于最严苛的技术鉴别与工程化需求：

- 🛡️ **拒绝主观玄学**：引入数学级不可伪造的 **Anthropic 官方私钥签名二次验签**；
- 🧠 **原生思维流鉴伪**：严格校验 `reasoning_content` 原生事件流，秒级揭穿假 `<think>` 文本标签；
- ⚡ **微秒级流式基准**：涵盖 **TTFT 首字延迟、实时 TPS 吞吐、Jitter 抖动方差** 的全套流式指标；
- 🔑 **工业级 API Key 批量测活**：独创 **±25% Jitter 防封抖动调度**、端点智能记忆缓存与多格式防乱码导出；
- 🔄 **2026 前沿模型基线自动同步**：集成 GitHub Actions 每 3 天全自动同步全球最新权威模型清单，文档内支持一键手动刷新；
- 🔒 **纯净安全第一**：采用 **Anthropic Claude 官方暖暗设计系统 (Editorial Design System)**，零数据落盘，API Key 绝不离开浏览器内存。

---

## 🎯 六大核心功能矩阵

```text
                                 ┌── [ 1. 深度验真 ] ➔ Claude 私钥签名 / R1 原生思考流 / 认知冲突探针
                                 ├── [ 2. 流式测速 ] ➔ 微秒级 TTFT / 实时 TPS 吞吐 / Jitter 方差
                                 ├── [ 3. 批量测活 ] ➔ Jitter 防封调度 / 余额嗅探 / 多格式导出 / 历史回放
API-QuickCheck 2.0 ──────────────┼── [ 4. 隐藏嗅探 ] ➔ 双引擎全端点发现 / 16款模型并发高速探针
                                 ├── [ 5. 基线矩阵 ] ➔ 24 项全量审计探针 / 每 3 天定时自动更新
                                 └── [ 6. Agent 导出 ] ➔ Claude Code / Cline / Cursor / Dify 一键配置
```

### 1. 深度真伪与降级掺假鉴别 (Fidelity Forensics)
- **Anthropic 官方私钥签名验真 (Thinking Signature)**：
  捕获服务端私钥签发的签名，在第 2 轮请求中**回传给 Anthropic 官方服务端进行密码学校验**。任何中转站套壳、反代或转接便宜模型都会在 1 秒内被实锤破防！
- **DeepSeek-R1 / OpenAI o-Series 原生思维链校验**：
  严格核验 `delta.reasoning_content` 底层流，秒级识别用假 `<think>` 标签在正文中硬编码欺骗用户的劣质中转。
- **元认知冲突与几何空间拓扑指纹**：
  针对系统级 Prompt 注入嗅探（识别中转站后台注入的 `"You are Claude"` 伪装提示词）；验证 SVG 空间三维几何与知识库截止期。

### 2. 流式性能与测速基准 (Speed Benchmark)
- **微秒级 TTFT (Time to First Token)**：精确记录从 HTTP 握手到首个数据块到达的排队等待时长。
- **实时 TPS 吞吐 (Tokens/s)**：流式生成速率计算，配备交互式打字机终端监控。
- **Jitter 网络抖动方差**：计算连续 Chunk 到达时间间隔方差，一眼识别中转站是否处于超载拥塞或被反代限速。

### 3. API Key 批量并发测活与防封系统 (Batch Key Tester)
- **智能格式清洗**：从纯文本、换行、逗号、CSV 乱序表格、JSON 数组中一键提取清洗纯净 API Key。
- **自适应防封调度**：
  - **±25% Jitter 抖动延时**：打散请求频率，有效规避高并发被中转站 WAF 封禁 IP；
  - **域名端点记忆池**：记忆成功端点，后续发包减少 80% 请求开销；
  - **429 智能熔断退避**：遭遇限流自动进入指数退避，保护账户安全。
- **全网余额穿透嗅探**：深度适配 **OneAPI、NewAPI、DoneAPI、OpenRouter、SiliconFlow、DeepSeek** 等平台计费路由。
- **多格式导出与持久化**：一键导出纯净 TXT、带 UTF-8 BOM 防 Excel 乱码的 CSV、结构化 JSON，支持本地 20 批次历史无损回放。

### 4. 2026 前沿模型基线与 24 项探针体系 (Baseline Matrix)
- 涵盖 **24 项完整逻辑审计探针**，覆盖协议层 (P0)、架构层 (P1)、能力层 (P2) 与质量层 (P3)；
- 内置 GitHub Actions 定时流水线（`sync-model-baselines.yml`），每 3 天定时从权威源拉取全球前沿模型声明；
- 文档区右上角配备 **【🔄 手动更新最新基线】** 按钮，支持在浏览器端实时同步。

---

## 📊 技术对比矩阵

| 评估维度 | 传统简陋测试脚本 | 常见在线中转测速网 | **API-QuickCheck 2.0** |
| :--- | :---: | :---: | :---: |
| **Claude 私钥验真** | 未支持 | ⚠️ 简陋文本判断 | ✅ **100% 官方第二轮回传密码学验签** |
| **思维链防伪** | 未支持 | 未支持 | ✅ **严格校验原生 `reasoning_content`** |
| **批量 Key 防封引擎** | ⚠️ 高频易封号 | 单线程逐个测试 | ✅ **±25% Jitter 抖动 + 端点记忆缓存** |
| **隐藏模型嗅探** | 遇到 404 即退出 | 未支持 | ✅ **双引擎 + 16款模型并发高速探针** |
| **2026 模型基线同步** | 硬编码固定数据 | 数据滞后已失效 | ✅ **每 3 天 CI/CD 自动同步 + 前端一键刷新** |
| **设计美学与交互** | 粗糙简陋 | 页面杂乱刺眼 | ✅ **Anthropic 暖暗调 + 磁吸物理滑块** |
| **密钥安全性** | 上传服务端 | 存入云端数据库 | ✅ **零数据落盘 · 密钥安全不离浏览器** |

---

## 🚀 快速开始

### 方式 1：在线开箱即用（推荐）
直接访问官方部署站点：**[https://api-quick-check.vercel.app/](https://api-quick-check.vercel.app/)**

### 方式 2：本地极速运行

```bash
# 1. 克隆代码仓库
git clone https://github.com/som1ng/API-QuickCheck.git
cd API-QuickCheck

# 2. 安装依赖
npm install

# 3. 启动本地开发服务
npm run dev

# 4. (可选) 运行 24 项探针审计测试套件
npm test

# 5. (可选) 手动同步最新 2026 前沿模型基线
npm run sync:models
```

---

## 🛠️ 技术栈一览

- **前端核心**：React 18, TypeScript, Vite
- **UI & 样式**：TailwindCSS, Anthropic Claude Warm-Dark Editorial System
- **文档与渲染**：ReactMarkdown, KaTeX 数学公式, Rehype-Katex, Mermaid.js
- **图标体系**：Lucide React
- **Edge 边缘部署**：Vercel Serverless Edge Functions

---

## 📄 开源许可证

本项目基于 **MIT License** 开源协议。详见 `LICENSE` 文件。
