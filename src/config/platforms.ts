export interface PlatformConfig {
  id: string;
  name: string;
  category: '海外巨头' | '海外聚合与加速' | '国内大厂' | '国内新锐';
  defaultBaseUrl: string;
  modelsEndpoint: string;
  authType: 'Bearer' | 'Header' | 'Query';
  authHeaderKey?: string;
  extraHeaders?: Record<string, string>;
  modelExtractor: (responseData: unknown) => { id: string; name: string }[];
  litellmConfig: {
    envVar: string;
    prefix: string;
    requiresApiBase: boolean;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const standardOpenAIExtractor = (res: unknown) => {
  if (!isRecord(res) || !Array.isArray(res.data)) return [];

  return res.data.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string') return [];
    return [{ id: item.id, name: item.id }];
  });
};

export const PLATFORMS: Record<string, PlatformConfig> = {
  openai: {
    id: 'openai', name: 'OpenAI', category: '海外巨头',
    defaultBaseUrl: 'https://api.openai.com/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: false },
  },
  anthropic: {
    id: 'anthropic', name: 'Anthropic (Claude)', category: '海外巨头',
    defaultBaseUrl: 'https://api.anthropic.com/v1', modelsEndpoint: '/models', authType: 'Header', authHeaderKey: 'x-api-key', extraHeaders: { 'anthropic-version': '2023-06-01' },
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'ANTHROPIC_API_KEY', prefix: 'anthropic/', requiresApiBase: false },
  },
  gemini: {
    id: 'gemini', name: 'Google Gemini', category: '海外巨头',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta', modelsEndpoint: '/models', authType: 'Query', authHeaderKey: 'key',
    modelExtractor: (res: unknown) => {
      if (!isRecord(res) || !Array.isArray(res.models)) return [];

      return res.models.flatMap((item) => {
        if (!isRecord(item) || typeof item.name !== 'string') return [];

        const id = item.name.replace('models/', '');
        const name = typeof item.displayName === 'string' ? item.displayName : id;
        return [{ id, name }];
      });
    },
    litellmConfig: { envVar: 'GEMINI_API_KEY', prefix: 'gemini/', requiresApiBase: false },
  },
  cohere: {
    id: 'cohere', name: 'Cohere', category: '海外巨头',
    defaultBaseUrl: 'https://api.cohere.com/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'COHERE_API_KEY', prefix: 'cohere/', requiresApiBase: false },
  },
  ai21: {
    id: 'ai21', name: 'AI21 Labs', category: '海外巨头',
    defaultBaseUrl: 'https://api.ai21.com/studio/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'AI21_API_KEY', prefix: 'ai21/', requiresApiBase: false },
  },

  openrouter: {
    id: 'openrouter', name: 'OpenRouter', category: '海外聚合与加速',
    defaultBaseUrl: 'https://openrouter.ai/api/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENROUTER_API_KEY', prefix: 'openrouter/', requiresApiBase: false },
  },
  groq: {
    id: 'groq', name: 'Groq', category: '海外聚合与加速',
    defaultBaseUrl: 'https://api.groq.com/openai/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'GROQ_API_KEY', prefix: 'groq/', requiresApiBase: false },
  },
  together: {
    id: 'together', name: 'Together AI', category: '海外聚合与加速',
    defaultBaseUrl: 'https://api.together.xyz/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'TOGETHERAI_API_KEY', prefix: 'together_ai/', requiresApiBase: false },
  },
  fireworks: {
    id: 'fireworks', name: 'Fireworks AI', category: '海外聚合与加速',
    defaultBaseUrl: 'https://api.fireworks.ai/inference/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'FIREWORKS_API_KEY', prefix: 'fireworks_ai/', requiresApiBase: false },
  },
  baseten: {
    id: 'baseten', name: 'Baseten', category: '海外聚合与加速',
    defaultBaseUrl: 'https://inference.baseten.co/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'BASETEN_API_KEY', prefix: 'baseten/', requiresApiBase: false },
  },

  aliyun: {
    id: 'aliyun', name: '阿里云 (通义千问)', category: '国内大厂',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
  tencent: {
    id: 'tencent', name: '腾讯云 (混元)', category: '国内大厂',
    defaultBaseUrl: 'https://api.hunyuan.cloud.tencent.com/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
  baidu: {
    id: 'baidu', name: '百度千帆 (文心一言)', category: '国内大厂',
    defaultBaseUrl: 'https://qianfan.baidubce.com/v2', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
  volcengine: {
    id: 'volcengine', name: '火山引擎 (豆包)', category: '国内大厂',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
  sparkdesk: {
    id: 'sparkdesk', name: '讯飞星火 (SparkDesk)', category: '国内大厂',
    defaultBaseUrl: 'https://spark-api-open.xf-yun.com/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
  sensenova: {
    id: 'sensenova', name: '商汤日日新 (SenseNova)', category: '国内大厂',
    defaultBaseUrl: 'https://api.sensenova.cn/compatible-mode/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },

  deepseek: {
    id: 'deepseek', name: 'DeepSeek (官方)', category: '国内新锐',
    defaultBaseUrl: 'https://api.deepseek.com', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'DEEPSEEK_API_KEY', prefix: 'deepseek/', requiresApiBase: false },
  },
  siliconflow: {
    id: 'siliconflow', name: '硅基流动 (SiliconFlow)', category: '国内新锐',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
  zhipu: {
    id: 'zhipu', name: '智谱 AI (GLM)', category: '国内新锐',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'ZHIPUAI_API_KEY', prefix: 'zhipu/', requiresApiBase: false },
  },
  moonshot: {
    id: 'moonshot', name: '月之暗面 (Kimi)', category: '国内新锐',
    defaultBaseUrl: 'https://api.moonshot.cn/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
  lingyi: {
    id: 'lingyi', name: '零一万物 (01.AI)', category: '国内新锐',
    defaultBaseUrl: 'https://api.lingyiwanwu.com/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
  baichuan: {
    id: 'baichuan', name: '百川智能 (Baichuan)', category: '国内新锐',
    defaultBaseUrl: 'https://api.baichuan-ai.com/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
  minimax: {
    id: 'minimax', name: 'MiniMax', category: '国内新锐',
    defaultBaseUrl: 'https://api.minimax.chat/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
  stepfun: {
    id: 'stepfun', name: '阶跃星辰 (StepFun)', category: '国内新锐',
    defaultBaseUrl: 'https://api.stepfun.com/v1', modelsEndpoint: '/models', authType: 'Bearer',
    modelExtractor: standardOpenAIExtractor,
    litellmConfig: { envVar: 'OPENAI_API_KEY', prefix: 'openai/', requiresApiBase: true },
  },
};

export const getPlatformOptions = () => Object.values(PLATFORMS).map((p) => ({ value: p.id, label: p.name }));
