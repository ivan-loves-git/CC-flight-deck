import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { FLIGHT_DATA_PATH } from '@/lib/constants';
import type { FlightData, Session } from '@/lib/types';

/**
 * GET /api/export
 * Export flight data in various formats
 * Query params:
 *   - format: 'json' | 'csv' (default: json)
 *   - from: Start date (YYYY-MM-DD), optional
 *   - to: End date (YYYY-MM-DD), optional
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // Read flight data
    let flightData: FlightData;
    try {
      const content = await readFile(FLIGHT_DATA_PATH, 'utf-8');
      flightData = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: 'No flight data available' },
        { status: 404 }
      );
    }

    // Filter sessions by date range if specified
    let sessions = flightData.sessions || [];
    if (fromDate || toDate) {
      sessions = sessions.filter((session: Session) => {
        const sessionDate = session.date.split('T')[0];
        if (fromDate && sessionDate < fromDate) return false;
        if (toDate && sessionDate > toDate) return false;
        return true;
      });
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const dateRangeSuffix = fromDate || toDate
      ? `-${fromDate || 'start'}-to-${toDate || 'end'}`
      : '';
    const filename = `flight-data${dateRangeSuffix}-${timestamp}`;

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(sessions);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // Compute date range from sessions if not specified
    const sessionDates = sessions.map(s => s.date.split('T')[0]).sort();
    const computedFrom = fromDate || sessionDates[0] || '';
    const computedTo = toDate || sessionDates[sessionDates.length - 1] || '';

    // Default: JSON format
    const exportData = {
      exportedAt: new Date().toISOString(),
      dateRange: {
        from: computedFrom,
        to: computedTo,
      },
      sessionCount: sessions.length,
      sessions,
      // Include aggregates for the filtered period
      summary: calculateSummary(sessions),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

/**
 * Convert sessions to CSV format
 */
function convertToCSV(sessions: Session[]): string {
  if (sessions.length === 0) {
    return 'date,activeMinutes,idleMinutesExcluded,projects,commands,agents\n';
  }

  const headers = [
    'date',
    'activeMinutes',
    'idleMinutesExcluded',
    'projects',
    'commands',
    'agents',
  ];

  const rows = sessions.map((session) => {
    const projects = session.projects?.join('; ') || '';
    // Convert commands Record to string
    const commands = Object.entries(session.commands || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => `${name}(${count})`)
      .join('; ');
    // Convert agents Record to string
    const agents = Object.entries(session.agents || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => `${name}(${count})`)
      .join('; ');

    return [
      session.date,
      session.activeMinutes,
      session.idleMinutesExcluded || 0,
      `"${projects}"`,
      `"${commands}"`,
      `"${agents}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Calculate summary statistics for filtered sessions
 */
function calculateSummary(sessions: Session[]) {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalActiveMinutes: 0,
      totalIdleMinutesExcluded: 0,
      uniqueProjects: 0,
      averageSessionMinutes: 0,
    };
  }

  const totalActiveMinutes = sessions.reduce((sum, s) => sum + s.activeMinutes, 0);
  const totalIdleMinutesExcluded = sessions.reduce((sum, s) => sum + (s.idleMinutesExcluded || 0), 0);
  const allProjects = new Set(sessions.flatMap(s => s.projects || []));

  return {
    totalSessions: sessions.length,
    totalActiveMinutes,
    totalIdleMinutesExcluded,
    uniqueProjects: allProjects.size,
    averageSessionMinutes: Math.round(totalActiveMinutes / sessions.length),
  };
}
