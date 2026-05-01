import { BookOpen, ChevronRight, Info } from 'lucide-react';

export default function QuickStartDoc() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6 sm:px-12 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-slate-400 mb-6">
        <span>首页</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span>入门</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-200">快速开始</span>
      </div>

      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Agent 快速接入指南</h1>
      <p className="text-slate-400 text-base leading-relaxed mb-8">
        通过部署 LiteLLM 本地网关，您可以将任何第三方聚合模型（如 DeepSeek、OpenRouter 等）伪装成 Anthropic 的官方服务，从而无缝接入 Claude Code 等强大的本地 Agent 工具，实现零代码修改的跨平台模型调度。
      </p>

      {/* Callouts */}
      <div className="space-y-4 mb-12">
        <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start gap-3 shadow-lg">
          <BookOpen className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-emerald-300 font-bold mb-1">核心原则：双终端物理隔离</h4>
            <p className="text-emerald-200/80 text-sm leading-relaxed">
              本方案强制要求开启<strong>两个完全独立</strong>的终端窗口。一个作为服务端（LiteLLM 网关）持续运行，另一个作为客户端（Agent）进行交互。绝对不要在同一个终端内混用环境变量。
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-xl flex items-start gap-3 shadow-lg">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-300 font-bold mb-1">注意：前缀路由自动解析</h4>
            <p className="text-blue-200/80 text-sm leading-relaxed">
              在使用聚合平台时，必须使用 LiteLLM 原生支持的服务商前缀（如 <code className="bg-blue-500/20 px-1 rounded">openrouter/</code>），让其自动处理 Base URL 和鉴权，<strong className="text-blue-300">严禁画蛇添足添加 --api_base 参数</strong>。
            </p>
          </div>
        </div>
      </div>

      {/* Step Cards Grid */}
      <h2 className="text-xl font-bold text-white mt-10 mb-6">3 分钟接入步骤</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all shadow-md">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-4 border border-blue-500/30">1</div>
          <h3 className="text-white font-bold mb-2">获取 API Key</h3>
          <p className="text-slate-400 text-sm leading-relaxed">前往 OpenRouter、DeepSeek 等第三方平台的 Dashboard 获取你的专属 API Key。</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all shadow-md">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-4 border border-purple-500/30">2</div>
          <h3 className="text-white font-bold mb-2">启动 LiteLLM 网关</h3>
          <p className="text-slate-400 text-sm leading-relaxed">在终端 1 中配置对应 Key 并启动本地网关，注意映射正确的模型前缀。</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all shadow-md">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-4 border border-emerald-500/30">3</div>
          <h3 className="text-white font-bold mb-2">启动 Agent</h3>
          <p className="text-slate-400 text-sm leading-relaxed">在终端 2 中劫持官方环境变量指向 127.0.0.1，并显式选中代理模型进行对话。</p>
        </div>
      </div>
    </div>
  );
}
