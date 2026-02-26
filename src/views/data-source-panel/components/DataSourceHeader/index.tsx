"use client";

import { useState } from "react";
import { Globe, Plus } from "lucide-react";
import { Button } from "@/components/wuhan/composed/block-button";
import { ToggleButton } from "@/components/wuhan/composed/toggle-button";

/**
 * 数据源面板头部组件
 */
export function DataSourceHeader() {
  const [webSearchEnabled, setWebSearchEnabled] = useState<string | undefined>();

  return (
    <div className="px-2 h-8 flex gap-2">
      <ToggleButton
        options={[
          {
            id: "web-search",
            label: "联网搜索",
            icon: <Globe className="size-4" />,
            tooltip: webSearchEnabled ? "点击关闭联网搜索" : "点击开启联网搜索",
          },
        ]}
        value={webSearchEnabled}
        onChange={setWebSearchEnabled}
        variant="compact"
        className="p-2"
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
