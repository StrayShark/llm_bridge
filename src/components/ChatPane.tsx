import { useRef, useEffect, useMemo } from 'react';
import type { LLMConfig } from '../core/types';
import MarkdownRenderer from './MarkdownRenderer';

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatPaneProps {
  instance: LLMConfig
  messages: Message[]
  streamContent: string
  isStreaming: boolean
  onStop: () => void
}

function parseThinkingContent(content: string): { thinking: string; response: string } | null {
  const startIndex = content.indexOf('<thinking>');
  if (startIndex === -1) return null;
  
  const endIndex = content.indexOf('</thinking>');
  if (endIndex === -1) {
    return {
      thinking: content.slice(startIndex + '<thinking>'.length),
      response: ''
    };
  }
  
  return {
    thinking: content.slice(startIndex + '<thinking>'.length, endIndex),
    response: content.slice(endIndex + '</thinking>'.length)
  };
}

export default function ChatPane({ instance, messages, streamContent, isStreaming, onStop }: ChatPaneProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, streamContent]);

  const parsedStreamContent = useMemo(() => {
    if (!streamContent) return null;
    return parseThinkingContent(streamContent);
  }, [streamContent]);

  return (
    <div className="flex flex-col bg-surface-container-low rounded-lg h-[600px] border border-surface-container-high">
      <div className="px-4 py-3 bg-surface-container shrink-0 h-14 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-on-surface truncate">
              {instance.name}
            </h3>
            <p className="text-xs text-on-surface-variant truncate">
              {instance.provider} · {instance.model}
            </p>
          </div>
          {isStreaming && (
            <button
              onClick={onStop}
              className="shrink-0 ml-2 p-1.5 rounded-md bg-error/20 hover:bg-error/30 text-error transition-colors"
              title="停止"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.map((message, index) => {
          const parsed = parseThinkingContent(message.content);
          
          return (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-lg p-3 text-sm ${
                  message.role === 'user'
                    ? 'gradient-primary text-on-primary'
                    : 'bg-surface-container'
                }`}
              >
                {parsed ? (
                  <div className="space-y-3">
                    <div className="border-l-2 border-primary">
                      <MarkdownRenderer content={parsed.thinking} />
                    </div>
                    {parsed.response && (
                      <MarkdownRenderer content={parsed.response} />
                    )}
                  </div>
                ) : (
                  <MarkdownRenderer content={message.content} />
                )}
              </div>
            </div>
          );
        })}

        {isStreaming && streamContent && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-lg p-3 text-sm bg-surface-container">
              {parsedStreamContent ? (
                <div className="space-y-3">
                  <div className="border-l-2 border-primary">
                    <MarkdownRenderer content={parsedStreamContent.thinking} />
                  </div>
                  {parsedStreamContent.response && (
                    <MarkdownRenderer content={parsedStreamContent.response} />
                  )}
                </div>
              ) : (
                <>
                  <MarkdownRenderer content={streamContent} />
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                </>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
