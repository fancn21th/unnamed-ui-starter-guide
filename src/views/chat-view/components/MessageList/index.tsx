"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  MessageList as MessageListComponent,
  type MessageItem,
  type AIMessageItem,
} from "@/components/wuhan/composed/message-list";
import { IconButton } from "@/components/wuhan/composed/icon-button";
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
} from "lucide-react";
import Markdown from "@/components/wuhan/composed/markdown";

// ============ ThinkingProcess 相关导入 ============
import {
  ThinkingStep,
  type ThinkingStepContentBlock,
} from "@/components/wuhan/composed/thinking-process";
import type {
  ThinkingStepItemProps,
} from "@/components/wuhan/composed/thinking-step-item";

// ============ DynamicForm 相关导入 ============
import {
  DynamicForm,
  type FormSchema,
} from "@/components/wuhan/composed/dynamic-form";

// ============ FeedbackButtons 组件 ============
interface FeedbackButtonsProps {
  role: "user" | "ai";
  content?: string;
}

const FeedbackButtons = ({ role, content }: FeedbackButtonsProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex gap-1">
      {/* 复制按钮 - 所有消息都有 */}
      <IconButton
        variant="ghost"
        size="sm"
        color="secondary"
        onClick={handleCopy}
        tooltip={copied ? "已复制" : "复制"}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </IconButton>
      {/* 点赞点踩 - 只有 AI 消息有 */}
      {role === "ai" && (
        <>
          <IconButton
            variant="ghost"
            size="sm"
            color="secondary"
            tooltip="有帮助"
          >
            <ThumbsUp className="w-4 h-4" />
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            color="secondary"
            tooltip="没帮助"
          >
            <ThumbsDown className="w-4 h-4" />
          </IconButton>
        </>
      )}
    </div>
  );
};

// ============ 示例 1: ThinkingProcess + ThinkingStepItem ============
// ThinkingStep 的子步骤数据
const thinkingStepsData: Array<ThinkingStepItemProps & { key: React.Key }> = [
  {
    key: "step-1",
    status: "success" as const,
    title: "解析简历",
    items: [{ content: "成功提取了候选人的基本信息、工作经历、教育背景和技能列表。" }],
  },
  {
    key: "step-2",
    status: "success" as const,
    title: "分析匹配度",
    items: [{ content: "候选人与岗位要求的匹配度为 85%，具备相关技术栈经验。" }],
  },
  {
    key: "step-3",
    status: "loading" as const,
    title: "生成面试问题",
    items: [{}], // 空 content 会显示 "思考中..."
  },
];

// 使用 contentBlocks 渲染 ThinkingProcess（推荐方式）
const thinkingProcessContentBlocks: ThinkingStepContentBlock[] = [
  {
    type: "text",
    key: "intro",
    content: "正在分析候选人简历，请稍候...",
  },
  {
    type: "subSteps",
    key: "steps",
    steps: thinkingStepsData,
  },
  {
    type: "text",
    key: "outro",
    content: "分析完成后将生成详细的评估报告。",
  },
];

// ============ 示例 2: ThinkingProcess 中嵌入 DynamicForm ============
// 用户信息表单 Schema
const userFormSchema: FormSchema = {
  title: "用户信息登记",
  description: "请填写以下信息以便我们为您提供更好的服务",
  fields: [
    {
      name: "name",
      label: "姓名",
      type: "input",
      placeholder: "请输入您的姓名",
      required: true,
    },
    {
      name: "email",
      label: "邮箱",
      type: "input",
      placeholder: "请输入您的邮箱",
      required: true,
    },
    {
      name: "department",
      label: "部门",
      type: "select",
      options: [
        { value: "frontend", label: "前端开发" },
        { value: "backend", label: "后端开发" },
        { value: "design", label: "设计" },
        { value: "product", label: "产品" },
      ],
      required: true,
    },
    {
      name: "message",
      label: "留言",
      type: "textarea",
      placeholder: "请输入您的留言（选填）",
    },
  ],
};

