import { LoadingStatus } from "@/components/record-skeleton";
import { LoaderSkeleton } from "@/components/ui/loaders-skeleton";

export default function CustomerLoading() {
  return (
    <LoadingStatus>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LoaderSkeleton width={200} height={28} borderRadius={9999} />
        <LoaderSkeleton width={148} height={44} borderRadius={9999} />
      </div>
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <section className="rounded-[26px] border border-zinc-200 bg-white p-5 lg:col-span-1">
          <LoaderSkeleton width={96} height={20} borderRadius={9999} />
          <div className="mt-4 flex flex-col gap-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <LoaderSkeleton width={72} height={12} borderRadius={9999} />
                <LoaderSkeleton width={index % 2 === 0 ? "70%" : "46%"} height={14} borderRadius={9999} />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[26px] border border-zinc-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <LoaderSkeleton width={140} height={20} borderRadius={9999} />
            <LoaderSkeleton width={120} height={44} borderRadius={9999} />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <LoaderSkeleton width="40%" height={14} borderRadius={9999} />
            <LoaderSkeleton height={8} borderRadius={9999} />
            <LoaderSkeleton width="55%" height={14} borderRadius={9999} />
            <LoaderSkeleton width="48%" height={14} borderRadius={9999} />
          </div>
        </section>
      </div>
      <section className="mt-4 rounded-[26px] border border-zinc-200 bg-white p-5">
        <LoaderSkeleton width={148} height={20} borderRadius={9999} />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 2 }, (_, index) => (
            <LoaderSkeleton key={index} width={index === 0 ? "62%" : "48%"} height={14} borderRadius={9999} />
          ))}
        </div>
      </section>
    </LoadingStatus>
  );
}
