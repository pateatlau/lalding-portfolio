'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/actions/admin';
import type { ResumeConfig, ResumeSectionConfig } from '@/lib/supabase/types';
import type {
  ResumeData,
  ResumeStyle,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  SkillGroupItem,
} from '@/components/resume-templates/types';

// Helper: renders resume data to HTML.
// Lazily imports react-dom/server to avoid Turbopack tracing it into the
// module graph (which would fail the build for 'use server' files).
// The Function() constructor creates a scope Turbopack cannot statically analyze.
async function renderToHtml(registryKey: string, data: ResumeData): Promise<string> {
  const { getTemplateComponent } = await import('@/components/resume-templates/registry');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await (Function(
    'return import("react-dom/server")'
  )() as Promise<typeof import('react-dom/server')>);

  const Template = await getTemplateComponent(registryKey);
  if (!Template) throw new Error(`Template not found: ${registryKey}`);

  const markup = renderToStaticMarkup(createElement(Template, { data }));

  // Build Google Fonts import for the configured font family
  const fontFamily = data.style?.fontFamily ?? 'Open Sans, sans-serif';
  const primaryFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  const fontImport = `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(primaryFont)}:wght@400;600;700;800&display=swap');`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${fontImport}
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 0; }
  </style>
</head>
<body>${markup}</body>
</html>`;
}

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
  const adminResult = await requireAdmin();
  if (adminResult.error) throw new Error(adminResult.error);

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
      case 'education': {
        const { data: educations } = await supabase
          .from('educations')
          .select('*')
          .order('sort_order', { ascending: true });

        let items: EducationItem[] = (educations ?? []).map((e) => ({
          institution: e.institution,
          degree: e.degree,
          fieldOfStudy: e.field_of_study,
          displayDate: e.display_date,
          description: e.description,
        }));

        if (sectionConfig.itemIds && sectionConfig.itemIds.length > 0) {
          const idSet = new Set(sectionConfig.itemIds);
          const filtered = (educations ?? []).filter((e) => idSet.has(e.id));
          items = filtered.map((e) => ({
            institution: e.institution,
            degree: e.degree,
            fieldOfStudy: e.field_of_study,
            displayDate: e.display_date,
            description: e.description,
          }));
        }

        sections.push({ type: 'education', label: sectionConfig.label, items });
        break;
      }
      case 'summary':
        // Summary is rendered separately via config.custom_summary — skip here.
        break;
      case 'custom': {
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

// ── previewResumeHtml ──────────────────────────────────────────────

export async function previewResumeHtml(
  configId: string
): Promise<{ data?: { html: string; pageSize: 'A4' | 'Letter' }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  // Fetch config
  const { data: config, error: configError } = await supabase
    .from('resume_configs')
    .select('*')
    .eq('id', configId)
    .single();

  if (configError || !config) {
    return { error: 'Resume config not found' };
  }

  // Fetch template registry key
  let registryKey = 'professional';
  if (config.template_id) {
    const { data: template } = await supabase
      .from('resume_templates')
      .select('registry_key')
      .eq('id', config.template_id)
      .single();
    if (template) registryKey = template.registry_key;
  }

  // Assemble data and render to HTML
  try {
    const resumeData = await assembleResumeData(config as ResumeConfig);
    const html = await renderToHtml(registryKey, resumeData);
    return { data: { html, pageSize: resumeData.pageSize } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate preview';
    console.error('previewResumeHtml error:', message);
    return { error: message };
  }
}

// ── generateResumePdf ──────────────────────────────────────────────

export async function generateResumePdf(
  configId: string
): Promise<{ data?: { versionId: string; path: string }; error?: string }> {
  return Sentry.withServerActionInstrumentation('generateResumePdf', {}, async () => {
    const adminResult = await requireAdmin();
    if (adminResult.error) return { error: adminResult.error };

    const supabase = await createClient();

    // 1. Fetch config
    Sentry.addBreadcrumb({
      category: 'resume-pdf',
      message: 'Fetching config',
      data: { configId },
    });
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
    Sentry.addBreadcrumb({
      category: 'resume-pdf',
      message: 'Assembling resume data',
      data: { registryKey },
    });
    let resumeData: ResumeData;
    try {
      resumeData = await assembleResumeData(config as ResumeConfig);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assemble resume data';
      Sentry.captureException(err);
      console.error('generateResumePdf: assembleResumeData failed:', message);
      return { error: message };
    }

    // 4. Render to HTML
    Sentry.addBreadcrumb({ category: 'resume-pdf', message: 'Rendering HTML' });
    let html: string;
    try {
      html = await renderToHtml(registryKey, resumeData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to render HTML';
      Sentry.captureException(err);
      console.error('generateResumePdf: renderToHtml failed:', message);
      return { error: message };
    }

    // 5. Generate PDF
    Sentry.addBreadcrumb({ category: 'resume-pdf', message: 'Generating PDF via Playwright' });
    const { htmlToPdf, PdfGenerationError } = await import('@/lib/resume-builder/render-to-pdf');
    const startTime = Date.now();
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await htmlToPdf(html, {
        pageSize: resumeData.pageSize,
        margins: resumeData.style.margins,
      });
    } catch (err) {
      if (err instanceof PdfGenerationError) {
        Sentry.captureException(err);
        console.error('generateResumePdf: PDF generation failed:', err.message);
        return { error: err.message };
      }
      throw err;
    }
    const generationTimeMs = Date.now() - startTime;
    Sentry.addBreadcrumb({
      category: 'resume-pdf',
      message: 'PDF generated',
      data: { sizeBytes: pdfBuffer.length, timeMs: generationTimeMs },
    });

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
      // Clean up orphaned PDF from storage
      await supabase.storage.from('resume').remove([storagePath]);
      return { error: 'PDF generated but failed to save version record' };
    }

    revalidatePath('/admin');

    return { data: { versionId, path: storagePath } };
  });
}
