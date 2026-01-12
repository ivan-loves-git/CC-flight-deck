'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Loader2,
  ChevronLeft,
  Clock,
  Folder,
  Terminal,
  Bot,
  Calendar,
  LayoutList,
  LayoutGrid,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Wrench,
  Activity,
  GitCommit,
  Pause,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Session {
  id: string;
  filename: string;
  filePath?: string;
  date: string;
  activeMinutes: number;
  idleMinutesExcluded?: number;
  fileSize: number;
  projects: string[];
  commands: Record<string, number>;
  agents: Record<string, number>;
  tools: Record<string, number>;
  summary?: string;
}

interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  timestamp: string;
  project: string;
  author?: string;
}

interface DayDetail {
  date: string;
  sessions: Session[];
  totalMinutes: number;
  totalSessions: number;
  projects: Array<{ name: string; minutes: number; percentage: number }>;
  topCommands: Array<{ name: string; count: number }>;
  topAgents: Array<{ name: string; count: number }>;
  daySummary?: string;
}

type LayoutType = 'timeline' | 'cards' | 'projects';

export default function DayDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutType>('cards');
  const [commits, setCommits] = useState<Commit[]>([]);

  useEffect(() => {
    async function fetchDayDetail() {
      try {
        const response = await fetch(`/api/diary/${resolvedParams.date}`);
        if (!response.ok) throw new Error('Failed to fetch day detail');
        const dayData: DayDetail = await response.json();
        setData(dayData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchDayDetail();
  }, [resolvedParams.date]);

  // Fetch commits for this day
  useEffect(() => {
    async function fetchCommits() {
      try {
        const response = await fetch(`/api/commits?from=${resolvedParams.date}&to=${resolvedParams.date}`);
        if (response.ok) {
          const data = await response.json();
          setCommits(data.commits || []);
        }
      } catch {
        // ignore
      }
    }
    fetchCommits();
  }, [resolvedParams.date]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-destructive">Error loading day detail</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const dateObj = parseISO(resolvedParams.date);
  const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="mb-6 -ml-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{formattedDate}</h1>
              <p className="text-lg text-muted-foreground mt-2">
                {data?.totalSessions || 0} sessions · {formatMinutes(data?.totalMinutes || 0)}
              </p>
            </div>

            {/* Layout Switcher */}
            <div className="flex gap-1 bg-muted p-1 rounded-lg shrink-0">
              <Button
                variant={layout === 'timeline' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setLayout('timeline')}
                title="Timeline View"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={layout === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setLayout('cards')}
                title="Session Cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={layout === 'projects' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setLayout('projects')}
                title="Project Groups"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Day Summary */}
        {data?.daySummary && (
          <Card className="mb-8 bg-muted/50">
            <CardContent className="py-5 px-6">
              <p className="text-base italic leading-relaxed">{data.daySummary}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatCard
            icon={<Calendar className="h-4 w-4" />}
            label="Sessions"
            value={data?.totalSessions || 0}
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Active Time"
            value={formatMinutes(data?.totalMinutes || 0)}
          />
          <StatCard
            icon={<Folder className="h-4 w-4" />}
            label="Projects"
            value={data?.projects.length || 0}
          />
          <StatCard
            icon={<Terminal className="h-4 w-4" />}
            label="Commands"
            value={data?.topCommands.reduce((sum, c) => sum + c.count, 0) || 0}
          />
        </div>

        {/* No Data State */}
        {(!data || data.sessions.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sessions recorded for this day</p>
            </CardContent>
          </Card>
        )}

        {/* Layout Views */}
        {data && data.sessions.length > 0 && (
          <div className="mb-8">
            {layout === 'timeline' && <TimelineView data={data} />}
            {layout === 'cards' && <CardsView data={data} />}
            {layout === 'projects' && <ProjectsView data={data} />}
          </div>
        )}

        {/* Projects & Commands Summary */}
        {data && data.sessions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Projects */}
            {data.projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.projects.map((proj) => (
                      <div key={proj.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{getProjectName(proj.name)}</span>
                          <span className="text-muted-foreground">
                            {formatMinutes(proj.minutes)} ({proj.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${proj.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Commands & Agents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Commands & Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topCommands.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Commands</p>
                      <div className="flex flex-wrap gap-2">
                        {data.topCommands.map((cmd) => (
                          <Badge key={cmd.name} variant="secondary">
                            {cmd.name} ({cmd.count}x)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.topAgents.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Agents</p>
                      <div className="flex flex-wrap gap-2">
                        {data.topAgents.map((agent) => (
                          <Badge key={agent.name} variant="outline">
                            <Bot className="h-3 w-3 mr-1" />
                            {agent.name} ({agent.count}x)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.topCommands.length === 0 && data.topAgents.length === 0 && (
                    <p className="text-sm text-muted-foreground">No commands or agents used</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Git Commits Section */}
        {commits.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitCommit className="h-4 w-4" />
                Commits ({commits.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {commits.map((commit) => (
                  <div key={commit.hash} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Badge variant="outline" className="shrink-0 font-mono text-xs">
                      {commit.shortHash}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{commit.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getProjectName(commit.project)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(commit.timestamp), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Timeline View - Shows sessions as blocks on a timeline
function TimelineView({ data }: { data: DayDetail }) {
  // Sort sessions by ID (which contains timestamp)
  const sortedSessions = [...data.sessions].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <LayoutList className="h-5 w-5" />
        Timeline
      </h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

        <div className="space-y-4">
          {sortedSessions.map((session, index) => {
            const time = extractTimeFromId(session.id);
            return (
              <div key={session.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className="absolute left-2.5 w-3 h-3 rounded-full border-2 border-background bg-primary" />

                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{time}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {formatMinutes(session.activeMinutes)}
                        </p>
                      </div>
                      <Badge variant="secondary">{formatMinutes(session.activeMinutes)}</Badge>
                    </div>

                    {session.projects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {session.projects.map((proj) => (
                          <Badge key={proj} variant="secondary" className="text-xs">
                            {getProjectName(proj)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {Object.keys(session.commands).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(session.commands).slice(0, 5).map(([cmd, count]) => (
                          <span key={cmd} className="text-xs text-muted-foreground">
                            {cmd} ({count}x)
                          </span>
                        ))}
                      </div>
                    )}

                    {session.summary && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {session.summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Cards View - Each session as a separate expandable card
function CardsView({ data }: { data: DayDetail }) {
  const sortedSessions = [...data.sessions].sort((a, b) => b.activeMinutes - a.activeMinutes);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <LayoutGrid className="h-5 w-5" />
        Sessions ({sortedSessions.length})
      </h2>

      <div className="grid gap-4 md:gap-5">
        {sortedSessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}

// Session Card Component
function SessionCard({ session }: { session: Session }) {
  const [isOpen, setIsOpen] = useState(false);
  const time = extractTimeFromId(session.id);

  // Calculate KPIs
  const totalCommands = Object.values(session.commands).reduce((sum, c) => sum + c, 0);
  const totalAgents = Object.values(session.agents).reduce((sum, c) => sum + c, 0);
  const totalTools = Object.values(session.tools).reduce((sum, c) => sum + c, 0);
  const uniqueCommands = Object.keys(session.commands).length;
  const uniqueTools = Object.keys(session.tools).length;

  // Get file path for Finder
  const getFilePath = () => {
    const logsDir = `${process.env.HOME || '~'}/Library/Application Support/iTerm2/iterm2-shell-integration/logs`;
    return `${logsDir}/${session.filename}`;
  };

  const handleOpenInFinder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: session.filePath || getFilePath(),
          action: 'reveal'
        }),
      });
    } catch (error) {
      console.error('Failed to open in Finder:', error);
    }
  };

  // Generate activity timeline (simplified git-style graph)
  const generateActivityBars = () => {
    const tools = session.tools;
    const maxCount = Math.max(...Object.values(tools), 1);
    const mainTools = ['Read', 'Write', 'Edit', 'Bash', 'Task', 'Grep', 'Glob'];

    return mainTools.map(tool => ({
      name: tool,
      count: tools[tool] || 0,
      percentage: Math.round(((tools[tool] || 0) / maxCount) * 100),
    })).filter(t => t.count > 0);
  };

  const activityBars = generateActivityBars();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">{time}</CardTitle>
                  <CardDescription>
                    {formatMinutes(session.activeMinutes)}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {session.projects.map((proj) => (
                  <Badge key={proj} variant="outline" className="text-xs">
                    {getProjectName(proj)}
                  </Badge>
                ))}
                <Badge variant="secondary">{formatMinutes(session.activeMinutes)}</Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-5 px-6 space-y-5">
            {/* Executive Summary */}
            {session.summary && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm italic leading-relaxed">{session.summary}</p>
              </div>
            )}

            {/* Session KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs">Active Time</span>
                </div>
                <p className="font-semibold">{formatMinutes(session.activeMinutes)}</p>
              </div>
              {session.idleMinutesExcluded !== undefined && session.idleMinutesExcluded > 0 && (
                <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                    <Pause className="h-3.5 w-3.5" />
                    <span className="text-xs">Idle Excluded</span>
                  </div>
                  <p className="font-semibold text-amber-600">{formatMinutes(session.idleMinutesExcluded)}</p>
                </div>
              )}
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Terminal className="h-3.5 w-3.5" />
                  <span className="text-xs">Commands</span>
                </div>
                <p className="font-semibold">{totalCommands} <span className="text-xs text-muted-foreground">({uniqueCommands} unique)</span></p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Wrench className="h-3.5 w-3.5" />
                  <span className="text-xs">Tool Calls</span>
                </div>
                <p className="font-semibold">{totalTools.toLocaleString()}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-xs">Log Size</span>
                </div>
                <p className="font-semibold">{formatFileSize(session.fileSize)}</p>
              </div>
            </div>

            {/* Activity Timeline (Git-style bar chart) */}
            {activityBars.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Tool Activity
                </p>
                <div className="space-y-2">
                  {activityBars.map(({ name, count, percentage }) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-12 text-right">{name}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commands */}
            {Object.keys(session.commands).length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Commands Used</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(session.commands)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cmd, count]) => (
                    <Badge key={cmd} variant="secondary" className="text-sm py-1 px-2">
                      <Terminal className="h-3.5 w-3.5 mr-1.5" />
                      {cmd} ({count}x)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Agents */}
            {Object.keys(session.agents).length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Agents</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(session.agents).map(([agent, count]) => (
                    <Badge key={agent} variant="outline" className="text-sm py-1 px-2">
                      <Bot className="h-3.5 w-3.5 mr-1.5" />
                      {agent} ({count}x)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Open in Finder Button */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInFinder}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Log File in Finder
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Format file size helper
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Projects View - Group sessions by project
function ProjectsView({ data }: { data: DayDetail }) {
  // Group sessions by project
  const projectGroups = new Map<string, Session[]>();

  for (const session of data.sessions) {
    if (session.projects.length === 0) {
      const uncategorized = projectGroups.get('Uncategorized') || [];
      uncategorized.push(session);
      projectGroups.set('Uncategorized', uncategorized);
    } else {
      for (const proj of session.projects) {
        const group = projectGroups.get(proj) || [];
        group.push(session);
        projectGroups.set(proj, group);
      }
    }
  }

  // Sort by total time
  const sortedProjects = Array.from(projectGroups.entries())
    .map(([name, sessions]) => ({
      name,
      sessions,
      totalMinutes: sessions.reduce((sum, s) => sum + s.activeMinutes, 0),
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Layers className="h-5 w-5" />
        By Project
      </h2>

      <div className="space-y-6">
        {sortedProjects.map(({ name, sessions, totalMinutes }) => (
          <div key={name}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">{getProjectName(name)}</h3>
                {name !== 'Uncategorized' && (
                  <Badge variant="secondary" className="text-xs">
                    {getCategory(name)}
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {sessions.length} sessions · {formatMinutes(totalMinutes)}
              </span>
            </div>

            <div className="grid gap-3 pl-6 border-l-2 border-muted">
              {sessions.map((session) => {
                const time = extractTimeFromId(session.id);
                return (
                  <Card key={session.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{time}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatMinutes(session.activeMinutes)}
                          </span>
                        </div>
                        <Badge variant="secondary">{formatMinutes(session.activeMinutes)}</Badge>
                      </div>

                      {Object.keys(session.commands).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(session.commands).slice(0, 3).map(([cmd, count]) => (
                            <span key={cmd} className="text-xs text-muted-foreground">
                              {cmd} ({count}x)
                            </span>
                          ))}
                        </div>
                      )}

                      {session.summary && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {session.summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

// Helper Functions
function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getProjectName(fullName: string): string {
  if (fullName === 'Uncategorized') return fullName;
  const match = fullName.match(/^[a-z]+--(.+)$/);
  return match ? match[1] : fullName;
}

function getCategory(fullName: string): string {
  const match = fullName.match(/^([a-z]+)--/);
  return match ? match[1].toUpperCase() : '';
}

function extractTimeFromId(id: string): string {
  // ID format: 20260104_201704
  const match = id.match(/^\d{8}_(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return id;
}

