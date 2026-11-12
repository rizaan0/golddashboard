import { Prisma } from "@prisma/client";
import { writeAudit } from "@/lib/audit";
import { buildDueDates, fromDateOnly, isISODate, toDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { PAYMENT_METHODS, SCHEME_DURATION, shouldCompleteScheme, shouldReopenScheme } from "@/lib/scheme-rules";

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerError";
  }
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function nextCustomerCode(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<{ n: bigint }[]>`SELECT nextval('customer_code_seq')::bigint AS n`;
  return `CUS-${rows[0].n.toString()}`;
}

async function nextSchemeCode(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<{ n: bigint }[]>`SELECT nextval('scheme_code_seq')::bigint AS n`;
  return `SCH-${rows[0].n.toString()}`;
}

async function nextTransactionCode(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<{ n: bigint }[]>`SELECT nextval('transaction_code_seq')::bigint AS n`;
  return `TXN-${rows[0].n.toString()}`;
}

export async function createCustomer(
  userId: string,
  input: { fullName: string; phone: string; address?: string; notes?: string },
) {
  const fullName = input.fullName.trim();
  if (fullName.length < 2) throw new LedgerError("Enter the customer's full name.");
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        customerCode: await nextCustomerCode(tx),
        fullName,
        phone: input.phone,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        status: "active",
      },
    });
    await writeAudit(tx, {
      userId,
      entityType: "customer",
      entityId: customer.id,
      action: "create",
      newValues: { customerCode: customer.customerCode, fullName, phone: input.phone },
    });
    return customer;
  });
}

export async function updateCustomer(
  userId: string,
  input: {
    id: string;
    fullName: string;
    phone: string;
    address?: string;
    notes?: string;
    status: "active" | "inactive";
  },
) {
  const fullName = input.fullName.trim();
  if (fullName.length < 2) throw new LedgerError("Enter the customer's full name.");
  return prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUnique({ where: { id: input.id } });
    if (!existing) throw new LedgerError("Customer not found.");
    const customer = await tx.customer.update({
      where: { id: input.id },
      data: {
        fullName,
        phone: input.phone,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        status: input.status,
      },
    });
    await writeAudit(tx, {
      userId,
      entityType: "customer",
      entityId: customer.id,
      action: "update",
      previousValues: {
        fullName: existing.fullName,
        phone: existing.phone,
        status: existing.status,
      },
      newValues: { fullName, phone: input.phone, status: input.status },
    });
    return customer;
  });
}

export async function createScheme(
  userId: string,
  input: { customerId: string; monthlyInstallmentPaise: number; startDate: string },
) {
  if (input.monthlyInstallmentPaise <= 0) {
    throw new LedgerError("Installment amount must be greater than zero.");
  }
  if (!isISODate(input.startDate)) throw new LedgerError("Enter a valid start date.");

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw new LedgerError("Customer not found.");
    if (customer.status !== "active") {
      throw new LedgerError("Inactive customers cannot start a new scheme.");
    }

    const settings = await tx.appSetting.findUnique({ where: { id: "default" } });
    if (!settings?.allowMultipleActiveSchemes) {
      const active = await tx.scheme.count({
        where: { customerId: customer.id, status: "active", archivedAt: null },
      });
      if (active > 0) throw new LedgerError("This customer already has an active scheme.");
    }

    const dueDates = buildDueDates(input.startDate, SCHEME_DURATION);
    const scheme = await tx.scheme.create({
      data: {
        customerId: customer.id,
        schemeCode: await nextSchemeCode(tx),
        monthlyInstallmentPaise: input.monthlyInstallmentPaise,
        durationMonths: SCHEME_DURATION,
        startDate: toDateOnly(input.startDate),
        totalAmountPaise: input.monthlyInstallmentPaise * SCHEME_DURATION,
        status: "active",
        installments: {
          create: dueDates.map((due, index) => ({
            installmentNumber: index + 1,
            dueDate: toDateOnly(due),
            amountDuePaise: input.monthlyInstallmentPaise,
          })),
        },
      },
    });
    await writeAudit(tx, {
      userId,
      entityType: "scheme",
      entityId: scheme.id,
      action: "create",
      newValues: {
        schemeCode: scheme.schemeCode,
        customerId: customer.id,
        monthlyInstallmentPaise: input.monthlyInstallmentPaise,
        startDate: input.startDate,
      },
    });
    return scheme;
  });
}

