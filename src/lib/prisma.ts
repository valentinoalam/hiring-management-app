import "server-only";
import { PrismaClient } from '../generated/prisma/client' // New import path
import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from "@prisma/extension-accelerate"
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
const adapter = new PrismaPg(pool)
console.log(typeof PrismaClient)
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: 30000,    // Maximum time to wait for a transaction
      timeout: 120000,    // Maximum time for transaction to complete
    },
  }).$extends(withAccelerate())


if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}