import fs from 'fs';
import path from 'path';
import os from 'os';
import type { Agent } from '@/lib/types';

/**
 * Scans ~/.claude/agents/ directory for agent files
 * Extracts first paragraph as description
 * Returns array of Agent objects
 */
export async function scanAgents(): Promise<Agent[]> {
  const agentsDir = path.join(os.homedir(), '.claude', 'agents');

  // Check if directory exists
  if (!fs.existsSync(agentsDir)) {
    return [];
  }

  const agents: Agent[] = [];

  try {
    const files = fs.readdirSync(agentsDir);

    for (const file of files) {
      // Only process .md files
      if (!file.endsWith('.md')) {
        continue;
      }

      const filePath = path.join(agentsDir, file);
      const stats = fs.statSync(filePath);

      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Extract command name (filename without .md extension)
      const name = path.basename(file, '.md');

      // Extract first paragraph as description
      const description = extractFirstParagraph(fileContent);

      agents.push({
        name,
        path: filePath,
        description,
        lastModified: stats.mtime,
      });
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
