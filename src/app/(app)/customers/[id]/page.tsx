import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDisplayDate, formatTimestamp, fromDateOnly, installmentDisplayStatus, kolkataToday } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { getCustomer } from "@/server/queries";

export const metadata = { title: "Customer" };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const today = kolkataToday();
  const active = customer.schemes.find((scheme) => scheme.status === "active" && !scheme.archivedAt);
  const history = customer.schemes.filter((scheme) => scheme.id !== active?.id);

  return (
    <div>
      <PageHeader title={customer.fullName} actionHref={`/customers/${customer.id}/edit`} actionLabel="Edit Customer" />
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <section className="flex h-full flex-col rounded-[26px] border border-zinc-200 bg-white p-5 lg:col-span-1">
          <h2 className="font-medium">Customer</h2>
          <dl className="mt-4 flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-2">
              <dt className="text-zinc-500">Status</dt>
              <dd>
                <StatusBadge status={customer.status} />
              </dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="text-zinc-500">ID</dt>
              <dd className="tabular-nums">{customer.customerCode}</dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="text-zinc-500">Phone</dt>
              <dd className="tabular-nums">{customer.phone}</dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="text-zinc-500">Registered</dt>
              <dd className="tabular-nums">{formatTimestamp(customer.createdAt)}</dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="text-zinc-500">Address</dt>
              <dd className="text-pretty">{customer.address || "None"}</dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="text-zinc-500">Notes</dt>
              <dd className="text-pretty">{customer.notes || "None"}</dd>
            </div>
          </dl>
        </section>
        <section className="flex h-full flex-col rounded-[26px] border border-zinc-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">Current Scheme</h2>
            {customer.status === "active" ? (
              <Button asChild variant="secondary">
                <Link href={`/schemes?compose=1&customerId=${customer.id}`}>New Scheme</Link>
              </Button>
            ) : null}
          </div>
          {!active ? <p className="mt-4 text-sm text-zinc-500">No active scheme.</p> : <SchemeSummary scheme={active} today={today} />}
        </section>
      </div>
      <section className="mt-4 rounded-[26px] border border-zinc-200 bg-white p-5">
        <h2 className="font-medium">Previous Schemes</h2>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No earlier schemes.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100 text-sm">
            {history.map((scheme) => {
              const paid = scheme.installments.filter((item) => item.transactions.length > 0).length;
              return (
                <li key={scheme.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <Link href={`/schemes/${scheme.id}`} className="hover:underline">
                    {scheme.schemeCode} · {formatDisplayDate(fromDateOnly(scheme.startDate))}
                  </Link>
                  <span className="flex items-center gap-2 tabular-nums">
                    {paid}/11 · {formatINR(paid * scheme.monthlyInstallmentPaise)}
                    {scheme.archivedAt ? <StatusBadge status="archived" /> : scheme.status === "completed" ? <StatusBadge status="completed" /> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function SchemeSummary({
  scheme,
  today,
}: {
  scheme: NonNullable<Awaited<ReturnType<typeof getCustomer>>>["schemes"][number];
  today: string;
}) {
  const paid = scheme.installments.filter((item) => item.transactions.length > 0).length;
  const collected = paid * scheme.monthlyInstallmentPaise;
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href={`/schemes/${scheme.id}`} className="font-medium text-amber-900 hover:underline">
          {scheme.schemeCode}
        </Link>
        {scheme.status === "completed" ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <span className="sr-only">Completed</span>
          </>
        ) : null}
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <dt className="text-zinc-500">Monthly</dt>
          <dd className="tabular-nums">{formatINR(scheme.monthlyInstallmentPaise)}</dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-zinc-500">Paid</dt>
          <dd className="tabular-nums">{paid}/11</dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-zinc-500">Collected</dt>
          <dd className="tabular-nums">{formatINR(collected)}</dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-zinc-500">Remaining</dt>
          <dd className="tabular-nums">{formatINR(scheme.totalAmountPaise - collected)}</dd>
        </div>
      </dl>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100" role="meter" aria-valuemin={0} aria-valuemax={11} aria-valuenow={paid} aria-label="Installments paid">
        <div className="progress-fill h-full bg-emerald-600" style={{ width: `${(paid / 11) * 100}%` }} />
      </div>
      <ul className="divide-y divide-zinc-100 text-sm">
        {scheme.installments.map((item) => {
          const due = fromDateOnly(item.dueDate);
          const isPaid = item.transactions.length > 0;
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <span className="tabular-nums">
                {item.installmentNumber}. {formatDisplayDate(due)}
              </span>
              <StatusBadge status={installmentDisplayStatus(due, isPaid, today)} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