// 在 ThinkingProcess 中嵌入表单的内容块
const formContentBlocks: ThinkingStepContentBlock[] = [
  {
    type: "text",
    key: "intro",
    content: "请填写以下信息完成登记：",
  },
  {
    type: "node",
    key: "form",
    node: (
      <DynamicForm
        schema={userFormSchema}
        showTitle={false}
        onFinish={(values: Record<string, unknown>) => {
          console.log("表单提交:", values);
          // 这里可以更新消息状态为已完成
        }}
      />
    ),
  },
];

// ============ 默认消息数据 ============
const defaultMessages: (MessageItem | AIMessageItem)[] = [
  {
    id: "1",
    role: "user",
    content: "你好，我想了解一下 React Hooks",
    timestamp: Date.now() - 60000,
    avatar: {
      src: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
      name: "用户",
      time: new Date(Date.now() - 60000).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    feedback: (
      <FeedbackButtons role="user" content="你好，我想了解一下 React Hooks" />
    ),
  },
  {
    id: "2",
    role: "ai",
    content: `
# React Hooks 简介

React Hooks 是 React 16.8 引入的新特性，让你在不编写 class 的情况下使用 state 和其他 React 特性。

## 常用 Hooks

1. **useState** - 管理组件状态
2. **useEffect** - 处理副作用
3. **useContext** - 使用 Context

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
\`\`\`
    `,
    timestamp: Date.now() - 50000,
    avatar: {
      src: "https://api.dicebear.com/7.x/bottts/svg?seed=ai",
      name: "AI 助手",
      time: new Date(Date.now() - 50000).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    feedback: <FeedbackButtons role="ai" />,
  },
  {
    id: "3",
    role: "user",
    content: "能举个例子吗？",
    timestamp: Date.now() - 40000,
    avatar: {
      src: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
      name: "用户",
      time: new Date(Date.now() - 40000).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    feedback: (
      <FeedbackButtons role="user" content="你好，我想了解一下 React Hooks" />
    ),
  },
  {
    id: "4",
    role: "ai",
    content: "不可以",
    timestamp: Date.now() - 30000,
    avatar: {
      src: "https://api.dicebear.com/7.x/bottts/svg?seed=ai",
      name: "AI 助手",
    },
    feedback: <FeedbackButtons role="ai" />,
  },
  // ============ 示例消息: ThinkingProcess + ThinkingStepItem ============
  {
    id: "5",
    role: "ai",
    content: (
      <ThinkingStep
        status="running"
        title="分析候选人简历"
        contentBlocks={thinkingProcessContentBlocks}
        defaultOpen
      />
    ),
    timestamp: Date.now() - 20000,
    avatar: {
      src: "https://api.dicebear.com/7.x/bottts/svg?seed=ai",
      name: "AI 助手",
    },
    feedback: <FeedbackButtons role="ai" />,
  },
  // ============ 示例消息: ThinkingProcess + DynamicForm ============
  {
    id: "6",
    role: "ai",
    content: (
      <ThinkingStep
        status="pending"
        title="信息登记"
        contentBlocks={formContentBlocks}
        longRunning
      />
    ),
    timestamp: Date.now() - 10000,
    avatar: {
      src: "https://api.dicebear.com/7.x/bottts/svg?seed=ai",
      name: "AI 助手",
    },
    feedback: <FeedbackButtons role="ai" />,
  },
];

interface DemoMessageItem extends MessageItem {
  status?: "idle" | "generating" | "failed";
}

export function MessageList() {
  const [messages, setMessages] = useState<DemoMessageItem[]>(defaultMessages);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "ai" && lastMessage.status === "generating") {
      const timer = setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1
              ? {
                  ...msg,
                  status: "idle" as const,
                  content: `
# 当然可以！

\`\`\`jsx
import { useState } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
}
\`\`\`

这是一个简单的计数器组件，使用了 **useState** Hook 来管理计数状态。
                  `,
                }
              : msg,
          ),
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // 内容渲染器：支持 string 和 ReactNode
  const renderContent = (content: React.ReactNode) => {
    return typeof content === "string" ? <Markdown content={content} /> : content;
  };

  return (
    <MessageListComponent
      className="overflow-hidden"
      messages={messages}
      onMessageClick={(msg) => console.log("消息点击:", msg.id)}
      renderContent={(content) => renderContent(content)}
    />
  );
}
