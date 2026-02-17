'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Film, Trash2, Loader2 } from 'lucide-react';
import { uploadProjectVideo } from '@/actions/admin';

interface VideoUploadProps {
  currentUrl: string | null;
  onUploadComplete: (path: string, publicUrl: string) => void;
  onRemove: () => void;
  label?: string;
}

const ALLOWED_TYPES = ['video/mp4', 'video/webm'];
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export default function VideoUpload({
  currentUrl,
  onUploadComplete,
  onRemove,
  label = 'Demo Video',
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only MP4 and WebM videos are allowed');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_SIZE) {
      setError('Video must be smaller than 50 MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error: uploadError } = await uploadProjectVideo(formData);

      if (uploadError) {
        setError(uploadError);
        setPreviewUrl(null);
      } else if (data) {
        setPreviewUrl(null);
        onUploadComplete(data.path, data.publicUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      URL.revokeObjectURL(localPreview);
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    setError(null);
    onRemove();
  }

  const displayUrl = previewUrl ?? currentUrl;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>

      {displayUrl ? (
        <div className="relative">
          <div className="border-border relative overflow-hidden rounded-lg border">
            <video
              src={displayUrl}
              controls
              className="h-40 w-full object-cover"
              preload="metadata"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 size-7"
            onClick={handleRemove}
            disabled={isUploading}
            aria-label="Remove video"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition"
        >
          {isUploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <>
              <Film className="size-8" />
              <span className="text-xs">Click to upload video</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {displayUrl && !isUploading && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <Film className="mr-1 size-4" />
          Replace Video
        </Button>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}

      <p className="text-muted-foreground text-xs">MP4 or WebM. Max 50 MB.</p>
    </div>
  );
}
