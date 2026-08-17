# API-QuickCheck 开发者与 Agent 协作操作指南

---

## 1. 常用命令速查

| 命令 | 用途 | 执行场景 |
| :--- | :--- | :--- |
| `npm run dev` | 启动本地 Vite 开发服务器 (`http://localhost:5173`) | 本地实时调试与页面预览 |
| `npm run build` | 执行 TypeScript 严格类型检查并打包 | 每次代码修改后验证零报错 |
| `npm run sync:models` | 手动从权威开放 API 同步 2026 前沿模型基线 | 更新模型目录与 Markdown 文章 |
| `npm test` | 运行自动化审计算法测试套件 | 验证审计引擎核心算法准确性 |

---

## 2. Agent 修改代码必守红线

1. **严禁粗暴终止所有 Node 进程**：
   - 任何 Agent 绝不得运行 `Stop-Process -Name node -Force` 或类似命令，因为 CLI 助手本身运行在 Node 进程中，误杀将导致会话中断。
2. **语言规范**：
   - 所有计划、步骤、汇报及文档一律使用中文书写。
3. **色彩规范**：
   - 严格遵循 `DESIGN.md` 中定义的暖暗色调与 1px 细边框，禁止使用蓝紫色、高对比度荧光边框或不协调配色。
4. **模型基线与探针数据管理**：
   - 官方模型声明标准统一写入 `agent_workspace/baselines/official-model-claims.json`；
   - 探针跳过规则统一写入 `agent_workspace/baselines/probe-policy.json`；
   - 虚构或未经验证的占位模型必须明确标记 `verificationStatus: "not_found_official"`，禁止自行脑补推测映射。
