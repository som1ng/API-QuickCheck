import React, { useEffect, useRef, useState } from 'react';
import {
  Settings2,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Loader2,
  Info,
  Box,
  Database,
  ChevronDown,
  ChevronUp,
  Globe,
  Search,
  RefreshCw,
  Check,
} from 'lucide-react';
import IntegrationGuide from './IntegrationGuide';
import DocsView from './DocsView';
import { PLATFORMS, getPlatformOptions } from './config/platforms';

type PlatformId = string;
type TestStatus = 'idle' | 'loading' | 'success' | 'error_quota' | 'error_key' | 'error_cors' | 'error_other';
type ModelOption = { id: string; name: string };
type ToastState = { id: number; message: string } | null;
type TestRequest = {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

const DOC_URLS: Record<string, string> = {
  openrouter: 'https://openrouter.ai/models',
  deepseek: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing',
  openai: 'https://platform.openai.com/docs/models',
  siliconflow: 'https://docs.siliconflow.cn/models/list',
  groq: 'https://console.groq.com/docs/models',
};

const PLATFORM_HELP_TEXT: Partial<Record<string, string>> = {
  openai: '如果是第三方中转 API，请在下方高级设置中修改 Base URL 为中转地址。',
  anthropic: '官方接口严禁浏览器直接测试（CORS 拦截），通常直接报错。建议仅用来测试第三方中转的 Claude 接口。',
  gemini: '国内直连通常会失败，请确保全局代理或在此处使用国内可访问的代理 Base URL。',
  groq: '提供极速的 LPU 推理服务，当前支持众多免费开源模型。',
  openrouter: '知名海外模型聚合平台，提供大量免费开源模型额度。',
  siliconflow: '注册即可获取海量免费开源模型额度。',
};

const PLATFORM_PLACEHOLDERS: Partial<Record<string, string>> = {
  anthropic: 'sk-ant-...',
  gemini: 'AIzaSy...',
  groq: 'gsk_...',
  openrouter: 'sk-or-v1-...',
};

const DEFAULT_PLATFORM_ID = getPlatformOptions()[0]?.value ?? 'openai';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const getPayloadMessage = (payload: unknown) => {
  if (!isRecord(payload)) return null;

  const error = payload.error;
  if (isRecord(error) && typeof error.message === 'string') {
    return error.message;
  }

  return typeof payload.message === 'string' ? payload.message : null;
};

const getPlatformPlaceholder = (platformId: string) => PLATFORM_PLACEHOLDERS[platformId] ?? 'sk-...';

const getModelSearchText = (model: ModelOption) => `${model.id} ${model.name}`.toLowerCase();

const matchesModel = (model: ModelOption, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return normalizedQuery
    .split(/\s+/)
    .every((part) => getModelSearchText(model).includes(part));
};

const buildTestRequest = (platformId: string, apiKey: string, baseUrl: string, modelId: string): TestRequest => {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  if (platformId === 'anthropic') {
    return {
      url: `${normalizedBaseUrl}/messages`,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: {
        model: modelId,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      },
    };
  }

  if (platformId === 'gemini') {
    return {
      url: `${normalizedBaseUrl}/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        contents: [{ parts: [{ text: 'hi' }] }],
        generationConfig: { maxOutputTokens: 1 },
      },
    };
  }

  const completionsPath = platformId === 'deepseek' ? '/v1/chat/completions' : '/chat/completions';
  return {
    url: `${normalizedBaseUrl}${completionsPath}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: modelId,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1,
    },
  };
};

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  return (
    <div className="fixed top-24 right-4 z-[70] max-w-sm rounded-xl border border-red-400/30 bg-red-500/15 backdrop-blur-xl shadow-2xl px-4 py-3 text-sm text-red-100">
      {toast.message}
    </div>
  );
}

