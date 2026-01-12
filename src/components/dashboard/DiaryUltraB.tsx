'use client';

/**
 * Variant B: "Terminal Style"
 * - Monospace font throughout
 * - ASCII-inspired bars
 * - Dense text-based display
 * - No decorative elements, pure data
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { DashboardResponse, Commit, CommitsResponse } from '@/lib/types';
import { getProjectName, formatMinutes, getProjectColor } from '@/lib/diary-utils';

type PeriodType = 'week' | '15days' | 'month';

export function DiaryUltraB() {
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
      const days = period === 'week' ? 7 : period === '15days' ? 15 : 30;
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
  const periodDays = period === 'week' ? 7 : period === '15days' ? 15 : 30;

  const stats = useMemo(() => {
    if (!data?.stats?.daily) return null;
    const start = subDays(today, periodDays - 1);
    let sessions = 0, minutes = 0, commands = 0, agents = 0;
    const projects = new Set<string>();

    for (const [date, d] of Object.entries(data.stats.daily)) {
      if (parseISO(date) >= start && parseISO(date) <= today) {
        sessions += d.sessions;
        minutes += d.activeMinutes;
        commands += d.topCommands?.reduce((s, c) => s + c.count, 0) || 0;
        agents += d.topAgents?.reduce((s, a) => s + a.count, 0) || 0;
        d.projects.forEach(p => projects.add(p));
      }
    }
    return { sessions, hours: Math.round(minutes / 6) / 10, minutes, commands, agents, projects: projects.size };
  }, [data, periodDays, today]);

  const dailyData = useMemo(() => {
    if (!data?.stats?.daily) return [];
    return eachDayOfInterval({ start: subDays(today, 6), end: today }).map(day => {
      const key = format(day, 'yyyy-MM-dd');
      const d = data.stats?.daily[key];
      return { date: key, day: format(day, 'EEE'), hours: (d?.activeMinutes || 0) / 60, sessions: d?.sessions || 0 };
    });
  }, [data, today]);

  const topProjects = useMemo(() => {
    if (!data?.stats?.projects) return [];
    return Object.entries(data.stats.projects)
      .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
      .slice(0, 6);
  }, [data]);

  const topCommands = useMemo(() => {
    if (!data?.stats?.commands) return [];
    return Object.entries(data.stats.commands)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 8);
  }, [data]);

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!data?.hasData) return <div className="text-center py-6 text-muted-foreground font-mono text-xs">NO DATA</div>;

  const maxHours = Math.max(...dailyData.map(d => d.hours), 1);
  const maxProj = Math.max(...topProjects.map(([, p]) => p.totalMinutes), 1);

  // ASCII bar helper
  const asciiBar = (value: number, max: number, width: number = 20) => {
    const filled = Math.round((value / max) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  };

  return (
    <div className="p-2 font-mono text-[10px] leading-tight bg-zinc-950 text-zinc-300 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 pb-1 mb-2">
        <div className="flex gap-4">
          {['week', '15days', 'month'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as PeriodType)}
              className={`${period === p ? 'text-cyan-400' : 'text-zinc-500'}`}
            >
              [{p.toUpperCase()}]
            </button>
          ))}
        </div>
        <span className="text-zinc-500">{format(today, 'yyyy-MM-dd HH:mm')}</span>
      </div>

      {/* Stats Line */}
      {stats && (
        <div className="text-cyan-400 mb-2">
          HRS:{stats.hours} SESS:{stats.sessions} PROJ:{stats.projects} CMD:{stats.commands} AGT:{stats.agents} CMIT:{commits.length}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left: Daily + Projects */}
        <div className="space-y-2">
          <div className="text-zinc-500">─── DAILY ───</div>
          {dailyData.map(d => (
            <div
              key={d.date}
              className="flex gap-1 cursor-pointer hover:bg-zinc-800"
              onClick={() => router.push(`/diary/${d.date}`)}
            >
              <span className="w-8 text-zinc-500">{d.day}</span>
              <span className="text-green-500">{asciiBar(d.hours, maxHours, 16)}</span>
              <span className="w-10 text-right">{d.hours > 0 ? `${d.hours.toFixed(1)}h` : '  -  '}</span>
            </div>
          ))}

          <div className="text-zinc-500 mt-2">─── PROJECTS ───</div>
          {topProjects.map(([name, proj]) => (
            <div key={name} className="flex gap-1">
              <span className="text-yellow-500">{asciiBar(proj.totalMinutes, maxProj, 12)}</span>
              <span className="w-12 text-right text-zinc-400">{formatMinutes(proj.totalMinutes)}</span>
              <span className="truncate">{getProjectName(name)}</span>
            </div>
          ))}
        </div>

        {/* Right: Commands + Sessions + Commits */}
        <div className="space-y-2">
          <div className="text-zinc-500">─── COMMANDS ───</div>
          <div className="grid grid-cols-2 gap-x-2">
            {topCommands.map(([name, cmd]) => (
              <div key={name} className="flex justify-between">
                <span className="truncate text-purple-400">{name}</span>
                <span className="text-zinc-500">{cmd.count}</span>
              </div>
            ))}
          </div>

          <div className="text-zinc-500 mt-2">─── SESSIONS ───</div>
          {data.sessions?.slice(0, 4).map(s => (
            <div
              key={s.id}
              className="flex gap-2 cursor-pointer hover:bg-zinc-800"
              onClick={() => router.push(`/diary/${s.date}`)}
            >
              <span className="text-zinc-500">{format(parseISO(s.date), 'MM/dd')}</span>
              <span className="truncate flex-1">{s.projects[0] ? getProjectName(s.projects[0]) : '-'}</span>
              <span className="text-zinc-400">{formatMinutes(s.activeMinutes)}</span>
            </div>
          ))}

          {commits.length > 0 && (
            <>
              <div className="text-zinc-500 mt-2">─── COMMITS ({commits.length}) ───</div>
              {commits.slice(0, 4).map(c => (
                <div key={c.hash} className="flex gap-1 text-[9px]">
                  <span style={{ color: getProjectColor(c.project) }}>●</span>
                  <span className="truncate text-zinc-400">{c.message}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
