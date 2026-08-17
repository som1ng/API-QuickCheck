---
title: Web 端使用
category: usage
categoryTitle: 使用
order: 11
subtitle: 现代化响应式 Web 工作台，提供一键式多维质量鉴别、API Key 批量测活与全景文档。
---

## 1. 架构理念与安全规范

API-QuickCheck Web 端采用 **纯前端客户端直连架构（Client-Direct Architecture）**：

* **零服务端中转**：所有的 API 探测请求均直接从您的浏览器端向目标中转站发起，不经过任何第三方服务器中继；
* **内存即抛**：您的 API Key 与接口配置仅暂存在浏览器的 React 内存状态中，页面刷新即销毁，绝不在任何数据库中持久化或上传；
* **极速响应**：基于 Vite 5 + React 18 现代化技术栈构建，支持亚毫秒级界面切换与流式数据实时渲染。

---

## 2. 模块一：中转站质量检测

在顶部导航栏选择 **「中转站检测」** 即可进入核心质量审计工作台。

### 操作步骤
1. **输入端点信息**：
   * **Base URL**：例如 `https://api.your-relay.com/v1`（支持 OpenAI 兼容格式、Anthropic 原生格式与 Google 格式）；
   * **API Key**：填入用于测试的密钥 `sk-...`；
   * **选择测试模型**：支持在当前主流最强的前沿模型矩阵中切换（如 `claude-3-7-sonnet-20250219`、`gpt-4o`、`deepseek-chat` 等）。

2. **一键启动全景审计**：
   点击 **「开始全景审计」**，系统将依次激活多重深度探针：
   * **协议保真层**：检测原生流式事件、密码学签名、推理 Token 透传等；
   * **能力一致性层**：执行隐藏断言代码修复、长文本海中捞针与多步工具调用；
   * **运行质量层**：测试首字延迟（TTFT）、吞吐 TPS、并发压力与计费倍率。

3. **查看质量指纹与证书导出**：
   探测完成后，界面将生成可信综合评分（0-100 分）、维度雷达图以及完整的证据链细节，支持导出防伪审计证书与 Markdown 报告。

---

## 3. 模块二：API Key 批量检测与池化管理

在顶部导航栏选择 **「API Key 批量」** 即可进入多密钥快速测活与额度嗅探中心。

### 核心功能
* **多厂商智能预设**：内置 OpenAI、Anthropic、DeepSeek、xAI (Grok)、Google Gemini、硅基流动、OpenRouter、Cerebras 以及自定义中转站等一键预设端点；
* **智能解析与去重**：支持粘贴纯文本、CSV 或拖拽上传文件（`.txt` / `.csv` / `.json`），引擎会自动正则提取各类 Key 格式（`sk-`、`gsk-`、`dsk-`、`AIzaSy...` 等）并剔除重复项；
* **并发池化极速测活**：支持配置 1~50 个并发 Worker 同时测试，实时流式更新每个 Key 的有效性、延迟、可用模型列表与账户额度状态；
* **状态过滤与导出**：可按「有效」、「无额」、「限流」、「无效」分类筛选，支持一键复制有效 Key 或导出为标准 TXT、CSV 与 JSON 文件；
* **本地测试历史**：自动归档历史测试记录，便于回溯对比与快速恢复。

---

## 4. 模块三：开发者基线与算法文档中心

在顶部导航栏选择 **「文档」** 即可进入由 Markdown 原生驱动的开发者知识中心：

* **磁吸滑块与快速检索**：左侧目录配备像素级磁吸悬浮滑块，支持 `Ctrl + K` 全文极速过滤；
* **权威基线实时同步**：支持点击右上角「手动更新最新基线」，直连权威模型厂商数据源同步最新的模型版本基线；
* **鉴别算法与数学公式**：详细阐述各厂商接口的逆向识别原理，包含完整的 KaTeX 数学统计模型与 Mermaid 协议时序架构图。

---

## 5. 常见问题与跨域（CORS）处理

由于本平台坚持纯前端直连以保障您的 API Key 绝对安全，浏览器会遵循同源安全策略。若测试第三方中转接口时遇到网络连接失败提示：

1. **配置网关跨域头（推荐）**：在您的中转网关（如 One API、New API 等）或反向代理（Nginx / Caddy）中配置允许跨域：
   ```nginx
   add_header 'Access-Control-Allow-Origin' '*' always;
   add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
   add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
   ```
2. **使用无头 CLI 终端引擎**：在终端直接运行 `npm run apiqc`，脱离浏览器沙箱，原生不受任何 CORS 策略限制。
