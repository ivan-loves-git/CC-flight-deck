import { scanCommands } from './commands';
import { scanAgents } from './agents';
import { scanPlugins } from './plugins';
import { scanHooks } from './hooks';
import { scanSkills } from './skills';
import type { ScanResponse } from '../types';

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
