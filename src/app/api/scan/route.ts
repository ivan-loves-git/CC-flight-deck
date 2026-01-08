import { NextResponse } from 'next/server';
import { scanAll } from '@/lib/scanner';

/**
 * GET /api/scan
 * Scans all Claude Code customizations and returns combined results
 */
export async function GET() {
  try {
    const results = await scanAll();
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error scanning Claude Code directories:', error);
    return NextResponse.json(
      { error: 'Failed to scan directories' },
      { status: 500 }
    );
  }
}
