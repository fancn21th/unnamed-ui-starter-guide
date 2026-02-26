'use client'

import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MessageList as MessageListComponent,
  type MessageItem,
} from '@/components/wuhan/composed/message-list'
import {
  ThinkingStep,
  type ThinkingStepContentBlock,
} from '@/components/wuhan/composed/thinking-process'
import {
  ThinkingStepItem,
  type ThinkingStepItemProps,
} from '@/components/wuhan/composed/thinking-step-item'
import {
  DynamicForm,
  type FormSchema,
} from '@/components/wuhan/composed/dynamic-form'
import { TaskList, type TodoItem } from '@/components/wuhan/composed/task-list'
import { ConfirmPanel } from '@/components/wuhan/composed/confirm-panel'
import {
  ReportCardList,
  type ReportCardItem,
} from '@/components/wuhan/composed/report-card'
import {
  DocumentCard,
  type DocumentCardProps,
} from '@/components/wuhan/composed/document-card'
import {
  BookOpen,
  Copy,
  FileText,
  Search,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import Markdown from '@/components/wuhan/composed/markdown'
import { IconButton } from '@/components/wuhan/composed/icon-button'
import { FeedbackComposed } from '@/components/wuhan/composed/feedback'
import { useAppState } from '@/contexts/app-context.lib'

// ============================================================================
// 消息内容类型
// ============================================================================

type MessageContent =
  | { type: 'text'; text: string }
  | {
      type: 'thinking'
      blocks: ThinkingStepContentBlock[]
      title: string
      status?:
        | 'pending'
        | 'thinking'
        | 'running'
        | 'completed'
        | 'success'
        | 'error'
      tasklist?: {
        dataSource: TodoItem[]
        title?: string
        status?: 'pending' | 'confirmed'
        editable?: boolean
      }
    }
  | { type: 'form'; schema: FormSchema }
  | { type: 'steps'; steps: Array<ThinkingStepItemProps & { key: React.Key }> }
  | {
      type: 'tasklist'
      dataSource: TodoItem[]
      title?: string
      status?: 'pending' | 'confirmed'
      editable?: boolean
    }
  | { type: 'document-card'; card: DocumentCardProps }

interface MessageData {
  id: string
  role: 'user' | 'ai'
  content: string | MessageContent | Array<string | MessageContent>
  timestamp: number
  avatar?: {
    src: string
    name: string
    time?: string
  }
}

interface ConfirmPanelData {
  text: string
  status?: 'pending' | 'confirmed'
  cards: ReportCardItem[]
}

const ConfirmReportPanel = ({ data }: { data: ConfirmPanelData }) => {
  const [state, setState] = useState(() => ({
    text: data.text,
    status: data.status ?? 'pending',
    cards: data.cards,
  }))
  const isConfirmed = state.status === 'confirmed'
  const displayCards = isConfirmed
    ? state.cards.map((card) => ({ ...card, selected: false }))
    : state.cards

  const handleSelectChange = (selected: boolean, id: string) => {
    if (isConfirmed) return
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((card) => ({
        ...card,
        selected: card.id === id ? selected : false,
      })),
    }))
  }

  const handleConfirm = () => {
    const selectedCard = state.cards.find((card) => card.selected)
    if (!selectedCard) return

    setState((prev) => ({
      ...prev,
      status: 'confirmed',
      cards: prev.cards.filter((card) => card.id === selectedCard.id),
    }))
  }

  return (
    <ConfirmPanel
      title="选择模板"
      status={state.status}
      confirmButtonText="确认"
      onConfirm={handleConfirm}
      contentClassName="flex flex-col gap-[var(--gap-lg)]"
    >
      <p className="text-sm text-(--text-secondary)">{state.text}</p>
      <ReportCardList
        cards={displayCards}
        onSelectChange={handleSelectChange}
        showCardAction={false}
        showCheckbox={!isConfirmed}
        listClassName="flex-row flex-wrap"
      />
    </ConfirmPanel>
  )
}

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
// 消息反馈操作按钮
// ============================================================================

