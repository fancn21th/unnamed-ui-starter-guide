import { TripleSplitPane } from "@/components/wuhan/composed/triple-split-pane";
import { DataSourcePanel } from "@/views/data-source-panel";
import { WorkspacePanel } from "@/views/workspace-panel";
import { ChatView } from "@/views/chat-view";

function App() {
  return (
    <div className="h-full p-3 flex flex-col gap-3 bg-[var(--bg-neutral-light)]">
      <div>Header</div>
      <TripleSplitPane
        className="w-full flex-1"
        left={{
          title: "数据来源",
          width: "240px",
          collapsedWidth: "0px",
          minWidth: "240px",
          children: <DataSourcePanel />,
        }}
        center={{
          title: "对话",
          minWidth: "280px",
          children: <ChatView />,
        }}
        right={{
          title: "工作空间",
          width: "360px",
          collapsedWidth: "48px",
          minWidth: "360px",
          children: <WorkspacePanel />,
        }}
      />
    </div>
  );
}

export default App;
