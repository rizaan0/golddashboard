"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-white p-6">
      <h1>Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-600">{error.message || "The page could not be loaded."}</p>
      <Button type="button" className="mt-4" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
