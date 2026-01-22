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
    
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ FIRST: Get the MongoDB User ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user.id  // ✅ MongoDB ObjectID

    // ✅ AWAIT params in Next.js 15
    const { id: dealIdParam } = await params
    const body = await request.json()
    console.log('📥 Request body:', body)
    console.log('📥 Deal ID param:', dealIdParam)

    // ✅ Query by dealId (string like "4752510")
    const deal = await prisma.deal.findFirst({
      where: { 
        dealId: dealIdParam,  // dealId is a String in schema
        userId: userId
      }
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
    
    // ✅ FIX: Handle both data structures
    // Old structure: data.property
    // New structure: data.inputs.property
    const hasInputsStructure = analysisData.inputs && analysisData.inputs.property
    const propertyPath = hasInputsStructure ? analysisData.inputs.property : analysisData.property
    
    if (!propertyPath) {
      console.error('❌ Could not find property data in analysis')
      return NextResponse.json(
        { error: 'Property data not found in analysis' },
        { status: 400 }
      )
    }
    
    const updatedProperty = { ...propertyPath }
    
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

    // Handle price (purchase price) update
    if (body.price !== undefined) {
      console.log('✅ Expected purchase price updated:', body.price)
      updatedProperty.purchasePrice = body.price
    }

    // ✅ Save updatedProperty back to the correct location
    if (hasInputsStructure) {
      // New structure: data.inputs.property
      if (!updatedAnalysisData.inputs) {
        updatedAnalysisData.inputs = {}
      }
      updatedAnalysisData.inputs.property = updatedProperty
      console.log('✅ Updated data.inputs.property')
    } else {
      // Old structure: data.property
      updatedAnalysisData.property = updatedProperty
      console.log('✅ Updated data.property')
    }

    // ✅ RECALCULATE METRICS when financial inputs change
    console.log('🧮 Checking if metrics need recalculation...')
    const needsMetricRecalc = body.price !== undefined || 
                              body.downPayment !== undefined || 
                              body.loanRate !== undefined || 
                              body.loanTerm !== undefined
    
    console.log('🧮 needsMetricRecalc:', needsMetricRecalc)
    console.log('🧮 analysis.results exists:', !!analysis.results)
    
    let updatedKeyMetrics: any = null
    let updatedResults: any = null
    
    if (needsMetricRecalc && analysis.results) {
      console.log('🧮 Recalculating metrics...')
      
      const currentResults = analysis.results as any
      console.log('📊 Current results structure:', JSON.stringify(currentResults, null, 2))
      
      // Get current values (use updated values if they changed, otherwise use existing)
      const purchasePrice = body.price !== undefined ? body.price : (updatedProperty.purchasePrice || deal.price || 0)
      const downPayment = body.downPayment !== undefined ? body.downPayment : (updatedProperty.downPayment || 0)
      const loanRate = body.loanRate !== undefined ? body.loanRate : (deal.loanRate || 0)
      const loanTerm = body.loanTerm !== undefined ? body.loanTerm : (deal.loanTerm || 30)
      const isCashPurchase = deal.financingType === 'cash'
      
      console.log('💰 Recalculation inputs:', {
        purchasePrice,
        downPayment,
        loanRate,
        loanTerm,
        isCashPurchase
      })
      
      // Loan amount
      const loanAmount = isCashPurchase ? 0 : purchasePrice - downPayment
      
      // Monthly payment calculation (if financed)
      let monthlyPayment = 0
      let annualDebtService = 0
      if (!isCashPurchase && loanAmount > 0 && loanRate > 0) {
        const monthlyRate = loanRate / 100 / 12
        const numPayments = loanTerm * 12
        monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                        (Math.pow(1 + monthlyRate, numPayments) - 1)
        annualDebtService = monthlyPayment * 12
      }
      
      // ✅ RECALCULATE NOI when purchase price changes (affects percentage-based expenses)
      let monthlyNOI = currentResults.monthlyBreakdown?.netOperatingIncome || 0
      let annualNOI = monthlyNOI * 12
      let monthlyExpenses = currentResults.monthlyBreakdown?.totalExpenses || 0
      let annualExpenses = monthlyExpenses * 12
      const monthlyRent = currentResults.monthlyBreakdown?.grossIncome || 0
      const annualRent = monthlyRent * 12
      
      // If price changed, recalculate expenses that depend on property value
      if (body.price !== undefined && updatedAnalysisData.expenses) {
        console.log('🧮 Recalculating NOI due to price change...')
        
        // Calculate monthly expenses with new price
        monthlyExpenses = updatedAnalysisData.expenses.reduce((total: number, expense: any) => {
          if (expense.isPercentage) {
            if (expense.percentageOf === 'propertyValue') {
              // Property value expenses (like property tax) depend on purchase price
              return total + ((purchasePrice * (expense.amount / 100)) / 12)
            } else if (expense.percentageOf === 'rent') {
              // Rent-based expenses use rental income
              return total + (monthlyRent * (expense.amount / 100))
            } else if (expense.percentageOf === 'income') {
              // Income-based expenses use gross income
              return total + (monthlyRent * (expense.amount / 100))
            }
          }
          // Fixed expenses
          return total + expense.amount
        }, 0)
        
        // Recalculate NOI
        annualExpenses = monthlyExpenses * 12
        monthlyNOI = monthlyRent - monthlyExpenses
        annualNOI = monthlyNOI * 12
        
        console.log('📊 Recalculated expenses and NOI:', {
          monthlyExpenses: monthlyExpenses.toFixed(2),
          annualExpenses: annualExpenses.toFixed(2),
          monthlyNOI: monthlyNOI.toFixed(2),
          annualNOI: annualNOI.toFixed(2)
        })
      }
      
      console.log('📈 Final NOI and Rent values:', {
        monthlyNOI,
        annualNOI,
        monthlyRent,
        annualRent
      })
      
      // Calculate cash flow
      const monthlyCashFlow = monthlyNOI - monthlyPayment
      const annualCashFlow = monthlyCashFlow * 12
      
      // Total investment (down payment + closing costs if any)
      const closingCosts = currentResults.keyMetrics?.closingCosts || 0
      const totalInvestment = downPayment + closingCosts
      
      // Cap Rate = (Annual NOI / Purchase Price) * 100
      const capRate = purchasePrice > 0 ? (annualNOI / purchasePrice) * 100 : 0
      
      // GRM = Purchase Price / Annual Gross Rent
      const grm = annualRent > 0 ? purchasePrice / annualRent : 0
      
      // Cash-on-Cash Return = (Annual Cash Flow / Total Investment) * 100
      const cashOnCashReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0
      
      // DSCR = NOI / Debt Service
      const dscr = annualDebtService > 0 ? annualNOI / annualDebtService : 0
      
      console.log('📊 Calculated metrics (as percentages for display):', {
        capRate: capRate.toFixed(4) + '%',
        grm: grm.toFixed(2),
        cashOnCashReturn: cashOnCashReturn.toFixed(2) + '%',
        dscr: dscr.toFixed(2)
      })
      
      console.log('🔢 Formula verification:')
      console.log(`  Cap Rate = (${annualNOI} / ${purchasePrice}) * 100 = ${capRate.toFixed(4)}%`)
      console.log(`  GRM = ${purchasePrice} / ${annualRent} = ${grm.toFixed(2)}`)
      
      // Update keyMetrics (store as decimal for DB)
      updatedKeyMetrics = {
        ...currentResults.keyMetrics,
        capRate: capRate / 100, // Store as decimal (0.065 for 6.5%)
        grossRentMultiplier: grm,
        cashOnCashReturn: cashOnCashReturn / 100, // Store as decimal
        netOperatingIncome: annualNOI,  // ✅ Add recalculated NOI
        totalInvestment,
        annualCashFlow,
        monthlyPayment,
        annualDebtService,
        debtServiceCoverage: dscr
      }
      
      console.log('✅ Metrics recalculated and stored as decimals:', {
        capRate: updatedKeyMetrics.capRate,
        grm: updatedKeyMetrics.grossRentMultiplier,
        cashOnCashReturn: updatedKeyMetrics.cashOnCashReturn,
        netOperatingIncome: updatedKeyMetrics.netOperatingIncome
      })
      
      // ✅ Update results JSON structure
      updatedResults = {
        ...currentResults,
        keyMetrics: updatedKeyMetrics,
        monthlyBreakdown: {
          ...currentResults.monthlyBreakdown,
          totalExpenses: monthlyExpenses,  // ✅ Update with recalculated expenses
          netOperatingIncome: monthlyNOI,  // ✅ Update with recalculated NOI
          mortgagePayment: monthlyPayment,
          cashFlow: monthlyCashFlow
        },
        annualBreakdown: {
          ...currentResults.annualBreakdown,
          totalExpenses: annualExpenses,  // ✅ Update with recalculated expenses
          netOperatingIncome: annualNOI,  // ✅ Update with recalculated NOI
          debtService: annualDebtService,
          cashFlow: annualCashFlow
        }
      }
      
      console.log('✅ Updated results.keyMetrics and breakdowns in JSON structure')
    }

    // Update analysis in database - UPDATE BOTH PLACES!
    console.log('📝 Updating analysis in database...')
    console.log('📝 Top-level updates:', topLevelUpdates)
    
    await prisma.propertyAnalysis.update({
      where: { id: analysis.id },
      data: {
        // ✅ UPDATE JSON DATA FIELD (inputs)
        data: updatedAnalysisData as any,
        
        // ✅ UPDATE RESULTS JSON if they were recalculated
        ...(needsMetricRecalc && updatedResults && { 
          results: updatedResults as any 
        }),
        
        // ✅ UPDATE TOP-LEVEL METRIC FIELDS if they were recalculated
        ...(needsMetricRecalc && updatedKeyMetrics && {
          capRate: updatedKeyMetrics.capRate,
          cashOnCashReturn: updatedKeyMetrics.cashOnCashReturn,
          cashFlow: updatedKeyMetrics.annualCashFlow,
          grossRentMultiplier: updatedKeyMetrics.grossRentMultiplier,
          totalInvestment: updatedKeyMetrics.totalInvestment,
          debtServiceCoverage: updatedKeyMetrics.debtServiceCoverage,
          netOperatingIncome: updatedKeyMetrics.netOperatingIncome || (updatedResults?.annualBreakdown?.netOperatingIncome)
        }),
        
        // ✅ UPDATE TOP-LEVEL PROPERTY FIELDS (conditionally)
        ...(topLevelUpdates.address !== undefined && { address: topLevelUpdates.address }),
        ...(topLevelUpdates.city !== undefined && { city: topLevelUpdates.city }),
        ...(topLevelUpdates.state !== undefined && { state: topLevelUpdates.state }),
        ...(topLevelUpdates.zipCode !== undefined && { zipCode: topLevelUpdates.zipCode }),
        ...(topLevelUpdates.totalUnits !== undefined && { totalUnits: topLevelUpdates.totalUnits }),
        ...(topLevelUpdates.propertySize !== undefined && { propertySize: topLevelUpdates.propertySize }),
        ...(topLevelUpdates.downPayment !== undefined && { downPayment: topLevelUpdates.downPayment }),
        
        // ✅ UPDATE PURCHASE PRICE if it changed
        ...(body.price !== undefined && { purchasePrice: body.price }),
        
        // Always update timestamp
        updatedAt: new Date()
      }
    })

    console.log('✅ Analysis updated successfully!')

    // ✅ If price was updated, also update the Deal table
    if (body.price !== undefined) {
      console.log('📝 Updating Deal.price...')
      
      // Recalculate pricePerUnit and pricePerSqft
      const newPricePerUnit = deal.units ? body.price / deal.units : null
      const newPricePerSqft = deal.squareFeet ? body.price / deal.squareFeet : null
      const newCommissionAmount = deal.commissionPercent ? body.price * (deal.commissionPercent / 100) : null
      
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          price: body.price,
          pricePerUnit: newPricePerUnit,
          pricePerSqft: newPricePerSqft,
          commissionAmount: newCommissionAmount,
          updatedAt: new Date()
        }
      })
      
      console.log('✅ Deal.price updated successfully!')
      
      // ✅ Track the price change in activity log
      console.log('📝 Creating activity log entry for price change...')
      await prisma.dealChange.create({
        data: {
          dealId: deal.id,
          userId: userId,
          fieldName: 'price',
          previousValue: deal.price.toString(),
          newValue: body.price.toString()
        }
      })
      
      console.log('✅ Activity log entry created!')
    }

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