import { Skeleton } from '@/components/ui/skeleton';

export default function ResumeBuilderLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <Skeleton className="h-10 w-full max-w-md" />

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
