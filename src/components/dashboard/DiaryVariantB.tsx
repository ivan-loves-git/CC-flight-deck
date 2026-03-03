'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Clock, Folder, Terminal, Bot, TrendingUp, Zap, Target, BarChart3 } from 'lucide-react';
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

export function DiaryVariantB() {
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

  // Calculate percentages for circular progress
  const avgHoursPerDay = totals.totalMinutes / 60 / 7;
  const targetHours = 8;
  const progressPercent = Math.min((avgHoursPerDay / targetHours) * 100, 100);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Variant B: Tables &amp; Radials</h1>

      {/* Card 1: Radial Progress with Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
            Radial Progress + Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            {/* SVG Radial Progress */}
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-muted" />
                <circle
                  cx="64" cy="64" r="56"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 3.52} 352`}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{avgHoursPerDay.toFixed(1)}h</span>
                <span className="text-xs text-muted-foreground">avg/day</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totals.totalSessions}</div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totals.projectCount}</div>
                  <div className="text-xs text-muted-foreground">Projects</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Terminal className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totals.totalCommands}</div>
                  <div className="text-xs text-muted-foreground">Commands</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Bot className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totals.totalAgents}</div>
                  <div className="text-xs text-muted-foreground">Agents</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Data Table - Daily Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
            Daily Summary Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Commands</TableHead>
                <TableHead className="text-right">Agents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {last7Days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayData = stats.daily[dateKey];
                const isToday = isSameDay(day, today);

                return (
                  <TableRow
                    key={dateKey}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/diary/${dateKey}`)}
                  >
                    <TableCell className={isToday ? 'font-bold' : ''}>
                      {isToday ? 'Today' : format(day, 'EEE, MMM d')}
                    </TableCell>
                    <TableCell className="text-right">{dayData?.sessions || 0}</TableCell>
                    <TableCell className="text-right">{dayData ? (dayData.activeMinutes / 60).toFixed(1) : '0'}</TableCell>
                    <TableCell className="text-right">{dayData?.topCommands?.reduce((sum, c) => sum + c.count, 0) || 0}</TableCell>
                    <TableCell className="text-right">{dayData?.topAgents?.reduce((sum, a) => sum + a.count, 0) || 0}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Card 3: Project Donut Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
            Project Time Distribution (Donut)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            {/* Donut Chart */}
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-40 h-40">
                {(() => {
                  const projects = Object.entries(stats.projects)
                    .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
                    .slice(0, 5);
                  const total = projects.reduce((sum, [, p]) => sum + p.totalMinutes, 0);
                  let currentAngle = 0;

                  return projects.map(([name, data], i) => {
                    const percent = (data.totalMinutes / total) * 100;
                    const angle = (percent / 100) * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;

                    const x1 = 50 + 35 * Math.cos((startAngle - 90) * Math.PI / 180);
                    const y1 = 50 + 35 * Math.sin((startAngle - 90) * Math.PI / 180);
                    const x2 = 50 + 35 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
                    const y2 = 50 + 35 * Math.sin((startAngle + angle - 90) * Math.PI / 180);
                    const largeArc = angle > 180 ? 1 : 0;

                    return (
                      <path
                        key={name}
                        d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={getProjectColor(name)}
                        className="transition-opacity hover:opacity-80"
                      />
                    );
                  });
                })()}
                <circle cx="50" cy="50" r="20" fill="hsl(var(--background))" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{totals.projectCount}</span>
                <span className="text-[10px] text-muted-foreground">projects</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 flex-1">
              {Object.entries(stats.projects)
                .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
                .slice(0, 5)
                .map(([name, data]) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getProjectColor(name) }} />
                    <span className="text-sm flex-1 truncate">{getProjectName(name)}</span>
                    <span className="text-sm text-muted-foreground">{formatMinutes(data.totalMinutes)}</span>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Vertical Bar Sparklines */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
            Weekly Sparkline Bars
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-32">
            {last7Days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = stats.daily[dateKey];
              const hours = (dayData?.activeMinutes || 0) / 60;
              const maxHours = Math.max(...last7Days.map(d => {
                const key = format(d, 'yyyy-MM-dd');
                return (stats.daily[key]?.activeMinutes || 0) / 60;
              }));
              const heightPercent = maxHours > 0 ? (hours / maxHours) * 100 : 0;
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={dateKey}
                  className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                  onClick={() => router.push(`/diary/${dateKey}`)}
                >
                  <div className="w-full h-24 flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${isToday ? 'bg-primary' : 'bg-primary/60'}`}
                      style={{ height: `${heightPercent}%`, minHeight: hours > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE')}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Card 5: Top Commands Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">5</span>
            Most Used Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Command</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(stats.commands)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 8)
                .map(([name, data], index) => {
                  const total = Object.values(stats.commands).reduce((sum, c) => sum + c.count, 0);
                  const percent = ((data.count / total) * 100).toFixed(1);
                  return (
                    <TableRow key={name}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">/{name}</TableCell>
                      <TableCell className="text-right">{data.count}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{percent}%</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Card 6: Stats Comparison Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">6</span>
            Period Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Today vs Yesterday */}
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Today</div>
              <div className="text-2xl font-bold">
                {((stats.daily[format(today, 'yyyy-MM-dd')]?.activeMinutes || 0) / 60).toFixed(1)}h
              </div>
              {(() => {
                const todayHours = (stats.daily[format(today, 'yyyy-MM-dd')]?.activeMinutes || 0) / 60;
                const yesterdayHours = (stats.daily[format(subDays(today, 1), 'yyyy-MM-dd')]?.activeMinutes || 0) / 60;
                const diff = todayHours - yesterdayHours;
                return (
                  <div className={`text-xs flex items-center gap-1 ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`h-3 w-3 ${diff < 0 ? 'rotate-180' : ''}`} />
                    {Math.abs(diff).toFixed(1)}h vs yesterday
                  </div>
                );
              })()}
            </div>

            {/* This Week */}
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">This Week</div>
              <div className="text-2xl font-bold">{formatMinutes(totals.totalMinutes)}</div>
              <div className="text-xs text-muted-foreground">
                {totals.totalSessions} sessions
              </div>
            </div>

            {/* Avg Session */}
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Avg Session</div>
              <div className="text-2xl font-bold">
                {totals.totalSessions > 0 ? formatMinutes(Math.round(totals.totalMinutes / totals.totalSessions)) : '0m'}
              </div>
              <div className="text-xs text-muted-foreground">
                per session
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
