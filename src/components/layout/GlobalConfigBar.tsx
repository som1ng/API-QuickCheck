import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PLATFORMS } from '../../config/platforms';
import { fetchRemoteModels } from '../../engine/scanner/batchScanner';
import { sniffRelayProfile } from '../../engine/billing/quotaSniffer';
import { Eye, EyeOff, RefreshCw, KeyRound, Globe, Layers, Wallet, ChevronDown, CheckCircle2, Search } from 'lucide-react';

const POPULAR_MODEL_PRESETS = [
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'deepseek-reasoner',
  'deepseek-chat',
  'gpt-4o',
  'o1',
  'gemini-2.5-flash',
];

export const GlobalConfigBar: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels, relayProfile } = state;

  const [showKey, setShowKey] = useState(false);
  const [isSniffingBalance, setIsSniffingBalance] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [sniffFeedback, setSniffFeedback] = useState<string | null>(null);

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
        : '未检测到公开余额接口（正常现象，部分中转站已隐藏计费路由）');
    } catch { setSniffFeedback('探测超时或中转站未开放计费路由'); }
    finally { setIsSniffingBalance(false); }
  };

  const handleSelectPreset = (platformKey: string) => {
    const platform = PLATFORMS[platformKey];
    if (!platform) return;
    dispatch({ type: 'SET_PLATFORM', payload: platformKey });
    dispatch({ type: 'SET_BASE_URL', payload: platform.defaultBaseUrl });
    setShowPresetsDropdown(false);
  };

  const filteredRemoteModels = availableModels.filter((m) =>
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-lg space-y-6">

      {/* ── Row 1: Base URL + API Key ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Base URL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#faf9f5] flex items-center gap-2">
              <Globe className="w-[18px] h-[18px] text-[#cc785c]" />
              中转站接口地址 (Base URL)
            </label>
            <div className="relative">
              <button type="button" onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                className="text-xs text-[#9c9689] hover:text-[#faf9f5] transition flex items-center gap-1.5">
                官方/常用预设 <ChevronDown className="w-4 h-4" />
              </button>
              {showPresetsDropdown && (
                <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-[#2e2b27] bg-[#23211e] p-2 shadow-2xl z-50 max-h-72 overflow-y-auto">
                  <div className="text-xs uppercase tracking-wider text-[#9c9689] font-semibold px-2.5 py-1.5">选择预设地址</div>
                  {Object.entries(PLATFORMS).map(([key, p]) => (
                    <button key={key} onClick={() => handleSelectPreset(key)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5] transition flex items-center justify-between">
                      <span>{p.name}</span>
                      <span className="text-xs text-[#9c9689] font-mono">{p.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <input type="text" placeholder="https://api.your-relay.com (支持直接填写根域名)"
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
              中转站 API Key (令牌)
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

      {/* ── Row 2: Target Model Selector (full width) ── */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[#faf9f5] flex items-center gap-2">
            <Layers className="w-[18px] h-[18px] text-[#cc785c]" />
            测试目标模型 (可下拉或手动输入)
          </label>
          <button onClick={handleFetchModels}
            disabled={isLoadingModels || !config.baseUrl || !config.apiKey}
            className="text-xs text-[#cc785c] hover:text-[#d98266] transition flex items-center gap-1.5 disabled:opacity-40 font-medium">
            <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
            {availableModels.length > 0 ? `已发现 ${availableModels.length} 个模型` : '拉取模型清单'}
          </button>
        </div>

        <div className="flex rounded-lg border border-[#2e2b27] bg-[#23211e] focus-within:border-[#cc785c] transition">
          <input type="text" placeholder="gpt-4o / claude-3-7-sonnet"
            value={config.selectedModel}
            onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
            className="w-full bg-transparent px-4 py-2.5 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:outline-none"
          />
          <button type="button" onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="px-3.5 text-[#9c9689] hover:text-[#faf9f5] transition border-l border-[#2e2b27]">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Smart Combobox Dropdown */}
        {showModelDropdown && (
          <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-[#2e2b27] bg-[#23211e] p-2.5 shadow-2xl z-50 max-h-80 overflow-y-auto space-y-2">
            <div className="relative">
              <input type="text" placeholder="快速搜索模型..."
                value={modelSearchQuery} onChange={(e) => setModelSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#2e2b27] bg-[#1b1a18] pl-9 pr-3 py-2 text-sm text-[#faf9f5] placeholder-[#9c9689] focus:outline-none focus:border-[#cc785c]"
              />
              <Search className="w-4 h-4 text-[#9c9689] absolute left-3 top-2.5" />
            </div>

            <div>
              <div className="text-xs uppercase font-semibold text-[#9c9689] px-2.5 py-1.5">常用热门模型</div>
              {POPULAR_MODEL_PRESETS.map((m) => (
                <button key={m} type="button"
                  onClick={() => { dispatch({ type: 'SET_SELECTED_MODEL', payload: m }); setShowModelDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#2b2926] text-[#faf9f5] transition font-mono truncate">
                  {m}
                </button>
              ))}
            </div>

            {availableModels.length > 0 && (
              <div>
                <div className="text-xs uppercase font-semibold text-[#5db872] px-2.5 py-1.5 border-t border-[#2e2b27] mt-1 pt-2">
                  中转站可用模型 ({availableModels.length})
                </div>
                {filteredRemoteModels.slice(0, 40).map((m) => (
                  <button key={m.id} type="button"
                    onClick={() => { dispatch({ type: 'SET_SELECTED_MODEL', payload: m.id }); setShowModelDropdown(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#2b2926] text-[#d4cebe] transition font-mono truncate">
                    {m.id}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Discovered Models Banner ── */}
      {availableModels.length > 0 && (
        <div className="rounded-lg border border-[#5db872]/30 bg-[#5db872]/[0.08] p-4 text-sm text-[#d4cebe] space-y-1.5">
          <div className="flex items-center gap-2 font-medium text-[#5db872]">
            <CheckCircle2 className="w-[18px] h-[18px]" />
            已成功识别该中转站 {availableModels.length} 个模型
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
              状态: <span className="text-[#d4cebe] font-mono">{config.baseUrl ? '已配置中转端点' : '等待输入中转站 Base URL'}</span>
            </div>
          )}
          {sniffFeedback && <span className="text-[#9c9689] text-xs italic">{sniffFeedback}</span>}
        </div>

        <button onClick={handleSniffBalance}
          disabled={isSniffingBalance || !config.baseUrl || !config.apiKey}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5] hover:border-[#cc785c]/40 transition disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${isSniffingBalance ? 'animate-spin' : ''}`} />
          {isSniffingBalance ? '探测中...' : '探测中转站余额与额度'}
        </button>
      </div>
    </div>
  );
};
