import type { Session, DailyStats } from './types';

export type WarningSeverity = 'info' | 'warning' | 'error';

export interface DataHealthWarning {
  id: string;
  severity: WarningSeverity;
  title: string;
  description: string;
  affectedCount: number;
  details?: string[];
}

/**
 * Detect sessions with identical activeMinutes (especially 180-minute clustering)
 * This often indicates a bug in duration calculation falling back to defaults
 */
function detectIdenticalDurations(sessions: Session[]): DataHealthWarning | null {
  if (sessions.length < 3) return null;

  // Count occurrences of each duration
  const durationCounts = new Map<number, number>();
  for (const session of sessions) {
    const count = durationCounts.get(session.activeMinutes) || 0;
    durationCounts.set(session.activeMinutes, count + 1);
  }

  // Find durations that appear suspiciously often (>30% of sessions)
  const threshold = Math.max(3, sessions.length * 0.3);
  const suspiciousDurations: Array<{ duration: number; count: number }> = [];

  for (const [duration, count] of durationCounts) {
    if (count >= threshold) {
      suspiciousDurations.push({ duration, count });
    }
  }

  // Special check for 180 minutes (known default fallback)
  const count180 = durationCounts.get(180) || 0;
  if (count180 >= 2 && !suspiciousDurations.some(d => d.duration === 180)) {
    suspiciousDurations.push({ duration: 180, count: count180 });
  }

  if (suspiciousDurations.length === 0) return null;

  const details = suspiciousDurations.map(
    ({ duration, count }) => `${count} sessions with exactly ${duration} minutes`
  );

  return {
    id: 'identical-durations',
    severity: suspiciousDurations.some(d => d.duration === 180) ? 'warning' : 'info',
    title: 'Identical Session Durations',
    description: 'Multiple sessions have the exact same duration, which may indicate a calculation fallback.',
    affectedCount: suspiciousDurations.reduce((sum, d) => sum + d.count, 0),
    details,
  };
}

/**
 * Detect days exceeding 16 hours total (960 minutes)
 * This indicates parallel sessions or data errors
 */
function detectExcessiveDays(daily: Record<string, DailyStats>): DataHealthWarning | null {
  const MAX_REASONABLE_MINUTES = 960; // 16 hours
  const excessiveDays: string[] = [];

  for (const [date, stats] of Object.entries(daily)) {
    if (stats.activeMinutes > MAX_REASONABLE_MINUTES) {
      const hours = Math.round(stats.activeMinutes / 60 * 10) / 10;
      excessiveDays.push(`${date}: ${hours}h (${stats.sessions} sessions)`);
    }
  }

  if (excessiveDays.length === 0) return null;

  return {
    id: 'excessive-daily-hours',
    severity: 'warning',
    title: 'Days Exceeding 16 Hours',
    description: 'Some days show more than 16 hours of activity, likely from parallel sessions.',
    affectedCount: excessiveDays.length,
    details: excessiveDays.slice(0, 5),
  };
}

/**
 * Detect sessions with no project detected
 */
function detectNoProjectSessions(sessions: Session[]): DataHealthWarning | null {
  const noProjectSessions = sessions.filter(
    s => !s.projects || s.projects.length === 0
  );

  if (noProjectSessions.length === 0) return null;

  // Only warn if significant portion has no project
  const percentage = (noProjectSessions.length / sessions.length) * 100;
  if (percentage < 10 && noProjectSessions.length < 3) return null;

  return {
    id: 'no-project-sessions',
    severity: 'info',
    title: 'Sessions Without Project',
    description: 'Some sessions could not be associated with a project directory.',
    affectedCount: noProjectSessions.length,
    details: [`${Math.round(percentage)}% of sessions have no project detected`],
  };
}

/**
 * Detect sessions with very short durations (possible false starts)
 */
function detectVeryShortSessions(sessions: Session[]): DataHealthWarning | null {
  const shortSessions = sessions.filter(s => s.activeMinutes < 2);

  if (shortSessions.length < 3) return null;

  const percentage = (shortSessions.length / sessions.length) * 100;
  if (percentage < 5) return null;

  return {
    id: 'very-short-sessions',
    severity: 'info',
    title: 'Very Short Sessions',
    description: 'Multiple sessions under 2 minutes may indicate false starts or test sessions.',
    affectedCount: shortSessions.length,
    details: [`${shortSessions.length} sessions under 2 minutes`],
  };
}

/**
 * Run all data health checks and return warnings
 */
export function checkDataHealth(
  sessions: Session[],
  daily: Record<string, DailyStats>
): DataHealthWarning[] {
  const warnings: DataHealthWarning[] = [];

  const identicalDurations = detectIdenticalDurations(sessions);
  if (identicalDurations) warnings.push(identicalDurations);

  const excessiveDays = detectExcessiveDays(daily);
  if (excessiveDays) warnings.push(excessiveDays);

  const noProjectSessions = detectNoProjectSessions(sessions);
  if (noProjectSessions) warnings.push(noProjectSessions);

  const shortSessions = detectVeryShortSessions(sessions);
  if (shortSessions) warnings.push(shortSessions);

  // Sort by severity (error > warning > info)
  const severityOrder: Record<WarningSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
  };
  warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return warnings;
}
