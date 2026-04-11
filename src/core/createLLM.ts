import type { LLMConfig, GenerateOptions, GenerateResult, ProviderAdapter } from './types'
import { getProviderAdapter } from '../provider/index'

export interface LLMInstance {
  generate(options: GenerateOptions): Promise<GenerateResult>
  stream(options: GenerateOptions): AsyncIterable<string>
}

const DEFAULT_TIMEOUT = 60000

function getEndpoint(provider: string, baseURL?: string): string {
  switch (provider) {
    case 'openai':
      return `${baseURL || 'https://api.openai.com/v1'}/chat/completions`
    case 'deepseek':
      return `${baseURL || 'https://api.deepseek.com/v1'}/chat/completions`
    case 'kimi':
      return `${baseURL || 'https://api.moonshot.cn/v1'}/chat/completions`
    case 'qwen':
      return `${baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'}/chat/completions`
    case 'minimax':
      return `${baseURL || 'https://api.minimax.chat/v1'}/text/chatcompletion_v2`
    case 'zhipu':
      return `${baseURL || 'https://open.bigmodel.cn/api/paas/v4'}/chat/completions`
    default:
      return `${baseURL || ''}/chat/completions`
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

export function createLLM(config: LLMConfig): LLMInstance {
  const adapter: ProviderAdapter = config.adapter || getProviderAdapter(config.provider) || getProviderAdapter('custom')!

  async function generate(options: GenerateOptions): Promise<GenerateResult> {
    const endpoint = getEndpoint(config.provider, config.baseURL)
    const request = adapter.buildRequest(config, options.messages, options)
    const timeout = config.timeout || DEFAULT_TIMEOUT

    try {
      const response = await fetchWithTimeout(endpoint, request, timeout)
      
      if (!response.ok) {
        let errorDetail = ''
        try {
          const errorData = await response.json()
          errorDetail = errorData.error?.message || errorData.message || JSON.stringify(errorData)
        } catch {
          errorDetail = await response.text()
        }
        throw new Error(JSON.stringify({
          code: response.status,
          status: response.status,
          message: errorDetail
        }))
      }

      const data = await response.json()
      return adapter.parseResponse(data)
    } catch (error: any) {
      if (error.message.includes('timeout') || error.message.includes('abort')) {
        throw error
      }
      if (error.message.includes('fetch') || error.message.includes('connection') || error.message.includes('ERR_')) {
        throw new Error(JSON.stringify({
          code: 'CONNECTION_ERROR',
          message: `Connection failed: ${error.message}`
        }))
      }
      throw error
    }
  }

  async function *stream(options: GenerateOptions): AsyncIterable<string> {
    const endpoint = getEndpoint(config.provider, config.baseURL)
    const request = adapter.buildRequest(config, options.messages, { ...options, stream: true })
    const timeout = config.timeout || DEFAULT_TIMEOUT

    try {
      const response = await fetchWithTimeout(endpoint, request, timeout)
      
      if (!response.ok) {
        let errorDetail = ''
        try {
          const errorData = await response.json()
          errorDetail = errorData.error?.message || errorData.message || JSON.stringify(errorData)
        } catch {
          errorDetail = await response.text()
        }
        throw new Error(JSON.stringify({
          code: response.status,
          status: response.status,
          message: errorDetail
        }))
      }

      yield* adapter.parseStream(response)
    } catch (error: any) {
      if (error.message.includes('timeout') || error.message.includes('abort')) {
        throw error
      }
      if (error.message.includes('fetch') || error.message.includes('connection') || error.message.includes('ERR_')) {
        throw new Error(JSON.stringify({
          code: 'CONNECTION_ERROR',
          message: `Connection failed: ${error.message}`
        }))
      }
      throw error
    }
  }

  return {
    generate,
    stream
  }
}

export function createLLMFromConfig(config: LLMConfig): LLMInstance {
  if (!config.id) {
    config.id = crypto.randomUUID()
  }
  return createLLM(config)
}
