import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
