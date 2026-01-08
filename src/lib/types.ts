/**
 * Data models for Claude Code Flight Deck
 * Represents all customization types: Commands, Agents, Plugins, Hooks, and Skills
 */

/**
 * Command - A slash command (e.g., /commit)
 */
export interface Command {
  name: string;
  path: string;
  description: string;
  lastModified: Date;
  scope: 'global' | 'project';
  projectName?: string;
}

/**
 * Agent - A specialized AI worker
 */
export interface Agent {
  name: string;
  path: string;
  description: string;
  lastModified: Date;
}

/**
 * Plugin - An installed plugin with enabled/disabled status
 */
export interface Plugin {
  name: string;
  version: string;
  enabled: boolean;
  installedAt: Date;
  source: string;
}

/**
 * Hook - An automation script that runs on triggers
 */
export interface Hook {
  name: string;
  path: string;
  type: 'shell' | 'node' | 'other';
  lastModified: Date;
}

/**
 * Skill - A complex multi-step capability
 */
export interface Skill {
  name: string;
  path: string;
  description: string;
  lastModified: Date;
}

/**
 * ScanResponse - Complete scan result containing all customization types
 */
export interface ScanResponse {
  commands: Command[];
  agents: Agent[];
  plugins: Plugin[];
  hooks: Hook[];
  skills: Skill[];
  scannedAt: Date;
}
