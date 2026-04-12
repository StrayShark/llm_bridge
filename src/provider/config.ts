export enum ProviderEnum {
  OpenAI = 'openai',
  DeepSeek = 'deepseek',
  Kimi = 'kimi',
  Qwen = 'qwen',
  MiniMax = 'minimax',
  Zhipu = 'zhipu',
  Custom = 'custom'
}

export interface ProviderConfig {
  id: ProviderEnum | string
  name: string
  defaultEndpoint: string
  models: ModelConfig[]
  paramRanges?: ParamRanges
}

export interface ModelConfig {
  id: string
  name: string
  paramRanges?: Partial<ParamRanges>
}

export interface ParamRanges {
  temperature: { min: number; max: number; default: number }
  topP: { min: number; max: number; default: number }
  presencePenalty: { min: number; max: number; default: number }
  frequencyPenalty: { min: number; max: number; default: number }
  supportsResponseFormat: boolean
  supportsSeed: boolean
}

const DEFAULT_PARAM_RANGES: ParamRanges = {
  temperature: { min: 0, max: 2, default: 0.7 },
  topP: { min: 0, max: 1, default: 1 },
  presencePenalty: { min: -2, max: 2, default: 0 },
  frequencyPenalty: { min: -2, max: 2, default: 0 },
  supportsResponseFormat: false,
  supportsSeed: true
};

const KIMI_PARAM_RANGES: ParamRanges = {
  temperature: { min: 0, max: 1, default: 0.6 },
  topP: { min: 0, max: 1, default: 1 },
  presencePenalty: { min: -2, max: 2, default: 0 },
  frequencyPenalty: { min: -2, max: 2, default: 0 },
  supportsResponseFormat: false,
  supportsSeed: true
};

const MINIMAX_PARAM_RANGES: ParamRanges = {
  temperature: { min: 0, max: 1, default: 1 },
  topP: { min: 0, max: 1, default: 1 },
  presencePenalty: { min: 0, max: 1, default: 0 },
  frequencyPenalty: { min: 0, max: 1, default: 0 },
  supportsResponseFormat: false,
  supportsSeed: true
};

export const PROVIDERS: ProviderConfig[] = [
  {
    id: ProviderEnum.OpenAI,
    name: 'OpenAI',
    defaultEndpoint: 'https://api.openai.com/v1',
    paramRanges: DEFAULT_PARAM_RANGES,
    models: [
      { id: 'gpt-5', name: 'GPT-5' },
      { id: 'gpt-5.2', name: 'GPT-5.2' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ]
  },
  {
    id: ProviderEnum.DeepSeek,
    name: 'DeepSeek',
    defaultEndpoint: 'https://api.deepseek.com/v1',
    paramRanges: {
      ...DEFAULT_PARAM_RANGES,
      temperature: { min: 0, max: 2, default: 1 }
    },
    models: [
      { id: 'deepseek-v3.2', name: 'DeepSeek V3.2' },
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' },
      { id: 'deepseek-r1', name: 'DeepSeek R1' }
    ]
  },
  {
    id: ProviderEnum.Kimi,
    name: 'Kimi (Moonshot)',
    defaultEndpoint: 'https://api.moonshot.cn/v1',
    paramRanges: KIMI_PARAM_RANGES,
    models: [
      { id: 'kimi-k2.5', name: 'Kimi K2.5', paramRanges: { temperature: { min: 0, max: 1, default: 1 } } },
      { id: 'kimi-k2-0905', name: 'Kimi K2-0905' },
      { id: 'moonshot-v1-8k', name: 'Moonshot V1-8K' },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1-32K' },
      { id: 'moonshot-v1-128k', name: 'Moonshot V1-128K' }
    ]
  },
  {
    id: ProviderEnum.Qwen,
    name: 'Qwen (阿里云百炼)',
    defaultEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    paramRanges: {
      ...DEFAULT_PARAM_RANGES,
      temperature: { min: 0, max: 2, default: 0.1 },
      supportsResponseFormat: true
    },
    models: [
      { id: 'qwen3-max', name: 'Qwen3-Max' },
      { id: 'qwen3', name: 'Qwen3' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
      { id: 'qwen-max', name: 'Qwen Max' },
      { id: 'qwen-long', name: 'Qwen Long' }
    ]
  },
  {
    id: ProviderEnum.MiniMax,
    name: 'MiniMax',
    defaultEndpoint: 'https://api.minimax.chat/v1',
    paramRanges: MINIMAX_PARAM_RANGES,
    models: [
      { id: 'MiniMax-M2.1', name: 'MiniMax-M2.1' },
      { id: 'MiniMax-M2.7', name: 'MiniMax-M2.7' },
      { id: 'MiniMax-M2.5', name: 'MiniMax-M2.5' }
    ]
  },
  {
    id: ProviderEnum.Zhipu,
    name: '智谱AI (GLM)',
    defaultEndpoint: 'https://open.bigmodel.cn/api/paas/v4',
    paramRanges: {
      temperature: { min: 0, max: 1, default: 1 },
      topP: { min: 0, max: 1, default: 0.95 },
      presencePenalty: { min: -2, max: 2, default: 0 },
      frequencyPenalty: { min: -2, max: 2, default: 0 },
      supportsResponseFormat: true,
      supportsSeed: true
    },
    models: [
      { id: 'glm-5.1', name: 'GLM-5.1' },
      { id: 'glm-5', name: 'GLM-5' },
      { id: 'glm-4-plus', name: 'GLM-4 Plus' },
      { id: 'glm-4', name: 'GLM-4' },
      { id: 'glm-4-air', name: 'GLM-4 Air' },
      { id: 'glm-4-airx', name: 'GLM-4 AirX' },
      { id: 'glm-4-long', name: 'GLM-4 Long' },
      { id: 'glm-4-flashx', name: 'GLM-4 FlashX' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash' }
    ]
  },
  {
    id: ProviderEnum.Custom,
    name: '自定义',
    defaultEndpoint: '',
    paramRanges: DEFAULT_PARAM_RANGES,
    models: []
  }
];

export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.id === id);
}

export function getProviders(): ProviderConfig[] {
  return PROVIDERS;
}

export function getModels(providerId: string): ModelConfig[] {
  const provider = getProvider(providerId);
  return provider?.models || [];
}

export function getParamRanges(providerId: string, modelId?: string): ParamRanges {
  const provider = getProvider(providerId);
  if (!provider) return DEFAULT_PARAM_RANGES;

  if (modelId) {
    const model = provider.models.find(m => m.id === modelId);
    if (model?.paramRanges) {
      return { ...provider.paramRanges!, ...model.paramRanges };
    }
  }

  return provider.paramRanges || DEFAULT_PARAM_RANGES;
}
