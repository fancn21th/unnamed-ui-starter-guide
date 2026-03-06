/**
 * 消息发送组件
 * 使用 ChatContext
 */

import { SenderResponsiveButtonGroup, SenderResponsiveSendButton } from '@/components/wuhan/blocks/sender-responsive-01'
import { ResponsiveSender } from '@/components/wuhan/composed/responsive-sender'
import { useState, useCallback } from 'react'
import { useChatContext } from '@/lib/chat'

export default function Sender() {
  const { sendMessage, isLoading } = useChatContext()
  const [value, setValue] = useState('')
  const [overflowStatus, setOverflowStatus] = useState(false)
  const canSend = value.trim().length > 0 && !isLoading

  const handleSubmit = useCallback(
    (context: { value: string }) => {
      const text = context.value.trim()
      if (!text) return
      sendMessage(text)
      setValue('')
    },
    [sendMessage]
  )

  return (
    <ResponsiveSender
      className="w-[800px] mx-auto"
      value={value}
      onChange={setValue}
      placeholder="输入消息，按 Enter 发送"
      getCanSend={({ value: currentValue }) => currentValue.trim().length > 0}
      sendDisabled={!canSend}
      generating={isLoading}
      submitOnEnter
      onOverflowChange={setOverflowStatus}
      onSubmit={handleSubmit}
      buttonGroupChildren={
        <SenderResponsiveButtonGroup isOverflow={overflowStatus}>
          <div className="pr-[var(--gap-sm)] pl-[var(--gap-sm)] gap-[var(--gap-sm)] rounded-[var(--radius-sm)] bg-[var(--bg-neutral-light)]">
            <span className="font-size-1 text-[var(--text-secondary)]">0个数据源</span>
          </div>
          <SenderResponsiveSendButton type="submit" disabled={!canSend} generating={isLoading} />
        </SenderResponsiveButtonGroup>
      }
    />
  )
}
