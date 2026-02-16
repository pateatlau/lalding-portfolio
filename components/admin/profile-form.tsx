'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { updateProfile, updateProfileStats } from '@/actions/admin';
import type { Profile, ProfileStat } from '@/lib/supabase/types';

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

interface ProfileFormProps {
  profile: Profile;
  stats: ProfileStat[];
}

export default function ProfileForm({ profile, stats }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    short_name: profile.short_name,
    job_title: profile.job_title,
    tagline: profile.tagline ?? '',
    typewriter_titles: profile.typewriter_titles,
    email: profile.email,
    phone: profile.phone ?? '',
    location: profile.location ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    github_url: profile.github_url ?? '',
    footer_text: profile.footer_text ?? '',
    about_tech_stack: profile.about_tech_stack ?? '',
    about_current_focus: profile.about_current_focus ?? '',
    about_beyond_code: profile.about_beyond_code ?? '',
    about_expertise: profile.about_expertise ?? [],
  });

  const [statsData, setStatsData] = useState(
    stats.map((s) => ({
      id: s.id,
      value: s.value,
      suffix: s.suffix ?? '+',
      label: s.label,
      sort_order: s.sort_order,
    }))
  );

  const [generalStatus, setGeneralStatus] = useState<StatusMessage>(null);
  const [aboutStatus, setAboutStatus] = useState<StatusMessage>(null);
  const [statsStatus, setStatsStatus] = useState<StatusMessage>(null);

  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [isSavingStats, setIsSavingStats] = useState(false);

  function updateField<K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function updateArrayItem(
    key: 'typewriter_titles' | 'about_expertise',
    index: number,
    value: string
  ) {
    setFormData((prev) => {
      const arr = [...prev[key]];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });
  }

  function addArrayItem(key: 'typewriter_titles' | 'about_expertise') {
    setFormData((prev) => ({ ...prev, [key]: [...prev[key], ''] }));
  }

  function removeArrayItem(key: 'typewriter_titles' | 'about_expertise', index: number) {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  }

  async function handleSaveGeneral() {
    setIsSavingGeneral(true);
    setGeneralStatus(null);

    if (
      !formData.full_name.trim() ||
      !formData.short_name.trim() ||
      !formData.job_title.trim() ||
      !formData.email.trim()
    ) {
      setGeneralStatus({ type: 'error', message: 'Please fill in all required fields' });
      setIsSavingGeneral(false);
      return;
    }

    const { error } = await updateProfile({
      full_name: formData.full_name,
      short_name: formData.short_name,
      job_title: formData.job_title,
      tagline: formData.tagline || null,
      typewriter_titles: formData.typewriter_titles,
      email: formData.email,
      phone: formData.phone || null,
      location: formData.location || null,
      linkedin_url: formData.linkedin_url || null,
      github_url: formData.github_url || null,
      footer_text: formData.footer_text || null,
    });

    setGeneralStatus(
      error
        ? { type: 'error', message: error }
        : { type: 'success', message: 'General info saved successfully!' }
    );
    setIsSavingGeneral(false);
  }

  async function handleSaveAbout() {
    setIsSavingAbout(true);
    setAboutStatus(null);

    const { error } = await updateProfile({
      about_tech_stack: formData.about_tech_stack || null,
      about_current_focus: formData.about_current_focus || null,
      about_beyond_code: formData.about_beyond_code || null,
      about_expertise: formData.about_expertise.length > 0 ? formData.about_expertise : null,
    });

    setAboutStatus(
      error
        ? { type: 'error', message: error }
        : { type: 'success', message: 'About info saved successfully!' }
    );
    setIsSavingAbout(false);
  }

  async function handleSaveStats() {
    setIsSavingStats(true);
    setStatsStatus(null);

    const invalidStats = statsData.filter((s) => !s.label.trim());
    if (invalidStats.length > 0) {
      setStatsStatus({ type: 'error', message: 'All stats must have a label' });
      setIsSavingStats(false);
      return;
    }

    const statsToSave = statsData.map((s, index) => ({
      value: s.value,
      suffix: s.suffix || null,
      label: s.label,
      sort_order: index,
    }));

    const { error } = await updateProfileStats(statsToSave);

    setStatsStatus(
      error
        ? { type: 'error', message: error }
        : { type: 'success', message: 'Stats saved successfully!' }
    );
    setIsSavingStats(false);
  }

  function moveStatUp(index: number) {
    if (index === 0) return;
    setStatsData((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveStatDown(index: number) {
    setStatsData((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Profile Editor</h1>
        <p className="text-muted-foreground text-sm">
          Edit your personal info, about section, and stats
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList variant="line">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Basic profile details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Personal Info</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => updateField('full_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="short_name">
                      Short Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="short_name"
                      value={formData.short_name}
                      onChange={(e) => updateField('short_name', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">
                    Job Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => updateField('job_title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Textarea
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Typewriter Titles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Typewriter Titles</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addArrayItem('typewriter_titles')}
                  >
                    <Plus className="mr-1 size-4" />
                    Add Title
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.typewriter_titles.map((title, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={title}
                        onChange={(e) =>
                          updateArrayItem('typewriter_titles', index, e.target.value)
                        }
                        placeholder={`Title ${index + 1}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeArrayItem('typewriter_titles', index)}
                        disabled={formData.typewriter_titles.length === 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Contact Info</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Social Links</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => updateField('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github_url">GitHub URL</Label>
                    <Input
                      id="github_url"
                      type="url"
                      value={formData.github_url}
                      onChange={(e) => updateField('github_url', e.target.value)}
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer Text */}
              <div className="space-y-2">
                <Label htmlFor="footer_text">Footer Text</Label>
                <Textarea
                  id="footer_text"
                  value={formData.footer_text}
                  onChange={(e) => updateField('footer_text', e.target.value)}
                  rows={2}
                  placeholder="Built with..."
                />
              </div>

              {generalStatus && (
                <p
                  className={
                    generalStatus.type === 'success'
                      ? 'text-success text-sm'
                      : 'text-destructive text-sm'
                  }
                >
                  {generalStatus.message}
                </p>
              )}

              <Button onClick={handleSaveGeneral} disabled={isSavingGeneral}>
                {isSavingGeneral && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isSavingGeneral ? 'Saving...' : 'Save General Info'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About Section</CardTitle>
              <CardDescription>Tell your story and showcase your expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="about_tech_stack">Tech Stack</Label>
                <Textarea
                  id="about_tech_stack"
                  value={formData.about_tech_stack}
                  onChange={(e) => updateField('about_tech_stack', e.target.value)}
                  rows={4}
                  placeholder="Describe your core tech stack..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about_current_focus">Current Focus</Label>
                <Textarea
                  id="about_current_focus"
                  value={formData.about_current_focus}
                  onChange={(e) => updateField('about_current_focus', e.target.value)}
                  rows={3}
                  placeholder="What are you currently focused on?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about_beyond_code">Beyond Code</Label>
                <Textarea
                  id="about_beyond_code"
                  value={formData.about_beyond_code}
                  onChange={(e) => updateField('about_beyond_code', e.target.value)}
                  rows={3}
                  placeholder="What do you do outside of coding?"
                />
              </div>

              <Separator />

              {/* Expertise Highlights */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Expertise Highlights</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addArrayItem('about_expertise')}
                  >
                    <Plus className="mr-1 size-4" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.about_expertise.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateArrayItem('about_expertise', index, e.target.value)}
                        placeholder={`Expertise ${index + 1}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeArrayItem('about_expertise', index)}
                        disabled={formData.about_expertise.length === 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {aboutStatus && (
                <p
                  className={
                    aboutStatus.type === 'success'
                      ? 'text-success text-sm'
                      : 'text-destructive text-sm'
                  }
                >
                  {aboutStatus.message}
                </p>
              )}

              <Button onClick={handleSaveAbout} disabled={isSavingAbout}>
                {isSavingAbout && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isSavingAbout ? 'Saving...' : 'Save About Info'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Stats</CardTitle>
              <CardDescription>
                Quick stats displayed in the about section (e.g. 15+ years, 50+ projects)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  {statsData.length} {statsData.length === 1 ? 'stat' : 'stats'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setStatsData((prev) => [
                      ...prev,
                      {
                        id: crypto.randomUUID(),
                        value: 0,
                        suffix: '+',
                        label: '',
                        sort_order: prev.length,
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 size-4" />
                  Add Stat
                </Button>
              </div>

              {statsData.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No stats yet. Click &quot;Add Stat&quot; to create one.
                </p>
              ) : (
                <div className="space-y-3">
                  {statsData.map((stat, index) => (
                    <div
                      key={stat.id}
                      className="border-border flex items-center gap-3 rounded-lg border p-3"
                    >
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6"
                          onClick={() => moveStatUp(index)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="size-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6"
                          onClick={() => moveStatDown(index)}
                          disabled={index === statsData.length - 1}
                        >
                          <ChevronDown className="size-3" />
                        </Button>
                      </div>

                      {/* Stat fields */}
                      <div className="grid flex-1 gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <Label htmlFor={`stat-value-${stat.id}`} className="text-xs">
                            Value
                          </Label>
                          <Input
                            id={`stat-value-${stat.id}`}
                            type="number"
                            value={stat.value}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setStatsData((prev) =>
                                prev.map((s, i) => (i === index ? { ...s, value: val } : s))
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`stat-suffix-${stat.id}`} className="text-xs">
                            Suffix
                          </Label>
                          <Input
                            id={`stat-suffix-${stat.id}`}
                            value={stat.suffix}
                            onChange={(e) =>
                              setStatsData((prev) =>
                                prev.map((s, i) =>
                                  i === index ? { ...s, suffix: e.target.value } : s
                                )
                              )
                            }
                            placeholder="+"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor={`stat-label-${stat.id}`} className="text-xs">
                            Label
                          </Label>
                          <Input
                            id={`stat-label-${stat.id}`}
                            value={stat.label}
                            onChange={(e) =>
                              setStatsData((prev) =>
                                prev.map((s, i) =>
                                  i === index ? { ...s, label: e.target.value } : s
                                )
                              )
                            }
                            placeholder="Years of experience"
                          />
                        </div>
                      </div>

                      {/* Delete button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setStatsData((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {statsStatus && (
                <p
                  className={
                    statsStatus.type === 'success'
                      ? 'text-success text-sm'
                      : 'text-destructive text-sm'
                  }
                >
                  {statsStatus.message}
                </p>
              )}

              <Button onClick={handleSaveStats} disabled={isSavingStats}>
                {isSavingStats && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isSavingStats ? 'Saving...' : 'Save Stats'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
