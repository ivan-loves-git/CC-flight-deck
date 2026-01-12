'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Calendar, TrendingUp } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import type { Session, DailyStats } from '@/lib/types';
import { formatMinutes, getProjectName } from '@/lib/diary-utils';

interface PersonalRecordsProps {
  sessions: Session[];
  daily: Record<string, DailyStats>;
}

interface PersonalRecord {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}

export function PersonalRecords({ sessions, daily }: PersonalRecordsProps) {
  const records = useMemo(() => {
    if (!sessions?.length) return [];

    const results: PersonalRecord[] = [];

    // 1. Longest single session
    const longestSession = sessions.reduce((max, s) =>
      s.activeMinutes > max.activeMinutes ? s : max
    , sessions[0]);

    if (longestSession) {
      const project = longestSession.projects[0];
      results.push({
        label: 'Longest Session',
        value: formatMinutes(longestSession.activeMinutes),
        detail: `${format(parseISO(longestSession.date), 'MMM d')}${project ? ` · ${getProjectName(project)}` : ''}`,
        icon: <Clock className="h-4 w-4" />,
      });
    }

    // 2. Most productive day
    if (daily && Object.keys(daily).length > 0) {
      const [bestDay, bestDayData] = Object.entries(daily).reduce(
        ([maxDate, maxData], [date, data]) =>
          data.activeMinutes > maxData.activeMinutes ? [date, data] : [maxDate, maxData],
        Object.entries(daily)[0]
      );

      if (bestDayData) {
        results.push({
          label: 'Best Day',
          value: formatMinutes(bestDayData.activeMinutes),
          detail: `${format(parseISO(bestDay), 'EEE, MMM d')} · ${bestDayData.sessions} sessions`,
          icon: <Calendar className="h-4 w-4" />,
        });
      }
    }

    // 3. Most productive week (aggregate by week)
    const weeklyTotals: Map<string, { minutes: number; sessions: number; weekStart: Date }> = new Map();

    for (const session of sessions) {
      const sessionDate = parseISO(session.date);
      const weekStart = startOfWeek(sessionDate, { weekStartsOn: 1 }); // Monday
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      const current = weeklyTotals.get(weekKey) || { minutes: 0, sessions: 0, weekStart };
      current.minutes += session.activeMinutes;
      current.sessions += 1;
      weeklyTotals.set(weekKey, current);
    }

    if (weeklyTotals.size > 0) {
      const [bestWeekKey, bestWeek] = Array.from(weeklyTotals.entries()).reduce(
        ([maxKey, maxData], [key, data]) =>
          data.minutes > maxData.minutes ? [key, data] : [maxKey, maxData]
      );

      const weekEnd = endOfWeek(bestWeek.weekStart, { weekStartsOn: 1 });
      results.push({
        label: 'Best Week',
        value: formatMinutes(bestWeek.minutes),
        detail: `${format(bestWeek.weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')} · ${bestWeek.sessions} sessions`,
        icon: <TrendingUp className="h-4 w-4" />,
      });
    }

    // 4. Most sessions in a day
    if (daily && Object.keys(daily).length > 0) {
      const [busiestDay, busiestDayData] = Object.entries(daily).reduce(
        ([maxDate, maxData], [date, data]) =>
          data.sessions > maxData.sessions ? [date, data] : [maxDate, maxData],
        Object.entries(daily)[0]
      );

      if (busiestDayData && busiestDayData.sessions > 1) {
        results.push({
          label: 'Most Sessions',
          value: `${busiestDayData.sessions}`,
          detail: `${format(parseISO(busiestDay), 'EEE, MMM d')} · ${formatMinutes(busiestDayData.activeMinutes)}`,
          icon: <Trophy className="h-4 w-4" />,
        });
      }
    }

    return results;
  }, [sessions, daily]);

  if (records.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Personal Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {records.map((record) => (
            <div
              key={record.label}
              className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {record.icon}
                <span className="text-xs">{record.label}</span>
              </div>
              <div className="text-xl font-bold">{record.value}</div>
              <div className="text-xs text-muted-foreground truncate" title={record.detail}>
                {record.detail}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
