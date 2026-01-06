// COMPLETE FILE - ADMIN DASHBOARD API ROUTE WITH FIXES
// Location: src/app/api/admin/dashboard/route.ts
// Action: REPLACE ENTIRE FILE
// ✅ FIX 1: Removed ALL accountStatus filters - counts all users
// ✅ FIX 2: Revenue only counts Stripe premium users (not manual)
// ✅ FIX 3: Database size rounded to 1 decimal place

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate date ranges
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    
    const startOfMonth = new Date(now)
    startOfMonth.setDate(now.getDate() - 30)
    
    const next24Hours = new Date(now)
    next24Hours.setDate(now.getDate() + 1)
    
    const next7Days = new Date(now)
    next7Days.setDate(now.getDate() + 7)

    // ============================================
    // A) USERS OVERVIEW
    // ============================================
    
    const [
      totalUsers, 
      premiumUsers, 
      stripePremiumUsers,
      manualPremiumUsers,
      trialUsers, 
      freeUsers, 
      activeUsers
    ] = await Promise.all([
      // Total users (NO FILTER - counts everyone)
      prisma.user.count(),
      
      // Premium users (ALL - Stripe + Manual)
      prisma.user.count({
        where: {
          subscriptionStatus: 'premium'
        }
      }),

      // Stripe Premium users (for revenue calculation)
      prisma.user.count({
        where: {
          subscriptionStatus: 'premium',
          subscriptionSource: 'stripe'
        }
      }),

      // Manual Premium users (free access, no revenue)
      prisma.user.count({
        where: {
          subscriptionStatus: 'premium',
          subscriptionSource: 'manual'
        }
      }),
      
      // Trial users
      prisma.user.count({
        where: {
          subscriptionStatus: 'trial'
        }
      }),
      
      // Free users
      prisma.user.count({
        where: {
          subscriptionStatus: 'free'
        }
      }),

      // Active users (logged in last 30 days)
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: startOfMonth
          }
        }
      })
    ])

    // Total analyses
    const totalAnalyses = await prisma.propertyAnalysis.count()

    // ============================================
    // B) REVENUE & BILLING (Stripe users ONLY)
    // ============================================
    
    const premiumPrice = 7 // $7/month
    
    // MRR - ONLY from Stripe users (not manual)
    const mrr = stripePremiumUsers * premiumPrice
    
    // Expected weekly revenue - ONLY Stripe
    const expectedWeekly = (stripePremiumUsers * premiumPrice) / 4.33
    
    // Expected monthly revenue - ONLY Stripe
    const expectedMonthly = mrr

    // Premium subscriptions cancelled this month (Stripe only)
    const cancelledThisMonth = await prisma.user.count({
      where: {
        subscriptionStatus: 'free',
        subscriptionSource: 'stripe',
        subscriptionEndsAt: {
          gte: startOfMonth,
          lte: now
        }
      }
    })

    // Calculate ratios (based on ALL premium users)
    const premiumRatio = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0
    const trialRatio = totalUsers > 0 ? (trialUsers / totalUsers) * 100 : 0
    const freeRatio = totalUsers > 0 ? (freeUsers / totalUsers) * 100 : 0

    // ============================================
    // C) GROWTH & CONVERSION
    // ============================================
    
    const [newSignupsWeek, newSignupsMonth] = await Promise.all([
      // New signups this week (NO FILTER)
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfWeek
          }
        }
      }),
      
      // New signups this month (NO FILTER)
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      })
    ])

    // Trial to premium conversion rate (ALL premium users)
    const usersWhoHadTrial = await prisma.user.count({
      where: {
        hasUsedTrial: true
      }
    })
    
    const conversionRate = usersWhoHadTrial > 0 
      ? (premiumUsers / usersWhoHadTrial) * 100 
      : 0

    // Churn rate (Stripe cancellations / Stripe premium users)
    const churnRate = stripePremiumUsers > 0 
      ? (cancelledThisMonth / stripePremiumUsers) * 100 
      : 0

    // ============================================
    // D) ENGAGEMENT METRICS
    // ============================================
    
    const [analysesWeek, analysesMonth, activeUsersWeek] = await Promise.all([
      // Analyses created this week
      prisma.propertyAnalysis.count({
        where: {
          createdAt: {
            gte: startOfWeek
          }
        }
      }),
      
      // Analyses created this month
      prisma.propertyAnalysis.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),

      // Active users (logged in last 7 days) - NO FILTER
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: startOfWeek
          }
        }
      })
    ])

    // Average analyses per ALL premium user
    const avgAnalysesPerUser = premiumUsers > 0 
      ? totalAnalyses / premiumUsers 
      : 0

    // ============================================
    // E) ALERTS & ACTION ITEMS
    // ============================================
    
    const [trialsExpiring24h, trialsExpiring7d, pendingDeletions] = await Promise.all([
      // Trials expiring in next 24 hours
      prisma.user.count({
        where: {
          subscriptionStatus: 'trial',
          trialEndsAt: {
            gte: now,
            lte: next24Hours
          }
        }
      }),
      
      // Trials expiring in next 7 days
      prisma.user.count({
        where: {
          subscriptionStatus: 'trial',
          trialEndsAt: {
            gte: now,
            lte: next7Days
          }
        }
      }),

      // Accounts pending deletion
      prisma.user.count({
        where: {
          accountStatus: 'pending_deletion'
        }
      })
    ])

    // ============================================
    // F) SYSTEM HEALTH
    // ============================================
    
    // Get database stats with rounded size
    const estimatedSizeKB = (totalUsers * 2) + (totalAnalyses * 5)
    const estimatedSizeMB = estimatedSizeKB / 1024
    
    const dbStats = {
      totalUsers,
      totalAnalyses,
      totalGroups: await prisma.analysisGroup.count(),
      totalBanners: await prisma.banner.count(),
      // ✅ FIXED: Round to 1 decimal place or show KB
      estimatedSize: estimatedSizeMB < 1 
        ? `${Math.round(estimatedSizeKB)}KB` 
        : `${estimatedSizeMB.toFixed(1)}MB`
    }

    // Feature toggle status
    const systemSettings = await prisma.systemSettings.findFirst()
    
    // ============================================
    // G) RECENT ACTIVITY
    // ============================================
    
    const recentUsers = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
        subscriptionSource: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // ============================================
    // H) USER GROWTH CHART DATA (Last 30 Days)
    // ============================================
    
    const growthData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)
      
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })
      
      growthData.push({
        date: date.toISOString().split('T')[0],
        users: count
      })
    }

    // ============================================
    // RETURN ALL METRICS
    // ============================================
    
    return NextResponse.json({
      // A) Users Overview
      users: {
        total: totalUsers,
        premium: premiumUsers,
        premiumStripe: stripePremiumUsers,
        premiumManual: manualPremiumUsers,
        trial: trialUsers,
        free: freeUsers,
        active30d: activeUsers,
        active7d: activeUsersWeek,
        ratios: {
          premium: Math.round(premiumRatio * 10) / 10,
          trial: Math.round(trialRatio * 10) / 10,
          free: Math.round(freeRatio * 10) / 10
        }
      },
      
      // Total analyses
      analyses: {
        total: totalAnalyses,
        thisWeek: analysesWeek,
        thisMonth: analysesMonth,
        avgPerUser: Math.round(avgAnalysesPerUser * 10) / 10
      },
      
      // B) Revenue & Billing (STRIPE ONLY)
      revenue: {
        mrr,
        expectedWeekly: Math.round(expectedWeekly * 100) / 100,
        expectedMonthly: expectedMonthly,
        cancelledThisMonth,
        stripePremiumCount: stripePremiumUsers,
        manualPremiumCount: manualPremiumUsers
      },
      
      // C) Growth & Conversion
      growth: {
        newSignupsWeek,
        newSignupsMonth,
        conversionRate: Math.round(conversionRate * 10) / 10,
        churnRate: Math.round(churnRate * 10) / 10
      },
      
      // E) Alerts
      alerts: {
        trialsExpiring24h,
        trialsExpiring7d,
        pendingDeletions
      },
      
      // F) System Health
      system: {
        database: dbStats,
        features: {
          maintenanceMode: systemSettings?.maintenanceMode || false,
          dashboardEnabled: systemSettings?.dashboardEnabled ?? true,
          signUpEnabled: systemSettings?.signUpEnabled ?? true,
          stripeEnabled: systemSettings?.stripeEnabled ?? true,
          analysisEnabled: systemSettings?.analysisEnabled ?? true,
          pdfExportEnabled: systemSettings?.pdfExportEnabled ?? true
        }
      },
      
      // G) Recent Activity
      recentActivity: recentUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
        status: user.subscriptionStatus,
        source: user.subscriptionSource || 'not set',
        createdAt: user.createdAt,
        action: user.createdAt.getTime() > startOfWeek.getTime() ? 'signed_up' : 'active'
      })),
      
      // H) Growth Chart Data
      growthChart: growthData
    })

  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}