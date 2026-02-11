import { TripleSplitPane } from "@/components/wuhan/composed/triple-split-pane";
import { DataSourcePanel } from "@/views/data-source-panel";
import { WorkspacePanel } from "@/views/workspace-panel";
import { ChatView } from "@/views/chat-view";
import {
  PageHeader,
  PageHeaderButtonGroup,
  PageHeaderUser,
} from "@/components/wuhan/composed/page-header";
import { Users} from "lucide-react";
import { Button } from "./components/wuhan/composed/block-button";
function App() {
  return (
    <div className="h-full p-3 flex flex-col gap-3 overflow-hidden bg-[var(--bg-neutral-light)]">
      <PageHeader
        logo={
          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <span className="text-white font-bold text-xs">AI</span>
          </div>
        }
        title="智能助手"
        actions={
          <>
            <PageHeaderButtonGroup>
              <Button
                variant="outline"
                color="secondary"
                className="rounded-[var(--radius-circle)]"
                icon={<Users />}
              >
                协作
              </Button>
            </PageHeaderButtonGroup>
            <PageHeaderUser
              name="User"
              avatarSrc="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
            />
          </>
        }
      />

      <TripleSplitPane
        className="w-full flex-1 overflow-hidden"
        left={{
          title: "数据来源",
          width: "240px",
          collapsedWidth: "0px",
          minWidth: "240px",
          children: <DataSourcePanel />,
          classNames: {
            body: "px-2 py-4",
          },
        }}
        leftPopover={{
          enabled: true,
          width: "240px",
          height: "520px",
          className: "px-2! py-4!",
          alwaysOpen: true,
          content: <DataSourcePanel />,
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
          classNames: {
            body: "px-2 py-4",
          },
        }}
      />
    </div>
  );
}

export default App;
