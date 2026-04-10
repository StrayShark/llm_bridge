# 🤖 LLM Bridge

> Browser-first LLM 多模型管理工具，支持同时对话多个模型

## ✨ 特性

- ✅ **多模型支持**：OpenAI / DeepSeek / Kimi / Qwen / MiniMax / 智谱AI / 自定义
- ✅ **多实例管理**：同时管理多个 LLM 配置
- ✅ **多实例对话**：勾选多个实例，可同时对话
- ✅ **连接测试**：一键测试 LLM 连通性
- ✅ **本地存储**：配置自动保存到 IndexedDB
- ✅ **流式输出**：实时显示 AI 回复
- ✅ **Markdown 渲染**：支持 Markdown 格式和代码高亮
- ✅ **中文优化**：完美支持中文输入法

## 🛠️ 技术栈

- TypeScript
- React 18
- Zustand（状态管理）
- TailwindCSS
- Vite

## 📦 安装

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 🚀 快速开始

### 1. 创建实例

点击左侧「创建实例」按钮，选择 Provider 并填写配置：

| Provider | 默认 Endpoint |
|----------|--------------|
| OpenAI | `https://api.openai.com/v1` |
| DeepSeek | `https://api.deepseek.com/v1` |
| Kimi | `https://api.moonshot.cn/v1` |
| Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| MiniMax | `https://api.minimax.chat/v1` |
| 智谱AI | `https://open.bigmodel.cn/api/paas/v4` |

### 2. 测试连接

创建实例后，点击「测试连通性」按钮验证配置是否正确。

### 3. 开始对话

1. 勾选左侧实例列表中的实例（可多选）
2. 在底部输入框输入消息
3. 按 Enter 或点击「发送」按钮

### 4. 数据存储

- 勾选「存储到本地」可将配置保存到 IndexedDB
- 刷新页面后配置会自动恢复
- 删除实例时会同步删除本地存储

## 🏗️ 项目结构

```
llm-bridge/
├── src/
│   ├── core/                   # 核心功能
│   │   ├── types.ts           # 类型定义
│   │   └── createLLM.ts       # 工厂函数
│   ├── provider/               # Provider 适配器
│   │   ├── openai.ts          # OpenAI
│   │   ├── deepseek.ts        # DeepSeek
│   │   ├── kimi.ts            # Kimi
│   │   ├── qwen.ts            # Qwen
│   │   ├── minimax.ts         # MiniMax
│   │   ├── zhipu.ts           # 智谱AI
│   │   └── custom.ts          # 自定义
│   ├── store/                 # 状态管理
│   │   ├── llmStore.ts       # Zustand Store
│   │   └── indexedDB.ts       # IndexedDB 存储
│   ├── components/             # React 组件
│   │   ├── InstanceForm.tsx   # 实例表单
│   │   ├── InstanceCard.tsx    # 实例卡片
│   │   ├── MultiChatPanel.tsx # 多实例对话面板
│   │   ├── MarkdownRenderer.tsx
│   │   ├── ErrorModal.tsx     # 错误弹窗
│   │   └── ui/                # UI 组件库
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

## 💡 SDK 使用示例

在代码中使用 SDK：

### OpenAI

```typescript
import { createLLM } from './src'

const llm = createLLM({
  id: 'my-openai',
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  apiKey: 'sk-xxx'
})

const result = await llm.generate({
  messages: [{ role: 'user', content: 'Hello!' }]
})
```

### 智谱AI

```typescript
import { createLLM } from './src'

const llm = createLLM({
  id: 'my-zhipu',
  provider: 'zhipu',
  model: 'glm-4',
  apiKey: 'your-zhipu-api-key'
})

const result = await llm.generate({
  messages: [{ role: 'user', content: '你好!' }]
})
```

### 自定义 Provider

```typescript
import { createLLM } from './src'

const llm = createLLM({
  id: 'my-local',
  provider: 'custom',
  model: 'llama-2-7b',
  apiKey: '',
  baseURL: 'http://localhost:8080/v1'
})
```

### 流式输出

```typescript
for await (const chunk of llm.stream({
  messages: [{ role: 'user', content: '讲个故事' }]
})) {
  process.stdout.write(chunk)
}
```

## 📝 API 参考

### createLLM(config)

```typescript
{
  id: string                    // 实例 ID
  provider: 'openai' | 'deepseek' | 'kimi' | 'qwen' | 'minimax' | 'zhipu' | 'custom'
  model: string                 // 模型名称
  apiKey: string                // API Key
  baseURL?: string              // 可选：自定义 API 地址
  timeout?: number              // 可选：请求超时（毫秒）
}
```

### 实例方法

```typescript
// 非流式生成
await llm.generate({
  messages: [{ role: 'user', content: 'Hello' }],
  temperature: 0.7,
  maxTokens: 1000
})

// 流式生成
for await (const chunk of llm.stream({
  messages: [{ role: 'user', content: 'Hello' }]
})) {
  console.log(chunk)
}
```

## 📄 License

MIT
