import { cn } from "@/lib/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-btn bg-brand-soft/80", className)}
      {...props}
    />
  );
}

export function TableCardSkeleton() {
  return (
    <div className="flex min-h-[148px] flex-col justify-between rounded-card border border-border/40 bg-surface p-4 shadow-card">
      <div className="flex w-full items-start justify-between">
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-4 w-10 rounded-full" />
      </div>
      <div className="space-y-2 mt-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="flex flex-col rounded-card border border-border/40 bg-surface overflow-hidden shadow-card">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-5 w-80 rounded-md" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        <Skeleton className="h-32 rounded-card" />
        <Skeleton className="h-32 rounded-card" />
        <Skeleton className="h-32 rounded-card" />
        <Skeleton className="h-32 rounded-card" />
      </div>
    </div>
  );
}
