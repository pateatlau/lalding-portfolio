'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileDown, CheckCircle, RefreshCw } from 'lucide-react';
import { previewResumeHtml, generateResumePdf } from '@/actions/resume-pdf';
import { activateResumeVersion } from '@/actions/resume-builder';
import type { ResumeConfig } from '@/lib/supabase/types';

type ResumePreviewProps = {
  config: ResumeConfig;
};

type GenerationResult = {
  versionId: string;
  path: string;
} | null;

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

const ZOOM_LEVELS = ['50', '75', '100'] as const;

export default function ResumePreview({ config }: ResumePreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult>(null);
  const [zoom, setZoom] = useState<string>('75');
  const [status, setStatus] = useState<StatusMessage>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function loadPreview() {
    setIsLoadingPreview(true);
    setStatus(null);

    const result = await previewResumeHtml(config.id);

    if (result.error) {
      setStatus({ type: 'error', message: result.error });
      setIsLoadingPreview(false);
      return;
    }

    if (result.data) {
      setHtml(result.data.html);
      setPageSize(result.data.pageSize);
    }

    setIsLoadingPreview(false);
  }

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id, config.updated_at]);

  useEffect(() => {
    if (html && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  async function handleGenerate() {
    setIsGenerating(true);
    setStatus(null);
    setGenerationResult(null);

    const result = await generateResumePdf(config.id);

    setIsGenerating(false);

    if (result.error) {
      setStatus({ type: 'error', message: result.error });
      return;
    }

    if (result.data) {
      setGenerationResult(result.data);
      setStatus({ type: 'success', message: 'PDF generated successfully' });
    }
  }

  async function handleActivate() {
    if (!generationResult) return;
    setIsActivating(true);
    setStatus(null);

    const result = await activateResumeVersion(generationResult.versionId);

    setIsActivating(false);

    if (result.error) {
      setStatus({ type: 'error', message: result.error });
      return;
    }

    setStatus({ type: 'success', message: 'Version activated as current resume' });
  }

  const scale = parseInt(zoom) / 100;

  return (
    <div className="space-y-4 pt-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{pageSize}</Badge>
          <Select value={zoom} onValueChange={setZoom}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZOOM_LEVELS.map((z) => (
                <SelectItem key={z} value={z}>
                  {z}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadPreview} disabled={isLoadingPreview}>
            {isLoadingPreview ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 size-4" />
            )}
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {generationResult && (
            <Button variant="outline" size="sm" onClick={handleActivate} disabled={isActivating}>
              {isActivating ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-1 size-4" />
              )}
              Activate
            </Button>
          )}
          <Button size="sm" onClick={handleGenerate} disabled={isGenerating || !html}>
            {isGenerating ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <FileDown className="mr-1 size-4" />
            )}
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <p
          className={`text-sm ${status.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
        >
          {status.message}
        </p>
      )}

      {/* Preview iframe */}
      {isLoadingPreview && !html ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      ) : html ? (
        <div className="overflow-auto rounded-lg border bg-gray-100 p-4 dark:bg-gray-900">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${100 / scale}%`,
            }}
          >
            <iframe
              ref={iframeRef}
              title="Resume Preview"
              className="mx-auto block border-0 shadow-lg"
              style={{
                width: pageSize === 'A4' ? '210mm' : '8.5in',
                height: pageSize === 'A4' ? '297mm' : '11in',
                backgroundColor: 'white',
              }}
            />
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground flex h-96 items-center justify-center">
          No preview available. Save your config first.
        </div>
      )}
    </div>
  );
}
