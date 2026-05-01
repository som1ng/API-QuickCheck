import React, { useState, useEffect } from 'react';
import { Settings2, Play, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, Loader2, Info, Copy, Terminal, Box, Check, Database, ChevronDown, ChevronUp, Globe } from 'lucide-react';

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
    body: { model: 'google/gemini-2.5-flash-free', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-2 hover:bg-slate-800 rounded-lg transition-colors group bg-slate-900/80 border border-slate-700" title="点击复制">
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-white" />}
    </button>
  );
}

export default function App() {
  const [platformId, setPlatformId] = useState(PLATFORMS[0].id);
  const [apiKey, setApiKey] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState(PLATFORMS[0].defaultBaseUrl);
  const [useProxy, setUseProxy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [status, setStatus] = useState<TestStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [delay, setDelay] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [availableModels, setAvailableModels] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState('Claude Code');
  const [shellType, setShellType] = useState<'bash' | 'ps'>(
    navigator.userAgent.indexOf('Win') !== -1 ? 'ps' : 'bash'
  );

  const [errorLog, setErrorLog] = useState('');
  const [diagnosis, setDiagnosis] = useState<{ type: 'error' | 'warning' | 'success', message: string } | null>(null);

  useEffect(() => {
    if (!errorLog.trim()) {
      setDiagnosis(null);
      return;
    }
    const log = errorLog.toLowerCase();
    if (log.includes('modulenotfounderror') || log.includes('missing dependency')) {
      setDiagnosis({ type: 'error', message: "⚠️ 检测到依赖缺失！请务必执行带 [proxy] 标志的安装命令：pip install --upgrade \"litellm[proxy]\"" });
    } else if (log.includes('no such option')) {
      setDiagnosis({ type: 'warning', message: "⚠️ 检测到版本或参数不兼容！新版 LiteLLM 已弃用 --api_key 参数。请按【步骤 1】先配置环境变量，并在启动命令中去除该参数。" });
    } else if (log.includes('400') || log.includes('validation') || log.includes('thinking')) {
      setDiagnosis({ type: 'error', message: "⚠️ 检测到参数传递错误！请确保在启动 litellm 时加入了 --drop_params 参数以过滤不支持的特定字段。" });
    } else {
      setDiagnosis({ type: 'success', message: "✅ 暂未匹配到常见错误模式。建议查阅下方的官方文档或检查网络连接。" });
    }
  }, [errorLog]);

  const currentPlatform = PLATFORMS.find(p => p.id === platformId) || PLATFORMS[0];

  const litellmEnvKey = currentPlatform.id === 'custom' ? 'OPENAI_API_KEY' : `${currentPlatform.id.toUpperCase()}_API_KEY`;
  const litellmDefaultModel = currentPlatform.id === 'deepseek' 
    ? 'deepseek/deepseek-chat' 
    : `${currentPlatform.id === 'custom' ? 'openai' : currentPlatform.id}/${availableModels && availableModels.length > 0 ? availableModels[0] : 'your-model'}`;

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setPlatformId(newId);
    const newPlatform = PLATFORMS.find(p => p.id === newId)!;
    setCustomBaseUrl(newPlatform.defaultBaseUrl);
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
      let dynamicModelId = currentPlatform.body?.model || 'gpt-3.5-turbo';
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
          }
        }
      } catch (e) {
        console.error('Failed to dynamically fetch models', e);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center group cursor-pointer">
            <div className="inline-flex items-center justify-center p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              API-QuickCheck
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-bold text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/20">v1.1</span>
            <a href="https://github.com/som1ng/API-QuickCheck" target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors">
              <span className="mr-1">GitHub</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-28 pb-16 w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
        
        {/* Header Text */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            LLM API <span className="text-blue-400">快速验证工具</span>
          </h1>
          <p className="text-slate-400 font-medium text-base max-w-xl mx-auto">
            一键探测模型可用性与额度状态，适配主流 Agent 接入配置。
          </p>
        </div>

        {/* Card 1: Main Control Panel */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 md:p-10 hover:border-white/20 transition-all duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Platform Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-300 ml-1">测试平台</label>
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

            {/* API Key Input */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-300 ml-1">API Key</label>
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
                      <span key={m} className="px-3 py-1.5 text-xs font-mono font-medium bg-black/40 text-slate-300 rounded-lg border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-default">
                        {m}
                      </span>
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

            {/* Agent Guide */}
            <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-6 bg-black/20 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-black text-white flex items-center text-lg tracking-tight">
                  <Terminal className="w-5 h-5 mr-3 text-blue-500" />
                  Agent 一键接入指南
                </h3>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-white/5 bg-black/10 overflow-x-auto custom-scrollbar px-3 pt-2">
                {['Claude Code', 'OpenClaw', 'Cline / Roo Code'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === tab 
                        ? 'text-blue-400 border-blue-500 bg-white/5' 
                        : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-8">
                {customBaseUrl !== currentPlatform.defaultBaseUrl && (
                  <div className="mb-8 flex items-start bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 shadow-inner">
                    <AlertTriangle className="w-6 h-6 text-amber-500 mr-4 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-100/80 leading-relaxed font-bold">
                      ⚠️ 正在使用自定义 API 地址。请务必在 Agent 设置中开启「自定义 Endpoint」或修改 API Base，否则请求将指向默认官方接口导致鉴权失败。
                    </p>
                  </div>
                )}

                {activeTab === 'Claude Code' && (
                  <div className="relative animate-in fade-in duration-500">
                    <div className="space-y-8">
                      <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5 shadow-inner">
                        <div className="flex items-center mb-3">
                          <Box className="w-5 h-5 mr-3 text-blue-400" />
                          <h4 className="text-sm font-black text-blue-300 uppercase tracking-wider">统一本地网关模式 (LiteLLM)</h4>
                        </div>
                        <p className="text-xs text-blue-100/60 leading-relaxed">
                          采用 LiteLLM 作为本地中转网关是目前最稳定的方案。它能完美解决所有非 Anthropic 模型与 Claude Code 之间的协议兼容性问题，真正实现“无脑接入”。
                        </p>
                      </div>

                      {/* Step 1 */}
                      <div className="space-y-4">
                        <h5 className="text-sm font-bold text-white flex items-center"><span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-lg mr-3 text-[10px] font-black">01</span> 环境清理与反劫持</h5>
                        <div className="flex gap-2">
                          <button onClick={() => setShellType('bash')} className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${shellType === 'bash' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'}`}>Bash / Zsh</button>
                          <button onClick={() => setShellType('ps')} className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${shellType === 'ps' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'}`}>PowerShell</button>
                        </div>
                        <div className="relative group">
                          <div className="absolute right-3 top-3 z-10">
                            <CopyButton text={shellType === 'bash' 
                              ? `unset ANTHROPIC_AUTH_TOKEN\nexport NO_PROXY="127.0.0.1,localhost,0.0.0.0"` 
                              : `Remove-Item Env:\\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue\n$env:NO_PROXY="127.0.0.1,localhost,0.0.0.0"`} />
                          </div>
                          <pre className="bg-[#05070a] p-5 rounded-2xl text-xs font-mono text-slate-300 border border-white/5 overflow-x-auto custom-scrollbar shadow-2xl">
                            {shellType === 'bash' ? (
                              <code>
                                <span className="text-purple-400">unset</span> ANTHROPIC_AUTH_TOKEN{'\n'}
                                <span className="text-purple-400">export</span> NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>
                              </code>
                            ) : (
                              <code>
                                <span className="text-slate-500"># Windows PowerShell</span>{'\n'}
                                <span className="text-emerald-400">Remove-Item</span> Env:\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue{'\n'}
                                <span className="text-purple-400">$env:</span>NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>
                              </code>
                            )}
                          </pre>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="space-y-4">
                        <h5 className="text-sm font-bold text-white flex items-center"><span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-lg mr-3 text-[10px] font-black">02</span> 启动 LiteLLM 翻译官</h5>
                        <div className="flex gap-2">
                          <button onClick={() => setShellType('bash')} className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${shellType === 'bash' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'}`}>Bash / Zsh</button>
                          <button onClick={() => setShellType('ps')} className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${shellType === 'ps' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'}`}>PowerShell</button>
                        </div>
                        <div className="relative group">
                          <div className="absolute right-3 top-3 z-10"><CopyButton text={shellType === 'bash' 
                            ? `export ${litellmEnvKey}="${apiKey}"\npip install --upgrade "litellm[proxy]"\nlitellm --model ${litellmDefaultModel} --api_base ${customBaseUrl.replace(/\/$/, '')} --drop_params` 
                            : `$env:${litellmEnvKey}="${apiKey}"\npip install --upgrade "litellm[proxy]"\nlitellm --model ${litellmDefaultModel} --api_base ${customBaseUrl.replace(/\/$/, '')} --drop_params`} /></div>
                          <pre className="bg-[#05070a] p-5 rounded-2xl text-xs font-mono text-slate-300 border border-white/5 overflow-x-auto custom-scrollbar shadow-2xl">
                            {shellType === 'bash' ? (
                              <code>
                                <span className="text-purple-400">export</span> {litellmEnvKey}=<span className="text-amber-300">"{apiKey}"</span>{'\n'}
                                <span className="text-purple-400">pip</span> install --upgrade <span className="text-amber-300">"litellm[proxy]"</span>{'\n'}
                                <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">{litellmDefaultModel}</span> --api_base <span className="text-emerald-300">{customBaseUrl.replace(/\/$/, '')}</span> --drop_params
                              </code>
                            ) : (
                              <code>
                                <span className="text-purple-400">$env:</span>{litellmEnvKey}=<span className="text-amber-300">"{apiKey}"</span>{'\n'}
                                <span className="text-purple-400">pip</span> install --upgrade <span className="text-amber-300">"litellm[proxy]"</span>{'\n'}
                                <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">{litellmDefaultModel}</span> --api_base <span className="text-emerald-300">{customBaseUrl.replace(/\/$/, '')}</span> --drop_params
                              </code>
                            )}
                          </pre>
                        </div>
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
                          <p className="text-[10px] text-amber-200/50 leading-relaxed italic">
                            提示：保持此终端窗口运行。<code>--drop_params</code> 是关键，它能防止 Claude 特有参数（如 Thinking）导致 DeepSeek 报错。
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="space-y-4">
                        <h5 className="text-sm font-bold text-white flex items-center"><span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-lg mr-3 text-[10px] font-black">03</span> 唤醒 Claude Code</h5>
                        <div className="flex gap-2">
                          <button onClick={() => setShellType('bash')} className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${shellType === 'bash' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'}`}>Bash / Zsh</button>
                          <button onClick={() => setShellType('ps')} className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${shellType === 'ps' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'}`}>PowerShell</button>
                        </div>
                        <div className="relative group">
                          <div className="absolute right-3 top-3 z-10">
                            <CopyButton text={shellType === 'bash' 
                              ? `export ANTHROPIC_BASE_URL="http://0.0.0.0:4000"\nexport ANTHROPIC_API_KEY="sk-litellm"\nclaude`
                              : `$env:ANTHROPIC_BASE_URL="http://0.0.0.0:4000"\n$env:ANTHROPIC_API_KEY="sk-litellm"\nclaude`
                            } />
                          </div>
                          <pre className="bg-[#05070a] p-5 rounded-2xl text-xs font-mono text-slate-300 border border-white/5 overflow-x-auto custom-scrollbar shadow-2xl">
                            {shellType === 'bash' ? (
                              <code>
                                <span className="text-purple-400">export</span> ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://0.0.0.0:4000"</span>{'\n'}
                                <span className="text-purple-400">export</span> ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm"</span>{'\n'}
                                <span className="text-emerald-400">claude</span>
                              </code>
                            ) : (
                              <code>
                                <span className="text-purple-400">$env:</span>ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://0.0.0.0:4000"</span>{'\n'}
                                <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm"</span>{'\n'}
                                <span className="text-emerald-400">claude</span>
                              </code>
                            )}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Official Docs */}
                    <div className="mt-12 pt-8 border-t border-white/5">
                      <div className="flex items-center mb-6">
                        <Globe className="w-4 h-4 text-slate-600 mr-2" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">官方文档直连</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <a href="https://docs.litellm.ai/docs/proxy/quick_start" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-blue-500/5 hover:border-blue-500/30 transition-all group">
                          <div className="text-xs font-black text-blue-400 mb-1">LiteLLM Proxy</div>
                          <div className="text-[10px] text-slate-500 group-hover:text-slate-400">快速入门手册 →</div>
                        </a>
                        <a href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-purple-500/5 hover:border-purple-500/30 transition-all group">
                          <div className="text-xs font-black text-purple-400 mb-1">Claude Code</div>
                          <div className="text-[10px] text-slate-500 group-hover:text-slate-400">官方环境指南 →</div>
                        </a>
                        <a href="https://api-docs.deepseek.com/" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all group">
                          <div className="text-xs font-black text-emerald-400 mb-1">DeepSeek API</div>
                          <div className="text-[10px] text-slate-500 group-hover:text-slate-400">官方参数说明 →</div>
                        </a>
                      </div>
                    </div>

                    {/* Analyzer */}
                    <div className="mt-12 pt-8 border-t border-white/5">
                      <div className="flex items-center mb-4">
                        <Terminal className="w-4 h-4 text-amber-500 mr-2" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">报错自诊断分析</span>
                      </div>
                      <textarea
                        value={errorLog}
                        onChange={(e) => setErrorLog(e.target.value)}
                        placeholder="粘贴终端报错日志，自动为您匹配解决方案..."
                        className="w-full h-32 bg-[#05070a] border border-white/5 rounded-2xl p-5 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 transition-all shadow-2xl placeholder-slate-800"
                      />
                      {diagnosis && (
                        <div className={`mt-4 p-5 rounded-2xl border shadow-2xl animate-in fade-in duration-300 ${
                          diagnosis.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          diagnosis.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          <p className="text-xs font-bold leading-relaxed">{diagnosis.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'OpenClaw' && (
                  <div className="relative group animate-in fade-in duration-300">
                    <div className="absolute right-4 top-4 z-10">
                      <CopyButton text={`{\n  "api_key": "${apiKey}",\n  "base_url": "${customBaseUrl}"\n}`} />
                    </div>
                    <div className="bg-[#05070a] p-6 rounded-2xl border border-white/5 relative shadow-2xl">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl" />
                      <pre className="text-sm font-mono text-slate-300 overflow-x-auto pb-2 custom-scrollbar pl-4">
                        <code>
                          {'{'}{'\n'}
                          {'  '}<span className="text-blue-400">"api_key"</span>: <span className="text-amber-300">"{apiKey}"</span>,{'\n'}
                          {'  '}<span className="text-blue-400">"base_url"</span>: <span className="text-amber-300">"{customBaseUrl}"</span>{'\n'}
                          {'}'}
                        </code>
                      </pre>
                    </div>
                    <p className="text-xs text-slate-500 mt-5 flex items-center font-medium">
                      <Info className="w-4 h-4 mr-2" />
                      将生成的配置片段粘贴至 OpenClaw 的 config.json 文件中即可。
                    </p>
                  </div>
                )}

                {activeTab === 'Cline / Roo Code' && (
                  <div className="animate-in fade-in duration-300 space-y-4">
                    <div className="bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600" />
                      <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-white/5">
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="py-4 px-6 text-slate-400 font-black text-[10px] uppercase tracking-widest w-40 border-r border-white/5">Provider</td>
                            <td className="py-4 px-6 text-white font-black flex items-center justify-between">
                              <span>
                                {currentPlatform.id === 'anthropic' || currentPlatform.id === 'claude' ? 'Anthropic' : 
                                 currentPlatform.id === 'gemini' ? 'Google Gemini' : 'OpenAI Compatible'}
                              </span>
                              <div className="scale-75 opacity-0 group-hover:opacity-100 transition-all">
                                <CopyButton text={currentPlatform.id === 'anthropic' || currentPlatform.id === 'claude' ? 'Anthropic' : currentPlatform.id === 'gemini' ? 'Google Gemini' : 'OpenAI Compatible'} />
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="py-4 px-6 text-slate-400 font-black text-[10px] uppercase tracking-widest border-r border-white/5">Base URL</td>
                            <td className="py-4 px-6 text-amber-300 font-mono text-xs flex justify-between items-center bg-black/20">
                              <span className="truncate max-w-[200px] sm:max-w-xs">{customBaseUrl}</span>
                              <div className="scale-75 opacity-0 group-hover:opacity-100 transition-all">
                                <CopyButton text={customBaseUrl} />
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="py-4 px-6 text-slate-400 font-black text-[10px] uppercase tracking-widest border-r border-white/5">API Key</td>
                            <td className="py-4 px-6 text-emerald-400 font-mono text-xs flex justify-between items-center bg-black/20">
                              <span>{apiKey.substring(0, 10)}...</span>
                              <div className="scale-75 opacity-0 group-hover:opacity-100 transition-all">
                                <CopyButton text={apiKey} />
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="py-4 px-6 text-slate-400 font-black text-[10px] uppercase tracking-widest border-r border-white/5">Target Model</td>
                            <td className="py-4 px-6 text-blue-400 font-mono text-xs flex justify-between items-center bg-black/20">
                              <span className="truncate max-w-[200px] sm:max-w-xs">
                                {availableModels && availableModels.length > 0 ? availableModels[0] : 'gpt-4o / deepseek-chat'}
                              </span>
                              <div className="scale-75 opacity-0 group-hover:opacity-100 transition-all">
                                <CopyButton text={availableModels && availableModels.length > 0 ? availableModels[0] : 'gpt-4o / deepseek-chat'} />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
