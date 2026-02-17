'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type {
  ProfileInsert,
  ProfileStatInsert,
  Experience,
  ExperienceInsert,
  Project,
  ProjectInsert,
  SkillGroup,
  SkillGroupInsert,
  Skill,
  SkillInsert,
} from '@/lib/supabase/types';

type AdminResult = { user: User; error?: undefined } | { user?: undefined; error: string };

export async function requireAdmin(): Promise<AdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  if (user.app_metadata?.role !== 'admin') {
    return { error: 'Not authorized — admin role required' };
  }

  return { user };
}

export type AdminStats = {
  totalVisitors: number;
  totalDownloads: number;
  recentDownloads: number;
  recentDownloadsList: Array<{
    id: string;
    downloadedAt: string;
    visitorName: string | null;
    visitorEmail: string | null;
    visitorCompany: string | null;
  }>;
};

export async function getAdminStats(): Promise<{
  data?: AdminStats;
  error?: string;
}> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  const [visitorsResult, totalDownloadsResult, recentDownloadsResult, downloadsListResult] =
    await Promise.all([
      supabase.from('visitor_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('resume_downloads').select('*', { count: 'exact', head: true }),
      supabase
        .from('resume_downloads')
        .select('*', { count: 'exact', head: true })
        .gte('downloaded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('resume_downloads')
        .select('id, downloaded_at, visitor_id')
        .order('downloaded_at', { ascending: false })
        .limit(10),
    ]);

  // Check for query errors
  if (visitorsResult.error) {
    console.error('getAdminStats: visitor_profiles query failed:', visitorsResult.error.message);
    return { error: 'Failed to load visitor stats' };
  }
  if (totalDownloadsResult.error) {
    console.error(
      'getAdminStats: total downloads query failed:',
      totalDownloadsResult.error.message
    );
    return { error: 'Failed to load download stats' };
  }
  if (recentDownloadsResult.error) {
    console.error(
      'getAdminStats: recent downloads query failed:',
      recentDownloadsResult.error.message
    );
    return { error: 'Failed to load recent download stats' };
  }
  if (downloadsListResult.error) {
    console.error('getAdminStats: downloads list query failed:', downloadsListResult.error.message);
    return { error: 'Failed to load downloads list' };
  }

  // Fetch visitor info for recent downloads
  let recentDownloadsList: AdminStats['recentDownloadsList'] = [];
  const downloads = downloadsListResult.data;

  if (downloads && downloads.length > 0) {
    const visitorIds = Array.from(
      new Set(downloads.map((d) => d.visitor_id).filter(Boolean) as string[])
    );

    const { data: visitors } =
      visitorIds.length > 0
        ? await supabase
            .from('visitor_profiles')
            .select('id, full_name, email, company')
            .in('id', visitorIds)
        : { data: [] };

    const visitorMap = new Map(visitors?.map((v) => [v.id, v]) ?? []);

    recentDownloadsList = downloads.map((d) => {
      const visitor = d.visitor_id ? visitorMap.get(d.visitor_id) : null;
      return {
        id: d.id,
        downloadedAt: d.downloaded_at,
        visitorName: visitor?.full_name ?? null,
        visitorEmail: visitor?.email ?? null,
        visitorCompany: visitor?.company ?? null,
      };
    });
  }

  return {
    data: {
      totalVisitors: visitorsResult.count ?? 0,
      totalDownloads: totalDownloadsResult.count ?? 0,
      recentDownloads: recentDownloadsResult.count ?? 0,
      recentDownloadsList,
    },
  };
}

export async function updateProfile(
  data: Partial<ProfileInsert>
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  const { error: updateError } = await supabase.from('profile').update(data).eq('singleton', true);

  if (updateError) {
    console.error('updateProfile error:', updateError.message);
    return { error: 'Failed to update profile' };
  }

  revalidatePath('/');

  return { data: { success: true } };
}

export async function updateProfileStats(
  stats: ProfileStatInsert[]
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  // Bulk replace: delete all existing stats, then insert new ones.
  // Wrapped so that failures at any step return a clear error.
  try {
    const { error: deleteError } = await supabase
      .from('profile_stats')
      .delete()
      .gte('sort_order', 0);

    if (deleteError) {
      console.error('updateProfileStats delete error:', deleteError.message);
      return { error: 'Failed to update stats' };
    }

    if (stats.length > 0) {
      const { error: insertError } = await supabase.from('profile_stats').insert(stats);

      if (insertError) {
        console.error('updateProfileStats insert error:', insertError.message);
        return { error: 'Failed to save new stats (previous stats were cleared)' };
      }
    }
  } catch (err) {
    console.error('updateProfileStats unexpected error:', err);
    return { error: 'An unexpected error occurred while updating stats' };
  }

  revalidatePath('/');

  return { data: { success: true } };
}

export async function createExperience(
  data: ExperienceInsert
): Promise<{ data?: Experience; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  const { data: created, error: insertError } = await supabase
    .from('experiences')
    .insert(data)
    .select()
    .single();

  if (insertError) {
    console.error('createExperience error:', insertError.message);
    return { error: 'Failed to create experience' };
  }

  revalidatePath('/');

  return { data: created };
}

export async function updateExperience(
  id: string,
  data: Partial<ExperienceInsert>
): Promise<{ data?: Experience; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  const { data: updated, error: updateError } = await supabase
    .from('experiences')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('updateExperience error:', updateError.message);
    return { error: 'Failed to update experience' };
  }

  revalidatePath('/');

  return { data: updated };
}

