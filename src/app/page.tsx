'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/Header';
import { CommandList } from '@/components/dashboard/CommandList';
import { AgentList } from '@/components/dashboard/AgentList';
import { PluginList } from '@/components/dashboard/PluginList';
import { HookList } from '@/components/dashboard/HookList';
import { SkillList } from '@/components/dashboard/SkillList';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ScanResponse } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function Home() {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/scan');
      if (!response.ok) {
        throw new Error('Failed to fetch scan data');
      }
      const scanData: ScanResponse = await response.json();
      setData(scanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Claude Code Flight Deck</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Claude Code Flight Deck</h1>
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  // Filter data based on search query
  const normalizedQuery = searchQuery.toLowerCase().trim();
  const filteredData = {
    commands: data.commands.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery)
    ),
    agents: data.agents.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery)
    ),
    plugins: data.plugins.filter(
      (item) => item.name.toLowerCase().includes(normalizedQuery)
    ),
    hooks: data.hooks.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.path.toLowerCase().includes(normalizedQuery)
    ),
    skills: data.skills.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery)
    ),
  };

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <Separator className="my-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CommandList commands={filteredData.commands} />
          <AgentList agents={filteredData.agents} />
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PluginList plugins={filteredData.plugins} />
          <HookList hooks={filteredData.hooks} />
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkillList skills={filteredData.skills} />
        </div>

        <Separator className="my-6" />

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Last scanned: {formatDistanceToNow(new Date(data.scannedAt), { addSuffix: true })}
          </p>
          <Button onClick={fetchData} disabled={loading} variant="outline">
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
    </main>
  );
}
