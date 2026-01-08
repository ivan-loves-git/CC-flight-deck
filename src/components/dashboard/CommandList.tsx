import { Command } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { ScrollArea } from "@/components/ui/scroll-area";
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
            <ItemCard
              key={command.path}
              name={`/${command.name}`}
              description={command.description}
              lastModified={command.lastModified}
              icon={<Terminal size={20} />}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
