import { useState, useRef, useEffect } from 'react'
import type { LLMConfig } from '../core/types'
import MarkdownRenderer from './MarkdownRenderer'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface MultiChatPanelProps {
  selectedInstances: LLMConfig[]
  onStream: (id: string, prompt: string) => AsyncGenerator<string, void, unknown>
}

export default function MultiChatPanel({ selectedInstances, onStream }: MultiChatPanelProps) {
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [allSessions, setAllSessions] = useState<Record<string, {
    messages: Message[]
    streamContent: string
    isStreaming: boolean
  }>>({})
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const scrollToBottom = (id: string) => {
    messagesEndRefs.current[id]?.scrollIntoView({ behavior: 'auto' })
  }

  useEffect(() => {
    selectedInstances.forEach(inst => {
      if (!allSessions[inst.id!]) {
        setAllSessions(prev => ({
          ...prev,
          [inst.id!]: { messages: [], streamContent: '', isStreaming: false }
        }))
      }
    })
  }, [selectedInstances])

  useEffect(() => {
    selectedInstances.forEach(inst => {
      scrollToBottom(inst.id!)
    })
  }, [allSessions, selectedInstances])

  const handleSend = async () => {
    if (!input.trim() || selectedInstances.length === 0) return

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() }
    
    setAllSessions(prev => {
      const updated: Record<string, any> = {}
      selectedInstances.forEach(inst => {
        updated[inst.id!] = {
          ...prev[inst.id!],
          messages: [...(prev[inst.id!]?.messages || []), userMessage],
          streamContent: '',
          isStreaming: true
        }
      })
      return updated
    })

    setInput('')

    const streamPromises = selectedInstances.map(async (instance) => {
      let fullContent = ''
      try {
        for await (const chunk of onStream(instance.id!, input)) {
          fullContent += chunk
          setAllSessions(prev => ({
            ...prev,
            [instance.id!]: {
              ...prev[instance.id!],
              streamContent: fullContent
            }
          }))
          scrollToBottom(instance.id!)
        }

        const assistantMessage: Message = { role: 'assistant', content: fullContent, timestamp: new Date() }
        setAllSessions(prev => ({
          ...prev,
          [instance.id!]: {
            ...prev[instance.id!],
            messages: [...prev[instance.id!].messages, assistantMessage],
            streamContent: '',
            isStreaming: false
          }
        }))
      } catch (error: any) {
        const errorMessage: Message = { role: 'assistant', content: `错误: ${error.message}`, timestamp: new Date() }
        setAllSessions(prev => ({
          ...prev,
          [instance.id!]: {
            ...prev[instance.id!],
            messages: [...prev[instance.id!].messages, errorMessage],
            streamContent: '',
            isStreaming: false
          }
        }))
      }
    })

    await Promise.all(streamPromises)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const isStreaming = selectedInstances.some(id => allSessions[id.id!]?.isStreaming)

  return (
    <div className="flex flex-col h-full bg-surface-container">
      <div className="flex-1 overflow-auto">
        {selectedInstances.length === 0 ? (
          <div className="h-full flex items-center justify-center text-on-surface-variant">
            <div className="text-center">
              <p className="text-lg">选择实例</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4">
            {selectedInstances.map((instance) => {
              const session = allSessions[instance.id!] || { messages: [], streamContent: '', isStreaming: false }
              return (
                <div key={instance.id} className="flex flex-col bg-surface-container-low rounded-lg h-[600px] border border-surface-container-high">
                  <div className="px-4 py-3 bg-surface-container shrink-0 h-14 rounded-t-lg">
                    <h3 className="font-medium text-sm text-on-surface truncate">
                      {instance.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant truncate">
                      {instance.provider} · {instance.model}
                    </p>
                  </div>

                  <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {session.messages.map((message, index) => (
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
                          <MarkdownRenderer content={message.content} />
                        </div>
                      </div>
                    ))}

                    {session.isStreaming && session.streamContent && (
                      <div className="flex justify-start">
                        <div className="max-w-[90%] rounded-lg p-3 text-sm bg-surface-container">
                          <MarkdownRenderer content={session.streamContent} />
                          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                        </div>
                      </div>
                    )}

                    <div ref={(el) => { messagesEndRefs.current[instance.id!] = el }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-4 shrink-0 bg-surface-container border-t border-surface-container-high">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={selectedInstances.length === 0 ? '请先选择实例' : `发送消息到 ${selectedInstances.length} 个实例...`}
            disabled={isStreaming || selectedInstances.length === 0}
            className="flex-1 px-4 py-3 bg-surface-container border border-surface-container-high rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || selectedInstances.length === 0 || isStreaming}
            className="gradient-primary text-on-primary px-4 rounded-lg font-medium hover:brightness-105 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
