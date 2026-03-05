/**
 * AG-UI 事件适配器
 *
 * 将后端的 AG-UI 协议事件转换为组件库的 MessageContent 结构。
 * 本文件作为「组件库对接 AG-UI」的参考范例。
 *
 * ============================================================================
 * AG-UI 事件 → 组件库结构 映射表
 * ============================================================================
 *
 * | AG-UI 事件                  | 组件库映射
 * |----------------------------|----------------------------------------------------------
 * | RUN_STARTED                | 创建 MessageData (role: ai, status: generating)
 * | TEXT_MESSAGE_*             | MessageContent { type: 'text' } 或 step.items 中的文本
 * | THINKING_START             | MessageContent { type: 'thinking', blocks: [] }
 * | THINKING_TEXT_MESSAGE_*    | thinking.blocks 中的 intro 文本块
 * | STEP_STARTED               | ThinkingStepItem 加入 subSteps
 * | TOOL_CALL_START            | step.items 中的 toolCall item
 * | TOOL_CALL_ARGS             | 设置 item.content（调用原因）
 * | TOOL_CALL_RESULT           | 更新 toolCall.content、item.files
 * | STATE_SNAPSHOT             | thinking.tasklist
 * | CUSTOM: dynamic_form       | 产出 { customType, data }，由 MessageList 渲染 DynamicForm
 * | CUSTOM: confirm_panel      | 产出 { customType, data }，由 MessageList 渲染 ConfirmPanel
 * | CUSTOM: document_card      | MessageContent { type: 'document-card' }
 * | RUN_FINISHED               | 完成消息，调用 onMessageComplete
 *
 * ============================================================================
 * 可替换部分（接入你的组件库时修改）
 * ============================================================================
 *
 * - ThinkingStepItemProps, ThinkingStepContentBlock → 你的步骤组件类型
 * - ReportCard, DynamicForm, ConfirmPanel → 你的交互组件
 * - MessageContent, TodoItem → 你的消息/任务数据结构
 *
 * ============================================================================
 * AG-UI 协议固定部分（对接 AG-UI 时无需修改）
 * ============================================================================
 *
 * - 事件名：RUN_STARTED, THINKING_START, STEP_STARTED, TOOL_CALL_* 等
 * - 字段名：stepId, toolCallId, delta, event.value 等
 */

import React from 'react'
import { Database, FileText, Search, Sparkles, Zap, Box } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ThinkingStepItemProps } from '@/components/wuhan/composed/thinking-step-item'
import type { ThinkingStepContentBlock } from '@/components/wuhan/composed/thinking-process'
import type {
  AGUIEvent,
  MessageContent,
  MessageData,
  ResumeStreamPayload,
  AGUIAdapterOptions,
} from './agui-types'

// Re-export types for backward compatibility
export type {
  MessageContent,
  MessageData,
  AGUIEvent,
  ResumeStreamPayload,
  AGUIAdapterOptions,
  DynamicFormItemData,
  ConfirmPanelItemData,
} from './agui-types'

// ============================================================================
// 工具图标（按 toolName 稳定映射，同一工具始终显示相同图标）
// ============================================================================

const TOOL_ICONS: LucideIcon[] = [Database, FileText, Search, Sparkles, Zap, Box]

