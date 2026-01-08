import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { Plugin } from '../types';

interface InstalledPluginsData {
  version: number;
  plugins: {
    [key: string]: Array<{
      scope: string;
      installPath: string;
      version: string;
      installedAt: string;
      lastUpdated: string;
      gitCommitSha?: string;
      isLocal?: boolean;
      projectPath?: string;
    }>;
  };
}

interface SettingsData {
  enabledPlugins?: {
    [key: string]: boolean;
  };
}

export function scanPlugins(): Plugin[] {
  try {
    const pluginsPath = join(homedir(), '.claude', 'plugins', 'installed_plugins.json');
    const settingsPath = join(homedir(), '.claude', 'settings.json');

    // Read installed plugins
    let installedPlugins: InstalledPluginsData;
    try {
      const pluginsContent = readFileSync(pluginsPath, 'utf-8');
      installedPlugins = JSON.parse(pluginsContent);
    } catch (error) {
      // If file doesn't exist, return empty array
      return [];
    }

    // Read settings for enabled status
    let enabledPlugins: { [key: string]: boolean } = {};
    try {
      const settingsContent = readFileSync(settingsPath, 'utf-8');
      const settings: SettingsData = JSON.parse(settingsContent);
      enabledPlugins = settings.enabledPlugins || {};
    } catch (error) {
      // If settings don't exist, assume all plugins are disabled
      enabledPlugins = {};
    }

    // Convert to Plugin array
    const plugins: Plugin[] = [];

    for (const [pluginKey, installations] of Object.entries(installedPlugins.plugins)) {
      // Use the most recent installation (first in array or last updated)
      const installation = installations[0]; // Assuming first is most relevant

      plugins.push({
        name: pluginKey,
        version: installation.version,
        enabled: enabledPlugins[pluginKey] ?? false,
        installedAt: new Date(installation.installedAt),
        source: pluginKey.split('@')[1] || 'unknown',
        path: installation.installPath,
      });
    }

    return plugins;
  } catch (error) {
    console.error('Error scanning plugins:', error);
    return [];
  }
}
