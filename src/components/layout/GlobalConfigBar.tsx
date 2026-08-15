import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PLATFORMS } from '../../config/platforms';
import { fetchRemoteModels } from '../../engine/scanner/batchScanner';
import { sniffRelayProfile } from '../../engine/billing/quotaSniffer';
import { Eye, EyeOff, RefreshCw, KeyRound, Globe, Layers, Wallet, ChevronDown, CheckCircle2 } from 'lucide-react';

export const GlobalConfigBar: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels, relayProfile } = state;

  const [showKey, setShowKey] = useState(false);
  const [isSniffingBalance, setIsSniffingBalance] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
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
        // silent fail during auto-typing
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [config.baseUrl, config.apiKey, dispatch]);

  const handleFetchModels = async () => {
    if (!config.baseUrl || !config.apiKey) {
      alert('请先输入中转站 Base URL 和 API Key');
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
      alert('请先输入中转站 Base URL 和 API Key');
      return;
    }
    setIsSniffingBalance(true);
    setSniffFeedback(null);
    try {
      const profile = await sniffRelayProfile(config.baseUrl, config.apiKey);
      dispatch({ type: 'SET_RELAY_PROFILE', payload: profile });
      if (profile.detectedBalance) {
        setSniffFeedback(`检测到余额: ${profile.detectedBalance.rawText}`);
      } else {
        setSniffFeedback('未检测到公开余额接口（正常现象，部分中转站已隐藏计费路由）');
      }
    } catch {
      setSniffFeedback('探测超时或中转站未开放计费路由');
    } finally {
      setIsSniffingBalance(false);
    }
  };

  const handleSelectPreset = (platformKey: string) => {
    const platform = PLATFORMS[platformKey];
    if (!platform) return;
    dispatch({ type: 'SET_PLATFORM', payload: platformKey });
    dispatch({ type: 'SET_BASE_URL', payload: platform.defaultBaseUrl });
    setShowPresetsDropdown(false);
  };

  return (
    <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 shadow-lg space-y-4">
      {/* Top Main Config Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* 1. Base URL Input (5 cols) */}
        <div className="md:col-span-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[#faf9f5] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>中转站接口地址 (Base URL)</span>
            </label>

            {/* Presets Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                className="text-[11px] text-[#9c9689] hover:text-[#faf9f5] transition flex items-center gap-1"
              >
                <span>官方/常用预设</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showPresetsDropdown && (
                <div className="absolute right-0 mt-1 w-56 rounded-xl border border-[#2e2b27] bg-[#23211e] p-1.5 shadow-2xl z-50 max-h-64 overflow-y-auto">
                  <div className="text-[10px] uppercase tracking-wider text-[#9c9689] font-semibold px-2 py-1">
                    选择预设地址
                  </div>
                  {Object.entries(PLATFORMS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => handleSelectPreset(key)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5] transition flex items-center justify-between"
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-[#9c9689] font-mono">{p.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <input
            type="text"
            placeholder="https://api.your-relay.com (支持直接填写根域名)"
            value={config.baseUrl}
            onChange={(e) => dispatch({ type: 'SET_BASE_URL', payload: e.target.value })}
            className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-3 py-2 font-mono text-xs text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition"
          />
        </div>

        {/* 2. API Key Input (4 cols) */}
        <div className="md:col-span-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[#faf9f5] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>中转站 API Key (令牌)</span>
            </label>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-[11px] text-[#9c9689] hover:text-[#faf9f5] transition flex items-center gap-1"
            >
              {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showKey ? '隐藏' : '显示'}</span>
            </button>
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            value={config.apiKey}
            onChange={(e) => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
            className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-3 py-2 font-mono text-xs text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition"
          />
        </div>

        {/* 3. Target Model Selector (3 cols) */}
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[#faf9f5] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>测试目标模型</span>
            </label>
            <button
              onClick={handleFetchModels}
              disabled={isLoadingModels || !config.baseUrl || !config.apiKey}
              className="text-[11px] text-[#cc785c] hover:text-[#d98266] transition flex items-center gap-1 disabled:opacity-40 font-medium"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
              <span>{availableModels.length > 0 ? `(${availableModels.length})` : '拉取'}</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              list="models-datalist"
              placeholder="gpt-4o / claude-3-7-sonnet"
              value={config.selectedModel}
              onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
              className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-3 py-2 font-mono text-xs text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition"
            />
            <datalist id="models-datalist">
              {availableModels.map((m) => (
                <option key={m.id} value={m.id} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Auto-discovered Models Banner (Claude Sage Green Aesthetic) */}
      {availableModels.length > 0 && (
        <div className="rounded-lg border border-[#5db872]/30 bg-[#5db872]/[0.08] p-3 text-xs text-[#d4cebe] space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-[#5db872]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>已成功识别该中转站 {availableModels.length} 个模型</span>
          </div>
          <div className="text-[11px] text-[#faf9f5]/80 font-mono truncate">
            {availableModels.slice(0, 10).map((m) => m.id).join(', ')}
            {availableModels.length > 10 ? ` 等共 ${availableModels.length} 个` : ''}
          </div>
        </div>
      )}

      {/* Bottom Info Bar: Balance & Fast Probe */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2e2b27] text-xs">
        <div className="flex items-center gap-3">
          {relayProfile?.detectedBalance ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#5db872]/10 border border-[#5db872]/20 text-[#5db872] font-mono text-xs">
              <Wallet className="w-3.5 h-3.5" />
              <span>中转站余额: {relayProfile.detectedBalance.rawText}</span>
            </div>
          ) : (
            <div className="text-[#9c9689] text-xs flex items-center gap-1.5">
              <span>状态:</span>
              <span className="text-[#d4cebe] font-mono">
                {config.baseUrl ? '已配置中转端点' : '等待输入中转站 Base URL'}
              </span>
            </div>
          )}

          {sniffFeedback && (
            <span className="text-[#9c9689] text-xs italic">{sniffFeedback}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSniffBalance}
            disabled={isSniffingBalance || !config.baseUrl || !config.apiKey}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#23211e] border border-[#2e2b27] text-xs text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5] hover:border-[#cc785c]/40 transition disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${isSniffingBalance ? 'animate-spin' : ''}`} />
            <span>{isSniffingBalance ? '探测中...' : '探测中转站余额与额度'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
