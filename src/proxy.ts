import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/features',
  '/about',
  '/maintenance',
  '/api/webhooks/clerk(.*)',
  '/api/system-settings',
  '/api/emergency-maintenance-off',  // Emergency route
  '/api/promo-modal/active',
])

// Cache for admin check to avoid too many DB calls
let adminCache = new Map<string, { isAdmin: boolean, timestamp: number }>()
const CACHE_DURATION = 5000 // 5 seconds

async function isUserAdmin(userId: string): Promise<boolean> {
  const now = Date.now()
  const cached = adminCache.get(userId)
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.isAdmin
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true }
    })
    
    const isAdmin = user?.isAdmin || false
    adminCache.set(userId, { isAdmin, timestamp: now })
    return isAdmin
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname
  
  // Always allow maintenance page
  if (pathname === '/maintenance') {
    return
  }
  
  // Check maintenance mode
  let maintenanceMode = false
  try {
    const settings = await prisma.systemSettings.findFirst()
    maintenanceMode = settings?.maintenanceMode || false
  } catch (error) {
    console.error('Settings check error:', error)
  }
  
  if (maintenanceMode) {
    const { userId } = await auth()
    
    // Check if user is admin
    const isAdmin = userId ? await isUserAdmin(userId) : false
    
    if (isAdmin) {
      // Admin - let them through to everything
      if (!isPublicRoute(request)) {
        await auth.protect()
      }
      return
    }
    
    // Not admin - only allow public routes
    if (isPublicRoute(request)) {
      return
    }
    
    // Redirect to maintenance
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }
  
  // Normal mode - regular auth protection
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}