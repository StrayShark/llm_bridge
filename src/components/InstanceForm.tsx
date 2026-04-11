import { useState, useEffect } from 'react'
import { Button, Input, Select, Switch } from './ui'
import type { LLMConfig } from '../core/types'
import { PROVIDERS, getModels } from '../provider/config'

interface InstanceFormProps {
  instance?: LLMConfig | null
  onSubmit: (config: Partial<LLMConfig>, enableStorage: boolean) => void
  onCancel: () => void
}

const providerOptions = PROVIDERS.map(p => ({
  value: p.id,
  label: p.name
}))

export default function InstanceForm({ instance, onSubmit, onCancel }: InstanceFormProps) {
  const [provider, setProvider] = useState(instance?.provider || 'openai')
  const [model, setModel] = useState(instance?.model || '')
  const [apiKey, setApiKey] = useState(instance?.apiKey || '')
  const [name, setName] = useState(instance?.name || '')
  const [customModel, setCustomModel] = useState(instance?.model || '')
  const [customBaseURL, setCustomBaseURL] = useState(instance?.baseURL || '')
  const [proxy, setProxy] = useState(instance?.proxy || '')
  const [enableStorage, setEnableStorage] = useState(true)

  const currentModels = getModels(provider)
  const modelOptions: Array<{ value: string; label: string }> = currentModels.map(m => ({
    value: m.id,
    label: m.name
  }))

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
      setModel('')
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
    setModel('')
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
        options={providerOptions}
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
            options={modelOptions}
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
