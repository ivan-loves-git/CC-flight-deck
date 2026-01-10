import fs from 'fs';
import path from 'path';
import os from 'os';
import matter from 'gray-matter';
import type { Command } from '@/lib/types';
import { getEnabledPluginPaths } from './plugins';

/**
 * Scans a directory for command files (*.md)
 */
function scanCommandsInDir(
  dir: string,
  scope: 'global' | 'project' | 'plugin',
  pluginName?: string
): Command[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const commands: Command[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (!file.endsWith('.md')) {
      continue;
    }

    try {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Try to parse YAML frontmatter, handle errors gracefully
      let description = 'No description';
      try {
        const { data } = matter(fileContent);
        description = data.description || 'No description';
      } catch {
        // If YAML parsing fails, use default description
      }

      const name = path.basename(file, '.md');

      // For plugin commands, prefix with plugin name
      const displayName = pluginName ? `${pluginName}:${name}` : name;

      commands.push({
        name: displayName,
        path: filePath,
        description,
        lastModified: stats.mtime,
        scope,
        pluginName,
      });
    } catch (error) {
      console.error(`Error scanning command file ${file}:`, error);
      // Continue processing other files
    }
  }

  return commands;
}

/**
 * Scans ~/.claude/commands/ and plugin commands directories
 * Extracts YAML frontmatter for description
 * Returns array of Command objects
 */
export async function scanCommands(): Promise<Command[]> {
  const commands: Command[] = [];

  try {
    // Scan global commands
    const globalCommandsDir = path.join(os.homedir(), '.claude', 'commands');
    commands.push(...scanCommandsInDir(globalCommandsDir, 'global'));

    // Scan plugin commands
    const enabledPlugins = getEnabledPluginPaths();
    for (const plugin of enabledPlugins) {
      const pluginCommandsDir = path.join(plugin.installPath, 'commands');
      commands.push(...scanCommandsInDir(pluginCommandsDir, 'plugin', plugin.name));
    }
  } catch (error) {
    console.error('Error scanning commands:', error);
    return [];
  }

  return commands;
}
