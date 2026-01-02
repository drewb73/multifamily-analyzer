import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress

    // Mark user account for deletion (soft delete)
    const user = await prisma.user.update({
      where: { email },
      data: {
        accountStatus: 'pending_deletion',
        markedForDeletionAt: new Date(),
        deletedBy: 'user'
      }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminEmail: 'system',
        action: 'user_marked_for_deletion',
        details: {
          userId: user.id,
          userEmail: email,
          markedBy: 'user',
          willDeleteAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Account marked for deletion'
    })
  } catch (error) {
    console.error('Mark for deletion error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to mark account for deletion'
    }, { status: 500 })
  }
}