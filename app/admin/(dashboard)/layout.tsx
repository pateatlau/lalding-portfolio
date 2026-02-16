import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/admin-shell';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== 'admin') {
    redirect('/admin/login');
  }

  const adminUser = {
    name:
      user.user_metadata?.full_name ?? user.email ?? 'Admin',
    email: user.email ?? '',
    avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
  };

  return (
    <div className="fixed inset-0 z-[1000] flex bg-background">
      <AdminShell adminUser={adminUser}>{children}</AdminShell>
    </div>
  );
}
