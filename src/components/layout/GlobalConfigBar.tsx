import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PLATFORMS, PlatformConfig } from '../../config/platforms';
import { fetchRemoteModels } from '../../engine/scanner/batchScanner';
import { sniffRelayProfile } from '../../engine/billing/quotaSniffer';
import { Eye, EyeOff, RefreshCw, KeyRound, Globe, Wallet, ChevronDown, CheckCircle2 } from 'lucide-react';

// Group platforms by category for the provider selector
const PROVIDER_GROUPS: { label: string; items: PlatformConfig[] }[] = (() => {
  const groups: Record<string, PlatformConfig[]> = {};
  Object.values(PLATFORMS).forEach((p) => {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  });
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
})();

export const GlobalConfigBar: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels, relayProfile } = state;

  const [showKey, setShowKey] = useState(false);
  const [isSniffingBalance, setIsSniffingBalance] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [sniffFeedback, setSniffFeedback] = useState<string | null>(null);

  const currentPlatform = PLATFORMS[config.platformId];

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
      } catch { /* silent */ }
    }, 800);
    return () => clearTimeout(timer);
  }, [config.baseUrl, config.apiKey, dispatch]);

  const handleFetchModels = async () => {
    if (!config.baseUrl || !config.apiKey) { alert('请先输入中转站 Base URL 和 API Key'); return; }
    dispatch({ type: 'SET_LOADING_MODELS', payload: true });
    try {
      const models = await fetchRemoteModels(config.baseUrl, config.apiKey);
      dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
      if (models.length > 0 && !models.some((m) => m.id === config.selectedModel)) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0].id });
      }
    } catch (err: unknown) { alert(err instanceof Error ? err.message : String(err)); }
    finally { dispatch({ type: 'SET_LOADING_MODELS', payload: false }); }
  };

  const handleSniffBalance = async () => {
    if (!config.baseUrl || !config.apiKey) { alert('请先输入中转站 Base URL 和 API Key'); return; }
    setIsSniffingBalance(true);
    setSniffFeedback(null);
    try {
      const profile = await sniffRelayProfile(config.baseUrl, config.apiKey);
      dispatch({ type: 'SET_RELAY_PROFILE', payload: profile });
      setSniffFeedback(profile.detectedBalance
        ? `检测到余额: ${profile.detectedBalance.rawText}`
        : '未检测到公开余额接口（正常现象）');
    } catch { setSniffFeedback('探测超时或中转站未开放计费路由'); }
    finally { setIsSniffingBalance(false); }
  };

  const handleSelectProvider = (platformKey: string) => {
    const platform = PLATFORMS[platformKey];
    if (!platform) return;
    dispatch({ type: 'SET_PLATFORM', payload: platformKey });
    dispatch({ type: 'SET_BASE_URL', payload: platform.defaultBaseUrl });
    setShowProviderDropdown(false);
  };

  return (
    <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-lg space-y-6">

      {/* ── Row 1: Provider Selector (Full Width) ── */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[#faf9f5] flex items-center gap-2">
            <Globe className="w-[18px] h-[18px] text-[#cc785c]" />
            接口厂商 / Provider (选择后自动填充 Base URL)
          </label>
          <button onClick={handleFetchModels}
            disabled={isLoadingModels || !config.baseUrl || !config.apiKey}
            className="text-xs text-[#cc785c] hover:text-[#d98266] transition flex items-center gap-1.5 disabled:opacity-40 font-medium">
            <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
            {availableModels.length > 0 ? `已发现 ${availableModels.length} 个模型` : '拉取模型清单'}
          </button>
        </div>

        <button type="button"
          onClick={() => setShowProviderDropdown(!showProviderDropdown)}
          className="w-full flex items-center justify-between rounded-lg border border-[#2e2b27] bg-[#23211e] px-4 py-2.5 text-sm text-[#faf9f5] hover:border-[#cc785c]/40 transition">
          <div className="flex items-center gap-3">
            <span className="font-medium">{currentPlatform?.name || '选择厂商'}</span>
            <span className="text-xs text-[#9c9689] font-mono">{currentPlatform?.category}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#9c9689]" />
        </button>

        {showProviderDropdown && (
          <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-[#2e2b27] bg-[#23211e] p-2.5 shadow-2xl z-50 max-h-80 overflow-y-auto space-y-3">
            {PROVIDER_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="text-xs uppercase font-semibold text-[#9c9689] px-2.5 py-1.5 border-b border-[#2e2b27]">
                  {group.label}
                </div>
                {group.items.map((p) => (
                  <button key={p.id} type="button"
                    onClick={() => handleSelectProvider(p.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                      config.platformId === p.id
                        ? 'bg-[#cc785c]/15 text-[#faf9f5] font-medium'
                        : 'text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5]'
                    }`}>
                    <span>{p.name}</span>
                    <span className="text-xs text-[#9c9689] font-mono truncate ml-3">{p.defaultBaseUrl.replace('https://', '')}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Row 2: Base URL + API Key ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium text-[#faf9f5] mb-2 flex items-center gap-2">
            <Globe className="w-[18px] h-[18px] text-[#cc785c]" />
            接口地址 (Base URL)
          </label>
          <input type="text" placeholder="https://api.your-relay.com"
            value={config.baseUrl}
            onChange={(e) => dispatch({ type: 'SET_BASE_URL', payload: e.target.value })}
            className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-4 py-2.5 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition"
          />
        </div>

        {/* API Key */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#faf9f5] flex items-center gap-2">
              <KeyRound className="w-[18px] h-[18px] text-[#cc785c]" />
              API Key (令牌)
            </label>
            <button onClick={() => setShowKey(!showKey)}
              className="text-xs text-[#9c9689] hover:text-[#faf9f5] transition flex items-center gap-1.5">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
          <input type={showKey ? 'text' : 'password'} placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            value={config.apiKey}
            onChange={(e) => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
            className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-4 py-2.5 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition"
          />
        </div>
      </div>

      {/* ── Discovered Models Banner ── */}
      {availableModels.length > 0 && (
        <div className="rounded-lg border border-[#5db872]/30 bg-[#5db872]/[0.08] p-4 text-sm text-[#d4cebe] space-y-1.5">
          <div className="flex items-center gap-2 font-medium text-[#5db872]">
            <CheckCircle2 className="w-[18px] h-[18px]" />
            已成功识别该中转站 {availableModels.length} 个模型 (请在下方具体功能中选择目标模型)
          </div>
          <div className="text-xs text-[#faf9f5]/80 font-mono truncate">
            {availableModels.slice(0, 10).map((m) => m.id).join(', ')}
            {availableModels.length > 10 ? ` 等共 ${availableModels.length} 个` : ''}
          </div>
        </div>
      )}

      {/* ── Bottom Info Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#2e2b27] text-sm">
        <div className="flex items-center gap-3">
          {relayProfile?.detectedBalance ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#5db872]/10 border border-[#5db872]/20 text-[#5db872] font-mono text-sm">
              <Wallet className="w-[18px] h-[18px]" />
              中转站余额: {relayProfile.detectedBalance.rawText}
            </div>
          ) : (
            <div className="text-[#9c9689] flex items-center gap-2">
              状态: <span className="text-[#d4cebe] font-mono">{config.baseUrl ? '已配置中转端点' : '等待输入 Base URL'}</span>
            </div>
          )}
          {sniffFeedback && <span className="text-[#9c9689] text-xs italic">{sniffFeedback}</span>}
        </div>

        <button onClick={handleSniffBalance}
          disabled={isSniffingBalance || !config.baseUrl || !config.apiKey}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5] hover:border-[#cc785c]/40 transition disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${isSniffingBalance ? 'animate-spin' : ''}`} />
          {isSniffingBalance ? '探测中...' : '探测中转站余额'}
        </button>
      </div>
    </div>
  );
};
