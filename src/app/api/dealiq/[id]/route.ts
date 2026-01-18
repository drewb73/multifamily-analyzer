// FILE LOCATION: /src/app/api/dealiq/[id]/route.ts
// PURPOSE: Individual deal operations - Get, Update, Delete
// FIXED: Using propertyAnalysis model with proper TypeScript casting

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET - Get single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    console.log('🔍 Looking for deal with ID:', id, 'for user:', user.id)

    // Try to find by dealId first (the 7-digit number users see)
    let deal = await prisma.deal.findFirst({
      where: {
        dealId: id,
        userId: user.id
      },
      include: {
        analysis: true,
        contacts: true,
        notes: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        changes: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // If not found by dealId, try by MongoDB ID as fallback
    if (!deal) {
      console.log('❌ Not found by dealId, trying MongoDB ID...')
      deal = await prisma.deal.findFirst({
        where: {
          id: id,
          userId: user.id
        },
        include: {
          analysis: true,
          contacts: true,
          notes: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          changes: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      })
    }

    if (!deal) {
      console.log('❌ Deal not found with either dealId or MongoDB ID')
      
      // Debug: List all deals for this user
      const userDeals = await prisma.deal.findMany({
        where: { userId: user.id },
        select: { id: true, dealId: true, address: true }
      })
      console.log('📋 User has these deals:', userDeals)
      
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // ========================================
    // ✨ CRITICAL FIX: Use propertyAnalysis model with proper type casting
    // ========================================
    let responseData: any = deal
    
    if (!deal.analysis && deal.analysisId) {
      console.log('⚠️ Analysis relation is null, fetching manually for ID:', deal.analysisId)
      
      try {
        // ✨ FIXED: Changed from prisma.analysis to prisma.propertyAnalysis
        const analysis = await prisma.propertyAnalysis.findFirst({
          where: {
            id: deal.analysisId,
            userId: user.id
          }
        })
        
        if (analysis) {
          console.log('✅ Manually fetched analysis:', analysis.name)
          // Merge analysis into deal response with type casting
          responseData = {
            ...deal,
            analysis: analysis as any
          }
        } else {
          console.log('❌ Analysis not found or user does not own it')
        }
      } catch (error) {
        console.error('Error fetching analysis:', error)
      }
    }

    console.log('✅ Deal found:', responseData.dealId)
    console.log('📊 Analysis status:', {
      hasAnalysisId: !!responseData.analysisId,
      analysisId: responseData.analysisId,
      hasAnalysis: !!responseData.analysis,
      analysisName: responseData.analysis?.name
    })

    return NextResponse.json({ success: true, deal: responseData })
  } catch (error) {
    console.error('Get deal error:', error)
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 })
  }
}

// PATCH - Update deal details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()

    console.log('🔄 Updating deal:', id, 'with:', body)

    // Try to find by dealId first
    let deal = await prisma.deal.findFirst({
      where: {
        dealId: id,
        userId: user.id
      }
    })

    // Fallback to MongoDB ID
    if (!deal) {
      deal = await prisma.deal.findFirst({
        where: {
          id: id,
          userId: user.id
        }
      })
    }

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Track what changed for activity log
    const changes: Array<{ field: string, old: any, new: any }> = []

    // Check for stage change
    if (body.stage && body.stage !== deal.stage) {
      changes.push({
        field: 'stage',
        old: deal.stage,
        new: body.stage
      })
    }

    // Check for forecast change
    if (body.forecastStatus && body.forecastStatus !== deal.forecastStatus) {
      changes.push({
        field: 'forecastStatus',
        old: deal.forecastStatus,
        new: body.forecastStatus
      })
    }

    // Check for close date change
    if (body.expectedCloseDate !== undefined) {
      const oldDate = deal.expectedCloseDate?.toISOString() || null
      const newDate = body.expectedCloseDate ? new Date(body.expectedCloseDate).toISOString() : null
      if (oldDate !== newDate) {
        changes.push({
          field: 'expectedCloseDate',
          old: oldDate,
          new: newDate
        })
      }
    }

    // Check for commission percent change
    if (body.commissionPercent !== undefined && body.commissionPercent !== deal.commissionPercent) {
      changes.push({
        field: 'commissionPercent',
        old: deal.commissionPercent,
        new: body.commissionPercent
      })
    }

    // Check for net value change
    if (body.netValue !== undefined && body.netValue !== deal.netValue) {
      changes.push({
        field: 'netValue',
        old: deal.netValue,
        new: body.netValue
      })
    }

    // Check for loan rate change
    if (body.loanRate !== undefined && body.loanRate !== deal.loanRate) {
      changes.push({
        field: 'loanRate',
        old: deal.loanRate,
        new: body.loanRate
      })
    }

    // Check for loan term change
    if (body.loanTerm !== undefined && body.loanTerm !== deal.loanTerm) {
      changes.push({
        field: 'loanTerm',
        old: deal.loanTerm,
        new: body.loanTerm
      })
    }

    // Update the deal
    const updatedDeal = await prisma.deal.update({
      where: { id: deal.id },
      data: {
        stage: body.stage || deal.stage,
        forecastStatus: body.forecastStatus || deal.forecastStatus,
        expectedCloseDate: body.expectedCloseDate !== undefined 
          ? (body.expectedCloseDate ? new Date(body.expectedCloseDate) : null)
          : deal.expectedCloseDate,
        // New fields
        commissionPercent: body.commissionPercent !== undefined ? body.commissionPercent : deal.commissionPercent,
        commissionAmount: body.commissionAmount !== undefined ? body.commissionAmount : deal.commissionAmount,
        netValue: body.netValue !== undefined ? body.netValue : deal.netValue,
        loanRate: body.loanRate !== undefined ? body.loanRate : deal.loanRate,
        loanTerm: body.loanTerm !== undefined ? body.loanTerm : deal.loanTerm,
      },
      include: {
        analysis: true,
        contacts: true,
        notes: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        changes: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // ✨ FIXED: Manually fetch analysis if relation is null with proper type casting
    let responseData: any = updatedDeal
    
    if (!updatedDeal.analysis && updatedDeal.analysisId) {
      const analysis = await prisma.propertyAnalysis.findFirst({
        where: {
          id: updatedDeal.analysisId,
          userId: user.id
        }
      })
      if (analysis) {
        responseData = {
          ...updatedDeal,
          analysis: analysis as any
        }
      }
    }

    // Create change records for activity log
    for (const change of changes) {
      await prisma.dealChange.create({
        data: {
          dealId: deal.id,
          userId: user.id,
          fieldName: change.field,
          previousValue: String(change.old),
          newValue: String(change.new)
        }
      })
    }

    console.log('✅ Deal updated successfully')

    return NextResponse.json({ success: true, deal: responseData })
  } catch (error) {
    console.error('Update deal error:', error)
    return NextResponse.json({ 
      error: 'Failed to update deal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Delete a deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    console.log('🗑️ Attempting to delete deal:', id, 'for user:', user.id)

    // Try to find by dealId first (the 7-digit number)
    let deal = await prisma.deal.findFirst({
      where: {
        dealId: id,
        userId: user.id
      }
    })

    // If not found by dealId, try by MongoDB ID as fallback
    if (!deal) {
      console.log('Not found by dealId, trying MongoDB ID...')
      deal = await prisma.deal.findFirst({
        where: {
          id: id,
          userId: user.id
        }
      })
    }

    if (!deal) {
      console.log('❌ Deal not found or user does not own it')
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    console.log('✅ Deal found, deleting...')

    // Delete the deal using MongoDB ID (cascade will delete contacts, notes, changes)
    await prisma.deal.delete({
      where: { id: deal.id }
    })

    console.log('✅ Deal deleted successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Deal deleted successfully' 
    })
  } catch (error) {
    console.error('Delete deal error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete deal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}