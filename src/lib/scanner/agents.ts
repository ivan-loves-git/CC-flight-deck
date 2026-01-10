import fs from 'fs';
import path from 'path';
import os from 'os';
import type { Agent } from '@/lib/types';
import { getEnabledPluginPaths } from './plugins';

/**
 * Scans a directory for agent files (*.md), including subdirectories
 */
function scanAgentsInDir(
  dir: string,
  scope: 'global' | 'plugin',
  pluginName?: string,
  category?: string
): Agent[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const agents: Agent[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively scan subdirectories (for plugin agents organized by category)
      agents.push(...scanAgentsInDir(entryPath, scope, pluginName, entry.name));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const stats = fs.statSync(entryPath);
      const fileContent = fs.readFileSync(entryPath, 'utf-8');
      const baseName = path.basename(entry.name, '.md');
      const description = extractFirstParagraph(fileContent);

      // For plugin agents, prefix with plugin name and optionally category
      let displayName = baseName;
      if (pluginName) {
        displayName = category
          ? `${pluginName}:${category}:${baseName}`
          : `${pluginName}:${baseName}`;
      }

      agents.push({
        name: displayName,
        path: entryPath,
        description,
        lastModified: stats.mtime,
        scope,
        pluginName,
        category,
      });
    }
  }

  return agents;
}

/**
 * Scans ~/.claude/agents/ and plugin agents directories
 * Extracts first paragraph as description
 * Returns array of Agent objects
 */
export async function scanAgents(): Promise<Agent[]> {
  const agents: Agent[] = [];

  try {
    // Scan global agents
    const globalAgentsDir = path.join(os.homedir(), '.claude', 'agents');
    agents.push(...scanAgentsInDir(globalAgentsDir, 'global'));

    // Scan plugin agents
    const enabledPlugins = getEnabledPluginPaths();
    for (const plugin of enabledPlugins) {
      const pluginAgentsDir = path.join(plugin.installPath, 'agents');
      agents.push(...scanAgentsInDir(pluginAgentsDir, 'plugin', plugin.name));
    }
  } catch (error) {
    console.error('Error scanning agents:', error);
    return [];
  }

  return agents;
}

/**
 * Extracts the first non-empty paragraph from markdown content
 * Skips YAML frontmatter if present
 */
function extractFirstParagraph(content: string): string {
  // Remove YAML frontmatter if present
  let textContent = content;
  if (content.startsWith('---')) {
    const endOfFrontmatter = content.indexOf('---', 3);
    if (endOfFrontmatter !== -1) {
      textContent = content.slice(endOfFrontmatter + 3);
    }
  }

  // Split by double newlines to get paragraphs
  const paragraphs = textContent
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Return first paragraph or default message
  if (paragraphs.length > 0) {
    // Remove markdown formatting for cleaner description
    return paragraphs[0]
      .replace(/^#+\s+/, '') // Remove headers
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '') // Remove italic
      .replace(/`/g, '') // Remove code
      .trim();
  }

  return 'No description';
}
