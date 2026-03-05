/**
 * 聊天上下文 - 管理聊天消息和 SSE 连接
 */

import * as React from 'react'
import { SSEClient } from './sse-client'
import { AGUIAdapter, type MessageData, type ResumeStreamPayload } from './agui-adapter'
import { mergePreservingUserConfirmedState } from './merge-user-state'

// ============================================================================
// Context 类型定义
// ============================================================================

export interface ChatContextValue {
  /** 消息列表 */
  messages: MessageData[]
  /** 发送消息 */
  sendMessage: (text: string) => Promise<void>
  /** 是否正在加载（流式生成中） */
  isLoading: boolean
  /** 清空消息 */
  clearMessages: () => void
  /** 当前是否暂停（等待用户交互） */
  isPaused: boolean
  /** 当前的 runId（用于恢复） */
  currentRunId: string | null
  /** 恢复流（用户完成交互后调用） */
  resumeStream: (payload?: ResumeStreamPayload) => Promise<void>
  /** 更新消息（用于本地修改消息内容） */
  updateMessage: (messageId: string, update: (message: MessageData) => MessageData) => void
}

const ChatContext = React.createContext<ChatContextValue | null>(null)

// ============================================================================
// Provider 组件
// ============================================================================

export interface ChatProviderProps {
  children: React.ReactNode
  /** API 端点，默认从环境变量读取 */
  apiUrl?: string
}

export function ChatProvider({ children, apiUrl }: ChatProviderProps) {
  const [messages, setMessages] = React.useState<MessageData[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isPaused, setIsPaused] = React.useState(false)
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null)
  
  const sseClientRef = React.useRef<SSEClient | null>(null)
  const adapterRef = React.useRef<AGUIAdapter | null>(null)
  const resumeStreamRef = React.useRef<((payload?: ResumeStreamPayload) => Promise<void>) | null>(null)

  // 从环境变量获取 API URL
  const finalApiUrl = React.useMemo(() => {
    return apiUrl || import.meta.env.VITE_AGUI_API || 'http://localhost:3001'
  }, [apiUrl])

  // 初始化 SSE 客户端和适配器
  React.useEffect(() => {
    sseClientRef.current = new SSEClient()
    return () => {
      sseClientRef.current?.disconnect()
    }
  }, [])

  // 消息更新回调（流式更新）
  // 合并时保留用户已确认的 TaskList/Form/ConfirmPanel 状态（AG-UI 协议不要求后端回传确认事件）
  const handleMessageUpdate = React.useCallback((message: MessageData) => {
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === message.id)
      if (index >= 0) {
        const merged = mergePreservingUserConfirmedState(prev[index], message)
        const updated = [...prev]
        updated[index] = merged
        return updated
      } else {
        return [...prev, message]
      }
    })
  }, [])

  // 消息完成回调（同样需合并保留用户已确认状态）
  const handleMessageComplete = React.useCallback((message: MessageData) => {
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === message.id)
      if (index >= 0) {
        const merged = mergePreservingUserConfirmedState(prev[index], message)
        const updated = [...prev]
        updated[index] = { ...merged, status: 'idle' }
        return updated
      }
      return prev
    })
    setIsLoading(false)
  }, [])

  // 发送消息
  const sendMessage = React.useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      console.log('📤 Sending message:', text)

      // 1. 添加用户消息
      const userMessage: MessageData = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMessage])

      // 2. 设置加载状态
      setIsLoading(true)
      setIsPaused(false)

      // 3. 生成 runId
      const runId = `run-${Date.now()}`
      setCurrentRunId(runId)

      // 4. 创建适配器（传入 resumeStream ref）
      const adapter = new AGUIAdapter(
        handleMessageUpdate, 
        handleMessageComplete,
        (payload) => resumeStreamRef.current?.(payload) || Promise.resolve()
      )
      adapterRef.current = adapter

      try {
        // 5. 连接到 SSE 端点
        const client = sseClientRef.current
        if (!client) {
          throw new Error('SSE client not initialized')
        }

        await client.connect({
          url: `${finalApiUrl}/agui`,
          method: 'POST',
          body: {
            threadId: `thread-${Date.now()}`,
            runId,
            messages: [
              {
                role: 'user',
                content: text,
              },
            ],
          },
          onEvent: (event) => {
            adapter.handleEvent(event)
          },
          onHeartbeat: () => {
            // 收到心跳 = 流已暂停，等待用户交互
            console.log('⏸️ 流已暂停，等待用户交互')
            setIsPaused(true)
          },
          onError: (error) => {
            console.error('❌ SSE error:', error)
            setIsLoading(false)
            setIsPaused(false)
            
            // 添加错误消息
            const errorMessage: MessageData = {
              id: `error-${Date.now()}`,
              role: 'ai',
              content: '抱歉，连接出错了，请稍后重试。',
              timestamp: Date.now(),
              status: 'failed',
            }
            setMessages((prev) => [...prev, errorMessage])
          },
          onClose: () => {
            console.log('✅ SSE connection closed')
            setIsLoading(false)
            setIsPaused(false)
            setCurrentRunId(null)
          },
        })
      } catch (error) {
        console.error('Failed to send message:', error)
        setIsLoading(false)
        setIsPaused(false)

        // 添加错误消息
        const errorMessage: MessageData = {
          id: `error-${Date.now()}`,
          role: 'ai',
          content: '抱歉，发送失败了，请稍后重试。',
          timestamp: Date.now(),
          status: 'failed',
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    },
    [isLoading, finalApiUrl, handleMessageUpdate, handleMessageComplete]
  )

  // 清空消息
  const clearMessages = React.useCallback(() => {
    setMessages([])
    adapterRef.current?.reset()
  }, [])

  // 恢复流（用户完成交互后调用）
  const resumeStream = React.useCallback(
    async (payload?: ResumeStreamPayload) => {
      if (!currentRunId) {
        console.error('❌ 无法恢复：currentRunId 为空')
        return
      }

      console.log('🔄 调用恢复接口 - runId:', currentRunId, 'payload:', payload)

      try {
        const response = await fetch(`${finalApiUrl}/agui/resume`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            runId: currentRunId,
            ...payload,
          }),
        })

        if (!response.ok) {
          throw new Error(`恢复失败: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        console.log('✅ 恢复成功:', result)

        // 清除暂停状态（流会继续发送事件）
        setIsPaused(false)
      } catch (error) {
        console.error('❌ 恢复失败:', error)
        setIsPaused(false)
        setIsLoading(false)

        // 显示错误消息
        const errorMessage: MessageData = {
          id: `error-${Date.now()}`,
          role: 'ai',
          content: '恢复流失败，请刷新页面重试。',
          timestamp: Date.now(),
          status: 'failed',
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    },
    [currentRunId, finalApiUrl]
  )

  // 更新 resumeStream ref
  React.useEffect(() => {
    resumeStreamRef.current = resumeStream
  }, [resumeStream])

  // 更新消息（用于本地修改消息内容）
  const updateMessage = React.useCallback(
    (messageId: string, update: (message: MessageData) => MessageData) => {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === messageId)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = update(updated[index])
          return updated
        }
        return prev
      })
    },
    []
  )

  const value = React.useMemo<ChatContextValue>(
    () => ({
      messages,
      sendMessage,
      isLoading,
      clearMessages,
      isPaused,
      currentRunId,
      resumeStream,
      updateMessage,
    }),
    [messages, sendMessage, isLoading, clearMessages, isPaused, currentRunId, resumeStream, updateMessage]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useChatContext(): ChatContextValue {
  const context = React.useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}
