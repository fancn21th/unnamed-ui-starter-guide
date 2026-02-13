import { CheckCircle2, Circle, Loader2 } from "lucide-react";

import {
  TaskCard,
  type TaskCardItem,
} from "@/components/wuhan/composed/task-card";

import { initialItems } from "./mock-data";
import { useState } from "react";

// 根据状态获取图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-[var(--text-success)]" />;
    case "running":
      return (
        <Loader2 className="size-4 text-[var(--text-brand)] animate-spin" />
      );
    case "pending":
    default:
      return <Circle className="size-4 text-[var(--text-tertiary)]" />;
  }
};

export function TaskView() {
  const [isOpen, setIsOpen] = useState(false);

  // 获取当前进行中的步骤
  const currentItem =
    initialItems.find((item) => item.status === "running") ||
    initialItems.find((item) => item.status === "pending");

  // 当前步骤的图标和文本
  const currentStepIcon = currentItem
    ? getStatusIcon(currentItem.status)
    : null;
  const currentStepText = currentItem?.text || "暂无任务";

  return (
    <div className="relative w-full h-full">
      <TaskCard
        title="招聘流程"
        stepText={currentStepText}
        stepIcon={currentStepIcon}
        items={initialItems as TaskCardItem[]}
        open={isOpen}
        onOpenChange={setIsOpen}
        containerClassName="absolute w-full z-10 top-[4px]"
      />
    </div>
  );
}