export async function updateSchemeTerms(
  userId: string,
  input: { schemeId: string; monthlyInstallmentPaise: number; startDate: string },
) {
  if (input.monthlyInstallmentPaise <= 0) {
    throw new LedgerError("Installment amount must be greater than zero.");
  }
  if (!isISODate(input.startDate)) throw new LedgerError("Enter a valid start date.");

  return prisma.$transaction(async (tx) => {
    const scheme = await tx.scheme.findUnique({ where: { id: input.schemeId } });
    if (!scheme) throw new LedgerError("Scheme not found.");
    if (scheme.status !== "active" || scheme.archivedAt) {
      throw new LedgerError("Only an active scheme can be edited.");
    }
    const payments = await tx.transaction.count({ where: { schemeId: scheme.id } });
    if (payments > 0) {
      throw new LedgerError("Installment amount and start date are locked after a payment is recorded.");
    }

    await tx.installment.deleteMany({ where: { schemeId: scheme.id } });
    const dueDates = buildDueDates(input.startDate, SCHEME_DURATION);
    await tx.installment.createMany({
      data: dueDates.map((due, index) => ({
        schemeId: scheme.id,
        installmentNumber: index + 1,
        dueDate: toDateOnly(due),
        amountDuePaise: input.monthlyInstallmentPaise,
      })),
    });
    const updated = await tx.scheme.update({
      where: { id: scheme.id },
      data: {
        monthlyInstallmentPaise: input.monthlyInstallmentPaise,
        startDate: toDateOnly(input.startDate),
        totalAmountPaise: input.monthlyInstallmentPaise * SCHEME_DURATION,
      },
    });
    await writeAudit(tx, {
      userId,
      entityType: "scheme",
      entityId: scheme.id,
      action: "update_terms",
      previousValues: {
        monthlyInstallmentPaise: scheme.monthlyInstallmentPaise,
        startDate: fromDateOnly(scheme.startDate),
      },
      newValues: {
        monthlyInstallmentPaise: input.monthlyInstallmentPaise,
        startDate: input.startDate,
      },
    });
    return updated;
  });
}

export async function postPayment(
  userId: string,
  input: {
    installmentId: string;
    amountPaise: number;
    paymentDate: string;
    paymentMethod?: string | null;
    notes?: string | null;
  },
) {
  if (!isISODate(input.paymentDate)) throw new LedgerError("Enter a valid payment date.");
  const method = input.paymentMethod?.trim() || null;
  if (method && !PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number])) {
    throw new LedgerError("Choose a valid payment method.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM installments WHERE id = CAST(${input.installmentId} AS uuid) FOR UPDATE`;
      const installment = await tx.installment.findUnique({
        where: { id: input.installmentId },
        include: {
          scheme: true,
          transactions: { where: { reversedAt: null }, select: { id: true } },
        },
      });
      if (!installment) throw new LedgerError("Installment not found.");
      if (installment.scheme.status !== "active" || installment.scheme.archivedAt) {
        throw new LedgerError("Payments can only be recorded on an active scheme.");
      }
      if (installment.transactions.length > 0) {
        throw new LedgerError("This installment is already paid.");
      }
      if (input.amountPaise !== installment.amountDuePaise) {
        throw new LedgerError("The amount must match the full installment. Partial payments are not allowed.");
      }

      const transaction = await tx.transaction.create({
        data: {
          transactionCode: await nextTransactionCode(tx),
          customerId: installment.scheme.customerId,
          schemeId: installment.schemeId,
          installmentId: installment.id,
          amountReceivedPaise: input.amountPaise,
          paymentDate: toDateOnly(input.paymentDate),
          paymentMethod: method,
          notes: input.notes?.trim() || null,
        },
      });

      const posted = await tx.transaction.count({
        where: { schemeId: installment.schemeId, reversedAt: null },
      });
      if (shouldCompleteScheme(posted, installment.scheme.durationMonths)) {
        await tx.scheme.update({
          where: { id: installment.schemeId },
          data: { status: "completed", completionDate: toDateOnly(input.paymentDate) },
        });
      }

      await writeAudit(tx, {
        userId,
        entityType: "transaction",
        entityId: transaction.id,
        action: "create",
        newValues: {
          transactionCode: transaction.transactionCode,
          installmentNumber: installment.installmentNumber,
          amountReceivedPaise: input.amountPaise,
          paymentDate: input.paymentDate,
        },
      });
      return transaction;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new LedgerError("This installment is already paid.");
    throw error;
  }
}

