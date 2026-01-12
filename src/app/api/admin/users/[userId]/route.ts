import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// PATCH - Update user subscription
export async function PATCH(
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
    const body = await request.json()
    const { subscriptionStatus, premiumDuration } = body

    // Calculate dates based on new status
    let updateData: any = {
      subscriptionStatus,
      subscriptionSource: 'manual' // Always manual when set by admin
    }

    if (subscriptionStatus === 'trial') {
      // Set trial to 72 hours from now
      const trialEnd = new Date()
      trialEnd.setHours(trialEnd.getHours() + 72)
      updateData.trialEndsAt = trialEnd
      updateData.hasUsedTrial = true
    } else if (subscriptionStatus === 'premium') {
      // Set subscription based on duration (default 30 days)
      const duration = premiumDuration || 30
      const subEnd = new Date()
      
      if (duration === 9999) {
        // "Forever" - set to 100 years from now
        subEnd.setFullYear(subEnd.getFullYear() + 100)
      } else {
        subEnd.setDate(subEnd.getDate() + duration)
      }
      
      updateData.subscriptionEndsAt = subEnd
    } else if (subscriptionStatus === 'free') {
      // Clear dates
      updateData.trialEndsAt = null
      updateData.subscriptionEndsAt = null
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Log action
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'subscription_updated',
        details: {
          userId,
          newStatus: subscriptionStatus,
          updatedFields: updateData
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      user: updatedUser
    })
  } catch (error: any) {
    console.error('Update subscription error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to update subscription'
    }, { status: 500 })
  }
}