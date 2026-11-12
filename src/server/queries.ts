import { Prisma } from "@prisma/client";
import { requireOwner } from "@/lib/auth-guard";
import {
  eachDate,
  endOfMonth,
  endOfYear,
  fromDateOnly,
  kolkataToday,
  rangeForPreset,
  startOfMonth,
  startOfYear,
  toDateOnly,
  type DateRangePreset,
} from "@/lib/dates";
import { prisma } from "@/lib/db";
import { sumCollections } from "@/server/ledger";

export const PAGE_SIZE = 15;

const activeScheme: Prisma.SchemeWhereInput = {
  status: "active",
  archivedAt: null,
  customer: { status: "active" },
};

export async function businessName() {
  const settings = await prisma.appSetting.findUnique({ where: { id: "default" } });
  return settings?.businessName ?? "Gold Savings";
}

function searchTerms(q: string, tokens: string[]) {
  return [...tokens, q].map((item) => item.trim()).filter(Boolean);
}

function phoneNeedle(term: string) {
  return term.replace(/\D/g, "") || term;
}

function customerTerm(term: string, scope: string): Prisma.CustomerWhereInput {
  if (scope === "name") return { fullName: { contains: term, mode: "insensitive" } };
  if (scope === "id") return { customerCode: { contains: term, mode: "insensitive" } };
  if (scope === "phone") return { phone: { contains: phoneNeedle(term) } };
  if (scope === "scheme") return { customerCode: { equals: "" } };
  return {
    OR: [
      { customerCode: { contains: term, mode: "insensitive" } },
      { fullName: { contains: term, mode: "insensitive" } },
      { phone: { contains: phoneNeedle(term) } },
    ],
  };
}

function schemeTerm(term: string, scope: string): Prisma.SchemeWhereInput {
  if (scope === "scheme") return { schemeCode: { contains: term, mode: "insensitive" } };
  if (scope === "customer" || scope === "name") {
    return {
      OR: [
        { customer: { fullName: { contains: term, mode: "insensitive" } } },
        { customer: { customerCode: { contains: term, mode: "insensitive" } } },
      ],
    };
  }
  if (scope === "id") return { customer: { customerCode: { contains: term, mode: "insensitive" } } };
  if (scope === "phone") return { customer: { phone: { contains: phoneNeedle(term) } } };
  return {
    OR: [
      { schemeCode: { contains: term, mode: "insensitive" } },
      { customer: { fullName: { contains: term, mode: "insensitive" } } },
      { customer: { customerCode: { contains: term, mode: "insensitive" } } },
      { customer: { phone: { contains: phoneNeedle(term) } } },
    ],
  };
}

export async function searchCustomers(q: string, page: number, scope = "all", tokens: string[] = []) {
  await requireOwner();
  const terms = searchTerms(q, tokens);
  const where: Prisma.CustomerWhereInput = {
    status: "active",
    ...(terms.length ? { AND: terms.map((term) => customerTerm(term, scope)) } : {}),
  };
  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { schemes: { where: activeScheme, take: 1 } },
    }),
  ]);
  return { customers, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getCustomer(id: string) {
  await requireOwner();
  return prisma.customer.findUnique({
    where: { id },
    include: {
      schemes: {
        orderBy: { createdAt: "desc" },
        include: {
          installments: {
            orderBy: { installmentNumber: "asc" },
            include: { transactions: { where: { reversedAt: null } } },
          },
        },
      },
    },
  });
}

export async function activeCustomers() {
  await requireOwner();
  return prisma.customer.findMany({
    where: { status: "active" },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, customerCode: true, phone: true },
  });
}