export async function deleteExperience(
  id: string
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase.from('experiences').delete().eq('id', id);

  if (deleteError) {
    console.error('deleteExperience error:', deleteError.message);
    return { error: 'Failed to delete experience' };
  }

  revalidatePath('/');

  return { data: { success: true } };
}

export async function reorderExperiences(
  orderedIds: string[]
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  const updates = orderedIds.map((id, index) =>
    supabase.from('experiences').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);

  if (failed?.error) {
    console.error('reorderExperiences error:', failed.error.message);
    return { error: 'Failed to reorder experiences' };
  }

  revalidatePath('/');

  return { data: { success: true } };
}

export async function createProject(
  data: ProjectInsert
): Promise<{ data?: Project; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  const { data: created, error: insertError } = await supabase
    .from('projects')
    .insert(data)
    .select()
    .single();

  if (insertError) {
    console.error('createProject error:', insertError.message);
    return { error: 'Failed to create project' };
  }

  revalidatePath('/');

  return { data: created };
}

export async function updateProject(
  id: string,
  data: Partial<ProjectInsert>
): Promise<{ data?: Project; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  const { data: updated, error: updateError } = await supabase
    .from('projects')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('updateProject error:', updateError.message);
    return { error: 'Failed to update project' };
  }

  revalidatePath('/');

  return { data: updated };
}

export async function deleteProject(
  id: string
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase.from('projects').delete().eq('id', id);

  if (deleteError) {
    console.error('deleteProject error:', deleteError.message);
    return { error: 'Failed to delete project' };
  }

  revalidatePath('/');

  return { data: { success: true } };
}

export async function reorderProjects(
  orderedIds: string[]
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) {
    return { error: adminResult.error };
  }

  const supabase = await createClient();

  const updates = orderedIds.map((id, index) =>
    supabase.from('projects').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);

  if (failed?.error) {
    console.error('reorderProjects error:', failed.error.message);
    return { error: 'Failed to reorder projects' };
  }

  revalidatePath('/');

  return { data: { success: true } };
}

// --- Skill Group Actions ---

export async function createSkillGroup(
  data: SkillGroupInsert
): Promise<{ data?: SkillGroup; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from('skill_groups')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('createSkillGroup error:', error.message);
    return { error: 'Failed to create skill group' };
  }

  revalidatePath('/');
  return { data: created };
}

export async function updateSkillGroup(
  id: string,
  data: Partial<SkillGroupInsert>
): Promise<{ data?: SkillGroup; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from('skill_groups')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateSkillGroup error:', error.message);
    return { error: 'Failed to update skill group' };
  }

  revalidatePath('/');
  return { data: updated };
}

export async function deleteSkillGroup(
  id: string
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();
  const { error } = await supabase.from('skill_groups').delete().eq('id', id);

  if (error) {
    console.error('deleteSkillGroup error:', error.message);
    return { error: 'Failed to delete skill group' };
  }

  revalidatePath('/');
  return { data: { success: true } };
}

