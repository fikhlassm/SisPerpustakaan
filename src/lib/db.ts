import { PrismaClient } from "@prisma/client"

// =====================================================
// Prisma singleton — satu instance di seluruh proses
// Log query hanya di development, bukan production
// (production logging via structured logger di Phase 3)
// =====================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
