import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-3 w-20" />
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-3 w-72" />
      </div>
      <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </section>
    </div>
  );
}
