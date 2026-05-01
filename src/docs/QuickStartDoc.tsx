import { ChevronRight, CheckCircle2 } from 'lucide-react';

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
      <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-3 tracking-tight">快速开始</h1>
      <p className="text-slate-400 text-base leading-relaxed mb-10">
        一键验证 API 连通性，生成专属接入配置。
      </p>

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all shadow-md group">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold mb-5 border border-blue-500/20 group-hover:scale-110 transition-transform">🎯</div>
          <h3 className="text-white font-bold text-lg mb-3">1. 验证你的 API Key</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            回到左侧导航的“API 连通性测试”，选择对应的供应商，输入 Key 进行真机探测。确保你的 Key 有余额且未被封禁。
          </p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all shadow-md group">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold mb-5 border border-purple-500/20 group-hover:scale-110 transition-transform">🚀</div>
          <h3 className="text-white font-bold text-lg mb-3">2. 选择你的 Agent</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            测试通过后，在左侧边栏选择你正在使用的开发工具（Claude Code、Cursor 等），按照指南的 3 分钟极简步骤，将本地流量劫持到大模型网关。
          </p>
        </div>
      </div>

      {/* Callout - Success */}
      <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-5 rounded-r-xl flex items-start gap-4 shadow-lg">
        <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-emerald-300 font-bold mb-2 text-lg">🔒 纯前端架构，隐私绝对安全</h4>
          <p className="text-emerald-200/90 text-sm leading-relaxed">
            API-QuickCheck 是一个 100% 运行在你本地浏览器中的纯前端工具。你的任何 API Key 都不会被上传到我们的服务器，刷新页面即焚，请放心使用。
          </p>
        </div>
      </div>
    </div>
  );
}
