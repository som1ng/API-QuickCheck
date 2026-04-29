# API Key QuickCheck

> ⚡ 快速、极简、本地化的 API Key 连通性测试工具

这是一个纯前端的开源小工具，旨在帮助用户快速验证各大 AI 平台的 API Key 是否连通有效。无论你是开发者还是普通用户，只需输入 Key，点击测试，即可知道是否可用、额度是否耗尽。

## ✨ 核心特性

- **🚀 极简操作**：傻瓜式交互设计，下拉选择平台，粘贴 Key 即可一键测试。
- **🔒 纯本地运行**：100% 前端请求，所有测试直接在你的浏览器与服务商服务器之间进行，**绝不经过任何第三方服务器，不收集任何 Key**。
- **🤖 主流平台支持**：内置 OpenAI（支持自定义中转）、DeepSeek、Google Gemini、Claude 等主流模型 API 的一键测试。
- **🎨 现代 UI 设计**：基于 React + Vite + Tailwind CSS，体验顺滑，具有状态和错误反馈。

## 🖥️ 页面预览

![Preview]() *(可在此处添加截图)*

## 🚀 一键部署

只需点击下方按钮，即可将本项目一键部署到你的 Vercel 中：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/som1ng/API-QuickCheck)

## 📦 本地运行

如果你希望在本地运行或二次开发：

1. 克隆项目：
```bash
git clone https://github.com/som1ng/API-QuickCheck.git
cd API-QuickCheck
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 构建生产环境：
```bash
npm run build
```

## ⚠️ 常见问题

- **测试失败：跨域拦截 (CORS)**
  一些服务商（例如直接请求官方的 Anthropic Claude API）严禁在浏览器环境中跨域发起请求。遇到此类提示，说明你的网络被拦截，而非 Key 失效。建议使用支持跨域的中转 API 或后端代理进行测试。
- **自定义 Base URL**
  对于使用 OpenAI 格式的各类第三方中转 API（如 `https://api.your-proxy.com`），点击“高级设置”修改 Base URL 即可。

## 📜 许可证

MIT License.
