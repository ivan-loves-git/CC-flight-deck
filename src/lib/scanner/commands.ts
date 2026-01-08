import fs from 'fs';
import path from 'path';
import os from 'os';
import matter from 'gray-matter';
import type { Command } from '@/lib/types';

/**
 * Scans ~/.claude/commands/ directory for command files
 * Extracts YAML frontmatter for description
 * Returns array of Command objects
 */
export async function scanCommands(): Promise<Command[]> {
  const commandsDir = path.join(os.homedir(), '.claude', 'commands');

  // Check if directory exists
  if (!fs.existsSync(commandsDir)) {
    return [];
  }

  const commands: Command[] = [];

  try {
    const files = fs.readdirSync(commandsDir);

    for (const file of files) {
      // Only process .md files
      if (!file.endsWith('.md')) {
        continue;
      }

      const filePath = path.join(commandsDir, file);
      const stats = fs.statSync(filePath);

      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Parse YAML frontmatter
      const { data } = matter(fileContent);

      // Extract command name (filename without .md extension)
      const name = path.basename(file, '.md');

      // Extract description from frontmatter, or use default
      const description = data.description || 'No description';

      commands.push({
        name,
        path: filePath,
        description,
        lastModified: stats.mtime,
        scope: 'global', // All commands in ~/.claude/commands are global
      });
    }
  } catch (error) {
    console.error('Error scanning commands:', error);
    return [];
  }

  return commands;
}
