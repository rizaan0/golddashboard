import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { DateMenu } from "@/components/ui/date-menu";
import { Input, Label } from "@/components/ui/fields";
import { formatDisplayDate, fromDateOnly, installmentDisplayStatus, kolkataToday } from "@/lib/dates";
import { formatINR, formatRupeesInput } from "@/lib/money";
import { archiveSchemeAction, clearPaymentAction, createSchemeAction, recordPaymentAction, restoreSchemeAction, updateSchemeTermsAction } from "@/server/actions";
import { getScheme, getSettings } from "@/server/queries";

export const metadata = { title: "Scheme" };

export default async function SchemeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const scheme = await getScheme(id);
  if (!scheme) notFound();
  const settings = await getSettings();
  const today = kolkataToday();
  const paidInstallments = scheme.installments.filter((item) => item.transactions.some((tx) => !tx.reversedAt));
  const paid = paidInstallments.length;
  const locked = scheme.transactions.length > 0 || scheme.installments.some((item) => item.transactions.length > 0);
  const otherActive = await countOtherActive(scheme.customerId, scheme.id);
  const canRestart = scheme.status === "completed" && (settings.allowMultipleActiveSchemes || otherActive === 0);

  return (
    <div>
      <PageHeader title={scheme.customer.fullName} />
      {query.error ? <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{query.error}</p> : null}
      <section className="flex flex-col gap-4 rounded-[26px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex flex-wrap items-center gap-2">
            {scheme.status === "completed" ? (
              <span className="inline-flex items-center gap-2 font-medium text-emerald-700">
                <CheckCircle2 className="size-5" aria-hidden />
                Scheme Completed
              </span>
            ) : (
              <StatusBadge status="active" />
            )}
            {scheme.archivedAt ? <StatusBadge status="archived" /> : null}
          </span>
          <span className="text-sm tabular-nums text-zinc-600">{paid}/11</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
          <div className="progress-fill h-full bg-emerald-600" style={{ width: `${(paid / scheme.durationMonths) * 100}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="secondary">
            <Link href={`/customers/${scheme.customerId}`}>Customer Record</Link>
          </Button>
          {scheme.status === "completed" && !scheme.archivedAt ? (
            <ConfirmSubmit
              action={archiveSchemeAction}
              title="Archive this scheme?"
              description="The customer, installments, and payments stay in the records."
              confirmLabel="Archive Scheme"
              triggerLabel="Archive"
              fields={{ schemeId: scheme.id }}
            />
          ) : null}
          {scheme.archivedAt ? (
            <ConfirmSubmit
              action={restoreSchemeAction}
              title="Restore this scheme?"
              description="It returns to the customer's history. Payments are unchanged."
              confirmLabel="Restore Scheme"
              triggerLabel="Restore"
              fields={{ schemeId: scheme.id }}
            />
          ) : null}
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[26px] border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Payment</th>
            </tr>
          </thead>
          <tbody>
            {scheme.installments.map((item) => {
              const posted = item.transactions.find((tx) => !tx.reversedAt);
              const due = fromDateOnly(item.dueDate);
              const status = installmentDisplayStatus(due, Boolean(posted), today);
              const nextUnpaid = scheme.installments.find((row) => !row.transactions.some((tx) => !tx.reversedAt));
              const isNext = !posted && nextUnpaid?.id === item.id && scheme.status === "active" && !scheme.archivedAt;
              return (
                <tr key={item.id} className={`border-t border-zinc-100 align-middle ${isNext ? "bg-[#007aff]/8" : ""}`}>
                  <td className="px-4 py-3">{item.installmentNumber}</td>
                  <td className="px-4 py-3">{formatDisplayDate(due)}</td>
                  <td className="px-4 py-3">{formatINR(item.amountDuePaise)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3">
                    {posted ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm tabular-nums">{formatDisplayDate(fromDateOnly(posted.paymentDate))}</span>
                        <ConfirmSubmit
                          action={clearPaymentAction}
                          title={`Clear installment ${item.installmentNumber}?`}
                          description="This installment becomes unpaid. You can record it again."
                          confirmLabel="Clear Payment"
                          triggerLabel="Clear"
                          fields={{ transactionId: posted.id, schemeId: scheme.id }}
                          danger
                        />
                      </div>
                    ) : isNext ? (
                      <ActionForm action={recordPaymentAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="installmentId" value={item.id} />
                        <input type="hidden" name="schemeId" value={scheme.id} />
                        <input type="hidden" name="amountPaise" value={item.amountDuePaise} />
                        <DateMenu className="w-44" name="paymentDate" value={due} required aria-label={`Payment date for installment ${item.installmentNumber}`} />
                        <SubmitButton pendingLabel="Recording…">Record Full Payment</SubmitButton>
                      </ActionForm>
                    ) : (
                      <span className="text-sm text-zinc-500">Waiting</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {!locked && scheme.status === "active" && !scheme.archivedAt ? (
        <section className="mt-4 rounded-[26px] border border-zinc-200 bg-white p-5">
          <h2 className="font-medium">Correct terms</h2>
          <p className="mt-1 text-sm text-zinc-600">Available only before the first payment. The 11 due dates are regenerated.</p>
          <ActionForm action={updateSchemeTermsAction} className="mt-3 grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="schemeId" value={scheme.id} />
            <div>
              <Label htmlFor="monthlyRupees">Monthly amount (₹)</Label>
              <Input id="monthlyRupees" name="monthlyRupees" defaultValue={formatRupeesInput(scheme.monthlyInstallmentPaise)} />
            </div>
            <DateMenu id="startDate" name="startDate" label="Start date" value={fromDateOnly(scheme.startDate)} />
            <div className="flex items-end">
              <SubmitButton variant="secondary">Update Schedule</SubmitButton>
            </div>
          </ActionForm>
        </section>
      ) : null}

      {canRestart ? (
        <section className="mt-4 rounded-[26px] border border-zinc-200 bg-white p-5">
          <h2 className="font-medium">Restart new scheme</h2>
          <p className="mt-1 text-sm text-zinc-600">This keeps {scheme.schemeCode} as a completed record and opens a fresh 11-month schedule.</p>
          <ActionForm action={createSchemeAction} className="mt-3 grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="customerId" value={scheme.customerId} />
            <div>
              <Label htmlFor="restartAmount">Monthly amount (₹)</Label>
              <Input id="restartAmount" name="monthlyRupees" defaultValue={formatRupeesInput(scheme.monthlyInstallmentPaise)} />
            </div>
            <DateMenu id="restartDate" name="startDate" label="Start date" value={today} />
            <div className="flex items-end">
              <SubmitButton variant="secondary">Restart Scheme</SubmitButton>
            </div>
          </ActionForm>
        </section>
      ) : null}
    </div>
  );
}

async function countOtherActive(customerId: string, schemeId: string) {
  const { prisma } = await import("@/lib/db");
  return prisma.scheme.count({
    where: { customerId, id: { not: schemeId }, status: "active", archivedAt: null },
  });
}
