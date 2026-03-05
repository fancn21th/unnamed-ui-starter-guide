# AGENTS.md - 开发指南

本文件为 AI 代理提供代码库的开发规范和指南。

用中文回答我的问题

## 项目概述

这是一个基于 React 19 + Vite 的前端应用，主要功能是与后端 AG-UI 协议服务器通信，实现 AI 聊天和 CSR 报告生成。

### 核心功能
- **消息列表展示**: 支持用户消息和 AI 消息的展示
- **思考过程展示**: 展示 AI 的思考步骤、工具调用、子步骤等复杂结构
- **流式输出**: 支持 SSE (Server-Sent Events) 实时接收后端事件并更新 UI
- **动态表单**: 支持动态渲染表单、待办清单、文档卡片等组件

### 后端 API
- **后端地址**: http://localhost:3001
- **SSE 端点**: POST /agui
- **协议**: AG-UI 协议（基于 SSE）
- **事件格式**: 大写下划线命名（如 `TEXT_MESSAGE_START`, `TOOL_CALL_START`）

## 1. 构建与命令

### 核心命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | TypeScript 编译 + Vite 构建 |
| `pnpm lint` | 运行 ESLint 检查 |
| `pnpm preview` | 预览构建产物 |

### 运行单个测试

**当前项目未配置测试框架**。如需添加测试，建议使用 Vitest：

```bash
pnpm add -D vitest @testing-library/react jsdom
```

添加后运行单个测试：
```bash
pnpm vitest run src/components/__tests__/button.test.tsx
# 或监听模式
pnpm vitest src/components/__tests__/button.test.tsx
```

### 代码检查

- **TypeScript**: `tsc -b` 执行类型检查
- **ESLint**: `pnpm lint` 运行所有 ESLint 规则
- **Prettier**: 项目使用 Prettier 格式化（见 `.prettierrc`）

## 2. 技术栈

- **React 19** + TypeScript
- **Vite 7** 构建工具
- **Tailwind CSS 4** 样式框架
- **Radix UI** + **Antd** + **Ant Design X** UI 组件库
- **TipTap** 富文本编辑器
- **ESLint 9** + **Prettier 3**

## 3. 代码风格指南

### 3.1 格式化配置

```json
// .prettierrc
{
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": false,
  "singleQuote": true
}
```

### 3.2 TypeScript 严格模式

项目已启用严格模式 (`strict: true`)，部分规则临时关闭：

```json
{
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```

后续应逐步修复这些问题。

### 3.3 导入规范

**路径别名**：使用 `@/` 指向 `src/` 目录

```tsx
// 正确
import { Button } from '@/components/wuhan/composed/block-button'
import { cn } from '@/lib/utils'
import { useAppState } from '@/contexts/app-context.lib.ts'

// 避免
import { Button } from '../../components/...'
```

**导入顺序**（按优先级）：
1. React 内置 hooks: `import { useState, useEffect } from 'react'`
2. 第三方库: `import { Slot } from '@radix-ui/react-slot'`
3. 项目内部组件/工具: `import { cn } from '@/lib/utils'`
4. 样式/资源: `import './index.css'`

**use client 指令**：客户端组件需添加 `"use client"`：

```tsx
"use client";

import * as React from "react";
```

### 3.4 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | kebab-case | `block-button.tsx` |
| 组件名 | PascalCase | `Button`, `TripleSplitPane` |
| 工具函数 | camelCase | `cn()`, `renderIcon()` |
| 类型/接口 | PascalCase | `ButtonProps`, `ButtonIcon` |
| CSS 类名 | Tailwind 类名 | `className="flex items-center gap-2"` |

### 3.5 组件结构

推荐使用以下结构：

```tsx
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

// ==================== 类型定义 ====================

export interface ButtonProps {
  asChild?: boolean;
  className?: string;
}

// ==================== 组件实现 ====================

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn("flex items-center", className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
```

### 3.6 Props 文档

使用 JSDoc 注释为公共 API 添加文档：

```tsx
export interface ButtonProps {
  /**
   * 作为子组件渲染（支持 asChild）
   * @default false
   */
  asChild?: boolean;
  /**
   * 自定义类名
   */
  className?: string;
}
```

