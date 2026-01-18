// FILE LOCATION: /src/app/api/dealiq/[id]/update-analysis/route.ts
// FIXED: Use Deal price (not analysis price) + log full analysis data structure

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id)

// Type for our analysis data structure (flexible since we don't know exact structure)
interface AnalysisData {
  property?: {
    [key: string]: any
  }
  [key: string]: any
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('\n🔧 UPDATE ANALYSIS ENDPOINT CALLED')
    
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: dealIdOrMongoId } = await params
    const body = await request.json()
    const { downPayment } = body

    console.log('📥 Request body:', { downPayment, type: typeof downPayment })

    // Find the deal (using dealId or MongoDB ID)
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

    console.log('📊 Deal data:', {
      id: deal.id,
      price: deal.price,                    // ✅ Price is HERE!
      financingType: deal.financingType,    // ✅ Financing type is HERE!
      hasAnalysis: !!deal.analysis
    })

    // Create separate variable for TypeScript
    let dealWithAnalysis = deal

    // If analysis relation is null but analysisId exists, fetch manually
    if (!deal.analysis && deal.analysisId) {
      console.log('⚠️ Fetching analysis manually from propertyAnalysis table')
      
      const analysis = await prisma.propertyAnalysis.findFirst({
        where: {
          id: deal.analysisId,
          userId: user.id
        }
      })

      if (analysis) {
        console.log('✅ Found analysis:', analysis.name)
        dealWithAnalysis = {
          ...deal,
          analysis: analysis as any
        }
      } else {
        console.log('❌ Analysis not found')
        return NextResponse.json(
          { error: 'No analysis linked to this deal' },
          { status: 400 }
        )
      }
    }

    // Verify we have an analysis
    if (!dealWithAnalysis.analysis) {
      return NextResponse.json(
        { error: 'No analysis linked to this deal' },
        { status: 400 }
      )
    }

    // Get the analysis data
    const rawData = dealWithAnalysis.analysis.data
    
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
      return NextResponse.json(
        { error: 'Invalid analysis data structure' },
        { status: 400 }
      )
    }

    const analysisData = rawData as AnalysisData

    // Log the ENTIRE analysis data structure to see what's actually in there
    console.log('📋 FULL Analysis Data Structure:')
    console.log(JSON.stringify(analysisData, null, 2))

    // ✅ Use Deal's financing type (not analysis)
    const isCashPurchase = dealWithAnalysis.financingType === 'cash'
    
    if (isCashPurchase) {
      return NextResponse.json(
        { 
          error: 'Cannot update down payment for cash purchases',
          details: 'This property is marked as an all-cash purchase'
        },
        { status: 400 }
      )
    }

    // Parse down payment
    const newDownPayment = typeof downPayment === 'string' 
      ? parseFloat(downPayment.replace(/,/g, ''))
      : downPayment

    if (isNaN(newDownPayment) || newDownPayment < 0) {
      return NextResponse.json(
        { error: 'Invalid down payment amount' },
        { status: 400 }
      )
    }

    // ✅ Use Deal's price (not analysis price)
    const purchasePrice = dealWithAnalysis.price || 0

    console.log('✅ Validation values:', {
      newDownPayment,
      purchasePrice,
      source: 'Deal record (not analysis)',
      isValid: newDownPayment <= purchasePrice
    })

    if (newDownPayment > purchasePrice) {
      console.log('❌ VALIDATION FAILED!')
      return NextResponse.json(
        { 
          error: 'Down payment cannot exceed purchase price',
          details: `Down payment: $${newDownPayment.toLocaleString()}, Purchase price: $${purchasePrice.toLocaleString()}`
        },
        { status: 400 }
      )
    }

    console.log(`✅ Validation passed! Updating down payment from ${analysisData.property?.downPayment || 'not set'} to ${newDownPayment}`)

    // Calculate new loan amount
    const newLoanAmount = purchasePrice - newDownPayment

    console.log('💰 New values:', {
      purchasePrice,
      newDownPayment,
      newLoanAmount,
      percentDown: ((newDownPayment / purchasePrice) * 100).toFixed(2) + '%'
    })

    // Update the analysis data structure
    // We'll update/create the property object with down payment info
    const updatedAnalysisData = {
      ...analysisData,
      property: {
        ...(analysisData.property || {}),
        downPayment: newDownPayment,
        loanAmount: newLoanAmount
        // Note: We're NOT storing price here since it lives on the Deal
      }
    }

    console.log('📝 Updating analysis with:', {
      downPayment: newDownPayment,
      loanAmount: newLoanAmount
    })

    // Update in propertyAnalysis table
    await prisma.propertyAnalysis.update({
      where: { id: dealWithAnalysis.analysis.id },
      data: {
        data: updatedAnalysisData as any,
        updatedAt: new Date()
      }
    })

    console.log('✅ Analysis updated successfully!')

    return NextResponse.json({
      success: true,
      downPayment: newDownPayment,
      loanAmount: newLoanAmount,
      percentDown: ((newDownPayment / purchasePrice) * 100).toFixed(2)
    })

  } catch (error) {
    console.error('❌ Error updating analysis:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}