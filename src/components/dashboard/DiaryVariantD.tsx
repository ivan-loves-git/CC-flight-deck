'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Clock, Folder, Terminal, Bot, Play, ChevronRight, Hash, Flame, Trophy } from 'lucide-react';
import { format, subDays, eachDayOfInterval, isSameDay, differenceInDays } from 'date-fns';
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

const getProjectCategory = (name: string): string => {
  const match = name.match(/^([a-z]+)--/);
  return match ? match[1].toUpperCase() : 'OTHER';
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

export function DiaryVariantD() {
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

  // Calculate streak
  let streak = 0;
  for (let i = 0; i <= 30; i++) {
    const dateKey = format(subDays(today, i), 'yyyy-MM-dd');
    if (stats.daily[dateKey]?.activeMinutes > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Variant D: Gamified &amp; Social</h1>

      {/* Card 1: Streak & Achievements */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
            Streak &amp; Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            {/* Streak */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <Flame className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full px-2 py-0.5 border">
                  <span className="text-lg font-bold">{streak}</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">{streak} Day Streak</div>
                <div className="text-sm text-muted-foreground">Keep it going!</div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="flex gap-2">
              {totals.totalSessions >= 10 && (
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center" title="10+ Sessions">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
              )}
              {totals.totalMinutes >= 600 && (
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center" title="10+ Hours">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              )}
              {totals.totalCommands >= 50 && (
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center" title="50+ Commands">
                  <Terminal className="h-6 w-6 text-green-500" />
                </div>
              )}
              {totals.projectCount >= 3 && (
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center" title="3+ Projects">
                  <Folder className="h-6 w-6 text-purple-500" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Avatar Activity Feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
            Activity Feed (Social Style)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {last7Days.reverse().filter(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              return stats.daily[dateKey]?.activeMinutes > 0;
            }).slice(0, 4).map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = stats.daily[dateKey];
              const isToday = isSameDay(day, today);
              const hours = (dayData.activeMinutes / 60).toFixed(1);

              return (
                <div
                  key={dateKey}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/diary/${dateKey}`)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {format(day, 'dd')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{isToday ? 'Today' : format(day, 'EEEE')}</span>
                      <span className="text-xs text-muted-foreground">{format(day, 'MMM d')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Completed {dayData.sessions} sessions with {hours}h of focus time
                    </div>
                    <div className="flex gap-2 mt-2">
                      {dayData.topCommands && dayData.topCommands.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Terminal className="h-3 w-3 mr-1" />
                          {dayData.topCommands.reduce((sum, c) => sum + c.count, 0)}
                        </Badge>
                      )}
                      {dayData.topAgents && dayData.topAgents.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Bot className="h-3 w-3 mr-1" />
                          {dayData.topAgents.reduce((sum, a) => sum + a.count, 0)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Project Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
            Project Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.projects)
              .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
              .slice(0, 5)
              .map(([name, data], index) => (
                <div
                  key={name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div
                    className="w-3 h-10 rounded-full"
                    style={{ backgroundColor: getProjectColor(name) }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{getProjectName(name)}</div>
                    <div className="text-xs text-muted-foreground">{getProjectCategory(name)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatMinutes(data.totalMinutes)}</div>
                    <div className="text-xs text-muted-foreground">{data.sessions} sessions</div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Stats Pills */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
            Stats Pills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{formatMinutes(totals.totalMinutes)}</span>
              <span className="text-muted-foreground">total</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full">
              <Play className="h-4 w-4 text-purple-500" />
              <span className="font-medium">{totals.totalSessions}</span>
              <span className="text-muted-foreground">sessions</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full">
              <Terminal className="h-4 w-4 text-green-500" />
              <span className="font-medium">{totals.totalCommands}</span>
              <span className="text-muted-foreground">commands</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full">
              <Bot className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{totals.totalAgents}</span>
              <span className="text-muted-foreground">agents</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 rounded-full">
              <Folder className="h-4 w-4 text-pink-500" />
              <span className="font-medium">{totals.projectCount}</span>
              <span className="text-muted-foreground">projects</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 5: Command Accordion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">5</span>
            Commands Accordion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(stats.commands)
              .sort(([, a], [, b]) => b.count - a.count)
              .slice(0, 5)
              .map(([name, data], index) => (
                <AccordionItem key={name} value={name}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-mono">/{name}</span>
                      <Badge>{data.count}x</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-12 text-sm text-muted-foreground">
                      Used {data.count} times across your sessions. This command helps with productivity and workflow automation.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Card 6: Weekly Heat Blocks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">6</span>
            Weekly Heat Blocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = stats.daily[dateKey];
              const hours = (dayData?.activeMinutes || 0) / 60;
              const isToday = isSameDay(day, today);

              // Calculate gradient based on hours
              const intensity = Math.min(hours / 12, 1);
              const bgColor = hours > 0
                ? `rgba(139, 92, 246, ${0.2 + intensity * 0.6})`
                : 'hsl(var(--muted))';

              return (
                <div
                  key={dateKey}
                  onClick={() => router.push(`/diary/${dateKey}`)}
                  className={`p-3 rounded-xl cursor-pointer transition-all hover:scale-105 ${isToday ? 'ring-2 ring-primary' : ''}`}
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                    <div className="text-xl font-bold">{format(day, 'd')}</div>
                    {hours > 0 && (
                      <div className="text-xs font-medium mt-1">{hours.toFixed(1)}h</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
