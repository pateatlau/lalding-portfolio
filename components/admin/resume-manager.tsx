'use client';

import React, { useRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, FileText, Loader2 } from 'lucide-react';
import { uploadResume } from '@/actions/admin';
import type { ResumeDownloadEntry } from '@/actions/admin';

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

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

export default function ResumeManager({
  resumeUrl,
  updatedAt,
  downloads,
}: {
  resumeUrl: string | null;
  updatedAt: string;
  downloads: ResumeDownloadEntry[];
}) {
  const [currentResumeUrl, setCurrentResumeUrl] = useState(resumeUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setStatus({ type: 'error', message: 'Only PDF files are allowed' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'File must be smaller than 10 MB' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await uploadResume(formData);

      if (error) {
        setStatus({ type: 'error', message: error });
      } else if (data) {
        setCurrentResumeUrl(data.path);
        setStatus({ type: 'success', message: 'Resume uploaded successfully!' });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Resume Management</h1>
        <p className="text-muted-foreground text-sm">
          Upload your resume and view download history
        </p>
      </div>

      {status && (
        <p
          className={
            status.type === 'success' ? 'text-success text-sm' : 'text-destructive text-sm'
          }
        >
          {status.message}
        </p>
      )}

      {/* Current Resume Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="text-muted-foreground size-8" />
            <div>
              {currentResumeUrl ? (
                <>
                  <p className="font-medium">{currentResumeUrl}</p>
                  <p className="text-muted-foreground text-xs">
                    Last updated: {new Date(updatedAt).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No resume uploaded</p>
              )}
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant={currentResumeUrl ? 'outline' : 'default'}
            >
              {isUploading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 size-4" />
              )}
              {isUploading ? 'Uploading...' : currentResumeUrl ? 'Replace Resume' : 'Upload Resume'}
            </Button>
            <p className="text-muted-foreground mt-1 text-xs">PDF only, max 10 MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Download Log */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Download Log</h2>

        {downloads.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No downloads recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="w-[120px]">Downloaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {downloads.map((dl) => (
                <TableRow key={dl.id}>
                  <TableCell className="font-medium">{dl.visitorName ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {dl.visitorEmail ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {dl.visitorCompany ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {timeAgo(dl.downloadedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
