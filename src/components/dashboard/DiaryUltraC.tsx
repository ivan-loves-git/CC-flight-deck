'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { format, subDays, eachDayOfInterval, parseISO, startOfWeek, getDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { DashboardResponse, Commit, CommitsResponse } from '@/lib/types';
import { getProjectColor, getProjectName, formatMinutes } from '@/lib/diary-utils';

export function DiaryUltraC() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
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
      const from = subDays(today, 29).toISOString().split('T')[0];
      const to = today.toISOString().split('T')[0];
      try {
        const res = await fetch(`/api/commits?from=${from}&to=${to}`);
        if (res.ok) { const d: CommitsResponse = await res.json(); setCommits(d.commits); }
      } catch { /* ignore */ }
    }
    fetchCommits();
  }, []);

  const today = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    if (!data?.stats?.daily) return null;
    const start = subDays(today, 29);
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
    return { sessions, hours: Math.round(minutes / 6) / 10, commands, agents, projects: projects.size };
  }, [data, today]);

  const heatmapData = useMemo(() => {
    if (!data?.stats?.daily) return [];
    const start = subDays(startOfWeek(today), 28);
    const days = eachDayOfInterval({ start, end: today });

    return days.map(day => {
      const key = format(day, 'yyyy-MM-dd');
      const d = data.stats?.daily[key];
      const hours = (d?.activeMinutes || 0) / 60;
      return {
        date: key,
        dayOfWeek: getDay(day),
        hours,
        intensity: hours === 0 ? 0 : hours < 2 ? 1 : hours < 4 ? 2 : hours < 8 ? 3 : 4,
      };
    });
  }, [data, today]);

  const topProjects = useMemo(() => {
    if (!data?.stats?.projects) return [];
    return Object.entries(data.stats.projects)
      .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
      .slice(0, 5);
  }, [data]);

  const topCommands = useMemo(() => {
    if (!data?.stats?.commands) return [];
    return Object.entries(data.stats.commands)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 6);
  }, [data]);

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!data?.hasData) return <div className="text-center py-6 text-muted-foreground text-xs">No data</div>;

  const weeks: typeof heatmapData[] = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const intensityColors = ['bg-zinc-800', 'bg-emerald-900', 'bg-emerald-700', 'bg-emerald-500', 'bg-emerald-300'];

  return (
    <div className="p-2 text-[10px] space-y-2">
      {stats && (
        <div className="flex gap-2 flex-wrap">
          <Pill label="Hours" value={stats.hours} color="bg-blue-500/20 text-blue-400" />
          <Pill label="Sessions" value={stats.sessions} color="bg-purple-500/20 text-purple-400" />
          <Pill label="Projects" value={stats.projects} color="bg-green-500/20 text-green-400" />
          <Pill label="Commands" value={stats.commands} color="bg-yellow-500/20 text-yellow-400" />
          <Pill label="Commits" value={commits.length} color="bg-orange-500/20 text-orange-400" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <div className="text-[9px] text-muted-foreground mb-1">ACTIVITY (5 WEEKS)</div>
          <div className="flex gap-0.5">
            <div className="flex flex-col gap-0.5 text-[8px] text-muted-foreground pr-1">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {[0, 1, 2, 3, 4, 5, 6].map(dow => {
                  const day = week.find(d => d.dayOfWeek === dow);
                  if (!day) return <div key={dow} className="w-4 h-4" />;
                  return (
                    <div
                      key={day.date}
                      className={`w-4 h-4 rounded-sm cursor-pointer ${intensityColors[day.intensity]}`}
                      onClick={() => router.push(`/diary/${day.date}`)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[8px] text-muted-foreground">
            <span>Less</span>
            {intensityColors.map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}
            <span>More</span>
          </div>
        </div>

        <div>
          <div className="text-[9px] text-muted-foreground mb-1">TOP PROJECTS</div>
          <div className="space-y-1">
            {topProjects.map(([name, proj]) => (
              <div key={name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getProjectColor(name) }} />
                <span className="truncate flex-1">{getProjectName(name)}</span>
                <span className="text-muted-foreground text-[9px]">{formatMinutes(proj.totalMinutes)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t pt-2">
        <div>
          <div className="text-[9px] text-muted-foreground mb-1">COMMANDS</div>
          <div className="flex flex-wrap gap-1">
            {topCommands.map(([name, cmd]) => (
              <span key={name} className="px-1 bg-muted rounded text-[9px]">
                {name} <span className="text-muted-foreground">{cmd.count}</span>
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[9px] text-muted-foreground mb-1">RECENT</div>
          <div className="space-y-0.5">
            {data.sessions?.slice(0, 4).map(s => (
              <div key={s.id} className="flex gap-1 text-[9px] cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/diary/${s.date}`)}>
                <span className="text-muted-foreground">{format(parseISO(s.date), 'M/d')}</span>
                <span className="truncate">{s.projects[0] ? getProjectName(s.projects[0]) : '-'}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[9px] text-muted-foreground mb-1">COMMITS ({commits.length})</div>
          <div className="space-y-0.5">
            {commits.slice(0, 4).map(c => (
              <div key={c.hash} className="flex gap-1 text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: getProjectColor(c.project) }} />
                <span className="truncate text-muted-foreground">{c.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`px-2 py-0.5 rounded-full ${color} flex items-center gap-1`}>
      <span className="font-bold">{value}</span>
      <span className="text-[8px] opacity-70">{label}</span>
    </div>
  );
}
