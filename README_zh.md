<div align="center">
  <img src="./public/logo.png" width="108" height="108" alt="API-QuickCheck Logo" style="border-radius: 22px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);" />
  <h1>API-QuickCheck 2.0</h1>
  <p><strong>面向 AI 中转站的全能真伪鉴别、流式性能基准与 Agent 配置导出引擎</strong></p>

  <p>
    <a href="https://github.com/som1ng/API-QuickCheck/stargazers"><img src="https://img.shields.io/github/stars/som1ng/API-QuickCheck?style=flat-square&color=cc785c" alt="Stars"></a>
    <a href="https://github.com/som1ng/API-QuickCheck/network/members"><img src="https://img.shields.io/github/forks/som1ng/API-QuickCheck?style=flat-square&color=383531" alt="Forks"></a>
    <a href="https://github.com/som1ng/API-QuickCheck/blob/main/LICENSE"><img src="https://img.shields.io/github/license/som1ng/API-QuickCheck?style=flat-square&color=5db872" alt="License"></a>
    <a href="https://github.com/som1ng/API-QuickCheck/releases"><img src="https://img.shields.io/badge/version-2.2.0-cc785c.svg?style=flat-square" alt="Version"></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-Serverless%20Edge-black?style=flat-square&logo=vercel" alt="Vercel"></a>
  </p>

  <p>
    <a href="https://api-quick-check.vercel.app/"><strong>在线体验 (Live Demo)</strong></a> ·
    <a href="#-为什么选择-api-quickcheck-20"><strong>核心优势</strong></a> ·
    <a href="#-六大核心模块"><strong>功能矩阵</strong></a> ·
    <a href="#-快速开始"><strong>快速开始</strong></a> ·
    <a href="#-一键-vercel-部署"><strong>一键部署</strong></a> ·
    <a href="./README.md"><strong>English Version</strong></a>
  </p>
</div>

---

## ⭐ 为什么选择 API-QuickCheck 2.0？

在当前繁杂的大模型 API 中转市场中，“**挂羊头卖狗肉**”（用低配模型冒充 Claude 3.7 / o1、伪造 `<think>` 标签、偷截断上下文、网关排队严重）已成为开发者和企业踩坑的重灾区。

**API-QuickCheck 2.0** 诞生于最严苛的技术鉴别需求：
- **拒绝主观玄学**：引入数学级不可伪造的 **Anthropic 官方私钥签名二次验签**；
- **拒绝粗暴测速**：提供包含 **TTFT 首字延迟、TPS 吞吐与 Jitter 抖动方差** 的全套流式基准；
- **拒绝连通死角**：集成 **双引擎模型嗅探** 与 **Vercel Serverless Edge 代理**，彻底终结 CORS 跨域拦截与 Cloudflare 屏蔽；
- **纯净安全第一**：采用 **Anthropic Claude 官方设计哲学 (Editorial Design System)**，零数据落盘，API Key 绝不离开内存。

---

## ⭐ 六大核心模块

```
                                 ┌── [ 1. 真伪鉴别 ] ➔ Claude 私钥签名 / R1 原生思考流 / 认知冲突探针
                                 ├── [ 2. 性能测速 ] ➔ 微秒级 TTFT / 实时 TPS 吞吐 / Jitter 方差
                                 ├── [ 3. 批量巡检 ] ➔ 双引擎全端点嗅探 / 5线程高并发分类
API-QuickCheck 2.0 ──────────────┼── [ 4. 能力矩阵 ] ➔ SSE 流式 / Tool Calling / Vision / JSON Mode
                                 ├── [ 5. 余额穿透 ] ➔ OneAPI / NewAPI / DoneAPI / OpenRouter 额度解码
                                 └── [ 6. Agent 导出 ] ➔ Claude Code / Cline / Cursor / Dify 一键适配
```

### 1. 深度真伪与降级掺假鉴别 (Fidelity Forensics)
- **Anthropic 官方私钥签名验真 (Thinking Signature)**：
  通过向模型请求 `thinking` 输出捕获服务端私钥签发的签名，并在第 2 轮请求中**回传给 Anthropic 官方服务端进行密码学校验**。任何中转站套壳、反代或转接便宜模型都会在 1 秒内被实锤破防！
- **DeepSeek-R1 / OpenAI o1 原生思维链校验**：
  严格核验 `delta.reasoning_content` 原生底层流，秒级识别用假 `<think>` 标签在正文中硬编码欺骗用户的劣质中转。
- **元认知冲突与几何空间拓扑指纹**：
  针对系统级 Prompt 注入嗅探（识别中转站后台注入的 `"You are Claude"` 伪装提示词）；验证 SVG 空间三维几何与知识库截止期。

### 2. 流式性能与测速基准 (Speed Benchmark)
- **微秒级 TTFT (Time to First Token)**：精确记录从 HTTP 握手到首个数据块到达的排队等待时长。
- **实时 TPS 吞吐 (Tokens/s)**：流式生成速率计算，配备实时打字机终端监控。
- **Jitter 网络抖动方差**：计算连续 Chunk 到达时间间隔方差，一眼识别中转站是否处于超载拥塞或被反代限速。

### 3. 双引擎 100% 自动模型发现 (Dual-Engine Discovery)
- **引擎一（标准全端点级联）**：智能并发轮询 `/v1/models`、`/models`、`/api/models`，自动解析 6 种不规则 JSON 格式。
- **引擎二（高速 Chat 探针兜底）**：**即使中转站站长在网关恶意隐藏了 `/v1/models`**，系统会在 500ms 内对高频 16 款大模型发送 `max_tokens: 1` 探测包，100% 捞出所有真实可用模型！

