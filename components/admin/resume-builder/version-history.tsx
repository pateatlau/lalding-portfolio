'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Download, CheckCircle, Trash2 } from 'lucide-react';
import {
  getResumeVersions,
  activateResumeVersion,
  deleteResumeVersion,
} from '@/actions/resume-builder';
import type { ResumeVersionListItem } from '@/actions/resume-builder';

type VersionHistoryProps = {
  configId: string;
  configName: string;
};

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VersionHistory({ configId, configName }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ResumeVersionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResumeVersionListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadVersions() {
    setIsLoading(true);
    const result = await getResumeVersions(configId);
    if (result.data) setVersions(result.data);
    if (result.error) setStatus({ type: 'error', message: result.error });
    setIsLoading(false);
  }

  useEffect(() => {
    loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configId]);

  async function handleActivate(versionId: string) {
    setActivatingId(versionId);
    setStatus(null);

    const result = await activateResumeVersion(versionId);

    setActivatingId(null);

    if (result.error) {
      setStatus({ type: 'error', message: result.error });
      return;
    }

    // Update local state: deactivate all, activate selected
    setVersions((prev) => prev.map((v) => ({ ...v, is_active: v.id === versionId })));
    setStatus({ type: 'success', message: 'Version activated as current resume' });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setStatus(null);

    const result = await deleteResumeVersion(deleteTarget.id);

    setIsDeleting(false);
    setDeleteTarget(null);

    if (result.error) {
      setStatus({ type: 'error', message: result.error });
      return;
    }

    setVersions((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    setStatus({ type: 'success', message: 'Version deleted' });
  }

  function handleDownload(version: ResumeVersionListItem) {
    // Build Supabase storage public URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;
    const url = `${supabaseUrl}/storage/v1/object/public/resume/${version.pdf_storage_path}`;
    window.open(url, '_blank');
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center pt-4">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Generated versions for <span className="font-medium">{configName}</span>
        </p>
        <Button variant="outline" size="sm" onClick={loadVersions}>
          Refresh
        </Button>
      </div>

      {status && (
        <p
          className={`text-sm ${status.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
        >
          {status.message}
        </p>
      )}

      {versions.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No versions generated yet. Use the Preview tab to generate a PDF.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Gen Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="text-sm">{formatDate(version.created_at)}</TableCell>
                  <TableCell className="text-sm">{formatBytes(version.pdf_file_size)}</TableCell>
                  <TableCell className="text-sm">
                    {version.generation_time_ms !== null
                      ? `${(version.generation_time_ms / 1000).toFixed(1)}s`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {version.is_active ? (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(version)}
                        title="Download PDF"
                      >
                        <Download className="size-4" />
                      </Button>
                      {!version.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActivate(version.id)}
                          disabled={activatingId === version.id}
                          title="Activate version"
                        >
                          {activatingId === version.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle className="size-4" />
                          )}
                        </Button>
                      )}
                      {!version.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(version)}
                          title="Delete version"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Version</DialogTitle>
            <DialogDescription>
              This will permanently delete this generated PDF. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-1 size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
