'use client'

import * as React from 'react'
import { useCallback, useEffect, useRef } from 'react'
import {
  MessageList as MessageListComponent,
  type MessageItem,
} from '@/components/wuhan/composed/message-list'
import {
  ThinkingStep,
  type ThinkingStepContentBlock,
} from '@/components/wuhan/composed/thinking-process'
import { TaskList } from '@/components/wuhan/composed/task-list'
import {
  DynamicForm,
  type FormSchema,
} from '@/components/wuhan/composed/dynamic-form'
import { ConfirmPanel } from '@/components/wuhan/composed/confirm-panel'
import { ReportCard } from '@/components/wuhan/composed/report-card'
import { DocumentCard } from '@/components/wuhan/composed/document-card'
import Markdown from '@/components/wuhan/composed/markdown'
import { useAppState } from '@/contexts/app-context.lib.ts'
import {
  useChatContext,
  type MessageContent,
  type MessageData,
} from '@/lib/chat'
import type { DynamicFormItemData, ConfirmPanelItemData } from '@/lib/chat/agui-types'

// ============================================================================
// 从消息内容中提取文本（用于复制）
// ============================================================================

function extractTextFromContent(
  content: string | MessageContent | Array<string | MessageContent>
): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map((item) => extractTextFromContent(item)).join('\n')
  }
  if (content.type === 'text') return content.text
  return ''
}

// ============================================================================
// 主组件
// ============================================================================

interface DemoMessageItem extends MessageItem {
  status?: 'idle' | 'generating' | 'failed'
}

