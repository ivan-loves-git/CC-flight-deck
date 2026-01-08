import { Plugin } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Puzzle, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PluginListProps {
  plugins: Plugin[];
}

export function PluginList({ plugins }: PluginListProps) {
  const enabledCount = plugins.filter((p) => p.enabled).length;
  const totalCount = plugins.length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          PLUGINS{" "}
          <span className="text-muted-foreground">
            ({enabledCount}/{totalCount} on)
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Installed extensions and integrations
        </p>
      </div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {plugins.map((plugin) => (
            <Card
              key={plugin.name}
              className="transition-colors hover:bg-accent/50"
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-muted-foreground">
                    <Puzzle size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{plugin.name}</h3>
                      <Badge
                        variant={plugin.enabled ? "default" : "secondary"}
                        className={
                          plugin.enabled
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-500 hover:bg-gray-600"
                        }
                      >
                        {plugin.enabled ? (
                          <>
                            <Check size={12} />
                            Enabled
                          </>
                        ) : (
                          <>
                            <X size={12} />
                            Disabled
                          </>
                        )}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      v{plugin.version} • {plugin.source} •{" "}
                      {formatDistanceToNow(plugin.installedAt, {
                        addSuffix: true,
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
