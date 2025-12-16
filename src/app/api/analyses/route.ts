// src/app/api/analyses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET /api/analyses - List user's analyses with filtering/sorting
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const groupId = searchParams.get('groupId')
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

    // Build where clause
    const where: any = {
      userId: user.id,
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

    // Specific filters (these work with search)
    if (groupId) where.groupId = groupId
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
      // Default to not archived if not specified
      where.isArchived = false
    }

    // Count total
    const total = await prisma.propertyAnalysis.count({ where })

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

    return NextResponse.json({
      analyses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching analyses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    )
  }
}

// POST /api/analyses - Create new analysis
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

    // Check if user is premium (only premium can save to database)
    const isPremium = user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'enterprise'
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required to save analyses' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, data, results, groupId, notes } = body

    // Validate required fields
    if (!name || !data || !results) {
      return NextResponse.json(
        { error: 'Missing required fields: name, data, results' },
        { status: 400 }
      )
    }

    // Extract property details for filtering
    const property = data.property
    if (!property) {
      return NextResponse.json(
        { error: 'Missing property data' },
        { status: 400 }
      )
    }

    // Extract key metrics for indexing
    const keyMetrics = results.keyMetrics || {}

    // Create analysis
    const analysis = await prisma.propertyAnalysis.create({
      data: {
        userId: user.id,
        groupId: groupId || null,
        name,
        notes: notes || null,
        
        // Property details
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        zipCode: property.zipCode || '',
        purchasePrice: property.purchasePrice || 0,
        totalUnits: property.totalUnits || 0,
        propertySize: property.propertySize || 0,
        isCashPurchase: property.isCashPurchase || false,
        downPayment: property.downPayment || null,
        loanTerm: property.loanTerm || null,
        interestRate: property.interestRate || null,
        
        // Full data
        data,
        results,
        
        // Extracted metrics
        capRate: keyMetrics.capRate || null,
        cashFlow: keyMetrics.annualCashFlow || null,
        cashOnCashReturn: keyMetrics.cashOnCashReturn || null,
        grossRentMultiplier: keyMetrics.grossRentMultiplier || null,
        netOperatingIncome: keyMetrics.netOperatingIncome || null,
        totalInvestment: keyMetrics.totalInvestment || null,
        debtServiceCoverage: keyMetrics.debtServiceCoverageRatio || null,
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

    return NextResponse.json({ analysis }, { status: 201 })
  } catch (error) {
    console.error('Error creating analysis:', error)
    return NextResponse.json(
      { error: 'Failed to create analysis' },
      { status: 500 }
    )
  }
}