import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

interface AnalysisData {
  property?: {
    address?: string
    city?: string
    state?: string
    zipCode?: string
    purchasePrice?: number
    downPayment?: number
    loanAmount?: number
    loanTerm?: number
    interestRate?: number
    propertySize?: number
    totalUnits?: number
    isCashPurchase?: boolean
    [key: string]: any
  }
  [key: string]: any
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔧 UPDATE ANALYSIS ENDPOINT CALLED')
    
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ AWAIT params in Next.js 15
    const { id: dealId } = await params
    const body = await request.json()
    console.log('📥 Request body:', body)

    // Fetch the deal to get analysis ID
    const deal = await prisma.deal.findUnique({
      where: { id: dealId, userId }
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    console.log('📊 Deal data:', {
      id: deal.id,
      price: deal.price,
      financingType: deal.financingType,
      hasAnalysisId: !!deal.analysisId
    })

    if (!deal.analysisId) {
      return NextResponse.json({ error: 'Deal has no linked analysis' }, { status: 400 })
    }

    // Fetch analysis from propertyAnalysis table
    console.log('⚠️ Fetching analysis manually from propertyAnalysis table')
    const analysis = await prisma.propertyAnalysis.findFirst({
      where: {
        id: deal.analysisId,
        userId: userId
      }
    })

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    console.log('✅ Found analysis:', analysis.name)

    // Get current analysis data
    const rawData = analysis.data
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
      return NextResponse.json(
        { error: 'Invalid analysis data structure' },
        { status: 400 }
      )
    }

    const analysisData = rawData as AnalysisData

    console.log('📋 FULL Analysis Data Structure:')
    console.log(JSON.stringify(analysisData, null, 2))

    // Process updates
    console.log('📝 Processing updates...')
    
    const updatedAnalysisData = { ...analysisData }
    const updatedProperty = { ...(analysisData.property || {}) }
    
    // Track what top-level fields need updating
    const topLevelUpdates: any = {}

    // Handle down payment update
    if (body.downPayment !== undefined) {
      const purchasePrice = deal.price || 0
      const isCashPurchase = deal.financingType === 'cash'

      if (!isCashPurchase && body.downPayment > purchasePrice) {
        return NextResponse.json(
          { error: 'Down payment cannot exceed purchase price' },
          { status: 400 }
        )
      }

      const newLoanAmount = isCashPurchase ? 0 : purchasePrice - body.downPayment

      console.log('✅ Validation passed! Updating down payment from', 
        updatedProperty.downPayment, 'to', body.downPayment)

      updatedProperty.downPayment = body.downPayment
      updatedProperty.loanAmount = newLoanAmount
      
      // ✅ UPDATE TOP-LEVEL FIELD
      topLevelUpdates.downPayment = body.downPayment
    }

    // Handle address update
    if (body.address !== undefined) {
      console.log('✅ Address updated:', body.address)
      updatedProperty.address = body.address
      // ✅ UPDATE TOP-LEVEL FIELD
      topLevelUpdates.address = body.address
    }

    // Handle city update
    if (body.city !== undefined) {
      console.log('✅ City updated:', body.city)
      updatedProperty.city = body.city
      // ✅ UPDATE TOP-LEVEL FIELD
      topLevelUpdates.city = body.city
    }

    // Handle state update
    if (body.state !== undefined) {
      console.log('✅ State updated:', body.state)
      updatedProperty.state = body.state
      // ✅ UPDATE TOP-LEVEL FIELD
      topLevelUpdates.state = body.state
    }

    // Handle ZIP code update
    if (body.zipCode !== undefined) {
      console.log('✅ ZIP code updated:', body.zipCode)
      updatedProperty.zipCode = body.zipCode
      // ✅ UPDATE TOP-LEVEL FIELD
      topLevelUpdates.zipCode = body.zipCode
    }

    // Handle total units update
    if (body.totalUnits !== undefined) {
      console.log('✅ Units updated:', body.totalUnits)
      updatedProperty.totalUnits = body.totalUnits
      // ✅ UPDATE TOP-LEVEL FIELD
      topLevelUpdates.totalUnits = body.totalUnits
    }

    // Handle property size (square feet) update
    if (body.propertySize !== undefined) {
      console.log('✅ Square footage updated:', body.propertySize)
      updatedProperty.propertySize = body.propertySize
      // ✅ UPDATE TOP-LEVEL FIELD
      topLevelUpdates.propertySize = body.propertySize
    }

    // Update the property object in analysis data
    updatedAnalysisData.property = updatedProperty

    // Update analysis in database - UPDATE BOTH PLACES!
    console.log('📝 Updating analysis in database...')
    console.log('📝 Top-level updates:', topLevelUpdates)
    
    await prisma.propertyAnalysis.update({
      where: { id: analysis.id },
      data: {
        // ✅ UPDATE JSON DATA FIELD
        data: updatedAnalysisData as any,
        
        // ✅ UPDATE TOP-LEVEL FIELDS (conditionally)
        ...(topLevelUpdates.address !== undefined && { address: topLevelUpdates.address }),
        ...(topLevelUpdates.city !== undefined && { city: topLevelUpdates.city }),
        ...(topLevelUpdates.state !== undefined && { state: topLevelUpdates.state }),
        ...(topLevelUpdates.zipCode !== undefined && { zipCode: topLevelUpdates.zipCode }),
        ...(topLevelUpdates.totalUnits !== undefined && { totalUnits: topLevelUpdates.totalUnits }),
        ...(topLevelUpdates.propertySize !== undefined && { propertySize: topLevelUpdates.propertySize }),
        ...(topLevelUpdates.downPayment !== undefined && { downPayment: topLevelUpdates.downPayment }),
        
        // Always update timestamp
        updatedAt: new Date()
      }
    })

    console.log('✅ Analysis updated successfully!')

    // Return success with updated values
    return NextResponse.json({
      success: true,
      ...body
    })

  } catch (error) {
    console.error('❌ Error updating analysis:', error)
    return NextResponse.json(
      { error: 'Failed to update analysis', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}