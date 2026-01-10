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
  scope: 'global' | 'project' | 'plugin';
  projectName?: string;
  pluginName?: string; // If from a plugin, which one
}

/**
 * Agent - A specialized AI worker
 */
export interface Agent {
  name: string;
  path: string;
  description: string;
  lastModified: Date;
  scope: 'global' | 'plugin';
  pluginName?: string; // If from a plugin, which one
  category?: string; // Agent category (e.g., 'review', 'research', 'design')
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
  path: string;
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
  scope: 'global' | 'plugin';
  pluginName?: string; // If from a plugin, which one
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

/**
 * ItemType - Type of customization item
 */
export type ItemType = 'command' | 'agent' | 'plugin' | 'hook' | 'skill';

/**
 * UnifiedItem - A unified representation of any item for table display
 */
export interface UnifiedItem {
  id: string; // Unique ID (path or name)
  name: string;
  type: ItemType;
  description: string;
  path: string;
  lastModified: Date;
  scope: 'global' | 'project' | 'plugin' | 'n/a';
  pluginName?: string;
  category?: string; // For agents
  enabled?: boolean; // For plugins
  version?: string; // For plugins
  source?: string; // For plugins
  hookType?: 'shell' | 'node' | 'other'; // For hooks
}
