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
  usageCount?: number; // From usage-stats.json
  lastUsed?: Date; // From usage-stats.json
}

/**
 * ItemUsage - Usage statistics for a command, agent, or skill
 */
export interface ItemUsage {
  count: number;
  lastUsed: string;
  byDate: Record<string, number>;
}

/**
 * ProjectUsage - Usage statistics for a project
 */
export interface ProjectUsage {
  sessions: number;
  totalMinutes: number;
  lastWorked: string;
  topCommands?: string[];
  topAgents?: string[];
}

/**
 * DailyStats - Statistics for a single day
 */
export interface DailyStats {
  sessions: number;
  activeMinutes: number;
  idleMinutesExcluded?: number; // Total idle time excluded across all sessions
  projects: string[];
  topCommands?: Array<{ name: string; count: number }>;
  topAgents?: Array<{ name: string; count: number }>;
  daySummary?: string;
}

/**
 * UsageStats - Complete usage statistics from term-diary
 */
export interface UsageStats {
  version: string;
  lastUpdated: string;
  dateRange: {
    from: string;
    to: string;
  };
  commands: Record<string, ItemUsage>;
  agents: Record<string, ItemUsage>;
  skills: Record<string, ItemUsage>;
  tools: Record<string, { count: number }>;
  projects: Record<string, ProjectUsage>;
  daily: Record<string, DailyStats>;
}

/**
 * Session - A single Claude Code session from iTerm logs
 */
export interface Session {
  id: string;
  filename: string;
  filePath?: string;
  date: string;
  activeMinutes: number;
  idleMinutesExcluded?: number; // Minutes of idle time (gaps >= 10 min) excluded from activeMinutes
  firstTimestamp?: string; // ISO datetime of session start
  lastTimestamp?: string; // ISO datetime of session end
  fileSize: number;
  projects: string[];
  commands: Record<string, number>;
  agents: Record<string, number>;
  tools: Record<string, number>;
  summary?: string;
}

/**
 * DiaryResponse - Response from /api/diary endpoint
 */
export interface DiaryResponse {
  stats: UsageStats | null;
  totals: {
    totalSessions: number;
    totalMinutes: number;
    totalCommands: number;
    totalAgents: number;
    totalSkills: number;
    projectCount: number;
  };
  lastUpdated: string | null;
  hasData: boolean;
}

/**
 * DashboardResponse - Combined response from /api/dashboard endpoint
 * Combines DiaryResponse data with sessions for single-fetch efficiency
 */
export interface DashboardResponse extends DiaryResponse {
  sessions: Session[];
}

/**
 * FlightData - Raw data from flight-data.json
 */
export interface FlightData {
  sessions: Session[];
  timeline: Record<string, DailyStats>;
  aggregates: {
    projects: Record<string, ProjectUsage>;
    commands: Record<string, { total: number; lastUsed: string; byDate: Record<string, number> }>;
    agents: Record<string, { total: number; lastUsed: string; byDate: Record<string, number> }>;
  };
}

/**
 * DayDetail - Detailed data for a single day
 */
export interface DayDetail {
  date: string;
  sessions: Session[];
  totalMinutes: number;
  totalSessions: number;
  projects: Array<{ name: string; minutes: number; percentage: number }>;
  topCommands: Array<{ name: string; count: number }>;
  topAgents: Array<{ name: string; count: number }>;
  daySummary?: string;
}

/**
 * Commit - A git commit from a project
 */
export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  timestamp: string; // ISO date string
  project: string;
  author?: string;
}

/**
 * CommitsResponse - Response from /api/commits endpoint
 */
export interface CommitsResponse {
  commits: Commit[];
  total: number;
  byProject: Record<string, number>;
  dateRange: { from: string; to: string };
}
