// lib/test-db.ts
import { prisma } from './prisma'

async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test a simple query
    const result = await prisma.user.findFirst()
    console.log('✅ Database query successful', result)
    
    await prisma.$disconnect()
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

testConnection()