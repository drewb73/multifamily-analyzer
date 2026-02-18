// FILE: src/app/api/dealiq/[id]/route.ts
// COMPLETE FILE - All functions updated for workspace sharing

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// ✅ GET - Fetch a single deal with all relations (WORKSPACE SHARING)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Get user with workspace info
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { 
        id: true, 
        isTeamMember: true, 
        teamWorkspaceOwnerId: true 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const mongoUserId = user.id

    // ✅ Build workspace user IDs
    let workspaceUserIds = [mongoUserId]
    if (user.isTeamMember && user.teamWorkspaceOwnerId) {
      workspaceUserIds.push(user.teamWorkspaceOwnerId)
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: user.teamWorkspaceOwnerId },
        select: { memberId: true }
      })
      members.forEach(m => workspaceUserIds.push(m.memberId))
    } else {
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: mongoUserId },
        select: { memberId: true }
      })
      members.forEach(m => workspaceUserIds.push(m.memberId))
    }

    // ✅ AWAIT params in Next.js 15
    const { id: paramId } = await params
    
    console.log('🔍 Looking for deal:', paramId, 'Workspace users:', workspaceUserIds)

    // Check if paramId is a MongoDB ObjectID (24 hex chars) or a dealId (numeric string)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(paramId)

    // Query by the appropriate ID type with WORKSPACE SHARING
    let deal
    if (isObjectId) {
      // Query by MongoDB id - CHECK WORKSPACE OWNERSHIP
      deal = await prisma.deal.findFirst({
        where: { 
          id: paramId,
          userId: { in: workspaceUserIds }
        },
        include: {
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
            orderBy: { createdAt: 'desc' }
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
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      })
    } else {
      // Query by dealId - CHECK WORKSPACE OWNERSHIP
      deal = await prisma.deal.findFirst({
        where: {
          userId: { in: workspaceUserIds },
          dealId: paramId
        },
        include: {
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
            orderBy: { createdAt: 'desc' }
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
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      })
    }

    if (!deal) {
      console.log('❌ Deal not found in workspace')
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Try to fetch analysis if analysisId exists
    let analysis = null
    if (deal.analysisId) {
      console.log('⚠️ Analysis relation is null, fetching manually for ID:', deal.analysisId)
      
      // ✅ Check workspace for analysis too
      analysis = await prisma.propertyAnalysis.findFirst({
        where: {
          id: deal.analysisId,
          userId: { in: workspaceUserIds }
        }
      })
      
      if (analysis) {
        console.log('✅ Manually fetched analysis:', analysis.name)
      }
    }

    console.log('✅ Deal found by workspace member:', deal.dealId)

    return NextResponse.json({
      success: true,
      deal: {
        ...deal,
        analysis: analysis
      }
    })

  } catch (error) {
    console.error('❌ Error fetching deal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
      { status: 500 }
    )
  }
}

// ✅ PATCH - Update deal fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Get MongoDB User ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const mongoUserId = user.id

    // ✅ AWAIT params in Next.js 15
    const { id: paramId } = await params
    const body = await request.json()

    console.log('🔄 Updating deal:', paramId, 'with:', body)

    // Check ID type
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(paramId)

    // Find the deal
    let deal
    if (isObjectId) {
      deal = await prisma.deal.findUnique({
        where: { id: paramId }
      })
      if (deal && deal.userId !== mongoUserId) {
        deal = null
      }
    } else {
      deal = await prisma.deal.findFirst({
        where: {
          userId: mongoUserId,
          dealId: paramId
        }
      })
    }

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Track changes for activity log
    const changes: Array<{ field: string; old: any; new: any }> = []

    // Check what fields changed
    if (body.stage !== undefined && body.stage !== deal.stage) {
      changes.push({ field: 'stage', old: deal.stage, new: body.stage })
    }

    if (body.forecastStatus !== undefined && body.forecastStatus !== deal.forecastStatus) {
      changes.push({ field: 'forecastStatus', old: deal.forecastStatus, new: body.forecastStatus })
    }

    if (body.expectedCloseDate !== undefined) {
      const newDate = body.expectedCloseDate ? new Date(body.expectedCloseDate) : null
      const oldDate = deal.expectedCloseDate
      if (newDate?.getTime() !== oldDate?.getTime()) {
        changes.push({ field: 'expectedCloseDate', old: oldDate, new: newDate })
      }
    }

    if (body.commissionPercent !== undefined && body.commissionPercent !== deal.commissionPercent) {
      changes.push({ field: 'commissionPercent', old: deal.commissionPercent, new: body.commissionPercent })
    }

    if (body.loanRate !== undefined && body.loanRate !== deal.loanRate) {
      changes.push({ field: 'loanRate', old: deal.loanRate, new: body.loanRate })
    }

    if (body.loanTerm !== undefined && body.loanTerm !== deal.loanTerm) {
      changes.push({ field: 'loanTerm', old: deal.loanTerm, new: body.loanTerm })
    }

    if (body.downPayment !== undefined && body.downPayment !== deal.downPayment) {
      changes.push({ field: 'downPayment', old: deal.downPayment, new: body.downPayment })
    }

    if (body.netValue !== undefined && body.netValue !== deal.netValue) {
      changes.push({ field: 'netValue', old: deal.netValue, new: body.netValue })
    }

    // Property fields
    if (body.address !== undefined && body.address !== deal.address) {
      changes.push({ field: 'address', old: deal.address, new: body.address })
    }

    if (body.city !== undefined && body.city !== deal.city) {
      changes.push({ field: 'city', old: deal.city, new: body.city })
    }

    if (body.state !== undefined && body.state !== deal.state) {
      changes.push({ field: 'state', old: deal.state, new: body.state })
    }

    if (body.zipCode !== undefined && body.zipCode !== deal.zipCode) {
      changes.push({ field: 'zipCode', old: deal.zipCode, new: body.zipCode })
    }

    if (body.units !== undefined && body.units !== deal.units) {
      changes.push({ field: 'units', old: deal.units, new: body.units })
    }

    if (body.squareFeet !== undefined && body.squareFeet !== deal.squareFeet) {
      changes.push({ field: 'squareFeet', old: deal.squareFeet, new: body.squareFeet })
    }

    if (body.financingType !== undefined && body.financingType !== deal.financingType) {
      changes.push({ field: 'financingType', old: deal.financingType, new: body.financingType })
    }

    // Calculate commission if price or percent changed
    let commissionAmount = deal.commissionAmount
    if (body.commissionPercent !== undefined && deal.price) {
      commissionAmount = deal.price * (body.commissionPercent / 100)
    }

    // Update the deal
    const updatedDeal = await prisma.deal.update({
      where: { id: deal.id },
      data: {
        stage: body.stage || deal.stage,
        forecastStatus: body.forecastStatus || deal.forecastStatus,
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : deal.expectedCloseDate,
        commissionPercent: body.commissionPercent !== undefined ? body.commissionPercent : deal.commissionPercent,
        commissionAmount: commissionAmount,
        loanRate: body.loanRate !== undefined ? body.loanRate : deal.loanRate,
        loanTerm: body.loanTerm !== undefined ? body.loanTerm : deal.loanTerm,
        downPayment: body.downPayment !== undefined ? body.downPayment : deal.downPayment,
        netValue: body.netValue !== undefined ? body.netValue : deal.netValue,
        
        // Property fields
        address: body.address !== undefined ? body.address : deal.address,
        city: body.city !== undefined ? body.city : deal.city,
        state: body.state !== undefined ? body.state : deal.state,
        zipCode: body.zipCode !== undefined ? body.zipCode : deal.zipCode,
        units: body.units !== undefined ? body.units : deal.units,
        pricePerUnit: body.pricePerUnit !== undefined ? body.pricePerUnit : deal.pricePerUnit,
        squareFeet: body.squareFeet !== undefined ? body.squareFeet : deal.squareFeet,
        pricePerSqft: body.pricePerSqft !== undefined ? body.pricePerSqft : deal.pricePerSqft,
        
        financingType: body.financingType !== undefined ? body.financingType : deal.financingType,
        
        updatedAt: new Date(),
        ...(body.stage !== undefined && body.stage !== deal.stage && {
          stageChangedAt: new Date(),
          previousStage: deal.stage
        })
      },
      include: {
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
          orderBy: { createdAt: 'desc' }
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
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })

    // Log changes if any
    if (changes.length > 0) {
      await prisma.dealChange.createMany({
        data: changes.map(change => ({
          dealId: deal.id,
          userId: mongoUserId,
          fieldName: change.field,
          previousValue: change.old?.toString() || null,
          newValue: change.new?.toString() || null
        }))
      })
    }

    // Fetch analysis if linked
    let analysis = null
    if (updatedDeal.analysisId) {
      analysis = await prisma.propertyAnalysis.findFirst({
        where: {
          id: updatedDeal.analysisId,
          userId: mongoUserId
        }
      })
    }

    console.log('✅ Deal updated successfully')

    return NextResponse.json({ 
      success: true,
      deal: {
        ...updatedDeal,
        analysis: analysis
      }
    })

  } catch (error) {
    console.error('❌ Error updating deal:', error)
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    )
  }
}

