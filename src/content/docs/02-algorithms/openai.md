---
title: OpenAI GPT 鉴别算法
category: algorithms
categoryTitle: 鉴别算法
order: 3
subtitle: 以 GPT-5.6 的 Responses API、严格结构化输出、工具调用闭环和版本化官方差分基线为核心。
---

## 1. 目标模型与 API 面

当前目标为 `gpt-5.6-sol`（旗舰能力）、`gpt-5.6-terra`（能力/成本平衡）与 `gpt-5.6-luna`（高吞吐）。`gpt-5.6` 是路由至 Sol 的别名，因此报告必须保存请求时的实际 model ID、时间和 API 面，避免把别名当作固定型号。

优先使用 `/v1/responses`。Chat Completions 可作为兼容性检查，但不能替代对当前 Responses 事件模型、会话状态和工具调用的审计。

## 2. 协议保真探针

| 探针 | 必测行为 | 正确的判定方式 |
| :--- | :--- | :--- |
| Strict structured output | `text.format` 下嵌套 JSON Schema、`strict: true` | 校验完整 schema；必须区分 `refusal`、`incomplete` 与格式错误 |
| Function tools | 输出 function call、arguments 增量、回传 `function_call_output` 后的最终答案 | 必须验证模型确实使用工具结果，而非只生成像工具调用的文本 |
| Reasoning 配置 | 改变 `reasoning.effort`，观察合法响应、usage/延迟分布与任务收益 | 不要求暴露内部 chain-of-thought；缺少字段不是身份造假证据 |
| 多模态与长上下文 | 图像/图表任务和多位置 NIAH | 按具体型号已声明能力选择长度与模态 |

严格 JSON 成功只能证明该调用路径支持该功能；兼容层也可能完整实现它。反之，拒答、输出截断或功能不可用不能直接等同于小模型冒充。

## 3. 差分能力集

使用随机化、可自动判分的任务集：约束式 JSON、工具回合、代码补丁 + 隐藏测试、图像表格提取、长上下文冲突检索。每题同时运行目标、官方 Sol/Terra/Luna 基线及必要的负样本，比较通过率差与置信区间。

```text
模型相似性不是风格相似性。
P(候选 | 任务得分、协议特征、运行条件)
必须保留“无法区分”和“样本不足”两个结果。
```

## 4. 运行质量与报告

采集 p50/p95 TTFT、事件间隔、失败率、上下文接受上限与 usage 一致性。区域、服务层、配额、缓存和并发均会改变这些数值，故仅报告性能差异及环境，不将 TPS 阈值纳入模型身份分。

## 5. 官方依据

- [OpenAI 模型目录与 GPT-5.6 选择](https://developers.openai.com/api/docs/models)
- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Function Calling / Responses](https://developers.openai.com/api/docs/guides/function-calling)
