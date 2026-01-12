'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar, CategoryType } from '@/components/layout/Sidebar';
import { ItemCard } from '@/components/dashboard/ItemCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Terminal, Bot, Puzzle, Zap, Target, ChevronDown, Loader2 } from 'lucide-react';
import type { ScanResponse, Command, Agent, Plugin, Hook, Skill } from '@/lib/types';
import { getFavorites } from '@/lib/favorites';
import { AllItemsTable } from '@/components/dashboard/AllItemsTable';
import { AllSessionsTable } from '@/components/dashboard/AllSessionsTable';
import { DiaryView } from '@/components/dashboard/DiaryView';
import { DiaryViewCompact } from '@/components/dashboard/DiaryViewCompact';

type CommandFilter = 'all' | 'global' | 'project';

export default function Home() {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('diary');
  const [commandFilter, setCommandFilter] = useState<CommandFilter>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Load collapsed sections from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('collapsed-sections');
    if (saved) {
      try {
        setCollapsedSections(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save collapsed sections to localStorage
  const toggleSection = (section: string) => {
    const newState = { ...collapsedSections, [section]: !collapsedSections[section] };
    setCollapsedSections(newState);
    localStorage.setItem('collapsed-sections', JSON.stringify(newState));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/scan');
      if (!response.ok) {
        throw new Error('Failed to fetch scan data');
      }
      const scanData: ScanResponse = await response.json();
      // Parse dates
      scanData.scannedAt = new Date(scanData.scannedAt);
      scanData.commands.forEach((c) => (c.lastModified = new Date(c.lastModified)));
      scanData.agents.forEach((a) => (a.lastModified = new Date(a.lastModified)));
      scanData.hooks.forEach((h) => (h.lastModified = new Date(h.lastModified)));
      scanData.skills.forEach((s) => (s.lastModified = new Date(s.lastModified)));
      setData(scanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load favorites
  const refreshFavorites = useCallback(() => {
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    fetchData();
    refreshFavorites();
  }, [fetchData, refreshFavorites]);

  // Filter helpers
  const filterBySearch = <T extends { name: string; description?: string }>(
    items: T[]
  ): T[] => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  };

  const filterByFavorites = <T extends { path: string }>(items: T[]): T[] => {
    return items.filter((item) => favorites.has(item.path));
  };

  // Get category counts
  const getCounts = () => {
    if (!data) return { commands: 0, agents: 0, plugins: 0, hooks: 0, skills: 0, favorites: 0, all: 0, diary: 0, sessions: 0 };

    const allItems = [
      ...data.commands,
      ...data.agents,
      ...data.plugins.map((p) => ({ ...p, path: p.name })),
      ...data.hooks,
      ...data.skills,
    ];

    const totalAll = data.commands.length + data.agents.length + data.plugins.length + data.hooks.length + data.skills.length;

    return {
      commands: data.commands.length,
      agents: data.agents.length,
      plugins: data.plugins.length,
      hooks: data.hooks.length,
      skills: data.skills.length,
      favorites: allItems.filter((item) => favorites.has(item.path)).length,
      all: totalAll,
      diary: 0, // Diary doesn't have a count, it's a view
    };
  };

  // Render content based on active category
  const renderContent = () => {
    if (!data) return null;

    switch (activeCategory) {
      case 'all': {
        return <AllItemsTable scanData={data} />;
      }

      case 'commands': {
        let commands = filterBySearch(data.commands);
        if (commandFilter === 'global') {
          commands = commands.filter((c) => c.scope === 'global');
        } else if (commandFilter === 'project') {
          commands = commands.filter((c) => c.scope === 'project');
        }

        return (
          <CategorySection
            title="Commands"
            subtitle="Your slash commands"
            icon={<Terminal className="h-5 w-5" />}
            count={commands.length}
            isCollapsed={collapsedSections['commands']}
            onToggle={() => toggleSection('commands')}
            actions={
              <div className="flex gap-1">
                {(['all', 'global', 'project'] as CommandFilter[]).map((f) => (
                  <Button
                    key={f}
                    variant={commandFilter === f ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setCommandFilter(f)}
                    className="text-xs capitalize"
                  >
                    {f}
                  </Button>
                ))}
              </div>
            }
          >
            {commands.map((cmd) => (
              <ItemCard
                key={cmd.path}
                name={`/${cmd.name}`}
                description={cmd.description}
                lastModified={cmd.lastModified}
                path={cmd.path}
                icon={<Terminal className="h-4 w-4" />}
                badges={[{ label: cmd.scope === 'global' ? 'Global' : 'Project' }]}
                onFavoriteChange={refreshFavorites}
              />
            ))}
          </CategorySection>
        );
      }

      case 'agents': {
        const agents = filterBySearch(data.agents);
        return (
          <CategorySection
            title="Agents"
            subtitle="Specialized AI workers"
            icon={<Bot className="h-5 w-5" />}
            count={agents.length}
            isCollapsed={collapsedSections['agents']}
            onToggle={() => toggleSection('agents')}
          >
            {agents.map((agent) => (
              <ItemCard
                key={agent.path}
                name={agent.name}
                description={agent.description}
                lastModified={agent.lastModified}
                path={agent.path}
                icon={<Bot className="h-4 w-4" />}
                onFavoriteChange={refreshFavorites}
              />
            ))}
          </CategorySection>
        );
      }

      case 'plugins': {
        const plugins = filterBySearch(
          data.plugins.map((p) => ({ ...p, description: p.source }))
        );
        return (
          <CategorySection
            title="Plugins"
            subtitle="Installed extensions and integrations"
            icon={<Puzzle className="h-5 w-5" />}
            count={plugins.length}
            isCollapsed={collapsedSections['plugins']}
            onToggle={() => toggleSection('plugins')}
          >
            {plugins.map((plugin) => (
              <ItemCard
                key={plugin.name}
                name={plugin.name}
                description={plugin.source}
                lastModified={new Date()}
                path={plugin.name}
                icon={<Puzzle className="h-4 w-4" />}
                badges={[
                  {
                    label: plugin.enabled ? 'Enabled' : 'Disabled',
                    variant: plugin.enabled ? 'default' : 'secondary',
                  },
                ]}
                metadata={{
                  Version: plugin.version,
                  Source: plugin.source,
                }}
                onFavoriteChange={refreshFavorites}
              />
            ))}
          </CategorySection>
        );
      }

      case 'hooks': {
        const hooks = filterBySearch(
          data.hooks.map((h) => ({ ...h, description: h.path }))
        );
        return (
          <CategorySection
            title="Hooks"
            subtitle="Automation scripts that run on triggers"
            icon={<Zap className="h-5 w-5" />}
            count={hooks.length}
            isCollapsed={collapsedSections['hooks']}
            onToggle={() => toggleSection('hooks')}
          >
            {hooks.map((hook) => (
              <ItemCard
                key={hook.path}
                name={hook.name}
                description={`Path: ${hook.path}`}
                lastModified={hook.lastModified}
                path={hook.path}
                icon={<Zap className="h-4 w-4" />}
                badges={[{ label: hook.type }]}
                onFavoriteChange={refreshFavorites}
              />
            ))}
          </CategorySection>
        );
      }

      case 'skills': {
        const skills = filterBySearch(data.skills);
        return (
          <CategorySection
            title="Skills"
            subtitle="Complex multi-step capabilities"
            icon={<Target className="h-5 w-5" />}
            count={skills.length}
            isCollapsed={collapsedSections['skills']}
            onToggle={() => toggleSection('skills')}
          >
            {skills.map((skill) => (
              <ItemCard
                key={skill.path}
                name={skill.name}
                description={skill.description}
                lastModified={skill.lastModified}
                path={skill.path}
                icon={<Target className="h-4 w-4" />}
                onFavoriteChange={refreshFavorites}
              />
            ))}
          </CategorySection>
        );
      }

      case 'favorites': {
        // Collect all favorited items
        const favCommands = filterByFavorites(filterBySearch(data.commands));
        const favAgents = filterByFavorites(filterBySearch(data.agents));
        const favPlugins = filterByFavorites(
          filterBySearch(data.plugins.map((p) => ({ ...p, path: p.name, description: p.source })))
        );
        const favHooks = filterByFavorites(
          filterBySearch(data.hooks.map((h) => ({ ...h, description: h.path })))
        );
        const favSkills = filterByFavorites(filterBySearch(data.skills));

        const totalFavs =
          favCommands.length +
          favAgents.length +
          favPlugins.length +
          favHooks.length +
          favSkills.length;

        if (totalFavs === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground">No favorites yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click the star icon on any item to add it to favorites
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {favCommands.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> Commands
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {favCommands.map((cmd) => (
                  <ItemCard
                    key={cmd.path}
                    name={`/${cmd.name}`}
                    description={cmd.description}
                    lastModified={cmd.lastModified}
                    path={cmd.path}
                    icon={<Terminal className="h-4 w-4" />}
                    badges={[{ label: cmd.scope === 'global' ? 'Global' : 'Project' }]}
                    onFavoriteChange={refreshFavorites}
                  />
                ))}
                </div>
              </div>
            )}
            {favAgents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Agents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {favAgents.map((agent) => (
                  <ItemCard
                    key={agent.path}
                    name={agent.name}
                    description={agent.description}
                    lastModified={agent.lastModified}
                    path={agent.path}
                    icon={<Bot className="h-4 w-4" />}
                    onFavoriteChange={refreshFavorites}
                  />
                ))}
                </div>
              </div>
            )}
            {favSkills.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" /> Skills
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {favSkills.map((skill) => (
                  <ItemCard
                    key={skill.path}
                    name={skill.name}
                    description={skill.description}
                    lastModified={skill.lastModified}
                    path={skill.path}
                    icon={<Target className="h-4 w-4" />}
                    onFavoriteChange={refreshFavorites}
                  />
                ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'diary': {
        return <DiaryView />;
      }

      case 'compact': {
        return <DiaryViewCompact />;
      }

      case 'sessions': {
        return <AllSessionsTable />;
      }

      default:
        return null;
    }
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Flight Deck...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive text-lg">Error loading data</p>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        counts={getCounts()}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={fetchData}
          isRefreshing={loading}
          lastScanned={data.scannedAt}
        />

        {/* Content */}
        <ScrollArea className="flex-1">
          <main className="p-6">{renderContent()}</main>
        </ScrollArea>
      </div>
    </div>
  );
}

// Category Section Component
interface CategorySectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
  actions?: React.ReactNode;
}

function CategorySection({
  title,
  subtitle,
  icon,
  count,
  children,
  isCollapsed,
  onToggle,
  actions,
}: CategorySectionProps) {
  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => onToggle?.()}>
      <div className="space-y-4">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">{icon}</div>
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {title}
                  <Badge variant="secondary">{count}</Badge>
                </h2>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {actions}
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  isCollapsed ? '-rotate-90' : ''
                }`}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
