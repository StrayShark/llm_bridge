import type { LLMConfig, GenerateOptions, GenerateResult, ProviderAdapter } from './types';
import { getProviderAdapter } from '../provider/index';

export interface LLMInstance {
  generate(options: GenerateOptions, signal?: AbortSignal): Promise<GenerateResult>
  stream(options: GenerateOptions, signal?: AbortSignal): AsyncIterable<string>
}

export interface StreamController {
  abort: () => void
  signal: AbortSignal
}

const DEFAULT_TIMEOUT = 60000;

function getEndpoint(provider: string, baseURL?: string): string {
  switch (provider) {
    case 'openai':
      return `${baseURL || 'https://api.openai.com/v1'}/chat/completions`;
    case 'deepseek':
      return `${baseURL || 'https://api.deepseek.com/v1'}/chat/completions`;
    case 'kimi':
      return `${baseURL || 'https://api.moonshot.cn/v1'}/chat/completions`;
    case 'qwen':
      return `${baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'}/chat/completions`;
    case 'minimax':
      return `${baseURL || 'https://api.minimax.chat/v1'}/text/chatcompletion_v2`;
    case 'zhipu':
      return `${baseURL || 'https://open.bigmodel.cn/api/paas/v4'}/chat/completions`;
    default:
      return `${baseURL || ''}/chat/completions`;
  }
}

function fetchWithTimeout(url: string, options: RequestInit, timeout: number = DEFAULT_TIMEOUT, externalSignal?: AbortSignal): { response: Promise<Response>, controller: AbortController } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const mergedSignal = externalSignal
    ? anySignal([externalSignal, controller.signal])
    : controller.signal;

  const response = fetch(url, {
    ...options,
    signal: mergedSignal
  }).finally(() => {
    clearTimeout(timeoutId);
  });

  return { response, controller };
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  
  return controller.signal;
}

export function createLLM(config: LLMConfig): LLMInstance {
  const adapter: ProviderAdapter = config.adapter || getProviderAdapter(config.provider) || getProviderAdapter('custom')!;

  async function generate(options: GenerateOptions, signal?: AbortSignal): Promise<GenerateResult> {
    const endpoint = getEndpoint(config.provider, config.baseURL);
    const request = adapter.buildRequest(config, options.messages, options);
    const timeout = config.timeout || DEFAULT_TIMEOUT;

    try {
      const { response } = fetchWithTimeout(endpoint, request, timeout, signal);
      const res = await response;

      if (!res.ok) {
        let errorDetail = '';
        try {
          const errorData = await res.json();
          errorDetail = errorData.error?.message || errorData.message || JSON.stringify(errorData);
        } catch {
          errorDetail = await res.text();
        }
        throw new Error(JSON.stringify({
          code: res.status,
          status: res.status,
          message: errorDetail
        }), { cause: res });
      }

      const data = await res.json();
      return adapter.parseResponse(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request cancelled', { cause: error });
      }
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw error;
        }
        if (error.message.includes('fetch') || error.message.includes('connection') || error.message.includes('ERR_')) {
          throw new Error(JSON.stringify({
            code: 'CONNECTION_ERROR',
            message: `Connection failed: ${error.message}`
          }), { cause: error });
        }
        throw error;
      }
      throw new Error(String(error), { cause: error });
    }
  }

  async function *stream(options: GenerateOptions, signal?: AbortSignal): AsyncIterable<string> {
    const endpoint = getEndpoint(config.provider, config.baseURL);
    const request = adapter.buildRequest(config, options.messages, { ...options, stream: true });
    const timeout = config.timeout || DEFAULT_TIMEOUT;

    try {
      const { response } = fetchWithTimeout(endpoint, request, timeout, signal);
      const res = await response;

      if (!res.ok) {
        let errorDetail = '';
        try {
          const errorData = await res.json();
          errorDetail = errorData.error?.message || errorData.message || JSON.stringify(errorData);
        } catch {
          errorDetail = await res.text();
        }
        throw new Error(JSON.stringify({
          code: res.status,
          status: res.status,
          message: errorDetail
        }), { cause: res });
      }

      yield* adapter.parseStream(res);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request cancelled', { cause: error });
      }
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw error;
        }
        if (error.message.includes('fetch') || error.message.includes('connection') || error.message.includes('ERR_')) {
          throw new Error(JSON.stringify({
            code: 'CONNECTION_ERROR',
            message: `Connection failed: ${error.message}`
          }), { cause: error });
        }
        throw error;
      }
      throw new Error(String(error), { cause: error });
    }
  }

  return {
    generate,
    stream
  };
}

export function createLLMFromConfig(config: LLMConfig): LLMInstance {
  if (!config.id) {
    config.id = crypto.randomUUID();
  }
  return createLLM(config);
}
