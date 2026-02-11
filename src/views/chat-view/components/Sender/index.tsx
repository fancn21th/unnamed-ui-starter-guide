import { SenderResponsiveButtonGroup, SenderResponsiveSendButton } from "@/components/wuhan/blocks/sender-responsive-01";
import { ResponsiveSender } from "@/components/wuhan/composed/responsive-sender";
import { useState } from "react";

export default function Sender() {
    const [value, setValue] = useState("");
    const [overflowStatus, setOverflowStatus] = useState(false);
    const canSend = value.trim().length > 0;
    return (
        <ResponsiveSender
        value={value}
        onChange={setValue}
        placeholder="使用 buttonGroupChildren 自定义按钮内容"
        getCanSend={({ value: currentValue }) => currentValue.trim().length > 0}
        sendDisabled={!canSend}
        submitOnEnter
        onOverflowChange={setOverflowStatus}
        buttonGroupChildren={
          <SenderResponsiveButtonGroup isOverflow={overflowStatus}>
            <div className="pr-[var(--gap-sm)] pl-[var(--gap-sm)] gap-[var(--gap-sm)] rounded-[var(--radius-sm)] bg-[var(--bg-neutral-light)]">
              <span className="font-size-1 text-[var(--text-secondary)]">
                0个数据源
              </span>
            </div>
            <SenderResponsiveSendButton type="submit" disabled={!canSend} />
          </SenderResponsiveButtonGroup>
        }
      />
    );
}