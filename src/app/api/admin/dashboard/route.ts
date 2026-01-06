// COMPLETE FILE
// Location: src/app/api/admin/dashboard/route.ts
// Action: CREATE NEW FILE

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
    
    const [totalUsers, premiumUsers, trialUsers, freeUsers, activeUsers] = await Promise.all([
      // Total users
      prisma.user.count({
        where: {
          accountStatus: 'active'
        }
      }),
      
      // Premium users
      prisma.user.count({
        where: {
          subscriptionStatus: 'premium',
          accountStatus: 'active'
        }
      }),
      
      // Trial users
      prisma.user.count({
        where: {
          subscriptionStatus: 'trial',
          accountStatus: 'active'
        }
      }),
      
      // Free users
      prisma.user.count({
        where: {
          subscriptionStatus: 'free',
          accountStatus: 'active'
        }
      }),

      // Active users (logged in last 30 days)
      prisma.user.count({
        where: {
          accountStatus: 'active',
          lastLoginAt: {
            gte: startOfMonth
          }
        }
      })
    ])

    // Total analyses
    const totalAnalyses = await prisma.propertyAnalysis.count()

    // ============================================
    // B) REVENUE & BILLING
    // ============================================
    
    const premiumPrice = 7 // $7/month
    
    // MRR (Monthly Recurring Revenue)
    const mrr = premiumUsers * premiumPrice
    
    // Expected weekly revenue
    const expectedWeekly = (premiumUsers * premiumPrice) / 4.33
    
    // Expected monthly revenue
    const expectedMonthly = mrr

    // Premium subscriptions cancelled this month
    const cancelledThisMonth = await prisma.user.count({
      where: {
        subscriptionStatus: 'free',
        subscriptionEndsAt: {
          gte: startOfMonth,
          lte: now
        }
      }
    })

    // Calculate ratios
    const premiumRatio = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0
    const trialRatio = totalUsers > 0 ? (trialUsers / totalUsers) * 100 : 0
    const freeRatio = totalUsers > 0 ? (freeUsers / totalUsers) * 100 : 0

    // ============================================
    // C) GROWTH & CONVERSION
    // ============================================
    
    const [newSignupsWeek, newSignupsMonth] = await Promise.all([
      // New signups this week
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfWeek
          },
          accountStatus: 'active'
        }
      }),
      
      // New signups this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          },
          accountStatus: 'active'
        }
      })
    ])

    // Trial to premium conversion rate
    const usersWhoHadTrial = await prisma.user.count({
      where: {
        hasUsedTrial: true,
        accountStatus: 'active'
      }
    })
    
    const conversionRate = usersWhoHadTrial > 0 
      ? (premiumUsers / usersWhoHadTrial) * 100 
      : 0

    // Churn rate (cancellations / total premium users)
    const churnRate = premiumUsers > 0 
      ? (cancelledThisMonth / premiumUsers) * 100 
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

      // Active users (logged in last 7 days)
      prisma.user.count({
        where: {
          accountStatus: 'active',
          lastLoginAt: {
            gte: startOfWeek
          }
        }
      })
    ])

    // Average analyses per premium user
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
          },
          accountStatus: 'active'
        }
      }),
      
      // Trials expiring in next 7 days
      prisma.user.count({
        where: {
          subscriptionStatus: 'trial',
          trialEndsAt: {
            gte: now,
            lte: next7Days
          },
          accountStatus: 'active'
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
    
    // Get database stats (approximation for MongoDB)
    // Note: Actual database size would require admin commands
    const dbStats = {
      totalUsers,
      totalAnalyses,
      totalGroups: await prisma.analysisGroup.count(),
      totalBanners: await prisma.banner.count(),
      estimatedSize: `${((totalUsers * 2) + (totalAnalyses * 5)) / 1024}MB` // Rough estimate
    }

    // Feature toggle status
    const systemSettings = await prisma.systemSettings.findFirst()
    
    // ============================================
    // G) RECENT ACTIVITY
    // ============================================
    
    const recentUsers = await prisma.user.findMany({
      where: {
        accountStatus: 'active'
      },
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
      
      // B) Revenue & Billing
      revenue: {
        mrr,
        expectedWeekly: Math.round(expectedWeekly * 100) / 100,
        expectedMonthly: expectedMonthly,
        cancelledThisMonth
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