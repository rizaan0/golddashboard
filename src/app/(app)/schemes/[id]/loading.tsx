import { LoadingStatus, TableSkeleton } from "@/components/record-skeleton";
import { LoaderSkeleton } from "@/components/ui/loaders-skeleton";

const columns = [
  { width: "8%", bar: "40%" },
  { width: "22%", bar: "70%" },
  { width: "22%", bar: "60%" },
  { width: "18%", bar: "50%" },
  { width: "30%", bar: "72%" },
];

export default function SchemeLoading() {
  return (
    <LoadingStatus>
      <div className="mb-6">
        <LoaderSkeleton width={220} height={28} borderRadius={9999} />
      </div>
      <section className="flex flex-col gap-4 rounded-[26px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <LoaderSkeleton width={88} height={24} borderRadius={9999} />
          <LoaderSkeleton width={40} height={14} borderRadius={9999} />
        </div>
        <LoaderSkeleton height={8} borderRadius={9999} />
        <div className="flex items-center justify-between gap-3">
          <LoaderSkeleton width={156} height={44} borderRadius={9999} />
          <LoaderSkeleton width={96} height={44} borderRadius={9999} />
        </div>
      </section>
      <div className="mt-4">
        <TableSkeleton columns={columns} rows={11} />
      </div>
    </LoadingStatus>
  );
}
