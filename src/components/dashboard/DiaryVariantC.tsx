'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Clock, Folder, Terminal, Bot, ChevronRight, Circle, ArrowRight } from 'lucide-react';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { UsageStats } from '@/lib/types';

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

export function DiaryVariantC() {
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
  const last14Days = eachDayOfInterval({ start: subDays(today, 13), end: today });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Variant C: Timeline &amp; Cards</h1>

      {/* Card 1: Big Number Hero */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
            Big Number Hero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatMinutes(totals.totalMinutes)}
            </div>
            <div className="text-lg text-muted-foreground mt-2">Total active time this period</div>
            <div className="flex justify-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-2xl font-semibold">{totals.totalSessions}</div>
                <div className="text-xs text-muted-foreground">sessions</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-semibold">{totals.projectCount}</div>
                <div className="text-xs text-muted-foreground">projects</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-semibold">{totals.totalCommands}</div>
                <div className="text-xs text-muted-foreground">commands</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Timeline View */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
            Timeline View (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {eachDayOfInterval({ start: subDays(today, 6), end: today }).reverse().map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayData = stats.daily[dateKey];
                const isToday = isSameDay(day, today);
                const hours = (dayData?.activeMinutes || 0) / 60;

                return (
                  <div
                    key={dateKey}
                    className="relative pl-10 cursor-pointer hover:bg-muted/30 -ml-2 p-2 rounded-lg transition-colors"
                    onClick={() => router.push(`/diary/${dateKey}`)}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-2 top-3 w-4 h-4 rounded-full border-2 ${
                      isToday ? 'bg-primary border-primary' : hours > 0 ? 'bg-background border-primary' : 'bg-background border-muted-foreground'
                    }`} />

                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                          {isToday ? 'Today' : format(day, 'EEEE, MMM d')}
                        </div>
                        {hours > 0 ? (
                          <div className="text-sm text-muted-foreground mt-1">
                            {dayData.sessions} sessions · {hours.toFixed(1)}h active
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground mt-1">No activity</div>
                        )}
                      </div>
                      {hours > 0 && (
                        <Badge variant="secondary">{formatMinutes(dayData.activeMinutes)}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Project Cards Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
            Project Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(stats.projects)
              .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
              .slice(0, 6)
              .map(([name, data]) => (
                <div
                  key={name}
                  className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                  style={{ borderLeftWidth: '4px', borderLeftColor: getProjectColor(name) }}
                >
                  <div className="font-medium truncate">{getProjectName(name)}</div>
                  <div className="text-2xl font-bold mt-1">{formatMinutes(data.totalMinutes)}</div>
                  <div className="text-xs text-muted-foreground">{data.sessions} sessions</div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Card 4: GitHub-style Contribution Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
            Activity Grid (GitHub Style)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {last14Days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = stats.daily[dateKey];
              const hours = (dayData?.activeMinutes || 0) / 60;
              const isToday = isSameDay(day, today);

              // Intensity levels: 0, 1-2h, 2-4h, 4-8h, 8h+
              let intensity = 0;
              if (hours > 0 && hours <= 2) intensity = 1;
              else if (hours > 2 && hours <= 4) intensity = 2;
              else if (hours > 4 && hours <= 8) intensity = 3;
              else if (hours > 8) intensity = 4;

              const bgColors = [
                'bg-muted',
                'bg-green-200 dark:bg-green-900',
                'bg-green-400 dark:bg-green-700',
                'bg-green-600 dark:bg-green-500',
                'bg-green-800 dark:bg-green-300',
              ];

              return (
                <div
                  key={dateKey}
                  onClick={() => router.push(`/diary/${dateKey}`)}
                  className={`w-8 h-8 rounded cursor-pointer transition-all hover:ring-2 hover:ring-primary ${bgColors[intensity]} ${isToday ? 'ring-2 ring-primary' : ''}`}
                  title={`${format(day, 'MMM d')}: ${hours.toFixed(1)}h`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="w-4 h-4 rounded bg-muted" />
            <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900" />
            <div className="w-4 h-4 rounded bg-green-400 dark:bg-green-700" />
            <div className="w-4 h-4 rounded bg-green-600 dark:bg-green-500" />
            <div className="w-4 h-4 rounded bg-green-800 dark:bg-green-300" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 5: Command Flow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">5</span>
            Top Commands Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {Object.entries(stats.commands)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 10)
                .map(([name, data], index) => {
                  const maxCount = Math.max(...Object.values(stats.commands).map(c => c.count));
                  const widthPercent = (data.count / maxCount) * 100;

                  return (
                    <div key={name} className="flex items-center gap-3">
                      <div className="w-6 text-sm text-muted-foreground text-right">{index + 1}</div>
                      <div className="flex-1 relative">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary/20 rounded"
                          style={{ width: `${widthPercent}%` }}
                        />
                        <div className="relative px-3 py-2 flex items-center justify-between">
                          <span className="font-mono text-sm">/{name}</span>
                          <span className="text-sm font-medium">{data.count}x</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Card 6: Quick Stats Strip */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">6</span>
            Quick Stats Strip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Avg Daily</div>
                <div className="font-bold">{(totals.totalMinutes / 7 / 60).toFixed(1)}h</div>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground" />

            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Folder className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Top Project</div>
                <div className="font-bold truncate max-w-24">
                  {getProjectName(Object.entries(stats.projects).sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)[0]?.[0] || 'None')}
                </div>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground" />

            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Terminal className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Top Command</div>
                <div className="font-bold font-mono">
                  /{Object.entries(stats.commands).sort(([, a], [, b]) => b.count - a.count)[0]?.[0] || 'none'}
                </div>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground" />

            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Agents</div>
                <div className="font-bold">{totals.totalAgents}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
