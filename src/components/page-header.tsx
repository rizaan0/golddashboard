import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-zinc-950">{title}</h1>
        {description ? <p className="mt-1 text-[15px] leading-5 tracking-[-0.23px] text-zinc-600">{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Button asChild variant="primary">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  action,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[26px] border border-dashed border-zinc-300 bg-white px-6 py-8 text-center">
      <div className="flex max-w-[65ch] flex-col gap-2">
        <p className="text-balance font-medium leading-[1.3] text-zinc-900">{title}</p>
        <p className="text-pretty text-sm leading-normal text-zinc-500">{body}</p>
      </div>
      {action ? action : null}
      {!action && actionHref && actionLabel ? (
        <Button asChild variant="primary">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  path,
  params,
}: {
  page: number;
  pages: number;
  path: string;
  params: Record<string, string | string[]>;
}) {
  if (pages <= 1) return null;
  const href = (next: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const list = Array.isArray(value) ? value : [value];
      for (const item of list) {
        if (item) query.append(key, item);
      }
    }
    query.set("page", String(next));
    return `${path}?${query.toString()}`;
  };
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-zinc-600">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="secondary">
            <Link href={href(page - 1)}>Previous</Link>
          </Button>
        ) : null}
        {page < pages ? (
          <Button asChild variant="secondary">
            <Link href={href(page + 1)}>Next</Link>
          </Button>
        ) : null}
      </div>
    </nav>
  );
}
