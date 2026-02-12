import { Avatar } from "@/components/wuhan/composed/avatar";
import { collaborativeUsers } from "../../mock-data";

export function CollaborativeUserPanel() {
  return (
    <div className="flex flex-wrap gap-2">
      {collaborativeUsers.map((name) => (
        <Avatar
          key={name}
          size="lg"
          className="bg-[var(--bg-brand-light-active)] text-[var(--text-brand)]"
        >
          {name}
        </Avatar>
      ))}
    </div>
  );
}
