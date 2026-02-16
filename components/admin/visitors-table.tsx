'use client';

import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Search, ArrowUpDown, Users } from 'lucide-react';
import { getVisitorsCsvData } from '@/actions/admin';
import type { VisitorEntry } from '@/actions/admin';

type SortField = 'name' | 'email' | 'provider' | 'downloads' | 'joined';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function providerLabel(provider: string | null): string {
  if (!provider) return 'Unknown';
  const labels: Record<string, string> = {
    google: 'Google',
    github: 'GitHub',
    linkedin_oidc: 'LinkedIn',
    email: 'Email',
  };
  return labels[provider] ?? provider;
}

export default function VisitorsTable({ visitors }: { visitors: VisitorEntry[] }) {
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('joined');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Unique providers for filter dropdown
  const providers = useMemo(() => {
    const set = new Set(visitors.map((v) => v.provider).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [visitors]);

  // Filter + search
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return visitors.filter((v) => {
      if (providerFilter !== 'all' && v.provider !== providerFilter) return false;
      if (!q) return true;
      return (
        v.fullName?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.company?.toLowerCase().includes(q) ||
        v.role?.toLowerCase().includes(q)
      );
    });
  }, [visitors, search, providerFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;

    arr.sort((a, b) => {
      switch (sortField) {
        case 'name':
          return (a.fullName ?? '').localeCompare(b.fullName ?? '') * dir;
        case 'email':
          return (a.email ?? '').localeCompare(b.email ?? '') * dir;
        case 'provider':
          return (a.provider ?? '').localeCompare(b.provider ?? '') * dir;
        case 'downloads':
          return (a.downloadCount - b.downloadCount) * dir;
        case 'joined':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        default:
          return 0;
      }
    });

    return arr;
  }, [filtered, sortField, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  // Reset page when filters change
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleProviderFilter = (value: string) => {
    setProviderFilter(value);
    setPage(0);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const result = await getVisitorsCsvData();
      if (result.error || !result.data) {
        setExportError(result.error ?? 'Failed to export visitors');
        return;
      }

      const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `visitors-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('An unexpected error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      type="button"
      className="hover:text-foreground inline-flex items-center gap-1"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown
        className={`size-3 ${sortField === field ? 'text-foreground' : 'text-muted-foreground/50'}`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visitors</h1>
          <p className="text-muted-foreground text-sm">
            {visitors.length} total visitor{visitors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 size-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {exportError && <p className="text-destructive text-sm">{exportError}</p>}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, company, or role..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={providerFilter} onValueChange={handleProviderFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All providers</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p} value={p}>
                {providerLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Users className="text-muted-foreground/50 mb-4 size-12" />
          <p className="text-muted-foreground text-sm">
            {visitors.length === 0 ? 'No visitors yet.' : 'No visitors match your filters.'}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="name">Name</SortButton>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <SortButton field="email">Email</SortButton>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <SortButton field="provider">Provider</SortButton>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Company</TableHead>
                <TableHead className="hidden lg:table-cell">Role</TableHead>
                <TableHead className="w-[100px]">
                  <SortButton field="downloads">Downloads</SortButton>
                </TableHead>
                <TableHead className="w-[100px]">
                  <SortButton field="joined">Joined</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        {v.avatarUrl ? (
                          <AvatarImage src={v.avatarUrl} alt={v.fullName ?? ''} />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {(v.fullName ?? '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{v.fullName ?? '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {v.email ?? '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {v.provider ? (
                      <Badge variant="secondary">{providerLabel(v.provider)}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">
                    {v.company ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">
                    {v.role ?? '—'}
                  </TableCell>
                  <TableCell className="text-center">{v.downloadCount}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {timeAgo(v.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {page * ITEMS_PER_PAGE + 1}–
                {Math.min((page + 1) * ITEMS_PER_PAGE, sorted.length)} of {sorted.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
