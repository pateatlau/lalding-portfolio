'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, deleteStorageFile } from '@/actions/admin';
import type { ResumeConfig, ResumeConfigInsert, ResumeTemplateInsert } from '@/lib/supabase/types';

// ── Resume Config CRUD ─────────────────────────────────────────────

export type ResumeConfigListItem = {
  id: string;
  name: string;
  description: string | null;
  template_id: string | null;
  templateName: string | null;
  is_active: boolean;
  updated_at: string;
};

export async function getResumeConfigs(): Promise<{
  data?: ResumeConfigListItem[];
  error?: string;
}> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  const { data: configs, error } = await supabase
    .from('resume_configs')
    .select('id, name, description, template_id, is_active, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('getResumeConfigs error:', error.message);
    return { error: 'Failed to load resume configs' };
  }

  // Fetch template names
  const templateIds = Array.from(
    new Set((configs ?? []).map((c) => c.template_id).filter(Boolean) as string[])
  );

  let templateMap = new Map<string, string>();
  if (templateIds.length > 0) {
    const { data: templates } = await supabase
      .from('resume_templates')
      .select('id, name')
      .in('id', templateIds);
    templateMap = new Map((templates ?? []).map((t) => [t.id, t.name]));
  }

  return {
    data: (configs ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      template_id: c.template_id ?? null,
      templateName: c.template_id ? (templateMap.get(c.template_id) ?? null) : null,
      is_active: c.is_active,
      updated_at: c.updated_at,
    })),
  };
}

export async function getResumeConfig(
  id: string
): Promise<{ data?: ResumeConfig; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  const { data, error } = await supabase.from('resume_configs').select('*').eq('id', id).single();

  if (error) {
    console.error('getResumeConfig error:', error.message);
    return { error: 'Resume config not found' };
  }

  return { data: data as ResumeConfig };
}

export async function createResumeConfig(
  data: ResumeConfigInsert
): Promise<{ data?: ResumeConfig; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from('resume_configs')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('createResumeConfig error:', error.message);
    return { error: 'Failed to create resume config' };
  }

  revalidatePath('/admin');
  return { data: created as ResumeConfig };
}

export async function updateResumeConfig(
  id: string,
  data: Partial<ResumeConfigInsert>
): Promise<{ data?: ResumeConfig; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('resume_configs')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateResumeConfig error:', error.message);
    return { error: 'Failed to update resume config' };
  }

  revalidatePath('/admin');
  return { data: updated as ResumeConfig };
}

export async function deleteResumeConfig(
  id: string
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  // Fetch associated versions to get storage paths before deleting
  const { data: versions } = await supabase
    .from('resume_versions')
    .select('id, pdf_storage_path')
    .eq('config_id', id);

  // Delete config row first (cascade removes version rows)
  const { error } = await supabase.from('resume_configs').delete().eq('id', id);

  if (error) {
    console.error('deleteResumeConfig error:', error.message);
    return { error: 'Failed to delete resume config' };
  }

  // Clean up storage files after successful DB deletion (log errors but don't block)
  if (versions && versions.length > 0) {
    for (const version of versions) {
      const result = await deleteStorageFile('resume', version.pdf_storage_path);
      if (result.error) {
        console.error(
          `deleteResumeConfig: failed to delete storage file ${version.pdf_storage_path}:`,
          result.error
        );
      }
    }
  }

  revalidatePath('/admin');
  return { data: { success: true } };
}

// ── Resume Version Actions ─────────────────────────────────────────

export type ResumeVersionListItem = {
  id: string;
  config_id: string;
  pdf_storage_path: string;
  pdf_file_size: number | null;
  page_count: number | null;
  generation_time_ms: number | null;
  is_active: boolean;
  created_at: string;
};

export async function getResumeVersions(
  configId: string
): Promise<{ data?: ResumeVersionListItem[]; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('resume_versions')
    .select(
      'id, config_id, pdf_storage_path, pdf_file_size, page_count, generation_time_ms, is_active, created_at'
    )
    .eq('config_id', configId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getResumeVersions error:', error.message);
    return { error: 'Failed to load resume versions' };
  }

  return { data: data ?? [] };
}

