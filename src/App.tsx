import React, { useState, useEffect } from 'react';
import { Settings2, Play, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, Loader2, Info, Copy, Terminal, Box, Check, Database } from 'lucide-react';

const PLATFORMS = [
  {
    id: 'openai',
    name: 'OpenAI (官方或中转)',
    defaultBaseUrl: 'https://api.openai.com',
    testEndpoint: '/v1/chat/completions',
    method: 'POST',
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: { messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
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
    body: { model: 'deepseek-ai/DeepSeek-V3', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
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
    body: { messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
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
    body: { messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
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
    body: { model: 'nvidia/llama-3.1-8b-instruct', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
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
    body: { messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
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

    setStatus('loading');
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

    try {
      const response = await fetch(url, {
        method: currentPlatform.method,
        headers: currentPlatform.headers(apiKey.trim()),
        // @ts-ignore
        body: currentPlatform.body ? JSON.stringify(currentPlatform.body) : undefined,
      });

      const endTime = Date.now();
      setDelay(endTime - startTime);

      const status = response.status;
      const data = await response.json().catch(() => null);
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
        
        // 自动探测模型
        let models: string[] = [];
        try {
          // 如果是 chat/completions 成功，说明 Key 没问题，尝试获取模型列表
          const modelsRawUrl = customBaseUrl.replace(/\/$/, '') + (currentPlatform.id === 'gemini' ? '/v1beta/models' : '/v1/models');
          const modelsUrl = useProxy 
            ? (isLocalhost ? `https://corsproxy.io/?${encodeURIComponent(modelsRawUrl)}` : `/api/proxy?url=${encodeURIComponent(modelsRawUrl)}`)
            : modelsRawUrl;
          
          const mResp = await fetch(modelsUrl, { 
            method: 'GET', 
            headers: currentPlatform.headers(apiKey.trim()) 
          });
          
          if (mResp.ok) {
            const mData = await mResp.json().catch(() => null);
            if (mData && Array.isArray(mData.data)) {
              models = mData.data.map((m: any) => m.id).filter(Boolean);
            } else if (mData && Array.isArray(mData.models)) {
              models = mData.models.map((m: any) => m.name || m.id).filter(Boolean);
            }
          }
        } catch(e) {
           console.error('Failed to probe models', e);
        }
        setAvailableModels(models);

      } else {
        if (isQuotaError) {
           setStatus('error_quota');
           setErrorMessage(`测试失败：余额不足或额度已耗尽，请前往官网充值 (HTTP ${status})`);
        } else if (status === 401 || status === 403) {
           setStatus('error_key');
           setErrorMessage(`测试失败：API Key 无效或权限不足 (HTTP ${status})`);
        } else {
          setStatus('error_other');
          const errorMsg = data?.error?.message || data?.message || '接口返回错误';
          setErrorMessage(`测试失败：${errorMsg} (HTTP ${status})`);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setStatus('error_cors');
        const msg = '这通常是由于浏览器跨域拦截 (CORS) 导致的，请尝试在高级设置中开启「CORS 代理」开关，或使用浏览器跨域插件。';
        setErrorMessage(msg);
      } else {
        setStatus('error_other');
        setErrorMessage(`网络请求异常：${err.message || '未知错误'}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-y-auto">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mr-3 shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-tight">
              API-QuickCheck
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-full border border-blue-100">v1.0</span>
            <a href="https://github.com/som1ng/API-QuickCheck" target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-12 w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
        
        {/* Header Text */}
        <div className="text-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">快速验证密钥并一键生成 Agent 配置</h1>
          <p className="text-gray-500 font-medium text-sm">无需后端，纯浏览器端运行，安全可靠不走漏 Key。</p>
        </div>

        {/* Card 1: Platform & Key Setup */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* Platform Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">测试平台</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-white border border-gray-200 text-gray-900 rounded-lg py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                value={platformId}
                onChange={handlePlatformChange}
              >
                {PLATFORMS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Settings2 className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="mb-6">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
            >
              <Settings2 className="w-4 h-4 mr-1" />
              {showAdvanced ? '收起高级设置' : '高级设置 (自定义 Base URL & 平台提示)'}
            </button>
            
            {showAdvanced && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-semibold text-gray-600 mb-2">接口地址 (Base URL)</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-3 shadow-sm"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com"
                />
                
                <div className="flex items-center mb-4 mt-2">
                  <input
                    type="checkbox"
                    id="proxy-toggle"
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    checked={useProxy}
                    onChange={(e) => setUseProxy(e.target.checked)}
                  />
                  <label htmlFor="proxy-toggle" className="ml-2 text-sm font-medium text-gray-600 cursor-pointer select-none">
                    使用 CORS 代理转发请求 (支持绕过严格跨域限制)
                  </label>
                </div>
                {/* @ts-ignore */}
                {currentPlatform.helpText && (
                  <div className="flex items-start bg-blue-50 border border-blue-100 rounded-md p-3">
                    <Info className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {/* @ts-ignore */}
                      {currentPlatform.helpText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* API Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 font-mono shadow-sm"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={currentPlatform.placeholder}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleTest}
            disabled={status === 'loading'}
            className="w-full relative overflow-hidden rounded-lg font-bold text-white shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] bg-blue-600 hover:bg-blue-700 py-3.5 flex items-center justify-center"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" fill="currentColor" />
                开始测试
              </>
            )}
          </button>
        </div>

        {/* Results Area */}
        {status !== 'idle' && status !== 'loading' && (
          <div className={`p-5 rounded-xl border shadow-sm animate-in zoom-in-95 duration-200 ${
            status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            status === 'error_cors' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start">
              {status === 'success' && <CheckCircle2 className="w-6 h-6 mr-3 flex-shrink-0 text-emerald-500" />}
              {(status === 'error_key' || status === 'error_quota' || status === 'error_other') && <XCircle className="w-6 h-6 mr-3 flex-shrink-0 text-red-500" />}
              {status === 'error_cors' && <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0 text-amber-500" />}
              
              <div className="w-full">
                <h3 className="font-bold mb-1 flex items-center justify-between text-base">
                  <span>
                    {status === 'success' ? '测试通过！' :
                     status === 'error_cors' ? '跨域拦截 / 网络不通' : '测试失败'}
                  </span>
                  {status === 'success' && delay !== null && (
                    <span className="text-xs font-mono opacity-90 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      {delay}ms
                    </span>
                  )}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed mb-1">
                  {status === 'success' ? `你的 Key 可以正常使用。` : errorMessage}
                </p>
                {status === 'success' && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex-1 bg-white p-3 rounded-md border border-emerald-100 flex items-center shadow-sm">
                      <Zap className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                      <span className="text-xs text-gray-600 font-medium">API 状态：<span className="text-emerald-600 font-bold ml-1">健康可用</span></span>
                    </div>
                    <div className="flex-1 bg-white p-3 rounded-md border border-blue-100 flex items-center shadow-sm">
                      <Database className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                      <span className="text-xs text-gray-600 font-medium">当前额度：<span className="text-blue-600 font-bold ml-1">充沛 (未耗尽)</span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Model Probe & Agent Guide */}
        {status === 'success' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Models Area */}
            {availableModels !== null && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
                  <Box className="w-5 h-5 mr-2 text-blue-500" />
                  可用模型探测 {availableModels.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({availableModels.length} 个)</span>}
                </h4>
                {availableModels.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {availableModels.map(m => (
                      <span key={m} className="px-2.5 py-1 text-xs bg-gray-50 text-gray-700 rounded-md border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-700 flex items-center bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 text-amber-500" />
                    无法获取模型列表，请手动尝试在 Agent 中填写模型 ID
                  </p>
                )}
              </div>
            )}

            {/* Agent Guide */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 flex items-center text-base">
                  <Terminal className="w-5 h-5 mr-2 text-blue-600" />
                  Agent 一键接入指南
                </h3>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-gray-50/50 overflow-x-auto custom-scrollbar px-2">
                {['Claude Code', 'OpenClaw', 'Cline / Roo Code'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === tab 
                        ? 'text-blue-600 border-blue-600 bg-white' 
                        : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-100/50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {customBaseUrl !== currentPlatform.defaultBaseUrl && (
                  <div className="mb-6 flex items-start bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 leading-relaxed font-medium">
                      <span className="font-bold">⚠️ 检测到您使用的是非官方 API</span>，请务必在 Agent 设置中开启「自定义 Endpoint」功能（或修改 Base URL），否则将无法使用。
                    </p>
                  </div>
                )}

                {activeTab === 'Claude Code' && (
                  <div className="relative group animate-in fade-in duration-300">
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 shadow-sm animate-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-blue-800 flex items-center mb-2">
                          <Box className="w-5 h-5 mr-2 flex-shrink-0" />
                          统一本地网关模式（基于 LiteLLM）
                        </h4>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          为了保证跨平台模型协议的绝对兼容性，避免复杂的手动 JSON 配置。我们采用 LiteLLM 作为本地网关，无论测试什么平台，只需按以下三步【无脑复制】即可完美驱动 Claude Code。
                        </p>
                      </div>

                      {/* Step 1 */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center"><span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mr-2 text-xs">第一步</span> 环境大扫除（防劫持排雷）</h5>
                        <p className="text-xs text-gray-500 mb-3">说明：清理可能被第三方工具篡改的隐藏配置或环境变量。</p>
                        
                        <div className="flex gap-2 mb-2">
                          <button onClick={() => setShellType('bash')} className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors ${shellType === 'bash' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>Bash / Zsh</button>
                          <button onClick={() => setShellType('ps')} className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors ${shellType === 'ps' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>PowerShell</button>
                        </div>
                        <div className="relative">
                          <div className="absolute right-2 top-2 z-10">
                            <CopyButton text={shellType === 'bash' 
                              ? `unset ANTHROPIC_AUTH_TOKEN\nexport NO_PROXY="127.0.0.1,localhost,0.0.0.0"` 
                              : `Remove-Item Env:\\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue\n$env:NO_PROXY="127.0.0.1,localhost,0.0.0.0"`} />
                          </div>
                          <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-gray-200 border border-gray-800 overflow-x-auto custom-scrollbar">
                            {shellType === 'bash' ? (
                              <code>
                                <span className="text-purple-400">unset</span> ANTHROPIC_AUTH_TOKEN{'\n'}
                                <span className="text-purple-400">export</span> NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>
                              </code>
                            ) : (
                              <code>
                                <span className="text-gray-500"># Windows</span>{'\n'}
                                <span className="text-emerald-400">Remove-Item</span> Env:\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue{'\n'}
                                <span className="text-purple-400">$env:</span>NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>
                              </code>
                            )}
                          </pre>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center"><span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mr-2 text-xs">第二步</span> 启动万能翻译官 (LiteLLM)</h5>
                        <p className="text-xs text-gray-500 mb-3">说明：让代理工具在后台帮你将协议翻译成 Claude 能懂的语言。<span className="text-amber-600 font-bold">请勿关闭此窗口！</span></p>
                        
                        <div className="flex gap-2 mb-2">
                          <button onClick={() => setShellType('bash')} className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors ${shellType === 'bash' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>Bash / Zsh</button>
                          <button onClick={() => setShellType('ps')} className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors ${shellType === 'ps' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>PowerShell</button>
                        </div>
                        <div className="relative">
                          <div className="absolute right-2 top-2 z-10"><CopyButton text={shellType === 'bash' 
                            ? `export ${litellmEnvKey}="${apiKey}"\npip install --upgrade "litellm[proxy]"\nlitellm --model ${litellmDefaultModel} --api_base ${customBaseUrl.replace(/\/$/, '')} --drop_params` 
                            : `$env:${litellmEnvKey}="${apiKey}"\npip install --upgrade "litellm[proxy]"\nlitellm --model ${litellmDefaultModel} --api_base ${customBaseUrl.replace(/\/$/, '')} --drop_params`} /></div>
                          <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-gray-200 border border-gray-800 overflow-x-auto custom-scrollbar">
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
                        
                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3">
                          <p className="text-xs text-amber-800 leading-relaxed space-y-1">
                            <span className="font-bold flex items-center"><Info className="w-3.5 h-3.5 mr-1" />常见排错：</span>
                            <span className="block">1. <span className="font-semibold text-amber-900">为什么加 --drop_params？</span> Claude 会发送特定的参数 (如 thinking)，DeepSeek 等模型不认识会报错 400，该标志能自动过滤多余参数。</span>
                            <span className="block">2. <span className="font-semibold text-amber-900">提示 No such option: --api_key？</span> 新版 LiteLLM 已弃用该启动参数，请务必先执行步骤一设置环境变量。</span>
                            <span className="block">3. <span className="font-semibold text-amber-900">报错 ModuleNotFoundError?</span> 请确保执行的是 <code>pip install --upgrade "litellm[proxy]"</code>，proxy 插件包含服务器所需的完整依赖。</span>
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center"><span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mr-2 text-xs">第三步</span> 启动 Claude Code</h5>
                        <p className="text-xs text-gray-500 mb-3">说明：保持 LiteLLM 运行，打开一个<span className="text-emerald-600 font-bold">【全新】</span>的终端窗口，粘贴以下命令。</p>
                        
                        <div className="flex gap-2 mb-2">
                          <button onClick={() => setShellType('bash')} className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors ${shellType === 'bash' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>Bash / Zsh</button>
                          <button onClick={() => setShellType('ps')} className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors ${shellType === 'ps' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>PowerShell</button>
                        </div>
                        <div className="relative">
                          <div className="absolute right-2 top-2 z-10">
                            <CopyButton text={shellType === 'bash' 
                              ? `export ANTHROPIC_BASE_URL="http://0.0.0.0:4000"\nexport ANTHROPIC_API_KEY="sk-litellm"\nclaude`
                              : `$env:ANTHROPIC_BASE_URL="http://0.0.0.0:4000"\n$env:ANTHROPIC_API_KEY="sk-litellm"\nclaude`
                            } />
                          </div>
                          <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-gray-200 border border-gray-800 overflow-x-auto custom-scrollbar">
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

                    {/* Official Docs Bridge */}
                    <div className="mt-8 border-t border-gray-100 pt-6 animate-in fade-in duration-500">
                      <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                        <Box className="w-4 h-4 mr-2 text-blue-500" />
                        实时参考 (Official Docs Bridge)
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">代码可能会随版本更新，如遇报错，请第一时间查看官方最新手册：</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <a href="https://docs.litellm.ai/docs/proxy/quick_start" target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                          <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 block mb-1">LiteLLM Proxy</span>
                          <span className="text-xs text-gray-500">官方配置指南</span>
                        </a>
                        <a href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview" target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                          <span className="text-sm font-semibold text-purple-600 group-hover:text-purple-700 block mb-1">Claude Code</span>
                          <span className="text-xs text-gray-500">官方环境手册</span>
                        </a>
                        <a href="https://api-docs.deepseek.com/" target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors group">
                          <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 block mb-1">DeepSeek API</span>
                          <span className="text-xs text-gray-500">官方参数说明</span>
                        </a>
                      </div>
                    </div>

                    {/* Error Log Analyzer */}
                    <div className="mt-8 border-t border-gray-100 pt-6 animate-in fade-in duration-500">
                      <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                        <Terminal className="w-4 h-4 mr-2 text-amber-500" />
                        报错自诊断 (Error Log Analyzer)
                      </h4>
                      <textarea
                        value={errorLog}
                        onChange={(e) => setErrorLog(e.target.value)}
                        placeholder="在此粘贴您的终端报错日志..."
                        className="w-full h-24 bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs font-mono text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar mb-3 placeholder:text-gray-600 transition-all shadow-inner"
                      />
                      {diagnosis && (
                        <div className={`p-4 rounded-lg border shadow-sm ${
                          diagnosis.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                          diagnosis.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                          'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          <p className="text-xs font-medium leading-relaxed">{diagnosis.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'OpenClaw' && (
                  <div className="relative group animate-in fade-in duration-300">
                    <div className="absolute right-3 top-3 z-10">
                      <CopyButton text={`{\n  "api_key": "${apiKey}",\n  "base_url": "${customBaseUrl}"\n}`} />
                    </div>
                    <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 overflow-hidden relative shadow-inner">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                      <pre className="text-sm font-mono text-gray-200 overflow-x-auto pb-2 custom-scrollbar">
                        <code>
                          {'{'}{'\n'}
                          {'  '}<span className="text-blue-400">"api_key"</span>: <span className="text-amber-300">"{apiKey}"</span>,{'\n'}
                          {'  '}<span className="text-blue-400">"base_url"</span>: <span className="text-amber-300">"{customBaseUrl}"</span>{'\n'}
                          {'}'}
                        </code>
                      </pre>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center">
                      <Info className="w-3.5 h-3.5 mr-1.5" />
                      将以上配置片段合并到您的 config.json 对应模型提供商配置中。
                    </p>
                  </div>
                )}

                {activeTab === 'Cline / Roo Code' && (
                  <div className="animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                      <table className="w-full text-sm text-left">
                        <tbody className="divide-y divide-gray-100">
                          <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="py-3.5 px-5 text-gray-600 font-medium w-32 border-r border-gray-100">Provider</td>
                            <td className="py-3.5 px-5 text-gray-900 font-semibold flex items-center justify-between">
                              <span>
                                {currentPlatform.id === 'anthropic' || currentPlatform.id === 'claude' ? 'Anthropic' : 
                                 currentPlatform.id === 'gemini' ? 'Google Gemini' : 'OpenAI Compatible'}
                              </span>
                              <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={currentPlatform.id === 'anthropic' || currentPlatform.id === 'claude' ? 'Anthropic' : currentPlatform.id === 'gemini' ? 'Google Gemini' : 'OpenAI Compatible'} />
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="py-3.5 px-5 text-gray-600 font-medium border-r border-gray-100">Base URL</td>
                            <td className="py-3.5 px-5 text-amber-600 font-mono text-xs flex justify-between items-center bg-gray-50/50">
                              <span className="truncate max-w-[200px] sm:max-w-xs">{customBaseUrl}</span>
                              <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={customBaseUrl} />
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="py-3.5 px-5 text-gray-600 font-medium border-r border-gray-100">API Key</td>
                            <td className="py-3.5 px-5 text-emerald-600 font-mono text-xs flex justify-between items-center bg-gray-50/50">
                              <span>{apiKey.substring(0, 8)}...</span>
                              <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={apiKey} />
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="py-3.5 px-5 text-gray-600 font-medium border-r border-gray-100">建议模型</td>
                            <td className="py-3.5 px-5 text-blue-600 font-mono text-xs flex justify-between items-center bg-gray-50/50">
                              <span className="truncate max-w-[200px] sm:max-w-xs">
                                {availableModels && availableModels.length > 0 ? availableModels[0] : 'gpt-4o / claude-3-5-sonnet'}
                              </span>
                              <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={availableModels && availableModels.length > 0 ? availableModels[0] : 'gpt-4o / claude-3-5-sonnet'} />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center">
                      <Info className="w-3.5 h-3.5 mr-1.5" />
                      在 VSCode 扩展设置中，依次填入上述表格内容。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-gray-200 mt-auto bg-white">
        <p className="text-gray-400 text-sm flex items-center justify-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>本工具纯前端运行，绝不收集或上传任何 API Key。只为开源与热爱而生。</span>
        </p>
      </footer>
    </div>
  );
}
