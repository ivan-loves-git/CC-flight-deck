import { NextResponse } from 'next/server';
import { scanUsageStats, getTotalStats } from '@/lib/scanner';
import type { UsageStats } from '@/lib/types';

export interface DiaryResponse {
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
}

export async function GET() {
  try {
    const stats = await scanUsageStats();
    const totals = getTotalStats(stats);

    const response: DiaryResponse = {
      stats,
      totals,
      lastUpdated: stats?.lastUpdated || null,
      hasData: stats !== null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching diary data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diary data', stats: null, totals: null, hasData: false },
      { status: 500 }
    );
  }
}