function getToolIcon(toolName: string): React.ReactNode {
  let hash = 0
  for (let i = 0; i < toolName.length; i++) {
    hash = (hash << 5) - hash + toolName.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % TOOL_ICONS.length
  const Icon = TOOL_ICONS[index]
  return React.createElement(Icon, { className: 'size-4' })
}

// ============================================================================
// 适配器内部状态
// ============================================================================

interface ToolCallRecord {
  toolCallId: string
  toolName: string
  args: string
  result: unknown
  stepId: string | null
}

interface AdapterState {
  currentMessage: MessageData | null
  currentContentBlocks: Array<string | MessageContent>
  currentThinking: Extract<MessageContent, { type: 'thinking' }> | null
  currentSteps: Map<string, ThinkingStepItemProps & { key: string }>
  currentToolCalls: Map<string, ToolCallRecord>
  currentTextBlock: string
  thinkingTextAccumulator: string
  threadId: string
  runId: string
  currentStepId: string | null
}

const createInitialState = (): AdapterState => ({
  currentMessage: null,
  currentContentBlocks: [],
  currentThinking: null,
  currentSteps: new Map(),
  currentToolCalls: new Map(),
  currentTextBlock: '',
  thinkingTextAccumulator: '',
  threadId: '',
  runId: '',
  currentStepId: null,
})

// ============================================================================
// AGUIAdapter
// ============================================================================

export class AGUIAdapter {
  private state: AdapterState = createInitialState()
  private onMessageUpdate: (message: MessageData) => void
  private onMessageComplete: (message: MessageData) => void
  private onResumeStream?: (payload?: ResumeStreamPayload) => Promise<void>
  private debug: boolean

  constructor(
    onMessageUpdate: (message: MessageData) => void,
    onMessageComplete: (message: MessageData) => void,
    onResumeStream?: (payload?: ResumeStreamPayload) => Promise<void>,
    options?: AGUIAdapterOptions
  ) {
    this.onMessageUpdate = onMessageUpdate
    this.onMessageComplete = onMessageComplete
    this.onResumeStream = onResumeStream
    this.debug = options?.debug ?? false
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[AGUIAdapter]', ...args)
    }
  }

  /** 触发消息更新，传入新对象引用以确保 React 能检测到变化 */
  private emitMessageUpdate(): void {
    if (!this.state.currentMessage) return
    this.onMessageUpdate({ ...this.state.currentMessage })
  }

  private warn(...args: unknown[]): void {
    if (this.debug) {
      console.warn('[AGUIAdapter]', ...args)
    }
  }

  handleEvent(event: AGUIEvent): void {
    this.log('Event:', event.type, event)

    switch (event.type) {
      case 'RUN_STARTED':
        this.handleRunStarted(event)
        break
      case 'RUN_FINISHED':
        this.handleRunFinished(event)
        break
      case 'TEXT_MESSAGE_START':
        this.handleTextMessageStart(event)
        break
      case 'TEXT_MESSAGE_CONTENT':
        this.handleTextMessageContent(event)
        break
      case 'TEXT_MESSAGE_END':
        this.handleTextMessageEnd(event)
        break
      case 'THINKING_START':
        this.handleThinkingStart(event)
        break
      case 'THINKING_TEXT_MESSAGE_START':
        this.handleThinkingTextMessageStart(event)
        break
      case 'THINKING_TEXT_MESSAGE_CONTENT':
        this.handleThinkingTextMessageContent(event)
        break
      case 'THINKING_TEXT_MESSAGE_END':
        this.handleThinkingTextMessageEnd(event)
        break
      case 'THINKING_END':
        this.handleThinkingEnd(event)
        break
      case 'STEP_STARTED':
        this.handleStepStarted(event)
        break
      case 'STEP_FINISHED':
        this.handleStepFinished(event)
        break
      case 'TOOL_CALL_START':
        this.handleToolCallStart(event)
        break
      case 'TOOL_CALL_ARGS':
        this.handleToolCallArgs(event)
        break
      case 'TOOL_CALL_RESULT':
        this.handleToolCallResult(event)
        break
      case 'TOOL_CALL_END':
        this.handleToolCallEnd(event)
        break
      case 'STATE_SNAPSHOT':
        this.handleStateSnapshot(event)
        break
      case 'CUSTOM':
        this.handleCustom(event)
        break
      default:
        this.warn('Unknown event type:', event.type)
    }
  }

  reset(): void {
    this.state = createInitialState()
  }

  // --------------------------------------------------------------------------
  // 基础事件
  // --------------------------------------------------------------------------

  private handleRunStarted(_event: AGUIEvent): void {
    this.state.currentMessage = {
      id: `msg-${Date.now()}`,
      role: 'ai',
      content: [],
      timestamp: Date.now(),
      status: 'generating',
    }
    this.state.currentContentBlocks = []
    this.emitMessageUpdate()
  }

  private handleRunFinished(_event: AGUIEvent): void {
    if (!this.state.currentMessage) return

    if (this.state.currentTextBlock) {
      this.state.currentContentBlocks.push(this.state.currentTextBlock)
      this.state.currentTextBlock = ''
    }

    this.state.currentMessage.content =
      this.state.currentContentBlocks.length === 1
        ? this.state.currentContentBlocks[0]
        : this.state.currentContentBlocks
    this.state.currentMessage.status = 'idle'
    this.onMessageComplete({ ...this.state.currentMessage })

    this.state.currentMessage = null
    this.state.currentContentBlocks = []
    this.state.currentThinking = null
    this.state.currentSteps.clear()
    this.state.currentToolCalls.clear()
  }

  private handleTextMessageStart(_event: AGUIEvent): void {
    this.state.currentTextBlock = ''
  }

  private handleTextMessageContent(event: AGUIEvent): void {
    this.state.currentTextBlock += event.delta || ''

    if (this.state.currentStepId) {
      const step = this.state.currentSteps.get(this.state.currentStepId)
      if (step) {
        const messageId = event.messageId || 'temp-text'
        let textItem = step.items?.find((item) => item.key === messageId)
        if (!textItem) {
          step.items = step.items || []
          textItem = { key: messageId, content: this.state.currentTextBlock }
          step.items.push(textItem)
        } else {
          textItem.content = this.state.currentTextBlock
        }
        this.updateStepInThinking(this.state.currentStepId, step)
      }
    }

    if (this.state.currentMessage) {
      // 当文本属于 step 时，由 updateStepInThinking -> updateCurrentMessage 处理，此处跳过避免重复
      if (!this.state.currentStepId) {
        const tempBlocks = [...this.state.currentContentBlocks]
        if (this.state.currentTextBlock) tempBlocks.push(this.state.currentTextBlock)
        this.state.currentMessage.content = tempBlocks.length === 1 ? tempBlocks[0] : tempBlocks
        this.emitMessageUpdate()
      }
    }
  }

  private handleTextMessageEnd(_event: AGUIEvent): void {
    if (this.state.currentStepId) {
      this.state.currentTextBlock = ''
      return
    }
    if (this.state.currentTextBlock) {
      this.state.currentContentBlocks.push(this.state.currentTextBlock)
      this.state.currentTextBlock = ''
    }
    if (this.state.currentMessage) {
      this.state.currentMessage.content =
        this.state.currentContentBlocks.length === 1
          ? this.state.currentContentBlocks[0]
          : this.state.currentContentBlocks
      this.emitMessageUpdate()
    }
  }

  // --------------------------------------------------------------------------
  // 思考流程
  // --------------------------------------------------------------------------

  private handleThinkingStart(_event: AGUIEvent): void {
    this.state.currentThinking = {
      type: 'thinking',
      title: '思考中...',
      status: 'thinking',
      blocks: [],
      tasklist: undefined,
    }
    this.state.thinkingTextAccumulator = ''
    // 立即显示思考块，避免等待首个 THINKING_TEXT_MESSAGE 或 STEP 才出现
    this.updateCurrentMessage()
  }

  private handleThinkingTextMessageStart(_event: AGUIEvent): void {
    this.state.thinkingTextAccumulator = ''
  }

  private handleThinkingTextMessageContent(event: AGUIEvent): void {
    this.state.thinkingTextAccumulator += event.delta || ''
    if (!this.state.currentThinking || !this.state.currentMessage) return

    const blocks = [...this.state.currentThinking.blocks]
    const textBlockIndex = blocks.findIndex((b) => b.type === 'text' && b.key === 'intro')
    const introBlock = { type: 'text' as const, key: 'intro' as const, content: this.state.thinkingTextAccumulator }
    if (textBlockIndex >= 0) {
      blocks[textBlockIndex] = introBlock
    } else {
      blocks.unshift(introBlock)
    }
    this.state.currentThinking.blocks = blocks
    this.updateCurrentMessage()
  }

  private handleThinkingTextMessageEnd(_event: AGUIEvent): void {
    // 引言文本结束，无额外操作
  }

  private handleThinkingEnd(_event: AGUIEvent): void {
    if (!this.state.currentThinking) return

    const completedThinking: Extract<MessageContent, { type: 'thinking' }> = {
      ...this.state.currentThinking,
      status: 'completed',
      title: '思考完成',
    }
    this.state.currentContentBlocks.push(completedThinking)
    this.state.currentThinking = null
    this.state.currentSteps.clear()
    this.state.currentToolCalls.clear()

    if (this.state.currentMessage) {
      this.state.currentMessage.content =
        this.state.currentContentBlocks.length === 1
          ? this.state.currentContentBlocks[0]
          : this.state.currentContentBlocks
      this.emitMessageUpdate()
    }
  }

  private handleStepStarted(event: AGUIEvent): void {
    const stepId = event.stepId || `step-${Date.now()}`
    const stepIndex = event.stepIndex ?? 0
    const title = event.stepName || event.title || `步骤 ${stepIndex + 1}`

    this.state.currentStepId = stepId
    const step: ThinkingStepItemProps & { key: string } = {
      key: stepId,
      status: 'running',
      title,
      items: [],
    }
    this.state.currentSteps.set(stepId, step)

    if (this.state.currentThinking && this.state.currentMessage) {
      const blocks = [...this.state.currentThinking.blocks]
      let subStepsBlock = blocks.find((b) => b.type === 'subSteps' && b.key === 'steps')
      if (!subStepsBlock) {
        subStepsBlock = { type: 'subSteps', key: 'steps', steps: [] }
        blocks.push(subStepsBlock)
      }
      const subSteps = subStepsBlock as Extract<ThinkingStepContentBlock, { type: 'subSteps' }>
      subSteps.steps.push(step)
      this.state.currentThinking.blocks = blocks
      this.updateCurrentMessage()
    }
  }

  private handleStepFinished(event: AGUIEvent): void {
    const stepId = event.stepId
    if (!stepId) return

    const step = this.state.currentSteps.get(stepId)
    if (step) {
      const newStatus: 'error' | 'success' = event.status === 'error' ? 'error' : 'success'
      const updatedStep = { ...step, status: newStatus }
      this.state.currentSteps.set(stepId, updatedStep)
      this.updateStepInThinking(stepId, updatedStep)
    }
    if (this.state.currentStepId === stepId) {
      this.state.currentStepId = null
    }
  }

  // --------------------------------------------------------------------------
  // 工具调用
  // --------------------------------------------------------------------------

  private handleToolCallStart(event: AGUIEvent): void {
    const toolCallId = event.toolCallId || `tool-${Date.now()}`
    const toolName = event.toolCallName || event.toolName || 'Unknown Tool'
    const stepId = event.stepId || this.state.currentStepId

    const toolCall: ToolCallRecord = {
      toolCallId,
      toolName,
      args: '',
      result: null,
      stepId,
    }
    this.state.currentToolCalls.set(toolCallId, toolCall)

    if (stepId) {
      const step = this.state.currentSteps.get(stepId)
      if (step) {
        step.items = step.items || []
        step.items.push({
          key: toolCallId,
          content: '',
          toolCall: {
            icon: getToolIcon(toolName),
            title: toolName,
            content: '执行中...',
          },
        })
        this.updateStepInThinking(stepId, step)
      }
    }
  }

  private handleToolCallArgs(event: AGUIEvent): void {
    const toolCallId = event.toolCallId
    if (!toolCallId) return

    const toolCall = this.state.currentToolCalls.get(toolCallId)
    if (!toolCall?.stepId) return

    // 支持多种格式：description、args.description、delta（流式）、args 字符串
    let description: string | undefined = event.description || event.args?.description
    if (!description && event.delta) {
      toolCall.args += event.delta
      try {
        const parsed = JSON.parse(toolCall.args) as { description?: string; [k: string]: unknown }
        description = parsed.description ?? toolCall.args
      } catch {
        description = toolCall.args || undefined
      }
    } else if (!description && typeof event.args === 'string') {
      try {
        const parsed = JSON.parse(event.args) as { description?: string; [k: string]: unknown }
        description = parsed.description ?? event.args
      } catch {
        description = event.args
      }
    }
    const step = this.state.currentSteps.get(toolCall.stepId)
    const item = step?.items?.find((i) => i.key === toolCallId)
    if (item && step) {
      if (description) item.content = description
      this.updateStepInThinking(toolCall.stepId, step)
    }
  }

  private handleToolCallResult(event: AGUIEvent): void {
    const toolCallId = event.toolCallId
    if (!toolCallId) return

    const toolCall = this.state.currentToolCalls.get(toolCallId)
    if (!toolCall?.stepId) return

    toolCall.result = event.content || event.result || ''
    const step = this.state.currentSteps.get(toolCall.stepId)
    const item = step?.items?.find((i) => i.key === toolCallId)
    if (item?.toolCall && step) {
      item.toolCall.content = event.content || toolCall.result
      if (event.result?.files && Array.isArray(event.result.files)) {
        item.files = event.result.files.map((file: { icon?: unknown; name?: string; status?: string }) => ({
          icon: file.icon,
          name: file.name ?? '',
          status: file.status || 'success',
        }))
      }
      this.updateStepInThinking(toolCall.stepId, step)
    }
  }

  private handleToolCallEnd(event: AGUIEvent): void {
    if (event.toolCallId) {
      this.state.currentToolCalls.delete(event.toolCallId)
    }
  }

  // --------------------------------------------------------------------------
  // 状态快照
  // --------------------------------------------------------------------------

  private handleStateSnapshot(event: AGUIEvent): void {
    const state = event.state
    if (!state?.tasklist && !state?.todos) return

    const existingTasklist = this.state.currentThinking?.tasklist
    if (existingTasklist?.status === 'confirmed') return

    const todos = state.tasklist || state.todos
    const isEditable = event.tasklistEditable !== false
    const tasklist = {
      dataSource: Array.isArray(todos)
        ? todos.map((todo: { id?: string; content?: string; text?: string; title?: string; order?: number }, i: number) => ({
            id: todo.id ?? `${i}`,
            content: todo.content || todo.text || todo.title || '',
            order: todo.order ?? i + 1,
          }))
        : [],
      title: '待办清单',
      status: isEditable ? ('pending' as const) : ('confirmed' as const),
      editable: isEditable,
    }

    if (this.state.currentThinking && this.state.currentMessage) {
      this.state.currentThinking.tasklist = tasklist
      const blocks = [...this.state.currentThinking.blocks]
      let tasklistBlock = blocks.find((b) => b.type === 'node' && b.key === 'tasklist')
      if (!tasklistBlock) {
        tasklistBlock = { type: 'node', key: 'tasklist', node: null }
        const introIndex = blocks.findIndex((b) => b.key === 'intro')
        blocks.splice(introIndex >= 0 ? introIndex + 1 : 0, 0, tasklistBlock)
      }
      this.state.currentThinking.blocks = blocks
      this.updateCurrentMessage()
    }
  }

  // --------------------------------------------------------------------------
  // CUSTOM 事件（组件库扩展点）
  // --------------------------------------------------------------------------

  /**
   * 确保 CUSTOM 事件有可用的 stepId，无则创建或复用最后一步
   */
  private ensureStepForCustomEvent(
    stepId: string | null,
    fallbackTitle: string,
    fallbackStepIdPrefix: string
  ): string | null {
    if (stepId) return stepId
    const steps = Array.from(this.state.currentSteps.entries())
    if (steps.length > 0) return steps[steps.length - 1][0]

    const newStepId = `${fallbackStepIdPrefix}-${Date.now()}`
    const newStep: ThinkingStepItemProps & { key: string } = {
      key: newStepId,
      title: fallbackTitle,
      items: [],
      status: 'running',
    }
    this.state.currentSteps.set(newStepId, newStep)
    this.state.currentStepId = newStepId

    if (this.state.currentThinking) {
      const blocks = [...this.state.currentThinking.blocks]
      let subStepsBlock = blocks.find((b) => b.type === 'subSteps' && b.key === 'steps')
      if (!subStepsBlock) {
        subStepsBlock = { type: 'subSteps', key: 'steps', steps: [] }
        blocks.push(subStepsBlock)
      }
      const subSteps = subStepsBlock as Extract<ThinkingStepContentBlock, { type: 'subSteps' }>
      subSteps.steps.push(newStep)
      this.state.currentThinking.blocks = blocks
    }
    return newStepId
  }

  private handleCustom(event: AGUIEvent): void {
    if (event.name === 'dynamic_form' && event.value) {
      this.handleCustomDynamicForm(event)
      return
    }
    if (event.name === 'confirm_panel' && event.value) {
      this.handleCustomConfirmPanel(event)
      return
    }
    if (event.name === 'document_card' && event.value) {
      this.handleCustomDocumentCard(event)
    }
  }

  private handleCustomDynamicForm(event: AGUIEvent): void {
    const stepId = this.ensureStepForCustomEvent(
      event.stepId || this.state.currentStepId,
      '填写表单',
      'form-step'
    )
    if (!stepId) return

    const step = this.state.currentSteps.get(stepId)
    if (!step) return

    const formId = `form-${Date.now()}`
    const formItem = {
      key: formId,
      customType: 'dynamic_form' as const,
      data: {
        schema: { title: event.value.title, fields: event.value.fields || [] },
        formId,
        status: 'pending' as const,
      },
    }

    step.items = step.items || []
    step.items.push(formItem)
    this.updateStepInThinking(stepId, step)
  }

  private handleCustomConfirmPanel(event: AGUIEvent): void {
    const stepId = this.ensureStepForCustomEvent(
      event.stepId || this.state.currentStepId,
      '确认选择',
      'confirm-step'
    )
    if (!stepId) return

    const step = this.state.currentSteps.get(stepId)
    if (!step) return

    const panelId = `confirm-panel-${Date.now()}`
    const cards = event.value.cards || []
    const text = event.value.text || '请选择一个选项：'

    const panelItem = {
      key: panelId,
      customType: 'confirm_panel' as const,
      data: {
        text,
        cards,
        panelId,
        selectedId: null as string | null,
        status: 'pending' as const,
      },
    }

    step.items = step.items || []
    step.items.push(panelItem)
    this.updateStepInThinking(stepId, step)
  }

  private handleCustomDocumentCard(event: AGUIEvent): void {
    const documentCard: MessageContent = {
      type: 'document-card',
      card: {
        title: event.value.title || 'Document',
        updateTime: event.value.updateTime || '',
      },
    }
    this.state.currentContentBlocks.push(documentCard)
    if (this.state.currentMessage) {
      this.state.currentMessage.content =
        this.state.currentContentBlocks.length === 1
          ? this.state.currentContentBlocks[0]
          : this.state.currentContentBlocks
      this.emitMessageUpdate()
    }
  }

  // --------------------------------------------------------------------------
  // 辅助方法
  // --------------------------------------------------------------------------

  private updateStepInThinking(stepId: string, step: ThinkingStepItemProps & { key: string }): void {
    if (!this.state.currentThinking || !this.state.currentMessage) return
    const blocks = [...this.state.currentThinking.blocks]
    const subStepsBlock = blocks.find((b) => b.type === 'subSteps' && b.key === 'steps')
    if (!subStepsBlock) return

    const subSteps = subStepsBlock as Extract<ThinkingStepContentBlock, { type: 'subSteps' }>
    const idx = subSteps.steps.findIndex((s) => s.key === stepId)
    if (idx >= 0) {
      subSteps.steps[idx] = step
      this.state.currentThinking.blocks = blocks
      this.updateCurrentMessage()
    }
  }

  private updateCurrentMessage(): void {
    if (!this.state.currentMessage) return
    const tempBlocks = [...this.state.currentContentBlocks]
    if (this.state.currentThinking) tempBlocks.push(this.state.currentThinking)
    // 当文本属于 step 时，不加入主内容区（step 内已展示，避免重复）
    if (this.state.currentTextBlock && !this.state.currentStepId) {
      tempBlocks.push(this.state.currentTextBlock)
    }
    this.state.currentMessage.content = tempBlocks.length === 1 ? tempBlocks[0] : tempBlocks
    this.emitMessageUpdate()
  }
}
