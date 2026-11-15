import type { ReactNode } from "react";
import { PageFade } from "@/components/page-fade";
import { LoaderSkeleton } from "@/components/ui/loaders-skeleton";

export function LoadingStatus({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <PageFade>
      <div role="status" aria-live="polite" className={className}>
        <span className="sr-only">Loading records</span>
        {children}
      </div>
    </PageFade>
  );
}

export function SearchRowSkeleton({ actionWidth = 148 }: { actionWidth?: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <LoaderSkeleton className="min-w-0 flex-1" height={44} borderRadius={9999} baseColor="rgb(120 120 128 / 0.12)" highlightColor="rgba(255, 255, 255, 0.7)" />
      {actionWidth > 0 ? <LoaderSkeleton width={actionWidth} height={44} borderRadius={9999} /> : null}
    </div>
  );
}

export function TableSkeleton({
  columns,
  rows = 8,
}: {
  columns: { width: string; bar: string }[];
  rows?: number;
}) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white">
      <div className="flex bg-zinc-50">
        {columns.map((column, index) => (
          <div key={index} className="px-4 py-3" style={{ width: column.width }}>
            <LoaderSkeleton width="48%" height={14} borderRadius={9999} />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex border-t border-zinc-100">
          {columns.map((column, index) => (
            <div key={index} className="px-4 py-3" style={{ width: column.width }}>
              <LoaderSkeleton width={column.bar} height={14} borderRadius={9999} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
