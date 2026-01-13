import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// POST - Manually trigger cleanup of expired accounts (admin only)
// This is a backup to the automatic middleware cleanup
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    
    // Verify user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authorized - admin access required'
      }, { status: 403 })
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

    console.log(`🗑️ Admin ${email} triggered cleanup: ${usersToDelete.length} accounts to delete`)

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

        // Delete from database (cascade will delete all related records)
        await prisma.user.delete({
          where: { id: user.id }
        })

        // Log deletion
        await prisma.adminLog.create({
          data: {
            adminEmail: email,
            action: 'user_permanently_deleted',
            details: {
              userId: user.id,
              userEmail: user.email,
              userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              clerkId: user.clerkId,
              markedForDeletionAt: user.markedForDeletionAt,
              deletedAt: new Date(),
              deletedBy: email,
              method: 'admin-manual-cleanup'
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
      message: `Cleanup complete: ${results.filter(r => r.status === 'deleted').length} of ${usersToDelete.length} accounts deleted`,
      total: usersToDelete.length,
      deleted: results.filter(r => r.status === 'deleted').length,
      errors: results.filter(r => r.status === 'error').length,
      results: results.length > 0 ? results : undefined
    })
  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to cleanup accounts'
    }, { status: 500 })
  }
}

// GET - Check how many accounts need cleanup (preview)
export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    
    // Verify user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authorized'
      }, { status: 403 })
    }

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    // Count users ready for deletion
    const count = await prisma.user.count({
      where: {
        accountStatus: 'pending_deletion',
        markedForDeletionAt: {
          lte: sixtyDaysAgo
        }
      }
    })

    // Get details for display (max 10 for preview)
    const users = await prisma.user.findMany({
      where: {
        accountStatus: 'pending_deletion',
        markedForDeletionAt: {
          lte: sixtyDaysAgo
        }
      },
      select: {
        email: true,
        markedForDeletionAt: true
      },
      take: 10
    })

    return NextResponse.json({
      success: true,
      count,
      preview: users.map(u => ({
        email: u.email,
        daysAgo: Math.floor((Date.now() - new Date(u.markedForDeletionAt!).getTime()) / (1000 * 60 * 60 * 24))
      }))
    })
  } catch (error: any) {
    console.error('Preview error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to get preview'
    }, { status: 500 })
  }
}