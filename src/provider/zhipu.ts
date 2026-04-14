import type { ProviderAdapter, LLMConfig, Message, GenerateOptions, GenerateResult } from '../core/types.js';

export const zhipuProvider: ProviderAdapter = {
  name: 'zhipu',

  buildRequest(config: LLMConfig, messages: Message[], options?: GenerateOptions): RequestInit {
    const model = options?.model || config.model || 'glm-4';
    const isStream = options?.stream ?? false;
    const opts = config.options || {};

    const body: any = {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name })
      })),
      stream: isStream
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

    if (model.startsWith('glm-5')) {
      body.thinking = { type: 'enabled' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };

    if (isStream) {
      headers['Accept'] = 'text/event-stream';
    }

    return {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    };
  },

  parseResponse(response: any): GenerateResult {
    const choice = response.choices?.[0];
    let content = choice?.message?.content || '';
    
    if (choice?.message?.thinking) {
      content = `**思考过程:**\n${choice.message.thinking}\n\n---\n\n**回答:**\n${content}`;
    }
    
    return {
      content,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined,
      finishReason: choice?.finish_reason,
      model: response.model,
      raw: response
    };
  },

  async *parseStream(response: Response): AsyncIterable<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let thinkingStarted = false;
    let contentStarted = false;

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
              const delta = data.choices?.[0]?.delta;
              
              const content = delta?.content;
              const reasoningContent = delta?.reasoning_content;
              
              if (reasoningContent && reasoningContent.length > 0) {
                if (!thinkingStarted) {
                  yield `<thinking>${reasoningContent}`;
                  thinkingStarted = true;
                } else {
                  yield reasoningContent;
                }
              }
              
              if (content && content.length > 0) {
                if (thinkingStarted && !contentStarted) {
                  yield `</thinking>\n\n**回答:**\n${content}`;
                  contentStarted = true;
                } else if (!contentStarted) {
                  contentStarted = true;
                  yield content;
                } else {
                  yield content;
                }
              }
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
