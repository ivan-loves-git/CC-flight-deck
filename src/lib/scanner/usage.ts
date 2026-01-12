import { readFile } from 'fs/promises';
import type { UsageStats } from '@/lib/types';
import { FLIGHT_DATA_PATH, USAGE_STATS_PATH } from '@/lib/constants';

/**
 * Scan and read usage statistics from flight-data.json (or legacy usage-stats.json)
 */
export async function scanUsageStats(): Promise<UsageStats | null> {
  // Try flight-data.json first (new unified format from /term-diary)
  try {
    const content = await readFile(FLIGHT_DATA_PATH, 'utf-8');
    const flightData = JSON.parse(content);

    // Transform flight-data format to UsageStats format
    const stats: UsageStats = {
      version: flightData.version || '2.0',
      lastUpdated: flightData.lastUpdated,
      dateRange: flightData.dateRange,
      commands: {},
      agents: {},
      skills: {},
      tools: flightData.aggregates?.tools || {},
      projects: {},
      daily: {}
    };

    // Map commands from aggregates
    if (flightData.aggregates?.commands) {
      for (const [cmd, data] of Object.entries(flightData.aggregates.commands)) {
        const cmdData = data as { total: number; lastUsed: string; byDate: Record<string, number> };
        stats.commands[cmd] = {
          count: cmdData.total,
          lastUsed: cmdData.lastUsed,
          byDate: cmdData.byDate
        };
      }
    }

    // Map agents from aggregates
    if (flightData.aggregates?.agents) {
      for (const [agent, data] of Object.entries(flightData.aggregates.agents)) {
        const agentData = data as { total: number; lastUsed: string; byDate: Record<string, number> };
        stats.agents[agent] = {
          count: agentData.total,
          lastUsed: agentData.lastUsed,
          byDate: agentData.byDate
        };
      }
    }

    // Map timeline to daily
    // Cap activeMinutes at 1440 (24 hours) per day since parallel sessions can exceed wall-clock time
    const MAX_MINUTES_PER_DAY = 1440;
    if (flightData.timeline) {
      for (const [date, data] of Object.entries(flightData.timeline)) {
        const dayData = data as {
          sessions: number;
          activeMinutes: number;
          projects: string[];
          depth?: 'quick' | 'medium' | 'deep';
          topCommands?: Array<{ name: string; count: number }>;
          topAgents?: Array<{ name: string; count: number }>;
        };
        stats.daily[date] = {
          sessions: dayData.sessions,
          activeMinutes: Math.min(dayData.activeMinutes, MAX_MINUTES_PER_DAY),
          projects: dayData.projects,
          topCommands: dayData.topCommands,
          topAgents: dayData.topAgents
        };
      }
    }

    // Map project data with topCommands/topAgents
    if (flightData.aggregates?.projects) {
      for (const [proj, data] of Object.entries(flightData.aggregates.projects)) {
        const projData = data as {
          sessions: number;
          totalMinutes: number;
          lastWorked: string;
          topCommands?: string[];
          topAgents?: string[];
        };
        stats.projects[proj] = {
          sessions: projData.sessions,
          totalMinutes: projData.totalMinutes,
          lastWorked: projData.lastWorked,
          topCommands: projData.topCommands,
          topAgents: projData.topAgents
        };
      }
    }

    return stats;
  } catch {
    // flight-data.json doesn't exist or failed to parse, try legacy file
  }

  // Fall back to legacy usage-stats.json
  try {
    const content = await readFile(USAGE_STATS_PATH, 'utf-8');
    const stats: UsageStats = JSON.parse(content);
    return stats;
  } catch {
    // Legacy file doesn't exist either
  }

  return null;
}

/**
 * Get usage count for a specific item
 */
export function getUsageCount(
  stats: UsageStats | null,
  type: 'command' | 'agent' | 'skill',
  name: string
): number {
  if (!stats) return 0;

  const section =
    type === 'command'
      ? stats.commands
      : type === 'agent'
        ? stats.agents
        : stats.skills;

  // Normalize name (add / prefix for commands/skills if missing)
  let key = name;
  if (type !== 'agent' && !name.startsWith('/')) {
    key = `/${name}`;
  }

  return section[key]?.count || section[name]?.count || 0;
}

/**
 * Get last used date for a specific item
 */
export function getLastUsed(
  stats: UsageStats | null,
  type: 'command' | 'agent' | 'skill',
  name: string
): Date | null {
  if (!stats) return null;

  const section =
    type === 'command'
      ? stats.commands
      : type === 'agent'
        ? stats.agents
        : stats.skills;

  let key = name;
  if (type !== 'agent' && !name.startsWith('/')) {
    key = `/${name}`;
  }

  const item = section[key] || section[name];
  if (!item?.lastUsed) return null;

  return new Date(item.lastUsed);
}

/**
 * Get project statistics
 */
export function getProjectStats(stats: UsageStats | null, projectName: string) {
  if (!stats?.projects) return null;
  return stats.projects[projectName] || null;
}

/**
 * Get daily statistics for a date range
 */
export function getDailyStats(
  stats: UsageStats | null,
  startDate: string,
  endDate: string
): Record<string, { sessions: number; activeMinutes: number; projects: string[] }> {
  if (!stats?.daily) return {};

  const result: Record<string, { sessions: number; activeMinutes: number; projects: string[] }> = {};

  for (const [date, dayStats] of Object.entries(stats.daily)) {
    if (date >= startDate && date <= endDate) {
      result[date] = dayStats;
    }
  }

  return result;
}

/**
 * Get total statistics
 */
export function getTotalStats(stats: UsageStats | null) {
  if (!stats) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      totalCommands: 0,
      totalAgents: 0,
      totalSkills: 0,
      projectCount: 0,
    };
  }

  const totalCommands = Object.values(stats.commands).reduce((sum, c) => sum + c.count, 0);
  const totalAgents = Object.values(stats.agents).reduce((sum, a) => sum + a.count, 0);
  const totalSkills = Object.values(stats.skills).reduce((sum, s) => sum + s.count, 0);
  const totalMinutes = Object.values(stats.daily).reduce((sum, d) => sum + d.activeMinutes, 0);
  const totalSessions = Object.values(stats.daily).reduce((sum, d) => sum + d.sessions, 0);

  return {
    totalSessions,
    totalMinutes,
    totalCommands,
    totalAgents,
    totalSkills,
    projectCount: Object.keys(stats.projects).length,
  };
}
