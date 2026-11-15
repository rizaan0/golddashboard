import { LoadingStatus } from "@/components/record-skeleton";
import { LoaderSkeleton } from "@/components/ui/loaders-skeleton";

export default function DashboardLoading() {
  return (
    <LoadingStatus>
      <div className="mb-6 flex flex-wrap items-end justify-center gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex w-44 flex-col items-center">
            <LoaderSkeleton className="mb-1" width={72} height={14} borderRadius={9999} />
            <div className="flex h-11 w-full items-center rounded-full border border-black/10 bg-white px-4">
              <LoaderSkeleton width="70%" height={14} borderRadius={9999} />
            </div>
          </div>
        ))}
        <LoaderSkeleton width={96} height={44} borderRadius={9999} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <article key={index} className="rounded-[26px] border border-zinc-200 bg-white px-4 py-3">
            <LoaderSkeleton width={index % 2 === 0 ? "58%" : "46%"} height={14} borderRadius={9999} />
            <LoaderSkeleton className="mt-1" width="32%" height={24} borderRadius={9999} />
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-[26px] border border-zinc-200 bg-white p-4">
        <LoaderSkeleton width={112} height={20} borderRadius={9999} />
        <LoaderSkeleton className="mt-1" width={220} height={14} borderRadius={9999} />
        <LoaderSkeleton className="mt-3" height={248} borderRadius={20} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[26px] border border-red-100 bg-white p-4">
          <LoaderSkeleton width={168} height={20} borderRadius={9999} />
          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <LoaderSkeleton width="62%" height={14} borderRadius={9999} />
                <LoaderSkeleton width={72} height={14} borderRadius={9999} />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[26px] border border-zinc-200 bg-white p-4">
          <LoaderSkeleton width={156} height={20} borderRadius={9999} />
          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <LoaderSkeleton key={index} width={index === 2 ? "70%" : "88%"} height={14} borderRadius={9999} />
            ))}
          </div>
          <LoaderSkeleton className="mt-6" width={196} height={20} borderRadius={9999} />
          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <LoaderSkeleton key={index} width={index === 1 ? "64%" : "80%"} height={14} borderRadius={9999} />
            ))}
          </div>
        </section>
      </div>
    </LoadingStatus>
  );
}
