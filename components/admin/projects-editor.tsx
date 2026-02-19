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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import {
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  deleteStorageFile,
} from '@/actions/admin';
import ImageUpload from '@/components/admin/image-upload';
import VideoUpload from '@/components/admin/video-upload';
import type { Project, ProjectCategory } from '@/lib/supabase/types';

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

/** Extract the storage path from a Supabase public URL. Returns null for non-Supabase URLs. */
function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

const NO_CATEGORY = '__none__';

const EMPTY_FORM = {
  title: '',
  description: '',
  tags: '',
  category_id: NO_CATEGORY,
  image_url: '',
  demo_video_url: '',
  source_code_url: '',
  live_site_url: '',
};

export default function ProjectsEditor({
  projects: initialProjects,
  categories,
}: {
  projects: Project[];
  categories: ProjectCategory[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const imageUrlRef = useRef(formData.image_url);
  imageUrlRef.current = formData.image_url;
  const videoUrlRef = useRef(formData.demo_video_url);
  videoUrlRef.current = formData.demo_video_url;
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  function openAddDialog() {
    setEditingProject(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  }

  function openEditDialog(project: Project) {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      tags: project.tags.join(', '),
      category_id: project.category_id ?? NO_CATEGORY,
      image_url: project.image_url ?? '',
      demo_video_url: project.demo_video_url ?? '',
      source_code_url: project.source_code_url ?? '',
      live_site_url: project.live_site_url ?? '',
    });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(project: Project) {
    setDeletingProject(project);
    setIsDeleteDialogOpen(true);
  }

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function handleSave() {
    setIsSaving(true);
    setStatus(null);

    if (!formData.title.trim() || !formData.description.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all required fields' });
      setIsSaving(false);
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      tags: parseTags(formData.tags),
      category_id: formData.category_id === NO_CATEGORY ? null : formData.category_id,
      image_url: formData.image_url || null,
      demo_video_url: formData.demo_video_url || null,
      source_code_url: formData.source_code_url || null,
      live_site_url: formData.live_site_url || null,
    };

    try {
      if (editingProject) {
        const { data, error } = await updateProject(editingProject.id, payload);
        if (error) {
          setStatus({ type: 'error', message: error });
        } else if (data) {
          setProjects((prev) => prev.map((p) => (p.id === data.id ? data : p)));
          setStatus({ type: 'success', message: 'Project updated successfully!' });
          setIsDialogOpen(false);
        }
      } else {
        const { data, error } = await createProject({
          ...payload,
          sort_order: projects.length,
        });
        if (error) {
          setStatus({ type: 'error', message: error });
        } else if (data) {
          setProjects((prev) => [...prev, data]);
          setStatus({ type: 'success', message: 'Project created successfully!' });
          setIsDialogOpen(false);
        }
      }
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingProject) return;
    setIsDeleting(true);
    setStatus(null);

    try {
      const { error } = await deleteProject(deletingProject.id);
      if (error) {
        setStatus({ type: 'error', message: error });
      } else {
        // Clean up associated storage files
        if (deletingProject.image_url) {
          const imgPath = extractStoragePath(deletingProject.image_url, 'project-images');
          if (imgPath) {
            deleteStorageFile('project-images', imgPath).catch((err) =>
              console.error('Failed to delete project image:', imgPath, err)
            );
          }
        }
        if (deletingProject.demo_video_url) {
          const vidPath = extractStoragePath(deletingProject.demo_video_url, 'project-videos');
          if (vidPath) {
            deleteStorageFile('project-videos', vidPath).catch((err) =>
              console.error('Failed to delete project video:', vidPath, err)
            );
          }
        }

        setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
        setStatus({ type: 'success', message: 'Project deleted successfully!' });
        setIsDeleteDialogOpen(false);
        setDeletingProject(null);
      }
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    setIsReordering(true);
    setStatus(null);

    const snapshot = projects;
    const reordered = [...projects];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setProjects(reordered);

    try {
      const { error } = await reorderProjects(reordered.map((p) => p.id));
      if (error) {
        setProjects(snapshot);
        setStatus({ type: 'error', message: error });
      }
    } catch (err) {
      setProjects(snapshot);
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsReordering(false);
    }
  }

  const isAddMode = editingProject === null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects Editor</h1>
          <p className="text-muted-foreground text-sm">Manage your portfolio projects</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-1 size-4" />
          Add Project
        </Button>
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

      {projects.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No projects yet. Click &quot;Add Project&quot; to create one.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Tags</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project, index) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div className="flex gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Move project up"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isReordering}
                    >
                      <ChevronUp className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Move project down"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === projects.length - 1 || isReordering}
                    >
                      <ChevronDown className="size-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{project.title}</TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">
                  {categoryMap.get(project.category_id ?? '') ?? '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={`${tag}-${i}`} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Edit project"
                      onClick={() => openEditDialog(project)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Delete project"
                      onClick={() => openDeleteDialog(project)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAddMode ? 'Add Project' : 'Edit Project'}</DialogTitle>
            <DialogDescription>
              {isAddMode ? 'Add a new project to your portfolio.' : 'Update this project.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proj-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="proj-title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="My Awesome Project"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="proj-description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="A brief description of the project..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-tags">Tags</Label>
              <Input
                id="proj-tags"
                value={formData.tags}
                onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
                placeholder="React, TypeScript, Next.js"
              />
              <p className="text-muted-foreground text-xs">Comma-separated list</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(val) => setFormData((p) => ({ ...p, category_id: val }))}
              >
                <SelectTrigger id="proj-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No Category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ImageUpload
              currentUrl={formData.image_url || null}
              onUploadComplete={(_path, publicUrl) => {
                const oldUrl = imageUrlRef.current;
                if (oldUrl) {
                  const oldPath = extractStoragePath(oldUrl, 'project-images');
                  if (oldPath) {
                    deleteStorageFile('project-images', oldPath).catch((err) =>
                      console.error('Failed to delete old image:', oldPath, err)
                    );
                  }
                }
                setFormData((p) => ({ ...p, image_url: publicUrl }));
              }}
              onRemove={() => {
                const oldUrl = imageUrlRef.current;
                if (oldUrl) {
                  const oldPath = extractStoragePath(oldUrl, 'project-images');
                  if (oldPath) {
                    deleteStorageFile('project-images', oldPath).catch((err) =>
                      console.error('Failed to delete image:', oldPath, err)
                    );
                  }
                }
                setFormData((p) => ({ ...p, image_url: '' }));
              }}
            />

            <VideoUpload
              currentUrl={formData.demo_video_url || null}
              onUploadComplete={(_path, publicUrl) => {
                const oldUrl = videoUrlRef.current;
                if (oldUrl) {
                  const oldPath = extractStoragePath(oldUrl, 'project-videos');
                  if (oldPath) {
                    deleteStorageFile('project-videos', oldPath).catch((err) =>
                      console.error('Failed to delete old video:', oldPath, err)
                    );
                  }
                }
                setFormData((p) => ({ ...p, demo_video_url: publicUrl }));
              }}
              onRemove={() => {
                const oldUrl = videoUrlRef.current;
                if (oldUrl) {
                  const oldPath = extractStoragePath(oldUrl, 'project-videos');
                  if (oldPath) {
                    deleteStorageFile('project-videos', oldPath).catch((err) =>
                      console.error('Failed to delete video:', oldPath, err)
                    );
                  }
                }
                setFormData((p) => ({ ...p, demo_video_url: '' }));
              }}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="proj-source">Source Code URL</Label>
                <Input
                  id="proj-source"
                  type="url"
                  value={formData.source_code_url}
                  onChange={(e) => setFormData((p) => ({ ...p, source_code_url: e.target.value }))}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-live">Live Site URL</Label>
                <Input
                  id="proj-live"
                  type="url"
                  value={formData.live_site_url}
                  onChange={(e) => setFormData((p) => ({ ...p, live_site_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isSaving ? 'Saving...' : isAddMode ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingProject?.title}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
