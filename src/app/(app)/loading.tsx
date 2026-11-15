export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Loading records</span>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="rounded-[26px] border border-zinc-200 bg-white px-4 py-4">
            <div className="h-3.5 w-28 animate-pulse rounded-full bg-zinc-100 motion-reduce:animate-none" />
            <div className="mt-3 h-6 w-20 animate-pulse rounded-full bg-zinc-200 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
      <div className="rounded-[26px] border border-zinc-200 bg-white p-4">
        <div className="h-5 w-32 animate-pulse rounded-full bg-zinc-200 motion-reduce:animate-none" />
        <div className="mt-2 h-3.5 w-48 animate-pulse rounded-full bg-zinc-100 motion-reduce:animate-none" />
        <div className="mt-6 h-40 animate-pulse rounded-[20px] bg-zinc-100 motion-reduce:animate-none" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="rounded-[26px] border border-zinc-200 bg-white p-4">
            <div className="h-5 w-40 animate-pulse rounded-full bg-zinc-200 motion-reduce:animate-none" />
            <div className="mt-4 flex flex-col gap-3">
              <div className="h-4 w-full animate-pulse rounded-full bg-zinc-100 motion-reduce:animate-none" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-zinc-100 motion-reduce:animate-none" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-zinc-100 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
