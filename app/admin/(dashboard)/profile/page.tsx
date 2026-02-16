import { getProfile, getProfileStats } from '@/lib/supabase/queries';
import ProfileForm from '@/components/admin/profile-form';

export default async function ProfileEditorPage() {
  const [profile, stats] = await Promise.all([getProfile(), getProfileStats()]);

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load profile data.</p>
      </div>
    );
  }

  return <ProfileForm profile={profile} stats={stats ?? []} />;
}
