import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { Plugin } from '../types';

interface PluginInstallation {
  scope: string;
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
  isLocal?: boolean;
  projectPath?: string;
}

interface InstalledPluginsData {
  version: number;
  plugins: {
    [key: string]: PluginInstallation[];
  };
}

interface SettingsData {
  enabledPlugins?: {
    [key: string]: boolean;
  };
}

export interface EnabledPluginInfo {
  name: string; // e.g., "compound-engineering"
  fullKey: string; // e.g., "compound-engineering@every-marketplace"
  installPath: string;
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

/**
 * Get info about enabled plugins for scanning their contents
 */
export function getEnabledPluginPaths(): EnabledPluginInfo[] {
  try {
    const pluginsPath = join(homedir(), '.claude', 'plugins', 'installed_plugins.json');
    const settingsPath = join(homedir(), '.claude', 'settings.json');

    // Read installed plugins
    let installedPlugins: InstalledPluginsData;
    try {
      const pluginsContent = readFileSync(pluginsPath, 'utf-8');
      installedPlugins = JSON.parse(pluginsContent);
    } catch {
      return [];
    }

    // Read settings for enabled status
    let enabledPlugins: { [key: string]: boolean } = {};
    try {
      const settingsContent = readFileSync(settingsPath, 'utf-8');
      const settings: SettingsData = JSON.parse(settingsContent);
      enabledPlugins = settings.enabledPlugins || {};
    } catch {
      enabledPlugins = {};
    }

    const results: EnabledPluginInfo[] = [];

    for (const [pluginKey, installations] of Object.entries(installedPlugins.plugins)) {
      // Only include enabled plugins
      if (enabledPlugins[pluginKey]) {
        const installation = installations[0];
        const pluginName = pluginKey.split('@')[0];

        results.push({
          name: pluginName,
          fullKey: pluginKey,
          installPath: installation.installPath,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error getting enabled plugin paths:', error);
    return [];
  }
}
