import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchRemoteModels } from '../../engine/scanner/batchScanner';
import { Eye, EyeOff, RefreshCw, Globe, KeyRound, Layers } from 'lucide-react';

const COMMON_PRESETS = [
  { label: 'OpenAI 官方', url: 'https://api.openai.com/v1', model: 'auto' },
  { label: 'Claude 官方', url: 'https://api.anthropic.com/v1', model: 'auto' },
  { label: 'DeepSeek 官方', url: 'https://api.deepseek.com', model: 'auto' },
  { label: 'xAI (Grok)', url: 'https://api.x.ai/v1', model: 'auto' },
  { label: 'Gemini 官方', url: 'https://generativelanguage.googleapis.com/v1beta', model: 'auto' },
  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1', model: 'auto' },
  { label: '硅基流动', url: 'https://api.siliconflow.cn/v1', model: 'auto' },
];

export const GlobalConfigBar: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels } = state;

  const [showKey, setShowKey] = useState(false);

  // Auto-fetch models when user stops typing URL and Key
  useEffect(() => {
    if (!config.baseUrl || !config.apiKey || config.apiKey.length < 8) return;
    const timer = setTimeout(async () => {
      try {
        const models = await fetchRemoteModels(config.baseUrl, config.apiKey);
        if (models.length > 0) {
          dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
          if (!config.selectedModel) {
            dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0].id });
          }
        }
      } catch {
        /* silent auto-sniff */
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [config.baseUrl, config.apiKey, dispatch]);

  const handleFetchModels = async () => {
    if (!config.baseUrl || !config.apiKey) {
      alert('请先输入接口地址 (Base URL) 和 API Key');
      return;
    }
    dispatch({ type: 'SET_LOADING_MODELS', payload: true });
    try {
      const models = await fetchRemoteModels(config.baseUrl, config.apiKey);
      dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
      if (models.length > 0 && !config.selectedModel) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0].id });
      }
    } catch (err: unknown) {
      dispatch({ type: 'SET_MODEL_ERROR', payload: err instanceof Error ? err.message : String(err) });
    } finally {
      dispatch({ type: 'SET_LOADING_MODELS', payload: false });
    }
  };

  const handleApplyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    dispatch({ type: 'SET_BASE_URL', payload: preset.url });
    if (preset.model) {
      dispatch({ type: 'SET_SELECTED_MODEL', payload: preset.model });
    }
  };

  const isOfficial = /openai\.com|anthropic\.com|deepseek\.com|googleapis\.com|x\.ai/i.test(config.baseUrl);

  return (
    <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-6 sm:p-8 space-y-6 shadow-md">
      {/* ── Inputs 3-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Endpoint URL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#cc785c]" />
              <span>接口地址 (Base URL)</span>
            </label>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                isOfficial
                  ? 'bg-[#5db872]/15 text-[#5db872] border border-[#5db872]/30'
                  : config.baseUrl
                  ? 'bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30'
                  : 'text-[#9c9689]'
              }`}
            >
              {isOfficial ? '官方直连' : config.baseUrl ? '中转站 / 代理' : '待配置'}
            </span>
          </div>

          <input
            type="text"
            placeholder="https://api.openai.com/v1"
            value={config.baseUrl}
            onChange={(e) => dispatch({ type: 'SET_BASE_URL', payload: e.target.value })}
            className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/40 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/30 transition"
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-[#9c9689]">预设:</span>
            {COMMON_PRESETS.slice(0, 5).map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`px-2 py-0.5 rounded text-xs transition border ${
                  config.baseUrl === p.url
                    ? 'bg-[#cc785c]/20 border-[#cc785c] text-[#faf9f5] font-medium'
                    : 'bg-[#23211e] border-[#2e2b27] text-[#9c9689] hover:text-[#faf9f5] hover:border-[#cc785c]/40'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#cc785c]" />
              <span>API Key (令牌密钥)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-[#9c9689] hover:text-[#faf9f5] transition flex items-center gap-1"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showKey ? '隐藏' : '显示'}</span>
            </button>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              value={config.apiKey}
              onChange={(e) => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
              className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 pr-10 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/40 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/30 transition"
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-[#9c9689]">
            <span>零数据上云 · 密钥内存直连</span>
            {config.apiKey.length > 5 && (
              <span className="text-[#5db872] font-mono font-medium">已就绪 ({config.apiKey.length} 位)</span>
            )}
          </div>
        </div>

        {/* 3. Target Model */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#cc785c]" />
              <span>测试目标模型</span>
            </label>
            <span className="text-xs text-[#9c9689]">支持自定义输入或探测</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={config.selectedModel}
              onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
              placeholder="auto (自适应) / 填入目标模型 ID"
              className="flex-1 rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/40 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/30 transition"
            />
            <button
              type="button"
              onClick={handleFetchModels}
              disabled={isLoadingModels || !config.baseUrl || !config.apiKey}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[#2e2b27] bg-[#23211e] px-3.5 py-3 text-xs font-semibold text-[#cc785c] hover:bg-[#2b2926] hover:border-[#cc785c]/60 transition disabled:opacity-40"
              title="拉取或探测可用模型列表"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
              <span>{isLoadingModels ? '拉取中' : '拉取模型'}</span>
            </button>
          </div>

          {availableModels.length > 0 ? (
            <select
              value={availableModels.some((m) => m.id === config.selectedModel) ? config.selectedModel : ''}
              onChange={(e) => e.target.value && dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
              className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-3 py-2 font-mono text-xs text-[#faf9f5] focus:border-[#cc785c] focus:outline-none transition"
            >
              <option value="">已识别 {availableModels.length} 个模型 (点击选择)</option>
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name || model.id}
                </option>
              ))}
            </select>
          ) : (
            <div className="pt-1 text-xs text-[#9c9689]">
              <span>输入 URL & Key 后将自动探测或点击右上角拉取</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
