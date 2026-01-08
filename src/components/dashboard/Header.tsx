'use client';

import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sun, Moon, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastScanned?: Date;
}

export function Header({
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  lastScanned,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center justify-between px-6 py-4 pl-20">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold">Claude FD</h1>
          {lastScanned && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last scanned: {lastScanned.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Search */}
        <div
          className="flex-1 max-w-md mx-8"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Input
            type="search"
            placeholder="Search..."
            className="w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-9 w-9"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          )}

          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
