# CLAUDE.md - 项目开发与行为准则

## 📋 项目概览
- **项目名称**：API-QuickCheck 2.0 (全能 AI 中转站真伪鉴别与性能检测引擎)
- **技术栈**：Vite + React 18 + TypeScript + Tailwind CSS + Lucide Icons + Vercel Edge Serverless
- **设计风格**：Anthropic Claude Editorial Design System (暖陶土色 #cc785c、深曜黑 #181715、暖象牙白 #faf9f5、衬线标题与精致工学排版)

---

## 🎯 核心写代码行为准则 (Behavioral Guidelines)

### 1. Think Before Coding (深思而后动)
- 明确假设，遇歧义主动提出，不私自猜测。
- 优先选择最简方案；如遇更优解法应主动提出。
- 遇到不清楚的需求，先停下确认，再动手实现。

### 2. Simplicity First (奥卡姆剃刀 - 极简至上)
- 不写需求之外的过度设计与多余抽象。
- 不为单次使用编写复杂的泛型/配置层。
- 拒绝过度防御性代码；如能 50 行写完绝不写 200 行。

### 3. Surgical Changes (外科手术式精准修改)
- 只修改必须修改的代码，严禁无故重构相邻正常代码。
- 严格遵循既有代码风格。
- 自身修改产生的无用引用/变量必须清理干净。

### 4. Goal-Driven Execution (目标驱动与闭环验证)
- 每次任务均以可量化的结果为验收标准。
- 每一阶段修改后必须执行 `npm run build` 确保 0 TypeScript 报错。

---

## 🎨 Claude / Anthropic 界面设计规范 (Claude UI Design System)

### 1. 调色盘规范 (Color Palette)
- **主品牌色 (Primary Terracotta / Coral)**：`#cc785c` (悬浮: `#d98266`, 激活: `#a9583e`)
- **深色画布 (Dark Canvas)**：
  - 主背景: `#141413`
  - 容器/卡片表面 (Surface Card): `#1b1a18`
  - 提升面板 (Surface Elevated): `#23211e`
  - 细边框 (Hairline Border): `rgba(230, 223, 216, 0.09)` 或 `#2e2b27`
- **浅色文本与对比 (Typography Contrast)**：
  - 标题与强调: `#faf9f5`
  - 正文: `#d4cebe`
  - 次要文本: `#9c9689`
- **状态语义色 (Semantic Warm Accents)**：
  - 验证通过 (Sage Green): `#5db872` (背景: `rgba(93, 184, 114, 0.1)`)
  - 警示/延迟 (Warm Amber): `#e8a55a` (背景: `rgba(232, 165, 90, 0.1)`)
  - 伪造/失败 (Coral Red): `#c64545` (背景: `rgba(198, 69, 69, 0.1)`)
  - 信息/标记 (Accent Teal): `#5db8a6`

### 2. 字体排印体系 (Typography Hierarchy)
- **标题/品牌声量 (Display & Titles)**：
  - 采用人文艺术衬线体：`font-serif` (`Copernicus, "Tiempos Headline", "Newsreader", Georgia, serif`)
  - 字母微紧排 (`tracking-tight`)，呈现高级出版物质感。
- **正文与界面元素 (Body & Controls)**：
  - 采用现代人文非衬线体：`"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  - 字重分明 (`font-normal` 与 `font-medium`)。
- **代码与数据流 (Code & Data)**：
  - 采用等宽字体：`"JetBrains Mono", ui-monospace, monospace`

### 3. 组件质感 (Component Aesthetics)
- **按钮 (Buttons)**：暖陶土色主按钮（平滑圆角 `rounded-lg`，内敛暖色投影），无浮夸发光或廉价渐变。
- **卡片 (Cards)**：沉稳的暗曜色底、微弱的暖象牙色内边框，充足舒适的内边距 (`p-6`)。
- **零 Emoji 干扰**：界面 100% 采用精密 Lucide 线条图标与极简状态圆点。
