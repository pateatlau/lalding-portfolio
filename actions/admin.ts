'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type {
  ProfileInsert,
  ProfileStatInsert,
  Experience,
  ExperienceInsert,
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

  // Bulk replace: delete all existing stats, then insert new ones
  const { error: deleteError } = await supabase.from('profile_stats').delete().gte('sort_order', 0);

  if (deleteError) {
    console.error('updateProfileStats delete error:', deleteError.message);
    return { error: 'Failed to update stats' };
  }

  if (stats.length > 0) {
    const { error: insertError } = await supabase.from('profile_stats').insert(stats);

    if (insertError) {
      console.error('updateProfileStats insert error:', insertError.message);
      return { error: 'Failed to save new stats' };
    }
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
