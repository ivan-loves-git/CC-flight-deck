'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UnifiedItem } from '@/lib/types';
import {
  Terminal,
  Bot,
  Puzzle,
  Zap,
  Target,
  Code,
  FolderOpen,
  Calendar,
  Tag,
  Layers,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ItemDetailSheetProps {
  item: UnifiedItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  command: <Terminal className="h-5 w-5" />,
  agent: <Bot className="h-5 w-5" />,
  plugin: <Puzzle className="h-5 w-5" />,
  hook: <Zap className="h-5 w-5" />,
  skill: <Target className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  command: 'bg-blue-500',
  agent: 'bg-green-500',
  plugin: 'bg-purple-500',
  hook: 'bg-orange-500',
  skill: 'bg-pink-500',
};

const scopeColors: Record<string, string> = {
  global: 'bg-blue-600 text-white',
  project: 'bg-cyan-600 text-white',
  plugin: 'bg-purple-600 text-white',
  'n/a': 'bg-gray-500 text-white',
};

export function ItemDetailSheet({ item, open, onOpenChange }: ItemDetailSheetProps) {
  const [isLoading, setIsLoading] = useState<'edit' | 'reveal' | null>(null);

  if (!item) return null;

  const handleOpen = async (action: 'edit' | 'reveal') => {
    setIsLoading(action);
    try {
      const response = await fetch('/api/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path, action }),
      });

      if (!response.ok) {
        console.error('Failed to open file');
      }
    } catch (error) {
      console.error('Error opening file:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeColors[item.type]} text-white`}>
              {typeIcons[item.type]}
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl">
                {item.type === 'command' ? `/${item.name}` : item.name}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {item.type}
                </Badge>
                <Badge variant="outline" className={scopeColors[item.scope]}>
                  {item.scope}
                </Badge>
                {item.enabled !== undefined && (
                  <Badge variant={item.enabled ? 'default' : 'secondary'}>
                    {item.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4" /> Description
            </h3>
            <p className="text-sm">
              {item.description || <span className="italic text-muted-foreground">No description available</span>}
            </p>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            {/* Last Modified */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Modified
              </h3>
              <p className="text-sm">{formatDistanceToNow(item.lastModified, { addSuffix: true })}</p>
              <p className="text-xs text-muted-foreground">
                {format(item.lastModified, 'PPP p')}
              </p>
            </div>

            {/* Plugin Source */}
            {item.pluginName && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                  <Puzzle className="h-4 w-4" /> From Plugin
                </h3>
                <p className="text-sm">{item.pluginName}</p>
              </div>
            )}

            {/* Category (for agents) */}
            {item.category && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Category
                </h3>
                <Badge variant="outline" className="capitalize">{item.category}</Badge>
              </div>
            )}

            {/* Version (for plugins) */}
            {item.version && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Version</h3>
                <p className="text-sm font-mono">{item.version}</p>
              </div>
            )}

            {/* Source (for plugins) */}
            {item.source && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Source</h3>
                <p className="text-sm">{item.source}</p>
              </div>
            )}

            {/* Hook Type */}
            {item.hookType && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Hook Type</h3>
                <Badge variant="outline" className="capitalize">{item.hookType}</Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* File Path */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">File Path</h3>
            <code className="text-xs bg-muted p-2 rounded block break-all">
              {item.path}
            </code>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleOpen('edit')}
              disabled={isLoading !== null}
              className="flex-1"
            >
              <Code className="h-4 w-4 mr-2" />
              {isLoading === 'edit' ? 'Opening...' : 'Edit in VS Code'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpen('reveal')}
              disabled={isLoading !== null}
              className="flex-1"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              {isLoading === 'reveal' ? 'Opening...' : 'Reveal in Finder'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
