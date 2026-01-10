import { Command } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Terminal } from "lucide-react";

interface CommandListProps {
  commands: Command[];
}

export function CommandList({ commands }: CommandListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          COMMANDS <span className="text-muted-foreground">({commands.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your slash commands
        </p>
      </div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {commands.map((command) => (
            <div key={command.path} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <ItemCard
                  name={`/${command.name}`}
                  description={command.description}
                  lastModified={command.lastModified}
                  icon={<Terminal size={20} />}
                  path={command.path}
                />
              </div>
              {command.scope === 'global' && (
                <Badge
                  variant="outline"
                  className="bg-blue-600 text-white border-blue-600 shrink-0"
                >
                  Global
                </Badge>
              )}
              {command.scope === 'plugin' && (
                <Badge
                  variant="outline"
                  className="bg-purple-600 text-white border-purple-600 shrink-0"
                >
                  Plugin
                </Badge>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
