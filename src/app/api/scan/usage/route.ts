import { NextResponse } from 'next/server';
import { scanUsageStats } from '@/lib/scanner/usage';

/**
 * GET /api/scan/usage
 * Returns usage statistics from flight-data.json (local file read)
 */
export async function GET() {
  try {
    const stats = await scanUsageStats();
    if (!stats) {
      return NextResponse.json({
        commands: {},
        agents: {},
        skills: {},
        tools: {},
        projects: {},
        daily: {},
      });
    }
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error reading usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to read usage statistics' },
      { status: 500 }
    );
  }
}
