import "server-only";
import { PrismaClient } from '../generated/prisma/client' // New import path
import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from "@prisma/extension-accelerate"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 20, // maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
console.log(typeof PrismaClient)
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({adapter}).$extends(withAccelerate())


if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}