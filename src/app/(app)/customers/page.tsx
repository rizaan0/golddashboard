import type { ReactNode } from "react";
import Link from "next/link";
import { NewCustomerMenu } from "@/components/new-customer-menu";
import { EmptyState, Pagination } from "@/components/page-header";
import { SearchField } from "@/components/search-field";
import { readTokens } from "@/lib/search";
import { searchCustomers } from "@/server/queries";

export const metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; scope?: string; token?: string | string[]; compose?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const tokens = readTokens(params.token);
  const scope = params.scope ?? "all";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const result = await searchCustomers(q, page, scope, tokens);
  const filtering = Boolean(q.trim() || tokens.length || scope !== "all");

  return (
    <div>
      <SearchField
        path="/customers"
        label="Search customers"
        placeholder="Search"
        query={q}
        tokens={tokens}
        scope={scope}
        scopes={[
          { id: "all", label: "All" },
          { id: "name", label: "Name" },
          { id: "id", label: "ID" },
          { id: "phone", label: "Phone" },
        ]}
        resultLabel={filtering ? `${result.total} customers` : undefined}
        action={<NewCustomerMenu defaultOpen={params.compose === "1"} />}
      />
      {result.customers.length === 0 ? (
        filtering ? (
          <p className="text-zinc-600">No matching customers.</p>
        ) : (
          <EmptyState title="No customers yet" body="Add a customer before opening a gold savings scheme." action={<NewCustomerMenu />} />
        )
      ) : (
        <div className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[34%]" />
              <col className="w-[28%]" />
              <col />
            </colgroup>
            <caption className="sr-only">Active customers</caption>
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">ID</th>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Phone</th>
                <th scope="col" className="px-4 py-3 font-medium">Active scheme</th>
              </tr>
            </thead>
            <tbody>
              {result.customers.map((customer) => {
                const href = `/customers/${customer.id}`;
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
                  <tr key={customer.id} className="border-t border-zinc-100 hover:bg-[#f2f2f7]">
                    {cell(<span className="font-medium text-amber-900">{customer.customerCode}</span>, true)}
                    {cell(customer.fullName)}
                    {cell(customer.phone)}
                    {cell(customer.schemes[0] ? "Yes" : "No")}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={result.pages} path="/customers" params={{ q, ...(scope !== "all" ? { scope } : {}), token: tokens }} />
    </div>
  );
}
