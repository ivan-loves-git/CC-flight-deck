import fs from 'fs';
import path from 'path';
import os from 'os';
import matter from 'gray-matter';
import type { Skill } from '@/lib/types';

/**
 * Scans ~/.claude/skills/ directory for skill folders
 * Extracts description from SKILL.md frontmatter if present
 * Returns array of Skill objects
 */
export async function scanSkills(): Promise<Skill[]> {
  const skillsDir = path.join(os.homedir(), '.claude', 'skills');

  // Check if directory exists
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const skills: Skill[] = [];

  try {
    const items = fs.readdirSync(skillsDir);

    for (const item of items) {
      const itemPath = path.join(skillsDir, item);

      // Use lstatSync to not follow symlinks, and wrap in try/catch for broken symlinks
      let stats;
      try {
        stats = fs.lstatSync(itemPath);
      } catch (error) {
        // Skip items we can't stat (broken symlinks, permission issues)
        console.error(`Skipping ${item}: unable to stat`);
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
      } catch (error) {
        // If we can't read description, use default
        console.error(`Error reading skill description for ${item}:`, error);
      }

      skills.push({
        name: item,
        path: itemPath,
        description,
        lastModified: stats.mtime,
      });
    }
  } catch (error) {
    console.error('Error scanning skills:', error);
    return [];
  }

  return skills;
}