export async function reversePayment(userId: string, input: { transactionId: string; reason?: string }) {
  const reason = input.reason?.trim() || "Corrected on the scheme";

  return prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({
      where: { id: input.transactionId },
      include: { scheme: true },
    });
    if (!existing) throw new LedgerError("Transaction not found.");
    if (existing.reversedAt) throw new LedgerError("This payment has already been reversed.");

    await tx.$queryRaw`SELECT id FROM installments WHERE id = CAST(${existing.installmentId} AS uuid) FOR UPDATE`;

    const updated = await tx.transaction.update({
      where: { id: existing.id },
      data: { reversedAt: new Date(), reversalReason: reason },
    });

    const posted = await tx.transaction.count({
      where: { schemeId: existing.schemeId, reversedAt: null },
    });
    let reopened = false;
    if (shouldReopenScheme(posted, existing.scheme.durationMonths)) {
      reopened = existing.scheme.status !== "active" || existing.scheme.archivedAt !== null || existing.scheme.completionDate !== null;
      await tx.scheme.update({
        where: { id: existing.schemeId },
        data: { status: "active", completionDate: null, archivedAt: null },
      });
    }

    await writeAudit(tx, {
      userId,
      entityType: "transaction",
      entityId: existing.id,
      action: "reverse",
      previousValues: {
        schemeStatus: existing.scheme.status,
        archivedAt: existing.scheme.archivedAt?.toISOString() ?? null,
        completionDate: existing.scheme.completionDate ? fromDateOnly(existing.scheme.completionDate) : null,
      },
      newValues: { reason, postedCount: posted, reopened },
    });
    return updated;
  });
}

export async function archiveScheme(userId: string, schemeId: string) {
  return prisma.$transaction(async (tx) => {
    const scheme = await tx.scheme.findUnique({ where: { id: schemeId } });
    if (!scheme) throw new LedgerError("Scheme not found.");
    if (scheme.status !== "completed" || scheme.archivedAt) {
      throw new LedgerError("Only a completed scheme can be archived.");
    }
    const updated = await tx.scheme.update({
      where: { id: scheme.id },
      data: { archivedAt: new Date() },
    });
    await writeAudit(tx, {
      userId,
      entityType: "scheme",
      entityId: scheme.id,
      action: "archive",
      newValues: { schemeCode: scheme.schemeCode },
    });
    return updated;
  });
}

export async function restoreScheme(userId: string, schemeId: string) {
  return prisma.$transaction(async (tx) => {
    const scheme = await tx.scheme.findUnique({ where: { id: schemeId } });
    if (!scheme) throw new LedgerError("Scheme not found.");
    if (!scheme.archivedAt) throw new LedgerError("This scheme is not archived.");
    const updated = await tx.scheme.update({
      where: { id: scheme.id },
      data: { archivedAt: null },
    });
    await writeAudit(tx, {
      userId,
      entityType: "scheme",
      entityId: scheme.id,
      action: "restore",
      newValues: { schemeCode: scheme.schemeCode },
    });
    return updated;
  });
}

export type ReportFilters = {
  from: string;
  to: string;
  customerId?: string;
  schemeStatus?: string;
  paymentMethod?: string;
};

function schemeFilter(status?: string): Prisma.SchemeWhereInput | undefined {
  if (status === "active") return { status: "active", archivedAt: null };
  if (status === "completed") return { status: "completed" };
  if (status === "archived") return { archivedAt: { not: null } };
  return undefined;
}

export async function getReport(filters: ReportFilters) {
  const scheme = schemeFilter(filters.schemeStatus);
  const where: Prisma.TransactionWhereInput = {
    reversedAt: null,
    paymentDate: { gte: toDateOnly(filters.from), lte: toDateOnly(filters.to) },
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
    ...(scheme ? { scheme } : {}),
  };
  const transactions = await prisma.transaction.findMany({
    where,
    include: { customer: true, scheme: true, installment: true },
    orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
  });
  const totalPaise = transactions.reduce((sum, row) => sum + row.amountReceivedPaise, 0);
  const customers = new Set(transactions.map((row) => row.customerId)).size;
  return { transactions, totalPaise, installmentCount: transactions.length, customerCount: customers };
}

export async function sumCollections(from: string, to: string) {
  const result = await prisma.transaction.aggregate({
    where: {
      reversedAt: null,
      paymentDate: { gte: toDateOnly(from), lte: toDateOnly(to) },
    },
    _sum: { amountReceivedPaise: true },
  });
  return result._sum.amountReceivedPaise ?? 0;
}
