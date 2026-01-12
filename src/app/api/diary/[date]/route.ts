import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { FLIGHT_DATA_PATH, ITERM_LOGS_PATH } from '@/lib/constants';
import type { Session, DayDetail } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    let content: string;
    try {
      content = await readFile(FLIGHT_DATA_PATH, 'utf-8');
    } catch {
      return NextResponse.json(
        { error: 'No flight data found' },
        { status: 404 }
      );
    }

    const flightData = JSON.parse(content);

    // Filter sessions for this date and add filePath
    const daySessions: Session[] = (flightData.sessions || [])
      .filter((s: { date: string }) => s.date === date)
      .map((s: Omit<Session, 'filePath'>) => ({
        ...s,
        filePath: path.join(ITERM_LOGS_PATH, s.filename),
      }));

    if (daySessions.length === 0) {
      return NextResponse.json({
        date,
        sessions: [],
        totalMinutes: 0,
        totalSessions: 0,
        projects: [],
        topCommands: [],
        topAgents: [],
      });
    }

    // Calculate totals
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.activeMinutes, 0);
    const totalSessions = daySessions.length;

    // Aggregate projects with time estimation
    const projectMap = new Map<string, number>();
    for (const session of daySessions) {
      for (const proj of session.projects) {
        const current = projectMap.get(proj) || 0;
        projectMap.set(proj, current + session.activeMinutes);
      }
    }

    const projects = Array.from(projectMap.entries())
      .map(([name, minutes]) => ({
        name,
        minutes,
        percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    // Aggregate commands
    const commandMap = new Map<string, number>();
    for (const session of daySessions) {
      for (const [cmd, count] of Object.entries(session.commands)) {
        commandMap.set(cmd, (commandMap.get(cmd) || 0) + count);
      }
    }

    const topCommands = Array.from(commandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Aggregate agents
    const agentMap = new Map<string, number>();
    for (const session of daySessions) {
      for (const [agent, count] of Object.entries(session.agents)) {
        agentMap.set(agent, (agentMap.get(agent) || 0) + count);
      }
    }

    const topAgents = Array.from(agentMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get day summary from timeline if exists
    const daySummary = flightData.timeline?.[date]?.daySummary;

    const response: DayDetail = {
      date,
      sessions: daySessions,
      totalMinutes,
      totalSessions,
      projects,
      topCommands,
      topAgents,
      daySummary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching day detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch day detail' },
      { status: 500 }
    );
  }
}
