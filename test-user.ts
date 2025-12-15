import { prisma } from './src/lib/prisma'

async function checkUsers() {
  const users = await prisma.user.findMany()
  
  console.log('Total users:', users.length)
  console.log('\nUser details:')
  users.forEach((user: any) => {
    console.log({
      email: user.email,
      clerkId: user.clerkId,
      subscriptionStatus: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      hasUsedTrial: user.hasUsedTrial,
      createdAt: user.createdAt
    })
  })
  
  await prisma.$disconnect()
}

checkUsers()