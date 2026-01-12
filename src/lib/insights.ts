import { parseISO, differenceInDays, format, subDays } from 'date-fns';
import type { Session, DailyStats } from './types';

export type InsightType = 'streak' | 'trend' | 'milestone' | 'suggestion' | 'comparison';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  icon: 'flame' | 'trending-up' | 'trophy' | 'lightbulb' | 'clock' | 'calendar';
  priority: number; // 1-10, higher = more important
}

/**
 * Detect coding streaks (consecutive days of activity)
 */
function detectStreak(daily: Record<string, DailyStats>): Insight | null {
  const today = new Date();
  const dates = Object.keys(daily).sort().reverse();

  if (dates.length === 0) return null;

  let streak = 0;
  let checkDate = today;

  for (let i = 0; i < 30; i++) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (daily[dateStr] && daily[dateStr].sessions > 0) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else if (i === 0) {
      // Today might not have activity yet, check yesterday
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  if (streak >= 3) {
    return {
      id: `streak-${streak}`,
      type: 'streak',
      title: `${streak}-Day Coding Streak!`,
      description: streak >= 7
        ? `You've been coding every day for ${streak} days. Incredible consistency!`
        : `Keep it going! You're on a ${streak}-day streak.`,
      icon: 'flame',
      priority: Math.min(streak, 10),
    };
  }

  return null;
}

/**
 * Detect productivity trends (comparing recent week to previous)
 */
function detectProductivityTrend(daily: Record<string, DailyStats>): Insight | null {
  const today = new Date();

  // Calculate last 7 days vs previous 7 days
  let recentMinutes = 0;
  let previousMinutes = 0;

  for (let i = 0; i < 7; i++) {
    const recentDate = format(subDays(today, i), 'yyyy-MM-dd');
    const previousDate = format(subDays(today, i + 7), 'yyyy-MM-dd');

    recentMinutes += daily[recentDate]?.activeMinutes || 0;
    previousMinutes += daily[previousDate]?.activeMinutes || 0;
  }

  if (previousMinutes === 0) return null;

  const changePercent = Math.round(((recentMinutes - previousMinutes) / previousMinutes) * 100);

  if (changePercent >= 20) {
    return {
      id: 'trend-up',
      type: 'trend',
      title: 'Productivity Up!',
      description: `You've coded ${changePercent}% more this week compared to last week.`,
      icon: 'trending-up',
      priority: 6,
    };
  }

  if (changePercent <= -30) {
    return {
      id: 'trend-down',
      type: 'comparison',
      title: 'Slower Week',
      description: `Activity is down ${Math.abs(changePercent)}% from last week. Taking a break?`,
      icon: 'clock',
      priority: 4,
    };
  }

  return null;
}

/**
 * Detect milestones (total hours, sessions, etc.)
 */
function detectMilestones(
  sessions: Session[],
  daily: Record<string, DailyStats>
): Insight | null {
  const totalMinutes = Object.values(daily).reduce((sum, d) => sum + d.activeMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalSessions = sessions.length;

  // Check for hour milestones
  const hourMilestones = [10, 25, 50, 100, 250, 500, 1000];
  for (const milestone of hourMilestones.reverse()) {
    if (totalHours >= milestone && totalHours < milestone * 1.1) {
      return {
        id: `milestone-hours-${milestone}`,
        type: 'milestone',
        title: `${milestone}+ Hours Milestone!`,
        description: `You've logged over ${milestone} hours of coding. Great progress!`,
        icon: 'trophy',
        priority: 8,
      };
    }
  }

  // Check for session milestones
  const sessionMilestones = [50, 100, 250, 500, 1000];
  for (const milestone of sessionMilestones.reverse()) {
    if (totalSessions >= milestone && totalSessions < milestone * 1.1) {
      return {
        id: `milestone-sessions-${milestone}`,
        type: 'milestone',
        title: `${milestone} Sessions!`,
        description: `You've completed ${milestone}+ coding sessions. Keep building!`,
        icon: 'trophy',
        priority: 7,
      };
    }
  }

  return null;
}

/**
 * Detect start time patterns
 */
function detectStartTimePattern(sessions: Session[]): Insight | null {
  if (sessions.length < 10) return null;

  const recentSessions = sessions.slice(0, 14);
  const olderSessions = sessions.slice(14, 28);

  if (olderSessions.length < 7) return null;

  // Extract hour from session IDs (format: YYYYMMDD_HHMMSS)
  const getHour = (session: Session): number | null => {
    const match = session.id.match(/^\d{8}_(\d{2})/);
    return match ? parseInt(match[1], 10) : null;
  };

  const recentHours = recentSessions.map(getHour).filter((h): h is number => h !== null);
  const olderHours = olderSessions.map(getHour).filter((h): h is number => h !== null);

  if (recentHours.length < 5 || olderHours.length < 5) return null;

  const recentAvg = recentHours.reduce((a, b) => a + b, 0) / recentHours.length;
  const olderAvg = olderHours.reduce((a, b) => a + b, 0) / olderHours.length;

  const diff = recentAvg - olderAvg;

  if (diff <= -1.5) {
    return {
      id: 'start-earlier',
      type: 'trend',
      title: 'Early Bird Mode',
      description: `You're starting about ${Math.abs(Math.round(diff))} hours earlier than usual lately.`,
      icon: 'clock',
      priority: 5,
    };
  }

  if (diff >= 1.5) {
    return {
      id: 'start-later',
      type: 'trend',
      title: 'Night Owl Mode',
      description: `You're starting about ${Math.round(diff)} hours later than usual lately.`,
      icon: 'clock',
      priority: 4,
    };
  }

  return null;
}

/**
 * Suggest underused commands/tools
 */
function detectUnderusedTools(sessions: Session[]): Insight | null {
  if (sessions.length < 10) return null;

  const recentSessions = sessions.slice(0, 10);
  const olderSessions = sessions.slice(10, 30);

  if (olderSessions.length < 10) return null;

  // Aggregate command usage
  const recentCommands = new Map<string, number>();
  const olderCommands = new Map<string, number>();

  for (const s of recentSessions) {
    for (const [cmd, count] of Object.entries(s.commands)) {
      recentCommands.set(cmd, (recentCommands.get(cmd) || 0) + count);
    }
  }

  for (const s of olderSessions) {
    for (const [cmd, count] of Object.entries(s.commands)) {
      olderCommands.set(cmd, (olderCommands.get(cmd) || 0) + count);
    }
  }

  // Find commands used before but not recently
  const droppedCommands: string[] = [];
  for (const [cmd, count] of olderCommands) {
    if (count >= 5 && !recentCommands.has(cmd)) {
      droppedCommands.push(cmd);
    }
  }

  if (droppedCommands.length > 0) {
    const cmd = droppedCommands[0];
    return {
      id: `unused-${cmd}`,
      type: 'suggestion',
      title: 'Forgotten Tool?',
      description: `You used to use ${cmd} frequently but haven't lately. Still useful?`,
      icon: 'lightbulb',
      priority: 3,
    };
  }

  return null;
}

/**
 * Detect weekend vs weekday patterns
 */
function detectWeekendPattern(daily: Record<string, DailyStats>): Insight | null {
  let weekdayMinutes = 0;
  let weekdayDays = 0;
  let weekendMinutes = 0;
  let weekendDays = 0;

  for (const [dateStr, stats] of Object.entries(daily)) {
    const date = parseISO(dateStr);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendMinutes += stats.activeMinutes;
      weekendDays++;
    } else {
      weekdayMinutes += stats.activeMinutes;
      weekdayDays++;
    }
  }

  if (weekendDays < 4 || weekdayDays < 10) return null;

  const weekdayAvg = weekdayMinutes / weekdayDays;
  const weekendAvg = weekendMinutes / weekendDays;

  if (weekendAvg > weekdayAvg * 1.5) {
    return {
      id: 'weekend-warrior',
      type: 'trend',
      title: 'Weekend Warrior',
      description: `You code ${Math.round((weekendAvg / weekdayAvg - 1) * 100)}% more on weekends than weekdays.`,
      icon: 'calendar',
      priority: 4,
    };
  }

  return null;
}

/**
 * Generate all insights from session data
 */
export function generateInsights(
  sessions: Session[],
  daily: Record<string, DailyStats>
): Insight[] {
  const insights: Insight[] = [];

  // Run all detectors
  const streak = detectStreak(daily);
  if (streak) insights.push(streak);

  const trend = detectProductivityTrend(daily);
  if (trend) insights.push(trend);

  const milestone = detectMilestones(sessions, daily);
  if (milestone) insights.push(milestone);

  const startTime = detectStartTimePattern(sessions);
  if (startTime) insights.push(startTime);

  const unused = detectUnderusedTools(sessions);
  if (unused) insights.push(unused);

  const weekend = detectWeekendPattern(daily);
  if (weekend) insights.push(weekend);

  // Sort by priority (highest first) and take top 3
  insights.sort((a, b) => b.priority - a.priority);
  return insights.slice(0, 3);
}