function ModelSelector({
  value,
  onChange,
  models,
  isRefreshing,
  onRefresh,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  models: ModelOption[];
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const filteredModels = models.filter((model) => matchesModel(model, value));

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="下拉选择预设模型，或手动输入 Model ID"
          className="w-full bg-black/30 border border-white/10 rounded-lg py-3.5 pl-10 pr-12 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono text-sm shadow-inner placeholder-slate-600"
        />
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="一键同步全量模型"
        >
          {isRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-slate-900/90 backdrop-blur border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => {
                const isSelected = value.trim() === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-500/15 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm break-all">{model.id}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{model.name}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 mt-0.5 text-blue-300 flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-sm text-slate-500">
                没有匹配项，继续输入可直接使用自定义 Model ID。
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>(DEFAULT_PLATFORM_ID);
  const [apiKey, setApiKey] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState(PLATFORMS[DEFAULT_PLATFORM_ID].defaultBaseUrl);
  const [isCustomBaseUrlDirty, setIsCustomBaseUrlDirty] = useState(false);
  const [modelId, setModelId] = useState('');
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(PLATFORMS[DEFAULT_PLATFORM_ID].presetModels);
  const [isSyncingModels, setIsSyncingModels] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [useProxy, setUseProxy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [status, setStatus] = useState<TestStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [delay, setDelay] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'test' | 'docs'>('test');

  const currentPlatform = PLATFORMS[selectedPlatform];
  const defaultModelId = currentPlatform.presetModels[0]?.id || '';
  const currentModelId = modelId.trim() || defaultModelId;

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPlatform = e.target.value;
    setSelectedPlatform(nextPlatform);

    if (!isCustomBaseUrlDirty) {
      setCustomBaseUrl(PLATFORMS[nextPlatform].defaultBaseUrl);
    }

    setAvailableModels(PLATFORMS[nextPlatform].presetModels);
    setModelId('');
    setStatus('idle');
    setErrorMessage('');
    setDelay(null);
  };

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextBaseUrl = e.target.value;
    setCustomBaseUrl(nextBaseUrl);
    setIsCustomBaseUrlDirty(nextBaseUrl !== currentPlatform.defaultBaseUrl);
  };

  const handleSyncModels = async () => {
    if (!apiKey.trim()) {
      setToast({ id: Date.now(), message: '请先输入 API Key，再同步全量模型。' });
      return;
    }

    if (!customBaseUrl.trim()) {
      setToast({ id: Date.now(), message: '请先确认 Base URL，再同步全量模型。' });
      return;
    }

    const platform = PLATFORMS[selectedPlatform];
    let targetUrl = customBaseUrl.replace(/\/+$/, '') + platform.modelsEndpoint;
    const headers: Record<string, string> = {};

    if (platform.authType === 'Query') {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl += `${separator}${platform.authHeaderKey}=${encodeURIComponent(apiKey.trim())}`;
    } else if (platform.authType === 'Bearer') {
      headers.Authorization = `Bearer ${apiKey.trim()}`;
    } else if (platform.authType === 'Header' && platform.authHeaderKey) {
      headers[platform.authHeaderKey] = apiKey.trim();
    }

    if (platform.extraHeaders) {
      Object.assign(headers, platform.extraHeaders);
    }

    setIsSyncingModels(true);

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, headers }),
      });

      const rawText = await response.text();
      let responseData: unknown = null;

      try {
        responseData = rawText ? JSON.parse(rawText) : null;
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        throw new Error(getPayloadMessage(responseData) || rawText || `同步失败 (HTTP ${response.status})`);
      }

      const extractedModels = platform.modelExtractor(responseData);
      if (extractedModels.length === 0) {
        throw new Error('模型接口返回为空，或返回格式与平台配置不匹配。');
      }

      setAvailableModels(extractedModels);
    } catch (err: unknown) {
      const syncError = err instanceof Error ? err : new Error('同步全量模型失败');
      setToast({ id: Date.now(), message: syncError.message });
    } finally {
      setIsSyncingModels(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setStatus('error_key');
      setErrorMessage('请输入 API Key。');
      return;
    }

    if (!customBaseUrl.trim()) {
      setStatus('error_other');
      setErrorMessage('请输入 Base URL。');
      return;
    }

    setStatus('idle');
    setIsLoading(true);
    setDelay(null);
    setErrorMessage('');

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    const startTime = Date.now();

    try {
      const request = buildTestRequest(selectedPlatform, apiKey.trim(), customBaseUrl, currentModelId);
      const requestUrl = useProxy
        ? `https://corsproxy.io/?${encodeURIComponent(request.url)}`
        : request.url;

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);
      setDelay(Date.now() - startTime);

      const responseStatus = response.status;
      let data: unknown = null;
      let rawText = '';

      try {
        rawText = await response.text();
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          data = rawText ? { message: rawText } : null;
        }
      } catch {
        data = null;
      }

      const lowerText = JSON.stringify(data || {}).toLowerCase();
      const dataRecord = isRecord(data) ? data : {};
      const errorRecord = isRecord(dataRecord.error) ? dataRecord.error : {};

      const isQuotaError = responseStatus === 402 ||
        responseStatus === 429 ||
        lowerText.includes('quota') ||
        lowerText.includes('insufficient') ||
        lowerText.includes('balance') ||
        errorRecord.code === 'insufficient_quota' ||
        errorRecord.type === 'insufficient_balance';

      if (response.ok && !isQuotaError) {
        setStatus('success');
        return;
      }

      if (isQuotaError) {
        setStatus('error_quota');
        setErrorMessage(`测试失败：余额不足或额度已耗尽，请前往官网充值 (HTTP ${responseStatus})`);
        return;
      }

      if (responseStatus === 401 || responseStatus === 403) {
        setStatus('error_key');
        setErrorMessage(`测试失败：API Key 无效或权限不足 (HTTP ${responseStatus})`);
        return;
      }

      setStatus('error_other');
      setErrorMessage(`测试失败 (HTTP ${responseStatus}): ${getPayloadMessage(data) || rawText || '未返回具体错误内容'}`);
    } catch (err: unknown) {
      const requestError = err instanceof Error ? err : new Error('未知错误');
      window.clearTimeout(timeoutId);

      if (requestError.name === 'AbortError') {
        setStatus('error_other');
        setErrorMessage('测试失败：请求超时（超过 15 秒），请检查网络或更换 CORS 代理。');
      } else if (requestError.name === 'TypeError' && requestError.message === 'Failed to fetch') {
        setStatus('error_cors');
        setErrorMessage('这通常是浏览器跨域拦截（CORS）导致的，请尝试开启「CORS 代理」或使用浏览器跨域插件。');
      } else {
        setStatus('error_other');
        setErrorMessage(`网络请求异常：${requestError.message || '未知错误'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1c] to-black text-slate-200 relative overflow-y-auto font-sans">
      <Toast toast={toast} />

      <nav className="fixed top-0 w-full z-50 bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center group cursor-pointer z-10">
            <div className="inline-flex items-center justify-center p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              API-QuickCheck
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 h-full">
            <button
              onClick={() => setActiveTab('test')}
              className={`relative h-full px-2 text-sm transition-colors ${
                activeTab === 'test' ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              API 连通性测试
              {activeTab === 'test' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`relative h-full px-2 text-sm transition-colors ${
                activeTab === 'docs' ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Agent 接入指南
              {activeTab === 'docs' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-t-full" />}
            </button>
          </div>

          <div className="flex items-center gap-4 z-10">
            <div className="hidden lg:flex relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-500 group-focus-within:text-slate-300" />
              </div>
              <input
                type="text"
                placeholder="搜索文档..."
                className="w-48 bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg pl-9 pr-14 py-1.5 focus:outline-none focus:border-slate-500 focus:bg-white/10 transition-all placeholder-slate-500"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-semibold text-slate-500 bg-black/30 border border-white/5 rounded">⌘K</kbd>
              </div>
            </div>

            <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-medium">
              <Globe className="w-4 h-4" />
              EN | 中文
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center border-t border-white/5 bg-[#0B0F19]/90 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-3 text-sm transition-colors relative ${activeTab === 'test' ? 'text-white font-medium' : 'text-slate-400'}`}
          >
            API 连通性测试
            {activeTab === 'test' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-3 text-sm transition-colors relative ${activeTab === 'docs' ? 'text-white font-medium' : 'text-slate-400'}`}
          >
            Agent 接入指南
            {activeTab === 'docs' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-t-full" />}
          </button>
        </div>
      </nav>

      {activeTab === 'docs' ? (
        <main className="flex-grow pt-[64px] md:pt-[64px] w-full flex flex-col h-[calc(100vh-64px)] overflow-hidden">
          <DocsView />
        </main>
      ) : (
        <main className="flex-grow pt-32 md:pt-24 pb-16 w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              LLM API <span className="text-blue-400">快速验证工具</span>
            </h1>
            <p className="text-slate-400 font-medium text-base max-w-xl mx-auto">
              一键探测模型可用性与额度状态，适配主流 Agent 接入配置。
            </p>
          </div>

          <>
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 md:p-10 hover:border-white/20 transition-all duration-300">
              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-300 ml-1 mb-2">测试平台</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-black/40 border border-white/10 text-white rounded-xl py-3.5 px-4 pr-10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner cursor-pointer"
                        value={selectedPlatform}
                        onChange={handlePlatformChange}
                      >
                        {getPlatformOptions().map((option) => (
                          <option key={option.value} value={option.value} className="bg-[#1a1f2e] text-white py-2">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-300 ml-1 mb-2">API Key</label>
                    <div className="relative">
                      <input
                        type="password"
                        className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600 font-mono shadow-inner"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={getPlatformPlaceholder(selectedPlatform)}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <label className="block text-sm font-bold text-slate-300">测试模型 (Model)</label>
                    {DOC_URLS[selectedPlatform] && (
                      <a
                        href={DOC_URLS[selectedPlatform]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-400/80 hover:text-blue-300 transition-colors flex items-center group/link"
                      >
                        <span className="group-hover/link:underline">查找可用模型</span>
                      </a>
                    )}
                  </div>

                  <ModelSelector
                    value={modelId}
                    onChange={setModelId}
                    models={availableModels}
                    isRefreshing={isSyncingModels}
                    onRefresh={handleSyncModels}
                  />

                  <p className="text-xs text-slate-500 ml-1">
                    默认展示当前平台的高频预设。点击右侧刷新按钮可严格按平台配置同步全量模型，手填始终有效。
                  </p>
                </div>
              </div>

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
                          onChange={handleBaseUrlChange}
                          placeholder={currentPlatform.defaultBaseUrl}
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

                    {PLATFORM_HELP_TEXT[selectedPlatform] && (
                      <div className="flex items-start bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                        <Info className="w-4 h-4 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-200/70 leading-relaxed">
                          {PLATFORM_HELP_TEXT[selectedPlatform]}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                        {status === 'success' ? '验证通过' : status === 'error_cors' ? '跨域拦截 / 连接受阻' : '验证失败'}
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
                      {status === 'success' ? '该 API Key 目前状态健康，可立即投入使用。' : errorMessage}
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

            {status === 'success' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <IntegrationGuide
                  apiKey={apiKey}
                  baseUrl={customBaseUrl}
                  platformId={selectedPlatform}
                  modelId={currentModelId}
                />
              </div>
            )}
          </>
        </main>
      )}

      {activeTab !== 'docs' && (
        <footer className="w-full py-10 text-center border-t border-white/5 mt-auto bg-black/40 backdrop-blur-3xl">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-slate-500 text-xs font-bold flex items-center justify-center space-x-3 tracking-wide">
              <ShieldCheck className="w-5 h-5 text-emerald-500/40" />
              <span>纯前端沙盒环境 · 隐私安全保障 · 拒绝 Key 泄露</span>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
