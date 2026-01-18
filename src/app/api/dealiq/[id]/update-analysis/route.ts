// FILE LOCATION: /src/app/api/dealiq/[id]/update-analysis/route.ts
// PURPOSE: Update analysis data when deal financing fields change

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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

    const { id: dealIdOrMongoId } = await params
    const body = await request.json()

    // Helper to check if string is valid MongoDB ObjectId
    const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id)

    // Find the deal
    let deal = await prisma.deal.findFirst({
      where: {
        ...(isValidObjectId(dealIdOrMongoId) 
          ? {
              OR: [
                { dealId: dealIdOrMongoId },
                { id: dealIdOrMongoId }
              ]
            }
          : { dealId: dealIdOrMongoId }
        ),
        userId: user.id
      },
      include: {
        analysis: true
      }
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    console.log('Deal found:', { id: deal.id, hasAnalysis: !!deal.analysis, analysisId: deal.analysisId })

    // ========================================
    // ✨ FIX: If analysis relation is null but analysisId exists, fetch it manually
    // ========================================
    let dealWithAnalysis = deal
    
    if (!deal.analysis && deal.analysisId) {
      console.log('⚠️ Analysis relation is null, fetching manually for ID:', deal.analysisId)
      console.log('🔍 Searching for analysis with:', {
        analysisId: deal.analysisId,
        userId: user.id,
        userClerkId: userId
      })
      
      try {
        // First, try to find the analysis without userId restriction
        const analysisExists = await prisma.analysis.findUnique({
          where: { id: deal.analysisId },
          select: { id: true, name: true, userId: true }
        })
        
        console.log('📊 Analysis lookup result:', analysisExists)
        
        if (analysisExists && analysisExists.userId !== user.id) {
          console.log('⚠️ Analysis belongs to different user:', {
            analysisUserId: analysisExists.userId,
            currentUserId: user.id
          })
        }
        
        // Now try with userId check
        const analysis = await prisma.analysis.findFirst({
          where: {
            id: deal.analysisId,
            userId: user.id
          }
        })
        
        if (analysis) {
          console.log('✅ Manually fetched analysis:', analysis.name)
          // Add analysis to deal object
          dealWithAnalysis = {
            ...deal,
            analysis: analysis
          }
        } else {
          console.log('❌ Analysis not found or user does not own it')
        }
      } catch (error) {
        console.error('Error fetching analysis:', error)
      }
    }

    if (!dealWithAnalysis.analysis) {
      return NextResponse.json({ 
        error: 'No analysis linked to this deal',
        details: 'Please link a property analysis to this deal first'
      }, { status: 400 })
    }

    console.log('Analysis ID:', dealWithAnalysis.analysis.id)

    // Get current analysis data
    const analysisData = typeof dealWithAnalysis.analysis.data === 'string'
      ? JSON.parse(dealWithAnalysis.analysis.data)
      : dealWithAnalysis.analysis.data

    console.log('Analysis data structure:', {
      hasProperty: !!analysisData.property,
      currentDownPayment: analysisData.property?.downPayment,
      isCashPurchase: analysisData.property?.isCashPurchase
    })

    // Check if this is a cash purchase
    if (analysisData.property?.isCashPurchase) {
      return NextResponse.json({ 
        error: 'Cannot update down payment for cash purchases',
        details: 'This property is marked as an all-cash purchase'
      }, { status: 400 })
    }

    // Update financing fields in analysis
    if (body.downPayment !== undefined) {
      if (!analysisData.property) {
        return NextResponse.json({ 
          error: 'Invalid analysis data structure',
          details: 'Analysis is missing property data'
        }, { status: 400 })
      }

      console.log('Updating down payment from', analysisData.property.downPayment, 'to', body.downPayment)
      
      analysisData.property.downPayment = body.downPayment
      analysisData.property.loanAmount = dealWithAnalysis.price - body.downPayment
    }

    console.log('Saving updated analysis...')

    // Update the analysis record
    await prisma.analysis.update({
      where: { id: dealWithAnalysis.analysis.id },
      data: {
        data: analysisData
      }
    })

    console.log('Analysis updated successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating analysis:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}