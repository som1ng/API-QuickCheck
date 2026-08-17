---
title: Google Gemini 鉴别算法
category: algorithms
categoryTitle: 鉴别算法
order: 4
subtitle: 围绕 Gemini 3 的 Interactions API、思考状态连续性、多模态与长上下文差分评估。
---

## 1. 目标与适配器

当前以 `gemini-3.1-pro-preview`（高能力推理）和 `gemini-3.7-flash`（GA 工作马）为主要基线。Gemini 3 的新开发应优先使用 **Interactions API**；旧 `generateContent` 或 OpenAI 兼容路由可测，但只能说明兼容性。

预览模型可能变更或下线，因此模型清单必须通过 Models API 和官方变更日志定期刷新；对 preview 基线的报告必须带采样日期。

## 2. 原生协议与状态探针

| 探针 | 验证内容 | 边界 |
| :--- | :--- | :--- |
| Stateful interaction | `store: true`、`previous_interaction_id` 的跨轮连续性 | 应由服务端管理上下文与 thought blocks |
| Stateless thought signature | 需要手动维护历史时，原样回传 thought blocks 与 signatures | signature 用于连续推理，不是来源证明 |
| Thinking level | `thinking_level` 的合法值、配置响应与任务/延迟分布 | 不以是否公开思考文本评分 |
| 工具与结构化输出 | 函数工具、工具结果、JSON schema 的端到端闭环 | 必须执行工具并验证最终答案受结果影响 |

## 3. 多模态与上下文差分

Gemini 的高价值探针是可判分的图像、图表、PDF/视频片段理解，以及多位置 NIAH。每次试验都随机化 needle、位置、干扰项和问题形式；不要只测试一个秘密字符串，更不能因为一次 400 或低 TPS 判定模型造假。

对长上下文应测量：接受上限、不同深度的召回率、冲突信息决策率、跨轮保留率和成本。所有长度按目标模型官方限制配置。

## 4. 结论规则

协议支持和能力分数分别呈现。若目标在原生 Interactions 流程不兼容，但 OpenAI 兼容流程可用，结论应为“原生 Gemini 协议未保留”；若能力样本量不足或 preview 已变更，结论为“不足证据”。

## 5. 官方依据

- [Gemini 模型目录](https://ai.google.dev/gemini-api/docs/models)
- [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Gemini thinking 与 thought signatures](https://ai.google.dev/gemini-api/docs/thinking)
