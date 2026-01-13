import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
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
// Cache for subscription check to avoid excessive DB queries
let subscriptionCheckCache = new Map<string, number>() // userId -> last check timestamp
const CACHE_DURATION = 5000 // 5 seconds
const SUBSCRIPTION_CHECK_INTERVAL = 60000 // Check subscription once per minute per user

// Global cache for account cleanup checks
let lastCleanupCheck = 0
const CLEANUP_CHECK_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes

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

// Check and auto-update expired subscriptions (NO CRON NEEDED!)
async function checkAndUpdateExpiredSubscription(userId: string): Promise<void> {
  const now = Date.now()
  const lastCheck = subscriptionCheckCache.get(userId)
  
  // Only check once per minute per user to avoid excessive DB queries
  if (lastCheck && (now - lastCheck) < SUBSCRIPTION_CHECK_INTERVAL) {
    return
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        stripeSubscriptionId: true
      }
    })
    
    if (!user) return
    
    const currentDate = new Date()
    let needsUpdate = false
    let newStatus: string | null = null
    
    // Check expired TRIAL
    if (user.subscriptionStatus === 'trial' && user.trialEndsAt && new Date(user.trialEndsAt) < currentDate) {
      needsUpdate = true
      newStatus = 'free'
      console.log(`🔄 Auto-downgrading expired trial: ${user.email}`)
    }
    
    // Check expired PREMIUM/ENTERPRISE (only if NOT Stripe-managed)
    if (
      (user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'enterprise') &&
      user.subscriptionEndsAt &&
      new Date(user.subscriptionEndsAt) < currentDate &&
      !user.stripeSubscriptionId // Don't touch Stripe subscriptions
    ) {
      needsUpdate = true
      newStatus = 'free'
      console.log(`🔄 Auto-downgrading expired premium: ${user.email}`)
    }
    
    // Update if needed
    if (needsUpdate && newStatus) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: newStatus
        }
      })
      
      // Log the auto-downgrade
      await prisma.adminLog.create({
        data: {
          adminEmail: 'system-middleware',
          action: 'subscription_auto_expired',
          details: {
            userId: user.id,
            userEmail: user.email,
            previousStatus: user.subscriptionStatus,
            newStatus: newStatus,
            expiredAt: currentDate.toISOString(),
            method: 'middleware-check'
          }
        }
      })
    }
    
    // Update cache regardless of whether we updated the subscription
    subscriptionCheckCache.set(userId, now)
  } catch (error) {
    console.error('Subscription check error:', error)
  }
}

// Check and delete ALL expired accounts in background (NO CRON NEEDED!)
// This runs whenever ANY user makes a request
async function cleanupExpiredAccountsBackground(): Promise<void> {
  const now = Date.now()
  
  // Only check every 5 minutes (avoid excessive DB queries)
  if (now - lastCleanupCheck < CLEANUP_CHECK_INTERVAL) {
    return
  }
  
  lastCleanupCheck = now
  
  try {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    
    // Find ALL users past 60 days
    const expiredUsers = await prisma.user.findMany({
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
      },
      take: 10 // Process max 10 at a time to avoid overload
    })
    
    if (expiredUsers.length === 0) {
      return // Nothing to delete
    }
    
    console.log(`🗑️ Auto-cleanup: Found ${expiredUsers.length} expired accounts to delete`)
    
    // Delete each user
    for (const user of expiredUsers) {
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
            adminEmail: 'system-auto-cleanup',
            action: 'user_permanently_deleted',
            details: {
              userId: user.id,
              userEmail: user.email,
              userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              clerkId: user.clerkId,
              markedForDeletionAt: user.markedForDeletionAt,
              deletedAt: new Date(),
              method: 'auto-cleanup-background'
            }
          }
        })
        
        console.log(`✅ Auto-deleted: ${user.email}`)
      } catch (error) {
        console.error(`Failed to delete ${user.email}:`, error)
      }
    }
  } catch (error) {
    console.error('Cleanup background error:', error)
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
  
  // Normal mode - check authentication, subscriptions, and account cleanup
  if (!isPublicRoute(request)) {
    await auth.protect()
    
    // Get userId after auth protection
    const { userId } = await auth()
    
    if (userId) {
      // Check and update expired subscriptions (NO CRON NEEDED!)
      // Run async without blocking the request
      checkAndUpdateExpiredSubscription(userId).catch(err => {
        console.error('Subscription check failed:', err)
      })
      
      // AUTO-CLEANUP: Check for expired accounts in background (NO CRON NEEDED!)
      // This runs when ANY user makes a request (not just the current user)
      // Deletes ALL users past 60 days since marked for deletion
      cleanupExpiredAccountsBackground().catch(err => {
        console.error('Account cleanup failed:', err)
      })
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}