'use client';

/**
 * Variant D: "Single Screen Table"
 * - Everything in horizontal rows
 * - No cards, pure data rows
 * - Table-like without table structure
 * - Maximum vertical compression
 * - Every pixel counts
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { DashboardResponse, Commit, CommitsResponse } from '@/lib/types';
import { getProjectColor, getProjectName, formatMinutes } from '@/lib/diary-utils';

export function DiaryUltraD() {
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
      const from = subDays(today, 6).toISOString().split('T')[0];
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
    const start = subDays(today, 6);
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

  const dailyData = useMemo(() => {
    if (!data?.stats?.daily) return [];
    return eachDayOfInterval({ start: subDays(today, 6), end: today }).map(day => {
      const key = format(day, 'yyyy-MM-dd');
      const d = data.stats?.daily[key];
      // Get projects for this day
      const dayProjects: Record<string, number> = {};
      if (data?.sessions) {
        for (const s of data.sessions) {
          if (s.date === key) {
            for (const p of s.projects) {
              dayProjects[p] = (dayProjects[p] || 0) + s.activeMinutes;
            }
          }
        }
      }
      const topProj = Object.entries(dayProjects).sort(([,a],[,b]) => b - a)[0];
      return {
        date: key,
        day: format(day, 'EEE'),
        hours: (d?.activeMinutes || 0) / 60,
        sessions: d?.sessions || 0,
        topProject: topProj ? topProj[0] : null,
        commands: d?.topCommands?.slice(0, 3) || [],
      };
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
  const maxProj = Math.max(...topProjects.map(([, p]) => p.totalMinutes), 1);
  const maxCmd = Math.max(...topCommands.map(([, c]) => c.count), 1);

  return (
    <div className="p-1.5 text-[9px] leading-[1.4]">
      {/* Header Stats - Single Line */}
      {stats && (
        <div className="flex items-center gap-3 border-b pb-1 mb-1.5 text-[10px]">
          <span className="font-bold text-primary">{stats.hours}h</span>
          <span>{stats.sessions} sess</span>
          <span>{stats.projects} proj</span>
          <span>{stats.commands} cmd</span>
          <span>{stats.agents} agt</span>
          <span>{commits.length} commits</span>
          <span className="ml-auto text-muted-foreground">{format(today, 'MMM d')}</span>
        </div>
      )}

      {/* 4-Column Super Dense Grid */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-1">
        {/* Col 1: Daily Activity */}
        <div>
          <div className="text-[8px] text-muted-foreground border-b mb-0.5">DAILY</div>
          {dailyData.map(d => (
            <div
              key={d.date}
              className="flex items-center gap-0.5 cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/diary/${d.date}`)}
            >
              <span className="w-6 text-muted-foreground">{d.day}</span>
              <div className="w-12 h-1 bg-muted rounded-sm overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(d.hours / maxHours) * 100}%` }} />
              </div>
              <span className="w-7 text-right">{d.hours > 0 ? `${d.hours.toFixed(1)}` : '-'}</span>
            </div>
          ))}
        </div>

        {/* Col 2: Projects */}
        <div>
          <div className="text-[8px] text-muted-foreground border-b mb-0.5">PROJECTS</div>
          {topProjects.map(([name, proj]) => (
            <div key={name} className="flex items-center gap-0.5">
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: getProjectColor(name) }} />
              <span className="truncate flex-1">{getProjectName(name)}</span>
              <div className="w-8 h-1 bg-muted rounded-sm overflow-hidden">
                <div className="h-full" style={{ width: `${(proj.totalMinutes / maxProj) * 100}%`, backgroundColor: getProjectColor(name) }} />
              </div>
            </div>
          ))}
        </div>

        {/* Col 3: Commands */}
        <div>
          <div className="text-[8px] text-muted-foreground border-b mb-0.5">COMMANDS</div>
          {topCommands.map(([name, cmd]) => (
            <div key={name} className="flex items-center gap-0.5">
              <span className="truncate flex-1">{name}</span>
              <div className="w-6 h-1 bg-muted rounded-sm overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${(cmd.count / maxCmd) * 100}%` }} />
              </div>
              <span className="w-5 text-right text-muted-foreground">{cmd.count}</span>
            </div>
          ))}
        </div>

        {/* Col 4: Sessions + Commits */}
        <div>
          <div className="text-[8px] text-muted-foreground border-b mb-0.5">SESSIONS</div>
          {data.sessions?.slice(0, 5).map(s => (
            <div
              key={s.id}
              className="flex items-center gap-0.5 cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/diary/${s.date}`)}
            >
              <span className="text-muted-foreground">{format(parseISO(s.date), 'M/d')}</span>
              <span className="truncate flex-1">{s.projects[0] ? getProjectName(s.projects[0]).slice(0, 10) : '-'}</span>
              <span className="text-muted-foreground">{formatMinutes(s.activeMinutes)}</span>
            </div>
          ))}
          {commits.length > 0 && (
            <>
              <div className="text-[8px] text-muted-foreground border-b mb-0.5 mt-1">COMMITS</div>
              {commits.slice(0, 4).map(c => (
                <div key={c.hash} className="flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: getProjectColor(c.project) }} />
                  <span className="truncate text-muted-foreground">{c.message}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Micro Activity Heatmap - Bottom */}
      <div className="border-t mt-1.5 pt-1">
        <div className="flex items-center gap-0.5">
          <span className="text-[8px] text-muted-foreground w-12">7-day:</span>
          {dailyData.map(d => {
            const intensity = d.hours === 0 ? 0 : d.hours < 2 ? 1 : d.hours < 4 ? 2 : d.hours < 8 ? 3 : 4;
            const colors = ['bg-zinc-800', 'bg-green-900', 'bg-green-700', 'bg-green-500', 'bg-green-400'];
            return (
              <div
                key={d.date}
                className={`w-6 h-3 rounded-sm ${colors[intensity]} cursor-pointer`}
                onClick={() => router.push(`/diary/${d.date}`)}
              >
                <span className="text-[7px] text-center block text-white/70">{d.day[0]}</span>
              </div>
            );
          })}
          <span className="text-[8px] text-muted-foreground ml-1">
            peak: {Math.max(...dailyData.map(d => d.hours)).toFixed(1)}h
          </span>
        </div>
      </div>
    </div>
  );
}
