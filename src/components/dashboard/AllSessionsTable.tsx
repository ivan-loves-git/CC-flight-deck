'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  ChevronDown,
  ArrowUpDown,
  Search,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderOpen,
  Terminal,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import type { Session } from '@/lib/types';
import { formatMinutes, formatFileSize } from '@/lib/diary-utils';

interface SessionsResponse {
  sessions: Session[];
  total: number;
  generated: string;
}

export function AllSessionsTable() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Filter states
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Fetch sessions from API
  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch('/api/sessions');
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const data: SessionsResponse = await response.json();
        setSessions(data.sessions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  // Get unique projects for filter
  const uniqueProjects = useMemo(() => {
    const projectSet = new Set<string>();
    sessions.forEach((s) => s.projects.forEach((p) => projectSet.add(p)));
    return Array.from(projectSet).sort();
  }, [sessions]);

  // Get unique dates for filter
  const uniqueDates = useMemo(() => {
    const dateSet = new Set<string>();
    sessions.forEach((s) => dateSet.add(s.date));
    return Array.from(dateSet).sort().reverse();
  }, [sessions]);

  // Apply custom filters
  const filteredData = useMemo(() => {
    return sessions.filter((session) => {
      if (projectFilter !== 'all' && !session.projects.includes(projectFilter)) return false;
      if (dateFilter !== 'all' && session.date !== dateFilter) return false;
      if (globalFilter) {
        const search = globalFilter.toLowerCase();
        const matchesProject = session.projects.some((p) => p.toLowerCase().includes(search));
        const matchesDate = session.date.includes(search);
        const matchesFilename = session.filename.toLowerCase().includes(search);
        const matchesSummary = session.summary?.toLowerCase().includes(search);
        if (!matchesProject && !matchesDate && !matchesFilename && !matchesSummary) return false;
      }
      return true;
    });
  }, [sessions, projectFilter, dateFilter, globalFilter]);

  const columns: ColumnDef<Session>[] = [
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('date') as string;
        return (
          <Link
            href={`/diary/${date}`}
            className="font-medium text-sm hover:underline"
          >
            {format(parseISO(date), 'MMM d, yyyy')}
          </Link>
        );
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.getValue('date') as string;
        const dateB = rowB.getValue('date') as string;
        return dateA.localeCompare(dateB);
      },
    },
    {
      accessorKey: 'activeMinutes',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          <Clock className="h-4 w-4 mr-1" />
          Duration
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const minutes = row.getValue('activeMinutes') as number;
        return (
          <span className="font-medium text-sm tabular-nums">
            {formatMinutes(minutes)}
          </span>
        );
      },
    },
    {
      accessorKey: 'projects',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          <FolderOpen className="h-4 w-4 mr-1" />
          Projects
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const projects = row.getValue('projects') as string[];
        if (projects.length === 0) {
          return <span className="text-muted-foreground text-sm">No project</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[300px]">
            {projects.slice(0, 3).map((project) => (
              <Badge key={project} variant="outline" className="text-xs truncate max-w-[120px]">
                {project}
              </Badge>
            ))}
            {projects.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{projects.length - 3}
              </Badge>
            )}
          </div>
        );
      },
      sortingFn: (rowA, rowB) => {
        const projA = (rowA.getValue('projects') as string[]).length;
        const projB = (rowB.getValue('projects') as string[]).length;
        return projA - projB;
      },
    },
    {
      accessorKey: 'commands',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          <Terminal className="h-4 w-4 mr-1" />
          Commands
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const commands = row.getValue('commands') as Record<string, number>;
        const totalCommands = Object.values(commands).reduce((sum, c) => sum + c, 0);
        const uniqueCommands = Object.keys(commands).length;
        if (totalCommands === 0) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <span className="text-sm">
            <span className="font-medium">{totalCommands}</span>
            <span className="text-muted-foreground ml-1">({uniqueCommands} unique)</span>
          </span>
        );
      },
      sortingFn: (rowA, rowB) => {
        const cmdsA = Object.values(rowA.getValue('commands') as Record<string, number>).reduce((sum, c) => sum + c, 0);
        const cmdsB = Object.values(rowB.getValue('commands') as Record<string, number>).reduce((sum, c) => sum + c, 0);
        return cmdsA - cmdsB;
      },
    },
    {
      accessorKey: 'fileSize',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Size
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const size = row.getValue('fileSize') as number;
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatFileSize(size)}
          </span>
        );
      },
    },
    {
      accessorKey: 'summary',
      header: 'Summary',
      cell: ({ row }) => {
        const summary = row.getValue('summary') as string | undefined;
        return (
          <span className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
            {summary || <span className="italic">No summary</span>}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const filePath = row.original.filePath;
        const handleOpenInFinder = async (e: React.MouseEvent) => {
          e.stopPropagation();
          try {
            await fetch('/api/open', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: filePath, action: 'reveal' }),
            });
          } catch (error) {
            console.error('Failed to open in Finder:', error);
          }
        };
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInFinder}
            title="Open in Finder"
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const clearFilters = () => {
    setGlobalFilter('');
    setProjectFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = globalFilter || projectFilter !== 'all' || dateFilter !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Play className="h-5 w-5" />
          ALL SESSIONS
          <span className="text-muted-foreground">({sessions.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          All Claude Code sessions from your iTerm logs
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by project, date, filename, or summary..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjects.map((project) => (
                <SelectItem key={project} value={project}>
                  {project}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {uniqueDates.slice(0, 30).map((date) => (
                <SelectItem key={date} value={date}>
                  {format(parseISO(date), 'MMM d, yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}

          {/* Results Count */}
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredData.length} of {sessions.length} sessions
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-accent/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No sessions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
