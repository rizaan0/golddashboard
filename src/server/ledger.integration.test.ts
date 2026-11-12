import { afterAll, beforeAll, expect, it } from "vitest";
import { fromDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import {
  LedgerError,
  archiveScheme,
  createCustomer,
  createScheme,
  getReport,
  postPayment,
  reversePayment,
} from "@/server/ledger";

let userId = "";
let customerId = "";

beforeAll(async () => {
  await prisma.appSetting.upsert({
    where: { id: "default" },
    update: { allowMultipleActiveSchemes: false },
    create: { id: "default", businessName: "Gold Savings", allowMultipleActiveSchemes: false },
  });
  const user = await prisma.user.upsert({
    where: { email: "ledger-test@goldshop.local" },
    update: {},
    create: { email: "ledger-test@goldshop.local", passwordHash: "not-a-login" },
  });
  userId = user.id;
});

afterAll(async () => {
  if (customerId) {
    await prisma.transaction.deleteMany({ where: { customerId } });
    await prisma.installment.deleteMany({ where: { scheme: { customerId } } });
    await prisma.scheme.deleteMany({ where: { customerId } });
    await prisma.auditLog.deleteMany({ where: { entityId: customerId } });
    await prisma.customer.delete({ where: { id: customerId } });
  }
  await prisma.$disconnect();
});

it("posts full payments, blocks duplicates, completes, archives, and reopens on reversal", async () => {
  const customer = await createCustomer(userId, {
    fullName: "Ledger Test Customer",
    phone: "9876543210",
  });
  customerId = customer.id;
  expect(customer.customerCode).toMatch(/^CUS-\d+$/);

  const scheme = await createScheme(userId, {
    customerId,
    monthlyInstallmentPaise: 100000,
    startDate: "2026-01-31",
  });
  const loaded = await prisma.installment.findMany({
    where: { schemeId: scheme.id },
    orderBy: { installmentNumber: "asc" },
  });
  expect(loaded.map((row) => fromDateOnly(row.dueDate))).toEqual([
    "2026-01-31",
    "2026-02-28",
    "2026-03-31",
    "2026-04-30",
    "2026-05-31",
    "2026-06-30",
    "2026-07-31",
    "2026-08-31",
    "2026-09-30",
    "2026-10-31",
    "2026-11-30",
  ]);

  await expect(
    postPayment(userId, {
      installmentId: loaded[0].id,
      amountPaise: 50000,
      paymentDate: "2026-06-01",
      paymentMethod: "cash",
    }),
  ).rejects.toBeInstanceOf(LedgerError);

  await postPayment(userId, {
    installmentId: loaded[0].id,
    amountPaise: 100000,
    paymentDate: "2026-06-01",
    paymentMethod: "cash",
  });
  await expect(
    postPayment(userId, {
      installmentId: loaded[0].id,
      amountPaise: 100000,
      paymentDate: "2026-06-02",
      paymentMethod: "upi",
    }),
  ).rejects.toBeInstanceOf(LedgerError);

  for (const installment of loaded.slice(1)) {
    await postPayment(userId, {
      installmentId: installment.id,
      amountPaise: 100000,
      paymentDate: "2026-06-01",
      paymentMethod: "cash",
    });
  }

  const completed = await prisma.scheme.findUniqueOrThrow({ where: { id: scheme.id } });
  expect(completed.status).toBe("completed");
  expect(fromDateOnly(completed.completionDate!)).toBe("2026-06-01");

  await archiveScheme(userId, scheme.id);
  const report = await getReport({ from: "2026-06-01", to: "2026-06-01", customerId });
  expect(report.installmentCount).toBe(11);
  expect(report.totalPaise).toBe(1100000);
  expect(report.customerCount).toBe(1);

  const first = report.transactions[0];
  await reversePayment(userId, { transactionId: first.id, reason: "Entered on the wrong installment" });
  const reopened = await prisma.scheme.findUniqueOrThrow({ where: { id: scheme.id } });
  expect(reopened.status).toBe("active");
  expect(reopened.archivedAt).toBeNull();
  expect(reopened.completionDate).toBeNull();

  const original = await prisma.transaction.findUniqueOrThrow({ where: { id: first.id } });
  expect(original.reversedAt).not.toBeNull();

  await postPayment(userId, {
    installmentId: first.installmentId,
    amountPaise: 100000,
    paymentDate: "2026-06-03",
    paymentMethod: "bank_transfer",
  });
  const closedAgain = await prisma.scheme.findUniqueOrThrow({ where: { id: scheme.id } });
  expect(closedAgain.status).toBe("completed");
});
