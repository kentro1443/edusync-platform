import { Skeleton } from "@/components/ui/Feedback";

export default function AppLoading() {
  return (
    <div aria-label="Đang tải trang" className="space-y-8">
      <div className="space-y-3 border-b border-[var(--color-ink-200)] pb-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-[min(28rem,85vw)]" />
        <Skeleton className="h-5 w-[min(42rem,90vw)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-40" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
