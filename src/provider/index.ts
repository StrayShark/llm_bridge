export { openaiProvider } from './openai.js'
export { deepseekProvider } from './deepseek.js'
export { kimiProvider } from './kimi.js'
export { qwenProvider } from './qwen.js'
export { minimaxProvider } from './minimax.js'
export { zhipuProvider } from './zhipu.js'
export { createCustomProvider, type CustomProviderConfig } from './custom.js'

import { openaiProvider } from './openai.js'
import { deepseekProvider } from './deepseek.js'
import { kimiProvider } from './kimi.js'
import { qwenProvider } from './qwen.js'
import { minimaxProvider } from './minimax.js'
import { zhipuProvider } from './zhipu.js'
import { createCustomProvider } from './custom.js'
import type { ProviderAdapter } from '../core/types.js'

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

export function getProvider(name: string): ProviderAdapter | undefined {
  return providers[name]
}
