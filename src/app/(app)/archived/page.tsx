import type { ReactNode } from "react";
import Link from "next/link";
import { EmptyState, Pagination } from "@/components/page-header";
import { SearchField } from "@/components/search-field";
import { readTokens } from "@/lib/search";
import { formatDisplayDate, fromDateOnly } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { listArchived } from "@/server/queries";

export const metadata = { title: "Archived Schemes" };

export default async function ArchivedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; scope?: string; token?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const tokens = readTokens(params.token);
  const scope = params.scope ?? "all";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const result = await listArchived(q, page, scope, tokens);
  const filtering = Boolean(q.trim() || tokens.length || scope !== "all");

  return (
    <div>
      <SearchField
        path="/archived"
        label="Search archived records"
        placeholder="Search"
        query={q}
        tokens={tokens}
        scope={scope}
        scopes={[
          { id: "all", label: "All" },
          { id: "name", label: "Name" },
          { id: "scheme", label: "Scheme" },
          { id: "phone", label: "Phone" },
        ]}
        resultLabel={filtering ? `${result.customers.length + result.total} records` : undefined}
      />
      {result.customers.length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-3 font-medium">Inactive customers</h2>
          <div className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[34%]" />
                <col className="w-[28%]" />
                <col />
              </colgroup>
              <caption className="sr-only">Inactive customers</caption>
              <thead className="bg-zinc-50 text-left text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">ID</th>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Phone</th>
                  <th scope="col" className="px-4 py-3 font-medium">Schemes</th>
                </tr>
              </thead>
              <tbody>
                {result.customers.map((customer) => {
                  const href = `/customers/${customer.id}`;
                  const cell = (content: ReactNode, primary = false) => (
                    <td className="p-0">
                      <Link href={href} tabIndex={primary ? undefined : -1} className="block cursor-pointer px-4 py-3 text-inherit">
                        {content}
                      </Link>
                    </td>
                  );
                  return (
                    <tr key={customer.id} className="border-t border-zinc-100 hover:bg-[#f2f2f7]">
                      {cell(<span className="font-medium text-amber-900">{customer.customerCode}</span>, true)}
                      {cell(customer.fullName)}
                      {cell(customer.phone)}
                      {cell(String(customer._count.schemes))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {result.schemes.length === 0 && result.customers.length === 0 ? (
        filtering ? (
          <p className="text-zinc-600">No matching records.</p>
        ) : (
          <EmptyState title="Nothing archived" body="Inactive customers and archived schemes appear here." actionHref="/customers" actionLabel="Open Customers" />
        )
      ) : result.schemes.length === 0 ? null : (
        <div className="overflow-x-auto rounded-[26px] border border-zinc-200 bg-white">
          {result.customers.length > 0 ? <h2 className="border-b border-zinc-100 px-4 py-3 font-medium">Schemes</h2> : null}
          <table className="min-w-full text-sm">
            <caption className="sr-only">Archived schemes</caption>
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium">Scheme</th>
                <th scope="col" className="px-4 py-3 font-medium">Started</th>
                <th scope="col" className="px-4 py-3 font-medium">Completed</th>
                <th scope="col" className="px-4 py-3 font-medium">Monthly</th>
                <th scope="col" className="px-4 py-3 font-medium">Collected</th>
              </tr>
            </thead>
            <tbody>
              {result.schemes.map((scheme) => {
                const href = `/schemes/${scheme.id}`;
                const cell = (content: ReactNode, primary = false) => (
                  <td className="p-0">
                    <Link
                      href={href}
                      tabIndex={primary ? undefined : -1}
                      className="block cursor-pointer px-4 py-3 text-inherit"
                    >
                      {content}
                    </Link>
                  </td>
                );
                return (
                  <tr key={scheme.id} className="border-t border-zinc-100 hover:bg-[#f2f2f7]">
                    {cell(`${scheme.customer.customerCode} · ${scheme.customer.fullName}`, true)}
                    {cell(<span className="font-medium text-amber-900">{scheme.schemeCode}</span>)}
                    {cell(formatDisplayDate(fromDateOnly(scheme.startDate)))}
                    {cell(scheme.completionDate ? formatDisplayDate(fromDateOnly(scheme.completionDate)) : "—")}
                    {cell(formatINR(scheme.monthlyInstallmentPaise))}
                    {cell(formatINR(scheme.totalAmountPaise))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={result.pages} path="/archived" params={{ q, ...(scope !== "all" ? { scope } : {}), token: tokens }} />
    </div>
  );
}
