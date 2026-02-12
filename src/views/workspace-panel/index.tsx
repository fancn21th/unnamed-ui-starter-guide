import {
  Accordion,
  AccordionItem,
} from "@/components/wuhan/composed/block-accordion";
import { Divider } from "@/components/wuhan/composed/divider";
import { AgentPanel } from "./components/AgentPanel";
import { CollaborativeUserPanel } from "./components/CollaborativeUserPanel";
import { WorkResultPanel } from "./components/WorkResultPanel";
import { WorkTargetPanel } from "./components/WorkTargetPanel";
/**
 * 工作空间面板
 */

export function WorkspacePanel() {
  return (
    <div className="h-full overflow-auto">
      <Accordion type="multiple" expandAll>
        <AccordionItem
          value="work-target"
          trigger="工作目标：1"
          content={<WorkTargetPanel />}
        />
        <Divider className="my-[16px]" />
        <AccordionItem
          value="collaborative-user"
          trigger="已邀请协作者：6"
          content={<CollaborativeUserPanel />}
        />
        <Divider className="my-[16px]" />
        <AccordionItem value="agent" trigger="Agent" content={<AgentPanel />} />
        <Divider className="my-[16px]" />
        <AccordionItem
          value="work-result"
          trigger="工作结果"
          content={<WorkResultPanel />}
        />
      </Accordion>
    </div>
  );
}
