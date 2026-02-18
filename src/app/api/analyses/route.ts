// FILE: src/app/api/analyses/route.ts
// COMPLETE FILE - With workspace sharing and DEBUG LOGGING

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET /api/analyses - List user's analyses + workspace (WITH DEBUG)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with team info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, isTeamMember: true, teamWorkspaceOwnerId: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ DEBUG LOG 1
    console.log('📊 ========== SAVED ANALYSES DEBUG ==========')
    console.log('📊 User:', {
      id: user.id,
      email: user.email,
      isTeamMember: user.isTeamMember,
      ownerId: user.teamWorkspaceOwnerId
    })

    // Build workspace user IDs
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

    // ✅ DEBUG LOG 2
    console.log('📊 Querying with userIds:', userIds)
    console.log('📊 UserIds count:', userIds.length)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const groupId = searchParams.get('groupId')
    const onlyUngrouped = searchParams.get('onlyUngrouped') === 'true'
    const zipCode = searchParams.get('zipCode')
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const unitsMin = searchParams.get('unitsMin')
    const unitsMax = searchParams.get('unitsMax')
    const priceMin = searchParams.get('priceMin')
    const priceMax = searchParams.get('priceMax')
    const capRateMin = searchParams.get('capRateMin')
    const capRateMax = searchParams.get('capRateMax')
    const isFavorite = searchParams.get('isFavorite')
    const isArchived = searchParams.get('isArchived')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause with workspace userIds
    const where: any = {
      userId: { in: userIds },
    }

    // SEARCH - searches across multiple fields with OR
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { zipCode: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Specific filters
    if (onlyUngrouped) {
      where.groupId = null
    } else if (groupId) {
      where.groupId = groupId
    }
    if (zipCode && !search) where.zipCode = zipCode
    if (city && !search) where.city = { contains: city, mode: 'insensitive' }
    if (state && !search) where.state = state
    
    // Unit count filters
    if (unitsMin || unitsMax) {
      where.totalUnits = {}
      if (unitsMin) where.totalUnits.gte = parseInt(unitsMin)
      if (unitsMax) where.totalUnits.lte = parseInt(unitsMax)
    }
    
    // Price filters
    if (priceMin || priceMax) {
      where.purchasePrice = {}
      if (priceMin) where.purchasePrice.gte = parseFloat(priceMin)
      if (priceMax) where.purchasePrice.lte = parseFloat(priceMax)
    }
    
    // Cap rate filters
    if (capRateMin || capRateMax) {
      where.capRate = {}
      if (capRateMin) where.capRate.gte = parseFloat(capRateMin)
      if (capRateMax) where.capRate.lte = parseFloat(capRateMax)
    }
    
    // Boolean filters
    if (isFavorite !== null) where.isFavorite = isFavorite === 'true'
    if (isArchived !== null) {
      where.isArchived = isArchived === 'true'
    } else {
      where.isArchived = false
    }

    // ✅ DEBUG LOG 3
    console.log('📊 Where clause:', JSON.stringify(where, null, 2))

    // Count total
    const total = await prisma.propertyAnalysis.count({ where })

    // ✅ DEBUG LOG 4
    console.log('📊 Total count:', total)

    // Fetch analyses
    const analyses = await prisma.propertyAnalysis.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
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

    // ✅ DEBUG LOG 5 - CRITICAL
    console.log('📊 Found analyses:', analyses.length)
    if (analyses.length > 0) {
      console.log('📊 Sample:', analyses.slice(0, 3).map(a => ({
        id: a.id,
        name: a.name,
        userId: a.userId,
        createdAt: a.createdAt
      })))
    } else {
      console.log('📊 ⚠️  NO ANALYSES FOUND!')
      console.log('📊 Checking all analyses in database...')
      const allAnalyses = await prisma.propertyAnalysis.findMany({
        select: { id: true, name: true, userId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      console.log('📊 ALL ANALYSES IN DB (last 10):', allAnalyses)
      console.log('📊 Do any match our userIds?', allAnalyses.map(a => ({
        name: a.name,
        userId: a.userId,
        matchesQuery: userIds.includes(a.userId)
      })))
    }

    return NextResponse.json({
      success: true,
      analyses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get analyses error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch analyses' 
    }, { status: 500 })
  }
}

// POST /api/analyses - Create new analysis
export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Create the analysis
    const analysis = await prisma.propertyAnalysis.create({
      data: {
        userId: user.id,
        ...body
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

    return NextResponse.json({ 
      success: true, 
      analysis 
    })
  } catch (error) {
    console.error('Create analysis error:', error)
    return NextResponse.json({ 
      error: 'Failed to create analysis' 
    }, { status: 500 })
  }
}