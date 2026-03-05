/**
 * 合并用户已确认状态
 *
 * AG-UI 协议中 resume 是客户端发起的，后端不会回传「用户已确认」事件。
 * Adapter 的流式更新会覆盖整条消息，导致用户确认的 TaskList/Form/ConfirmPanel 状态丢失。
 * 本函数在 Adapter 更新时合并：以 incoming 为基准，保留 existing 中用户已确认的状态。
 */

import type { MessageData, MessageContent } from './agui-types'
import type { ThinkingStepContentBlock } from '@/components/wuhan/composed/thinking-process'

/** 步骤项（含 customType 和 data） */
interface StepItemWithCustom {
  key?: string
  customType?: 'dynamic_form' | 'confirm_panel'
  data?: { status?: 'pending' | 'confirmed'; [k: string]: unknown }
  [k: string]: unknown
}

/**
 * 合并两个消息：以 incoming 为基准，保留 existing 中用户已确认的 UI 状态
 */
export function mergePreservingUserConfirmedState(
  existing: MessageData,
  incoming: MessageData
): MessageData {
  if (existing.id !== incoming.id) return incoming

  const mergedContent = mergeContent(existing.content, incoming.content)
  return {
    ...incoming,
    content: mergedContent,
  }
}

function mergeContent(
  existing: MessageData['content'],
  incoming: MessageData['content']
): MessageData['content'] {
  if (Array.isArray(incoming)) {
    const existingArr = Array.isArray(existing) ? existing : [existing]
    return incoming.map((item, i) => {
      const prev = existingArr[i]
      if (prev === undefined) return item
      return mergeContentItem(prev, item)
    })
  }

  if (typeof incoming === 'string') return incoming
  return mergeContentItem(
    typeof existing === 'string' || Array.isArray(existing) ? null : existing,
    incoming
  )
}

function mergeContentItem(
  existing: string | MessageContent | null,
  incoming: string | MessageContent
): string | MessageContent {
  if (typeof incoming === 'string') return incoming
  if (!existing || typeof existing === 'string') return incoming

  if (incoming.type === 'thinking') {
    return mergeThinking(
      existing.type === 'thinking' ? existing : null,
      incoming
    )
  }

  if (incoming.type === 'tasklist') {
    return mergeTasklist(
      existing.type === 'tasklist' ? existing : null,
      incoming
    )
  }

  return incoming
}

/** 合并 thinking：保留 tasklist 和 step items 的已确认状态 */
function mergeThinking(
  existing: Extract<MessageContent, { type: 'thinking' }> | null,
  incoming: Extract<MessageContent, { type: 'thinking' }>
): Extract<MessageContent, { type: 'thinking' }> {
  let tasklist = incoming.tasklist
  if (existing?.tasklist?.status === 'confirmed') {
    tasklist = { ...existing.tasklist, status: 'confirmed', editable: false }
  }

  const blocks = mergeThinkingBlocks(existing?.blocks ?? [], incoming.blocks)

  return {
    ...incoming,
    tasklist,
    blocks,
  }
}

/** 合并 thinking.blocks：保留 step items 中 dynamic_form/confirm_panel 的已确认状态 */
function mergeThinkingBlocks(
  existingBlocks: ThinkingStepContentBlock[],
  incomingBlocks: ThinkingStepContentBlock[]
): ThinkingStepContentBlock[] {
  return incomingBlocks.map((block) => {
    if (block.type !== 'subSteps') return block

    const existingSubSteps = existingBlocks.find(
      (b) => b.type === 'subSteps' && b.key === block.key
    )
    const existingSteps =
      existingSubSteps?.type === 'subSteps' ? existingSubSteps.steps : []

    return {
      ...block,
      steps: block.steps.map((step) => {
        const stepKey = (step as { key?: string }).key
        const existingStep = existingSteps.find(
          (s) => (s as { key?: string }).key === stepKey
        )
        if (!existingStep?.items?.length) return step

        const mergedItems = (step.items ?? []).map((item) => {
          const itemWithCustom = item as StepItemWithCustom
          if (
            itemWithCustom.customType !== 'dynamic_form' &&
            itemWithCustom.customType !== 'confirm_panel'
          ) {
            return item
          }

          const existingItem = (existingStep.items ?? []).find(
            (i) => (i as StepItemWithCustom).key === itemWithCustom.key
          ) as StepItemWithCustom | undefined

          if (existingItem?.data?.status === 'confirmed') {
            return {
              ...item,
              data: {
                ...itemWithCustom.data,
                ...existingItem.data,
                status: 'confirmed' as const,
              },
            }
          }
          return item
        })

        return { ...step, items: mergedItems }
      }),
    }
  })
}

/** 合并 tasklist：保留已确认状态 */
function mergeTasklist(
  existing: Extract<MessageContent, { type: 'tasklist' }> | null,
  incoming: Extract<MessageContent, { type: 'tasklist' }>
): Extract<MessageContent, { type: 'tasklist' }> {
  if (existing?.status === 'confirmed') {
    return {
      ...incoming,
      status: 'confirmed',
      editable: false,
    }
  }
  return incoming
}
