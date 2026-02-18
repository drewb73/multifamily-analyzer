// FILE LOCATION: /src/app/api/dealiq/route.ts
// MINIMAL CHANGE: Added workspace sharing

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateDealId } from '@/lib/dealiq-constants'

// GET - List all deals for current user + workspace
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ CHANGED: Get user with team info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, isTeamMember: true, teamWorkspaceOwnerId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ ADDED: Build workspace user IDs
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

    // ✅ CHANGED: Query workspace deals
    const deals = await prisma.deal.findMany({
      where: {
        userId: { in: userIds }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        analysis: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      deals 
    })
  } catch (error) {
    console.error('Get deals error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch deals' 
    }, { status: 500 })
  }
}

// POST - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()

    // Generate unique 7-digit deal ID
    const dealId = generateDealId()

    // Create the deal
    const deal = await prisma.deal.create({
      data: {
        dealId,
        userId: user.id,
        analysisId: body.analysisId || null,
        address: body.address,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
        price: body.price,
        squareFeet: body.squareFeet || null,
        units: body.units || null,
        pricePerUnit: body.units ? body.price / body.units : null,
        pricePerSqft: body.squareFeet ? body.price / body.squareFeet : null,
        stage: 'prospecting',
        forecastStatus: 'non_forecastable',
        financingType: body.financingType || null,
        downPayment: body.downPayment || null,
        loanTerm: body.loanTerm || null,
        loanRate: body.loanRate || null,
        daysInPipeline: 0
      }
    })

    // Log the creation
    await prisma.dealChange.create({
      data: {
        dealId: deal.id,
        userId: user.id,
        fieldName: 'created',
        previousValue: null,
        newValue: 'Deal created'
      }
    })

    return NextResponse.json({ 
      success: true, 
      deal 
    }, { status: 201 })
  } catch (error) {
    console.error('Create deal error:', error)
    return NextResponse.json({ 
      error: 'Failed to create deal' 
    }, { status: 500 })
  }
}