export interface Message {
  role: 'user' | 'assistant' | 'system' | 'developer'
  content: string
  name?: string
}

export interface GenerateOptions {
  messages: Message[]
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  stop?: string[]
  [key: string]: any
}

export interface GenerateResult {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: string
  model?: string
  raw?: any
}

export interface LLMConfig {
  id: string
  provider: string
  model: string
  apiKey: string
  baseURL?: string
  proxy?: string
  timeout?: number
  adapter?: ProviderAdapter
  name?: string
  description?: string
}

export interface ProviderAdapter {
  name: string
  buildRequest(config: LLMConfig, messages: Message[], options?: GenerateOptions): RequestInit
  parseResponse(response: any): GenerateResult
  parseStream(response: Response): AsyncIterable<string>
}

export type InstanceStatus = 'idle' | 'loading' | 'success' | 'error'

export interface LLMInstance {
  id: string
  config: LLMConfig
  status: InstanceStatus
  lastResponse?: GenerateResult
  error?: string
}

export type OutputFormat = 'markdown' | 'json' | 'code' | 'text'

export interface FormattedOutput {
  type: OutputFormat
  content: string
  raw: string
}

export { ProviderEnum } from '../provider/config'