### 3.7 错误处理

- 使用 `try/catch` 包装可能失败的异步操作
- 为异步函数添加适当的错误边界
- 避免在组件中直接 catch 后吞掉错误，至少记录日志

```tsx
// 推荐
const handleSubmit = async (data: FormData) => {
  try {
    await submitForm(data);
  } catch (error) {
    console.error('提交失败:', error);
    // 显示错误提示
  }
};
```

### 3.8 状态管理

- 使用 React 内置 hooks (`useState`, `useReducer`) 管理局部状态
- 共享状态使用 Context: `src/contexts/`
- 避免不必要的全局状态

### 3.9 CSS 与样式

- 使用 **Tailwind CSS** 作为主要样式方案
- 使用 `cn()` 工具函数合并类名：

```tsx
import { cn } from "@/lib/utils";

// 正确
className={cn("flex items-center", isActive && "bg-blue-500", className)}

// 避免
className={`flex items-center ${isActive ? 'bg-blue-500' : ''} ${className}`}
```

### 3.10 目录结构

```
src/
├── app/                   # 应用入口
│   └── globals.css       # 全局样式
├── components/           # UI 组件库
│   └── wuhan/
│       ├── blocks/       # 基础组件（原子组件）
│       │   ├── message-01.tsx         # 消息气泡原语组件
│       │   └── page-header-01.tsx     # 页面头部
│       └── composed/     # 组合组件
│           ├── message.tsx            # 消息组件（AI/用户）
│           ├── message-list.tsx       # 消息列表组件
│           ├── message-feedback.tsx   # 消息反馈（复制/点赞/点踩）
│           ├── thinking-process.tsx   # 思考过程组件
│           ├── thinking-step-item.tsx # 思考步骤项组件
│           ├── task-list.tsx          # 待办清单组件
│           ├── dynamic-form.tsx       # 动态表单组件
│           ├── document-card.tsx      # 文档卡片组件
│           ├── markdown.tsx           # Markdown 渲染
│           └── avatar-header.tsx      # 头像组件
├── contexts/             # React Context
│   ├── app-context.tsx              # 全局应用状态
│   └── app-context.lib.ts           # Context 工具函数
├── lib/                  # 工具函数
│   └── utils.ts                     # cn() 等工具
├── views/                # 视图/页面
│   ├── chat-view/                   # 聊天视图
│   │   ├── index.tsx                # 聊天视图主组件
│   │   ├── components/
│   │   │   ├── MessageList/         # 消息列表视图组件
│   │   │   │   └── index.tsx        # 包含完整的消息渲染逻辑
│   │   │   └── Sender/              # 发送器组件
│   │   │       └── index.tsx
│   │   └── RealChatMessageList.tsx  # 真实聊天消息列表（备用）
│   ├── workspace-panel/             # 工作空间面板
│   ├── task-view/                   # 任务视图
│   └── data-source-panel/           # 数据源面板
└── main.tsx              # 应用入口
```

## 4. ESLint 配置

项目使用 ESLint 9 + TypeScript：

- `@eslint/js` - JavaScript 推荐规则
- `typescript-eslint` - TypeScript 支持
- `eslint-plugin-react-hooks` - React Hooks 规则
- `eslint-plugin-react-refresh` - HMR 兼容检查

## 5. 开发注意事项

1. **客户端组件**：使用 `useState`、`useEffect` 等 hooks 的组件必须添加 `"use client"` 指令
2. **路径别名**：始终使用 `@/` 导入，避免相对路径嵌套过深
3. **类型导出**：组件的 props 类型使用 `export type` 导出，避免类型实例化问题
4. **组件显示名**：使用 `displayName` 便于调试
5. **Lucide 图标**：优先使用 `lucide-react` 作为图标库

## 6. 常用工具

- `cn()` - 合并 Tailwind 类名
- Radix UI 原语 - 无样式可访问的 UI 组件
- TipTap - 富文本编辑器

---

## 7. AG-UI 协议与流式输出实现

### 7.1 后端 SSE 事件格式

后端基于 **AG-UI 协议**发送 SSE 事件，事件类型使用**大写下划线命名**：

