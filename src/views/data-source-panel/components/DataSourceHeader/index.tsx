import { Globe, Plus } from "lucide-react";
import { Button } from "@/components/wuhan/composed/block-button";

/**
 * 数据源面板头部组件
 */
export function DataSourceHeader() {
  return (
    <div className="px-2 h-8 flex gap-2">
      <Button
        variant="outline"
        color="secondary"
        icon={Globe}
        className="p-2 cursor-pointer"
      />
      <Button
        variant="outline"
        color="secondary"
        icon={Plus}
        className="flex-1 cursor-pointer"
      >
        添加来源
      </Button>
    </div>
  );
}
