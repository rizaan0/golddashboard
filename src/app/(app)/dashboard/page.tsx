import Link from "next/link";
import { CollectionChart } from "@/components/collection-chart";
import { LiquidGlass } from "@/components/liquid-glass/liquid-glass";
import { Button } from "@/components/ui/button";
import { DateMenu } from "@/components/ui/date-menu";
import { PopupMenu } from "@/components/ui/popup-menu";
import { StatusBadge } from "@/components/status-badge";
import { formatDisplayDate, fromDateOnly, type DateRangePreset } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { dashboardData } from "@/server/queries";

export const metadata = { title: "Dashboard" };

const presets: { id: DateRangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
  { id: "custom", label: "Custom" },
];

function presetOf(value: string | undefined): DateRangePreset {
  if (value === "today" || value === "week" || value === "month" || value === "year" || value === "custom") return value;
  return "month";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const preset = presetOf(params.range);
  const data = await dashboardData(preset, params.from, params.to);
  const cards = [
    ["Active customers", String(data.cards.customers)],
    ["Active schemes", String(data.cards.activeSchemes)],
    ["Collections today", formatINR(data.cards.collectionsToday)],
    ["Collections this month", formatINR(data.cards.collectionsMonth)],
    ["Collections this year", formatINR(data.cards.collectionsYear)],
    ["Overdue", String(data.cards.overdue)],
  ];

  return (
    <div>
      <form className="mb-6 flex flex-wrap items-end justify-center gap-3" method="get">
        <PopupMenu
          id="chart-range"
          name="range"
          label="Chart range"
          labelTone="filter"
          value={preset}
          options={presets.map((item) => ({ value: item.id, label: item.label }))}
        />
        <DateMenu id="from" name="from" label="From" labelTone="filter" value={params.from ?? data.range.from} />
        <DateMenu id="to" name="to" label="To" labelTone="filter" value={params.to ?? data.range.to} />
        <Button type="submit" variant="secondary" data-liquid-glass className="glass-button relative">
          <LiquidGlass preserveShape />
          <span className="relative z-[1]">Apply</span>
        </Button>
      </form>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-[26px] border border-zinc-200 bg-white px-4 py-3">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-[26px] border border-zinc-200 bg-white p-4">
        <h2>Collections</h2>
        <p className="text-sm text-zinc-500">
          {formatDisplayDate(data.range.from)} – {formatDisplayDate(data.range.to)}
        </p>
        <div className="mt-3">
          <CollectionChart data={data.chart} />
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[26px] border border-red-100 bg-white p-4">
          <h2 className="font-medium text-red-800">Overdue installments</h2>
          {data.overdueRows.length === 0 ? <p className="mt-3 text-sm text-zinc-500">No overdue installments.</p> : null}
          <ul className="mt-3 space-y-2 text-sm">
            {data.overdueRows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3">
                <Link href={`/schemes/${row.schemeId}`} className="hover:underline">
                  {row.scheme.customer.fullName} · {formatDisplayDate(fromDateOnly(row.dueDate))}
                </Link>
                <span>{formatINR(row.amountDuePaise)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[26px] border border-zinc-200 bg-white p-4">
          <h2 className="font-medium">Recently completed</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.completedRows.map((scheme) => (
              <li key={scheme.id} className="flex items-center justify-between">
                <Link href={`/schemes/${scheme.id}`} className="hover:underline">
                  {scheme.customer.fullName} · {scheme.schemeCode}
                </Link>
                <StatusBadge status="completed" />
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-medium">Recently added customers</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.newCustomers.map((customer) => (
              <li key={customer.id}>
                <Link href={`/customers/${customer.id}`} className="hover:underline">
                  {customer.customerCode} · {customer.fullName}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
