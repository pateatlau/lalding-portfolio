'use server';

import { revalidatePath } from 'next/cache';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/actions/admin';
import { getTemplateComponent } from '@/components/resume-templates/registry';
import { htmlToPdf } from '@/lib/resume-builder/render-to-pdf';
import type { ResumeConfig, ResumeSectionConfig } from '@/lib/supabase/types';
import type {
  ResumeData,
  ResumeStyle,
  ExperienceItem,
  ProjectItem,
  SkillGroupItem,
} from '@/components/resume-templates/types';

const DEFAULT_STYLE: ResumeStyle = {
  primaryColor: '#1a1a1a',
  accentColor: '#2bbcb3',
  fontFamily: 'Open Sans, sans-serif',
  headingFontFamily: 'Open Sans, sans-serif',
  fontSize: '10pt',
  lineHeight: '1.4',
  margins: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
};

// ── assembleResumeData ─────────────────────────────────────────────

export async function assembleResumeData(config: ResumeConfig): Promise<ResumeData> {
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase.from('profile').select('*').single();
  if (!profile) throw new Error('Profile not found');

  // Fetch template style
  let style: ResumeStyle = { ...DEFAULT_STYLE };
  let pageSize: 'A4' | 'Letter' = 'A4';

  if (config.template_id) {
    const { data: template } = await supabase
      .from('resume_templates')
      .select('*')
      .eq('id', config.template_id)
      .single();
    if (template) {
      const sc = template.style_config as Record<string, unknown>;
      style = {
        primaryColor: (sc.primaryColor as string) ?? DEFAULT_STYLE.primaryColor,
        accentColor: (sc.accentColor as string) ?? DEFAULT_STYLE.accentColor,
        fontFamily: (sc.fontFamily as string) ?? DEFAULT_STYLE.fontFamily,
        headingFontFamily: (sc.headingFontFamily as string) ?? DEFAULT_STYLE.headingFontFamily,
        fontSize: (sc.fontSize as string) ?? DEFAULT_STYLE.fontSize,
        lineHeight: (sc.lineHeight as string) ?? DEFAULT_STYLE.lineHeight,
        margins: (sc.margins as ResumeStyle['margins']) ?? DEFAULT_STYLE.margins,
      };
      pageSize = (template.page_size as 'A4' | 'Letter') ?? 'A4';
    }
  }

  // Apply style overrides from config
  if (config.style_overrides && Object.keys(config.style_overrides).length > 0) {
    const ov = config.style_overrides as Partial<ResumeStyle>;
    style = { ...style, ...ov };
  }

  // Build sections from config
  const enabledSections = (config.sections as ResumeSectionConfig[])
    .filter((s) => s.enabled)
    .sort((a, b) => a.sort_order - b.sort_order);

  const sections: ResumeData['sections'] = [];

  for (const sectionConfig of enabledSections) {
    switch (sectionConfig.section) {
      case 'experience': {
        const { data: experiences } = await supabase
          .from('experiences')
          .select('*')
          .order('sort_order', { ascending: true });

        let items: ExperienceItem[] = (experiences ?? []).map((e) => ({
          title: e.title,
          company: `${e.company}`,
          displayDate: e.display_date,
          description: e.description,
        }));

        // Filter by itemIds if specified
        if (sectionConfig.itemIds && sectionConfig.itemIds.length > 0) {
          const idSet = new Set(sectionConfig.itemIds);
          const filtered = (experiences ?? []).filter((e) => idSet.has(e.id));
          items = filtered.map((e) => ({
            title: e.title,
            company: `${e.company}`,
            displayDate: e.display_date,
            description: e.description,
          }));
        }

        sections.push({ type: 'experience', label: sectionConfig.label, items });
        break;
      }
      case 'projects': {
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .order('sort_order', { ascending: true });

        let items: ProjectItem[] = (projects ?? []).map((p) => ({
          title: p.title,
          description: p.description,
          tags: p.tags,
          sourceCodeUrl: p.source_code_url,
          liveSiteUrl: p.live_site_url,
        }));

        if (sectionConfig.itemIds && sectionConfig.itemIds.length > 0) {
          const idSet = new Set(sectionConfig.itemIds);
          const filtered = (projects ?? []).filter((p) => idSet.has(p.id));
          items = filtered.map((p) => ({
            title: p.title,
            description: p.description,
            tags: p.tags,
            sourceCodeUrl: p.source_code_url,
            liveSiteUrl: p.live_site_url,
          }));
        }

        sections.push({ type: 'projects', label: sectionConfig.label, items });
        break;
      }
      case 'skills': {
        const { data: groups } = await supabase
          .from('skill_groups')
          .select('*')
          .order('sort_order', { ascending: true });
        const { data: skills } = await supabase
          .from('skills')
          .select('*')
          .order('sort_order', { ascending: true });

        let filteredGroups = groups ?? [];
        if (sectionConfig.itemIds && sectionConfig.itemIds.length > 0) {
          const idSet = new Set(sectionConfig.itemIds);
          filteredGroups = filteredGroups.filter((g) => idSet.has(g.id));
        }

        const items: SkillGroupItem[] = filteredGroups.map((g) => ({
          category: g.category,
          skills: (skills ?? []).filter((s) => s.group_id === g.id).map((s) => s.name),
        }));

        sections.push({ type: 'skills', label: sectionConfig.label, items });
        break;
      }
      case 'custom': {
        // Custom sections store content directly — no CMS fetch needed.
        // Items are stored inline in the section config itself.
        sections.push({
          type: 'custom',
          label: sectionConfig.label,
          items: [],
        });
        break;
      }
    }
  }

  return {
    profile: {
      fullName: profile.full_name,
      jobTitle: profile.job_title,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      websiteUrl: profile.website_url,
      linkedinUrl: profile.linkedin_url,
      githubUrl: profile.github_url,
    },
    summary: config.custom_summary,
    sections,
    style,
    pageSize,
  };
}

