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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import {
  createEducation,
  updateEducation,
  deleteEducation,
  reorderEducations,
} from '@/actions/admin';
import type { Education } from '@/lib/supabase/types';

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

const EMPTY_FORM = {
  institution: '',
  degree: '',
  field_of_study: '',
  description: '',
  display_date: '',
  start_date: '',
  end_date: '',
  institution_logo_url: '',
};

export default function EducationEditor({
  educations: initialEducations,
}: {
  educations: Education[];
}) {
  const [educations, setEducations] = useState(initialEducations);
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);
  const [deletingEdu, setDeletingEdu] = useState<Education | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  function openAddDialog() {
    setEditingEdu(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  }

  function openEditDialog(edu: Education) {
    setEditingEdu(edu);
    setFormData({
      institution: edu.institution,
      degree: edu.degree,
      field_of_study: edu.field_of_study ?? '',
      description: edu.description ?? '',
      display_date: edu.display_date ?? '',
      start_date: edu.start_date ?? '',
      end_date: edu.end_date ?? '',
      institution_logo_url: edu.institution_logo_url ?? '',
    });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(edu: Education) {
    setDeletingEdu(edu);
    setIsDeleteDialogOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setStatus(null);

    if (!formData.institution.trim() || !formData.degree.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all required fields' });
      setIsSaving(false);
      return;
    }

    const payload = {
      institution: formData.institution,
      degree: formData.degree,
      field_of_study: formData.field_of_study || null,
      description: formData.description || null,
      display_date: formData.display_date || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      institution_logo_url: formData.institution_logo_url || null,
    };

    try {
      if (editingEdu) {
        const { data, error } = await updateEducation(editingEdu.id, payload);
        if (error) {
          setStatus({ type: 'error', message: error });
        } else if (data) {
          setEducations((prev) => prev.map((e) => (e.id === data.id ? data : e)));
          setStatus({ type: 'success', message: 'Education updated successfully!' });
          setIsDialogOpen(false);
        }
      } else {
        const nextSortOrder =
          educations.length > 0
            ? Math.max(...educations.map((e) => Number(e.sort_order ?? 0))) + 1
            : 0;
        const { data, error } = await createEducation({
          ...payload,
          sort_order: nextSortOrder,
        });
        if (error) {
          setStatus({ type: 'error', message: error });
        } else if (data) {
          setEducations((prev) => [...prev, data]);
          setStatus({ type: 'success', message: 'Education created successfully!' });
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
    if (!deletingEdu) return;
    setIsDeleting(true);
    setStatus(null);

    try {
      const { error } = await deleteEducation(deletingEdu.id);
      if (error) {
        setStatus({ type: 'error', message: error });
      } else {
        setEducations((prev) => prev.filter((e) => e.id !== deletingEdu.id));
        setStatus({ type: 'success', message: 'Education deleted successfully!' });
        setIsDeleteDialogOpen(false);
        setDeletingEdu(null);
      }
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= educations.length) return;

    setIsReordering(true);
    setStatus(null);

    const snapshot = educations;
    const reordered = [...educations];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setEducations(reordered);

    try {
      const { error } = await reorderEducations(reordered.map((e) => e.id));
      if (error) {
        setEducations(snapshot);
        setStatus({ type: 'error', message: error });
      }
    } catch (err) {
      setEducations(snapshot);
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsReordering(false);
    }
  }

  const isAddMode = editingEdu === null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Education Editor</h1>
          <p className="text-muted-foreground text-sm">Manage your education entries</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-1 size-4" />
          Add Education
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

      {educations.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No education entries yet. Click &quot;Add Education&quot; to create one.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Order</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Degree</TableHead>
              <TableHead className="hidden sm:table-cell">Field</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {educations.map((edu, index) => (
              <TableRow key={edu.id}>
                <TableCell>
                  <div className="flex gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Move education up"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isReordering}
                    >
                      <ChevronUp className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Move education down"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === educations.length - 1 || isReordering}
                    >
                      <ChevronDown className="size-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{edu.institution}</TableCell>
                <TableCell>{edu.degree}</TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">
                  {edu.field_of_study ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">
                  {edu.display_date ?? '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Edit education"
                      onClick={() => openEditDialog(edu)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Delete education"
                      onClick={() => openDeleteDialog(edu)}
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
            <DialogTitle>{isAddMode ? 'Add Education' : 'Edit Education'}</DialogTitle>
            <DialogDescription>
              {isAddMode ? 'Add a new education entry.' : 'Update this education entry.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edu-institution">
                Institution <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edu-institution"
                value={formData.institution}
                onChange={(e) => setFormData((p) => ({ ...p, institution: e.target.value }))}
                placeholder="University of Example"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edu-degree">
                Degree <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edu-degree"
                value={formData.degree}
                onChange={(e) => setFormData((p) => ({ ...p, degree: e.target.value }))}
                placeholder="Bachelor of Technology"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edu-field">Field of Study</Label>
              <Input
                id="edu-field"
                value={formData.field_of_study}
                onChange={(e) => setFormData((p) => ({ ...p, field_of_study: e.target.value }))}
                placeholder="Computer Science"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edu-description">Description</Label>
              <Textarea
                id="edu-description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Relevant coursework, achievements, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edu-display-date">Display Date</Label>
              <Input
                id="edu-display-date"
                value={formData.display_date}
                onChange={(e) => setFormData((p) => ({ ...p, display_date: e.target.value }))}
                placeholder="2015 - 2019"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edu-start-date">Start Date</Label>
                <Input
                  id="edu-start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edu-end-date">End Date</Label>
                <Input
                  id="edu-end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                />
                <p className="text-muted-foreground text-xs">Leave empty if currently studying</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edu-logo">Institution Logo URL</Label>
              <Input
                id="edu-logo"
                type="url"
                value={formData.institution_logo_url}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, institution_logo_url: e.target.value }))
                }
                placeholder="/companies/university-logo.webp"
              />
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
            <DialogTitle>Delete Education</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingEdu?.degree}&quot; at{' '}
              {deletingEdu?.institution}? This action cannot be undone.
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
