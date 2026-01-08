import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs';

const execFileAsync = promisify(execFile);

// Allowed base directories for security
const ALLOWED_BASES = [
  path.join(os.homedir(), '.claude'),
  path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs', 'Progetti'),
];

function isPathAllowed(filePath: string): boolean {
  // Resolve to absolute path and normalize
  const resolved = path.resolve(filePath);

  // Check if path is under an allowed base directory
  return ALLOWED_BASES.some(base => resolved.startsWith(base));
}

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, action } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // Security: validate path is under allowed directories
    if (!isPathAllowed(filePath)) {
      return NextResponse.json(
        { error: 'Access denied: path not in allowed directories' },
        { status: 403 }
      );
    }

    // Verify path exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File or directory not found' },
        { status: 404 }
      );
    }

    if (action === 'reveal') {
      // Reveal in Finder (macOS)
      await execFileAsync('open', ['-R', filePath]);
    } else {
      // Default: open in VS Code using execFile (safe from injection)
      await execFileAsync('code', [filePath]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to open file:', error);
    return NextResponse.json(
      { error: 'Failed to open file' },
      { status: 500 }
    );
  }
}
