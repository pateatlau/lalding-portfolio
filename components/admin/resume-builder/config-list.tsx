'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import {
  createResumeConfig,
  updateResumeConfig,
  deleteResumeConfig,
  getResumeConfig,
  getResumeConfigs,
} from '@/actions/resume-builder';
import type { ResumeConfigListItem } from '@/actions/resume-builder';
import type { ResumeConfig } from '@/lib/supabase/types';

type TemplateOption = {
  id: string;
  name: string;
};

type ConfigListProps = {
  configs: ResumeConfigListItem[];
  templates: TemplateOption[];
  onSelectConfig: (config: ResumeConfig) => void;
  onConfigsChanged: (configs: ResumeConfigListItem[]) => void;
};

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

const EMPTY_FORM = {
  name: '',
  description: '',
  template_id: undefined as string | undefined,
};

export default function ConfigList({
  configs,
  templates,
  onSelectConfig,
  onConfigsChanged,
}: ConfigListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ResumeConfigListItem | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<ResumeConfigListItem | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMessage>(null);

  function openAddDialog() {
    setEditingConfig(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  }

  function openEditDialog(config: ResumeConfigListItem) {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      description: config.description ?? '',
      template_id: undefined, // We don't have template_id on list item, will keep current on save
    });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(config: ResumeConfigListItem) {
    setDeletingConfig(config);
    setIsDeleteDialogOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setStatus(null);

    const payload: Record<string, unknown> = {
      name: formData.name,
      description: formData.description || null,
    };
    if (formData.template_id) {
      payload.template_id = formData.template_id;
    }

    if (editingConfig) {
      const result = await updateResumeConfig(editingConfig.id, payload);
      if (result.error) {
        setStatus({ type: 'error', message: result.error });
        setIsSaving(false);
        return;
      }
    } else {
      payload.sections = [
        {
          section: 'summary',
          enabled: true,
          label: 'Professional Summary',
          itemIds: null,
          sort_order: 0,
        },
        {
          section: 'skills',
          enabled: true,
          label: 'Skills',
          itemIds: null,
          sort_order: 1,
        },
        {
          section: 'experience',
          enabled: true,
          label: 'Work History',
          itemIds: null,
          sort_order: 2,
        },
        {
          section: 'education',
          enabled: true,
          label: 'Education',
          itemIds: null,
          sort_order: 3,
        },
      ];
      const result = await createResumeConfig(payload as Parameters<typeof createResumeConfig>[0]);
      if (result.error) {
        setStatus({ type: 'error', message: result.error });
        setIsSaving(false);
        return;
      }
    }

    // Refresh the configs list
    const refreshed = await getResumeConfigs();
    if (refreshed.data) {
      onConfigsChanged(refreshed.data);
    }

    setIsDialogOpen(false);
    setIsSaving(false);
    setStatus({ type: 'success', message: editingConfig ? 'Config updated' : 'Config created' });
  }

  async function handleDelete() {
    if (!deletingConfig) return;
    setIsDeleting(true);
    setStatus(null);

    const result = await deleteResumeConfig(deletingConfig.id);
    if (result.error) {
      setStatus({ type: 'error', message: result.error });
      setIsDeleting(false);
      return;
    }

    const refreshed = await getResumeConfigs();
    if (refreshed.data) {
      onConfigsChanged(refreshed.data);
    }

    setIsDeleteDialogOpen(false);
    setIsDeleting(false);
    setStatus({ type: 'success', message: 'Config deleted' });
  }

  async function handleSelect(configItem: ResumeConfigListItem) {
    setIsSelecting(configItem.id);
    const result = await getResumeConfig(configItem.id);
    setIsSelecting(null);
    if (result.data) {
      onSelectConfig(result.data);
    } else {
      setStatus({ type: 'error', message: result.error ?? 'Failed to load config' });
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {configs.length} config{configs.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="mr-1 size-4" />
          New Config
        </Button>
      </div>

      {status && (
        <p
          className={`text-sm ${status.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
        >
          {status.message}
        </p>
      )}

      {configs.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          No resume configs yet. Create one to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => (
              <TableRow key={config.id}>
                <TableCell>
                  <div>
                    <span className="font-medium">{config.name}</span>
                    {config.description && (
                      <p className="text-muted-foreground text-xs">{config.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {config.templateName ?? '—'}
                </TableCell>
                <TableCell>
                  {config.is_active && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(config.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSelect(config)}
                      disabled={isSelecting === config.id}
                      title="Open in Composer"
                    >
                      {isSelecting === config.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ArrowRight className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(config)}
                      title="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(config)}
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit Dialog */}
      {isDialogOpen && (
        <Dialog open onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingConfig ? 'Edit Config' : 'New Resume Config'}</DialogTitle>
              <DialogDescription>
                {editingConfig
                  ? 'Update the config name, description, or template.'
                  : 'Create a new resume configuration with default sections.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="config-name">Name</Label>
                <Input
                  id="config-name"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Frontend Focus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="config-description">Description</Label>
                <Textarea
                  id="config-description"
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="config-template">Template</Label>
                <Select
                  value={formData.template_id}
                  onValueChange={(v) => setFormData((f) => ({ ...f, template_id: v }))}
                >
                  <SelectTrigger id="config-template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
                {isSaving && <Loader2 className="mr-1 size-4 animate-spin" />}
                {editingConfig ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Config</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingConfig?.name}&quot;? This will also
              delete all generated PDF versions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
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
