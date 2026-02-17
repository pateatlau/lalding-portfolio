'use server';

import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';
import type { VisitorProfile } from '@/lib/supabase/types';

export async function upsertVisitorProfile(): Promise<{
  data?: VisitorProfile;
  isNewUser?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  // Check if profile exists to determine isNewUser
  const { data: existing } = await supabase
    .from('visitor_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  const isNewUser = !existing;

  // Atomic upsert — insert or update in one operation
  const { data, error } = await supabase
    .from('visitor_profiles')
    .upsert(
      {
        id: user.id,
        full_name: user.user_metadata.full_name ?? user.user_metadata.name ?? null,
        email: user.email ?? null,
        avatar_url: user.user_metadata.avatar_url ?? null,
        provider: user.app_metadata.provider ?? null,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: data!, isNewUser };
}

export async function updateVisitorOptionalFields(
  company: string,
  role: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('visitor_profiles')
    .update({ company, role })
    .eq('id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function downloadResume(): Promise<{ url?: string; error?: string }> {
  return Sentry.withServerActionInstrumentation('downloadResume', {}, async () => {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Please sign in to download the resume' };
    }

    // Get the resume storage path from profile
    const { data: profile } = await supabase.from('profile').select('resume_url').single();

    if (!profile?.resume_url) {
      return { error: 'Resume not available' };
    }

    // Generate signed URL (5-minute expiry)
    const { data: signedUrlData, error: storageError } = await supabase.storage
      .from('resume')
      .createSignedUrl(profile.resume_url, 300);

    if (storageError || !signedUrlData?.signedUrl) {
      return { error: 'Failed to generate download link' };
    }

    // Log the download
    await supabase.from('resume_downloads').insert({
      visitor_id: user.id,
    });

    return { url: signedUrlData.signedUrl };
  });
}
