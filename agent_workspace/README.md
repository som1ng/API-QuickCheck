# Agent 协同信息交换中心 (Agent Hub)

本项目多 Agent 协作工作区与信息交换中枢，用于存放各 Subagent 与主 Assistant 共享的开发文档、系统架构规范、模型基线数据、探针策略及网络采集数据。

---

## 📁 目录结构

```text
agent_workspace/
├── README.md                     # 本说明文档
├── baselines/                    # 官方模型能力声明与核查基线
│   ├── official-model-claims.json # 官方模型声明标准核查数据
│   ├── probe-policy.json         # 探针路由与执行跳过策略映射
│   ├── 2026-08-16.json           # 项目初始模型清单与端点定位
│   └── frontierModels.json       # 结构化前沿模型快照
├── scraped_data/                 # 自动化脚本与爬虫采集的实时数据
│   └── scraped-model-catalog.json# 权威 API / 模型端点采集结果快照
├── architecture/                 # 核心架构设计与数据流转规范
│   └── SYSTEM_ARCHITECTURE.md   # 系统全局架构与模块交互说明
└── development_docs/             # 开发指南与算法设计规范
    └── DEV_GUIDE.md              # 开发者与 Agent 协作指南
```

---

## 🤖 各 Agent 职责与协作约定

1. **引擎与算法 Agent (Engine Specialist)**：
   - 维护 `src/engine/` 鉴别与批量测活算法；
   - 根据 `baselines/official-model-claims.json` 与 `baselines/probe-policy.json` 调整审计探针逻辑。
2. **数据同步与爬虫 Agent (Data & Sync Specialist)**：
   - 维护 `scripts/sync-model-baselines.ts`；
   - 采集的最新模型数据存放于 `scraped_data/` 并回写至 `src/content/docs/`。
3. **前端与 UI/UX Agent (Frontend Specialist)**：
   - 严格遵循 `DESIGN.md` 与 Claude 暖暗调色彩规范；
   - 实现 60fps 丝滑磁吸滑块（Magic Slider）与无缝交互。
