import { Card } from '@/shared/ui/Card';
import { Skeleton } from '@/shared/ui/Skeleton';

const BAR_HEIGHTS = [62, 66, 70, 74, 78, 82, 86, 64, 64, 64, 64, 88];
const TABLE_ROWS = 4;

/** Mirrors the dashboard layout so content does not jump when data arrives. */
export function ClientsDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-2 sm:gap-4" aria-busy="true">
      <p role="status" className="sr-only">
        Loading clients…
      </p>
      <Card className="px-2 pt-3 pb-2 sm:px-4 sm:pt-6 sm:pb-4">
        <div className="flex h-[178px] items-end gap-[2%] pb-8 pl-8 sm:h-[332px] sm:pb-9 sm:pl-11">
          {BAR_HEIGHTS.map((height, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${height}%` }} />
          ))}
        </div>
        <Skeleton className="mx-auto mt-2 h-4 w-64 max-w-full" />
      </Card>
      <Card className="p-2 sm:p-4">
        <Skeleton className="mb-4 h-5 w-full" />
        {Array.from({ length: TABLE_ROWS }, (_, i) => (
          <Skeleton key={i} className="mt-4 h-8 w-full" />
        ))}
      </Card>
    </div>
  );
}
