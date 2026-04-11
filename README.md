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

## 📝 API 参考

### createLLM(config)

```typescript
{
  provider: ProviderEnum   // Provider 枚举
  model: string           // 模型名称
  apiKey: string          // API Key
  baseURL?: string        // 可选：自定义 API 地址
  timeout?: number        // 可选：请求超时（毫秒）
}
```

### generate(options)

```typescript
await llm.generate({
  messages: [{ role: 'user', content: 'Hello' }],
  temperature: 0.7,
  maxTokens: 1000
})
```

### stream(options)

```typescript
for await (const chunk of llm.stream({
  messages: [{ role: 'user', content: 'Hello' }]
})) {
  console.log(chunk)
}
```

## 📄 License

MIT
