'use client';

import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { DashboardResponse, Commit, CommitsResponse } from '@/lib/types';
import { getProjectColor, getProjectName, formatMinutes } from '@/lib/diary-utils';

type PeriodType = 'today' | 'week' | '15days' | 'month';

export function DiaryUltraA() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [commits, setCommits] = useState<Commit[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) setData(await response.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchCommits() {
      const today = new Date();
      const days = period === 'today' ? 1 : period === 'week' ? 7 : period === '15days' ? 15 : 30;
      const from = subDays(today, days - 1).toISOString().split('T')[0];
      const to = today.toISOString().split('T')[0];
      try {
        const res = await fetch(`/api/commits?from=${from}&to=${to}`);
        if (res.ok) { const d: CommitsResponse = await res.json(); setCommits(d.commits); }
      } catch { /* ignore */ }
    }
    fetchCommits();
  }, [period]);

  const today = useMemo(() => new Date(), []);
  const periodDays = period === 'today' ? 1 : period === 'week' ? 7 : period === '15days' ? 15 : 30;

  const stats = useMemo(() => {
    if (!data?.stats?.daily) return null;
    const start = subDays(today, periodDays - 1);
    let sessions = 0, minutes = 0, commands = 0, agents = 0;
    const projects = new Set<string>();
    const skills = new Set<string>();

    for (const [date, d] of Object.entries(data.stats.daily)) {
      if (parseISO(date) >= start && parseISO(date) <= today) {
        sessions += d.sessions;
        minutes += d.activeMinutes;
        commands += d.topCommands?.reduce((s, c) => s + c.count, 0) || 0;
        agents += d.topAgents?.reduce((s, a) => s + a.count, 0) || 0;
        d.projects.forEach(p => projects.add(p));
        d.topCommands?.forEach(c => skills.add(c.name));
      }
    }
    return { sessions, hours: Math.round(minutes / 6) / 10, commands, agents, projects: projects.size, skills: skills.size };
  }, [data, periodDays, today]);

  const dailyData = useMemo(() => {
    if (!data?.stats?.daily) return [];
    return eachDayOfInterval({ start: subDays(today, 6), end: today }).map(day => {
      const key = format(day, 'yyyy-MM-dd');
      const d = data.stats?.daily[key];
      return { date: key, hours: (d?.activeMinutes || 0) / 60, sessions: d?.sessions || 0 };
    });
  }, [data, today]);

  const topProjects = useMemo(() => {
    if (!data?.stats?.projects) return [];
    return Object.entries(data.stats.projects)
      .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
      .slice(0, 8);
  }, [data]);

  const topCommands = useMemo(() => {
    if (!data?.stats?.commands) return [];
    return Object.entries(data.stats.commands)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 12);
  }, [data]);

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!data?.hasData) return <div className="text-center py-6 text-muted-foreground text-xs">No data</div>;

  const maxHours = Math.max(...dailyData.map(d => d.hours), 1);

  return (
    <div className="p-2 text-[11px] space-y-2">
      <div className="flex items-center gap-3 border-b pb-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-20 h-6 text-[10px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="15days">15d</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
        {stats && (
          <div className="flex gap-4 text-[10px]">
            <Stat label="HRS" value={stats.hours} />
            <Stat label="SESS" value={stats.sessions} />
            <Stat label="PROJ" value={stats.projects} />
            <Stat label="CMD" value={stats.commands} />
            <Stat label="AGT" value={stats.agents} />
            <Stat label="SKIL" value={stats.skills} />
            <Stat label="CMIT" value={commits.length} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">7-Day Activity</div>
          <svg className="w-full h-10" viewBox="0 0 100 30">
            <polyline
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              points={dailyData.map((d, i) => `${i * (100 / 6)},${30 - (d.hours / maxHours) * 28}`).join(' ')}
            />
            {dailyData.map((d, i) => (
              <circle key={d.date} cx={i * (100 / 6)} cy={30 - (d.hours / maxHours) * 28} r="2" fill="hsl(var(--primary))" />
            ))}
          </svg>
          <div className="flex justify-between text-[8px] text-muted-foreground">
            {dailyData.map(d => <span key={d.date}>{format(parseISO(d.date), 'E')[0]}</span>)}
          </div>
          <div className="space-y-0.5 mt-1">
            {dailyData.map(d => (
              <div key={d.date} className="flex items-center gap-1 cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/diary/${d.date}`)}>
                <span className="w-6 text-muted-foreground">{format(parseISO(d.date), 'EEE')}</span>
                <div className="flex-1 h-1.5 bg-muted rounded">
                  <div className="h-full bg-primary/70 rounded" style={{ width: `${(d.hours / maxHours) * 100}%` }} />
                </div>
                <span className="w-8 text-right">{d.hours > 0 ? `${d.hours.toFixed(1)}h` : '-'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Projects</div>
          <div className="space-y-0.5">
            {topProjects.map(([name, proj]) => (
              <div key={name} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getProjectColor(name) }} />
                <span className="flex-1 truncate">{getProjectName(name)}</span>
                <span className="text-muted-foreground">{formatMinutes(proj.totalMinutes)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Commands</div>
            <div className="flex flex-wrap gap-0.5 mt-0.5">
              {topCommands.map(([name, cmd]) => (
                <span key={name} className="px-1 bg-muted rounded text-[9px]">
                  {name}<span className="text-muted-foreground ml-0.5">{cmd.count}</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Recent</div>
            <div className="space-y-0.5 mt-0.5">
              {data.sessions?.slice(0, 5).map(s => (
                <div key={s.id} className="flex gap-1 cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/diary/${s.date}`)}>
                  <span className="text-muted-foreground">{format(parseISO(s.date), 'M/d')}</span>
                  <span className="truncate flex-1">{s.projects[0] ? getProjectName(s.projects[0]) : '-'}</span>
                  <span>{formatMinutes(s.activeMinutes)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {commits.length > 0 && (
        <div className="border-t pt-1">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Commits ({commits.length})</div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px]">
            {commits.slice(0, 8).map(c => (
              <span key={c.hash} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getProjectColor(c.project) }} />
                <span className="truncate max-w-[150px] text-muted-foreground">{c.message}</span>
              </span>
            ))}
            {commits.length > 8 && <span className="text-muted-foreground">+{commits.length - 8}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-bold text-sm">{value}</span>
      <span className="text-muted-foreground text-[8px]">{label}</span>
    </div>
  );
}
