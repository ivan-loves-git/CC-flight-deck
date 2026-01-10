import fs from 'fs';
import path from 'path';
import os from 'os';
import matter from 'gray-matter';
import type { Skill } from '@/lib/types';
import { getEnabledPluginPaths } from './plugins';

/**
 * Scans a directory for skill folders
 */
function scanSkillsInDir(
  dir: string,
  scope: 'global' | 'plugin',
  pluginName?: string
): Skill[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const skills: Skill[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);

    // Use lstatSync to not follow symlinks
    let stats;
    try {
      stats = fs.lstatSync(itemPath);
    } catch {
      continue;
    }

    // Skip files and symlinks - we only want directories
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      continue;
    }

    // Look for SKILL.md or README.md to extract description
    let description = 'No description';
    const skillMdPath = path.join(itemPath, 'SKILL.md');
    const readmePath = path.join(itemPath, 'README.md');

    try {
      if (fs.existsSync(skillMdPath)) {
        const content = fs.readFileSync(skillMdPath, 'utf-8');
        const parsed = matter(content);
        if (parsed.data.description) {
          description = parsed.data.description;
        }
      } else if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf-8');
        const parsed = matter(content);
        if (parsed.data.description) {
          description = parsed.data.description;
        }
      }
    } catch {
      // If we can't read description, use default
    }

    // For plugin skills, prefix with plugin name
    const displayName = pluginName ? `${pluginName}:${item}` : item;

    skills.push({
      name: displayName,
      path: itemPath,
      description,
      lastModified: stats.mtime,
      scope,
      pluginName,
    });
  }

  return skills;
}

/**
 * Scans ~/.claude/skills/ and plugin skills directories
 * Extracts description from SKILL.md frontmatter if present
 * Returns array of Skill objects
 */
export async function scanSkills(): Promise<Skill[]> {
  const skills: Skill[] = [];

  try {
    // Scan global skills
    const globalSkillsDir = path.join(os.homedir(), '.claude', 'skills');
    skills.push(...scanSkillsInDir(globalSkillsDir, 'global'));

    // Scan plugin skills
    const enabledPlugins = getEnabledPluginPaths();
    for (const plugin of enabledPlugins) {
      const pluginSkillsDir = path.join(plugin.installPath, 'skills');
      skills.push(...scanSkillsInDir(pluginSkillsDir, 'plugin', plugin.name));
    }
  } catch (error) {
    console.error('Error scanning skills:', error);
    return [];
  }

  return skills;
}
