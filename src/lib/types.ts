/**
 * Claude Code Flight Deck - Type Definitions
 *
 * Data models for commands, agents, plugins, hooks, skills, and scan responses.
 */

export interface Command {
  name: string;
  path: string;
  description: string;
  lastModified: Date;
  scope: 'global' | 'project';
  projectName?: string;
}

export interface Agent {
  name: string;
  path: string;
  description: string;
  lastModified: Date;
}

export interface Plugin {
  name: string;
  version: string;
  enabled: boolean;
  installedAt: Date;
  source: string;
}

export interface Hook {
  name: string;
  path: string;
  type: 'shell' | 'node' | 'other';
  lastModified: Date;
}

export interface Skill {
  name: string;
  path: string;
  description: string;
  lastModified: Date;
}

export interface ScanResponse {
  commands: Command[];
  agents: Agent[];
  plugins: Plugin[];
  hooks: Hook[];
  skills: Skill[];
  scannedAt: Date;
}
