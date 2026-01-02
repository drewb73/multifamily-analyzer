import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'

// This should be called by a cron job (e.g., Vercel Cron, daily)
// Add authentication token check in production
export async function POST(request: Request) {
  try {
    // Verify cron secret (add this to your env)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    // Find users marked for deletion more than 60 days ago
    const usersToDelete = await prisma.user.findMany({
      where: {
        accountStatus: 'pending_deletion',
        markedForDeletionAt: {
          lte: sixtyDaysAgo
        }
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        markedForDeletionAt: true
      }
    })

    console.log(`Found ${usersToDelete.length} accounts to permanently delete`)

    const results = []

    for (const user of usersToDelete) {
      try {
        // Delete from Clerk
        try {
          const clerk = await clerkClient()
          await clerk.users.deleteUser(user.clerkId)
        } catch (clerkError) {
          console.error(`Failed to delete ${user.email} from Clerk:`, clerkError)
          // Continue with database deletion even if Clerk fails
        }

        // Delete from database (cascade will delete related records)
        await prisma.user.delete({
          where: { id: user.id }
        })

        // Log the permanent deletion
        await prisma.adminLog.create({
          data: {
            adminEmail: 'system-cron',
            action: 'user_permanently_deleted',
            details: {
              userId: user.id,
              userEmail: user.email,
              userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              clerkId: user.clerkId,
              markedForDeletionAt: user.markedForDeletionAt,
              deletedAt: new Date()
            }
          }
        })

        results.push({
          email: user.email,
          status: 'deleted',
          markedAt: user.markedForDeletionAt
        })
      } catch (error) {
        console.error(`Failed to delete user ${user.email}:`, error)
        results.push({
          email: user.email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${usersToDelete.length} accounts`,
      results
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}