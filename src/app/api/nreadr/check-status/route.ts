import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ 
        isAdmin: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    
    // Check if user is admin in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ 
        isAdmin: false,
        error: 'Not an admin'
      }, { status: 403 })
    }

    // Check if PIN is already verified (session cookie)
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_verified')
    
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession.value)
        const now = Date.now()
        
        // Session valid for 24 hours
        if (sessionData.expiresAt > now) {
          return NextResponse.json({ 
            isAdmin: true,
            needsPin: false
          })
        }
      } catch (error) {
        // Invalid session, needs PIN
      }
    }

    // Admin but needs PIN
    return NextResponse.json({ 
      isAdmin: true,
      needsPin: true
    })
  } catch (error) {
    console.error('Admin status check error:', error)
    return NextResponse.json({ 
      isAdmin: false,
      error: 'Check failed'
    }, { status: 500 })
  }
}