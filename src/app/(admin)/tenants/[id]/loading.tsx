import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Skeleton className="h-3 w-32" />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-3 w-72" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <PanelSkeleton lines={5} />
        <PanelSkeleton lines={4} />
      </div>

      <PanelSkeleton lines={3} />
      <PanelSkeleton lines={4} />
    </div>
  );
}

function PanelSkeleton({ lines }: { lines: number }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Skeleton className="h-3 w-24" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </section>
  );
}
