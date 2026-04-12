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
}

export interface ModelConfig {
  id: string
  name: string
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: ProviderEnum.OpenAI,
    name: 'OpenAI',
    defaultEndpoint: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ]
  },
  {
    id: ProviderEnum.DeepSeek,
    name: 'DeepSeek',
    defaultEndpoint: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' }
    ]
  },
  {
    id: ProviderEnum.Kimi,
    name: 'Kimi (Moonshot)',
    defaultEndpoint: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot V1-8K' },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1-32K' },
      { id: 'moonshot-v1-128k', name: 'Moonshot V1-128K' },
      { id: 'kimi-k2.5', name: 'Kimi K2.5' }
    ]
  },
  {
    id: ProviderEnum.Qwen,
    name: 'Qwen (阿里云百炼)',
    defaultEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
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
    models: [
      { id: 'MiniMax-M2.5', name: 'MiniMax-M2.5' },
      { id: 'MiniMax-M2.7', name: 'MiniMax-M2.7' }
    ]
  },
  {
    id: ProviderEnum.Zhipu,
    name: '智谱AI (GLM)',
    defaultEndpoint: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
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
    models: []
  }
]

export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.id === id)
}

export function getProviders(): ProviderConfig[] {
  return PROVIDERS
}

export function getModels(providerId: string): ModelConfig[] {
  const provider = getProvider(providerId)
  return provider?.models || []
}
