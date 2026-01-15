// FILE LOCATION: /src/app/api/nreadr/trigger-expirations/route.ts
// PURPOSE: Manual trigger for ALL automated expiration/cleanup tasks
// SECURITY: Requires admin authentication

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'

/**
 * POST /api/nreadr/trigger-expirations
 * 
 * Manually triggers various expiration/cleanup tasks:
 * 1. Trial Expiration - Expired trial users → free
 * 2. Subscription Expiration - Expired manual premium/enterprise → free (NOT Stripe)
 * 3. Account Deletion - Accounts marked for deletion 60+ days ago
 * 4. Banner Expiration - Expired banners → inactive
 * 
 * Body: { task: "all" | "trials" | "subscriptions" | "accounts" | "banners" }
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================
    // STEP 1: VERIFY ADMIN AUTHENTICATION
    // ============================================
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true, email: true }
    })
    
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }
    
    // ============================================
    // STEP 2: DETERMINE WHICH TASK TO RUN
    // ============================================
    const body = await request.json()
    const task = body.task || 'all'
    
    console.log(`🔄 Admin ${user.email} triggered: ${task}`)
    
    const now = new Date()
    const results: any = {
      triggeredBy: user.email,
      timestamp: now.toISOString(),
      tasks: {}
    }
    
    // ============================================
    // TASK 1: EXPIRE TRIALS
    // ============================================
    if (task === 'all' || task === 'trials') {
      console.log('📋 Running: Trial Expiration')
      
      const expiredTrials = await prisma.user.findMany({
        where: {
          subscriptionStatus: 'trial',
          trialEndsAt: { lt: now }
        },
        select: { id: true, email: true, firstName: true, lastName: true, trialEndsAt: true }
      })
      
      let trialsSuccess = 0
      let trialsFailed = 0
      const trialsDetails = []
      
      for (const trialUser of expiredTrials) {
        try {
          // trialEndsAt is guaranteed to exist because of the WHERE clause
          if (!trialUser.trialEndsAt) continue
          
          const expiredHours = Math.floor((now.getTime() - new Date(trialUser.trialEndsAt).getTime()) / (1000 * 60 * 60))
          const expiredDays = Math.floor(expiredHours / 24)
          
          await prisma.user.update({
            where: { id: trialUser.id },
            data: { subscriptionStatus: 'free' }
          })
          
          await prisma.adminLog.create({
            data: {
              adminEmail: user.email,
              action: 'trial_expired_manual',
              details: {
                userId: trialUser.id,
                userEmail: trialUser.email,
                userName: `${trialUser.firstName || ''} ${trialUser.lastName || ''}`.trim(),
                trialEndsAt: trialUser.trialEndsAt,
                expiredHoursAgo: expiredHours,
                expiredDaysAgo: expiredDays,
                method: 'manual-trigger'
              }
            }
          })
          
          trialsSuccess++
          trialsDetails.push({
            email: trialUser.email,
            name: `${trialUser.firstName || ''} ${trialUser.lastName || ''}`.trim(),
            expiredHoursAgo: expiredHours,
            expiredDaysAgo: expiredDays,
            status: 'success'
          })
        } catch (error: any) {
          trialsFailed++
          trialsDetails.push({
            email: trialUser.email,
            name: `${trialUser.firstName || ''} ${trialUser.lastName || ''}`.trim(),
            status: 'failed',
            error: error.message
          })
        }
      }
      
      results.tasks.trials = {
        total: expiredTrials.length,
        success: trialsSuccess,
        failed: trialsFailed,
        details: trialsDetails
      }
    }
    
    // ============================================
    // TASK 2: EXPIRE MANUAL SUBSCRIPTIONS
    // ============================================
    if (task === 'all' || task === 'subscriptions') {
      console.log('📋 Running: Subscription Expiration (Manual Only)')
      
      const expiredSubs = await prisma.user.findMany({
        where: {
          subscriptionStatus: { in: ['premium', 'enterprise'] },
          subscriptionEndsAt: { lt: now },
          stripeSubscriptionId: null // ONLY manual subscriptions, NOT Stripe
        },
        select: { 
          id: true, 
          email: true, 
          firstName: true, 
          lastName: true, 
          subscriptionStatus: true, 
          subscriptionEndsAt: true,
          subscriptionSource: true
        }
      })
      
      let subsSuccess = 0
      let subsFailed = 0
      const subsDetails = []
      
      for (const sub of expiredSubs) {
        try {
          // subscriptionEndsAt is guaranteed to exist because of the WHERE clause
          if (!sub.subscriptionEndsAt) continue
          
          const expiredDays = Math.floor((now.getTime() - new Date(sub.subscriptionEndsAt).getTime()) / (1000 * 60 * 60 * 24))
          
          await prisma.user.update({
            where: { id: sub.id },
            data: { subscriptionStatus: 'free' }
          })
          
          await prisma.adminLog.create({
            data: {
              adminEmail: user.email,
              action: 'subscription_expired_manual',
              details: {
                userId: sub.id,
                userEmail: sub.email,
                userName: `${sub.firstName || ''} ${sub.lastName || ''}`.trim(),
                previousStatus: sub.subscriptionStatus,
                subscriptionEndsAt: sub.subscriptionEndsAt,
                expiredDaysAgo: expiredDays,
                subscriptionSource: sub.subscriptionSource,
                method: 'manual-trigger'
              }
            }
          })
          
          subsSuccess++
          subsDetails.push({
            email: sub.email,
            name: `${sub.firstName || ''} ${sub.lastName || ''}`.trim(),
            previousStatus: sub.subscriptionStatus,
            expiredDaysAgo: expiredDays,
            source: sub.subscriptionSource,
            status: 'success'
          })
        } catch (error: any) {
          subsFailed++
          subsDetails.push({
            email: sub.email,
            name: `${sub.firstName || ''} ${sub.lastName || ''}`.trim(),
            status: 'failed',
            error: error.message
          })
        }
      }
      
      results.tasks.subscriptions = {
        total: expiredSubs.length,
        success: subsSuccess,
        failed: subsFailed,
        details: subsDetails
      }
    }
    
    // ============================================
    // TASK 3: DELETE EXPIRED ACCOUNTS
    // ============================================
    if (task === 'all' || task === 'accounts') {
      console.log('📋 Running: Account Deletion (60+ days)')
      
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      
      const expiredAccounts = await prisma.user.findMany({
        where: {
          accountStatus: 'pending_deletion',
          markedForDeletionAt: { lte: sixtyDaysAgo }
        },
        select: { 
          id: true, 
          clerkId: true, 
          email: true, 
          firstName: true, 
          lastName: true, 
          markedForDeletionAt: true 
        },
        take: 50 // Process max 50 at once to avoid timeout
      })
      
      let accountsSuccess = 0
      let accountsFailed = 0
      const accountsDetails = []
      
      for (const account of expiredAccounts) {
        try {
          // markedForDeletionAt is guaranteed to exist because of the WHERE clause
          if (!account.markedForDeletionAt) continue
          
          const daysAgo = Math.floor((now.getTime() - new Date(account.markedForDeletionAt).getTime()) / (1000 * 60 * 60 * 24))
          
          // Delete from Clerk
          try {
            const clerk = await clerkClient()
            await clerk.users.deleteUser(account.clerkId)
          } catch (clerkError) {
            console.error(`Clerk deletion failed for ${account.email}:`, clerkError)
            // Continue with database deletion even if Clerk fails
          }
          
          // Delete from database (cascade will delete all related records)
          await prisma.user.delete({
            where: { id: account.id }
          })
          
          await prisma.adminLog.create({
            data: {
              adminEmail: user.email,
              action: 'account_deleted_manual',
              details: {
                userId: account.id,
                userEmail: account.email,
                userName: `${account.firstName || ''} ${account.lastName || ''}`.trim(),
                markedForDeletionAt: account.markedForDeletionAt,
                daysAfterMark: daysAgo,
                method: 'manual-trigger'
              }
            }
          })
          
          accountsSuccess++
          accountsDetails.push({
            email: account.email,
            name: `${account.firstName || ''} ${account.lastName || ''}`.trim(),
            daysAgo: daysAgo,
            status: 'success'
          })
        } catch (error: any) {
          accountsFailed++
          accountsDetails.push({
            email: account.email,
            name: `${account.firstName || ''} ${account.lastName || ''}`.trim(),
            status: 'failed',
            error: error.message
          })
        }
      }
      
      results.tasks.accounts = {
        total: expiredAccounts.length,
        success: accountsSuccess,
        failed: accountsFailed,
        details: accountsDetails
      }
    }
    
    // ============================================
    // TASK 4: EXPIRE BANNERS
    // ============================================
    if (task === 'all' || task === 'banners') {
      console.log('📋 Running: Banner Expiration')
      
      const expiredBanners = await prisma.banner.findMany({
        where: {
          isActive: true,
          endDate: { 
            not: null,
            lt: now 
          }
        },
        select: { 
          id: true, 
          message: true, 
          type: true, 
          endDate: true,
          targetAudience: true
        }
      })
      
      let bannersSuccess = 0
      let bannersFailed = 0
      const bannersDetails = []
      
      for (const banner of expiredBanners) {
        try {
          // endDate is guaranteed to exist because of the WHERE clause
          if (!banner.endDate) continue
          
          const expiredDays = Math.floor((now.getTime() - new Date(banner.endDate).getTime()) / (1000 * 60 * 60 * 24))
          
          await prisma.banner.update({
            where: { id: banner.id },
            data: { isActive: false }
          })
          
          await prisma.adminLog.create({
            data: {
              adminEmail: user.email,
              action: 'banner_expired_manual',
              details: {
                bannerId: banner.id,
                message: banner.message,
                type: banner.type,
                targetAudience: banner.targetAudience,
                endDate: banner.endDate,
                expiredDaysAgo: expiredDays,
                method: 'manual-trigger'
              }
            }
          })
          
          bannersSuccess++
          bannersDetails.push({
            message: banner.message.substring(0, 60) + (banner.message.length > 60 ? '...' : ''),
            type: banner.type,
            targetAudience: banner.targetAudience,
            expiredDaysAgo: expiredDays,
            status: 'success'
          })
        } catch (error: any) {
          bannersFailed++
          bannersDetails.push({
            message: banner.message.substring(0, 60),
            status: 'failed',
            error: error.message
          })
        }
      }
      
      results.tasks.banners = {
        total: expiredBanners.length,
        success: bannersSuccess,
        failed: bannersFailed,
        details: bannersDetails
      }
    }
    
    // ============================================
    // RETURN COMPREHENSIVE RESULTS
    // ============================================
    console.log('✅ Manual expiration trigger completed:', task)
    
    return NextResponse.json({
      success: true,
      message: `Successfully triggered: ${task}`,
      ...results
    })
    
  } catch (error: any) {
    console.error('❌ Manual expiration trigger error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to trigger expirations',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}