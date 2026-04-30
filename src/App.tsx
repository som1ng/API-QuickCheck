import React, { useState } from 'react';
import { Settings2, Play, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, Loader2, Info, Copy, Terminal, Box, Check } from 'lucide-react';

const PLATFORMS = [
  {
    id: 'openai',
    name: 'OpenAI (官方或中转)',
    defaultBaseUrl: 'https://api.openai.com',
    testEndpoint: '/v1/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'sk-...',
    helpText: '如果是第三方中转 API，请在下方高级设置中修改 Base URL 为中转地址。',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com',
    testEndpoint: '/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'sk-...',
  },
  {
    id: 'siliconflow',
    name: '硅基流动 (SiliconFlow)',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    testEndpoint: '/user/info',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'sk-...',
    helpText: '注册即可获取海量免费开源模型额度。',
  },
  {
    id: 'moonshot',
    name: 'Kimi (月之暗面)',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    testEndpoint: '/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'sk-...',
  },
  {
    id: 'qwen',
    name: '通义千问 (DashScope)',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    testEndpoint: '/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'sk-...',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM (BigModel)',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    testEndpoint: '/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'sk-...',
  },
  {
    id: 'doubao',
    name: '豆包 (火山引擎)',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    testEndpoint: '/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'sk-...',
    helpText: '火山引擎接口可能测试通过，但在实际使用时需在控制台获取对应的接入点 (Endpoint ID) 作为模型名称。',
  },
  {
    id: 'stepfun',
    name: '阶跃星辰 (StepFun)',
    defaultBaseUrl: 'https://api.stepfun.com/v1',
    testEndpoint: '/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'sk-...',
  },
  {
    id: '01ai',
    name: '零一万物 (01.AI)',
    defaultBaseUrl: 'https://api.lingyiwanwu.com/v1',
    testEndpoint: '/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'sk-...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    testEndpoint: '/auth/key',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'sk-or-v1-...',
    helpText: '知名海外模型聚合平台，提供大量免费开源模型额度。'
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM (英伟达)',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    testEndpoint: '/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'nvapi-...',
    helpText: '英伟达提供顶级开源模型免费体验额度，非常适合测试前沿模型。'
  },
  {
    id: 'groq',
    name: 'Groq',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    testEndpoint: '/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: 'gsk_...',
    helpText: '提供极速的 LPU 推理服务，当前支持众多免费开源模型。'
  },
  {
    id: 'together',
    name: 'Together AI',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    testEndpoint: '/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    placeholder: '... (API Key)',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    testEndpoint: '/v1beta/models',
    method: 'GET',
    headers: (key: string) => ({ 'x-goog-api-key': key }),
    placeholder: 'AIzaSy...',
    helpText: '国内直连通常会失败，请确保全局代理或在此处使用国内可访问的代理 Base URL。'
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    defaultBaseUrl: 'https://api.anthropic.com',
    testEndpoint: '/v1/models',
    method: 'GET',
    headers: (key: string) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
    placeholder: 'sk-ant-...',
    helpText: '官方接口严禁浏览器直接测试（CORS拦截），通常直接报错。建议仅用来测试第三方中转的 Claude 接口。'
  },
  {
    id: 'custom',
    name: '自定义 API (兼容 OpenAI)',
    defaultBaseUrl: '',
    testEndpoint: '/v1/models',
    method: 'GET',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
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
  const [configPersistence, setConfigPersistence] = useState<'session' | 'permanent'>('session');

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
      });

      const endTime = Date.now();
      setDelay(endTime - startTime);

      if (response.ok) {
        setStatus('success');
        
        // 自动探测模型
        let models: string[] = [];
        try {
          const data = await response.clone().json().catch(() => null);
          if (data) {
            if (Array.isArray(data.data)) {
              models = data.data.map((m: any) => m.id).filter(Boolean);
            } else if (Array.isArray(data.models)) {
              models = data.models.map((m: any) => m.name || m.id).filter(Boolean);
            } else if (Array.isArray(data)) {
              models = data.map((m: any) => m.id || m.name).filter(Boolean);
            }
          }
          
          if (models.length === 0 && !currentPlatform.testEndpoint.includes('model')) {
            const modelsRawUrl = customBaseUrl.replace(/\/$/, '') + '/v1/models';
            const modelsUrl = useProxy 
              ? (isLocalhost ? `https://corsproxy.io/?${encodeURIComponent(modelsRawUrl)}` : `/api/proxy?url=${encodeURIComponent(modelsRawUrl)}`)
              : modelsRawUrl;
            
            const mResp = await fetch(modelsUrl, { method: 'GET', headers: currentPlatform.headers(apiKey.trim()) });
            if (mResp.ok) {
              const mData = await mResp.json().catch(() => null);
              if (mData && Array.isArray(mData.data)) {
                models = mData.data.map((m: any) => m.id).filter(Boolean);
              } else if (mData && Array.isArray(mData.models)) {
                models = mData.models.map((m: any) => m.name || m.id).filter(Boolean);
              }
            }
          }
        } catch(e) {
           console.error('Failed to probe models', e);
        }
        setAvailableModels(models);

      } else {
        const status = response.status;
        const text = await response.text().catch(() => '');
        const lowerText = text.toLowerCase();
        
        if (status === 401 || status === 403 || status === 402) {
          if (lowerText.includes('quota') || lowerText.includes('insufficient') || lowerText.includes('balance') || status === 402) {
             setStatus('error_quota');
             setErrorMessage(`测试失败：额度已耗尽或需要绑卡 (HTTP ${status})`);
          } else {
             setStatus('error_key');
             setErrorMessage(`测试失败：API Key 无效，请检查是否复制完整 (HTTP ${status})`);
          }
        } else if (status === 429) {
          setStatus('error_quota');
          setErrorMessage(`测试失败：额度已耗尽或请求频率过高 (HTTP ${status})`);
        } else {
          setStatus('error_other');
          setErrorMessage(`测试失败：接口返回错误 (HTTP ${status})`);
        }
      }
    } catch (err: any) {
      console.error(err);
      // Browser fetch throws TypeError on network error or CORS
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setStatus('error_cors');
        const msg = '这通常是由于浏览器跨域拦截 (CORS) 导致的，请尝试在高级设置中开启「CORS 代理」开关，或使用浏览器跨域插件。';
        setErrorMessage(msg);
        setTimeout(() => alert('⚠️ 测试失败 (Failed to fetch):\n\n' + msg), 50);
      } else {
        setStatus('error_other');
        setErrorMessage(`网络请求异常：${err.message || '未知错误'}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-y-auto bg-slate-950 py-12">
      {/* Background glowing effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3 tracking-tight">
            API-QuickCheck
          </h1>
          <p className="text-slate-400 font-medium">快速验证密钥并一键生成 Agent 配置</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl">
          
          {/* Platform Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-2">测试平台</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={platformId}
                onChange={handlePlatformChange}
              >
                {PLATFORMS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Settings2 className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="mb-6">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Settings2 className="w-4 h-4 mr-1" />
              {showAdvanced ? '收起高级设置' : '高级设置 (自定义 Base URL & 平台提示)'}
            </button>
            
            {showAdvanced && (
              <div className="mt-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-semibold text-slate-400 mb-2">接口地址 (Base URL)</label>
                <input
                  type="text"
                  className="w-full bg-slate-900/50 border border-slate-700 text-slate-300 text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-3"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com"
                />
                
                <div className="flex items-center mb-4 mt-2">
                  <input
                    type="checkbox"
                    id="proxy-toggle"
                    className="w-4 h-4 text-blue-500 bg-slate-900 border-slate-700 rounded focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                    checked={useProxy}
                    onChange={(e) => setUseProxy(e.target.checked)}
                  />
                  <label htmlFor="proxy-toggle" className="ml-2 text-sm font-medium text-slate-300 cursor-pointer select-none">
                    使用 CORS 代理转发请求 (支持绕过严格跨域限制)
                  </label>
                </div>
                {/* @ts-ignore */}
                {currentPlatform.helpText && (
                  <div className="flex items-start bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <Info className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300 leading-relaxed">
                      {/* @ts-ignore */}
                      {currentPlatform.helpText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* API Key Input */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-300 mb-2">API Key</label>
            <input
              type="password"
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500 font-mono"
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
            className="w-full relative group overflow-hidden rounded-xl font-bold text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:opacity-90 transition-opacity" />
            <div className="relative py-4 flex items-center justify-center">
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
            </div>
          </button>

          {/* Results Area */}
          {status !== 'idle' && status !== 'loading' && (
            <div className={`mt-6 p-4 rounded-xl border animate-in zoom-in-95 duration-200 ${
              status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              status === 'error_cors' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
              'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <div className="flex items-start">
                {status === 'success' && <CheckCircle2 className="w-6 h-6 mr-3 flex-shrink-0" />}
                {(status === 'error_key' || status === 'error_quota' || status === 'error_other') && <XCircle className="w-6 h-6 mr-3 flex-shrink-0" />}
                {status === 'error_cors' && <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0" />}
                
                <div className="w-full">
                  <h3 className="font-bold mb-1 flex items-center justify-between">
                    <span>
                      {status === 'success' ? '测试通过！' :
                       status === 'error_cors' ? '跨域拦截 / 网络不通' : '测试失败'}
                    </span>
                    {status === 'success' && delay !== null && (
                      <span className="text-xs font-mono opacity-80 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        {delay}ms
                      </span>
                    )}
                  </h3>
                  <p className="text-sm opacity-90 leading-relaxed mb-1">
                    {status === 'success' ? `你的 Key 可以正常使用。` : errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Model Probe & Agent Guide */}
          {status === 'success' && (
            <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Models Area */}
              {availableModels !== null && (
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                    <Box className="w-4 h-4 mr-2 text-blue-400" />
                    可用模型探测 {availableModels.length > 0 && `(${availableModels.length})`}
                  </h4>
                  {availableModels.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                      {availableModels.map(m => (
                        <span key={m} className="px-2 py-1 text-xs bg-slate-700/50 text-slate-200 rounded-md border border-slate-600/50 hover:bg-slate-600 transition-colors">
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-400/90 flex items-center bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                      无法获取模型列表，请手动尝试在 Agent 中填写模型 ID
                    </p>
                  )}
                </div>
              )}

              {/* Agent Guide */}
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-blue-500/30 shadow-2xl overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 flex justify-between items-center">
                  <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 flex items-center">
                    <Terminal className="w-5 h-5 mr-2 text-blue-400" />
                    Agent 一键接入指南
                  </h3>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-slate-800 overflow-x-auto custom-scrollbar">
                  {['Claude Code', 'OpenClaw', 'Cline / Roo Code'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 min-w-[120px] py-3 text-sm font-medium transition-all ${
                        activeTab === tab 
                          ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' 
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {customBaseUrl !== currentPlatform.defaultBaseUrl && (
                    <div className="mb-5 flex items-start bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 shadow-lg shadow-amber-500/5">
                      <AlertTriangle className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-300 leading-relaxed font-medium">
                        <span className="font-bold">⚠️ 检测到您使用的是非官方 API</span>，请务必在 Agent 设置中开启「自定义 Endpoint」功能（或修改 Base URL），否则将无法使用。
                      </p>
                    </div>
                  )}

                  {activeTab === 'Claude Code' && (
                    <div className="relative group animate-in fade-in duration-300">
                      {currentPlatform.id !== 'claude' ? (
                        <div className="space-y-4">
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2">
                            <h4 className="text-sm font-bold text-amber-400 flex items-center mb-2">
                              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                              注意：格式不兼容提醒
                            </h4>
                            <p className="text-xs text-amber-300/90 leading-relaxed">
                              Claude Code 原生仅支持 Anthropic 格式。直接接入 {currentPlatform.name} 将导致 <code className="bg-amber-900/50 px-1 rounded">ECONNREFUSED</code> 或通信报错。您必须使用协议转换工具（如 LiteLLM）或支持格式转换的中转 API。
                              <br/><br/>
                              <span className="text-amber-200">💡 提示：如果您使用的中转站已经原生支持将 <code>/v1/messages</code> 转换为 OpenAI 格式，则可以直接参考下方的【步骤三】设置 BASE_URL，无需本地代理。</span>
                            </p>
                          </div>

                          {/* Step 1 */}
                          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                            <h5 className="text-sm font-semibold text-blue-400 mb-2 flex items-center"><span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded mr-2 text-xs">1</span> 清理并设置环境</h5>
                            <p className="text-xs text-slate-400 mb-3">清理残留登录态，并设置目标平台的 API Key 环境变量：</p>
                            
                            <div className="flex gap-2 mb-2">
                              <button onClick={() => setShellType('bash')} className={`px-2 py-1 text-[10px] rounded transition-colors ${shellType === 'bash' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Bash / Zsh</button>
                              <button onClick={() => setShellType('ps')} className={`px-2 py-1 text-[10px] rounded transition-colors ${shellType === 'ps' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>PowerShell</button>
                            </div>
                            <div className="relative">
                              <div className="absolute right-2 top-2 z-10">
                                <CopyButton text={shellType === 'bash' 
                                  ? `unset ANTHROPIC_AUTH_TOKEN\nexport ${litellmEnvKey}="${apiKey}"` 
                                  : `$env:ANTHROPIC_AUTH_TOKEN=""\n$env:${litellmEnvKey}="${apiKey}"`} />
                              </div>
                              <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto custom-scrollbar">
                                {shellType === 'bash' ? (
                                  <code>
                                    <span className="text-purple-400">unset</span> ANTHROPIC_AUTH_TOKEN{'\n'}
                                    <span className="text-purple-400">export</span> {litellmEnvKey}=<span className="text-amber-300">"{apiKey}"</span>
                                  </code>
                                ) : (
                                  <code>
                                    <span className="text-purple-400">$env:</span>ANTHROPIC_AUTH_TOKEN=<span className="text-amber-300">""</span>{'\n'}
                                    <span className="text-purple-400">$env:</span>{litellmEnvKey}=<span className="text-amber-300">"{apiKey}"</span>
                                  </code>
                                )}
                              </pre>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                            <h5 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded mr-2 text-xs">2</span> 启动本地协议中转站</h5>
                            <p className="text-xs text-slate-400 mb-3">使用 LiteLLM 开启带有 <code>--drop_params</code> 的翻译代理：</p>
                            
                            <div className="relative">
                              <div className="absolute right-2 top-2 z-10"><CopyButton text={`pip install "litellm[proxy]"\nlitellm --model ${litellmDefaultModel} --api_base ${customBaseUrl.replace(/\/$/, '')} --drop_params`} /></div>
                              <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto custom-scrollbar">
                                <code>
                                  <span className="text-purple-400">pip</span> install <span className="text-amber-300">"litellm[proxy]"</span>{'\n'}
                                  <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">{litellmDefaultModel}</span> --api_base <span className="text-emerald-300">{customBaseUrl.replace(/\/$/, '')}</span> --drop_params
                                </code>
                              </pre>
                            </div>
                            
                            <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded p-3">
                              <p className="text-xs text-blue-300 leading-relaxed space-y-1">
                                <span className="font-bold flex items-center"><Info className="w-3.5 h-3.5 mr-1" />常见排错：</span>
                                <span className="block">1. <span className="text-amber-300">为什么加 --drop_params？</span> Claude 会发送特定的参数 (如 thinking)，DeepSeek 等模型不认识会报错 400，该标志能自动过滤多余参数。</span>
                                <span className="block">2. <span className="text-amber-300">提示 No such option: --api_key？</span> 新版 LiteLLM 已弃用该启动参数，请务必先执行步骤一设置环境变量。</span>
                                <span className="block">3. <span className="text-amber-300">报错 ModuleNotFoundError?</span> 请确保执行的是 <code>pip install "litellm[proxy]"</code>，proxy 插件包含服务器所需的完整依赖。</span>
                              </p>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                            <h5 className="text-sm font-semibold text-purple-400 mb-2 flex items-center"><span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded mr-2 text-xs">3</span> 正确配置 Claude Code</h5>
                            <p className="text-xs text-slate-400 mb-3">保持 LiteLLM 运行，打开新的终端窗口执行：</p>
                            
                            <div className="flex gap-2 mb-2">
                              <button onClick={() => setShellType('bash')} className={`px-2 py-1 text-[10px] rounded transition-colors ${shellType === 'bash' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Bash / Zsh</button>
                              <button onClick={() => setShellType('ps')} className={`px-2 py-1 text-[10px] rounded transition-colors ${shellType === 'ps' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>PowerShell</button>
                            </div>
                            <div className="relative">
                              <div className="absolute right-2 top-2 z-10">
                                <CopyButton text={shellType === 'bash' 
                                  ? `export ANTHROPIC_BASE_URL="http://0.0.0.0:4000"\nexport ANTHROPIC_API_KEY="sk-litellm"\nclaude`
                                  : `$env:ANTHROPIC_BASE_URL="http://0.0.0.0:4000"\n$env:ANTHROPIC_API_KEY="sk-litellm"\nclaude`
                                } />
                              </div>
                              <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto custom-scrollbar">
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
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                              <button 
                                onClick={() => setShellType('bash')}
                                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${shellType === 'bash' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                Bash / Zsh
                              </button>
                              <button 
                                onClick={() => setShellType('ps')}
                                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${shellType === 'ps' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                PowerShell
                              </button>
                            </div>
                            
                            <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                              <button 
                                onClick={() => setConfigPersistence('session')}
                                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${configPersistence === 'session' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                当前会话
                              </button>
                              <button 
                                onClick={() => setConfigPersistence('permanent')}
                                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${configPersistence === 'permanent' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                永久生效
                              </button>
                            </div>
                          </div>

                          <div className="absolute right-3 top-[60px] z-10">
                            <CopyButton text={
                              configPersistence === 'session' 
                                ? (shellType === 'bash' 
                                    ? `export ANTHROPIC_API_KEY="${apiKey}"\nexport ANTHROPIC_BASE_URL="${customBaseUrl}"` 
                                    : `$env:ANTHROPIC_API_KEY = "${apiKey}"\n$env:ANTHROPIC_BASE_URL = "${customBaseUrl}"`)
                                : (shellType === 'bash'
                                    ? `echo 'export ANTHROPIC_API_KEY="${apiKey}"' >> ~/.bashrc\necho 'export ANTHROPIC_BASE_URL="${customBaseUrl}"' >> ~/.bashrc\nsource ~/.bashrc`
                                    : `setx ANTHROPIC_API_KEY "${apiKey}"\nsetx ANTHROPIC_BASE_URL "${customBaseUrl}"`)
                            } />
                          </div>
                          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                            <pre className="text-sm font-mono text-emerald-400 overflow-x-auto pb-2 custom-scrollbar">
                              {configPersistence === 'session' ? (
                                shellType === 'bash' ? (
                                  <code>
                                    <span className="text-purple-400">export</span> ANTHROPIC_API_KEY=<span className="text-amber-300">"{apiKey}"</span>{'\n'}
                                    <span className="text-purple-400">export</span> ANTHROPIC_BASE_URL=<span className="text-amber-300">"{customBaseUrl}"</span>
                                  </code>
                                ) : (
                                  <code>
                                    <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY = <span className="text-amber-300">"{apiKey}"</span>{'\n'}
                                    <span className="text-purple-400">$env:</span>ANTHROPIC_BASE_URL = <span className="text-amber-300">"{customBaseUrl}"</span>
                                  </code>
                                )
                              ) : (
                                shellType === 'bash' ? (
                                  <code>
                                    <span className="text-slate-500"># 写入配置文件并生效</span>{'\n'}
                                    <span className="text-purple-400">echo</span> <span className="text-amber-300">'export ANTHROPIC_API_KEY="{apiKey}"'</span> &gt;&gt; ~/.bashrc{'\n'}
                                    <span className="text-purple-400">echo</span> <span className="text-amber-300">'export ANTHROPIC_BASE_URL="{customBaseUrl}"'</span> &gt;&gt; ~/.bashrc{'\n'}
                                    <span className="text-purple-400">source</span> ~/.bashrc
                                  </code>
                                ) : (
                                  <code>
                                    <span className="text-slate-500"># 设置永久环境变量 (需重启终端生效)</span>{'\n'}
                                    <span className="text-purple-400">setx</span> ANTHROPIC_API_KEY <span className="text-amber-300">"{apiKey}"</span>{'\n'}
                                    <span className="text-purple-400">setx</span> ANTHROPIC_BASE_URL <span className="text-amber-300">"{customBaseUrl}"</span>
                                  </code>
                                )
                              )}
                            </pre>
                          </div>
                          <p className="text-xs text-slate-500 mt-3 flex items-center">
                            <Info className="w-3.5 h-3.5 mr-1.5" />
                            {configPersistence === 'session' ? '运行以上命令，即可为当前会话配置环境。' : '运行以上命令，将配置保存到系统全局变量中。'}
                          </p>

                          {/* Conflict Tip */}
                          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in shake duration-500">
                            <p className="text-xs text-red-400 leading-relaxed">
                              <span className="font-bold">⚠️ 认证冲突提醒：</span> 如果遇到 `Auth conflict` 报错，说明你同时设置了 Token 和 API Key。请运行以下命令清除冲突：
                            </p>
                            <div className="mt-2 relative group/item">
                              <div className="absolute right-2 top-1">
                                 <CopyButton text={shellType === 'bash' ? 'unset ANTHROPIC_AUTH_TOKEN' : 'Remove-Item Env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue'} />
                              </div>
                              <code className="block bg-slate-950 p-2 rounded text-xs text-slate-300 font-mono border border-slate-800">
                                {shellType === 'bash' ? 'unset ANTHROPIC_AUTH_TOKEN' : 'Remove-Item Env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue'}
                              </code>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'OpenClaw' && (
                    <div className="relative group animate-in fade-in duration-300">
                      <div className="absolute right-3 top-3 z-10">
                        <CopyButton text={`{\n  "api_key": "${apiKey}",\n  "base_url": "${customBaseUrl}"\n}`} />
                      </div>
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                        <pre className="text-sm font-mono text-slate-300 overflow-x-auto pb-2 custom-scrollbar">
                          <code>
                            {'{'}{'\n'}
                            {'  '}<span className="text-blue-400">"api_key"</span>: <span className="text-amber-300">"{apiKey}"</span>,{'\n'}
                            {'  '}<span className="text-blue-400">"base_url"</span>: <span className="text-amber-300">"{customBaseUrl}"</span>{'\n'}
                            {'}'}
                          </code>
                        </pre>
                      </div>
                      <p className="text-xs text-slate-500 mt-3 flex items-center">
                        <Info className="w-3.5 h-3.5 mr-1.5" />
                        将以上配置片段合并到您的 config.json 对应模型提供商配置中。
                      </p>
                    </div>
                  )}

                  {activeTab === 'Cline / Roo Code' && (
                    <div className="animate-in fade-in duration-300">
                      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50" />
                        <table className="w-full text-sm text-left">
                          <tbody className="divide-y divide-slate-800/50">
                            <tr className="hover:bg-slate-900/50 transition-colors group">
                              <td className="py-3.5 px-5 text-slate-400 font-medium w-32 border-r border-slate-800/30">Provider</td>
                              <td className="py-3.5 px-5 text-slate-200 font-semibold flex items-center justify-between">
                                <span>
                                  {currentPlatform.id === 'anthropic' || currentPlatform.id === 'claude' ? 'Anthropic' : 
                                   currentPlatform.id === 'gemini' ? 'Google Gemini' : 'OpenAI Compatible'}
                                </span>
                                <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CopyButton text={currentPlatform.id === 'anthropic' || currentPlatform.id === 'claude' ? 'Anthropic' : currentPlatform.id === 'gemini' ? 'Google Gemini' : 'OpenAI Compatible'} />
                                </div>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-900/50 transition-colors group">
                              <td className="py-3.5 px-5 text-slate-400 font-medium border-r border-slate-800/30">Base URL</td>
                              <td className="py-3.5 px-5 text-amber-300 font-mono text-xs flex justify-between items-center">
                                <span className="truncate max-w-[200px] sm:max-w-xs">{customBaseUrl}</span>
                                <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CopyButton text={customBaseUrl} />
                                </div>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-900/50 transition-colors group">
                              <td className="py-3.5 px-5 text-slate-400 font-medium border-r border-slate-800/30">API Key</td>
                              <td className="py-3.5 px-5 text-emerald-400 font-mono text-xs flex justify-between items-center">
                                <span>{apiKey.substring(0, 8)}...</span>
                                <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CopyButton text={apiKey} />
                                </div>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-900/50 transition-colors group">
                              <td className="py-3.5 px-5 text-slate-400 font-medium border-r border-slate-800/30">建议模型</td>
                              <td className="py-3.5 px-5 text-blue-300 font-mono text-xs flex justify-between items-center">
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
                      <p className="text-xs text-slate-500 mt-3 flex items-center">
                        <Info className="w-3.5 h-3.5 mr-1.5" />
                        在 VSCode 扩展设置中，依次填入上述表格内容。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Notes */}
        <div className="mt-8 flex items-center justify-center text-xs text-slate-500 space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
          <span>不保存你的 Key，纯本地浏览器发起请求，请放心使用。</span>
        </div>
      </div>
    </div>
  );
}
