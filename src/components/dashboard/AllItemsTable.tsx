'use client';

import { useState, useMemo } from 'react';
import { DataTable } from './DataTable';
import { ItemDetailSheet } from './ItemDetailSheet';
import { ScanResponse, UnifiedItem, Command, Agent, Plugin, Hook, Skill } from '@/lib/types';
import { TableProperties } from 'lucide-react';

interface AllItemsTableProps {
  scanData: ScanResponse | null;
}

/**
 * Transform all scan data into a unified list of items
 */
function transformToUnifiedItems(scanData: ScanResponse): UnifiedItem[] {
  const items: UnifiedItem[] = [];

  // Transform commands
  scanData.commands.forEach((cmd: Command) => {
    items.push({
      id: cmd.path,
      name: cmd.name,
      type: 'command',
      description: cmd.description,
      path: cmd.path,
      lastModified: new Date(cmd.lastModified),
      scope: cmd.scope,
      pluginName: cmd.pluginName,
    });
  });

  // Transform agents
  scanData.agents.forEach((agent: Agent) => {
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
    });
  });

  // Transform skills
  scanData.skills.forEach((skill: Skill) => {
    items.push({
      id: skill.path,
      name: skill.name,
      type: 'skill',
      description: skill.description,
      path: skill.path,
      lastModified: new Date(skill.lastModified),
      scope: skill.scope,
      pluginName: skill.pluginName,
    });
  });

  return items;
}

export function AllItemsTable({ scanData }: AllItemsTableProps) {
  const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const unifiedItems = useMemo(() => {
    if (!scanData) return [];
    return transformToUnifiedItems(scanData);
  }, [scanData]);

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
