'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { updateResumeTemplate } from '@/actions/resume-builder';

type TemplateListItem = {
  id: string;
  registry_key: string;
  name: string;
  description: string | null;
  is_builtin: boolean;
  page_size: string;
  columns: number;
  style_config: Record<string, unknown>;
  sort_order: number;
};

type TemplateManagerProps = {
  templates: TemplateListItem[];
  onTemplatesChanged: (templates: TemplateListItem[]) => void;
};

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

const DEFAULT_STYLE_CONFIG: Record<string, unknown> = {
  primaryColor: '#1a1a1a',
  accentColor: '#2bbcb3',
  fontFamily: 'Open Sans, sans-serif',
  headingFontFamily: 'Open Sans, sans-serif',
  fontSize: '10pt',
  lineHeight: '1.4',
  margins: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
};

export default function TemplateManager({ templates, onTemplatesChanged }: TemplateManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    templates.length > 0 ? templates[0].id : null
  );
  const [editedStyles, setEditedStyles] = useState<Record<string, Record<string, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null;

  function getStyleValue(template: TemplateListItem, key: string): string {
    return (editedStyles[template.id]?.[key] ??
      (template.style_config[key] as string) ??
      '') as string;
  }

  function setStyleValue(templateId: string, key: string, value: string) {
    setEditedStyles((prev) => ({
      ...prev,
      [templateId]: { ...prev[templateId], [key]: value },
    }));
  }

  function getMarginsValue(template: TemplateListItem, side: string): string {
    const edited = editedStyles[template.id]?.[`margin_${side}`];
    if (edited !== undefined) return edited;
    const margins = template.style_config.margins as Record<string, string> | undefined;
    return margins?.[side] ?? '0.75in';
  }

  function setMarginValue(templateId: string, side: string, value: string) {
    setEditedStyles((prev) => ({
      ...prev,
      [templateId]: { ...prev[templateId], [`margin_${side}`]: value },
    }));
  }

  async function handleSave() {
    if (!selectedTemplate) return;
    setIsSaving(true);
    setStatus(null);

    const edits = editedStyles[selectedTemplate.id] ?? {};
    const currentStyle = { ...selectedTemplate.style_config };

    // Apply simple style values
    for (const key of [
      'primaryColor',
      'accentColor',
      'fontFamily',
      'headingFontFamily',
      'fontSize',
      'lineHeight',
    ]) {
      if (edits[key] !== undefined) {
        currentStyle[key] = edits[key];
      }
    }

    // Apply margin edits
    const margins = { ...(currentStyle.margins as Record<string, string>) };
    for (const side of ['top', 'right', 'bottom', 'left']) {
      if (edits[`margin_${side}`] !== undefined) {
        margins[side] = edits[`margin_${side}`];
      }
    }
    currentStyle.margins = margins;

    const result = await updateResumeTemplate(selectedTemplate.id, {
      style_config: currentStyle,
    });

    setIsSaving(false);

    if (result.error) {
      setStatus({ type: 'error', message: result.error });
      return;
    }

    // Update local state
    onTemplatesChanged(
      templates.map((t) =>
        t.id === selectedTemplate.id ? { ...t, style_config: currentStyle } : t
      )
    );
    setEditedStyles((prev) => {
      const next = { ...prev };
      delete next[selectedTemplate.id];
      return next;
    });
    setStatus({ type: 'success', message: 'Template styles saved' });
  }

  function handleReset() {
    if (!selectedTemplate) return;
    onTemplatesChanged(
      templates.map((t) =>
        t.id === selectedTemplate.id ? { ...t, style_config: { ...DEFAULT_STYLE_CONFIG } } : t
      )
    );
    setEditedStyles((prev) => {
      const next = { ...prev };
      delete next[selectedTemplate.id];
      return next;
    });
    setStatus({ type: 'success', message: 'Reset to defaults (save to persist)' });
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Template grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-shadow ${selectedId === template.id ? 'ring-primary ring-2' : 'hover:shadow-md'}`}
            onClick={() => setSelectedId(template.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <div className="flex gap-1">
                  {template.is_builtin && (
                    <Badge variant="secondary" className="text-xs">
                      Built-in
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {template.page_size}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {template.description ?? 'No description'}
              </p>
              <div className="mt-2 flex gap-2">
                <div
                  className="size-5 rounded border"
                  style={{
                    backgroundColor: (template.style_config.accentColor as string) ?? '#2bbcb3',
                  }}
                  title="Accent color"
                />
                <div
                  className="size-5 rounded border"
                  style={{
                    backgroundColor: (template.style_config.primaryColor as string) ?? '#1a1a1a',
                  }}
                  title="Primary color"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <p className="text-muted-foreground py-12 text-center">No templates available.</p>
      )}

      {/* Style editor */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Style Editor — {selectedTemplate.name}</CardTitle>
              <div className="flex gap-2">
                {selectedTemplate.is_builtin && (
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="mr-1 size-4" />
                    Reset to Defaults
                  </Button>
                )}
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-1 size-4" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {status && (
              <p
                className={`text-sm ${status.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
              >
                {status.message}
              </p>
            )}

            {/* Colors */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Colors</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={getStyleValue(selectedTemplate, 'primaryColor') || '#1a1a1a'}
                      onChange={(e) =>
                        setStyleValue(selectedTemplate.id, 'primaryColor', e.target.value)
                      }
                      className="size-8 cursor-pointer rounded border"
                    />
                    <Input
                      value={getStyleValue(selectedTemplate, 'primaryColor')}
                      onChange={(e) =>
                        setStyleValue(selectedTemplate.id, 'primaryColor', e.target.value)
                      }
                      placeholder="#1a1a1a"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={getStyleValue(selectedTemplate, 'accentColor') || '#2bbcb3'}
                      onChange={(e) =>
                        setStyleValue(selectedTemplate.id, 'accentColor', e.target.value)
                      }
                      className="size-8 cursor-pointer rounded border"
                    />
                    <Input
                      value={getStyleValue(selectedTemplate, 'accentColor')}
                      onChange={(e) =>
                        setStyleValue(selectedTemplate.id, 'accentColor', e.target.value)
                      }
                      placeholder="#2bbcb3"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Typography</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Input
                    value={getStyleValue(selectedTemplate, 'fontFamily')}
                    onChange={(e) =>
                      setStyleValue(selectedTemplate.id, 'fontFamily', e.target.value)
                    }
                    placeholder="Open Sans, sans-serif"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Input
                    value={getStyleValue(selectedTemplate, 'fontSize')}
                    onChange={(e) => setStyleValue(selectedTemplate.id, 'fontSize', e.target.value)}
                    placeholder="10pt"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Line Height</Label>
                  <Input
                    value={getStyleValue(selectedTemplate, 'lineHeight')}
                    onChange={(e) =>
                      setStyleValue(selectedTemplate.id, 'lineHeight', e.target.value)
                    }
                    placeholder="1.4"
                  />
                </div>
              </div>
            </div>

            {/* Margins */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Margins</h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                  <div key={side} className="space-y-2">
                    <Label className="capitalize">{side}</Label>
                    <Input
                      value={getMarginsValue(selectedTemplate, side)}
                      onChange={(e) => setMarginValue(selectedTemplate.id, side, e.target.value)}
                      placeholder="0.75in"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
