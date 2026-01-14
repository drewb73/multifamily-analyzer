import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// POST - Restore account marked for deletion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params

    // Get user to verify they're pending deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        accountStatus: true,
        email: true,
        firstName: true,
        lastName: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    if (user.accountStatus !== 'pending_deletion') {
      return NextResponse.json({ 
        success: false,
        error: 'Account is not marked for deletion'
      }, { status: 400 })
    }

    // Restore account
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'active',
        markedForDeletionAt: null,
        deletedBy: null
      }
    })

    // Log action
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'user_account_restored',
        details: {
          userId,
          userEmail: user.email,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          restoredBy: email
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Account restored successfully'
    })
  } catch (error: any) {
    console.error('Restore account error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to restore account'
    }, { status: 500 })
  }
}