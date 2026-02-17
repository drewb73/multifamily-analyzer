// File Location: src/app/api/user/delete/route.ts
// Updated: deletes from both database AND Clerk

import { NextResponse } from 'next/server'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
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
    const clerkId = clerkUser.id

    console.log(`🗑️ Processing account deletion for: ${email}`)

    // Get user from database first
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        subscriptionStatus: true,
        isTeamMember: true,
        teamWorkspaceOwnerId: true,
        purchasedSeats: true,
        usedSeats: true,
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found in database'
      }, { status: 404 })
    }

    // If user has active Stripe subscription, don't allow delete
    if (user.subscriptionStatus === 'premium') {
      return NextResponse.json({ 
        success: false,
        error: 'Please cancel your subscription before deleting your account.'
      }, { status: 400 })
    }

    // If user is a workspace owner with team members, warn them
    if (user.purchasedSeats > 0 && user.usedSeats > 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Please remove all team members before deleting your account.'
      }, { status: 400 })
    }

    // Clean up team membership if they're a member of someone's team
    if (user.isTeamMember && user.teamWorkspaceOwnerId) {
      try {
        await prisma.$transaction(async (tx) => {
          // Remove from team member records
          await tx.workspaceTeamMember.deleteMany({
            where: { memberId: user.id }
          })

          // Free up the seat on the owner's account
          const owner = await tx.user.findUnique({
            where: { id: user.teamWorkspaceOwnerId! },
            select: { usedSeats: true, availableSeats: true, purchasedSeats: true }
          })

          if (owner) {
            await tx.user.update({
              where: { id: user.teamWorkspaceOwnerId! },
              data: {
                usedSeats: Math.max(0, owner.usedSeats - 1),
                availableSeats: Math.min(owner.purchasedSeats, owner.availableSeats + 1),
              }
            })
          }
        })
        console.log(`✅ Cleaned up team membership for: ${email}`)
      } catch (cleanupError) {
        console.error('Error cleaning up team membership:', cleanupError)
        // Continue with deletion even if cleanup fails
      }
    }

    // Mark user account in database
    await prisma.user.update({
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
          willDeleteAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
        }
      }
    })

    // Delete from Clerk immediately
    try {
      const client = await clerkClient()
      await client.users.deleteUser(clerkId)
      console.log(`✅ Deleted from Clerk: ${clerkId}`)
    } catch (clerkError: any) {
      console.error('Error deleting from Clerk:', clerkError)
      // If Clerk deletion fails, still return success for the DB side
      // The user is already marked for deletion and can't log in
      return NextResponse.json({ 
        success: true,
        message: 'Account marked for deletion. You will be signed out shortly.',
        clerkError: true,
      })
    }

    console.log(`✅ Account deletion complete for: ${email}`)

    return NextResponse.json({ 
      success: true,
      message: 'Account successfully deleted.'
    })

  } catch (error: any) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete account. Please try again.'
    }, { status: 500 })
  }
}