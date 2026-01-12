// COMPLETE FILE - ADMIN DASHBOARD API ROUTE WITH DATABASE SIZE FIX
// Location: src/app/api/admin/dashboard/route.ts
// Action: REPLACE ENTIRE FILE
// ✅ FIX 1: Gets ACTUAL database size from MongoDB using dbStats command
// ✅ FIX 2: Falls back to better estimation if dbStats fails
// ✅ FIX 3: Proper rounding and unit display (KB, MB, GB)

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Helper function to format database size with proper units and rounding
function formatDatabaseSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    // Less than 1 MB - show in KB
    const kb = bytes / 1024
    if (kb < 10) {
      return `${kb.toFixed(2)} KB`  // e.g., "5.25 KB"
    } else if (kb < 100) {
      return `${kb.toFixed(1)} KB`  // e.g., "52.5 KB"
    } else {
      return `${Math.round(kb)} KB` // e.g., "525 KB"
    }
  } else if (bytes < 1024 * 1024 * 1024) {
    // Less than 1 GB - show in MB
    const mb = bytes / (1024 * 1024)
    if (mb < 10) {
      return `${mb.toFixed(2)} MB`  // e.g., "5.25 MB"
    } else if (mb < 100) {
      return `${mb.toFixed(1)} MB`  // e.g., "52.5 MB"
    } else {
      return `${Math.round(mb)} MB` // e.g., "525 MB"
    }
  } else {
    // 1 GB or more
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }
}

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

    // Subscriptions cancelled this month (ALL sources - manual + stripe)
    // Counts users who CLICKED CANCEL this month (retention/churn metric)
    const cancelledThisMonth = await prisma.user.count({
      where: {
        cancelledAt: {
          gte: startOfMonth,
          lte: now
        }
      }
    })

    // Stripe cancellations only (for churn rate calculation)
    const stripeCancelledThisMonth = await prisma.user.count({
      where: {
        subscriptionSource: 'stripe',
        cancelledAt: {
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
      ? (stripeCancelledThisMonth / stripePremiumUsers) * 100 
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

    // Get premium user IDs
    const premiumUserIds = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'premium'
      },
      select: {
        id: true
      }
    })

    const premiumUserIdList = premiumUserIds.map(u => u.id)

    // Count ONLY analyses created by premium users
    const premiumUserAnalyses = await prisma.propertyAnalysis.count({
      where: {
        userId: {
          in: premiumUserIdList
        }
      }
    })

    // Average analyses per premium user (now accurate!)
    const avgAnalysesPerUser = premiumUsers > 0 
      ? premiumUserAnalyses / premiumUsers 
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
    // F) SYSTEM HEALTH - DATABASE SIZE
    // ============================================
    
    // Get counts for ALL models
    const [
      totalGroups, 
      totalBanners, 
      totalProperties,
      totalLegacyAnalyses,
      totalPromoModals,
      totalDiscountCodes,
      totalCodeRedemptions,
      totalAdminLogs
    ] = await Promise.all([
      prisma.analysisGroup.count(),
      prisma.banner.count(),
      prisma.property.count(),           // Legacy model
      prisma.analysis.count(),           // Legacy model
      prisma.promoModal.count(),
      prisma.discountCode.count(),
      prisma.codeRedemption.count(),
      prisma.adminLog.count()
    ])
    
    // ✅ FIX: Get ACTUAL database size from MongoDB
    let estimatedSize: string
    
    try {
      // Use MongoDB's dbStats command to get actual database size
      // This returns the real storage size, not an estimate
      const dbStatsResult = await prisma.$runCommandRaw({
        dbStats: 1,
        scale: 1  // Return size in bytes
      }) as {
        dataSize?: number
        storageSize?: number
        indexSize?: number
        totalSize?: number
        ok?: number
      }
      
      if (dbStatsResult && dbStatsResult.ok === 1) {
        // Use storageSize (actual disk space) or dataSize (uncompressed data)
        // storageSize is more accurate as it includes compression
        const actualBytes = dbStatsResult.storageSize || dbStatsResult.dataSize || 0
        estimatedSize = formatDatabaseSize(actualBytes)
      } else {
        // dbStats returned but not OK - fall back to estimation
        throw new Error('dbStats command did not return OK')
      }
    } catch (dbStatsError) {
      // If dbStats fails (permissions, etc.), use comprehensive estimation
      console.warn('Could not get actual DB size, using estimation:', dbStatsError)
      
      // Comprehensive size estimation including ALL models
      const estimatedBytes = (
        // Core models
        (totalUsers * 1024) +                    // ~1KB per user (basic info)
        (totalAnalyses * 51200) +                // ~50KB per PropertyAnalysis (large JSON data)
        (totalGroups * 512) +                    // ~0.5KB per group
        (totalBanners * 2048) +                  // ~2KB per banner (HTML content)
        
        // Legacy models (may have data from old versions)
        (totalProperties * 2048) +               // ~2KB per legacy Property
        (totalLegacyAnalyses * 10240) +          // ~10KB per legacy Analysis
        
        // Admin/System models
        (totalPromoModals * 2048) +              // ~2KB per promo modal
        (totalDiscountCodes * 512) +             // ~0.5KB per discount code
        (totalCodeRedemptions * 512) +           // ~0.5KB per redemption
        (totalAdminLogs * 1024) +                // ~1KB per admin log entry
        (1 * 512) +                              // ~0.5KB for SystemSettings (only 1 record)
        
        // Index overhead (MongoDB creates indexes automatically)
        (totalAnalyses * 5120) +                 // ~5KB index per analysis (multiple indexes)
        (totalUsers * 1024)                      // ~1KB index per user
      )
      
      estimatedSize = formatDatabaseSize(estimatedBytes) + ' (est.)'
    }
    
    const dbStats = {
      totalUsers,
      totalAnalyses,
      totalGroups,
      totalBanners,
      totalProperties,
      totalLegacyAnalyses,
      totalAdminLogs,
      estimatedSize
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
          pdfExportEnabled: systemSettings?.pdfExportEnabled ?? true,
          savedDraftsEnabled: systemSettings?.savedDraftsEnabled ?? true,
          accountDeletionEnabled: systemSettings?.accountDeletionEnabled ?? true
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