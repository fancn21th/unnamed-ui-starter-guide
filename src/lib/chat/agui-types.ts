/**
 * AG-UI 适配器类型定义
 *
 * 本文件定义 AG-UI 协议与组件库之间的数据类型。
 * - AG-UI 协议类型：后端发送的事件格式（固定）
 * - 组件库类型：前端期望的数据结构（可替换为你的组件库）
 */

import type { ThinkingStepContentBlock } from '@/components/wuhan/composed/thinking-process'
import type { TodoItem } from '@/components/wuhan/composed/task-list'

// ============================================================================
// 组件库数据结构（可替换）
// ============================================================================

export type MessageContent =
  | { type: 'text'; text: string }
  | {
      type: 'thinking'
      blocks: ThinkingStepContentBlock[]
      title: string
      status?: 'pending' | 'thinking' | 'running' | 'completed' | 'success' | 'error'
      tasklist?: {
        dataSource: TodoItem[]
        title?: string
        status?: 'pending' | 'confirmed'
        editable?: boolean
      }
    }
  | {
      type: 'tasklist'
      dataSource: TodoItem[]
      title?: string
      status?: 'pending' | 'confirmed'
      editable?: boolean
    }
  | { type: 'document-card'; card: { title: string; updateTime: string } }

export interface MessageData {
  id: string
  role: 'user' | 'ai'
  content: string | MessageContent | Array<string | MessageContent>
  timestamp: number
  status?: 'idle' | 'generating' | 'failed'
}

// ============================================================================
// AG-UI 协议类型（固定）
// ============================================================================

export interface AGUIEvent {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/** 
 * 恢复流时的 payload
 * 注意：后端实际接口为 POST /agui/user-input，body格式为：
 * { threadId, runId, userInput: { ...formData/tasklistData/selectedCardId } }
 * 这里保持原有接口设计，在 chat-context 中统一转换
 */
export interface ResumeStreamPayload {
  /** 表单数据（来自 dynamic_form） */
  formData?: Record<string, unknown>
  /** 任务列表数据（来自 tasklist） */
  tasklistData?: TodoItem[]
  /** 选中的卡片ID（来自 confirm_panel） */
  selectedCardId?: string
}

// ============================================================================
// 步骤项自定义类型（由 MessageList 根据 customType 渲染）
// ============================================================================

/** dynamic_form 步骤项数据 */
export interface DynamicFormItemData {
  schema: { title?: string; fields?: unknown[] }
  formId: string
  status?: 'pending' | 'confirmed'
}

/** confirm_panel 步骤项数据 */
export interface ConfirmPanelItemData {
  text: string
  cards: Array<{ id?: string; title?: string; description?: string }>
  panelId: string
  selectedId?: string | null
  status?: 'pending' | 'confirmed'
}

// ============================================================================
// 适配器配置
// ============================================================================

export interface AGUIAdapterOptions {
  /** 是否输出调试日志，默认 false */
  debug?: boolean
  /** 模块加载失败时的最大重试次数，默认 0 */
  moduleRetryLimit?: number
}
