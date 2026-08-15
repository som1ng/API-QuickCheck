import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GlobalConfig, RelayProfile, ActiveTabId } from '../types/config';
import { PLATFORMS, getPlatformOptions } from '../config/platforms';

interface AppState {
  config: GlobalConfig;
  activeTab: ActiveTabId;
  availableModels: { id: string; name: string }[];
  isLoadingModels: boolean;
  modelError: string | null;
  relayProfile: RelayProfile | null;
}

type AppAction =
  | { type: 'SET_PLATFORM'; payload: string }
  | { type: 'SET_BASE_URL'; payload: string }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: ActiveTabId }
  | { type: 'SET_AVAILABLE_MODELS'; payload: { id: string; name: string }[] }
  | { type: 'SET_LOADING_MODELS'; payload: boolean }
  | { type: 'SET_MODEL_ERROR'; payload: string | null }
  | { type: 'SET_RELAY_PROFILE'; payload: RelayProfile | null };

const initialPlatformId = getPlatformOptions()[0]?.value || 'openai';
const initialPlatform = PLATFORMS[initialPlatformId] || PLATFORMS.openai;

const initialState: AppState = {
  config: {
    platformId: initialPlatformId,
    baseUrl: initialPlatform?.defaultBaseUrl || 'https://api.openai.com/v1',
    apiKey: '',
    selectedModel: 'gpt-4o',
    timeoutMs: 8000,
  },
  activeTab: 'fidelity',
  availableModels: [],
  isLoadingModels: false,
  modelError: null,
  relayProfile: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PLATFORM': {
      const pId = action.payload;
      const platform = PLATFORMS[pId];
      if (!platform) return state;
      return {
        ...state,
        config: {
          ...state.config,
          platformId: pId,
          baseUrl: platform.defaultBaseUrl,
          selectedModel: pId === 'anthropic' ? 'claude-3-7-sonnet-20250219' : pId === 'deepseek' ? 'deepseek-chat' : 'gpt-4o',
        },
      };
    }
    case 'SET_BASE_URL':
      return {
        ...state,
        config: { ...state.config, baseUrl: action.payload },
      };
    case 'SET_API_KEY':
      return {
        ...state,
        config: { ...state.config, apiKey: action.payload },
      };
    case 'SET_SELECTED_MODEL':
      return {
        ...state,
        config: { ...state.config, selectedModel: action.payload },
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };
    case 'SET_AVAILABLE_MODELS':
      return {
        ...state,
        availableModels: action.payload,
        modelError: null,
      };
    case 'SET_LOADING_MODELS':
      return {
        ...state,
        isLoadingModels: action.payload,
      };
    case 'SET_MODEL_ERROR':
      return {
        ...state,
        modelError: action.payload,
      };
    case 'SET_RELAY_PROFILE':
      return {
        ...state,
        relayProfile: action.payload,
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, () => {
    try {
      const savedBaseUrl = localStorage.getItem('aqc_baseUrl');
      const savedPlatformId = localStorage.getItem('aqc_platformId') || initialPlatformId;
      const savedModel = localStorage.getItem('aqc_model');
      
      const platform = PLATFORMS[savedPlatformId] || initialPlatform;

      return {
        ...initialState,
        config: {
          ...initialState.config,
          platformId: savedPlatformId,
          baseUrl: savedBaseUrl || platform.defaultBaseUrl,
          selectedModel: savedModel || 'gpt-4o',
        },
      };
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aqc_baseUrl', state.config.baseUrl);
      localStorage.setItem('aqc_platformId', state.config.platformId);
      if (state.config.selectedModel) {
        localStorage.setItem('aqc_model', state.config.selectedModel);
      }
    } catch {
      // ignore
    }
  }, [state.config.baseUrl, state.config.platformId, state.config.selectedModel]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
