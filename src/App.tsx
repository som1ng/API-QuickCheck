import React, { useState } from 'react';
import { Settings2, Play, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, Loader2, Info, Copy, Box, Check, Database, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import IntegrationGuide from './IntegrationGuide';
import DocsView from './DocsView';

const PLATFORMS = [
  {
    id: 'openai',
    name: 'OpenAI (官方或中转)',
    defaultBaseUrl: 'https://api.openai.com',
    testEndpoint: '/v1/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-...',
    helpText: '如果是第三方中转 API，请在下方高级设置中修改 Base URL 为中转地址。',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com',
    testEndpoint: '/v1/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-...',
  },
  {
    id: 'siliconflow',
    name: '硅基流动 (SiliconFlow)',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'Qwen/Qwen2.5-7B-Instruct', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-...',
    helpText: '注册即可获取海量免费开源模型额度。',
  },
  {
    id: 'moonshot',
    name: 'Kimi (月之暗面)',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'moonshot-v1-8k', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-...',
  },
  {
    id: 'qwen',
    name: '通义千问 (DashScope)',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'qwen-plus', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-...',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM (BigModel)',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'glm-4', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-...',
  },
  {
    id: 'doubao',
    name: '豆包 (火山引擎)',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-...',
    helpText: '火山引擎接口可能测试通过，但在实际使用时需在控制台获取对应的接入点 (Endpoint ID) 作为模型名称。',
  },
  {
    id: 'stepfun',
    name: '阶跃星辰 (StepFun)',
    defaultBaseUrl: 'https://api.stepfun.com/v1',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'step-1-8k', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-...',
  },
  {
    id: '01ai',
    name: '零一万物 (01.AI)',
    defaultBaseUrl: 'https://api.lingyiwanwu.com/v1',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'yi-34b-chat-0205', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'google/gemini-2.0-flash-lite-preview-02-05:free', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-or-v1-...',
    helpText: '知名海外模型聚合平台，提供大量免费开源模型额度。'
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM (英伟达)',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'meta/llama-3.1-8b-instruct', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'nvapi-...',
    helpText: '英伟达提供顶级开源模型免费体验额度，非常适合测试前沿模型。'
  },
  {
    id: 'groq',
    name: 'Groq',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'llama3-8b-8192', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'gsk_...',
    helpText: '提供极速的 LPU 推理服务，当前支持众多免费开源模型。'
  },
  {
    id: 'together',
    name: 'Together AI',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    testEndpoint: '/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'togethercomputer/llama-2-7b-chat', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: '... (API Key)',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    testEndpoint: '/v1beta/models/gemini-1.5-flash:generateContent',
    method: 'POST',
    headers: (key: string) => ({ 'x-goog-api-key': key, 'Content-Type': 'application/json' }),
    body: { contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { max_output_tokens: 1 } },
    placeholder: 'AIzaSy...',
    helpText: '国内直连通常会失败，请确保全局代理或在此处使用国内可访问的代理 Base URL。'
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    defaultBaseUrl: 'https://api.anthropic.com',
    testEndpoint: '/v1/messages',
    method: 'POST',
    headers: (key: string) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }),
    body: { model: 'claude-3-5-sonnet-20240620', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-ant-...',
    helpText: '官方接口严禁浏览器直接测试（CORS拦截），通常直接报错。建议仅用来测试第三方中转的 Claude 接口。'
  },
  {
    id: 'custom',
    name: '自定义 API (兼容 OpenAI)',
    defaultBaseUrl: '',
    testEndpoint: '/v1/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    placeholder: 'sk-...',
    helpText: '在此填入任何兼容 OpenAI 格式的服务商 Base URL（例如：https://api.example.com）。',
  }
];

type TestStatus = 'idle' | 'loading' | 'success' | 'error_quota' | 'error_key' | 'error_cors' | 'error_other';


function ModelTag({ model, onSelect }: { model: string, onSelect: (m: string) => void }) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    navigator.clipboard.writeText(model);
    onSelect(model);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button 
      onClick={handleClick}
      className="px-3 py-1.5 text-xs font-mono font-medium bg-black/40 text-slate-300 rounded-lg border border-white/10 hover:border-blue-500/60 hover:bg-blue-500/10 transition-all flex items-center group relative min-w-[80px] justify-center"
      title="点击复制并自动填入测试输入框"
    >
      <span className={`transition-opacity duration-200 ${copied ? 'opacity-0' : 'opacity-100'}`}>{model}</span>
      {copied ? (
        <span className="absolute inset-0 flex items-center justify-center bg-emerald-600/90 text-white text-[10px] font-bold animate-in fade-in zoom-in-95 duration-200">
          <Check className="w-3 h-3 mr-1" /> 已填入
        </span>
      ) : (
        <Copy className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-40 transition-opacity text-slate-400" />
      )}
    </button>
  );
}