interface MessageFeedbackActionsProps {
  role: 'user' | 'ai'
  content: string | MessageContent | Array<string | MessageContent>
  align?: 'left' | 'right'
}

function MessageFeedbackActions({
  role,
  content,
  align = 'left',
}: MessageFeedbackActionsProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [dislikeConfirmed, setDislikeConfirmed] = useState(false)
  const [likeConfirmed, setLikeConfirmed] = useState(false)
  const feedbackRef = useRef<HTMLDivElement>(null)

  const textToCopy = extractTextFromContent(content)

  useEffect(() => {
    if (showFeedbackForm && feedbackRef.current) {
      requestAnimationFrame(() => {
        feedbackRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      })
    }
  }, [showFeedbackForm])

  const handleCopy = useCallback(async () => {
    if (!textToCopy) return
    try {
      await navigator.clipboard.writeText(textToCopy)
    } catch {
      // fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = textToCopy
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }, [textToCopy])

  const handleDislikeClick = useCallback(() => {
    if (dislikeConfirmed) return
    setShowFeedbackForm(true)
  }, [dislikeConfirmed])

  const handleFeedbackSubmit = useCallback(() => {
    setShowFeedbackForm(false)
    setDislikeConfirmed(true)
  }, [])

  const handleFeedbackClose = useCallback(() => {
    setShowFeedbackForm(false)
  }, [])

  const handleInputShown = useCallback(() => {
    feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [])

  const buttonsAlignClass = align === 'right' ? 'justify-end' : 'justify-start'

  return (
    <div className="w-full flex flex-col gap-2">
      <div className={`flex ${buttonsAlignClass} items-center gap-1`}>
        <IconButton
          variant="ghost"
          color="secondary"
          size="sm"
          tooltip="复制"
          onClick={handleCopy}
          disabled={!textToCopy}
        >
          <Copy className="size-4" />
        </IconButton>
        {role === 'ai' && (
          <>
            <IconButton
              variant={"ghost"}
              color={likeConfirmed ? "primary" : "secondary"}
              size="sm"
              tooltip="点赞"
              onClick={() => setLikeConfirmed(true)}
            >
              <ThumbsUp className="size-4" />
            </IconButton>
            <IconButton
              variant={'ghost'}
              color={dislikeConfirmed ? 'primary' : 'secondary'}
              size="sm"
              tooltip="点踩"
              onClick={handleDislikeClick}
            >
              <ThumbsDown className="size-4" />
            </IconButton>
          </>
        )}
      </div>
      {showFeedbackForm && role === 'ai' && (
        <div ref={feedbackRef} className="w-full">
          <FeedbackComposed
            title="有什么问题?"
            options={[
              { id: 'harmful', label: '有害/不安全' },
              { id: 'false', label: '信息虚假' },
              { id: 'other', label: '其他' },
            ]}
            submitLabel="确认"
            showInputWhenSelected={['other']}
            onInputShown={handleInputShown}
            onSubmit={handleFeedbackSubmit}
            onClose={handleFeedbackClose}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 模拟真实消息数据
// ============================================================================

const mockMessages: MessageData[] = [
  {
    id: '1',
    role: 'user',
    content:
      '数据源我都上传了，缺的东西你去企业知识库“IC - 265”项目里面去找，下面直接帮我生成CSR报告',
    timestamp: Date.now() - 300000,
  },
  {
    id: '3',
    role: 'ai',
    content: [
      {
        type: 'thinking',
        title: '思考完成',
        status: 'completed',
        tasklist: {
          title: '待办清单',
          dataSource: [
            { id: '1', content: '确定模板', order: 1 },
            { id: '2', content: '明确数据来源', order: 2 },
            { id: '3', content: '解析模板', order: 3 },
            { id: '4', content: '多源材料解析', order: 4 },
            { id: '5', content: '任务编排', order: 5 },
            { id: '6', content: '逐章节推理质量审查', order: 6 },
          ],
          status: 'pending',
          editable: true,
        },
        blocks: [
          {
            type: 'text',
            key: 'intro',
            content:
              '我已接收到了用户的材料文件，即将梳理思路 ，为用户输出以“01--3.Chinese_CSR_v2.0_09Dec11 2 -SAMPLE-empty templet”为模板的临床试验报告。为了给用户最严谨的反馈，我需要按照以下步骤执行任务：',
          },
          {
            type: 'node',
            key: 'tasklist',
            node: null, // 将在渲染时动态设置
          },
          {
            type: 'subSteps',
            key: 'steps',
            steps: [
              {
                key: 'step-1',
                status: 'success',
                title:
                  '确定模板：查找符合监管要求的模板文件，并明确最终选用的模板文件',
                items: [
                  {
                    content:
                      '查找符合监管要求的模板文件，我将调用数据来源查询工具',
                    toolCall: {
                      icon: <Search className="size-4" />,
                      title: '数据来源查询',
                      content: '从数据来源中查询关于 IC - 265 的报告模板',
                    },
                    files: [{ icon: '📄', name: 'AI发展趋势.pdf' }],
                    // 自定义组件：表单预览（渲染在 files 之后）
                    render: (schema: unknown) => (
                      <DynamicForm schema={schema as FormSchema} />
                    ),
                    data: {
                      title: 'CSR 报告',
                      fields: [
                        { name: 'title', label: '报告标题', type: 'input' },
                        { name: 'version', label: '版本号', type: 'input' },
                        {
                          name: 'status',
                          label: '状态',
                          type: 'select',
                          options: [
                            { value: 'draft', label: '草稿' },
                            { value: 'final', label: '终版' },
                          ],
                        },
                      ],
                    } as FormSchema,
                  },
                  {
                    content:
                      '查找符合监管要求的模板文件，我将调用企业知识查询工具',
                    toolCall: {
                      icon: <Search className="size-4" />,
                      title: '企业知识查询',
                      content: '从企业知识库中查询关于“ IC - 265”的报告模板',
                    },
                    files: [{ icon: '📄', name: ' IC - 265.pdf' }],
                  },
                  {
                    content: '姓名：张三 | 学历：本科 | 工作年限：5年',
                    toolCall: {
                      icon: <BookOpen className="size-4" />,
                      title: '调取知识',
                      content: '正在调取知识库资料',
                    },
                    files: [
                      { icon: '📄', name: 'AI发展趋势.pdf' },
                      { icon: '📄', name: 'AI发展历史.doc' },
                    ],
                    render: (data: unknown) => (
                      <ConfirmReportPanel data={data as ConfirmPanelData} />
                    ),
                    data: {
                      text: '请从以下报告中选择一份作为最终结果，确认后将仅保留所选报告。',
                      status: 'pending',
                      cards: [
                        {
                          id: 'report-1',
                          title: '临床试验 CSR 报告',
                          description: '更新时间：02-12 10:35',
                          selected: true,
                        },
                        {
                          id: 'report-2',
                          title: 'IC-265 数据解析报告',
                          description: '更新时间：02-12 10:28',
                        },
                      ],
                    },
                  },
                ],
              },
              {
                key: 'step-2',
                status: 'success',
                title: '明确数据来源',
                items: [
                  {
                    content:
                      '查找符合监管要求的模板文件，我将调用企业知识查询工具',
                    toolCall: {
                      icon: <Search className="size-4" />,
                      title: '企业知识查询',
                      content: '从企业知识库中查询关于“ IC - 265”的报告模板',
                    },
                    render: (schema: unknown) => (
                      <DynamicForm schema={schema as FormSchema} />
                    ),
                    data: {
                      title: '补充信息',
                      fields: [
                        {
                          name: 'title',
                          label: '你关注的时间范围是多久？',
                          type: 'radio',
                          options: [
                            { value: '1-2', label: '短期 1-2 年' },
                            { value: '3-5', label: '中期 3-5 年' },
                            { value: '5-10', label: '长期 5-10 年' },
                          ],
                        },
                        {
                          name: 'title',
                          label: '你更关注哪些 AI 技术方向？',
                          type: 'radio',
                          options: [
                            { value: 'llm', label: '大模型' },
                            { value: 'multimodal', label: '多模态' },
                            { value: 'genai', label: '生成式 AI' },
                          ],
                        },
                      ],
                    } as FormSchema,
                  },
                ],
              },
              {
                key: 'step-3',
                status: 'success',
                title: '解析模板：读取模板文件并明确章节映射规则',
                items: [
                  {
                    content: '解析模板，我将调用文档解析工具',
                    toolCall: {
                      icon: <FileText className="size-4" />,
                      title: '文档解析',
                      content:
                        '现在我要开始解析模板，系统开始读取用户选择的“01--3.Chinese_CSR_v2.0_09Dec11 2 -SAMPLE-empty templet”',
                    },
                  },
                  {
                    content: '解析模板，我将调用章节识别工具',
                    toolCall: {
                      icon: <Search className="size-4" />,
                      title: '章节识别',
                      content:
                        '现在开始抽取模板文件的所有章节，并解析章节层级，确保获取到的目录结构正确，并建立章节树',
                    },
                  },
                  {
                    content: '解析模板，我将调用章节处理策略工具',
                    toolCall: {
                      icon: <Search className="size-4" />,
                      title: '章节处理策略',
                      content:
                        '将章节映射至对应的 ICH E3 / 等监管指南条款，明确该章节的合规定位与必填属性。',
                    },
                  },
                  {
                    content: '解析模板，我将调用语义匹配工具',
                    toolCall: {
                      icon: <Search className="size-4" />,
                      title: '语义匹配',
                      content:
                        '判断是否存在与当前章节高度相似可直接复用的段落，并给出相似度评分',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'text',
        text: '您可以点击报告卡片查阅或修改已生成的 IC-265 CSR临床试验报告，已自动化为您保存。',
      },
      {
        type: 'document-card',
        card: {
          title: 'IC-265 CSR临床试验报告',
          updateTime: '10:45',
        },
      },
      {
        type: 'text',
        text: '报告模板中的“10.2.4 治疗期”章节缺少必要的统计分析文件信息，无法一次性生成完成，建议邀请“统计专家”进入工作空间，补充必要性材料后继续。',
      },
    ],
    timestamp: Date.now() - 250000,
  },
]

// ============================================================================
// 主组件
// ============================================================================

interface DemoMessageItem extends MessageItem {
  status?: 'idle' | 'generating' | 'failed'
}

export function MessageList() {
  const defaultAvatarByRole: Record<
    MessageData['role'],
    NonNullable<MessageData['avatar']>
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
  const [messages, setMessages] = useState<MessageData[]>(mockMessages)

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
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id !== messageId) {
            return msg
          }

          if (Array.isArray(msg.content)) {
            let updated = false
            const nextContent = msg.content.map((item) => {
              if (
                typeof item === 'object' &&
                item.type === 'thinking' &&
                item.tasklist
              ) {
                updated = true
                return {
                  ...item,
                  tasklist: update(item.tasklist),
                }
              }
              return item
            })

            return updated ? { ...msg, content: nextContent } : msg
          }

          if (
            typeof msg.content !== 'object' ||
            msg.content.type !== 'thinking' ||
            !msg.content.tasklist
          ) {
            return msg
          }

          return {
            ...msg,
            content: {
              ...msg.content,
              tasklist: update(msg.content.tasklist),
            },
          }
        })
      )
    },
    []
  )

  const updateTasklist = useCallback(
    (
      messageId: string,
      update: (
        tasklist: Extract<
          MessageContent,
          {
            type: 'tasklist'
          }
        >
      ) => Extract<MessageContent, { type: 'tasklist' }>
    ) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id !== messageId) {
            return msg
          }

          if (Array.isArray(msg.content)) {
            let updated = false
            const nextContent = msg.content.map((item) => {
              if (typeof item === 'object' && item.type === 'tasklist') {
                updated = true
                return update(item)
              }
              return item
            })

            return updated ? { ...msg, content: nextContent } : msg
          }

          if (
            typeof msg.content !== 'object' ||
            msg.content.type !== 'tasklist'
          ) {
            return msg
          }

          return {
            ...msg,
            content: update(msg.content),
          }
        })
      )
    },
    []
  )

  const onShowCanvas = useCallback(() => {
    setShowCanvas(true)
  }, [setShowCanvas])
  const renderThinkingTaskList = (
    tasklist: NonNullable<
      Extract<
        MessageContent,
        {
          type: 'thinking'
        }
      >['tasklist']
    >,
    messageId: string
  ) => (
    <TaskList
      dataSource={tasklist.dataSource}
      title={tasklist.title || '待办清单'}
      status={tasklist.status || 'pending'}
      editable={tasklist.editable ?? true}
      onItemsChange={(items) => {
        console.log('待办事项更新:', items)
        updateThinkingTasklist(messageId, (prev) => ({
          ...prev,
          dataSource: items,
          status: 'pending' as const,
        }))
      }}
      onConfirmExecute={() => {
        console.log('确认执行')
        updateThinkingTasklist(messageId, (prev) => ({
          ...prev,
          status: 'confirmed' as const,
        }))
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
      editable={content.editable ?? true}
      onItemsChange={(items) => {
        console.log('待办事项更新:', items)
        updateTasklist(messageId, (prev) => ({
          ...prev,
          dataSource: items,
          status: 'pending' as const,
        }))
      }}
      onConfirmExecute={() => {
        console.log('确认执行')
        updateTasklist(messageId, (prev) => ({
          ...prev,
          status: 'confirmed' as const,
        }))
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

  const renderSteps = (content: Extract<MessageContent, { type: 'steps' }>) => (
    <div className="flex flex-col gap-2">
      {content.steps.map((step) => {
        const { key, ...props } = step
        return <ThinkingStepItem key={key} {...props} />
      })}
    </div>
  )

  const renderForm = (content: Extract<MessageContent, { type: 'form' }>) => (
    <DynamicForm
      schema={content.schema}
      onFinish={(values) => {
        console.log('表单提交:', values)
      }}
    />
  )

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

      case 'form':
        return renderForm(content)

      case 'steps':
        return renderSteps(content)

      case 'tasklist':
        return renderTaskList(content, messageId)

      case 'document-card':
        return renderDocumentCard(content)

      default:
        return null
    }
  }

  const renderedMessages: DemoMessageItem[] = messages.map((msg) => {
    const roleAvatar = defaultAvatarByRole[msg.role]
    const avatar = msg.avatar ?? roleAvatar

    return {
      id: msg.id,
      role: msg.role,
      content: renderContent(msg.content, msg.id) as React.ReactNode,
      timestamp: msg.timestamp,
      avatar: {
        src: avatar.src ?? roleAvatar.src,
        name: avatar.name ?? roleAvatar.name,
        time: avatar.time ?? roleAvatar.time,
      },
      feedback: (
        <MessageFeedbackActions
          role={msg.role}
          content={msg.content}
          align={msg.role === 'user' ? 'right' : 'left'}
        />
      ),
    }
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <MessageListComponent
          className="w-[800px] mx-auto"
          messages={renderedMessages}
          onMessageClick={(msg) => console.log('消息点击:', msg.id)}
          renderContent={(content) => content}
        />
      </div>
    </div>
  )
}