export async function reorderSkillGroups(
  orderedIds: string[]
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from('skill_groups').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);

  if (failed?.error) {
    console.error('reorderSkillGroups error:', failed.error.message);
    return { error: 'Failed to reorder skill groups' };
  }

  revalidatePath('/');
  return { data: { success: true } };
}

// --- Skill Actions ---

export async function createSkill(data: SkillInsert): Promise<{ data?: Skill; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();
  const { data: created, error } = await supabase.from('skills').insert(data).select().single();

  if (error) {
    console.error('createSkill error:', error.message);
    return { error: 'Failed to create skill' };
  }

  revalidatePath('/');
  return { data: created };
}

export async function updateSkill(
  id: string,
  data: Partial<SkillInsert>
): Promise<{ data?: Skill; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from('skills')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateSkill error:', error.message);
    return { error: 'Failed to update skill' };
  }

  revalidatePath('/');
  return { data: updated };
}

export async function deleteSkill(
  id: string
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();
  const { error } = await supabase.from('skills').delete().eq('id', id);

  if (error) {
    console.error('deleteSkill error:', error.message);
    return { error: 'Failed to delete skill' };
  }

  revalidatePath('/');
  return { data: { success: true } };
}

export async function reorderSkills(
  orderedIds: string[]
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from('skills').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);

  if (failed?.error) {
    console.error('reorderSkills error:', failed.error.message);
    return { error: 'Failed to reorder skills' };
  }

  revalidatePath('/');
  return { data: { success: true } };
}

// --- Resume Management Actions ---

export type ResumeDownloadEntry = {
  id: string;
  downloadedAt: string;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorCompany: string | null;
};

export async function getResumeDownloads(): Promise<{
  data?: ResumeDownloadEntry[];
  error?: string;
}> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  const { data: downloads, error } = await supabase
    .from('resume_downloads')
    .select('id, downloaded_at, visitor_id')
    .order('downloaded_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('getResumeDownloads error:', error.message);
    return { error: 'Failed to load download log' };
  }

  if (!downloads || downloads.length === 0) {
    return { data: [] };
  }

  const visitorIds = Array.from(
    new Set(downloads.map((d) => d.visitor_id).filter(Boolean) as string[])
  );

  const { data: visitors } =
    visitorIds.length > 0
      ? await supabase
          .from('visitor_profiles')
          .select('id, full_name, email, company')
          .in('id', visitorIds)
      : { data: [] };

  const visitorMap = new Map(visitors?.map((v) => [v.id, v]) ?? []);

  return {
    data: downloads.map((d) => {
      const visitor = d.visitor_id ? visitorMap.get(d.visitor_id) : null;
      return {
        id: d.id,
        downloadedAt: d.downloaded_at,
        visitorName: visitor?.full_name ?? null,
        visitorEmail: visitor?.email ?? null,
        visitorCompany: visitor?.company ?? null,
      };
    }),
  };
}

export async function uploadResume(
  formData: FormData
): Promise<{ data?: { path: string }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No file provided' };

  if (file.type !== 'application/pdf') {
    return { error: 'Only PDF files are allowed' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: 'File must be smaller than 10 MB' };
  }

  const supabase = await createClient();
  const storagePath = 'resume.pdf';

  const { error: uploadError } = await supabase.storage
    .from('resume')
    .upload(storagePath, file, { upsert: true, contentType: 'application/pdf' });

  if (uploadError) {
    console.error('uploadResume storage error:', uploadError.message);
    return { error: 'Failed to upload file' };
  }

  const { error: updateError } = await supabase
    .from('profile')
    .update({ resume_url: storagePath })
    .eq('singleton', true);

  if (updateError) {
    console.error('uploadResume profile update error:', updateError.message);
    return { error: 'File uploaded but failed to update profile' };
  }

  revalidatePath('/');
  return { data: { path: storagePath } };
}

// --- Visitor Management Actions ---

export type VisitorEntry = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  provider: string | null;
  company: string | null;
  role: string | null;
  createdAt: string;
  downloadCount: number;
};

