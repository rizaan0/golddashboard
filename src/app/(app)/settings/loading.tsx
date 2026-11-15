import { LoadingStatus } from "@/components/record-skeleton";
import { LoaderSkeleton } from "@/components/ui/loaders-skeleton";

export default function SettingsLoading() {
  return (
    <LoadingStatus className="-my-8 mx-auto flex min-h-[calc(100dvh-4.625rem)] w-full max-w-xl flex-col justify-center gap-6 py-8">
      <div className="rounded-[26px] border border-zinc-200 bg-white p-5">
        <LoaderSkeleton width={96} height={22} borderRadius={9999} />
        <LoaderSkeleton className="mt-2" width={180} height={16} borderRadius={9999} />
        <div className="mt-6 flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <LoaderSkeleton width={140} height={14} borderRadius={9999} />
              <LoaderSkeleton height={44} borderRadius={26} />
            </div>
          ))}
        </div>
        <LoaderSkeleton className="mt-6" height={44} borderRadius={9999} />
      </div>
      <LoaderSkeleton className="mx-auto" width={88} height={22} borderRadius={9999} />
    </LoadingStatus>
  );
}