### 4. 高阶特性与 Agent 兼容性探针 (Capability Matrix)
- **SSE Stream**：测试长连接是否被中转站 Nginx 缓冲层切断。
- **Tool / Function Calling**：发送标准工具定义包，检测中转站是否破坏或剥离了 `tools` 参数（确保 **Cline / Cursor / Claude Code** 能正常执行终端命令与读写文件）。
- **Vision 多模态**：发送 Base64 像素级图像测试包，验证视觉输入通路。
- **JSON Mode**：验证 `response_format` 结构化约束。

### 5. 全网中转站余额穿透嗅探 (Balance Sniffer)
- 深度适配 **OneAPI、NewAPI、DoneAPI、VoAPI、V3、OpenRouter、SiliconFlow、DeepSeek** 等平台计费路由。
- 自动识别并折算 OneAPI 500,000 点数比例与美元 / 人民币金额。

### 6. Coding Agent 客户端一键配置 (Client Auto-Adapter)
- 测通之后，一键生成绝对正确的环境变量与配置：
  - **Claude Code** (Anthropic 官方 CLI 终端)
  - **Cline / Roo Code** (VS Code 顶尖 Agent 插件)
  - **Cursor IDE**
  - **Cherry Studio / Chatbox**
  - **NextChat / Dify / FastGPT**

---

## ⭐ 技术对比矩阵

| 评估维度 | 传统简陋测试脚本 | 常见在线中转测速网 | **API-QuickCheck 2.0** |
| :--- | :---: | :---: | :---: |
| **Claude 私钥验真** | 未支持 | ⚠️ 简陋文本判断 | ✅ **100% 官方第二轮回传密码学验签** |
| **思维链防伪** | 未支持 | 未支持 | ✅ **严格校验原生 `reasoning_content`** |
| **CORS 跨域问题** | ⚠️ 频繁报错 Network Error | ⚠️ 依赖中心化私有服务器 | ✅ **本地透明代理 + Vercel Edge Serverless** |
| **隐藏模型嗅探** | 遇到 404 即退出 | 未支持 | ✅ **候选路由 + 16款模型并发高速探针** |
| **设计美学** | 粗糙简陋 | 页面杂乱刺眼 | ✅ **Anthropic Claude 艺术级设计系统** |
| **密钥安全性** | 上传服务器 | 存入云端数据库 | ✅ **零落盘 · 密钥安全不离浏览器** |

---

## ⭐ 快速开始

### 本地启动

```bash
# 1. 克隆代码仓库
git clone https://github.com/som1ng/API-QuickCheck.git
cd API-QuickCheck

# 2. 安装依赖
npm install

# 3. 启动本地开发服务 (自带 CORS 透明代理中间件)
npm run dev

# 4. 浏览器访问
open http://localhost:5173/
```

### 基线协议审计 CLI

浏览器里的「基线审计」只运行低成本 P0/P1 协议检查。它不会把单次回答或文风当成模型身份凭证；没有官方能力快照时，报告结论固定为「证据不足」。

CLI 会直接复用网页审计 runner，适合在本地 agent 环境中保存完整 JSON 报告。启动时会在终端显示 API-QuickCheck 立体 Logo，API Key 只存在于当前进程内。

```bash
# 使用命令行运行审计，密钥也可以改用 APIQC_API_KEY 环境变量
npx tsx scripts/apiqc.ts audit \
  --provider auto \
  --model gpt-5.6-sol \
  --profile balanced \
  --base-url https://api.example.com/v1 \
  --api-key "$API_KEY" \
   --out reports/audit.json

# 只执行指定测试，适合先做低成本真实 API 验证
npx tsx scripts/apiqc.ts audit \
  --model gpt-5.6-sol \
  --profile quick \
  --probes p0-native-route,p0-auth-shape,p0-strict-json \
  --base-url https://api.example.com/v1 \
  --api-key "$API_KEY" \
  --out reports/quick-audit.json

# 捕获一份带来源和覆盖率标记的快照
npx tsx scripts/apiqc.ts baseline capture \
  --provider openai \
  --model gpt-5.6-sol \
  --profile balanced \
  --base-url https://api.openai.com/v1 \
  --api-key "$OPENAI_API_KEY" \
  --source official \
  --out baselines/openai-gpt-5.6-sol.json
```

快照文件会记录 `provider/model/api-surface/region/service-tier/date`、协议事件、夹具哈希、运行质量和覆盖率，不保存 API Key。当前浏览器执行器还没有 P2/P3 代码补丁、视觉、长上下文和重复采样任务；因此通过 `baseline capture` 生成的文件应先检查 `source` 与 `coverage`，不能把不完整采样当作官方能力基线。

---

## ⭐ 一键 Vercel 部署

本项目已深度优化并内置 **Vercel Serverless Edge Runtime** (`api/proxy.ts` 与 `vercel.json`)，无需购买任何云服务器，100% 免费一键上线：

1. **Fork** 本仓库到你的 GitHub 账号；
2. 登录 [Vercel](https://vercel.com/)，导入本仓库并点击 **Deploy**；
3. Vercel 会自动将反代逻辑部署为全球边缘计算函数，将前端部署为极速 CDN 静态站点！

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsom1ng%2FAPI-QuickCheck)

---

## ⚠️ 隐私与安全承诺

- **零持久化存储**：所有 API Key 与通信 Payload 仅在内存单次请求中使用，绝无后端数据库，绝无统计埋点；
- **全链路开源**：每一行网络请求代码与鉴别算法均完全开源透明，欢迎全球开发者审计。

---

## 开源协议

本项目基于 **[MIT License](./LICENSE)** 协议开源。

<div align="center">
  <sub>Designed with Anthropic Editorial Aesthetics · Built for the Global AI Developer & Agent Community.</sub>
</div>
