'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
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
  Search,
  ArrowUpDown,
  ChevronRight,
  Zap,
  Target,
  GitCommit,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, isSameDay, parseISO, formatDistanceToNow, differenceInHours } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { UsageStats, DashboardResponse, Session, Commit, CommitsResponse } from '@/lib/types';
import { getProjectColor, getProjectName, getProjectCategory, PROJECT_COLORS, formatMinutes, extractTimeFromId } from '@/lib/diary-utils';
import { PersonalRecords } from './PersonalRecords';

type PeriodType = 'today' | 'week' | '15days' | 'month';

export function DiaryView() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionSort, setSessionSort] = useState<'date' | 'duration' | 'project'>('date');
  const [sessionSortDir, setSessionSortDir] = useState<'asc' | 'desc'>('desc');
  const [projectViewMode, setProjectViewMode] = useState<'project' | 'category'>('project');
  const [commits, setCommits] = useState<Commit[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Single fetch for all dashboard data
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

  // Fetch commits based on selected period
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

  // Load project view mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('projectViewMode');
    if (saved === 'project' || saved === 'category') {
      setProjectViewMode(saved);
    }
  }, []);

  // Save project view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('projectViewMode', projectViewMode);
  }, [projectViewMode]);

  // Calculate period ranges
  const today = new Date();
  const periodConfig = useMemo(() => {
    switch (period) {
      case 'today':
        return { days: 1, label: 'Today', prevLabel: 'Yesterday' };
      case 'week':
        return { days: 7, label: 'This Week', prevLabel: 'Last Week' };
      case '15days':
        return { days: 15, label: 'Last 15 Days', prevLabel: 'Previous 15 Days' };
      case 'month':
        return { days: 30, label: 'This Month', prevLabel: 'Last Month' };
      default:
        return { days: 7, label: 'This Week', prevLabel: 'Last Week' };
    }
  }, [period]);

  // Calculate stats for current and previous period
  const periodStats = useMemo(() => {
    if (!data?.stats?.daily) return null;

    const currentStart = subDays(today, periodConfig.days - 1);
    const prevStart = subDays(today, periodConfig.days * 2 - 1);
    const prevEnd = subDays(today, periodConfig.days);

    let currentSessions = 0, currentMinutes = 0, currentCommands = 0, currentAgents = 0;
    let prevSessions = 0, prevMinutes = 0, prevCommands = 0, prevAgents = 0;
    const currentProjects = new Set<string>();
    const prevProjects = new Set<string>();
    const currentCommandNames = new Set<string>();
    const prevCommandNames = new Set<string>();

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
        dayData.projects.forEach(p => prevProjects.add(p));
        dayData.topCommands?.forEach(c => prevCommandNames.add(c.name));
      }
    }

    // Calculate previous period derived metrics
    const prevAvgSessionLength = prevSessions > 0 ? Math.round(prevMinutes / prevSessions) : 0;
    const prevAvgHoursPerDay = Math.round(prevMinutes / periodConfig.days / 60 * 10) / 10;

    // Calculate variations
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
        avgSessionLength: currentSessions > 0 ? Math.round(currentMinutes / currentSessions) : 0,
        avgHoursPerDay: Math.round(currentMinutes / periodConfig.days / 60 * 10) / 10,
        skills: currentCommandNames.size,
      },
      variations: {
        sessions: calcVariation(currentSessions, prevSessions),
        hours: calcVariation(currentMinutes, prevMinutes),
        commands: calcVariation(currentCommands, prevCommands),
        agents: calcVariation(currentAgents, prevAgents),
        projects: calcVariation(currentProjects.size, prevProjects.size),
        avgHoursPerDay: calcVariation(
          Math.round(currentMinutes / periodConfig.days / 60 * 10) / 10,
          prevAvgHoursPerDay
        ),
        avgSessionLength: calcVariation(
          currentSessions > 0 ? Math.round(currentMinutes / currentSessions) : 0,
          prevAvgSessionLength
        ),
        skills: calcVariation(currentCommandNames.size, prevCommandNames.size),
      }
    };
  }, [data, period, periodConfig, today]);

  // Get sessions for table
  const sessions = useMemo(() => {
    if (!data?.sessions) return [];

    const currentStart = subDays(today, periodConfig.days - 1);

    return data.sessions
      .filter(s => {
        const d = parseISO(s.date);
        if (d < currentStart) return false;
        if (sessionSearch) {
          const searchLower = sessionSearch.toLowerCase();
          return (
            s.projects.some(p => p.toLowerCase().includes(searchLower)) ||
            Object.keys(s.commands).some(c => c.toLowerCase().includes(searchLower)) ||
            s.summary?.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sessionSort === 'date') {
          cmp = a.id.localeCompare(b.id);
        } else if (sessionSort === 'duration') {
          cmp = a.activeMinutes - b.activeMinutes;
        } else if (sessionSort === 'project') {
          cmp = (a.projects[0] || '').localeCompare(b.projects[0] || '');
        }
        return sessionSortDir === 'desc' ? -cmp : cmp;
      });
  }, [data, periodConfig, sessionSearch, sessionSort, sessionSortDir, today]);

  // Get daily data for charts
  const dailyData = useMemo(() => {
    if (!data?.stats?.daily) return [];
    const days = eachDayOfInterval({ start: subDays(today, 13), end: today });
    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayData = data.stats?.daily[dateKey];
      return {
        date: dateKey,
        day: format(day, 'EEE d'),
        hours: (dayData?.activeMinutes || 0) / 60,
        sessions: dayData?.sessions || 0,
        projects: dayData?.projects || [],
      };
    });
  }, [data, today]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data?.hasData || !data.stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No data available. Run /term-diary to generate data.
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-6 p-6">
      {/* Row 1: 8 KPIs with Period Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Overview</h2>
            {data?.lastUpdated && (
              <div className="flex items-center gap-1.5">
                {differenceInHours(new Date(), parseISO(data.lastUpdated)) > 24 ? (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Updated {formatDistanceToNow(parseISO(data.lastUpdated), { addSuffix: true })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(parseISO(data.lastUpdated), { addSuffix: true })}
                  </span>
                )}
              </div>
            )}
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="15days">Last 15 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {periodStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              icon={<Clock className="h-4 w-4" />}
              label="Active Hours"
              value={`${periodStats.current.hours}h`}
              variation={periodStats.variations.hours}
            />
            <KPICard
              icon={<Play className="h-4 w-4" />}
              label="Sessions"
              value={periodStats.current.sessions}
              variation={periodStats.variations.sessions}
            />
            <KPICard
              icon={<Folder className="h-4 w-4" />}
              label="Projects"
              value={periodStats.current.projects}
              variation={periodStats.variations.projects}
            />
            <KPICard
              icon={<Terminal className="h-4 w-4" />}
              label="Commands"
              value={periodStats.current.commands}
              variation={periodStats.variations.commands}
            />
            <KPICard
              icon={<Bot className="h-4 w-4" />}
              label="Agents"
              value={periodStats.current.agents}
              variation={periodStats.variations.agents}
            />
            <KPICard
              icon={<Calendar className="h-4 w-4" />}
              label="Avg Hours/Day"
              value={`${periodStats.current.avgHoursPerDay}h`}
              variation={periodStats.variations.avgHoursPerDay}
            />
            <KPICard
              icon={<Zap className="h-4 w-4" />}
              label="Avg Session"
              value={formatMinutes(periodStats.current.avgSessionLength)}
              variation={periodStats.variations.avgSessionLength}
            />
            <KPICard
              icon={<Target className="h-4 w-4" />}
              label="Skills Used"
              value={periodStats.current.skills}
              variation={periodStats.variations.skills}
            />
            <KPICard
              icon={<GitCommit className="h-4 w-4" />}
              label="Commits"
              value={commits.length}
            />
          </div>
        )}
      </div>

      {/* Personal Records */}
      {data?.sessions && data?.stats?.daily && (
        <PersonalRecords sessions={data.sessions} daily={data.stats.daily} />
      )}

      {/* Row 2: Daily Activity Bar Chart (Stacked by Project) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily Activity (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyData.map((day) => {
              const isToday = isSameDay(parseISO(day.date), today);
              const maxHours = Math.max(...dailyData.map(d => d.hours), 8);

              // Get project breakdown for this day from sessions
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
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-1 rounded"
                  onClick={() => router.push(`/diary/${day.date}`)}
                >
                  <div className={`w-16 text-sm ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {day.day}
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden flex">
                    {projectList.map(([proj, mins]) => {
                      const width = totalMinutes > 0 ? (mins / totalMinutes) * (day.hours / maxHours) * 100 : 0;
                      return (
                        <div
                          key={proj}
                          className="h-full first:rounded-l-full last:rounded-r-full"
                          style={{
                            width: `${width}%`,
                            backgroundColor: getProjectColor(proj),
                          }}
                          title={`${getProjectName(proj)}: ${formatMinutes(mins)}`}
                        />
                      );
                    })}
                  </div>
                  <div className="w-16 text-sm text-right font-medium">
                    {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Row 3: Projects Horizontal Bar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Projects</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={projectViewMode === 'project' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProjectViewMode('project')}
                className="h-7 text-xs"
              >
                By Project
              </Button>
              <Button
                variant={projectViewMode === 'category' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProjectViewMode('category')}
                className="h-7 text-xs"
              >
                By Category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projectViewMode === 'project' ? (
              // Individual projects view
              Object.entries(stats.projects)
                .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
                .slice(0, 8)
                .map(([name, projData]) => {
                  const maxMinutes = Math.max(...Object.values(stats.projects).map(p => p.totalMinutes));
                  const percent = (projData.totalMinutes / maxMinutes) * 100;

                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{getProjectName(name)}</span>
                        <span className="text-muted-foreground">
                          {formatMinutes(projData.totalMinutes)} · {projData.sessions} sessions
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: getProjectColor(name),
                          }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              // Category aggregation view
              (() => {
                // Aggregate by category
                const categoryData: Record<string, { totalMinutes: number; sessions: number; projects: string[] }> = {};
                for (const [name, projData] of Object.entries(stats.projects)) {
                  const category = getProjectCategory(name) || 'OTHER';
                  if (!categoryData[category]) {
                    categoryData[category] = { totalMinutes: 0, sessions: 0, projects: [] };
                  }
                  categoryData[category].totalMinutes += projData.totalMinutes;
                  categoryData[category].sessions += projData.sessions;
                  categoryData[category].projects.push(name);
                }

                const sortedCategories = Object.entries(categoryData)
                  .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes);
                const maxMinutes = Math.max(...sortedCategories.map(([, d]) => d.totalMinutes));

                return sortedCategories.map(([category, catData]) => {
                  const percent = (catData.totalMinutes / maxMinutes) * 100;
                  const color = PROJECT_COLORS[category.toLowerCase()] || '#6b7280';

                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{category}</span>
                        <span className="text-muted-foreground">
                          {formatMinutes(catData.totalMinutes)} · {catData.sessions} sessions · {catData.projects.length} projects
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </CardContent>
      </Card>

      {/* Row 4: Commands Cloud */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.commands)
              .sort(([, a], [, b]) => b.count - a.count)
              .slice(0, 15)
              .map(([name, cmdData]) => (
                <Badge key={name} variant="outline" className="text-sm py-1.5 px-3">
                  <Terminal className="h-3 w-3 mr-1.5" />
                  {name} <span className="ml-1.5 text-muted-foreground">({cmdData.count})</span>
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Row 5: Git Commits */}
      {commits.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                <GitCommit className="h-4 w-4 inline mr-2" />
                Commits ({commits.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {commits.slice(0, 20).map((commit) => (
                <div
                  key={commit.hash}
                  className="flex items-start gap-3 py-2 border-b border-muted last:border-0"
                >
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs"
                    style={{ borderColor: getProjectColor(commit.project), color: getProjectColor(commit.project) }}
                  >
                    {getProjectName(commit.project)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" title={commit.message}>
                      {commit.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {commit.shortHash} · {format(parseISO(commit.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {commits.length > 20 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{commits.length - 20} more commits
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 6: Sessions Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Sessions</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    if (sessionSort === 'date') {
                      setSessionSortDir(sessionSortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSessionSort('date');
                      setSessionSortDir('desc');
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    Date/Time
                    {sessionSort === 'date' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    if (sessionSort === 'project') {
                      setSessionSortDir(sessionSortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSessionSort('project');
                      setSessionSortDir('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    Project
                    {sessionSort === 'project' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    if (sessionSort === 'duration') {
                      setSessionSortDir(sessionSortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSessionSort('duration');
                      setSessionSortDir('desc');
                    }
                  }}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Duration
                    {sessionSort === 'duration' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </TableHead>
                <TableHead className="text-right">Commands</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.slice(0, 20).map((session) => {
                const time = extractTimeFromId(session.id);
                const commandCount = Object.values(session.commands).reduce((s, v) => s + v, 0);

                return (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/diary/${session.date}`)}
                  >
                    <TableCell>
                      <div className="font-medium">{format(parseISO(session.date), 'MMM d')}</div>
                      <div className="text-xs text-muted-foreground">{time}</div>
                    </TableCell>
                    <TableCell>
                      {session.projects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {session.projects.slice(0, 2).map((proj) => (
                            <Badge key={proj} variant="outline" className="text-xs">
                              {getProjectName(proj)}
                            </Badge>
                          ))}
                          {session.projects.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{session.projects.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No project</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMinutes(session.activeMinutes)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {commandCount > 0 ? commandCount : '-'}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {sessions.length > 20 && (
            <div className="text-center mt-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/sessions')}>
                View All {sessions.length} Sessions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// KPI Card Component
function KPICard({
  icon,
  label,
  value,
  variation,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variation?: number;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold">{value}</span>
          {variation !== undefined && (
            <div className={`flex items-center gap-0.5 text-xs ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variation >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(variation)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

