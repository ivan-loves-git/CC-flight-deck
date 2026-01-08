import fs from 'fs';
import path from 'path';
import os from 'os';
import type { Hook } from '@/lib/types';

/**
 * Scans ~/.claude/hooks/ directory for hook files
 * Determines hook type from file extension
 * Returns array of Hook objects
 */
export async function scanHooks(): Promise<Hook[]> {
  const hooksDir = path.join(os.homedir(), '.claude', 'hooks');

  // Check if directory exists
  if (!fs.existsSync(hooksDir)) {
    return [];
  }

  const hooks: Hook[] = [];

  try {
    const files = fs.readdirSync(hooksDir);

    for (const file of files) {
      const filePath = path.join(hooksDir, file);
      const stats = fs.statSync(filePath);

      // Skip directories
      if (stats.isDirectory()) {
        continue;
      }

      // Determine hook type from file extension
      const ext = path.extname(file).toLowerCase();
      let type: Hook['type'] = 'other';

      if (ext === '.sh') {
        type = 'shell';
      } else if (ext === '.js' || ext === '.ts') {
        type = 'node';
      }

      // Extract hook name (filename without extension)
      const name = path.basename(file, ext);

      hooks.push({
        name,
        path: filePath,
        type,
        lastModified: stats.mtime,
      });
    }
  } catch (error) {
    console.error('Error scanning hooks:', error);
    return [];
  }

  return hooks;
}
