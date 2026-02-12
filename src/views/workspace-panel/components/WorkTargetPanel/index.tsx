import { GoalCardPrimitive } from "@/components/wuhan/blocks/goal-card-01";
import { goalExamples } from "../../mock-data";

export function WorkTargetPanel() {
  return (
    <div className="flex flex-col gap-3">
      {goalExamples
        .filter((g) => g.status === "in_progress")
        .map((goal, index) => (
          <GoalCardPrimitive
            key={index}
            title={goal.title}
            description={goal.description}
            progress={goal.progress}
            status={goal.status}
            size="md"
          />
        ))}
    </div>
  );
}
