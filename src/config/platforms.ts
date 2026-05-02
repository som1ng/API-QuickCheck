// 定义平台配置的标准接口
export interface PlatformConfig {
  id: string;                 // 平台唯一标识
  name: string;               // 平台展示名称
  defaultBaseUrl: string;     // 默认 API Base URL
  modelsEndpoint: string;     // 获取模型列表的路径后缀
  authType: 'Bearer' | 'Header' | 'Query'; // 鉴权方式
  authHeaderKey?: string;     // 如果是 Header 鉴权，自定义的 Key 是什么
  extraHeaders?: Record<string, string>;   // 必须携带的额外请求头
  
  // 核心：如何从各大平台千奇百怪的 JSON 返回体中提取模型列表？
  modelExtractor: (responseData: unknown) => { id: string; name: string }[];
  
  // 核心：静态预设的热门模型（用于前端直接展示给小白用户）
  presetModels: { id: string; name: string }[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

// 统一的数据清洗辅助函数 (针对标准 OpenAI 兼容格式)
const standardOpenAIExtractor = (res: unknown) => {
  if (!isRecord(res) || !Array.isArray(res.data)) return [];

  return res.data.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string') return [];
    return [{ id: item.id, name: item.id }];
  });
};

// 🌍 全平台适配器映射表 (共 23 家)
export const PLATFORMS: Record<string, PlatformConfig> = {
  
  // ==========================================
  // 1. 海外巨头 (Global Giants)
  // ==========================================
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'o1-preview', name: 'o1 Preview' },
      { id: 'o3-mini', name: 'o3 Mini' }
    ]
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    modelsEndpoint: '/models',
    authType: 'Header',
    authHeaderKey: 'x-api-key',
    extraHeaders: { 'anthropic-version': '2023-06-01' },
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet' },
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' }
    ]
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelsEndpoint: '/models',
    authType: 'Query', 
    authHeaderKey: 'key',
    modelExtractor: (res: unknown) => {
      if (!isRecord(res) || !Array.isArray(res.models)) return [];

      return res.models.flatMap((item) => {
        if (!isRecord(item) || typeof item.name !== 'string') return [];

        const id = item.name.replace('models/', '');
        const name = typeof item.displayName === 'string' ? item.displayName : id;
        return [{ id, name }];
      });
    },
    presetModels: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash Lite' },
      { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro' }
    ]
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    defaultBaseUrl: 'https://api.cohere.com/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'command-r-plus', name: 'Command R+' },
      { id: 'command-r', name: 'Command R' }
    ]
  },
  ai21: {
    id: 'ai21',
    name: 'AI21 Labs',
    defaultBaseUrl: 'https://api.ai21.com/studio/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'jamba-1.5-large', name: 'Jamba 1.5 Large' },
      { id: 'jamba-1.5-mini', name: 'Jamba 1.5 Mini' }
    ]
  },

  // ==========================================
  // 2. 海外聚合与推理加速 (Global Aggregators)
  // ==========================================
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite (免费)' },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (免费)' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3' }
    ]
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }
    ]
  },
  together: {
    id: 'together',
    name: 'Together AI',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'Llama 3.1 8B Turbo' },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B' }
    ]
  },
  fireworks: {
    id: 'fireworks',
    name: 'Fireworks AI',
    defaultBaseUrl: 'https://api.fireworks.ai/inference/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'accounts/fireworks/models/llama-v3p1-70b-instruct', name: 'Llama 3.1 70B' },
      { id: 'accounts/fireworks/models/mixtral-8x7b-instruct', name: 'Mixtral 8x7B' }
    ]
  },
  baseten: {
    id: 'baseten',
    name: 'Baseten',
    defaultBaseUrl: 'https://inference.baseten.co/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'deepseek-ai/DeepSeek-V3.1', name: 'DeepSeek V3.1 (托管)' },
      { id: 'moonshotai/Kimi-K2.5', name: 'Kimi K2.5 (托管)' }
    ]
  },

  // ==========================================
  // 3. 国内大厂 (China Tech Giants)
  // ==========================================
  aliyun: {
    id: 'aliyun',
    name: '阿里云 (通义千问)',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'qwen-max', name: 'Qwen Max' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-turbo', name: 'Qwen Turbo' }
    ]
  },
  tencent: {
    id: 'tencent',
    name: '腾讯云 (混元)',
    defaultBaseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'hunyuan-pro', name: 'Hunyuan Pro' },
      { id: 'hunyuan-standard', name: 'Hunyuan Standard' },
      { id: 'hunyuan-lite', name: 'Hunyuan Lite (免费)' }
    ]
  },
  baidu: {
    id: 'baidu',
    name: '百度千帆 (文心一言)',
    defaultBaseUrl: 'https://qianfan.baidubce.com/v2', // 百度最新的 OpenAI 兼容接口
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'ernie-4.0-8k-latest', name: 'ERNIE 4.0 8K' },
      { id: 'ernie-3.5-8k', name: 'ERNIE 3.5 8K' }
    ]
  },
  volcengine: {
    id: 'volcengine',
    name: '火山引擎 (豆包)',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'ep-xxxxxxxx-xxxx', name: 'Doubao Pro (需替换为接入点ID)' },
      { id: 'ep-xxxxxxxx-yyyy', name: 'Doubao Lite (需替换为接入点ID)' }
    ]
  },
  sparkdesk: {
    id: 'sparkdesk',
    name: '讯飞星火 (SparkDesk)',
    defaultBaseUrl: 'https://spark-api-open.xf-yun.com/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'generalv3.5', name: 'Spark V3.5' },
      { id: 'pro-128k', name: 'Spark Pro 128K' }
    ]
  },
  sensenova: {
    id: 'sensenova',
    name: '商汤日日新 (SenseNova)',
    defaultBaseUrl: 'https://api.sensenova.cn/compatible-mode/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'SenseChat-5', name: 'SenseChat V5' },
      { id: 'SenseChat', name: 'SenseChat Standard' }
    ]
  },

  // ==========================================
  // 4. 国内新锐 (China AI Startups)
  // ==========================================
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek (深度求索)',
    defaultBaseUrl: 'https://api.deepseek.com',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (推理)' }
    ]
  },
  siliconflow: {
    id: 'siliconflow',
    name: '硅基流动 (SiliconFlow)',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B' }
    ]
  },
  zhipu: {
    id: 'zhipu',
    name: '智谱 AI (GLM)',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash (免费)' }
    ]
  },
  moonshot: {
    id: 'moonshot',
    name: '月之暗面 (Kimi)',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'moonshot-v1-8k', name: 'Kimi 8K' },
      { id: 'moonshot-v1-32k', name: 'Kimi 32K' },
      { id: 'moonshot-v1-128k', name: 'Kimi 128K' }
    ]
  },
  lingyi: {
    id: 'lingyi',
    name: '零一万物 (01.AI)',
    defaultBaseUrl: 'https://api.lingyiwanwu.com/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'yi-large', name: 'Yi Large' },
      { id: 'yi-medium', name: 'Yi Medium' },
      { id: 'yi-vision', name: 'Yi Vision' }
    ]
  },
  baichuan: {
    id: 'baichuan',
    name: '百川智能 (Baichuan)',
    defaultBaseUrl: 'https://api.baichuan-ai.com/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'Baichuan4', name: 'Baichuan 4' },
      { id: 'Baichuan3-Turbo', name: 'Baichuan 3 Turbo' }
    ]
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    defaultBaseUrl: 'https://api.minimax.chat/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'abab6.5s-chat', name: 'ABAB 6.5s Chat' },
      { id: 'abab6.5-chat', name: 'ABAB 6.5 Chat' }
    ]
  },
  stepfun: {
    id: 'stepfun',
    name: '阶跃星辰 (StepFun)',
    defaultBaseUrl: 'https://api.stepfun.com/v1',
    modelsEndpoint: '/models',
    authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    presetModels: [
      { id: 'step-2-16k', name: 'Step 2 16K' },
      { id: 'step-1v-8k', name: 'Step 1V 8K (视觉)' }
    ]
  }
};

// 导出一个获取所有平台下拉列表的辅助函数
export const getPlatformOptions = () => {
  return Object.values(PLATFORMS).map(p => ({ value: p.id, label: p.name }));
};
