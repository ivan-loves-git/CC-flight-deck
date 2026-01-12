'use client';

import { useState, useEffect } from 'react';
import { Flame, TrendingUp, Trophy, Lightbulb, Clock, Calendar, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Insight } from '@/lib/insights';

interface DailyInsightsProps {
  insights: Insight[];
}

const iconMap = {
  flame: Flame,
  'trending-up': TrendingUp,
  trophy: Trophy,
  lightbulb: Lightbulb,
  clock: Clock,
  calendar: Calendar,
};

const colorMap: Record<Insight['type'], string> = {
  streak: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  trend: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  milestone: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
  suggestion: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  comparison: 'from-slate-500/20 to-gray-500/20 border-slate-500/30',
};

const iconColorMap: Record<Insight['type'], string> = {
  streak: 'text-orange-500',
  trend: 'text-blue-500',
  milestone: 'text-yellow-500',
  suggestion: 'text-purple-500',
  comparison: 'text-slate-500',
};

const STORAGE_KEY = 'dismissed-insights';

export function DailyInsights({ insights }: DailyInsightsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Load dismissed insights from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out old dismissals (older than 7 days)
        const now = Date.now();
        const validDismissals = Object.entries(parsed)
          .filter(([, timestamp]) => now - (timestamp as number) < 7 * 24 * 60 * 60 * 1000)
          .map(([id]) => id);
        setDismissedIds(new Set(validDismissals));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set([...prev, id]);

      // Save to localStorage with timestamp
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const existing = stored ? JSON.parse(stored) : {};
        existing[id] = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      } catch {
        // ignore
      }

      return next;
    });
  };

  const visibleInsights = insights.filter(i => !dismissedIds.has(i.id));

  if (visibleInsights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {visibleInsights.map((insight) => {
        const Icon = iconMap[insight.icon];
        const gradientClass = colorMap[insight.type];
        const iconColor = iconColorMap[insight.type];

        return (
          <Card
            key={insight.id}
            className={`relative overflow-hidden border bg-gradient-to-br ${gradientClass}`}
          >
            <CardContent className="p-4">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-50 hover:opacity-100"
                onClick={() => handleDismiss(insight.id)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Dismiss</span>
              </Button>

              <div className="flex items-start gap-3">
                <div className={`shrink-0 ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 pr-6">
                  <h3 className="font-medium text-sm">{insight.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
