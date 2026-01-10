import { Agent } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

interface AgentListProps {
  agents: Agent[];
}

export function AgentList({ agents }: AgentListProps) {
  // Count plugin vs global agents
  const pluginCount = agents.filter(a => a.scope === 'plugin').length;
  const globalCount = agents.filter(a => a.scope === 'global').length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          AGENTS <span className="text-muted-foreground">({agents.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Specialized AI workers
          {pluginCount > 0 && globalCount > 0 && (
            <span className="ml-2">
              ({globalCount} global, {pluginCount} from plugins)
            </span>
          )}
        </p>
      </div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.path} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <ItemCard
                  name={agent.name}
                  description={agent.description}
                  lastModified={agent.lastModified}
                  icon={<Bot size={20} />}
                  path={agent.path}
                />
              </div>
              {agent.scope === 'plugin' && (
                <Badge
                  variant="outline"
                  className="bg-purple-600 text-white border-purple-600 shrink-0"
                >
                  Plugin
                </Badge>
              )}
              {agent.category && (
                <Badge
                  variant="outline"
                  className="bg-gray-600 text-white border-gray-600 shrink-0 capitalize"
                >
                  {agent.category}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
