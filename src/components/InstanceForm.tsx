import { useState, useEffect } from 'react'
import { Button, Input, Select, Switch } from './ui'
import type { LLMConfig } from '../core/types'

interface InstanceFormProps {
  instance?: LLMConfig | null
  onSubmit: (config: Partial<LLMConfig>, enableStorage: boolean) => void
  onCancel: () => void
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'kimi', label: 'Kimi (Moonshot)' },
  { value: 'qwen', label: 'Qwen (阿里云百炼)' },
  { value: 'minimax', label: 'MiniMax' },
  { value: 'zhipu', label: '智谱AI (GLM)' },
  { value: 'custom', label: '自定义' }
]

const MODELS: Record<string, Array<{ value: string; label: string }>> = {
  openai: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder' }
  ],
  kimi: [
    { value: 'moonshot-v1-8k', label: 'Moonshot V1-8K' },
    { value: 'moonshot-v1-32k', label: 'Moonshot V1-32K' },
    { value: 'moonshot-v1-128k', label: 'Moonshot V1-128K' },
    { value: 'kimi-k2.5', label: 'Kimi K2.5' }
  ],
  qwen: [
    { value: 'qwen-plus', label: 'Qwen Plus' },
    { value: 'qwen-turbo', label: 'Qwen Turbo' },
    { value: 'qwen-max', label: 'Qwen Max' },
    { value: 'qwen-long', label: 'Qwen Long' }
  ],
  minimax: [
    { value: 'MiniMax-M2.5', label: 'MiniMax-M2.5' },
    { value: 'MiniMax-M2.7', label: 'MiniMax-M2.7' }
  ],
  zhipu: [
    { value: 'glm-4-plus', label: 'GLM-4 Plus' },
    { value: 'glm-4', label: 'GLM-4' },
    { value: 'glm-4-air', label: 'GLM-4 Air' },
    { value: 'glm-4-airx', label: 'GLM-4 AirX' },
    { value: 'glm-4-long', label: 'GLM-4 Long' },
    { value: 'glm-4-flashx', label: 'GLM-4 FlashX' },
    { value: 'glm-4-flash', label: 'GLM-4 Flash' }
  ],
  custom: []
}

export default function InstanceForm({ instance, onSubmit, onCancel }: InstanceFormProps) {
  const [provider, setProvider] = useState(instance?.provider || 'openai')
  const [model, setModel] = useState(instance?.model || 'gpt-3.5-turbo')
  const [apiKey, setApiKey] = useState(instance?.apiKey || '')
  const [name, setName] = useState(instance?.name || '')
  const [customModel, setCustomModel] = useState(instance?.model || '')
  const [customBaseURL, setCustomBaseURL] = useState(instance?.baseURL || '')
  const [proxy, setProxy] = useState(instance?.proxy || '')
  const [enableStorage, setEnableStorage] = useState(true)

  useEffect(() => {
    if (instance) {
      setProvider(instance.provider)
      setModel(instance.model)
      setApiKey(instance.apiKey || '')
      setName(instance.name || '')
      setCustomModel(instance.model)
      setCustomBaseURL(instance.baseURL || '')
      setProxy(instance.proxy || '')
      setEnableStorage(true)
    } else {
      setProvider('openai')
      setModel('gpt-3.5-turbo')
      setApiKey('')
      setName('')
      setCustomModel('')
      setCustomBaseURL('')
      setProxy('')
      setEnableStorage(true)
    }
  }, [instance])

  const handleProviderChange = (value: string) => {
    setProvider(value)
    const defaultModel = MODELS[value]?.[0]?.value || ''
    setModel(defaultModel)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      return
    }
    onSubmit({
      name: name.trim(),
      provider,
      model: provider === 'custom' ? customModel : model,
      apiKey,
      baseURL: customBaseURL || undefined,
      proxy: proxy || undefined
    }, enableStorage)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="实例名称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Select
        label="Provider"
        value={provider}
        onChange={(e) => handleProviderChange(e.target.value)}
        options={PROVIDERS}
      />

      <div>
        <label className="block text-sm font-medium text-on-surface-variant mb-2">
          Model
        </label>
        {provider === 'custom' ? (
          <Input
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
          />
        ) : (
          <Select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            options={MODELS[provider] || []}
          />
        )}
      </div>

      <Input
        label="API Key"
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />

      {provider === 'custom' && (
        <Input
          label="Base URL"
          value={customBaseURL}
          onChange={(e) => setCustomBaseURL(e.target.value)}
          placeholder="https://api.openai.com/v1"
        />
      )}

      <Input
        label="代理 (可选)"
        value={proxy}
        onChange={(e) => setProxy(e.target.value)}
        placeholder="http://127.0.0.1:7890"
      />

      <div className="flex items-center justify-between py-3 border-t border-surface-container-high">
        <div className="flex items-center gap-3">
          <span className="text-sm text-on-surface-variant">存储到本地</span>
          <Switch 
            checked={enableStorage} 
            onChange={setEnableStorage}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1">
          {instance ? '保存修改' : '创建实例'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>
  )
}
