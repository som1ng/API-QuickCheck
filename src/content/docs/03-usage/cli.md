---
title: 使用 CLI
category: usage
categoryTitle: 使用
order: 2
subtitle: 工业级无头终端命令行引擎，零外部依赖，完美适配 CI/CD 自动化流水线与离线基准快照采集。
---

## 1. 概述与核心优势

API-QuickCheck 内置专为开发者与运维工程师打造的 **无头 CLI 终端引擎**（`scripts/apiqc.ts`）。无需启动任何浏览器界面，即可在本地终端或云端服务器上直接对指定 AI API 端点执行高精度质量审计与防伪探测。

### 核心特性
* **零浏览器 CORS 跨域限制**：直接在 Node.js 环境发起底层网络请求，原生支持私有网关、内网直连与未配置跨域头的第三方中转端点；
* **CI/CD 流水线就绪**：支持 `--fail-under` 阈值门禁控制，审计得分不达标时自动退出非零状态码，阻断不合格代理接口进入生产环境；
* **权威黄金基线快照采集**：支持一键采集官方模型真实指纹并持久化为 JSON 快照文件；
* **结构化报告自动导出**：支持实时流式输出探测进度，并在结束后生成格式化 JSON / Markdown 报告。

---

## 2. 快速上手

### 方式 1：免安装 npx 零配置秒开（推荐）
无需克隆代码或安装任何依赖，直接在终端执行：
```bash
# 对指定中转站端点运行完整质量审计
npx api-quickcheck audit \
  --model claude-3-7-sonnet-20250219 \
  --base-url "https://api.your-relay.com/v1" \
  --api-key "sk-your-relay-key"
```

### 方式 2：全局安装为系统命令行工具
```bash
# 全局安装
npm install -g api-quickcheck

# 直接使用短命令执行审计
apiqc audit \
  --model gpt-5.6-sol \
  --base-url "https://api.your-relay.com/v1" \
  --api-key "sk-your-relay-key" \
  --profile balanced \
  --out audit-report.json

# 采集官方黄金能力基准快照
apiqc baseline capture \
  --model gemini-3.7-flash \
  --base-url "https://generativelanguage.googleapis.com/v1beta" \
  --api-key "$GOOGLE_API_KEY" \
  --source official
```

### 方式 3：仓库内源码开发运行
```bash
npm run apiqc -- audit --model gpt-5.6-sol --base-url "https://api.your-relay.com/v1" --api-key "sk-xxx"
```

---

## 3. CLI 核心参数全景对照表

| 参数项 | 简写 | 默认值 | 说明 |
| :--- | :---: | :---: | :--- |
| `--url` | `-u` | `https://api.openai.com/v1` | 目标中转站或官方 API Base URL |
| `--key` | `-k` | 必填 | 用于鉴权测试的 API Key（支持通过环境变量传入） |
| `--model` | `-m` | `claude-3-7-sonnet-20250219` | 待测的目标模型 ID |
| `--fail-under` | `-f` | `0` | CI/CD 门禁最低及格分（0-100）。低于此分则退出码非 0 |
| `--output` | `-o` | 无 | 将完整审计证据链导出为本地 JSON / Markdown 报告文件 |
| `--save-baseline` | `-s` | 无 | 将当前测试采集的能力指纹保存为标准黄金基线快照 |
| `--baseline-file` | `-b` | 内置基线 | 指定用于对比打分的外部基线快照文件路径 |
| `--timeout` | `-t` | `30000` | 单次探针网络请求超时阈值（毫秒） |
| `--verbose` | `-v` | `false` | 输出详细的网络请求头、响应 Payload 与调试证据链 |

---

## 4. 典型实战场景

### 场景 A：GitLab CI / GitHub Actions 自动中转站质量准入

在流水线中自动化拦截冒充大模型的劣质中转渠道：

```yaml
# .github/workflows/api-audit.yml
name: API Relay Quality Audit
on: [push, schedule]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Run Headless Audit Gate
        run: |
          npx tsx scripts/apiqc.ts \
            --url "${{ secrets.RELAY_BASE_URL }}" \
            --key "${{ secrets.RELAY_API_KEY }}" \
            --model "claude-3-7-sonnet-20250219" \
            --fail-under 80 \
            --output "audit-results.json"
```

### 场景 B：内网专线与本地网关性能摸底

针对无法对外开放公网访问的企业内部网关，直接在内网机器上运行 CLI，免去配置 CORS 的繁琐步骤，快速获取真实延迟、首字时间（TTFT）与推理吞吐量。
