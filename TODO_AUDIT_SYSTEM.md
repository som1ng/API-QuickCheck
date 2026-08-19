# API-QuickCheck 待办与已知问题备忘清单 (TODO & Known Issues)

> 记录时间：2026-08-20 02:30

---

## 1. 核心待办与重构项 (Top Priorities for Next Session)

### [P0] Claude 密码学签名验真体系重构 (`p1-signature-continuity`)
- **当前现状**：
  - 目前代码中对 Claude Thinking Signature 的验签逻辑尚未完善；
  - 缺少针对 Anthropic 官方 `/v1/messages` 响应体中 `signature` 字段的高保真提取、第二轮回传载荷构造以及官方解密验真闭环。
- **明日待办任务**：
  1. 梳理完整的 Anthropic Thinking Signature 协议生命周期：
     - 第一轮：请求 `thinking: { type: 'enabled', budget_tokens: 1024 }`；
     - 捕获响应体中 `content: [{ type: 'thinking', thinking: '...', signature: '...' }, { type: 'text', ... }]`；
     - 第二轮：构造回传带原始 `signature` 的完整历史消息，向官方验证连续性。
  2. 设计签名真实性与防伪判定标准，区分：
     - ① 原生透传有效签名（PASS）；
     - ② 签名格式错误/篡改（FAIL 实锤造假）；
     - ③ 中转网关格式转译剥离（明确标识为中转网关协议剥离，提示使用原生通道）。

---

### [P1] 中转站智能协议协商与 502 熔断排查
- **当前现状**：
  - 部分第三方中转站（OneAPI / NewAPI / 聚合中转）在模型名称包含 `claude` 或 `gemini` 时，若客户端请求了原生端点（`/v1/messages` 或 `:generateContent`），中转前置网关（Nginx / Cloudflare）会直接返回 `HTTP 502 Bad Gateway`，且请求未进入中转站日志。
- **明日待办任务**：
  1. **双模式主动协商机制**：
     - 在执行全套探针前，先发起极低开销的 OPTIONS 或探针预检；
     - 探测目标中转站是否开放 `/v1/messages` 原生路由；若未开放，平滑回退至通用 `/v1/chat/completions`，避免 502。
  2. **网关 502 快速熔断与明确报错**：
     - 若遭遇 502/504 等网关崩溃错误，立即终止后续无意义发包，并给出清晰指引（如建议切换为通用 OpenAI 适配器）。

---

## 2. 今日已完成的重要改动存档

1. **项目首页与文档体系重构**：
   - 首页设为中文文档 [`README.md`](./README.md)，包含详细设计理念、海量 Key 批量测活优势与无头 CLI / AI Agent 自动化支持；
   - 独立提供英文文档 [`README_EN.md`](./README_EN.md)。
2. **测试参数预估时间与 UI 规范**：
   - 选项更新为：快速 (`预估 ~15s`)、标准推荐 (`预估 ~30s`)、全量 (`预估 ~50s`)；
   - 移除晦涩的 P50/P95 延迟术语，重构为 **Token 消耗（输入/输出拆解）** 与 **总执行用时**。
3. **Google Vertex AI 官方模型支持**：
   - 成功接入 `gemini_vertex.json` 服务账号 OAuth2 Bearer 认证；
   - 实测完成 `gemini-3.7-flash` 与 `gemini-3.1-pro-preview` 全套审计。
4. **批量测活与本地持久化**：
   - 支持智能全格式 Key 正则提取、1~50 线程动态并发、防封 Jitter 抖动延时、全网余额穿透嗅探与多格式（TXT/CSV/JSON）防乱码导出。
