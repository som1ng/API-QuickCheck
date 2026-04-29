# API-QuickCheck

> ⚡ 快速、极简、本地化的 API Key 连通性测试工具

**立即使用：[https://api-quick-check.vercel.app/](https://api-quick-check.vercel.app/)**

这是一个纯前端的开源小工具，旨在帮助用户快速验证各大 AI 平台的 API Key 是否连通有效。无论你是开发者还是普通用户，只需输入 Key，点击测试，即可知道是否可用、额度是否耗尽。

## ✨ 核心特性

- **🚀 极简操作**：傻瓜式交互设计，下拉选择平台，粘贴 Key 即可一键测试。
- **🌐 全面覆盖**：
    - **国内平台**：DeepSeek, 硅基流动 (SiliconFlow), Kimi, 通义千问, 智谱 AI, 豆包, 阶跃星辰, 零一万物等。
    - **国外平台**：OpenAI, OpenRouter, NVIDIA NIM, Groq, Together, Gemini, Claude 等。
- **🔒 纯本地运行**：100% 前端请求，所有测试直接在你的浏览器与服务商服务器之间进行，**绝不经过任何第三方服务器，不收集任何 Key**。
- **🔌 跨域支持**：内置 **CORS 代理转发**功能，轻松解决浏览器直接请求官方 API 时的跨域拦截问题。
- **🎨 现代 UI 设计**：基于 React + Vite + Tailwind CSS，极简、顺滑，具有详细的状态反馈。



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
  一些官方服务商（如 NVIDIA, Anthropic）严禁在浏览器环境中直接跨域请求。如果遇到 `Failed to fetch` 提示，请在“高级设置”中开启 **「使用 CORS 代理」** 开关，或在浏览器安装跨域插件。
- **自定义 Base URL**
  对于使用 OpenAI 格式的各类第三方中转 API，点击“高级设置”修改 Base URL 即可。

## 📜 许可证

MIT License.