| 事件类型 | 说明 | 主要字段 |
|---------|------|---------|
| `RUN_STARTED` | 运行开始 | `threadId`, `runId` |
| `RUN_FINISHED` | 运行结束 | `threadId`, `runId` |
| `TEXT_MESSAGE_START` | 文本消息开始 | `messageId`, `role` |
| `TEXT_MESSAGE_CONTENT` | 文本内容增量 | `messageId`, `delta` |
| `TEXT_MESSAGE_END` | 文本消息结束 | `messageId` |
| `THINKING_START` | 思考开始 | `messageId` |
| `THINKING_TEXT_MESSAGE_START` | 思考文本开始 | `messageId`, `role` |
| `THINKING_TEXT_MESSAGE_CONTENT` | 思考文本增量 | `messageId`, `delta` |
| `THINKING_TEXT_MESSAGE_END` | 思考文本结束 | `messageId` |
| `THINKING_END` | 思考结束 | `messageId` |
| `STEP_STARTED` | 步骤开始 | `stepId`, `stepIndex`, `title` |
| `STEP_FINISHED` | 步骤结束 | `stepId`, `status` |
| `TOOL_CALL_START` | 工具调用开始 | `toolCallId`, `toolName`, `stepId` |
| `TOOL_CALL_ARGS` | 工具参数 | `toolCallId`, `delta` |
| `TOOL_CALL_RESULT` | 工具结果 | `toolCallId`, `content`, `messageId`, `role` |
| `TOOL_CALL_END` | 工具调用结束 | `toolCallId` |
| `STATE_SNAPSHOT` | 状态快照 | `state` (包含待办清单等) |
| `CUSTOM` | 自定义事件 | 任意自定义字段 |

### 7.2 流式输出实现方案

#### 方案 A：轻量级实现（推荐）

**特点**：
- 不依赖外部库，自己实现 SSE 客户端
- 使用 `EventSource` 或 `fetch` + `ReadableStream`
- 使用 React Context 管理聊天状态
- 直接基于 `MessageList` 组件渲染

**核心文件**：
```typescript
// src/lib/sse-client.ts
export class SSEClient {
  async connect(url: string, body: any, onEvent: (event: any) => void) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          onEvent(data);
        }
      }
    }
  }
}

// src/contexts/chat-context.tsx
export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const sendMessage = async (text: string) => {
    // 添加用户消息
    const userMsg = { id: uuid(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    
    // 创建 AI 消息占位符
    const aiMsgId = uuid();
    const aiMsg = { id: aiMsgId, role: 'ai', content: '', timestamp: Date.now(), status: 'generating' };
    setMessages(prev => [...prev, aiMsg]);
    
    setIsStreaming(true);
    
    const client = new SSEClient();
    await client.connect('/api/agui', { message: text }, (event) => {
      handleSSEEvent(event, aiMsgId);
    });
    
    setIsStreaming(false);
  };
  
  const handleSSEEvent = (event: any, messageId: string) => {
    switch (event.type) {
      case 'TEXT_MESSAGE_CONTENT':
        // 追加文本
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: msg.content + event.delta }
            : msg
        ));
        break;
      
      case 'THINKING_START':
        // 初始化思考结构
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: { type: 'thinking', blocks: [], title: '思考中...' } }
            : msg
        ));
        break;
      
      case 'TOOL_CALL_START':
        // 添加工具调用
        setMessages(prev => prev.map(msg => {
          if (msg.id !== messageId) return msg;
          const thinking = msg.content as any;
          return {
            ...msg,
            content: {
              ...thinking,
              blocks: [
                ...thinking.blocks,
                {
                  type: 'toolCall',
                  toolCallId: event.toolCallId,
                  toolName: event.toolName,
                  args: '',
                  result: null,
                }
              ]
            }
          };
        }));
        break;
      
      // ... 处理其他事件类型
    }
  };
  
  return (
    <ChatContext.Provider value={{ messages, sendMessage, isStreaming }}>
      {children}
    </ChatContext.Provider>
  );
};
```

**使用方式**：
```tsx
// src/views/chat-view/index.tsx
export function ChatView() {
  return (
    <ChatProvider>
      <MessageList />
      <Sender />
    </ChatProvider>
  );
}
```

