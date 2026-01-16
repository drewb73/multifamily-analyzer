// FILE LOCATION: /src/app/api/dealiq/route.ts
// PURPOSE: Main deals API - List and create deals

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateDealId } from '@/lib/dealiq-constants'

// GET - List all deals for current user
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

    // Get all deals for this user, sorted by created date (newest first)
    const deals = await prisma.deal.findMany({
      where: {
        userId: user.id
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
        stage: 'prospecting', // Default stage
        forecastStatus: 'non_forecastable', // Default forecast
        financingType: body.financingType || null,
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