'use client';

import { useState, useMemo } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
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
import { UnifiedItem, ItemType } from '@/lib/types';
import {
  Terminal,
  Bot,
  Puzzle,
  Zap,
  Target,
  ChevronDown,
  ArrowUpDown,
  Search,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DataTableProps {
  data: UnifiedItem[];
  onRowClick: (item: UnifiedItem) => void;
}

const typeIcons: Record<ItemType, React.ReactNode> = {
  command: <Terminal className="h-4 w-4" />,
  agent: <Bot className="h-4 w-4" />,
  plugin: <Puzzle className="h-4 w-4" />,
  hook: <Zap className="h-4 w-4" />,
  skill: <Target className="h-4 w-4" />,
};

const typeColors: Record<ItemType, string> = {
  command: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  agent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  plugin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  hook: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  skill: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

const scopeColors: Record<string, string> = {
  global: 'bg-blue-600 text-white',
  project: 'bg-cyan-600 text-white',
  plugin: 'bg-purple-600 text-white',
  'n/a': 'bg-gray-400 text-white',
};

export function DataTable({ data, onRowClick }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [enabledFilter, setEnabledFilter] = useState<string>('all');

  // Apply custom filters
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (scopeFilter !== 'all' && item.scope !== scopeFilter) return false;
      if (enabledFilter !== 'all') {
        if (item.type !== 'plugin') return enabledFilter === 'all';
        if (enabledFilter === 'enabled' && !item.enabled) return false;
        if (enabledFilter === 'disabled' && item.enabled) return false;
      }
      return true;
    });
  }, [data, typeFilter, scopeFilter, enabledFilter]);

  const columns: ColumnDef<UnifiedItem>[] = [
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const type = row.getValue('type') as ItemType;
        return (
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded ${typeColors[type]}`}>
              {typeIcons[type]}
            </span>
            <span className="capitalize font-medium">{type}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.getValue('name') as string;
        const type = row.original.type;
        return (
          <span className="font-mono text-sm">
            {type === 'command' ? `/${name}` : name}
          </span>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.getValue('description') as string;
        return (
          <span className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
            {description || <span className="italic">No description</span>}
          </span>
        );
      },
    },
    {
      accessorKey: 'scope',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Scope
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const scope = row.getValue('scope') as string;
        const pluginName = row.original.pluginName;
        return (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className={`${scopeColors[scope]} text-xs`}>
              {scope}
            </Badge>
            {pluginName && (
              <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={pluginName}>
                {pluginName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original.category;
        return category ? (
          <Badge variant="outline" className="capitalize text-xs">
            {category}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'enabled',
      header: 'Status',
      cell: ({ row }) => {
        const enabled = row.original.enabled;
        if (enabled === undefined) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <Badge variant={enabled ? 'default' : 'secondary'} className="text-xs">
            {enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'lastModified',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Modified
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('lastModified') as Date;
        return (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        );
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.getValue('lastModified') as Date;
        const dateB = rowB.getValue('lastModified') as Date;
        return dateA.getTime() - dateB.getTime();
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      const name = String(row.getValue('name') || '').toLowerCase();
      const description = String(row.getValue('description') || '').toLowerCase();
      const type = String(row.getValue('type') || '').toLowerCase();
      return name.includes(searchValue) || description.includes(searchValue) || type.includes(searchValue);
    },
    state: {
      sorting,
      columnFilters,
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
    setTypeFilter('all');
    setScopeFilter('all');
    setEnabledFilter('all');
  };

  const hasActiveFilters = globalFilter || typeFilter !== 'all' || scopeFilter !== 'all' || enabledFilter !== 'all';

  // Get unique values for filters
  const uniqueTypes = [...new Set(data.map((item) => item.type))];
  const uniqueScopes = [...new Set(data.map((item) => item.scope))];

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or type..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  <div className="flex items-center gap-2">
                    {typeIcons[type]}
                    <span className="capitalize">{type}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Scope Filter */}
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              {uniqueScopes.map((scope) => (
                <SelectItem key={scope} value={scope} className="capitalize">
                  {scope}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Enabled Filter (only for plugins) */}
          <Select value={enabledFilter} onValueChange={setEnabledFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
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
            {filteredData.length} of {data.length} items
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
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => onRowClick(row.original)}
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
                  No results found.
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
