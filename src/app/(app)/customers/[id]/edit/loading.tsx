import { LoadingStatus } from "@/components/record-skeleton";
import { LoaderSkeleton } from "@/components/ui/loaders-skeleton";

export default function EditCustomerLoading() {
  return (
    <LoadingStatus className="mx-auto max-w-xl">
      <div className="mb-6">
        <LoaderSkeleton width={180} height={28} borderRadius={9999} />
        <LoaderSkeleton className="mt-1" width={220} height={14} borderRadius={9999} />
      </div>
      <div className="space-y-4 rounded-[26px] border border-zinc-200 bg-white p-5">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-1.5">
            <LoaderSkeleton width={88} height={14} borderRadius={9999} />
            <LoaderSkeleton height={index > 1 ? 88 : 44} borderRadius={16} />
          </div>
        ))}
        <LoaderSkeleton height={44} borderRadius={9999} />
      </div>
    </LoadingStatus>
  );
}
