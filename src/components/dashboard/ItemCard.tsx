'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatDistanceToNow, isToday, isYesterday, differenceInDays } from 'date-fns';
import {
  Star,
  Code,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isFavorite, toggleFavorite } from '@/lib/favorites';

interface ItemCardProps {
  name: string;
  description: string;
  lastModified: Date;
  icon?: React.ReactNode;
  path: string;
  badges?: { label: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }[];
  metadata?: Record<string, string>;
  preview?: string;
  onFavoriteChange?: () => void;
}

function getTimeBadge(date: Date): { label: string; className: string } | null {
  if (isToday(date)) {
    return { label: 'Today', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  }
  if (isYesterday(date)) {
    return { label: 'Yesterday', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
  }
  const days = differenceInDays(new Date(), date);
  if (days <= 7) {
    return { label: `${days}d ago`, className: 'bg-muted text-muted-foreground' };
  }
  return null;
}

export function ItemCard({
  name,
  description,
  lastModified,
  icon,
  path,
  badges = [],
  metadata,
  preview,
  onFavoriteChange,
}: ItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState<'edit' | 'reveal' | null>(null);
  const [isFav, setIsFav] = useState(false);

  // Check favorite status on mount
  useEffect(() => {
    setIsFav(isFavorite(path));
  }, [path]);

  const relativeTime = formatDistanceToNow(lastModified, { addSuffix: true });
  const timeBadge = getTimeBadge(lastModified);

  const handleOpen = async (action: 'edit' | 'reveal') => {
    setIsLoading(action);
    try {
      const response = await fetch('/api/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, action }),
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

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleFavorite(path);
    setIsFav(newState);
    onFavoriteChange?.();
  };

  return (
    <TooltipProvider>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="hover:bg-accent/30 transition-colors">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer select-none">
              <div className="flex items-start gap-3">
                {/* Expand indicator */}
                <div className="mt-1 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>

                {/* Icon */}
                {icon && <div className="text-muted-foreground mt-1">{icon}</div>}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base">{name}</CardTitle>
                    {badges.map((badge, i) => (
                      <Badge key={i} variant={badge.variant || 'secondary'} className="text-xs">
                        {badge.label}
                      </Badge>
                    ))}
                    {timeBadge && (
                      <span className={cn('text-xs px-1.5 py-0.5 rounded', timeBadge.className)}>
                        {timeBadge.label}
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-sm line-clamp-2">
                    {description || <span className="italic text-muted-foreground">No description</span>}
                  </CardDescription>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-xs text-muted-foreground mt-2 cursor-help">
                        {relativeTime}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-mono">{path}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Favorite star */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleToggleFavorite}
                >
                  <Star
                    className={cn(
                      'h-4 w-4',
                      isFav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                    )}
                  />
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              {/* Metadata */}
              {metadata && Object.keys(metadata).length > 0 && (
                <div className="mb-4 p-3 bg-muted/50 rounded-md">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Metadata
                  </h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(metadata).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-muted-foreground text-xs">{key}</dt>
                        <dd className="font-mono text-xs">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Preview */}
              {preview && (
                <div className="mb-4 p-3 bg-muted/50 rounded-md">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Preview
                  </h4>
                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground line-clamp-5">
                    {preview}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
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
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </TooltipProvider>
  );
}
