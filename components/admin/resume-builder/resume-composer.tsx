'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronUp, ChevronDown, Loader2, Save } from 'lucide-react';
import { updateResumeConfig } from '@/actions/resume-builder';
import JdOptimizer from './jd-optimizer';
import type {
  ResumeConfig,
  ResumeSectionConfig,
  Education,
  Experience,
  Project,
  SkillGroupWithSkills,
  JdSuggestion,
} from '@/lib/supabase/types';

type ResumeComposerProps = {
  config: ResumeConfig;
  educations: Education[];
  experiences: Experience[];
  projects: Project[];
  skillGroups: SkillGroupWithSkills[];
  llmConfigured: boolean;
  onSaved: (updated: ResumeConfig) => void;
};

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

export default function ResumeComposer({
  config,
  educations,
  experiences,
  projects,
  skillGroups,
  llmConfigured,
  onSaved,
}: ResumeComposerProps) {
  const [sections, setSections] = useState<ResumeSectionConfig[]>(() => {
    // Filter out 'summary' — it's managed separately via customSummary
    const existing = (config.sections as ResumeSectionConfig[]).filter(
      (s) => s.section !== 'summary'
    );
    const knownTypes: Array<{ section: ResumeSectionConfig['section']; label: string }> = [
      { section: 'experience', label: 'Work History' },
      { section: 'education', label: 'Education' },
      { section: 'skills', label: 'Skills' },
      { section: 'projects', label: 'Projects' },
    ];
    const presentTypes = new Set(existing.map((s) => s.section));
    const missing = knownTypes
      .filter((k) => !presentTypes.has(k.section))
      .map((k, i) => ({
        section: k.section,
        label: k.label,
        enabled: true,
        sort_order: existing.length + i,
        itemIds: null,
      }));
    return [...existing, ...missing];
  });
  const [customSummary, setCustomSummary] = useState(config.custom_summary ?? '');
  const [styleOverrides, setStyleOverrides] = useState<Record<string, string>>(() => {
    const ov = (config.style_overrides ?? {}) as Record<string, string>;
    return {
      primaryColor: ov.primaryColor ?? '',
      accentColor: ov.accentColor ?? '',
      fontSize: ov.fontSize ?? '',
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  function toggleSection(index: number) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s)));
  }

  function updateSectionLabel(index: number, label: string) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, label } : s)));
  }

  function moveSection(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, sort_order: i }));
    });
  }

  function toggleItem(sectionIndex: number, itemId: string) {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        const current = s.itemIds ?? [];
        const next = current.includes(itemId)
          ? current.filter((id) => id !== itemId)
          : [...current, itemId];
        return { ...s, itemIds: next.length > 0 ? next : null };
      })
    );
  }

  function getItemsForSection(section: ResumeSectionConfig) {
    switch (section.section) {
      case 'education':
        return educations.map((e) => ({
          id: e.id,
          label: `${e.degree} — ${e.institution}`,
        }));
      case 'experience':
        return experiences.map((e) => ({ id: e.id, label: `${e.title} — ${e.company}` }));
      case 'projects':
        return projects.map((p) => ({ id: p.id, label: p.title }));
      case 'skills':
        return skillGroups.map((g) => ({
          id: g.id,
          label: `${g.category} (${g.skills.length} skills)`,
        }));
      default:
        return [];
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setStatus(null);

    // Build style overrides (only non-empty values)
    const overrides: Record<string, string> = {};
    if (styleOverrides.primaryColor) overrides.primaryColor = styleOverrides.primaryColor;
    if (styleOverrides.accentColor) overrides.accentColor = styleOverrides.accentColor;
    if (styleOverrides.fontSize) overrides.fontSize = styleOverrides.fontSize;

    const result = await updateResumeConfig(config.id, {
      sections: sections as ResumeSectionConfig[],
      custom_summary: customSummary || null,
      style_overrides: overrides,
    });

    setIsSaving(false);

    if (result.error) {
      setStatus({ type: 'error', message: result.error });
      return;
    }

    if (result.data) {
      onSaved(result.data);
      setStatus({ type: 'success', message: 'Config saved' });
    }
  }

  function handleSuggestionsApplied(suggestions: JdSuggestion[]) {
    setSections((prev) => {
      const next = [...prev];
      for (const suggestion of suggestions) {
        // Map suggestion type to section type
        let sectionType: ResumeSectionConfig['section'] | null = null;
        switch (suggestion.type) {
          case 'include_experience':
            sectionType = 'experience';
            break;
          case 'include_project':
            sectionType = 'projects';
            break;
          case 'include_skill_group':
            sectionType = 'skills';
            break;
          case 'emphasize':
            // For emphasize, find which section has this item
            for (const s of next) {
              const items = getItemsForSection(s);
              if (items.some((item) => item.id === suggestion.itemId)) {
                sectionType = s.section;
                break;
              }
            }
            break;
        }
        if (!sectionType) continue;

        const sectionIdx = next.findIndex((s) => s.section === sectionType);
        if (sectionIdx === -1) continue;

        const section = next[sectionIdx];

        // Enable the section if it's disabled
        if (!section.enabled) {
          next[sectionIdx] = { ...section, enabled: true };
        }

        // Add the item to the section's itemIds if not already included
        const currentIds = next[sectionIdx].itemIds ?? [];
        if (!currentIds.includes(suggestion.itemId)) {
          next[sectionIdx] = {
            ...next[sectionIdx],
            itemIds: [...currentIds, suggestion.itemId],
          };
        }
      }
      return next;
    });
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{config.name}</h2>
          {config.description && (
            <p className="text-muted-foreground text-sm">{config.description}</p>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <Save className="mr-1 size-4" />
          )}
          Save
        </Button>
      </div>

      {status && (
        <p
          className={`text-sm ${status.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
        >
          {status.message}
        </p>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Professional Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={customSummary}
            onChange={(e) => setCustomSummary(e.target.value)}
            placeholder="Write a professional summary for this resume..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Sections</h3>
        {sections.map((section, index) => {
          const items = getItemsForSection(section);
          const selectedIds = section.itemIds ?? [];

          return (
            <Card key={section.section} className={!section.enabled ? 'opacity-50' : ''}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={() => toggleSection(index)}
                      aria-label={`Toggle ${section.label} section`}
                      className="size-4"
                    />
                    <Input
                      value={section.label}
                      onChange={(e) => updateSectionLabel(index, e.target.value)}
                      className="h-8 w-48 text-sm font-medium"
                    />
                    <span className="text-muted-foreground text-xs uppercase">
                      {section.section}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {section.enabled && items.length > 0 && (
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-2 text-xs">
                    {selectedIds.length === 0
                      ? 'All items included (no filter)'
                      : `${selectedIds.length} of ${items.length} selected`}
                  </p>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {items.map((item) => (
                      <label
                        key={item.id}
                        className="hover:bg-muted flex items-center gap-2 rounded px-2 py-1 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleItem(index, item.id)}
                          className="size-3.5"
                        />
                        <span className="truncate">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* JD Optimization */}
      {llmConfigured && (
        <JdOptimizer
          configId={config.id}
          initialJobDescription={config.job_description}
          initialKeywords={config.jd_keywords}
          initialCoverageScore={config.jd_coverage_score}
          initialAnalysis={config.jd_analysis}
          onSuggestionsApplied={handleSuggestionsApplied}
        />
      )}

      {/* Style Overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Style Overrides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="style-primary">Primary Color</Label>
              <Input
                id="style-primary"
                value={styleOverrides.primaryColor}
                onChange={(e) => setStyleOverrides((s) => ({ ...s, primaryColor: e.target.value }))}
                placeholder="#1a1a1a"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style-accent">Accent Color</Label>
              <Input
                id="style-accent"
                value={styleOverrides.accentColor}
                onChange={(e) => setStyleOverrides((s) => ({ ...s, accentColor: e.target.value }))}
                placeholder="#2bbcb3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style-font-size">Font Size</Label>
              <Input
                id="style-font-size"
                value={styleOverrides.fontSize}
                onChange={(e) => setStyleOverrides((s) => ({ ...s, fontSize: e.target.value }))}
                placeholder="10pt"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
