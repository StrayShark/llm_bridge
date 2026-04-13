# 🤖 LLM Bridge SDK

> 轻量级 LLM API 调用工具，支持多种 Provider

## 📦 安装

```bash
npm install llm-bridge-sdk
```

## 💡 快速开始

### 创建 LLM 实例

```typescript
import { createLLM, ProviderEnum } from 'llm-bridge-sdk'

const llm = createLLM({
  provider: ProviderEnum.OpenAI,
  model: 'gpt-3.5-turbo',
  apiKey: 'your-api-key'
})
```

### 发送消息

```typescript
const result = await llm.generate({
  messages: [{ role: 'user', content: 'Hello!' }]
})

console.log(result.content)
```

### 流式输出

```typescript
for await (const chunk of llm.stream({
  messages: [{ role: 'user', content: '讲个故事' }]
})) {
  process.stdout.write(chunk)
}
```

### 停止请求

```typescript
const controller = new AbortController()

try {
  for await (const chunk of llm.stream({
    messages: [{ role: 'user', content: '写一首长诗' }],
  }, controller.signal)) {
    console.log(chunk)
  }
} catch (error) {
  if (error.message === 'Request cancelled') {
    console.log('请求已被取消')
  }
}

// 在需要时停止
controller.abort()
```

## 📋 Provider 枚举

```typescript
import { ProviderEnum } from 'llm-bridge-sdk'

ProviderEnum.OpenAI      // OpenAI
ProviderEnum.DeepSeek    // DeepSeek
ProviderEnum.Kimi        // Kimi (Moonshot)
ProviderEnum.Qwen        // Qwen (阿里云百炼)
ProviderEnum.MiniMax     // MiniMax
ProviderEnum.Zhipu       // 智谱AI (GLM)
ProviderEnum.Custom      // 自定义
```

## 🔧 Provider 配置

### 获取所有 Provider

```typescript
import { PROVIDERS } from 'llm-bridge-sdk'

PROVIDERS.forEach(p => {
  console.log(p.id, p.name, p.defaultEndpoint)
})
```

### 获取指定 Provider 的模型

```typescript
import { getModels } from 'llm-bridge-sdk'

const models = getModels('openai')
// [{ id: 'gpt-4', name: 'GPT-4' }, ...]
```

## ⚙️ Options 配置

每个 Provider 支持不同的参数配置，可通过 `getParamRanges` 获取：

```typescript
import { getParamRanges } from 'llm-bridge-sdk'

const params = getParamRanges('openai')
console.log(params)
// {
//   temperature: { min: 0, max: 2, default: 0.7 },
//   topP: { min: 0, max: 1, default: 1 },
//   presencePenalty: { min: -2, max: 2, default: 0 },
//   frequencyPenalty: { min: -2, max: 2, default: 0 },
//   supportsResponseFormat: true,
//   supportsSeed: true
// }
```

### 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| `temperature` | number | 控制随机性，值越大回复越随机 |
| `maxTokens` | number | 最大输出 token 数 |
| `topP` | number | 核采样概率 |
| `presencePenalty` | number | 存在惩罚，-2~2 |
| `frequencyPenalty` | number | 频率惩罚，-2~2 |
| `seed` | number | 随机种子，保证可复现 |
| `responseFormat` | 'text' \| 'json' | 响应格式（部分 Provider 支持）|

### 使用示例

```typescript
const llm = createLLM({
  provider: ProviderEnum.Qwen,
  model: 'qwen-plus',
  apiKey: 'your-api-key',
  options: {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    responseFormat: 'json'
  }
})
```

### Provider 参数支持情况

| Provider | temperature | topP | presencePenalty | frequencyPenalty | seed | responseFormat |
|----------|-------------|------|-----------------|------------------|------|----------------|
| OpenAI | ✅ 0-2 | ✅ | ✅ | ✅ | ✅ | ✅ |
| DeepSeek | ✅ 0-2 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Kimi | ✅ 0-1 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Qwen | ✅ 0-2 | ✅ | ✅ | ✅ | ✅ | ✅ |
| MiniMax | ✅ 0-1 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Zhipu | ✅ 0-1 | ✅ | ✅ | ✅ | ✅ | ✅ |

## 📝 API 参考

### createLLM(config)

```typescript
{
  provider: ProviderEnum   // Provider 枚举
  model: string           // 模型名称
  apiKey: string          // API Key
  baseURL?: string        // 可选：自定义 API 地址
  timeout?: number        // 可选：请求超时（毫秒）
  options?: LLMOptions     // 可选：生成参数配置
}
```

### LLMOptions

```typescript
{
  temperature?: number          // 随机性
  maxTokens?: number           // 最大 token 数
  topP?: number                // 核采样
  presencePenalty?: number     // 存在惩罚
  frequencyPenalty?: number    // 频率惩罚
  seed?: number               // 随机种子
  responseFormat?: 'text' | 'json'  // 响应格式
}
```

### generate(options, signal?)

```typescript
await llm.generate({
  messages: [{ role: 'user', content: 'Hello' }],
  temperature: 0.7,
  maxTokens: 1000
}, signal)  // 可选：AbortSignal
```

### stream(options, signal?)

```typescript
for await (const chunk of llm.stream({
  messages: [{ role: 'user', content: 'Hello' }]
}, signal)) {  // 可选：AbortSignal
  console.log(chunk)
}
```

## 📄 License

MIT
