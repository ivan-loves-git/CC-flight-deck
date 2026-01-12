import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { scanUsageStats, getTotalStats } from '@/lib/scanner';
import { FLIGHT_DATA_PATH, ITERM_LOGS_PATH } from '@/lib/constants';
import type { UsageStats, Session } from '@/lib/types';

/**
 * DashboardResponse - Combined response for the dashboard
 * Replaces separate /api/diary and /api/sessions calls
 */
export interface DashboardResponse {
  // From /api/diary
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

  // From /api/sessions
  sessions: Session[];
}

/**
 * GET /api/dashboard
 * Returns all data needed for the DiaryView in a single request
 */
export async function GET() {
  try {
    // Fetch usage stats (same as /api/diary)
    const stats = await scanUsageStats();
    const totals = getTotalStats(stats);

    // Fetch sessions (same as /api/sessions)
    let sessions: Session[] = [];
    try {
      const content = await readFile(FLIGHT_DATA_PATH, 'utf-8');
      const flightData = JSON.parse(content);
      sessions = (flightData.sessions || []).map((s: Session) => ({
        ...s,
        filePath: path.join(ITERM_LOGS_PATH, s.filename),
      }));
    } catch {
      // File doesn't exist, sessions stays empty
    }

    const response: DashboardResponse = {
      stats,
      totals,
      lastUpdated: stats?.lastUpdated || null,
      hasData: stats !== null,
      sessions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        stats: null,
        totals: null,
        hasData: false,
        sessions: [],
      },
      { status: 500 }
    );
  }
}
