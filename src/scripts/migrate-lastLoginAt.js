// ONE-TIME MIGRATION: Initialize lastLoginAt for existing users
// Run with: node src/scripts/migrate-lastLoginAt.js
// NO TYPESCRIPT COMPILATION NEEDED!

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateLastLoginAt() {
  console.log('🔄 Starting lastLoginAt migration...')
  
  try {
    // Find all users with null lastLoginAt
    const usersToUpdate = await prisma.user.findMany({
      where: {
        lastLoginAt: null
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    })

    console.log(`📊 Found ${usersToUpdate.length} users with null lastLoginAt`)

    if (usersToUpdate.length === 0) {
      console.log('✅ No users to update!')
      return
    }

    // Update each user's lastLoginAt to their createdAt
    let updated = 0
    for (const user of usersToUpdate) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: user.createdAt
        }
      })
      updated++
      
      if (updated % 10 === 0) {
        console.log(`✅ Updated ${updated}/${usersToUpdate.length} users...`)
      }
    }

    console.log(`✅ Migration complete! Updated ${updated} users.`)
    console.log(`📈 Active Users metric should now show correct numbers.`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateLastLoginAt()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })