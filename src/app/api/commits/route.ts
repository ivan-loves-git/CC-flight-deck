import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, access } from 'fs/promises';
import path from 'path';
import { FLIGHT_DATA_PATH, PROGETTI_PATH } from '@/lib/constants';
import type { Commit, CommitsResponse } from '@/lib/types';

const execAsync = promisify(exec);

/**
 * GET /api/commits
 * Fetch git commits from project directories for a date range
 * Query params:
 *   - from: Start date (YYYY-MM-DD), defaults to 7 days ago
 *   - to: End date (YYYY-MM-DD), defaults to today
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse date range from query params
    const today = new Date();
    const defaultFrom = new Date(today);
    defaultFrom.setDate(defaultFrom.getDate() - 7);

    const fromDate = searchParams.get('from') || defaultFrom.toISOString().split('T')[0];
    const toDate = searchParams.get('to') || today.toISOString().split('T')[0];

    // Get unique projects from flight-data.json
    let projects: string[] = [];
    try {
      const content = await readFile(FLIGHT_DATA_PATH, 'utf-8');
      const flightData = JSON.parse(content);

      // Collect all unique projects from sessions
      const projectSet = new Set<string>();
      for (const session of flightData.sessions || []) {
        for (const proj of session.projects || []) {
          projectSet.add(proj);
        }
      }
      projects = Array.from(projectSet);
    } catch {
      // No flight data, return empty
      return NextResponse.json({
        commits: [],
        total: 0,
        byProject: {},
        dateRange: { from: fromDate, to: toDate },
      });
    }

    // Fetch commits from each project
    const allCommits: Commit[] = [];
    const byProject: Record<string, number> = {};

    for (const project of projects) {
      const projectPath = path.join(PROGETTI_PATH, project);

      // Check if directory exists and is a git repo
      try {
        await access(path.join(projectPath, '.git'));
      } catch {
        // Not a git repo, skip
        continue;
      }

      try {
        // Git log with custom format: hash|short|timestamp|author|message
        // Add one day to toDate to include commits on that day
        const toDatePlusOne = new Date(toDate);
        toDatePlusOne.setDate(toDatePlusOne.getDate() + 1);
        const toDateStr = toDatePlusOne.toISOString().split('T')[0];

        const { stdout } = await execAsync(
          `git log --since="${fromDate}" --until="${toDateStr}" --format="%H|%h|%aI|%an|%s" --no-merges`,
          { cwd: projectPath, maxBuffer: 10 * 1024 * 1024 }
        );

        if (stdout.trim()) {
          const lines = stdout.trim().split('\n');
          for (const line of lines) {
            const [hash, shortHash, timestamp, author, ...messageParts] = line.split('|');
            const message = messageParts.join('|'); // Handle | in commit messages

            if (hash && timestamp) {
              allCommits.push({
                hash,
                shortHash,
                message: message || '',
                timestamp,
                project,
                author,
              });
              byProject[project] = (byProject[project] || 0) + 1;
            }
          }
        }
      } catch {
        // Git command failed for this project, skip
        continue;
      }
    }

    // Sort commits by timestamp (newest first)
    allCommits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const response: CommitsResponse = {
      commits: allCommits,
      total: allCommits.length,
      byProject,
      dateRange: { from: fromDate, to: toDate },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits', commits: [], total: 0, byProject: {} },
      { status: 500 }
    );
  }
}
