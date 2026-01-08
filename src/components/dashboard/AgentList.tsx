import { Agent } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot } from "lucide-react";

interface AgentListProps {
  agents: Agent[];
}

export function AgentList({ agents }: AgentListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          AGENTS <span className="text-muted-foreground">({agents.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Specialized AI workers
        </p>
      </div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {agents.map((agent) => (
            <ItemCard
              key={agent.path}
              name={agent.name}
              description={agent.description}
              lastModified={agent.lastModified}
              icon={<Bot size={20} />}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
