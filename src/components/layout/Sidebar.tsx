'use client';

import { useState, useEffect } from 'react';
import {
  Terminal,
  Bot,
  Puzzle,
  Zap,
  Target,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type CategoryType = 'commands' | 'agents' | 'plugins' | 'hooks' | 'skills' | 'favorites';

interface SidebarProps {
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  counts: {
    commands: number;
    agents: number;
    plugins: number;
    hooks: number;
    skills: number;
    favorites: number;
  };
}

const categories: { id: CategoryType; label: string; icon: typeof Terminal }[] = [
  { id: 'commands', label: 'Commands', icon: Terminal },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
  { id: 'hooks', label: 'Hooks', icon: Zap },
  { id: 'skills', label: 'Skills', icon: Target },
  { id: 'favorites', label: 'Favorites', icon: Star },
];

export function Sidebar({ activeCategory, onCategoryChange, counts }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'h-screen bg-card border-r border-border flex flex-col transition-all duration-200',
          isCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!isCollapsed && (
            <span className="font-semibold text-sm text-foreground">Navigation</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className={cn('h-8 w-8', isCollapsed && 'mx-auto')}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = counts[category.id];
            const isActive = activeCategory === category.id;

            const button = (
              <Button
                key={category.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  isCollapsed && 'justify-center px-2',
                  isActive && 'bg-accent text-accent-foreground'
                )}
                onClick={() => onCategoryChange(category.id)}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm">{category.label}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {count}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={category.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {category.label}
                    {count > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {count}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {!isCollapsed && (
            <p className="text-xs text-muted-foreground">
              Claude FD
            </p>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
