// FILE LOCATION: /src/app/api/dealiq/[id]/link-analysis/route.ts
// PURPOSE: Link a saved analysis to an existing deal

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔗 LINK ANALYSIS ENDPOINT CALLED')
    
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get MongoDB User ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user.id

    // Get deal ID from params
    const { id: dealId } = await params
    const body = await request.json()
    const { analysisId } = body

    console.log('📊 Linking analysis to deal:', { dealId, analysisId })

    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 })
    }

    // Verify the deal belongs to the user
    const deal = await prisma.deal.findUnique({
      where: { id: dealId, userId }
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Verify the analysis belongs to the user
    const analysis = await prisma.propertyAnalysis.findUnique({
      where: { id: analysisId, userId }
    })

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // Link the analysis to the deal
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: { 
        analysisId: analysisId
      }
    })

    console.log('✅ Analysis linked successfully!')

    // Log the change
    await prisma.dealChange.create({
      data: {
        dealId: deal.id,
        userId: userId,
        fieldName: 'analysisId',
        previousValue: deal.analysisId || 'null',
        newValue: analysisId
      }
    })

    return NextResponse.json({ 
      success: true, 
      deal: updatedDeal 
    })
  } catch (error) {
    console.error('Link analysis error:', error)
    return NextResponse.json({ 
      error: 'Failed to link analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}