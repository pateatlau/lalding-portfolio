import { getVisitors } from '@/actions/admin';
import VisitorsTable from '@/components/admin/visitors-table';

export default async function VisitorsPage() {
  const result = await getVisitors();

  if (result.error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load visitors.</p>
      </div>
    );
  }

  return <VisitorsTable visitors={result.data ?? []} />;
}
