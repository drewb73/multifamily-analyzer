import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// POST - Verify admin PIN for critical changes
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
        error: 'Not authorized'
      }, { status: 403 })
    }

    const { adminPin, changes } = await request.json()

    // Verify PIN
    const correctPin = process.env.ADMIN_PIN

    if (!correctPin || adminPin !== correctPin) {
      // Add delay to prevent brute force
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Log failed attempt
      await prisma.adminLog.create({
        data: {
          adminEmail: email,
          action: 'settings_pin_verification_failed',
          details: {
            attemptedChanges: changes,
            timestamp: new Date().toISOString()
          }
        }
      })
      
      return NextResponse.json({ 
        success: false,
        error: 'Invalid admin PIN'
      }, { status: 401 })
    }

    // Log successful verification
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'settings_pin_verified',
        details: {
          changes,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'PIN verified'
    })
  } catch (error) {
    console.error('PIN verification error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Verification failed'
    }, { status: 500 })
  }
}