import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// POST - Bulk mark users for deletion (admin only, requires PIN)
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

    const body = await request.json()
    const { userIds, adminPin } = body

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No users selected'
      }, { status: 400 })
    }

    // Verify admin PIN
    const correctPin = process.env.ADMIN_PIN

    if (!correctPin || adminPin !== correctPin) {
      // Add delay to prevent brute force
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return NextResponse.json({ 
        success: false,
        error: 'Invalid admin PIN'
      }, { status: 401 })
    }

    // Get users to mark
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
        accountStatus: true
      }
    })

    if (users.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No users found with the provided IDs'
      }, { status: 404 })
    }

    // SAFETY CHECK: Prevent deletion of premium/enterprise accounts
    const premiumUsers = users.filter(u => 
      u.subscriptionStatus === 'premium' || u.subscriptionStatus === 'enterprise'
    )

    if (premiumUsers.length > 0) {
      return NextResponse.json({ 
        success: false,
        error: `Cannot mark premium/enterprise accounts for deletion. Please downgrade first.`,
        code: 'PREMIUM_ACCOUNTS',
        premiumUsers: premiumUsers.map(u => ({
          email: u.email,
          status: u.subscriptionStatus
        }))
      }, { status: 400 })
    }

    // Check for already marked users
    const alreadyMarked = users.filter(u => u.accountStatus === 'pending_deletion')
    const toMark = users.filter(u => u.accountStatus !== 'pending_deletion')

    // Mark all eligible users for deletion
    if (toMark.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: { in: toMark.map(u => u.id) }
        },
        data: {
          accountStatus: 'pending_deletion',
          markedForDeletionAt: new Date(),
          deletedBy: email
        }
      })
    }

    // Log action
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'bulk_users_marked_for_deletion',
        details: {
          totalRequested: userIds.length,
          found: users.length,
          marked: toMark.length,
          alreadyMarked: alreadyMarked.length,
          skippedPremium: premiumUsers.length,
          userEmails: toMark.map(u => u.email),
          markedBy: email
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: `Successfully marked ${toMark.length} user${toMark.length === 1 ? '' : 's'} for deletion`,
      marked: toMark.length,
      alreadyMarked: alreadyMarked.length,
      total: users.length
    })
  } catch (error: any) {
    console.error('Bulk mark for deletion error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to mark users for deletion'
    }, { status: 500 })
  }
}