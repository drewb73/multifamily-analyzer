// FILE: src/app/api/analyses/[id]/route.ts
// COMPLETE FILE - GET/PUT updated for workspace sharing + ALL property fields

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET /api/analyses/[id] - Get single analysis (WORKSPACE SHARING)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Get user with workspace info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, isTeamMember: true, teamWorkspaceOwnerId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ Build workspace user IDs
    let userIds = [user.id]
    if (user.isTeamMember && user.teamWorkspaceOwnerId) {
      userIds.push(user.teamWorkspaceOwnerId)
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: user.teamWorkspaceOwnerId },
        select: { memberId: true }
      })
      members.forEach(m => userIds.push(m.memberId))
    } else {
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: user.id },
        select: { memberId: true }
      })
      members.forEach(m => userIds.push(m.memberId))
    }

    // Await params in Next.js 15
    const params = await context.params
    
    // ✅ Check workspace ownership
    const analysis = await prisma.propertyAnalysis.findFirst({
      where: {
        id: params.id,
        userId: { in: userIds },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          }
        }
      }
    })

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}

// PUT /api/analyses/[id] - Update analysis (WORKSPACE SHARING + ALL FIELDS)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Get user with workspace info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, isTeamMember: true, teamWorkspaceOwnerId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ Build workspace user IDs
    let userIds = [user.id]
    if (user.isTeamMember && user.teamWorkspaceOwnerId) {
      userIds.push(user.teamWorkspaceOwnerId)
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: user.teamWorkspaceOwnerId },
        select: { memberId: true }
      })
      members.forEach(m => userIds.push(m.memberId))
    } else {
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: user.id },
        select: { memberId: true }
      })
      members.forEach(m => userIds.push(m.memberId))
    }

    // Await params in Next.js 15
    const params = await context.params

    // ✅ Check workspace ownership
    const existing = await prisma.propertyAnalysis.findFirst({
      where: {
        id: params.id,
        userId: { in: userIds },
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, groupId, notes, isFavorite, isArchived, data, results } = body

    // Update only allowed fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (groupId !== undefined) updateData.groupId = groupId
    if (notes !== undefined) updateData.notes = notes
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite
    if (isArchived !== undefined) updateData.isArchived = isArchived
    if (data !== undefined) {
      updateData.data = data
      
      // ✅ CRITICAL: Extract ALL property fields from data.property when updating
      const propertyData = data?.property || {}
      if (propertyData.address !== undefined) updateData.address = propertyData.address
      if (propertyData.city !== undefined) updateData.city = propertyData.city
      if (propertyData.state !== undefined) updateData.state = propertyData.state
      if (propertyData.zipCode !== undefined) updateData.zipCode = propertyData.zipCode
      if (propertyData.totalUnits !== undefined) updateData.totalUnits = propertyData.totalUnits
      if (propertyData.purchasePrice !== undefined) updateData.purchasePrice = propertyData.purchasePrice
      if (propertyData.propertySize !== undefined) updateData.propertySize = propertyData.propertySize  // ✅ ADDED
      if (propertyData.isCashPurchase !== undefined) updateData.isCashPurchase = propertyData.isCashPurchase  // ✅ ADDED
    }
    if (results !== undefined) {
      updateData.results = results
      
      // Extract denormalized fields from results for filtering/searching
      if (results.keyMetrics) {
        updateData.capRate = results.keyMetrics.capRate
        updateData.cashFlow = results.keyMetrics.annualCashFlow
        updateData.cashOnCashReturn = results.keyMetrics.cashOnCashReturn
        updateData.grossRentMultiplier = results.keyMetrics.grossRentMultiplier
        updateData.netOperatingIncome = results.keyMetrics.netOperatingIncome
        updateData.totalInvestment = results.keyMetrics.totalInvestment
        updateData.debtServiceCoverage = results.keyMetrics.debtServiceCoverageRatio
      }
    }

    const analysis = await prisma.propertyAnalysis.update({
      where: { id: params.id },
      data: updateData,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          }
        }
      }
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error updating analysis:', error)
    return NextResponse.json(
      { error: 'Failed to update analysis' },
      { status: 500 }
    )
  }
}

// DELETE /api/analyses/[id] - Delete analysis (WORKSPACE SHARING)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Get user with workspace info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, isTeamMember: true, teamWorkspaceOwnerId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ Build workspace user IDs
    let userIds = [user.id]
    if (user.isTeamMember && user.teamWorkspaceOwnerId) {
      userIds.push(user.teamWorkspaceOwnerId)
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: user.teamWorkspaceOwnerId },
        select: { memberId: true }
      })
      members.forEach(m => userIds.push(m.memberId))
    } else {
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: user.id },
        select: { memberId: true }
      })
      members.forEach(m => userIds.push(m.memberId))
    }

    // Await params in Next.js 15
    const params = await context.params

    // ✅ Check workspace ownership
    const existing = await prisma.propertyAnalysis.findFirst({
      where: {
        id: params.id,
        userId: { in: userIds },
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Analysis not found or you do not have permission to delete it' }, { status: 404 })
    }

    // Delete the analysis
    await prisma.propertyAnalysis.delete({
      where: { id: params.id }
    })

    console.log('✅ Analysis deleted successfully by workspace member')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting analysis:', error)
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    )
  }
}