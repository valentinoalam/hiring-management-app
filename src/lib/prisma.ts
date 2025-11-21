import "server-only";
import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

function createPrismaClient() {
  const client = new PrismaClient({
    log: ['query', 'error', 'warn'],
    errorFormat: 'minimal',
  })

  // Add connection error handling
  client.$connect().catch((error) => {
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