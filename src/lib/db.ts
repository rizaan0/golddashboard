import { PrismaClient } from "@prisma/client";

const POOL = "3";

function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    url.searchParams.set("connection_limit", POOL);
    return url.toString();
  } catch {
    if (raw.includes("connection_limit=")) return raw;
    return `${raw}${raw.includes("?") ? "&" : "?"}connection_limit=${POOL}`;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaPool?: string };

if (globalForPrisma.prisma && globalForPrisma.prismaPool !== POOL) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl() } },
  });

globalForPrisma.prisma = prisma;
globalForPrisma.prismaPool = POOL;
