import { scanCommands } from './commands';
import { scanAgents } from './agents';
import { scanPlugins } from './plugins';
import { scanHooks } from './hooks';
import { scanSkills } from './skills';
import { scanUsageStats, getUsageCount, getLastUsed, getTotalStats, getDailyStats, getProjectStats } from './usage';
import type { ScanResponse } from '../types';

// Re-export usage functions for convenience
export { scanUsageStats, getUsageCount, getLastUsed, getTotalStats, getDailyStats, getProjectStats };

/**
 * Scans all Claude Code customization directories and returns combined results
 */
export async function scanAll(): Promise<ScanResponse> {
  const [commands, agents, plugins, hooks, skills] = await Promise.all([
    scanCommands(),
    scanAgents(),
    scanPlugins(),
    scanHooks(),
    scanSkills(),
  ]);

  return {
    commands,
    agents,
    plugins,
    hooks,
    skills,
    scannedAt: new Date(),
  };
}
