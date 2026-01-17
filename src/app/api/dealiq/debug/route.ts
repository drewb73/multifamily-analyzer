// FILE LOCATION: /src/app/api/dealiq/debug/route.ts
// PURPOSE: Debug endpoint to check deals in database
// TEMPORARY: Remove after debugging

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    // Get all deals with full details
    const deals = await prisma.deal.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        dealId: true,
        address: true,
        city: true,
        state: true,
        analysisId: true,
        createdAt: true
      }
    })

    return NextResponse.json({ 
      success: true,
      userId: user.id,
      dealCount: deals.length,
      deals: deals.map(deal => ({
        mongoId: deal.id,
        dealId: deal.dealId,
        address: deal.address,
        location: `${deal.city}, ${deal.state}`,
        analysisId: deal.analysisId,
        createdAt: deal.createdAt,
        // Test URLs
        urlByDealId: `/dashboard/dealiq/${deal.dealId}`,
        urlByMongoId: `/dashboard/dealiq/${deal.id}`,
        apiByDealId: `/api/dealiq/${deal.dealId}`,
        apiByMongoId: `/api/dealiq/${deal.id}`
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}