// ✅ DELETE - Delete a deal (WORKSPACE SHARING)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Get user with workspace info
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { 
        id: true, 
        isTeamMember: true, 
        teamWorkspaceOwnerId: true 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const mongoUserId = user.id

    // ✅ Build workspace user IDs
    let workspaceUserIds = [mongoUserId]
    if (user.isTeamMember && user.teamWorkspaceOwnerId) {
      workspaceUserIds.push(user.teamWorkspaceOwnerId)
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: user.teamWorkspaceOwnerId },
        select: { memberId: true }
      })
      members.forEach(m => workspaceUserIds.push(m.memberId))
    } else {
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: mongoUserId },
        select: { memberId: true }
      })
      members.forEach(m => workspaceUserIds.push(m.memberId))
    }

    // ✅ AWAIT params in Next.js 15
    const { id: paramId } = await params

    console.log('🗑️ Deleting deal:', paramId)

    // Check ID type
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(paramId)

    // ✅ Find deal that belongs to workspace
    let deal
    if (isObjectId) {
      deal = await prisma.deal.findFirst({
        where: { 
          id: paramId,
          userId: { in: workspaceUserIds }
        }
      })
    } else {
      deal = await prisma.deal.findFirst({
        where: {
          userId: { in: workspaceUserIds },
          dealId: paramId
        }
      })
    }

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found or you do not have permission to delete it' }, { status: 404 })
    }

    // Delete the deal (cascade will handle related records)
    await prisma.deal.delete({
      where: { id: deal.id }
    })

    console.log('✅ Deal deleted successfully by workspace member')

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Error deleting deal:', error)
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    )
  }
}