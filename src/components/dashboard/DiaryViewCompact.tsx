'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2,
  Clock,
  Folder,
  Terminal,
  Bot,
  Calendar,
  TrendingUp,
  TrendingDown,
  Play,
  Zap,
  Target,
  GitCommit,
  ChevronRight,
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { DashboardResponse, Commit, CommitsResponse } from '@/lib/types';
import { getProjectColor, getProjectName, PROJECT_COLORS, formatMinutes, getProjectCategory } from '@/lib/diary-utils';

type PeriodType = 'today' | 'week' | '15days' | 'month';

export function DiaryViewCompact() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [projectViewMode, setProjectViewMode] = useState<'project' | 'category'>('project');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchCommits() {
      const today = new Date();
      const periodDays = period === 'today' ? 1 : period === 'week' ? 7 : period === '15days' ? 15 : 30;
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - periodDays + 1);
      const from = fromDate.toISOString().split('T')[0];
      const to = today.toISOString().split('T')[0];
      try {
        const response = await fetch(`/api/commits?from=${from}&to=${to}`);
        if (response.ok) {
          const data: CommitsResponse = await response.json();
          setCommits(data.commits);
        }
      } catch {
        // ignore
      }
    }
    fetchCommits();
  }, [period]);

  const today = useMemo(() => new Date(), []);

  const periodConfig = useMemo(() => {
    switch (period) {
      case 'today': return { days: 1 };
      case 'week': return { days: 7 };
      case '15days': return { days: 15 };
      case 'month': return { days: 30 };
      default: return { days: 7 };
    }
  }, [period]);

  const periodStats = useMemo(() => {
    if (!data?.stats?.daily) return null;
    const currentStart = subDays(today, periodConfig.days - 1);
    const prevStart = subDays(today, periodConfig.days * 2 - 1);
    const prevEnd = subDays(today, periodConfig.days);

    let currentSessions = 0, currentMinutes = 0, currentCommands = 0, currentAgents = 0;
    let prevSessions = 0, prevMinutes = 0, prevCommands = 0, prevAgents = 0;
    const currentProjects = new Set<string>();
    const currentCommandNames = new Set<string>();

    for (const [date, dayData] of Object.entries(data.stats.daily)) {
      const d = parseISO(date);
      if (d >= currentStart && d <= today) {
        currentSessions += dayData.sessions;
        currentMinutes += dayData.activeMinutes;
        currentCommands += dayData.topCommands?.reduce((s, c) => s + c.count, 0) || 0;
        currentAgents += dayData.topAgents?.reduce((s, a) => s + a.count, 0) || 0;
        dayData.projects.forEach(p => currentProjects.add(p));
        dayData.topCommands?.forEach(c => currentCommandNames.add(c.name));
      } else if (d >= prevStart && d <= prevEnd) {
        prevSessions += dayData.sessions;
        prevMinutes += dayData.activeMinutes;
        prevCommands += dayData.topCommands?.reduce((s, c) => s + c.count, 0) || 0;
        prevAgents += dayData.topAgents?.reduce((s, a) => s + a.count, 0) || 0;
      }
    }

    const calcVariation = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    return {
      current: {
        sessions: currentSessions,
        hours: Math.round(currentMinutes / 60 * 10) / 10,
        commands: currentCommands,
        agents: currentAgents,
        projects: currentProjects.size,
        avgHoursPerDay: Math.round(currentMinutes / periodConfig.days / 60 * 10) / 10,
        avgSessionLength: currentSessions > 0 ? Math.round(currentMinutes / currentSessions) : 0,
        skills: currentCommandNames.size,
      },
      variations: {
        sessions: calcVariation(currentSessions, prevSessions),
        hours: calcVariation(currentMinutes, prevMinutes),
        commands: calcVariation(currentCommands, prevCommands),
        agents: calcVariation(currentAgents, prevAgents),
      }
    };
  }, [data, periodConfig, today]);

  const dailyData = useMemo(() => {
    if (!data?.stats?.daily) return [];
    const days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayData = data.stats?.daily[dateKey];
      return {
        date: dateKey,
        day: format(day, 'EEE'),
        hours: (dayData?.activeMinutes || 0) / 60,
        sessions: dayData?.sessions || 0,
        projects: dayData?.projects || [],
      };
    });
  }, [data, today]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data?.hasData || !data.stats) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No data. Run /term-diary first.
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-3 p-3">
      {/* Header Row: Period + Key Stats Inline */}
      <div className="flex items-center justify-between gap-4">
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="15days">15 Days</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>

        {periodStats && (
          <div className="flex items-center gap-4 text-sm">
            <MiniKPI icon={<Clock className="h-3 w-3" />} value={`${periodStats.current.hours}h`} variation={periodStats.variations.hours} />
            <MiniKPI icon={<Play className="h-3 w-3" />} value={periodStats.current.sessions} variation={periodStats.variations.sessions} />
            <MiniKPI icon={<Folder className="h-3 w-3" />} value={periodStats.current.projects} />
            <MiniKPI icon={<Terminal className="h-3 w-3" />} value={periodStats.current.commands} variation={periodStats.variations.commands} />
            <MiniKPI icon={<Bot className="h-3 w-3" />} value={periodStats.current.agents} variation={periodStats.variations.agents} />
            <MiniKPI icon={<GitCommit className="h-3 w-3" />} value={commits.length} />
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Column: Activity Chart */}
        <Card className="p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Last 7 Days</div>
          <div className="space-y-1">
            {dailyData.map((day) => {
              const isToday = isSameDay(parseISO(day.date), today);
              const maxHours = Math.max(...dailyData.map(d => d.hours), 8);

              const dayProjects: Record<string, number> = {};
              if (data?.sessions) {
                for (const session of data.sessions) {
                  if (session.date === day.date) {
                    for (const proj of session.projects) {
                      dayProjects[proj] = (dayProjects[proj] || 0) + session.activeMinutes;
                    }
                  }
                }
              }
              const projectList = Object.entries(dayProjects).sort(([,a], [,b]) => b - a);
              const totalMinutes = Object.values(dayProjects).reduce((s, v) => s + v, 0);

              return (
                <div
                  key={day.date}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 py-0.5 rounded text-xs"
                  onClick={() => router.push(`/diary/${day.date}`)}
                >
                  <div className={`w-8 ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {day.day}
                  </div>
                  <div className="flex-1 h-4 bg-muted rounded overflow-hidden flex">
                    {projectList.map(([proj, mins]) => {
                      const width = totalMinutes > 0 ? (mins / totalMinutes) * (day.hours / maxHours) * 100 : 0;
                      return (
                        <div
                          key={proj}
                          className="h-full"
                          style={{ width: `${width}%`, backgroundColor: getProjectColor(proj) }}
                          title={`${getProjectName(proj)}: ${formatMinutes(mins)}`}
                        />
                      );
                    })}
                  </div>
                  <div className="w-10 text-right text-muted-foreground">
                    {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Column: Projects */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Projects</span>
            <div className="flex gap-0.5">
              <Button
                variant={projectViewMode === 'project' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setProjectViewMode('project')}
                className="h-5 px-1.5 text-[10px]"
              >
                Proj
              </Button>
              <Button
                variant={projectViewMode === 'category' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setProjectViewMode('category')}
                className="h-5 px-1.5 text-[10px]"
              >
                Cat
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            {projectViewMode === 'project' ? (
              Object.entries(stats.projects)
                .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
                .slice(0, 6)
                .map(([name, projData]) => {
                  const maxMinutes = Math.max(...Object.values(stats.projects).map(p => p.totalMinutes));
                  const percent = (projData.totalMinutes / maxMinutes) * 100;
                  return (
                    <div key={name} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="truncate max-w-[120px]">{getProjectName(name)}</span>
                        <span className="text-muted-foreground">{formatMinutes(projData.totalMinutes)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${percent}%`, backgroundColor: getProjectColor(name) }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              (() => {
                const categoryData: Record<string, { totalMinutes: number; sessions: number }> = {};
                for (const [name, projData] of Object.entries(stats.projects)) {
                  const category = getProjectCategory(name) || 'OTHER';
                  if (!categoryData[category]) categoryData[category] = { totalMinutes: 0, sessions: 0 };
                  categoryData[category].totalMinutes += projData.totalMinutes;
                  categoryData[category].sessions += projData.sessions;
                }
                const sorted = Object.entries(categoryData).sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes);
                const maxMinutes = Math.max(...sorted.map(([, d]) => d.totalMinutes));
                return sorted.slice(0, 6).map(([category, catData]) => {
                  const percent = (catData.totalMinutes / maxMinutes) * 100;
                  const color = PROJECT_COLORS[category.toLowerCase()] || '#6b7280';
                  return (
                    <div key={category} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span>{category}</span>
                        <span className="text-muted-foreground">{formatMinutes(catData.totalMinutes)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Commands + Recent Sessions */}
      <div className="grid grid-cols-2 gap-3">
        {/* Commands Cloud */}
        <Card className="p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Top Commands</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(stats.commands)
              .sort(([, a], [, b]) => b.count - a.count)
              .slice(0, 10)
              .map(([name, cmdData]) => (
                <Badge key={name} variant="outline" className="text-[10px] py-0.5 px-1.5">
                  {name} <span className="text-muted-foreground ml-1">{cmdData.count}</span>
                </Badge>
              ))}
          </div>
        </Card>

        {/* Recent Sessions Mini List */}
        <Card className="p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Recent Sessions</div>
          <div className="space-y-1">
            {data.sessions?.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 py-0.5 rounded"
                onClick={() => router.push(`/diary/${session.date}`)}
              >
                <span className="text-muted-foreground w-12">{format(parseISO(session.date), 'MMM d')}</span>
                <span className="truncate flex-1 max-w-[100px]">
                  {session.projects[0] ? getProjectName(session.projects[0]) : 'No project'}
                </span>
                <span className="text-muted-foreground">{formatMinutes(session.activeMinutes)}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Commits (if any) - compact horizontal list */}
      {commits.length > 0 && (
        <Card className="p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Recent Commits ({commits.length})
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {commits.slice(0, 6).map((commit) => (
              <div key={commit.hash} className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 shrink-0"
                  style={{ borderColor: getProjectColor(commit.project) }}
                >
                  {getProjectName(commit.project).slice(0, 12)}
                </Badge>
                <span className="truncate text-muted-foreground">{commit.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// Mini KPI - inline stat display
function MiniKPI({
  icon,
  value,
  variation,
}: {
  icon: React.ReactNode;
  value: string | number;
  variation?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-medium">{value}</span>
      {variation !== undefined && (
        <span className={`text-[10px] ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {variation >= 0 ? <TrendingUp className="h-2.5 w-2.5 inline" /> : <TrendingDown className="h-2.5 w-2.5 inline" />}
        </span>
      )}
    </div>
  );
}
