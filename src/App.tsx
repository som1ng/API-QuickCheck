import React, { useState } from 'react';
import { Settings2, Play, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, Loader2, Info } from 'lucide-react';

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

export default function App() {
  const [platformId, setPlatformId] = useState(PLATFORMS[0].id);
  const [apiKey, setApiKey] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState(PLATFORMS[0].defaultBaseUrl);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [status, setStatus] = useState<TestStatus>('idle');
  const [delay, setDelay] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const currentPlatform = PLATFORMS.find(p => p.id === platformId) || PLATFORMS[0];

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setPlatformId(newId);
    const newPlatform = PLATFORMS.find(p => p.id === newId)!;
    setCustomBaseUrl(newPlatform.defaultBaseUrl);
    setStatus('idle');
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

    const startTime = Date.now();
    const url = `${customBaseUrl.replace(/\/$/, '')}${currentPlatform.testEndpoint}`;

    try {
      const response = await fetch(url, {
        method: currentPlatform.method,
        headers: currentPlatform.headers(apiKey.trim()),
      });

      const endTime = Date.now();
      setDelay(endTime - startTime);

      if (response.ok) {
        setStatus('success');
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
        setErrorMessage('接口不支持在浏览器直接测试（跨域 CORS 拦截），或者网络不通。请尝试更换 Base URL 或使用中转服务。');
      } else {
        setStatus('error_other');
        setErrorMessage(`网络请求异常：${err.message || '未知错误'}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3 tracking-tight">
            API Key 连通性测试
          </h1>
          <p className="text-slate-400 font-medium">快速验证你的大模型密钥是否有效</p>
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
                
                <div>
                  <h3 className="font-bold mb-1">
                    {status === 'success' ? '测试通过！' :
                     status === 'error_cors' ? '跨域拦截 / 网络不通' : '测试失败'}
                  </h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {status === 'success' ? `你的 Key 可以正常使用。` : errorMessage}
                  </p>
                  {status === 'success' && delay !== null && (
                    <p className="text-xs mt-2 opacity-70 font-mono">
                      响应延迟: {delay}ms
                    </p>
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
