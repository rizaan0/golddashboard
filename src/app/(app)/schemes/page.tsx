import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { NewSchemeMenu } from "@/components/new-scheme-menu";
import { EmptyState, Pagination } from "@/components/page-header";
import { SearchField } from "@/components/search-field";
import { readTokens } from "@/lib/search";
import { formatINR } from "@/lib/money";
import { activeCustomers, listSchemes } from "@/server/queries";

export const metadata = { title: "Gold Schemes" };

export default async function SchemesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; scope?: string; token?: string | string[]; compose?: string; customerId?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const tokens = readTokens(params.token);
  const scope = params.scope ?? "all";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const [result, customers] = await Promise.all([listSchemes(q, page, scope, tokens), activeCustomers()]);
  const filtering = Boolean(q.trim() || tokens.length || scope !== "all");

  return (
    <div>
      <SearchField
        path="/schemes"
        label="Search schemes"
        placeholder="Search"
        query={q}
        tokens={tokens}
        scope={scope}
        scopes={[
          { id: "all", label: "All" },
          { id: "scheme", label: "Scheme" },
          { id: "customer", label: "Customer" },
          { id: "phone", label: "Phone" },
        ]}
        resultLabel={filtering ? `${result.total} schemes` : undefined}
        action={<NewSchemeMenu customers={customers} presetId={params.customerId} defaultOpen={params.compose === "1"} />}
      />
      {result.schemes.length === 0 ? (
        filtering ? (
          <p className="text-zinc-600">No matching schemes.</p>
        ) : (
          <EmptyState title="No active schemes" body="Create a scheme after the customer record exists." action={<NewSchemeMenu customers={customers} />} />
        )
      ) : (
        <div className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[34%]" />
              <col className="w-[22%]" />
              <col />
            </colgroup>
            <caption className="sr-only">Active schemes</caption>
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Scheme</th>
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium">Monthly</th>
                <th scope="col" className="px-4 py-3 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody>
              {result.schemes.map((scheme) => {
                const paid = scheme.installments.filter((item) => item.transactions.length > 0).length;
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
                    {cell(
                      <>
                        <span className="font-medium text-amber-900">{scheme.schemeCode}</span>
                        {paid === 11 ? (
                          <>
                            <CheckCircle2 className="ml-2 inline h-4 w-4 text-emerald-600" aria-hidden="true" />
                            <span className="sr-only">Completed</span>
                          </>
                        ) : null}
                      </>,
                      true,
                    )}
                    {cell(
                      <>
                        {scheme.customer.fullName}
                        <span className="ml-2 text-zinc-500">{scheme.customer.customerCode}</span>
                      </>,
                    )}
                    {cell(formatINR(scheme.monthlyInstallmentPaise))}
                    {cell(
                      <>
                        {paid}/11
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100" role="meter" aria-valuemin={0} aria-valuemax={11} aria-valuenow={paid} aria-label="Installments paid">
                          <div className="progress-fill h-full bg-emerald-600" style={{ width: `${(paid / 11) * 100}%` }} />
                        </div>
                      </>,
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={result.pages} path="/schemes" params={{ q, ...(scope !== "all" ? { scope } : {}), token: tokens }} />
    </div>
  );
}
