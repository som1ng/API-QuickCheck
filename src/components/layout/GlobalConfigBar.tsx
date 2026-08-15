import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchRemoteModels } from '../../engine/scanner/batchScanner';
import { sniffRelayProfile } from '../../engine/billing/quotaSniffer';
import { Eye, EyeOff, RefreshCw, KeyRound, Globe, Wallet, CheckCircle2, Zap, Layers } from 'lucide-react';

const COMMON_URL_PRESETS = [
  { label: 'OpenAI 官方', url: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  { label: 'Claude 官方', url: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-7-sonnet-20250219' },
  { label: 'DeepSeek 官方', url: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
  { label: 'Gemini 官方', url: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.5-flash' },
  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o' },
  { label: '硅基流动', url: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3' },
];

export const GlobalConfigBar: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels, relayProfile } = state;

  const [showKey, setShowKey] = useState(false);
  const [isSniffingBalance, setIsSniffingBalance] = useState(false);
  const [sniffFeedback, setSniffFeedback] = useState<string | null>(null);

  // Auto-fetch models when user stops typing URL and Key
  useEffect(() => {
    if (!config.baseUrl || !config.apiKey || config.apiKey.length < 8) return;
    const timer = setTimeout(async () => {
      try {
        const models = await fetchRemoteModels(config.baseUrl, config.apiKey);
        if (models.length > 0) {
          dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
          if (!models.some((m) => m.id === config.selectedModel)) {
            dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0].id });
          }
        }
      } catch {
        /* silent auto-sniff */
      }
    }, 1000);
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
      if (models.length > 0 && !models.some((m) => m.id === config.selectedModel)) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0].id });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      dispatch({ type: 'SET_LOADING_MODELS', payload: false });
    }
  };

  const handleSniffBalance = async () => {
    if (!config.baseUrl || !config.apiKey) {
      alert('请先输入接口地址 (Base URL) 和 API Key');
      return;
    }
    setIsSniffingBalance(true);
    setSniffFeedback(null);
    try {
      const profile = await sniffRelayProfile(config.baseUrl, config.apiKey);
      dispatch({ type: 'SET_RELAY_PROFILE', payload: profile });
      setSniffFeedback(
        profile.detectedBalance
          ? `检测到余额: ${profile.detectedBalance.rawText}`
          : '未检测到公开余额接口（正常现象）'
      );
    } catch {
      setSniffFeedback('探测超时或接口未开放计费路由');
    } finally {
      setIsSniffingBalance(false);
    }
  };

  const handleApplyPreset = (preset: typeof COMMON_URL_PRESETS[0]) => {
    dispatch({ type: 'SET_BASE_URL', payload: preset.url });
    if (preset.defaultModel) {
      dispatch({ type: 'SET_SELECTED_MODEL', payload: preset.defaultModel });
    }
  };

  const isOfficial = /openai\.com|anthropic\.com|deepseek\.com|googleapis\.com/i.test(config.baseUrl);

  return (
    <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-7 shadow-lg space-y-6">
      {/* ── Main Inputs Grid: Base URL + API Key ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Base URL */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
              <Globe className="w-[18px] h-[18px] text-[#cc785c]" />
              <span>接口地址 (Base URL)</span>
            </label>

            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
              isOfficial
                ? 'bg-[#5db872]/15 text-[#5db872] border border-[#5db872]/30'
                : config.baseUrl
                ? 'bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30'
                : 'text-[#9c9689]'
            }`}>
              {isOfficial ? '官方直连' : config.baseUrl ? '中转站 / 代理' : '等待输入'}
            </span>
          </div>

          <input
            type="text"
            placeholder="https://api.openai.com/v1 或 https://api.your-relay.com"
            value={config.baseUrl}
            onChange={(e) => dispatch({ type: 'SET_BASE_URL', payload: e.target.value })}
            className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition"
          />

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-[#9c9689] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>快速填入:</span>
            </span>
            {COMMON_URL_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`px-2.5 py-1 rounded-md text-xs transition border ${
                  config.baseUrl === p.url
                    ? 'bg-[#cc785c]/20 border-[#cc785c] text-[#faf9f5] font-medium'
                    : 'bg-[#23211e] border-[#2e2b27] text-[#d4cebe] hover:border-[#cc785c]/40 hover:text-[#faf9f5]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. API Key */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
              <KeyRound className="w-[18px] h-[18px] text-[#cc785c]" />
              <span>API Key (令牌密钥)</span>
            </label>

            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-[#9c9689] hover:text-[#faf9f5] transition flex items-center gap-1.5"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showKey ? '隐藏' : '显示'}</span>
            </button>
          </div>

          <input
            type={showKey ? 'text' : 'password'}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={config.apiKey}
            onChange={(e) => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
            className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition"
          />

          <div className="flex items-center justify-between pt-1 text-xs text-[#9c9689]">
            <span>零上传设计 · 密钥保存在浏览器本地，绝不经过第三方服务器</span>
            {config.apiKey.length > 5 && (
              <span className="text-[#5db872] font-mono font-medium">已就绪 ({config.apiKey.length} 位)</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Always-available Model Input ── */}
      <div className="space-y-2.5 border-t border-[#2e2b27] pt-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
            <Layers className="w-[18px] h-[18px] text-[#cc785c]" />
            <span>测试目标模型</span>
          </label>
          <span className="text-xs text-[#9c9689]">支持手动输入自定义模型 ID</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={config.selectedModel}
            onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
            placeholder="例如: gpt-4o / claude-3-7-sonnet"
            className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition"
          />
          <select
            value={availableModels.some((model) => model.id === config.selectedModel) ? config.selectedModel : ''}
            onChange={(e) => e.target.value && dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
            className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-4 py-3 font-mono text-sm text-[#faf9f5] focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition disabled:cursor-not-allowed disabled:opacity-60"
            disabled={availableModels.length === 0}
          >
            <option value="">{availableModels.length > 0 ? '从已探测模型中选择' : '暂无已探测模型'}</option>
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>{model.name || model.id}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Discovered Models Banner ── */}
      {availableModels.length > 0 && (
        <div className="rounded-lg border border-[#5db872]/30 bg-[#5db872]/[0.08] p-4 text-sm text-[#d4cebe] space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-2 font-medium text-[#5db872]">
            <CheckCircle2 className="w-[18px] h-[18px]" />
            <span>已成功识别 {availableModels.length} 个可用模型 (在下方各功能模块中直接选择)</span>
          </div>
          <div className="text-xs text-[#faf9f5]/80 font-mono truncate">
            {availableModels.slice(0, 10).map((m) => m.id).join(', ')}
            {availableModels.length > 10 ? ` 等共 ${availableModels.length} 个` : ''}
          </div>
        </div>
      )}

      {/* ── Bottom Info Bar: Status, Balance & Manual Discovery ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#2e2b27] text-sm">
        <div className="flex items-center gap-3">
          {relayProfile?.detectedBalance ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#5db872]/10 border border-[#5db872]/20 text-[#5db872] font-mono text-sm">
              <Wallet className="w-[18px] h-[18px]" />
              <span>账户余额: {relayProfile.detectedBalance.rawText}</span>
            </div>
          ) : (
            <div className="text-[#9c9689] flex items-center gap-2">
              <span>端点状态:</span>
              <span className="text-[#d4cebe] font-mono">
                {config.baseUrl ? config.baseUrl : '等待输入 Base URL'}
              </span>
            </div>
          )}
          {sniffFeedback && <span className="text-[#9c9689] text-xs italic">{sniffFeedback}</span>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSniffBalance}
            disabled={isSniffingBalance || !config.baseUrl || !config.apiKey}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5] hover:border-[#cc785c]/40 transition disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isSniffingBalance ? 'animate-spin' : ''}`} />
            <span>{isSniffingBalance ? '探测中...' : '探测余额额度'}</span>
          </button>

          <button
            onClick={handleFetchModels}
            disabled={isLoadingModels || !config.baseUrl || !config.apiKey}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm text-[#cc785c] hover:bg-[#2b2926] hover:text-[#d98266] hover:border-[#cc785c]/60 transition disabled:opacity-40 font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
            <span>{availableModels.length > 0 ? `已探测 (${availableModels.length})` : '拉取可用模型'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