// ── renderTemplateToHtml ───────────────────────────────────────────

export async function renderTemplateToHtml(registryKey: string, data: ResumeData): Promise<string> {
  const Template = await getTemplateComponent(registryKey);
  if (!Template) throw new Error(`Template not found: ${registryKey}`);

  const markup = renderToStaticMarkup(createElement(Template, { data }));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 0; }
  </style>
</head>
<body>${markup}</body>
</html>`;
}

// ── generateResumePdf ──────────────────────────────────────────────

export async function generateResumePdf(
  configId: string
): Promise<{ data?: { versionId: string; path: string }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  // 1. Fetch config
  const { data: config, error: configError } = await supabase
    .from('resume_configs')
    .select('*')
    .eq('id', configId)
    .single();

  if (configError || !config) {
    console.error('generateResumePdf: config fetch failed:', configError?.message);
    return { error: 'Resume config not found' };
  }

  // 2. Fetch template registry key
  let registryKey = 'professional'; // default
  if (config.template_id) {
    const { data: template } = await supabase
      .from('resume_templates')
      .select('registry_key')
      .eq('id', config.template_id)
      .single();
    if (template) registryKey = template.registry_key;
  }

  // 3. Assemble data
  const resumeData = await assembleResumeData(config as ResumeConfig);

  // 4. Render to HTML
  const html = await renderTemplateToHtml(registryKey, resumeData);

  // 5. Generate PDF
  const startTime = Date.now();
  const pdfBuffer = await htmlToPdf(html, {
    pageSize: resumeData.pageSize,
    margins: resumeData.style.margins,
  });
  const generationTimeMs = Date.now() - startTime;

  // 6. Upload to storage
  const versionId = crypto.randomUUID();
  const storagePath = `generated/${configId}/${versionId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('resume')
    .upload(storagePath, pdfBuffer, { contentType: 'application/pdf' });

  if (uploadError) {
    console.error('generateResumePdf: upload failed:', uploadError.message);
    return { error: 'Failed to upload generated PDF' };
  }

  // 7. Insert version row
  const { error: insertError } = await supabase.from('resume_versions').insert({
    id: versionId,
    config_id: configId,
    template_id: config.template_id,
    config_snapshot: resumeData as unknown as Record<string, unknown>,
    pdf_storage_path: storagePath,
    pdf_file_size: pdfBuffer.length,
    generation_time_ms: generationTimeMs,
    is_active: false,
  });

  if (insertError) {
    console.error('generateResumePdf: version insert failed:', insertError.message);
    return { error: 'PDF generated but failed to save version record' };
  }

  revalidatePath('/admin');

  return { data: { versionId, path: storagePath } };
}
