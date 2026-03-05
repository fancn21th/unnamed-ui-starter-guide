# 组件库对接 AG-UI 指南

本文档说明如何将你的组件库与 AG-UI 协议对接，以 `agui-adapter.ts` 为参考范例。

## 一、整体流程

```
后端 AG-UI 服务
    │ SSE 推送事件
    ▼
┌─────────────────┐
│   AGUIAdapter   │  handleEvent(event)
│  (适配器层)      │
└────────┬────────┘
         │ onMessageUpdate / onMessageComplete
         ▼
┌─────────────────┐
│  MessageList    │  渲染 MessageContent
│  (你的组件库)    │
└─────────────────┘
```

## 二、最小集成示例

```tsx
import { AGUIAdapter } from '@/lib/chat'
import { SSEClient } from '@/lib/chat'

// 1. 创建适配器
const adapter = new AGUIAdapter(
  (message) => setMessages(prev => updateOrAppend(prev, message)),
  (message) => setMessages(prev => markComplete(prev, message)),
  (payload) => fetch('/api/agui/resume', { method: 'POST', body: JSON.stringify(payload) }),
  { debug: true }  // 开发时开启日志
)

// 2. 连接 SSE，将事件交给适配器
const client = new SSEClient()
await client.connect({
  url: '/api/agui',
  method: 'POST',
  body: { threadId, runId, messages },
  onEvent: (event) => adapter.handleEvent(event),
})
```

## 三、事件映射表

| AG-UI 事件 | 含义 | 组件库映射 |
|------------|------|------------|
| `RUN_STARTED` | 开始一次 AI 回复 | 创建 `MessageData` (role: ai, status: generating) |
| `TEXT_MESSAGE_START` | 开始文本块 | 清空累积缓冲区 |
| `TEXT_MESSAGE_CONTENT` | 文本流式内容 | 累积到 `currentTextBlock` 或 step.items 文本 |
| `TEXT_MESSAGE_END` | 文本块结束 | 推入 `currentContentBlocks` |
| `THINKING_START` | 开始思考过程 | 创建 `MessageContent { type: 'thinking' }` |
| `THINKING_TEXT_MESSAGE_*` | 思考引言 | thinking.blocks 中的 intro 文本块 |
| `STEP_STARTED` | 开始步骤 | 创建 `ThinkingStepItem`，加入 subSteps |
| `STEP_FINISHED` | 步骤结束 | 更新步骤 status 为 success/error |
| `TOOL_CALL_START` | 工具调用开始 | step.items 中新增 toolCall item |
| `TOOL_CALL_ARGS` | 工具参数 | 设置 item.content（调用原因） |
| `TOOL_CALL_RESULT` | 工具结果 | 更新 toolCall.content、item.files |
| `STATE_SNAPSHOT` | 状态快照 | thinking.tasklist |
| `CUSTOM` | 自定义事件 | 见下文 |
| `RUN_FINISHED` | 回复结束 | 调用 onMessageComplete |

## 四、CUSTOM 事件（组件库扩展点）

CUSTOM 事件用于在流中插入需要用户交互的组件，流会暂停直到用户完成并调用 `onResumeStream`。

### dynamic_form

- **event.value**: `{ title, fields }`
- **组件**: 表单组件（如 DynamicForm）
- **onResumeStream**: `{ formData }`

### confirm_panel

- **event.value**: `{ text, cards: [{ id, title, description }] }`
- **组件**: 确认面板 + 卡片列表（如 ConfirmPanel + ReportCard）
- **onResumeStream**: `{ selectedCardId }`

### document_card

- **event.value**: `{ title, updateTime }`
- **组件**: 文档卡片（纯展示）
- **onResumeStream**: 无

## 五、可替换部分

接入你的组件库时，主要修改：

1. **类型**：`MessageContent`、`ThinkingStepItemProps`、`TodoItem` 等
2. **组件**：ReportCard、DynamicForm、ConfirmPanel 的导入与渲染
3. **回调**：`onMessageUpdate`、`onMessageComplete`、`onResumeStream` 与你的状态管理对接

## 六、配置项

```ts
interface AGUIAdapterOptions {
  /** 是否输出调试日志，默认 false */
  debug?: boolean
  /** 模块加载失败时的最大重试次数，默认 0 */
  moduleRetryLimit?: number
}
```

## 七、Mock 数据

可使用 `mock-data/step-01-agui.json` 测试适配器，模拟完整的事件流。