export function MessageList() {
  const defaultAvatarByRole: Record<
    MessageData['role'],
    { src: string; name: string; time: string }
  > = {
    user: {
      src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
      name: 'User',
      time: '10:30',
    },
    ai: {
      src: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai',
      name: 'AI 助手',
      time: '10:31',
    },
  }

  const { setShowCanvas } = useAppState()
  const { messages, resumeStream, updateMessage } = useChatContext()
  
  // ✅ 添加自动滚动到底部的功能
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // 当消息更新时，滚动到底部
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  const updateThinkingTasklist = useCallback(
    (
      messageId: string,
      update: (
        tasklist: NonNullable<
          Extract<MessageContent, { type: 'thinking' }>['tasklist']
        >
      ) => NonNullable<
        Extract<MessageContent, { type: 'thinking' }>['tasklist']
      >
    ) => {
      updateMessage(messageId, (message) => {
        const thinkingContent = message.content as Extract<MessageContent, { type: 'thinking' }>
        if (thinkingContent.type !== 'thinking' || !thinkingContent.tasklist) {
          return message
        }
        return {
          ...message,
          content: {
            ...thinkingContent,
            tasklist: update(thinkingContent.tasklist),
          },
        }
      })
    },
    [updateMessage]
  )

  const updateTasklist = useCallback(
    (
      messageId: string,
      update: (
        tasklist: Extract<MessageContent, { type: 'tasklist' }>
      ) => Extract<MessageContent, { type: 'tasklist' }>
    ) => {
      updateMessage(messageId, (message) => {
        const tasklistContent = message.content as Extract<MessageContent, { type: 'tasklist' }>
        if (tasklistContent.type !== 'tasklist') return message
        return { ...message, content: update(tasklistContent) }
      })
    },
    [updateMessage]
  )

  /** 更新 thinking 中某一步的某个 item 的 data */
  const updateThinkingStepItem = useCallback(
    (
      messageId: string,
      itemKey: string,
      update: (data: Record<string, unknown>) => Record<string, unknown>
    ) => {
      updateMessage(messageId, (message) => {
        const content = message.content as Extract<MessageContent, { type: 'thinking' }>
        if (content.type !== 'thinking') return message
        const newBlocks = content.blocks.map((block) => {
          if (block.type !== 'subSteps') return block
          return {
            ...block,
            steps: block.steps.map((step) => ({
              ...step,
              items: step.items?.map((item) => {
                if (item.key !== itemKey) return item
                const data = (item as { data?: Record<string, unknown> }).data ?? {}
                return { ...item, data: update(data) }
              }) ?? [],
            })),
          }
        })
        return { ...message, content: { ...content, blocks: newBlocks } }
      })
    },
    [updateMessage]
  )

  const onShowCanvas = useCallback(() => {
    setShowCanvas(true)
  }, [setShowCanvas])

  const renderThinkingTaskList = (
    tasklist: NonNullable<
      Extract<MessageContent, { type: 'thinking' }>['tasklist']
    >,
    messageId: string
  ) => (
    <TaskList
      dataSource={tasklist.dataSource}
      title={tasklist.title || '待办清单'}
      status={tasklist.status || 'pending'}
      editable={tasklist.status === 'pending'}
      onItemsChange={(items) => {
        updateThinkingTasklist(messageId, (prev) => ({
          ...prev,
          dataSource: items,
          status: 'pending' as const,
          editable: true,
        }))
      }}
      onConfirmExecute={() => {
        updateThinkingTasklist(messageId, (prev) => ({
          ...prev,
          status: 'confirmed' as const,
          editable: false,
        }))
        resumeStream({ tasklistData: tasklist.dataSource })
      }}
    />
  )

  const renderTaskList = (
    content: Extract<MessageContent, { type: 'tasklist' }>,
    messageId: string
  ) => (
    <TaskList
      dataSource={content.dataSource}
      title={content.title || '待办清单'}
      status={content.status || 'pending'}
      editable={content.status === 'pending'}
      onItemsChange={(items) => {
        updateTasklist(messageId, (prev) => ({
          ...prev,
          dataSource: items,
          status: 'pending' as const,
          editable: true,
        }))
      }}
      onConfirmExecute={() => {
        updateTasklist(messageId, (prev) => ({
          ...prev,
          status: 'confirmed' as const,
          editable: false,
        }))
        resumeStream({ tasklistData: content.dataSource })
      }}
    />
  )

  const renderThinking = (
    content: Extract<MessageContent, { type: 'thinking' }>,
    messageId: string
  ) => {
    const processedBlocks: ThinkingStepContentBlock[] = content.blocks.map(
      (block) => {
        if (
          block.type === 'node' &&
          block.key === 'tasklist' &&
          block.node === null &&
          content.tasklist
        ) {
          return {
            ...block,
            node: renderThinkingTaskList(content.tasklist, messageId),
          }
        }
        if (block.type === 'subSteps') {
          return {
            ...block,
            steps: block.steps.map((step) => ({
              ...step,
              items: step.items?.map((item) => {
                const itemWithCustom = item as {
                  key?: string
                  customType?: 'dynamic_form' | 'confirm_panel'
                  data?: Record<string, unknown>
                  render?: (data: unknown) => React.ReactNode
                }
                if (itemWithCustom.customType === 'dynamic_form') {
                  const data = itemWithCustom.data as unknown as DynamicFormItemData
                  const schema: FormSchema = {
                    title: data.schema?.title,
                    fields: (data.schema?.fields ?? []) as FormSchema['fields'],
                  }
                  return {
                    ...item,
                    render: () => (
                      <DynamicForm
                        schema={schema}
                        showActions={data.status === 'pending'}
                        status={data.status}
                        onFinish={(formData) => {
                          if (data.status === 'confirmed') return
                          updateThinkingStepItem(messageId, itemWithCustom.key!, () => ({
                            ...data,
                            status: 'confirmed',
                          }))
                          resumeStream({ formData })
                        }}
                      />
                    ),
                  }
                }
                if (itemWithCustom.customType === 'confirm_panel') {
                  const data = itemWithCustom.data as unknown as ConfirmPanelItemData
                  const cardsWithId = data.cards.map((card: { id?: string; title?: string; description?: string }, i: number) => ({
                    ...card,
                    _stableId: card.id ?? `card-${i}`,
                  }))
                  return {
                    ...item,
                    render: () => (
                      <ConfirmPanel
                        title="确认选择"
                        status={data.status}
                        confirmButtonText="确认"
                        contentClassName="space-y-4"
                        onConfirm={() => {
                          if (data.selectedId && data.status === 'pending') {
                            updateThinkingStepItem(messageId, itemWithCustom.key!, () => ({
                              ...data,
                              status: 'confirmed',
                            }))
                            resumeStream({ selectedCardId: data.selectedId })
                          }
                        }}
                      >
                        <p className="text-sm text-[var(--Text-text-primary)] mb-4">
                          {data.text}
                        </p>
                        <div className="flex items-center gap-4">
                          {cardsWithId
                            .filter((c: { _stableId: string }) =>
                              data.status === 'confirmed'
                                ? c._stableId === data.selectedId
                                : true
                            )
                            .map((c: { _stableId: string; title?: string; description?: string }) => {
                              return (
                                <ReportCard
                                  key={c._stableId}
                                  id={c._stableId}
                                  title={c.title || ''}
                                  description={c.description || ''}
                                  showCheckbox={data.status === 'pending'}
                                  selected={c._stableId === data.selectedId}
                                  onSelectChange={(selected, id) => {
                                    if (data.status === 'confirmed') return
                                    updateThinkingStepItem(messageId, itemWithCustom.key!, () => ({
                                      ...data,
                                      selectedId: selected && id ? id : null,
                                    }))
                                  }}
                                />
                              )
                            })}
                        </div>
                      </ConfirmPanel>
                    ),
                  }
                }
                return item
              }) ?? [],
            })),
          }
        }
        return block
      }
    )

    return (
      <ThinkingStep
        status={content.status || 'pending'}
        title={content.title}
        contentBlocks={processedBlocks}
        defaultOpen
      />
    )
  }

  const renderDocumentCard = (
    content: Extract<MessageContent, { type: 'document-card' }>
  ) => (
    <DocumentCard
      {...content.card}
      className="w-[320px]"
      onClick={onShowCanvas}
    />
  )

  const renderContent = (
    content: string | MessageContent | Array<string | MessageContent>,
    messageId: string
  ): React.ReactNode => {
    if (Array.isArray(content)) {
      return (
        <div className="flex flex-col gap-2">
          {content.map((item, index) => (
            <React.Fragment key={`${messageId}-${index}`}>
              {renderContent(item, messageId)}
            </React.Fragment>
          ))}
        </div>
      )
    }

    if (typeof content === 'string') {
      return <Markdown content={content} />
    }

    switch (content.type) {
      case 'text':
        return <Markdown content={content.text} />

      case 'thinking':
        return renderThinking(content, messageId)

      case 'tasklist':
        return renderTaskList(content, messageId)

      case 'document-card':
        return renderDocumentCard(content)

      default:
        return null
    }
  }

  /** AI 消息无内容时返回 null，让 AIMessage 显示 loading 状态 */
  const isEmptyContent = (
    content: string | MessageContent | Array<string | MessageContent>
  ): boolean => {
    if (typeof content === 'string') return !content.trim()
    if (Array.isArray(content)) return content.length === 0
    return false
  }

  const renderedMessages: DemoMessageItem[] = messages.map((msg) => {
    const roleAvatar = defaultAvatarByRole[msg.role]
    const isGeneratingWithNoContent =
      msg.role === 'ai' &&
      msg.status === 'generating' &&
      isEmptyContent(msg.content)

    return {
      id: msg.id,
      role: msg.role,
      content: isGeneratingWithNoContent
        ? null
        : (renderContent(msg.content, msg.id) as React.ReactNode),
      timestamp: msg.timestamp,
      avatar: {
        src: roleAvatar.src,
        name: roleAvatar.name,
        time: roleAvatar.time,
      },
      contentForCopy: extractTextFromContent(msg.content),
      status: msg.status,
    }
  })

  return (
    <div 
      ref={scrollContainerRef}
      className="flex flex-col h-full overflow-auto [scrollbar-gutter:stable]"
    >
      <MessageListComponent
        className="w-full max-w-[800px] w-full mx-auto"
        messages={renderedMessages}
        showDefaultFeedback
        onMessageClick={(msg) => console.log('消息点击:', msg.id)}
        renderContent={(content) => content}
      />
    </div>
  )
}
