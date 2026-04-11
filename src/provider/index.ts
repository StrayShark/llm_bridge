export { openaiProvider } from './openai'
export { deepseekProvider } from './deepseek'
export { kimiProvider } from './kimi'
export { qwenProvider } from './qwen'
export { minimaxProvider } from './minimax'
export { zhipuProvider } from './zhipu'
export { createCustomProvider, type CustomProviderConfig } from './custom'
export { PROVIDERS, getProvider, getProviders, getModels, type ProviderConfig, type ModelConfig, ProviderEnum } from './config'

import { openaiProvider } from './openai'
import { deepseekProvider } from './deepseek'
import { kimiProvider } from './kimi'
import { qwenProvider } from './qwen'
import { minimaxProvider } from './minimax'
import { zhipuProvider } from './zhipu'
import { createCustomProvider } from './custom'
import type { ProviderAdapter } from '../core/types'

export const providers: Record<string, ProviderAdapter> = {
  openai: openaiProvider,
  deepseek: deepseekProvider,
  kimi: kimiProvider,
  qwen: qwenProvider,
  minimax: minimaxProvider,
  zhipu: zhipuProvider,
  custom: createCustomProvider({})
}

export function registerProvider(name: string, provider: ProviderAdapter) {
  providers[name] = provider
}

export function getProviderAdapter(name: string): ProviderAdapter | undefined {
  return providers[name]
}
