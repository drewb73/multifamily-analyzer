// test-connection.ts - SIMPLE VERSION
import { PrismaClient } from '@prisma/client'

async function testConnection() {
  console.log('🔄 Starting MongoDB connection test...')
  
  const prisma = new PrismaClient()

  try {
    // Try to connect
    await prisma.$connect()
    console.log('✅ STEP 1: Connected to MongoDB successfully!')
    
    // Try a simple query
    const users = await prisma.user.findMany()
    console.log(`✅ STEP 2: Database query successful! Found ${users.length} users.`)
    
    console.log('🎉 All tests passed! Your database is working.')
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message)
    
    // Helpful error messages
    if (error.message.includes('Authentication failed')) {
      console.log('💡 FIX: Check your password in .env.local file')
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 FIX: Check your cluster name in connection string')
    } else if (error.message.includes('Prisma needs to perform transactions')) {
      console.log('💡 FIX: You need Prisma 6.19, not 7.x')
    } else {
      console.log('💡 FIX: Check .env.local DATABASE_URL format')
    }
    
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Connection closed.')
  }
}

// Run the test
testConnection()