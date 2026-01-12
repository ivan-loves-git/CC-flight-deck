'use client';

import { useState, useMemo, useEffect } from 'react';
import { DataTable } from './DataTable';
import { ItemDetailSheet } from './ItemDetailSheet';
import { ScanResponse, UnifiedItem, Command, Agent, Plugin, Hook, Skill, UsageStats } from '@/lib/types';
import { TableProperties } from 'lucide-react';

interface AllItemsTableProps {
  scanData: ScanResponse | null;
}

/**
 * Get usage count for an item from usage stats
 */
function getUsageForItem(
  stats: UsageStats | null,
  type: 'command' | 'agent' | 'skill' | 'plugin' | 'hook',
  name: string
): { count: number; lastUsed: Date | null } {
  if (!stats) return { count: 0, lastUsed: null };

  // Commands and skills use / prefix
  const key = type === 'command' || type === 'skill' ? `/${name}` : name;

  // Check commands
  if (stats.commands[key]) {
    return {
      count: stats.commands[key].count,
      lastUsed: stats.commands[key].lastUsed ? new Date(stats.commands[key].lastUsed) : null,
    };
  }
  // Check without prefix too
  if (stats.commands[name]) {
    return {
      count: stats.commands[name].count,
      lastUsed: stats.commands[name].lastUsed ? new Date(stats.commands[name].lastUsed) : null,
    };
  }

  // Check agents
  if (stats.agents[name]) {
    return {
      count: stats.agents[name].count,
      lastUsed: stats.agents[name].lastUsed ? new Date(stats.agents[name].lastUsed) : null,
    };
  }

  // Check skills
  if (stats.skills && stats.skills[key]) {
    return {
      count: stats.skills[key].count,
      lastUsed: stats.skills[key].lastUsed ? new Date(stats.skills[key].lastUsed) : null,
    };
  }

  return { count: 0, lastUsed: null };
}

/**
 * Transform all scan data into a unified list of items
 */
function transformToUnifiedItems(scanData: ScanResponse, usageStats: UsageStats | null): UnifiedItem[] {
  const items: UnifiedItem[] = [];

  // Transform commands
  scanData.commands.forEach((cmd: Command) => {
    const usage = getUsageForItem(usageStats, 'command', cmd.name);
    items.push({
      id: cmd.path,
      name: cmd.name,
      type: 'command',
      description: cmd.description,
      path: cmd.path,
      lastModified: new Date(cmd.lastModified),
      scope: cmd.scope,
      pluginName: cmd.pluginName,
      usageCount: usage.count,
      lastUsed: usage.lastUsed || undefined,
    });
  });

  // Transform agents
  scanData.agents.forEach((agent: Agent) => {
    const usage = getUsageForItem(usageStats, 'agent', agent.name);
    items.push({
      id: agent.path,
      name: agent.name,
      type: 'agent',
      description: agent.description,
      path: agent.path,
      lastModified: new Date(agent.lastModified),
      scope: agent.scope,
      pluginName: agent.pluginName,
      category: agent.category,
      usageCount: usage.count,
      lastUsed: usage.lastUsed || undefined,
    });
  });

  // Transform plugins
  scanData.plugins.forEach((plugin: Plugin) => {
    items.push({
      id: plugin.path,
      name: plugin.name,
      type: 'plugin',
      description: `${plugin.enabled ? 'Enabled' : 'Disabled'} plugin from ${plugin.source}`,
      path: plugin.path,
      lastModified: new Date(plugin.installedAt),
      scope: 'n/a',
      enabled: plugin.enabled,
      version: plugin.version,
      source: plugin.source,
      usageCount: 0,
    });
  });

  // Transform hooks
  scanData.hooks.forEach((hook: Hook) => {
    items.push({
      id: hook.path,
      name: hook.name,
      type: 'hook',
      description: `${hook.type} automation script`,
      path: hook.path,
      lastModified: new Date(hook.lastModified),
      scope: 'global',
      hookType: hook.type,
      usageCount: 0,
    });
  });

  // Transform skills
  scanData.skills.forEach((skill: Skill) => {
    const usage = getUsageForItem(usageStats, 'skill', skill.name);
    items.push({
      id: skill.path,
      name: skill.name,
      type: 'skill',
      description: skill.description,
      path: skill.path,
      lastModified: new Date(skill.lastModified),
      scope: skill.scope,
      pluginName: skill.pluginName,
      usageCount: usage.count,
      lastUsed: usage.lastUsed || undefined,
    });
  });

  return items;
}

export function AllItemsTable({ scanData }: AllItemsTableProps) {
  const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Load usage stats from flight-data.json via scanner
  useEffect(() => {
    async function loadUsageStats() {
      try {
        const response = await fetch('/api/scan/usage');
        if (response.ok) {
          const stats = await response.json();
          setUsageStats(stats);
        }
      } catch {
        // Usage stats are optional, ignore errors
      }
    }
    loadUsageStats();
  }, []);

  const unifiedItems = useMemo(() => {
    if (!scanData) return [];
    return transformToUnifiedItems(scanData, usageStats);
  }, [scanData, usageStats]);

  const handleRowClick = (item: UnifiedItem) => {
    setSelectedItem(item);
    setSheetOpen(true);
  };

  if (!scanData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TableProperties className="h-5 w-5" />
          ALL ITEMS
          <span className="text-muted-foreground">({unifiedItems.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          All commands, agents, plugins, hooks, and skills in one view
        </p>
      </div>

      <DataTable data={unifiedItems} onRowClick={handleRowClick} />

      <ItemDetailSheet
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
