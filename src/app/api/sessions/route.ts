import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { FLIGHT_DATA_PATH, ITERM_LOGS_PATH } from '@/lib/constants';
import type { Session } from '@/lib/types';

export interface SessionsResponse {
  sessions: Session[];
  total: number;
  generated: string;
}

export async function GET() {
  try {
    let content: string;
    try {
      content = await readFile(FLIGHT_DATA_PATH, 'utf-8');
    } catch {
      // File doesn't exist
      return NextResponse.json({
        sessions: [],
        total: 0,
        generated: new Date().toISOString(),
      });
    }

    const flightData = JSON.parse(content);

    // Add full file path to each session
    const sessions: Session[] = (flightData.sessions || []).map((s: Session) => ({
      ...s,
      filePath: path.join(ITERM_LOGS_PATH, s.filename),
    }));

    const response: SessionsResponse = {
      sessions,
      total: sessions.length,
      generated: flightData.lastUpdated || new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', sessions: [], total: 0 },
      { status: 500 }
    );
  }
}
