import { AgentCardPrimitive } from "@/components/wuhan/blocks/agent-card-01";
import { agentCards } from "../../mock-data";

export function AgentPanel() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {agentCards.map((agent) => (
        <AgentCardPrimitive
          key={agent.id}
          title={agent.title}
          size="md"
          className={agent.className}
        />
      ))}
    </div>
  );
}
