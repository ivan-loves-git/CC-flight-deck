'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, Folder, Terminal, Bot, Calendar as CalendarIcon, TrendingUp, Activity } from 'lucide-react';
import { format, subDays, eachDayOfInterval, isSameDay, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { UsageStats, DailyStats, ProjectUsage } from '@/lib/types';

interface DiaryResponse {
  stats: UsageStats | null;
  totals: {
    totalSessions: number;
    totalMinutes: number;
    totalCommands: number;
    totalAgents: number;
    totalSkills: number;
    projectCount: number;
  };
  lastUpdated: string | null;
  hasData: boolean;
}

const PROJECT_COLORS: Record<string, string> = {
  'ai': '#3b82f6',
  'emba': '#8b5cf6',
  'entrep': '#f97316',
  'career': '#22c55e',
  'family': '#ec4899',
  'ge': '#eab308',
};

const getProjectColor = (name: string): string => {
  const match = name.match(/^([a-z]+)--/);
  return match && PROJECT_COLORS[match[1]] ? PROJECT_COLORS[match[1]] : '#6b7280';
};

const getProjectName = (fullName: string): string => {
  const match = fullName.match(/^[a-z]+--(.+)$/);
  return match ? match[1] : fullName;
};

const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export function DiaryVariantA() {
  const router = useRouter();
  const [data, setData] = useState<DiaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDiary() {
      try {
        const response = await fetch('/api/diary');
        if (!response.ok) throw new Error('Failed to fetch');
        setData(await response.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchDiary();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!data?.hasData || !data.stats) {
    return <div className="text-center py-12 text-muted-foreground">No data available</div>;
  }

  const { stats, totals } = data;
  const today = new Date();
  const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Variant A: Compact Cards</h1>

      {/* Card 1: Hero Stats Row */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
            Hero Stats Row
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{totals.totalSessions}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{formatMinutes(totals.totalMinutes)}</div>
              <div className="text-xs text-muted-foreground">Active Time</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{totals.projectCount}</div>
              <div className="text-xs text-muted-foreground">Projects</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{totals.totalCommands + totals.totalAgents}</div>
              <div className="text-xs text-muted-foreground">Invocations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Horizontal Bar Chart - Last 7 Days */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
            Horizontal Bar Chart (7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {last7Days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = stats.daily[dateKey];
              const hours = (dayData?.activeMinutes || 0) / 60;
              const maxHours = 24;
              const percent = Math.min((hours / maxHours) * 100, 100);
              const isToday = isSameDay(day, today);

              return (
                <div key={dateKey} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-1 rounded" onClick={() => router.push(`/diary/${dateKey}`)}>
                  <div className={`w-16 text-sm ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE d')}
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-right font-medium">
                    {hours > 0 ? `${hours.toFixed(1)}h` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Project Progress Bars */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
            Project Progress Bars
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.projects)
              .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
              .slice(0, 5)
              .map(([name, data]) => {
                const maxMinutes = Math.max(...Object.values(stats.projects).map(p => p.totalMinutes));
                const percent = (data.totalMinutes / maxMinutes) * 100;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{getProjectName(name)}</span>
                      <span className="text-muted-foreground">{formatMinutes(data.totalMinutes)}</span>
                    </div>
                    <Progress value={percent} className="h-2" style={{ '--progress-background': getProjectColor(name) } as React.CSSProperties} />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Mini Calendar Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
            Mini Calendar Grid (14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {eachDayOfInterval({ start: subDays(today, 13), end: today }).map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = stats.daily[dateKey];
              const hours = (dayData?.activeMinutes || 0) / 60;
              const isToday = isSameDay(day, today);
              const intensity = Math.min(hours / 12, 1);

              return (
                <div
                  key={dateKey}
                  onClick={() => router.push(`/diary/${dateKey}`)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-primary ${isToday ? 'ring-2 ring-primary' : ''}`}
                  style={{ backgroundColor: hours > 0 ? `rgba(139, 92, 246, ${0.2 + intensity * 0.6})` : 'hsl(var(--muted))' }}
                >
                  <div className="text-xs font-medium">{format(day, 'd')}</div>
                  {hours > 0 && <div className="text-[10px] text-muted-foreground">{hours.toFixed(0)}h</div>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Card 5: Activity Feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">5</span>
            Activity Feed (Compact List)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {last7Days.reverse().filter(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              return stats.daily[dateKey]?.activeMinutes > 0;
            }).slice(0, 5).map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = stats.daily[dateKey];
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={dateKey}
                  onClick={() => router.push(`/diary/${dateKey}`)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{isToday ? 'Today' : format(day, 'EEEE')}</div>
                    <div className="text-xs text-muted-foreground">{dayData.sessions} sessions</div>
                  </div>
                  <Badge variant="secondary">{formatMinutes(dayData.activeMinutes)}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Card 6: Top Commands Badge Cloud */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">6</span>
            Command Cloud
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.commands)
              .sort(([, a], [, b]) => b.count - a.count)
              .slice(0, 12)
              .map(([name, data]) => (
                <Badge key={name} variant="outline" className="text-sm py-1">
                  <Terminal className="h-3 w-3 mr-1" />
                  {name} <span className="ml-1 text-muted-foreground">({data.count})</span>
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
