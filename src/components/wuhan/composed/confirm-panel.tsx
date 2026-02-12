"use client";

import * as React from "react";
import {
  ConfirmPanelContainerPrimitive,
  ConfirmPanelHeaderPrimitive,
  ConfirmPanelTitlePrimitive,
  ConfirmPanelFooterPrimitive,
} from "@/components/wuhan/blocks/confirm-panel-01";
import { StatusTag } from "@/components/wuhan/composed/status-tag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ==================== 类型定义 ====================

/**
 * 确认面板组件的属性类型定义
 * @public
 */
export interface ConfirmPanelProps {
  /** 标题 */
  title?: string;
  /** 状态 - 仅支持 pending 和 confirmed */
  status?: "pending" | "confirmed";
  /** 内容 */
  children?: React.ReactNode;
  /** 内容区域自定义类名 */
  contentClassName?: string;
  /** 内容区域自定义样式 */
  contentStyle?: React.CSSProperties;
  /** 确认按钮文字 */
  confirmButtonText?: string;
  /** 操作按钮列表（位于确认按钮左侧） */
  actions?: React.ReactNode[];
  /** 确认执行操作的回调函数 */
  onConfirm?: () => void;
  /** 容器自定义类名 */
  className?: string;
}

// ==================== 主组件 ====================

/**
 * 确认面板组件
 *
 * 用于需要用户确认的操作场景，提供清晰的确认界面和操作选项。
 * 支持状态显示和自定义操作按钮。
 *
 * @example
 * ```tsx
 * <ConfirmPanel
 *   title="删除确认"
 *   status="pending"
 *   confirmButtonText="确认删除"
 *   onConfirm={() => console.log("确认删除")}
 * >
 *   <p>确定要删除这条记录吗？</p>
 * </ConfirmPanel>
 * ```
 *
 * @public
 */
export const ConfirmPanel = React.forwardRef<HTMLDivElement, ConfirmPanelProps>(
  (
    {
      title = "确认面板",
      status,
      children,
      contentClassName,
      contentStyle,
      confirmButtonText = "确认",
      actions,
      onConfirm,
      className,
    },
    ref,
  ) => {
    const handleConfirm = () => {
      onConfirm?.();
    };

    return (
      <ConfirmPanelContainerPrimitive ref={ref} className={className}>
        {/* 面板头部 */}
        <ConfirmPanelHeaderPrimitive>
          <ConfirmPanelTitlePrimitive>{title}</ConfirmPanelTitlePrimitive>
          {status && (status === "pending" || status === "confirmed") && (
            <StatusTag status={status} />
          )}
        </ConfirmPanelHeaderPrimitive>

        {/* 内容区域 */}
        {children && (
          <div className={cn(contentClassName)} style={contentStyle}>
            {children}
          </div>
        )}

        {/* 底部操作栏 - confirmed 状态不显示 */}
        {status !== "confirmed" && (
          <ConfirmPanelFooterPrimitive>
            {/* 自定义操作按钮（左侧） */}
            {actions && actions.length > 0 && (
              <>
                {actions.map((action, index) => (
                  <React.Fragment key={index}>{action}</React.Fragment>
                ))}
              </>
            )}
            {/* 确认按钮（右侧） */}
            <Button onClick={handleConfirm}>{confirmButtonText}</Button>
          </ConfirmPanelFooterPrimitive>
        )}
      </ConfirmPanelContainerPrimitive>
    );
  },
);

ConfirmPanel.displayName = "ConfirmPanel";
