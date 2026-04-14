import type { ProviderAdapter, LLMConfig, Message, GenerateOptions, GenerateResult } from '../core/types.js';

export const deepseekProvider: ProviderAdapter = {
  name: 'deepseek',

  buildRequest(config: LLMConfig, messages: Message[], options?: GenerateOptions): RequestInit {
    const model = options?.model || config.model || 'deepseek-chat';
    const opts = config.options || {};

    const body: any = {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name })
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

    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(body)
    };
  },

  parseResponse(response: any): GenerateResult {
    const choice = response.choices?.[0];
    let content = choice?.message?.content || '';
    
    if (choice?.message?.reasoning_content) {
      content = `**思考过程:**\n${choice.message.reasoning_content}\n\n---\n\n**回答:**\n${content}`;
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
    let thinkingBuffer = '';
    let inThinking = false;

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
              
              if (reasoningContent !== undefined && reasoningContent !== null) {
                thinkingBuffer += reasoningContent;
                inThinking = true;
              }
              
              if (content !== undefined && content !== null && content !== '') {
                if (inThinking && thinkingBuffer) {
                  yield `\n\n**思考过程:**\n${thinkingBuffer}\n\n---\n\n**回答:**\n${content}`;
                  thinkingBuffer = '';
                  inThinking = false;
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
      
      if (thinkingBuffer && !inThinking) {
        yield `\n\n**思考过程:**\n${thinkingBuffer}`;
      }
    } finally {
      reader.releaseLock();
    }
  }
};
