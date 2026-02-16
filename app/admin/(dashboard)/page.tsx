import { getAdminStats } from '@/actions/admin';
import DashboardContent from '@/components/admin/dashboard-content';

export default async function AdminDashboardPage() {
  const { data: stats, error } = await getAdminStats();

  if (error || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    );
  }

  return <DashboardContent stats={stats} />;
}