#### 方案 B：使用 Ant Design X

**特点**：
- 使用 `@ant-design/x` 的 `useXAgent` 或 `Conversations` 组件
- 内置 SSE 支持和状态管理
- 需要适配 AG-UI 协议到 Ant Design X 的消息格式

**参考代码**：
```tsx
import { useXAgent } from '@ant-design/x';

export function ChatView() {
  const { messages, sendMessage, status } = useXAgent({
    request: async ({ message }, { onSuccess, onUpdate }) => {
      const response = await fetch('/api/agui', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      
      const reader = response.body.getReader();
      // ... 流式读取并调用 onUpdate
    },
  });
  
  return <Conversations messages={messages} onSend={sendMessage} />;
}
```

### 7.3 关键组件映射

| MessageList 组件 | AG-UI 事件 | 说明 |
|-----------------|-----------|------|
| `MessageItem` (role: 'user') | - | 用户消息（本地生成） |
| `AIMessageItem` (status: 'generating') | `TEXT_MESSAGE_CONTENT` | 流式文本累加 |
| `ThinkingStep` | `THINKING_START` ~ `THINKING_END` | 思考过程容器 |
| `ThinkingStepItem` | `STEP_STARTED` ~ `STEP_FINISHED` | 单个步骤 |
| `ThinkingStepItem.toolCall` | `TOOL_CALL_START` ~ `TOOL_CALL_END` | 工具调用 |
| `TaskList` | `STATE_SNAPSHOT` | 待办清单 |
| `DocumentCard` | 自定义逻辑 | 文档卡片（通常在思考完成后添加） |

### 7.4 实现步骤（推荐方案 A）

1. **创建 SSE 客户端** (`src/lib/sse-client.ts`)
2. **创建聊天上下文** (`src/contexts/chat-context.tsx`)
   - 管理消息列表状态
   - 实现 `sendMessage` 函数
   - 实现事件处理器 `handleSSEEvent`
3. **在 ChatView 中使用** (`src/views/chat-view/index.tsx`)
   - 用 `<ChatProvider>` 包裹组件
   - 从 context 读取 `messages` 和 `sendMessage`
4. **适配 MessageList 组件** (`src/views/chat-view/components/MessageList/index.tsx`)
   - 从 context 读取 messages
   - 将 AG-UI 消息格式转换为 `MessageItem[]`
   - 使用现有的 `renderContent` 逻辑渲染复杂内容
5. **测试流式输出**
   - 发送消息到后端
   - 观察 SSE 事件是否正确接收
   - 验证 UI 实时更新

### 7.5 注意事项

- **事件顺序**: 必须严格按照 AG-UI 协议的事件顺序处理
- **消息 ID 映射**: 使用 `messageId` 关联多个事件到同一条消息
- **步骤和工具调用**: 使用 `stepId` 和 `toolCallId` 关联事件
- **错误处理**: 监听 SSE 连接错误，设置消息 `status: 'failed'`
- **性能优化**: 使用 `React.memo` 避免无关消息重复渲染（已在 MessageList 中实现）

---

## 8. 开发建议

### 实现流式输出时的最佳实践

1. **先实现最小可用版本（MVP）**：
   - 只处理 `TEXT_MESSAGE_CONTENT` 事件，实现基本流式文本
   - 验证 SSE 连接和数据接收正常

2. **逐步添加复杂功能**：
   - 添加 `THINKING_START` / `THINKING_END` 支持
   - 添加 `STEP_STARTED` / `STEP_FINISHED` 支持
   - 添加 `TOOL_CALL_*` 支持
   - 添加 `STATE_SNAPSHOT` 支持

3. **复用现有组件**：
   - 不要重复造轮子，直接使用 `MessageList`, `ThinkingStep`, `ThinkingStepItem` 等组件
   - 只需要将后端事件转换为组件需要的数据格式

4. **状态管理**：
   - 使用 Context 或 状态管理库（如 Zustand）管理全局聊天状态
   - 避免在组件内部维护复杂的流式状态

5. **调试技巧**：
   - 在事件处理器中添加 `console.log` 打印所有事件
   - 使用 React DevTools 观察状态变化
   - 使用浏览器 Network 面板查看 SSE 连接
