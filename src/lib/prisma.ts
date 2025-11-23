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

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

function createPrismaClient() {
  const client = new PrismaClient({
    adapter,
  }).$extends(withAccelerate())

  // Add connection error handling
  client.$connect().catch((error: unknown) => {
    console.error('❌ Failed to connect to database:', error)
    process.exit(1)
  })

  return client
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}