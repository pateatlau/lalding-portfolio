import { getProfile } from '@/lib/supabase/queries';
import { getResumeDownloads } from '@/actions/admin';
import ResumeManager from '@/components/admin/resume-manager';

export default async function ResumeManagementPage() {
  const [profile, downloadsResult] = await Promise.all([getProfile(), getResumeDownloads()]);

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load profile data.</p>
      </div>
    );
  }

  return (
    <ResumeManager
      resumeUrl={profile.resume_url}
      updatedAt={profile.updated_at}
      downloads={downloadsResult.data ?? []}
    />
  );
}
