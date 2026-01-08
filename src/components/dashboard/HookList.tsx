import { Hook } from '@/lib/types';
import { ItemCard } from './ItemCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface HookListProps {
  hooks: Hook[];
}

export function HookList({ hooks }: HookListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6" />
          HOOKS
          <span className="text-muted-foreground text-lg">({hooks.length})</span>
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Automation scripts that run on triggers
        </p>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-4">
          {hooks.map((hook) => (
            <div key={hook.path} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <ItemCard
                  name={hook.name}
                  description={`Path: ${hook.path}`}
                  lastModified={hook.lastModified}
                  icon={<Zap className="w-5 h-5" />}
                />
              </div>
              <Badge
                variant="outline"
                className={
                  hook.type === 'shell'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : hook.type === 'node'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-gray-500 text-white border-gray-500'
                }
              >
                {hook.type}
              </Badge>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
