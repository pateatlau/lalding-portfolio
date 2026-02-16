'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, Check, X } from 'lucide-react';
import {
  createSkillGroup,
  updateSkillGroup,
  deleteSkillGroup,
  reorderSkillGroups,
  createSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
} from '@/actions/admin';
import type { SkillGroupWithSkills, SkillGroup, Skill } from '@/lib/supabase/types';

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

export default function SkillsEditor({
  groups: initialGroups,
}: {
  groups: SkillGroupWithSkills[];
}) {
  const [groups, setGroups] = useState(initialGroups);

  // Group dialog state
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SkillGroup | null>(null);
  const [groupName, setGroupName] = useState('');

  // Delete dialog state
  const [deletingGroup, setDeletingGroup] = useState<SkillGroupWithSkills | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Inline skill editing state
  const [newSkillName, setNewSkillName] = useState<Record<string, string>>({});
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingSkillName, setEditingSkillName] = useState('');

  // Loading states
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isReorderingGroups, setIsReorderingGroups] = useState(false);
  const [savingSkillId, setSavingSkillId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMessage>(null);

  // --- Group operations ---

  function openAddGroupDialog() {
    setEditingGroup(null);
    setGroupName('');
    setIsGroupDialogOpen(true);
  }

  function openEditGroupDialog(group: SkillGroup) {
    setEditingGroup(group);
    setGroupName(group.category);
    setIsGroupDialogOpen(true);
  }

  function openDeleteGroupDialog(group: SkillGroupWithSkills) {
    setDeletingGroup(group);
    setIsDeleteDialogOpen(true);
  }

  async function handleSaveGroup() {
    if (!groupName.trim()) return;
    setIsSavingGroup(true);
    setStatus(null);

    if (editingGroup) {
      const { data, error } = await updateSkillGroup(editingGroup.id, {
        category: groupName.trim(),
      });
      if (error) {
        setStatus({ type: 'error', message: error });
      } else if (data) {
        setGroups((prev) =>
          prev.map((g) => (g.id === data.id ? { ...g, category: data.category } : g))
        );
        setStatus({ type: 'success', message: 'Group updated!' });
        setIsGroupDialogOpen(false);
      }
    } else {
      const { data, error } = await createSkillGroup({
        category: groupName.trim(),
        sort_order: groups.length,
      });
      if (error) {
        setStatus({ type: 'error', message: error });
      } else if (data) {
        setGroups((prev) => [...prev, { ...data, skills: [] }]);
        setStatus({ type: 'success', message: 'Group created!' });
        setIsGroupDialogOpen(false);
      }
    }

    setIsSavingGroup(false);
  }

  async function handleDeleteGroup() {
    if (!deletingGroup) return;
    setIsDeletingGroup(true);
    setStatus(null);

    const { error } = await deleteSkillGroup(deletingGroup.id);
    if (error) {
      setStatus({ type: 'error', message: error });
    } else {
      setGroups((prev) => prev.filter((g) => g.id !== deletingGroup.id));
      setStatus({ type: 'success', message: 'Group deleted!' });
      setIsDeleteDialogOpen(false);
      setDeletingGroup(null);
    }

    setIsDeletingGroup(false);
  }

  async function handleMoveGroup(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= groups.length) return;

    setIsReorderingGroups(true);
    setStatus(null);

    const reordered = [...groups];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const snapshot = groups;
    setGroups(reordered);

    const { error } = await reorderSkillGroups(reordered.map((g) => g.id));
    if (error) {
      setGroups(snapshot);
      setStatus({ type: 'error', message: error });
    }

    setIsReorderingGroups(false);
  }

  // --- Skill operations ---

  async function handleAddSkill(groupId: string) {
    const name = newSkillName[groupId]?.trim();
    if (!name) return;

    setSavingSkillId(groupId);
    setStatus(null);

    const group = groups.find((g) => g.id === groupId);
    const { data, error } = await createSkill({
      name,
      group_id: groupId,
      sort_order: group?.skills.length ?? 0,
    });

    if (error) {
      setStatus({ type: 'error', message: error });
    } else if (data) {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, skills: [...g.skills, data] } : g))
      );
      setNewSkillName((prev) => ({ ...prev, [groupId]: '' }));
    }

    setSavingSkillId(null);
  }

  function startEditSkill(skill: Skill) {
    setEditingSkillId(skill.id);
    setEditingSkillName(skill.name);
  }

  async function handleSaveSkillEdit(skillId: string) {
    if (!editingSkillName.trim()) return;
    setSavingSkillId(skillId);

    const { data, error } = await updateSkill(skillId, { name: editingSkillName.trim() });
    if (error) {
      setStatus({ type: 'error', message: error });
    } else if (data) {
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          skills: g.skills.map((s) => (s.id === data.id ? data : s)),
        }))
      );
      setEditingSkillId(null);
    }

    setSavingSkillId(null);
  }

  async function handleDeleteSkill(skillId: string, groupId: string) {
    setSavingSkillId(skillId);
    setStatus(null);

    const { error } = await deleteSkill(skillId);
    if (error) {
      setStatus({ type: 'error', message: error });
    } else {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, skills: g.skills.filter((s) => s.id !== skillId) } : g
        )
      );
    }

    setSavingSkillId(null);
  }

  async function handleMoveSkill(groupId: string, skillIndex: number, direction: 'up' | 'down') {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const targetIndex = direction === 'up' ? skillIndex - 1 : skillIndex + 1;
    if (targetIndex < 0 || targetIndex >= group.skills.length) return;

    const reorderedSkills = [...group.skills];
    [reorderedSkills[skillIndex], reorderedSkills[targetIndex]] = [
      reorderedSkills[targetIndex],
      reorderedSkills[skillIndex],
    ];

    const snapshot = groups;
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, skills: reorderedSkills } : g))
    );

    const { error } = await reorderSkills(reorderedSkills.map((s) => s.id));
    if (error) {
      setGroups(snapshot);
      setStatus({ type: 'error', message: error });
    }
  }

  const isAddGroupMode = editingGroup === null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Skills Editor</h1>
          <p className="text-muted-foreground text-sm">Manage skill groups and individual skills</p>
        </div>
        <Button onClick={openAddGroupDialog}>
          <Plus className="mr-1 size-4" />
          Add Group
        </Button>
      </div>

      {status && (
        <p
          className={
            status.type === 'success' ? 'text-sm text-green-600' : 'text-destructive text-sm'
          }
        >
          {status.message}
        </p>
      )}

      {groups.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No skill groups yet. Click &quot;Add Group&quot; to create one.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group, groupIndex) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6"
                      onClick={() => handleMoveGroup(groupIndex, 'up')}
                      disabled={groupIndex === 0 || isReorderingGroups}
                    >
                      <ChevronUp className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6"
                      onClick={() => handleMoveGroup(groupIndex, 'down')}
                      disabled={groupIndex === groups.length - 1 || isReorderingGroups}
                    >
                      <ChevronDown className="size-3" />
                    </Button>
                  </div>
                  <CardTitle className="text-base">{group.category}</CardTitle>
                </div>
                <CardAction>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => openEditGroupDialog(group)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => openDeleteGroupDialog(group)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Skill list */}
                {group.skills.length === 0 && (
                  <p className="text-muted-foreground py-2 text-center text-xs">
                    No skills in this group yet.
                  </p>
                )}
                {group.skills.map((skill, skillIndex) => (
                  <div key={skill.id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                    {/* Reorder */}
                    <div className="flex gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-5"
                        onClick={() => handleMoveSkill(group.id, skillIndex, 'up')}
                        disabled={skillIndex === 0}
                      >
                        <ChevronUp className="size-2.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-5"
                        onClick={() => handleMoveSkill(group.id, skillIndex, 'down')}
                        disabled={skillIndex === group.skills.length - 1}
                      >
                        <ChevronDown className="size-2.5" />
                      </Button>
                    </div>

                    {/* Skill name — inline edit */}
                    {editingSkillId === skill.id ? (
                      <div className="flex flex-1 items-center gap-1">
                        <Input
                          value={editingSkillName}
                          onChange={(e) => setEditingSkillName(e.target.value)}
                          className="h-7 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveSkillEdit(skill.id);
                            if (e.key === 'Escape') setEditingSkillId(null);
                          }}
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6"
                          onClick={() => handleSaveSkillEdit(skill.id)}
                          disabled={savingSkillId === skill.id}
                        >
                          {savingSkillId === skill.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Check className="size-3" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6"
                          onClick={() => setEditingSkillId(null)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">{skill.name}</span>
                        <div className="flex gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6"
                            onClick={() => startEditSkill(skill)}
                          >
                            <Pencil className="size-2.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6"
                            onClick={() => handleDeleteSkill(skill.id, group.id)}
                            disabled={savingSkillId === skill.id}
                          >
                            {savingSkillId === skill.id ? (
                              <Loader2 className="size-2.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-2.5" />
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Add skill inline */}
                <div className="flex items-center gap-2 pt-2">
                  <Input
                    value={newSkillName[group.id] ?? ''}
                    onChange={(e) =>
                      setNewSkillName((prev) => ({ ...prev, [group.id]: e.target.value }))
                    }
                    placeholder="New skill name..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSkill(group.id);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddSkill(group.id)}
                    disabled={savingSkillId === group.id || !newSkillName[group.id]?.trim()}
                  >
                    {savingSkillId === group.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Plus className="size-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAddGroupMode ? 'Add Skill Group' : 'Edit Skill Group'}</DialogTitle>
            <DialogDescription>
              {isAddGroupMode
                ? 'Create a new category for grouping skills.'
                : 'Rename this skill group.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Frontend, Backend & Database"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveGroup();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={isSavingGroup || !groupName.trim()}>
              {isSavingGroup && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isSavingGroup ? 'Saving...' : isAddGroupMode ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Skill Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingGroup?.category}&quot;?
              {deletingGroup && deletingGroup.skills.length > 0 && (
                <>
                  {' '}
                  This will also delete {deletingGroup.skills.length}{' '}
                  {deletingGroup.skills.length === 1 ? 'skill' : 'skills'} in this group.
                </>
              )}{' '}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup} disabled={isDeletingGroup}>
              {isDeletingGroup && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isDeletingGroup ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