export async function getVisitors(): Promise<{
  data?: VisitorEntry[];
  error?: string;
}> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const supabase = await createClient();

  const { data: visitors, error } = await supabase
    .from('visitor_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getVisitors error:', error.message);
    return { error: 'Failed to load visitors' };
  }

  if (!visitors || visitors.length === 0) {
    return { data: [] };
  }

  // Fetch download counts per visitor
  const visitorIds = visitors.map((v) => v.id);
  const { data: downloads } = await supabase
    .from('resume_downloads')
    .select('visitor_id')
    .in('visitor_id', visitorIds);

  const downloadCounts = new Map<string, number>();
  if (downloads) {
    for (const dl of downloads) {
      if (dl.visitor_id) {
        downloadCounts.set(dl.visitor_id, (downloadCounts.get(dl.visitor_id) ?? 0) + 1);
      }
    }
  }

  return {
    data: visitors.map((v) => ({
      id: v.id,
      fullName: v.full_name,
      email: v.email,
      avatarUrl: v.avatar_url,
      provider: v.provider,
      company: v.company,
      role: v.role,
      createdAt: v.created_at,
      downloadCount: downloadCounts.get(v.id) ?? 0,
    })),
  };
}

export async function getVisitorsCsvData(): Promise<{
  data?: string;
  error?: string;
}> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const visitorsResult = await getVisitors();
  if (visitorsResult.error) return { error: visitorsResult.error };

  const visitors = visitorsResult.data ?? [];

  const headers = ['Name', 'Email', 'Provider', 'Company', 'Role', 'Downloads', 'Joined'];
  const rows = visitors.map((v) => [
    escapeCsvField(v.fullName ?? ''),
    escapeCsvField(v.email ?? ''),
    escapeCsvField(v.provider ?? ''),
    escapeCsvField(v.company ?? ''),
    escapeCsvField(v.role ?? ''),
    String(v.downloadCount),
    v.createdAt ? new Date(v.createdAt).toISOString().split('T')[0] : '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return { data: csv };
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// --- Image Upload Actions ---

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
const ALLOWED_VIDEO_EXTS = ['mp4', 'webm'];
const ALLOWED_STORAGE_BUCKETS = ['project-images', 'project-videos', 'company-logos', 'resume'];

function sanitizeExtension(filename: string, allowlist: string[], fallback: string): string {
  const raw = filename.split('.').pop() ?? '';
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return allowlist.includes(clean) ? clean : fallback;
}

export async function uploadProjectImage(
  formData: FormData
): Promise<{ data?: { path: string; publicUrl: string }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No file provided' };

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { error: 'Image must be smaller than 5 MB' };
  }

  const supabase = await createClient();

  const ext = sanitizeExtension(file.name, ALLOWED_IMAGE_EXTS, 'png');
  const storagePath = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('project-images')
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    console.error('uploadProjectImage storage error:', uploadError.message);
    return { error: 'Failed to upload image' };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('project-images').getPublicUrl(storagePath);

  return { data: { path: storagePath, publicUrl } };
}

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

export async function uploadProjectVideo(
  formData: FormData
): Promise<{ data?: { path: string; publicUrl: string }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No file provided' };

  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { error: 'Only MP4 and WebM videos are allowed' };
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return { error: 'Video must be smaller than 50 MB' };
  }

  const supabase = await createClient();

  const ext = sanitizeExtension(file.name, ALLOWED_VIDEO_EXTS, 'mp4');
  const storagePath = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('project-videos')
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    console.error('uploadProjectVideo storage error:', uploadError.message);
    return { error: 'Failed to upload video' };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('project-videos').getPublicUrl(storagePath);

  return { data: { path: storagePath, publicUrl } };
}

export async function deleteStorageFile(
  bucket: string,
  path: string
): Promise<{ data?: { success: true }; error?: string }> {
  const adminResult = await requireAdmin();
  if (adminResult.error) return { error: adminResult.error };

  if (!ALLOWED_STORAGE_BUCKETS.includes(bucket)) {
    return { error: 'Invalid bucket' };
  }

  const supabase = await createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error(`deleteStorageFile error (${bucket}/${path}):`, error.message);
    return { error: 'Failed to delete file' };
  }

  return { data: { success: true } };
}
