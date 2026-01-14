import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

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
    const user = await prisma.user.findUnique({
      where: { email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ 
        success: false,
        error: 'Not an admin'
      }, { status: 403 })
    }

    // Get PIN from request
    const { pin } = await request.json()

    // Verify PIN against environment variable
    const correctPin = process.env.ADMIN_PIN

    if (!correctPin) {
      console.error('ADMIN_PIN not set in environment')
      return NextResponse.json({ 
        success: false,
        error: 'Server configuration error'
      }, { status: 500 })
    }

    // Add delay to prevent brute force
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (pin !== correctPin) {
      // Log failed attempt
      await prisma.adminLog.create({
        data: {
          adminEmail: email,
          action: 'pin_verification_failed',
          details: {
            timestamp: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({ 
        success: false,
        error: 'Invalid PIN'
      }, { status: 401 })
    }

    // PIN correct - create session cookie
    const cookieStore = await cookies()
    const sessionData = {
      email,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }

    cookieStore.set('admin_verified', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    // Log successful verification
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'pin_verified',
        details: {
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