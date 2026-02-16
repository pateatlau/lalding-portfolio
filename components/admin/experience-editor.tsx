'use client';

import React, { useState } from 'react';
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
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import {
  createExperience,
  updateExperience,
  deleteExperience,
  reorderExperiences,
} from '@/actions/admin';
import type { Experience } from '@/lib/supabase/types';

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

const EMPTY_FORM = {
  title: '',
  company: '',
  description: '',
  display_date: '',
  start_date: '',
  end_date: '',
  icon: 'work',
  company_logo_url: '',
};

export default function ExperienceEditor({
  experiences: initialExperiences,
}: {
  experiences: Experience[];
}) {
  const [experiences, setExperiences] = useState(initialExperiences);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [deletingExp, setDeletingExp] = useState<Experience | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  function openAddDialog() {
    setEditingExp(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  }

  function openEditDialog(exp: Experience) {
    setEditingExp(exp);
    setFormData({
      title: exp.title,
      company: exp.company,
      description: exp.description,
      display_date: exp.display_date,
      start_date: exp.start_date,
      end_date: exp.end_date ?? '',
      icon: exp.icon,
      company_logo_url: exp.company_logo_url ?? '',
    });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(exp: Experience) {
    setDeletingExp(exp);
    setIsDeleteDialogOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setStatus(null);

    if (
      !formData.title.trim() ||
      !formData.company.trim() ||
      !formData.description.trim() ||
      !formData.display_date.trim() ||
      !formData.start_date.trim()
    ) {
      setStatus({ type: 'error', message: 'Please fill in all required fields' });
      setIsSaving(false);
      return;
    }

    const payload = {
      title: formData.title,
      company: formData.company,
      description: formData.description,
      display_date: formData.display_date,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      icon: formData.icon,
      company_logo_url: formData.company_logo_url || null,
    };

    if (editingExp) {
      const { data, error } = await updateExperience(editingExp.id, payload);
      if (error) {
        setStatus({ type: 'error', message: error });
      } else if (data) {
        setExperiences((prev) => prev.map((e) => (e.id === data.id ? data : e)));
        setStatus({ type: 'success', message: 'Experience updated successfully!' });
        setIsDialogOpen(false);
      }
    } else {
      const { data, error } = await createExperience({
        ...payload,
        sort_order: experiences.length,
      });
      if (error) {
        setStatus({ type: 'error', message: error });
      } else if (data) {
        setExperiences((prev) => [...prev, data]);
        setStatus({ type: 'success', message: 'Experience created successfully!' });
        setIsDialogOpen(false);
      }
    }

    setIsSaving(false);
  }

  async function handleDelete() {
    if (!deletingExp) return;
    setIsDeleting(true);
    setStatus(null);

    const { error } = await deleteExperience(deletingExp.id);
    if (error) {
      setStatus({ type: 'error', message: error });
    } else {
      setExperiences((prev) => prev.filter((e) => e.id !== deletingExp.id));
      setStatus({ type: 'success', message: 'Experience deleted successfully!' });
      setIsDeleteDialogOpen(false);
      setDeletingExp(null);
    }

    setIsDeleting(false);
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= experiences.length) return;

    setIsReordering(true);
    setStatus(null);

    const reordered = [...experiences];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setExperiences(reordered);

    const { error } = await reorderExperiences(reordered.map((e) => e.id));
    if (error) {
      setExperiences(experiences); // revert
      setStatus({ type: 'error', message: error });
    }

    setIsReordering(false);
  }

  const isAddMode = editingExp === null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Experience Editor</h1>
          <p className="text-muted-foreground text-sm">Manage your career timeline entries</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-1 size-4" />
          Add Experience
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

      {experiences.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No experiences yet. Click &quot;Add Experience&quot; to create one.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experiences.map((exp, index) => (
              <TableRow key={exp.id}>
                <TableCell>
                  <div className="flex gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isReordering}
                    >
                      <ChevronUp className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === experiences.length - 1 || isReordering}
                    >
                      <ChevronDown className="size-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{exp.title}</TableCell>
                <TableCell>{exp.company}</TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">
                  {exp.display_date}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => openEditDialog(exp)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => openDeleteDialog(exp)}
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
            <DialogTitle>{isAddMode ? 'Add Experience' : 'Edit Experience'}</DialogTitle>
            <DialogDescription>
              {isAddMode
                ? 'Add a new entry to your career timeline.'
                : 'Update this career timeline entry.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exp-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="exp-title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Deputy Vice President"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-company">
                Company <span className="text-destructive">*</span>
              </Label>
              <Input
                id="exp-company"
                value={formData.company}
                onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
                placeholder="HDFC Bank Limited"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="exp-description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Describe your role and responsibilities..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-display-date">
                Display Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="exp-display-date"
                value={formData.display_date}
                onChange={(e) => setFormData((p) => ({ ...p, display_date: e.target.value }))}
                placeholder="May 2023 - Present"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-start-date">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="exp-start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-end-date">End Date</Label>
                <Input
                  id="exp-end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                />
                <p className="text-muted-foreground text-xs">Leave empty for current role</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-icon">Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(val) => setFormData((p) => ({ ...p, icon: val }))}
                >
                  <SelectTrigger id="exp-icon" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work (Briefcase)</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-logo">Company Logo URL</Label>
                <Input
                  id="exp-logo"
                  type="url"
                  value={formData.company_logo_url}
                  onChange={(e) => setFormData((p) => ({ ...p, company_logo_url: e.target.value }))}
                  placeholder="/companies/logo.webp"
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
              {isSaving ? 'Saving...' : isAddMode ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Experience</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingExp?.title}&quot; at{' '}
              {deletingExp?.company}? This action cannot be undone.
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