export async function listSchemes(q: string, page: number, scope = "all", tokens: string[] = []) {
  await requireOwner();
  const terms = searchTerms(q, tokens);
  const where: Prisma.SchemeWhereInput = {
    ...activeScheme,
    ...(terms.length ? { AND: terms.map((term) => schemeTerm(term, scope)) } : {}),
  };
  const [total, schemes] = await Promise.all([
    prisma.scheme.count({ where }),
    prisma.scheme.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        customer: true,
        installments: { include: { transactions: { where: { reversedAt: null }, select: { id: true } } } },
      },
    }),
  ]);
  return { schemes, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getScheme(id: string) {
  await requireOwner();
  return prisma.scheme.findUnique({
    where: { id },
    include: {
      customer: true,
      installments: {
        orderBy: { installmentNumber: "asc" },
        include: { transactions: { orderBy: { createdAt: "desc" } } },
      },
      transactions: { where: { reversedAt: null } },
    },
  });
}

export async function listArchived(q: string, page: number, scope = "all", tokens: string[] = []) {
  await requireOwner();
  const terms = searchTerms(q, tokens);
  const where: Prisma.SchemeWhereInput = {
    AND: [
      { OR: [{ archivedAt: { not: null } }, { customer: { status: "inactive" } }] },
      ...terms.map((term) => schemeTerm(term, scope)),
    ],
  };
  const customerWhere: Prisma.CustomerWhereInput = {
    status: "inactive",
    ...(terms.length ? { AND: terms.map((term) => customerTerm(term, scope === "scheme" ? "scheme" : scope === "name" ? "name" : scope)) } : {}),
  };
  const [total, schemes, customers] = await Promise.all([
    prisma.scheme.count({ where }),
    prisma.scheme.findMany({
      where,
      orderBy: [{ archivedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { customer: true },
    }),
    prisma.customer.findMany({
      where: customerWhere,
      orderBy: { fullName: "asc" },
      include: { _count: { select: { schemes: true } } },
    }),
  ]);
  return { schemes, customers, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function dashboardData(preset: DateRangePreset, customFrom?: string, customTo?: string) {
  await requireOwner();
  const today = kolkataToday();
  const range = rangeForPreset(preset, today, customFrom, customTo);
  const month = { from: startOfMonth(today), to: endOfMonth(today) };
  const year = { from: startOfYear(today), to: endOfYear(today) };

  const unpaidActive = {
    scheme: activeScheme,
    transactions: { none: { reversedAt: null } },
  };

  const [
    customers,
    activeSchemes,
    collectionsToday,
    collectionsMonth,
    collectionsYear,
    overdue,
    overdueRows,
    completedRows,
    newCustomers,
    rangePayments,
    settings,
  ] = await Promise.all([
    prisma.customer.count({ where: { status: "active" } }),
    prisma.scheme.count({ where: activeScheme }),
    sumCollections(today, today),
    sumCollections(month.from, month.to),
    sumCollections(year.from, year.to),
    prisma.installment.count({
      where: { ...unpaidActive, dueDate: { lt: toDateOnly(today) } },
    }),
    prisma.installment.findMany({
      where: { ...unpaidActive, dueDate: { lt: toDateOnly(today) } },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: { scheme: { include: { customer: true } } },
    }),
    prisma.scheme.findMany({
      where: { status: "completed" },
      orderBy: { completionDate: "desc" },
      take: 5,
      include: { customer: true },
    }),
    prisma.customer.findMany({ where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.transaction.findMany({
      where: {
        reversedAt: null,
        paymentDate: { gte: toDateOnly(range.from), lte: toDateOnly(range.to) },
      },
      select: { paymentDate: true, amountReceivedPaise: true },
    }),
    prisma.appSetting.findUnique({ where: { id: "default" } }),
  ]);

  const span = eachDate(range.from, range.to);
  const useMonths = span.length > 62;
  const buckets = new Map<string, number>();
  if (useMonths) {
    for (const day of span) buckets.set(day.slice(0, 7), 0);
  } else {
    for (const day of span) buckets.set(day, 0);
  }
  for (const row of rangePayments) {
    const iso = fromDateOnly(row.paymentDate);
    const key = useMonths ? iso.slice(0, 7) : iso;
    buckets.set(key, (buckets.get(key) ?? 0) + row.amountReceivedPaise);
  }
  const chart = [...buckets.entries()].map(([key, paise]) => ({
    key,
    paise,
  }));

  return {
    today,
    range,
    cards: {
      customers,
      activeSchemes,
      collectionsToday,
      collectionsMonth,
      collectionsYear,
      overdue,
    },
    overdueRows,
    completedRows,
    newCustomers,
    chart,
    allowMultiple: settings?.allowMultipleActiveSchemes ?? false,
  };
}

export async function getSettings() {
  await requireOwner();
  const settings = await prisma.appSetting.findUnique({ where: { id: "default" } });
  return {
    businessName: settings?.businessName ?? "Gold Savings",
    allowMultipleActiveSchemes: settings?.allowMultipleActiveSchemes ?? false,
  };
}