export async function activateResumeVersion(
  versionId: string
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  // Find the currently active version (if any) to allow rollback
  const { data: previouslyActive } = await supabase
    .from('resume_versions')
    .select('id')
    .eq('is_active', true)
    .maybeSingle();

  // Deactivate any currently active version
  const { error: deactivateError } = await supabase
    .from('resume_versions')
    .update({ is_active: false })
    .eq('is_active', true);

  if (deactivateError) {
    console.error('activateResumeVersion: deactivate error:', deactivateError.message);
    return { error: 'Failed to deactivate current version' };
  }

  // Activate the requested version
  const { data: version, error: activateError } = await supabase
    .from('resume_versions')
    .update({ is_active: true })
    .eq('id', versionId)
    .select('pdf_storage_path')
    .single();

  if (activateError || !version) {
    console.error('activateResumeVersion error:', activateError?.message);
    // Roll back: reactivate the previously active version
    if (previouslyActive) {
      await supabase
        .from('resume_versions')
        .update({ is_active: true })
        .eq('id', previouslyActive.id);
    }
    return { error: 'Failed to activate resume version' };
  }

  // Update profile.resume_url to point to this version's PDF
  const { error: profileError } = await supabase
    .from('profile')
    .update({ resume_url: version.pdf_storage_path })
    .eq('singleton', true);

  if (profileError) {
    console.error('activateResumeVersion: profile update error:', profileError.message);
    // Roll back: deactivate the newly activated version, reactivate previous
    await supabase.from('resume_versions').update({ is_active: false }).eq('id', versionId);
    if (previouslyActive) {
      await supabase
        .from('resume_versions')
        .update({ is_active: true })
        .eq('id', previouslyActive.id);
    }
    return { error: 'Version activated but failed to update profile resume URL' };
  }

  revalidatePath('/');
  revalidatePath('/admin');
  return { data: { success: true } };
}

export async function deleteResumeVersion(
  id: string
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  // Fetch version to get storage path
  const { data: version, error: fetchError } = await supabase
    .from('resume_versions')
    .select('pdf_storage_path, is_active')
    .eq('id', id)
    .single();

  if (fetchError || !version) {
    console.error('deleteResumeVersion: fetch error:', fetchError?.message);
    return { error: 'Resume version not found' };
  }

  if (version.is_active) {
    return { error: 'Cannot delete the active resume version. Deactivate it first.' };
  }

  // Delete version row first, then clean up storage
  const { error } = await supabase.from('resume_versions').delete().eq('id', id);

  if (error) {
    console.error('deleteResumeVersion error:', error.message);
    return { error: 'Failed to delete resume version' };
  }

  // Clean up storage file after successful DB deletion (log errors but don't block)
  const storageResult = await deleteStorageFile('resume', version.pdf_storage_path);
  if (storageResult.error) {
    console.error(
      `deleteResumeVersion: storage cleanup failed for ${version.pdf_storage_path}:`,
      storageResult.error
    );
  }

  revalidatePath('/admin');
  return { data: { success: true } };
}

// ── Resume Version Download ───────────────────────────────────────

export async function getResumeVersionDownloadUrl(
  storagePath: string
): Promise<{ data?: string; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  const { data, error } = await supabase.storage.from('resume').createSignedUrl(storagePath, 60); // 60 seconds expiry

  if (error || !data?.signedUrl) {
    console.error('getResumeVersionDownloadUrl error:', error?.message);
    return { error: 'Failed to generate download URL' };
  }

  return { data: data.signedUrl };
}

// ── Resume Template Actions ────────────────────────────────────────

export type TemplateListItem = {
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

export async function getResumeTemplates(): Promise<{
  data?: TemplateListItem[];
  error?: string;
}> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('resume_templates')
    .select(
      'id, registry_key, name, description, is_builtin, page_size, columns, style_config, sort_order'
    )
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('getResumeTemplates error:', error.message);
    return { error: 'Failed to load resume templates' };
  }

  return { data: (data ?? []) as typeof data & { style_config: Record<string, unknown> }[] };
}

export async function updateResumeTemplate(
  id: string,
  data: Partial<ResumeTemplateInsert>
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from('resume_templates')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('updateResumeTemplate error:', error.message);
    return { error: 'Failed to update resume template' };
  }

  revalidatePath('/admin');
  return { data: { success: true } };
}
