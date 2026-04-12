import { useState, useEffect } from 'react';
import { Button, Input, Select, Switch } from './ui';
import type { LLMConfig, LLMOptions } from '../core/types';
import { PROVIDERS, getModels, getParamRanges, type ParamRanges } from '../provider/config';

interface InstanceFormProps {
  instance?: LLMConfig | null
  onSubmit: (config: Partial<LLMConfig>, enableStorage: boolean) => void
  onCancel: () => void
}

const providerOptions = PROVIDERS.map(p => ({
  value: p.id,
  label: p.name
}));

export default function InstanceForm({ instance, onSubmit, onCancel }: InstanceFormProps) {
  const [provider, setProvider] = useState(instance?.provider || 'openai');
  const [model, setModel] = useState(instance?.model || '');
  const [apiKey, setApiKey] = useState(instance?.apiKey || '');
  const [name, setName] = useState(instance?.name || '');
  const [customModel, setCustomModel] = useState(instance?.model || '');
  const [customBaseURL, setCustomBaseURL] = useState(instance?.baseURL || '');
  const [proxy, setProxy] = useState(instance?.proxy || '');
  const [enableStorage, setEnableStorage] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [paramRanges, setParamRanges] = useState<ParamRanges>(() => getParamRanges('openai'));
  const [temperature, setTemperature] = useState(instance?.options?.temperature ?? paramRanges.temperature.default);
  const [maxTokens, setMaxTokens] = useState(instance?.options?.maxTokens ?? '');
  const [topP, setTopP] = useState(instance?.options?.topP ?? paramRanges.topP.default);
  const [presencePenalty, setPresencePenalty] = useState(instance?.options?.presencePenalty ?? paramRanges.presencePenalty.default);
  const [frequencyPenalty, setFrequencyPenalty] = useState(instance?.options?.frequencyPenalty ?? paramRanges.frequencyPenalty.default);
  const [seed, setSeed] = useState(instance?.options?.seed ?? '');
  const [responseFormat, setResponseFormat] = useState<'text' | 'json' | ''>(
    instance?.options?.responseFormat || ''
  );

  const currentModels = getModels(provider);
  const modelOptions: Array<{ value: string; label: string }> = currentModels.map(m => ({
    value: m.id,
    label: m.name
  }));

  useEffect(() => {
    const ranges = getParamRanges(provider, model || undefined);
    setParamRanges(ranges);
    if (!instance) {
      setTemperature(ranges.temperature.default);
      setTopP(ranges.topP.default);
      setPresencePenalty(ranges.presencePenalty.default);
      setFrequencyPenalty(ranges.frequencyPenalty.default);
    }
  }, [provider, model]);

  useEffect(() => {
    if (instance) {
      setProvider(instance.provider);
      setModel(instance.model);
      setApiKey(instance.apiKey || '');
      setName(instance.name || '');
      setCustomModel(instance.model);
      setCustomBaseURL(instance.baseURL || '');
      setProxy(instance.proxy || '');
      setEnableStorage(true);

      const ranges = getParamRanges(instance.provider, instance.model);
      setParamRanges(ranges);
      setTemperature(instance.options?.temperature ?? ranges.temperature.default);
      setMaxTokens(instance.options?.maxTokens ?? '');
      setTopP(instance.options?.topP ?? ranges.topP.default);
      setPresencePenalty(instance.options?.presencePenalty ?? ranges.presencePenalty.default);
      setFrequencyPenalty(instance.options?.frequencyPenalty ?? ranges.frequencyPenalty.default);
      setSeed(instance.options?.seed ?? '');
      setResponseFormat(instance.options?.responseFormat || '');
    } else {
      setProvider('openai');
      setModel('');
      setApiKey('');
      setName('');
      setCustomModel('');
      setCustomBaseURL('');
      setProxy('');
      setEnableStorage(true);
      setTemperature(0.7);
      setMaxTokens('');
      setTopP(1);
      setPresencePenalty(0);
      setFrequencyPenalty(0);
      setSeed('');
      setResponseFormat('');
    }
  }, [instance]);

  const handleProviderChange = (value: string) => {
    setProvider(value);
    setModel('');
  };

  const buildOptions = (): LLMOptions | undefined => {
    const opts: LLMOptions = {};
    if (temperature !== paramRanges.temperature.default) opts.temperature = temperature;
    if (maxTokens) opts.maxTokens = parseInt(maxTokens);
    if (topP !== paramRanges.topP.default) opts.topP = topP;
    if (presencePenalty !== paramRanges.presencePenalty.default) opts.presencePenalty = presencePenalty;
    if (frequencyPenalty !== paramRanges.frequencyPenalty.default) opts.frequencyPenalty = frequencyPenalty;
    if (seed) opts.seed = parseInt(seed);
    if (responseFormat) opts.responseFormat = responseFormat;

    return Object.keys(opts).length > 0 ? opts : undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    onSubmit({
      name: name.trim(),
      provider,
      model: provider === 'custom' ? customModel : model,
      apiKey,
      baseURL: customBaseURL || undefined,
      proxy: proxy || undefined,
      options: buildOptions()
    }, enableStorage);
  };

  return (
    <div className="flex flex-col max-h-[calc(90vh-140px)]">
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6">
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

        <div className="border-t border-surface-container-high">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-3 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span>高级配置</span>
            <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showAdvanced && (
            <div className="space-y-4 pb-2">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Temperature (${paramRanges.temperature.min}-${paramRanges.temperature.max})`}
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  min={paramRanges.temperature.min}
                  max={paramRanges.temperature.max}
                  step={0.1}
                />
                <Input
                  label="Max Tokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  placeholder="4096"
                  min={1}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Top P (${paramRanges.topP.min}-${paramRanges.topP.max})`}
                  type="number"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  min={paramRanges.topP.min}
                  max={paramRanges.topP.max}
                  step={0.05}
                />
                {paramRanges.supportsSeed && (
                  <Input
                    label="Seed"
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="随机"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Presence Penalty (${paramRanges.presencePenalty.min}~${paramRanges.presencePenalty.max})`}
                  type="number"
                  value={presencePenalty}
                  onChange={(e) => setPresencePenalty(parseFloat(e.target.value))}
                  min={paramRanges.presencePenalty.min}
                  max={paramRanges.presencePenalty.max}
                  step={0.1}
                />
                <Input
                  label={`Frequency Penalty (${paramRanges.frequencyPenalty.min}~${paramRanges.frequencyPenalty.max})`}
                  type="number"
                  value={frequencyPenalty}
                  onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value))}
                  min={paramRanges.frequencyPenalty.min}
                  max={paramRanges.frequencyPenalty.max}
                  step={0.1}
                />
              </div>

              {paramRanges.supportsResponseFormat && (
                <Select
                  label="Response Format"
                  value={responseFormat}
                  onChange={(e) => setResponseFormat(e.target.value as 'text' | 'json' | '')}
                  options={[
                    { value: '', label: '默认' },
                    { value: 'text', label: 'Text' },
                    { value: 'json', label: 'JSON' }
                  ]}
                />
              )}
            </div>
          )}
        </div>
      </form>

      <div className="flex items-center justify-between py-4 border-t border-surface-container-high shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-on-surface-variant">存储到本地</span>
          <Switch
            checked={enableStorage}
            onChange={setEnableStorage}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2 shrink-0">
        <Button type="submit" className="flex-1" onClick={handleSubmit}>
          {instance ? '保存修改' : '创建实例'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  );
}
