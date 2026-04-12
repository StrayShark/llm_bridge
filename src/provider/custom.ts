import type { ProviderAdapter, LLMConfig, Message, GenerateOptions, GenerateResult } from '../core/types.js';

export interface CustomProviderConfig {
  buildRequest?: (config: LLMConfig, messages: Message[], options?: GenerateOptions) => RequestInit
  parseResponse?: (response: any) => GenerateResult
  parseStream?: (response: Response) => AsyncIterable<string>
}

export function createCustomProvider(_config: CustomProviderConfig): ProviderAdapter {
  return {
    name: 'custom',

    buildRequest(config: LLMConfig, messages: Message[], options?: GenerateOptions): RequestInit {
      const model = options?.model || config.model || 'gpt-3.5-turbo';
      const opts = config.options || {};

      const body: any = {
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: options?.stream ?? false
      };

      if (options?.temperature !== undefined) body.temperature = options.temperature;
      else if (opts.temperature !== undefined) body.temperature = opts.temperature;

      if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens;
      else if (opts.maxTokens !== undefined) body.max_tokens = opts.maxTokens;

      if (options?.topP !== undefined) body.top_p = options.topP;
      else if (opts.topP !== undefined) body.top_p = opts.topP;

      if (options?.stop) body.stop = options.stop;
      if (opts.presencePenalty !== undefined) body.presence_penalty = opts.presencePenalty;
      if (opts.frequencyPenalty !== undefined) body.frequency_penalty = opts.frequencyPenalty;
      if (opts.seed !== undefined) body.seed = opts.seed;
      if (opts.responseFormat) body.response_format = { type: opts.responseFormat };

      return {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        },
        body: JSON.stringify(body)
      };
    },

    parseResponse(response: any): GenerateResult {
      if (response.choices?.[0]?.message?.content !== undefined) {
        const choice = response.choices?.[0];
        return {
          content: choice?.message?.content || '',
          usage: response.usage ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens
          } : undefined,
          finishReason: choice?.finish_reason,
          model: response.model,
          raw: response
        };
      }

      throw new Error('Custom provider parseResponse: unsupported response format');
    },

    async *parseStream(response: Response): AsyncIterable<string> {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) yield content;
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  };
}
