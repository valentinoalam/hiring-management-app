import "server-only";
import { PrismaClient } from '../generated/prisma/client' // New import path
import { PrismaPg } from '@prisma/adapter-pg' // Install your adapter
import { Pool } from 'pg' 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const adapter = new PrismaPg(pool)

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

function createPrismaClient() {
  const client = new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
    errorFormat: 'minimal',
  })

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