import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export async function writeAudit(
  tx: Tx,
  input: {
    userId: string;
    entityType: string;
    entityId: string;
    action: string;
    previousValues?: Prisma.InputJsonValue;
    newValues?: Prisma.InputJsonValue;
  },
) {
  await tx.auditLog.create({
    data: {
      userId: input.userId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      previousValues: input.previousValues,
      newValues: input.newValues,
    },
  });
}