const DOC_URLS: Record<string, string | null> = {
  'openrouter': "https://openrouter.ai/models",
  'deepseek': "https://api-docs.deepseek.com/zh-cn/quick_start/pricing",
  'openai': "https://platform.openai.com/docs/models",
  'nvidia': "https://build.nvidia.com/explore/discover",
  'siliconflow': "https://docs.siliconflow.cn/models/list",
  'groq': "https://console.groq.com/docs/models",
};

export default function App() {
  const [platformId, setPlatformId] = useState(PLATFORMS[0].id);
  const [apiKey, setApiKey] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState(PLATFORMS[0].defaultBaseUrl);
  const [manualModel, setManualModel] = useState('');
  const [useProxy, setUseProxy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [status, setStatus] = useState<TestStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [delay, setDelay] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [availableModels, setAvailableModels] = useState<string[] | null>(null);
  
  const [activeTab, setActiveTab] = useState<'test' | 'docs'>('test');

  const currentPlatform = PLATFORMS.find(p => p.id === platformId) || PLATFORMS[0];



  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setPlatformId(newId);
    const newPlatform = PLATFORMS.find(p => p.id === newId)!;
    setCustomBaseUrl(newPlatform.defaultBaseUrl);
    setManualModel('');
    setStatus('idle');
    setAvailableModels(null);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setStatus('error_key');
      setErrorMessage('请输入 API Key！');
      return;
    }

    setStatus('idle');
    setIsLoading(true);
    setDelay(null);
    setErrorMessage('');
    setAvailableModels(null);

    const startTime = Date.now();
    const rawUrl = `${customBaseUrl.replace(/\/$/, '')}${currentPlatform.testEndpoint}`;
    let url = rawUrl;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (useProxy) {
      url = isLocalhost 
        ? `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`
        : `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // 第一步：动态模型嗅探 (Dynamic Model Fetching)
      let dynamicModelId = manualModel || currentPlatform.body?.model || 'gpt-3.5-turbo';
      let models: string[] = [];

      try {
        const modelsRawUrl = customBaseUrl.replace(/\/$/, '') + (currentPlatform.id === 'gemini' ? '/v1beta/models' : '/v1/models');
        const modelsUrl = useProxy 
          ? (isLocalhost ? `https://corsproxy.io/?${encodeURIComponent(modelsRawUrl)}` : `/api/proxy?url=${encodeURIComponent(modelsRawUrl)}`)
          : modelsRawUrl;
        
        const mResp = await fetch(modelsUrl, { 
          method: 'GET', 
          headers: currentPlatform.headers(apiKey.trim()),
          signal: controller.signal
        });
        
        if (mResp.status === 401 || mResp.status === 403) {
           setStatus('error_key');
           setErrorMessage(`测试失败：API Key 无效或权限不足 (HTTP ${mResp.status})`);
           clearTimeout(timeoutId);
           return;
        }

        if (mResp.ok) {
          const mData = await mResp.json().catch(() => null);
          if (mData && Array.isArray(mData.data)) {
            models = mData.data.map((m: any) => m.id).filter(Boolean);
          } else if (mData && Array.isArray(mData.models)) {
            models = mData.models.map((m: any) => m.name || m.id).filter(Boolean);
          }
          if (models.length > 0) {
            dynamicModelId = models[0];
            console.log("✅ 动态获取模型成功:", dynamicModelId);
          } else {
            console.warn("⚠️ 动态获取模型列表为空，使用兜底模型:", dynamicModelId);
          }
        } else {
          console.warn("⚠️ 动态获取模型接口返回非 200 状态:", mResp.status, "使用兜底模型:", dynamicModelId);
        }
      } catch (e) {
        console.warn("⚠️ 动态获取网络请求失败，使用兜底模型:", dynamicModelId, e);
      }

      setAvailableModels(models.length > 0 ? models : null);

      // 第二步：发起真实的余额探测 (POST /v1/chat/completions)
      const fetchHeaders = currentPlatform.headers(apiKey.trim());
      // 构造最终的 payload，动态覆盖 model 字段
      const finalBodyObj = currentPlatform.body ? { ...currentPlatform.body, model: dynamicModelId } : undefined;
      const fetchBody = finalBodyObj ? JSON.stringify(finalBodyObj) : undefined;

      const response = await fetch(url, {
        method: currentPlatform.method,
        headers: fetchHeaders,
        body: fetchBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const endTime = Date.now();
      setDelay(endTime - startTime);

      const status = response.status;
      let data: any = null;
      let rawText = '';
      
      try {
        rawText = await response.text();
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          data = rawText ? { message: rawText } : null;
        }
      } catch (e) {
        // 解析响应体失败时不阻断流程
      }

      const text = JSON.stringify(data || {});
      const lowerText = text.toLowerCase();
      
      const isQuotaError = status === 402 || 
                          status === 429 || 
                          lowerText.includes('quota') || 
                          lowerText.includes('insufficient') || 
                          lowerText.includes('balance') ||
                          (data?.error?.code === 'insufficient_quota') ||
                          (data?.error?.type === 'insufficient_balance');

      if (response.ok && !isQuotaError) {
        setStatus('success');
      } else {
        if (isQuotaError) {
           setStatus('error_quota');
           setErrorMessage(`测试失败：余额不足或额度已耗尽，请前往官网充值 (HTTP ${status})`);
        } else if (status === 401 || status === 403) {
           setStatus('error_key');
           setErrorMessage(`测试失败：API Key 无效或权限不足 (HTTP ${status})`);
        } else {
          setStatus('error_other');
          const errorDetail = data?.error?.message || data?.message || rawText || '未返回具体错误内容';
          setErrorMessage(`测试失败 (HTTP ${status}): ${errorDetail}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setStatus('error_other');
        setErrorMessage('测试失败：请求超时（超过15秒），请检查网络或更换 CORS 代理。');
      } else if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setStatus('error_cors');
        const msg = '这通常是由于浏览器跨域拦截 (CORS) 导致的，请尝试在高级设置中开启「CORS 代理」开关，或使用浏览器跨域插件。';
        setErrorMessage(msg);
      } else {
        setStatus('error_other');
        setErrorMessage(`网络请求异常：${err.message || '未知错误'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1c] to-black text-slate-200 relative overflow-y-auto font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          <div className="flex justify-between items-center w-full md:w-auto">
            <div className="flex items-center group cursor-pointer">
              <div className="inline-flex items-center justify-center p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                API-QuickCheck
              </span>
            </div>
            {/* Mobile Right Icons */}
            <div className="flex md:hidden items-center space-x-3">
              <span className="px-2 py-0.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/20">v1.1</span>
              <a href="https://github.com/som1ng/API-QuickCheck" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                GitHub
              </a>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/10 shadow-inner w-full md:w-auto justify-center">
            <button
              onClick={() => setActiveTab('test')}
              className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'test'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              API 连通性测试
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'docs'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Agent 接入指南
            </button>
          </div>

          {/* Desktop Right Icons */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="inline-block px-2.5 py-1 text-xs font-bold text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/20">v1.1</span>
            <a href="https://github.com/som1ng/API-QuickCheck" target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors">
              <span className="mr-1">GitHub</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-32 md:pt-28 pb-16 w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
        
        {/* Header Text */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            LLM API <span className={activeTab === 'test' ? "text-blue-400" : "text-purple-400"}>{activeTab === 'test' ? '快速验证工具' : '接入配置文档'}</span>
          </h1>
          <p className="text-slate-400 font-medium text-base max-w-xl mx-auto">
            {activeTab === 'test' 
              ? '一键探测模型可用性与额度状态，适配主流 Agent 接入配置。'
              : '一站式查看各类模型平台的官方地址与终极代理配置方案。'}
          </p>
        </div>

        {activeTab === 'docs' ? (
          <DocsView />
        ) : (
          <>
            {/* Card 1: Main Control Panel */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 md:p-10 hover:border-white/20 transition-all duration-300">
          
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Platform Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-300 ml-1 mb-2">测试平台</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-black/40 border border-white/10 text-white rounded-xl py-3.5 px-4 pr-10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner cursor-pointer"
                    value={platformId}
                    onChange={handlePlatformChange}
                  >
                    {PLATFORMS.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#1a1f2e] text-white py-2">{p.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Model Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="block text-sm font-bold text-slate-300">测试模型 (Model)</label>
                  {DOC_URLS[platformId] && (
                    <a 
                      href={DOC_URLS[platformId]!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-400/80 hover:text-blue-300 transition-colors flex items-center group/link"
                    >
                      <span className="group-hover/link:underline">🔗 查找可用模型</span>
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3.5 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-700 font-mono shadow-inner text-sm"
                    value={manualModel}
                    onChange={(e) => setManualModel(e.target.value)}
                    placeholder="留空则自动探测或用默认"
                  />
                </div>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-300 ml-1 mb-2">API Key</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600 font-mono shadow-inner"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={currentPlatform.placeholder}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="mb-8 group">
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center justify-between w-full px-5 py-3 text-sm font-bold transition-all rounded-xl border ${
                showAdvanced 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center">
                <Settings2 className={`w-4 h-4 mr-2 transition-transform duration-300 ${showAdvanced ? 'rotate-90 text-blue-400' : 'text-slate-500'}`} />
                <span>高级设置 (自定义 Base URL & CORS 代理)</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showAdvanced && (
              <div className="mt-4 p-5 bg-black/30 rounded-2xl border border-white/5 space-y-6 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">接口地址 (Base URL)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="text"
                      className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:border-blue-500 transition-all shadow-inner placeholder-slate-700"
                      value={customBaseUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">CORS 代理转发</h4>
                      <p className="text-[10px] text-slate-500">开启后可绕过浏览器对官方 API 的跨域限制</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setUseProxy(!useProxy)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useProxy ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useProxy ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* @ts-ignore */}
                {currentPlatform.helpText && (
                  <div className="flex items-start bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                    <Info className="w-4 h-4 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200/70 leading-relaxed">
                      {/* @ts-ignore */}
                      {currentPlatform.helpText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleTest}
            disabled={isLoading}
            className="w-full relative group overflow-hidden rounded-2xl font-black text-white shadow-2xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-4 flex items-center justify-center border border-white/10"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                正在深度探测中...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-3 fill-current" />
                立即验证 API 有效性
              </>
            )}
          </button>
        </div>

        {/* Results Area */}
        {status !== 'idle' && !isLoading && (
          <div className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-300 ${
            status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
            status === 'error_cors' ? 'bg-amber-500/10 border-amber-500/20' :
            'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-start">
              <div className={`p-3 rounded-2xl mr-4 flex-shrink-0 ${
                status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                status === 'error_cors' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {status === 'success' && <CheckCircle2 className="w-7 h-7" />}
                {(status === 'error_key' || status === 'error_quota' || status === 'error_other') && <XCircle className="w-7 h-7" />}
                {status === 'error_cors' && <AlertTriangle className="w-7 h-7" />}
              </div>
              
              <div className="w-full pt-1">
                <h3 className="font-black mb-1 flex items-center justify-between text-lg tracking-tight">
                  <span className="text-white">
                    {status === 'success' ? '验证通过' :
                     status === 'error_cors' ? '跨域拦截 / 连接受阻' : '验证失败'}
                  </span>
                  {status === 'success' && delay !== null && (
                    <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                      {delay}ms
                    </span>
                  )}
                </h3>
                <p className={`text-sm font-medium leading-relaxed mb-4 ${
                  status === 'success' ? 'text-emerald-200/70' :
                  status === 'error_cors' ? 'text-amber-200/70' :
                  'text-red-200/70'
                }`}>
                  {status === 'success' ? `该 API Key 目前状态健康，可立即投入使用。` : errorMessage}
                </p>
                {status === 'success' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center shadow-inner group hover:border-emerald-500/30 transition-colors">
                      <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
                        <Zap className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">API Status</span>
                        <span className="text-emerald-400 font-black text-sm">可用 / 正常</span>
                      </div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center shadow-inner group hover:border-blue-500/30 transition-colors">
                      <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
                        <Database className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Quota Info</span>
                        <span className="text-blue-400 font-black text-sm">额度充沛</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Model Probe & Agent Guide */}
        {status === 'success' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            
            {/* Models Area */}
            {availableModels !== null && (
              <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-2xl hover:border-white/20 transition-all">
                <h4 className="text-lg font-bold text-white mb-5 flex items-center">
                  <Box className="w-5 h-5 mr-3 text-blue-400" />
                  可用模型列表 {availableModels.length > 0 && <span className="ml-3 text-sm font-bold text-slate-500 px-2 py-0.5 bg-white/5 rounded-full border border-white/5">{availableModels.length}</span>}
                </h4>
                {availableModels.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 max-h-52 overflow-y-auto custom-scrollbar pr-2">
                    {availableModels.map(m => (
                      <ModelTag key={m} model={m} onSelect={setManualModel} />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 text-amber-500" />
                    <p className="text-sm font-medium text-amber-200/80">
                      无法自动获取模型列表，请手动在 Agent 中尝试填写具体的模型名称。
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Integration Guide */}
            <IntegrationGuide
              apiKey={apiKey}
              baseUrl={customBaseUrl}
              platformId={platformId}
              modelId={manualModel || (availableModels && availableModels.length > 0 ? availableModels[0] : (currentPlatform.body?.model || ''))}
            />
          </div>
        )}
        </>
      )}
      </main>

      {/* Footer */}
      <footer className="w-full py-10 text-center border-t border-white/5 mt-auto bg-black/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-slate-500 text-xs font-bold flex items-center justify-center space-x-3 tracking-wide">
            <ShieldCheck className="w-5 h-5 text-emerald-500/40" />
            <span>纯前端沙盒环境 · 隐私安全保障 · 拒绝 Key 泄露</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
