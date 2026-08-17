---
title: Anthropic Claude 鉴别算法
category: algorithms
categoryTitle: 鉴别算法
order: 2
subtitle: 以 Messages API、adaptive thinking、工具/缓存连续性和差分能力基线评估 Claude Fable 5、Opus 5、Sonnet 5。
---

## 1. 目标与前提

当前优先目标是 `claude-fable-5`、`claude-opus-5`、`claude-sonnet-5`。Fable 5 是广泛可用的最高能力型号；Mythos 5 仅限受邀计划，不能在没有该计划官方基线时作型号结论。

Claude 5 系列使用 **adaptive thinking**。对于 Fable 5、Opus 5、Sonnet 5，旧式 `thinking: { type: "enabled", budget_tokens: N }` 不可作为探针；它会导致 400，而不是证明目标端点降级。

## 2. Claude 原生协议探针

使用 `/v1/messages` 与 `anthropic-version`，而不是仅使用 OpenAI 兼容端点。每项记录请求、SSE 原始事件、响应头与错误体。

| 探针 | 验证内容 | 失败含义 |
| :--- | :--- | :--- |
| Adaptive thinking | `thinking: {type:"adaptive"}` 与 `output_config.effort` 的接受和语义 | 可能是旧模型、兼容层或参数未透传 |
| 工具事件 | `tool_use`、`input_json_delta`、工具回传后的下一轮行为 | 工具协议损耗，不直接证明换模型 |
| 思考签名连续性 | 将原样保留的 thinking block 与 opaque `signature` 回传下一轮 | 签名/会话被网关破坏；不是公钥身份验真 |
| Prompt cache | 受支持的 cache control 与 usage 的缓存字段、跨轮一致性 | 缓存不可用、服务层限制或转换损耗 |
| 模型元数据 | `/v1/models` 的 ID、能力和上下文声明 | 仅为声明证据，不能单独认证 |

> `signature` 是服务端用于验证回传 thinking block 的不透明值。审计器不得解析、伪造或把它的存在等同于“官方身份已验证”。

## 3. 能力一致性实验

对每个声明型号与同日官方基线做成对测试，至少覆盖：

- 动态工具链：模型必须选择工具、参数通过 schema、消费工具结果并修正最终答案；
- 代码修复：在固定小型仓库中提交补丁并通过隐藏测试；
- 长上下文：多位置、多轮 needle 检索与冲突消解，长度不超过已声明上限；
- 图像/文档：OCR、图表字段提取与跨模态约束；
- 长程任务：由审计器实际提供文件、工具和检查点；仅要求模型“先规划”不构成 Agent 能力证据。

每个任务随机化内容与工具结果，并与 Fable、Opus、Sonnet 候选基线分别比较。报告的是候选分布与置信区间，例如“更接近 Sonnet 5 基线”，而不是单题判定。

## 4. 推荐结论

```text
声明：claude-fable-5
协议保真：Messages / adaptive thinking / 工具回传通过
能力一致性：与 Fable 5 官方基线相比，代码任务 -18pp（95% CI: -27, -8）
运行质量：1M 上下文实测未覆盖，结论不足证据
结论：疑似能力降级；不能仅凭 signature 确认来源
```

## 5. 官方依据

- [Claude 模型总览](https://docs.anthropic.com/en/docs/about-claude/models/overview)
- [Thinking 与 signature 处理](https://platform.claude.com/docs/en/build-with-claude/thinking)
- [从手动 thinking 迁移到 adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
