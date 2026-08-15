import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchRemoteModels } from '../../engine/scanner/batchScanner';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

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
    if (!config.baseUrl || !config.apiKey) return;
    dispatch({ type: 'SET_LOADING_MODELS', payload: true });
    try {
      const models = await fetchRemoteModels(config.baseUrl, config.apiKey);
      dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
      if (models.length > 0 && !models.some((m) => m.id === config.selectedModel)) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0].id });
      }
    } catch (err: unknown) {
      dispatch({ type: 'SET_MODEL_ERROR', payload: err instanceof Error ? err.message : String(err) });
    } finally {
      dispatch({ type: 'SET_LOADING_MODELS', payload: false });
    }
  };

  return (
    <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 space-y-5">
      {/* Section label */}
      <p className="text-xs font-mono font-medium text-[#9c9689] tracking-widest uppercase">API Configuration</p>

      {/* Inputs grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Base URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#d4cebe]">Endpoint URL</label>
          <input
            type="text"
            placeholder="https://api.openai.com/v1"
            value={config.baseUrl}
            onChange={(e) => dispatch({ type: 'SET_BASE_URL', payload: e.target.value })}
            className="w-full rounded-lg border border-[#2e2b27] bg-[#141413] px-3.5 py-2.5 font-mono text-[13px] text-[#faf9f5] placeholder-[#9c9689]/40 focus:border-[#cc785c]/60 focus:outline-none transition"
          />
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#d4cebe]">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={config.apiKey}
              onChange={(e) => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
              className="w-full rounded-lg border border-[#2e2b27] bg-[#141413] px-3.5 py-2.5 pr-10 font-mono text-[13px] text-[#faf9f5] placeholder-[#9c9689]/40 focus:border-[#cc785c]/60 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9c9689] hover:text-[#faf9f5] transition-colors"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#d4cebe]">Target Model</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={config.selectedModel}
              onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
              placeholder="gpt-4o"
              className="flex-1 rounded-lg border border-[#2e2b27] bg-[#141413] px-3.5 py-2.5 font-mono text-[13px] text-[#faf9f5] placeholder-[#9c9689]/40 focus:border-[#cc785c]/60 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={handleFetchModels}
              disabled={isLoadingModels || !config.baseUrl || !config.apiKey}
              className="shrink-0 rounded-lg border border-[#2e2b27] bg-[#141413] px-3 py-2.5 text-[#9c9689] hover:text-[#faf9f5] hover:border-[#cc785c]/40 transition-colors disabled:opacity-30"
              title="拉取可用模型列表"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {availableModels.length > 0 && (
            <select
              value={availableModels.some((m) => m.id === config.selectedModel) ? config.selectedModel : ''}
              onChange={(e) => e.target.value && dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
              className="w-full rounded-lg border border-[#2e2b27] bg-[#141413] px-3.5 py-2 font-mono text-[12px] text-[#d4cebe] focus:border-[#cc785c]/60 focus:outline-none transition mt-1.5"
            >
              <option value="">已探测 {availableModels.length} 个模型 — 选择切换</option>
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>{model.id}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};
