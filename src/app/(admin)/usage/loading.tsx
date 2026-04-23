import { CardSkeleton, Skeleton, TableSkeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-3 w-72" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
