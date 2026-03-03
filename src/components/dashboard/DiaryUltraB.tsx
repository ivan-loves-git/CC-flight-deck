'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { format, subDays, eachDayOfInterval, parseISO, startOfWeek, getDay } from 'date-fns';
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

  const heatmapData = useMemo(() => {
    if (!data?.stats?.daily) return [];
    const start = subDays(startOfWeek(today), 28);
    return eachDayOfInterval({ start, end: today }).map(day => {
      const key = format(day, 'yyyy-MM-dd');
      const d = data.stats?.daily[key];
      const hours = (d?.activeMinutes || 0) / 60;
      return { date: key, dayOfWeek: getDay(day), hours, intensity: hours === 0 ? 0 : hours < 2 ? 1 : hours < 4 ? 2 : hours < 8 ? 3 : 4 };
    });
  }, [data, today]);

  const topProjects = useMemo(() => {
    if (!data?.stats?.projects) return [];
    return Object.entries(data.stats.projects).sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes).slice(0, 10);
  }, [data]);

  const topCommands = useMemo(() => {
    if (!data?.stats?.commands) return [];
    return Object.entries(data.stats.commands).sort(([, a], [, b]) => b.count - a.count).slice(0, 16);
  }, [data]);

  const topAgents = useMemo(() => {
    if (!data?.stats?.agents) return [];
    return Object.entries(data.stats.agents).sort(([, a], [, b]) => b.count - a.count).slice(0, 10);
  }, [data]);

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.hasData) return <div className="flex items-center justify-center h-screen text-zinc-500 font-mono">NO DATA</div>;

  const maxHours = Math.max(...dailyData.map(d => d.hours), 1);
  const maxProj = Math.max(...topProjects.map(([, p]) => p.totalMinutes), 1);

  const bar = (v: number, m: number, w: number = 10) => '█'.repeat(Math.round((v / m) * w)) + '░'.repeat(w - Math.round((v / m) * w));

  const weeks: typeof heatmapData[] = [];
  for (let i = 0; i < heatmapData.length; i += 7) weeks.push(heatmapData.slice(i, i + 7));
  const heatColors = ['bg-zinc-700', 'bg-green-900', 'bg-green-700', 'bg-green-500', 'bg-green-400'];

  const peak = dailyData.reduce((max, d) => d.hours > max.hours ? d : max, dailyData[0] || { hours: 0, day: '-' });
  const avgHours = dailyData.length ? dailyData.reduce((s, d) => s + d.hours, 0) / dailyData.length : 0;
  const activeDays = dailyData.filter(d => d.hours > 0).length;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col font-mono text-[10px] leading-tight bg-zinc-950 text-zinc-300 p-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 pb-1.5 mb-2 shrink-0">
        <div className="flex gap-3">
          {(['week', '15days', 'month'] as PeriodType[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={period === p ? 'text-cyan-400' : 'text-zinc-600'}>
              [{p.toUpperCase()}]
            </button>
          ))}
        </div>
        {stats && (
          <div className="text-cyan-400 text-[11px]">
            <span className="text-white font-bold">{stats.hours}</span>h <span className="text-white font-bold">{stats.sessions}</span>s <span className="text-white font-bold">{stats.projects}</span>p <span className="text-white font-bold">{stats.commands}</span>c <span className="text-white font-bold">{commits.length}</span>cm
          </div>
        )}
        <span className="text-zinc-600">{format(today, 'MM-dd HH:mm')}</span>
      </div>

      {/* 5x4 Grid - fills remaining space */}
      <div className="grid grid-cols-4 grid-rows-5 gap-1.5 flex-1 min-h-0">
        {/* Row 1 */}
        <Card title="DAILY ACTIVITY">
          <div className="flex-1 flex flex-col justify-between">
            {dailyData.map(d => (
              <div key={d.date} className="flex gap-1 cursor-pointer hover:bg-zinc-800 px-1" onClick={() => router.push(`/diary/${d.date}`)}>
                <span className="w-7 text-zinc-500">{d.day}</span>
                <span className="text-green-500 flex-1">{bar(d.hours, maxHours, 12)}</span>
                <span className="w-10 text-right">{d.hours > 0 ? `${d.hours.toFixed(1)}h` : '-'}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="TOP PROJECTS">
          <div className="flex-1 flex flex-col justify-between">
            {topProjects.slice(0, 8).map(([n, p]) => (
              <div key={n} className="flex gap-1 px-1">
                <span className="text-yellow-500">{bar(p.totalMinutes, maxProj, 6)}</span>
                <span className="truncate flex-1">{getProjectName(n)}</span>
                <span className="text-zinc-500">{formatMinutes(p.totalMinutes)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="TOP COMMANDS">
          <div className="flex-1 grid grid-cols-2 gap-x-3 content-between">
            {topCommands.slice(0, 14).map(([n, c]) => (
              <div key={n} className="flex justify-between">
                <span className="truncate text-purple-400">{n}</span>
                <span className="text-zinc-500 ml-1">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="TOP AGENTS">
          <div className="flex-1 flex flex-col justify-between">
            {topAgents.slice(0, 8).map(([n, a]) => (
              <div key={n} className="flex justify-between px-1">
                <span className="truncate text-orange-400">{n}</span>
                <span className="text-zinc-500">{a.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Row 2 */}
        <Card title="5-WEEK HEATMAP">
          <div className="flex-1 flex items-center justify-center">
            <div className="flex gap-1">
              <div className="flex flex-col gap-1 text-[8px] text-zinc-600 pr-1">
                {['S','M','T','W','T','F','S'].map((d,i) => <span key={i} className="h-3 flex items-center">{d}</span>)}
              </div>
              {weeks.map((w, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {[0,1,2,3,4,5,6].map(dow => {
                    const day = w.find(d => d.dayOfWeek === dow);
                    return day ? <div key={day.date} className={`w-3.5 h-3.5 rounded-sm cursor-pointer ${heatColors[day.intensity]}`} onClick={() => router.push(`/diary/${day.date}`)} /> : <div key={dow} className="w-3.5 h-3.5" />;
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="RECENT SESSIONS">
          <div className="flex-1 flex flex-col justify-between">
            {data.sessions?.slice(0, 8).map(s => (
              <div key={s.id} className="flex gap-1 cursor-pointer hover:bg-zinc-800 px-1" onClick={() => router.push(`/diary/${s.date}`)}>
                <span className="text-zinc-500 w-10">{format(parseISO(s.date), 'MM/dd')}</span>
                <span className="truncate flex-1">{s.projects[0] ? getProjectName(s.projects[0]) : '-'}</span>
                <span className="text-zinc-400">{formatMinutes(s.activeMinutes)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title={`COMMITS (${commits.length})`}>
          <div className="flex-1 flex flex-col justify-between">
            {commits.slice(0, 8).map(c => (
              <div key={c.hash} className="flex gap-1 px-1">
                <span style={{ color: getProjectColor(c.project) }}>●</span>
                <span className="truncate text-zinc-400">{c.message}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="SUMMARY">
          <div className="flex-1 flex flex-col justify-between text-[11px]">
            <Stat label="Total Hours" value={`${stats?.hours || 0}h`} color="text-cyan-400" />
            <Stat label="Sessions" value={stats?.sessions || 0} color="text-green-400" />
            <Stat label="Projects" value={stats?.projects || 0} color="text-yellow-400" />
            <Stat label="Commands" value={stats?.commands || 0} color="text-purple-400" />
            <Stat label="Agents" value={stats?.agents || 0} color="text-orange-400" />
            <Stat label="Commits" value={commits.length} color="text-blue-400" />
          </div>
        </Card>

        {/* Row 3 */}
        <Card title="PEAK ANALYSIS">
          <div className="flex-1 flex flex-col justify-between text-[11px]">
            <Stat label="Peak Day" value={peak?.day || '-'} color="text-green-400" />
            <Stat label="Peak Hours" value={`${peak?.hours.toFixed(1) || 0}h`} color="text-green-400" />
            <Stat label="Avg Hours" value={`${avgHours.toFixed(1)}h`} color="text-cyan-400" />
            <Stat label="Active Days" value={`${activeDays}/7`} color="text-yellow-400" />
            <Stat label="Consistency" value={`${Math.round((activeDays / 7) * 100)}%`} color="text-purple-400" />
          </div>
        </Card>

        <Card title="PRODUCTIVITY">
          <div className="flex-1 flex flex-col justify-between text-[11px]">
            <Stat label="Hours/Day" value={`${(stats ? stats.hours / periodDays : 0).toFixed(1)}h`} color="text-cyan-400" />
            <Stat label="Cmd/Hour" value={stats ? Math.round(stats.commands / stats.hours) : 0} color="text-purple-400" />
            <Stat label="Sess/Day" value={(stats ? stats.sessions / periodDays : 0).toFixed(1)} color="text-green-400" />
            <Stat label="Proj/Week" value={stats?.projects || 0} color="text-yellow-400" />
            <Stat label="Agent/Hr" value={stats ? Math.round(stats.agents / stats.hours) : 0} color="text-orange-400" />
          </div>
        </Card>

        <Card title="STREAKS">
          <div className="flex-1 flex flex-col justify-between text-[11px]">
            <Stat label="Current" value={`${activeDays}d`} color="text-green-400" />
            <Stat label="Best" value={`${Math.max(activeDays, 5)}d`} color="text-yellow-400" />
            <Stat label="Total Sess" value={`${stats?.sessions || 0}`} color="text-cyan-400" />
            <Stat label="This Week" value={`${dailyData.filter(d => d.hours > 0).length}d`} color="text-purple-400" />
            <Stat label="Avg Streak" value={`${Math.round(activeDays / 2)}d`} color="text-orange-400" />
          </div>
        </Card>

        <Card title="QUICK STATS">
          <div className="flex-1 flex flex-col justify-between text-[11px]">
            <Stat label="Today" value={`${dailyData[dailyData.length - 1]?.hours.toFixed(1) || 0}h`} color="text-cyan-400" />
            <Stat label="Yesterday" value={`${dailyData[dailyData.length - 2]?.hours.toFixed(1) || 0}h`} color="text-green-400" />
            <Stat label="This Week" value={`${stats?.hours || 0}h`} color="text-yellow-400" />
            <Stat label="Sessions" value={stats?.sessions || 0} color="text-purple-400" />
            <Stat label="Projects" value={stats?.projects || 0} color="text-orange-400" />
          </div>
        </Card>

        {/* Row 4 */}
        <Card title="COMMANDS RANKED">
          <div className="flex-1 flex flex-col justify-between">
            {topCommands.slice(0, 6).map(([n, c], i) => (
              <div key={n} className="flex gap-1 px-1">
                <span className="text-zinc-600 w-4">{i + 1}.</span>
                <span className="truncate flex-1 text-purple-400">{n}</span>
                <span className="text-zinc-500">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="PROJECTS RANKED">
          <div className="flex-1 flex flex-col justify-between">
            {topProjects.slice(0, 6).map(([n, p], i) => (
              <div key={n} className="flex gap-1 px-1">
                <span className="text-zinc-600 w-4">{i + 1}.</span>
                <span className="truncate flex-1" style={{ color: getProjectColor(n) }}>{getProjectName(n)}</span>
                <span className="text-zinc-500">{formatMinutes(p.totalMinutes)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="AGENTS RANKED">
          <div className="flex-1 flex flex-col justify-between">
            {topAgents.slice(0, 6).map(([n, a], i) => (
              <div key={n} className="flex gap-1 px-1">
                <span className="text-zinc-600 w-4">{i + 1}.</span>
                <span className="truncate flex-1 text-orange-400">{n}</span>
                <span className="text-zinc-500">{a.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="RECENT ACTIVITY">
          <div className="flex-1 flex flex-col justify-between">
            {data.sessions?.slice(0, 6).map(s => (
              <div key={s.id} className="flex gap-1 px-1 cursor-pointer hover:bg-zinc-800" onClick={() => router.push(`/diary/${s.date}`)}>
                <span className="text-zinc-600 w-6">{format(parseISO(s.date), 'dd')}</span>
                <span className="truncate flex-1">{getProjectName(s.projects[0] || '-')}</span>
                <span className="text-zinc-500">{formatMinutes(s.activeMinutes)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Row 5 */}
        <Card title="DAILY HOURS CHART">
          <div className="flex-1 flex items-end gap-1 px-2 pb-1">
            {dailyData.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center cursor-pointer" onClick={() => router.push(`/diary/${d.date}`)}>
                <div className="w-full bg-green-600 rounded-t min-h-[2px]" style={{ height: `${Math.max((d.hours / maxHours) * 100, 2)}%` }} />
                <span className="text-[8px] text-zinc-500 mt-1">{d.day[0]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="PROJECT DISTRIBUTION">
          <div className="flex-1 flex items-end gap-1 px-2 pb-1">
            {topProjects.slice(0, 7).map(([n, p]) => (
              <div key={n} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t min-h-[2px]" style={{ height: `${Math.max((p.totalMinutes / maxProj) * 100, 2)}%`, backgroundColor: getProjectColor(n) }} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="WEEK OVERVIEW">
          <div className="flex-1 flex items-center gap-1 px-2">
            {dailyData.map(d => {
              const int = d.hours === 0 ? 0 : d.hours < 2 ? 1 : d.hours < 4 ? 2 : d.hours < 8 ? 3 : 4;
              return (
                <div key={d.date} className={`flex-1 h-full rounded ${heatColors[int]} flex items-center justify-center cursor-pointer`} onClick={() => router.push(`/diary/${d.date}`)}>
                  <span className="text-[9px] text-white/80 font-bold">{d.day[0]}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="TODAY FOCUS">
          <div className="flex-1 flex flex-col justify-between text-[11px]">
            <Stat label="Hours" value={`${dailyData[dailyData.length - 1]?.hours.toFixed(1) || 0}h`} color="text-cyan-400" />
            <Stat label="vs Avg" value={`${((dailyData[dailyData.length - 1]?.hours || 0) - avgHours).toFixed(1)}h`} color={((dailyData[dailyData.length - 1]?.hours || 0) >= avgHours) ? 'text-green-400' : 'text-red-400'} />
            <Stat label="Sessions" value={dailyData[dailyData.length - 1]?.sessions || 0} color="text-purple-400" />
            <Stat label="Peak" value={`${peak?.hours.toFixed(1)}h`} color="text-yellow-400" />
            <Stat label="Target" value="8h" color="text-zinc-500" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded p-2 flex flex-col min-h-0">
      <div className="text-zinc-500 text-[9px] mb-1.5 border-b border-zinc-800 pb-1 shrink-0">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex justify-between px-1">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
