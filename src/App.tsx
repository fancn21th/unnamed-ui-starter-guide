import { TripleSplitPane } from "@/components/wuhan/composed/triple-split-pane";
function App() {
  return (
    <div className="h-full p-3 flex flex-col gap-3 bg-[var(--bg-neutral-light)]">
      <div>Header</div>
      <TripleSplitPane
        className="w-full flex-1"
        left={{
          title: "左侧面板",
          width: "240px",
          collapsedWidth: "0px",
          defaultCollapsed: false,
          children: (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                左侧面板默认收起
              </p>
            </div>
          ),
        }}
        center={{
          title: "中间面板",
          minWidth: "280px",
          children: (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                中间面板内容
              </p>
            </div>
          ),
        }}
        right={{
          title: "右侧面板",
          width: "360px",
          collapsedWidth: "48px",
          minWidth: "180px",
          children: (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                右侧面板内容
              </p>
            </div>
          ),
        }}
      />
    </div>
  );
}

export default App;
