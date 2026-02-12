import { Plus } from "lucide-react";
import { Button } from "@/components/wuhan/composed/block-button";
import { ReportCardList } from "@/components/wuhan/composed/report-card";
import { cards } from "../../mock-data";

export function WorkResultPanel() {
  return (
    <div className="h-full flex flex-col gap-7">
      <ReportCardList
        cards={cards}
        cardWidth={'w-full'}
        onEdit={(id) => console.log("编辑", id)}
        onDelete={(id) => console.log("删除", id)}
        onDuplicate={(id) => console.log("复制", id)}
      />
      <div className="flex justify-center w-full">
        <Button
          variant="solid"
          color="primary"
          icon={Plus}
          className="cursor-pointer rounded-full w-[112px]"
        >
          添加笔记
        </Button>
      </div>
    </div>
  );
}
