// FILE LOCATION: /src/components/dealiq/AccountDetailsTab.tsx
// PURPOSE: Complete Account Details tab with all financial tracking fields
// ADDED: Commission, Enhanced Financing, Deal Value cards

'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  MapPin, 
  Building2, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Edit2,
  Check,
  X,
  Home,
  Ruler,
  Hash,
  Receipt,
  Percent,
  Calculator,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react'
import { 
  DEAL_STAGES, 
  FORECAST_STATUS,
  getStageLabel,
  getStageColors,
  getForecastLabel,
  formatCurrency,
  formatPercentage,
  calculateDaysInPipeline
} from '@/lib/dealiq-constants'
import jsPDF from 'jspdf'

interface Deal {
  id: string
  dealId: string
  address: string
  city: string | null
  state: string | null
  zipCode: string | null
  stage: string
  forecastStatus: string
  expectedCloseDate: Date | null
  price: number
  squareFeet: number | null
  units: number | null
  pricePerUnit: number | null
  pricePerSqft: number | null
  financingType: string | null
  createdAt: Date
  analysis: any
  // New fields
  commissionPercent: number | null
  commissionAmount: number | null
  originalPurchasePrice: number | null
  netValue: number | null
  downPayment: number | null  // ✅ ADDED
  loanRate: number | null
  loanTerm: number | null
}

interface AccountDetailsTabProps {
  deal: Deal
  onUpdate: (updates: Partial<Deal>) => Promise<void>
  onRefresh: () => Promise<void>  // New: For refetching after analysis updates
}

export function AccountDetailsTab({ deal, onUpdate, onRefresh }: AccountDetailsTabProps) {
  const [isEditingStage, setIsEditingStage] = useState(false)
  const [isEditingForecast, setIsEditingForecast] = useState(false)
  const [isEditingCloseDate, setIsEditingCloseDate] = useState(false)
  const [isEditingCommission, setIsEditingCommission] = useState(false)
  const [isEditingLoanRate, setIsEditingLoanRate] = useState(false)
  const [isEditingLoanTerm, setIsEditingLoanTerm] = useState(false)
  const [isEditingDownPayment, setIsEditingDownPayment] = useState(false)
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [tempStage, setTempStage] = useState(deal.stage)
  const [tempForecast, setTempForecast] = useState(deal.forecastStatus)
  const [tempCloseDate, setTempCloseDate] = useState(() => {
    if (!deal.expectedCloseDate) return ''
    // Format date to YYYY-MM-DD in local timezone to avoid timezone shift
    const date = new Date(deal.expectedCloseDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [tempCommissionPercent, setTempCommissionPercent] = useState(deal.commissionPercent || 0)
  const [tempLoanRate, setTempLoanRate] = useState(deal.loanRate || 0)
  const [tempLoanTerm, setTempLoanTerm] = useState(deal.loanTerm || 30)
  const [tempDownPayment, setTempDownPayment] = useState(deal.downPayment || 0)
  const [tempPrice, setTempPrice] = useState(deal.price)
  
  // ✨ NEW: Property information edit states
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [tempAddress, setTempAddress] = useState(deal.address)
  const [tempCity, setTempCity] = useState(deal.city || '')
  const [tempState, setTempState] = useState(deal.state || '')
  const [tempZipCode, setTempZipCode] = useState(deal.zipCode || '')
  
  const [isEditingSqft, setIsEditingSqft] = useState(false)
  const [tempSqft, setTempSqft] = useState(deal.squareFeet || 0)

  // ✨ NEW: Collapsible sections state
  const [isDealTrackingCollapsed, setIsDealTrackingCollapsed] = useState(false)
  const [isCommissionCollapsed, setIsCommissionCollapsed] = useState(false)
  const [isFinancingCollapsed, setIsFinancingCollapsed] = useState(false)
  const [isPLCollapsed, setIsPLCollapsed] = useState(false)

  // ✅ NEW: P&L Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportButtonRef = useRef<HTMLButtonElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // ✅ NEW: P&L Monthly/Yearly toggle
  const [isPLYearly, setIsPLYearly] = useState(false)

  // ✅ NEW: Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showExportMenu &&
        exportMenuRef.current &&
        exportButtonRef.current &&
        !exportMenuRef.current.contains(event.target as Node) &&
        !exportButtonRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  // Format created date as mm/dd/yyyy
  const createdDate = new Date(deal.createdAt).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })

  // Calculate commission amount
  const commissionAmount = deal.commissionPercent 
    ? (deal.price * (deal.commissionPercent / 100))
    : (deal.commissionAmount || 0)

  // Calculate loan details from deal or analysis
  // ✅ PRIORITY: Use deal.downPayment if available, otherwise get from analysis
  let downPayment = deal.downPayment || 0
  let loanAmount = 0
  let monthlyPayment = 0

  if (deal.analysis?.data) {
    const analysisData = typeof deal.analysis.data === 'string' 
      ? JSON.parse(deal.analysis.data)
      : deal.analysis.data

    if (analysisData?.property) {
      if (!analysisData.property.isCashPurchase) {
        // Only use analysis downPayment if deal.downPayment is not set
        if (!deal.downPayment) {
          downPayment = analysisData.property.downPayment || 0
        }
        loanAmount = deal.price - downPayment
        
        const rate = (deal.loanRate || analysisData.property.interestRate || 6.5) / 100 / 12
        const term = (deal.loanTerm || analysisData.property.loanTerm || 30) * 12
        
        if (loanAmount > 0 && rate > 0 && term > 0) {
          monthlyPayment = loanAmount * rate * Math.pow(1 + rate, term) / (Math.pow(1 + rate, term) - 1)
        }
        
        console.log('💰 Component calculations:')
        console.log('  Deal price:', deal.price)
        console.log('  Down payment (from deal or analysis):', downPayment)
        console.log('  Calculated loan amount:', loanAmount)
        console.log('  Interest rate:', rate * 12 * 100, '%')
        console.log('  Loan term:', term / 12, 'years')
        console.log('  Monthly payment:', monthlyPayment)
      }
    }
  } else if (deal.financingType === 'financed' && deal.downPayment) {
    // ✅ NEW: Calculate for deals without analysis
    loanAmount = deal.price - downPayment
    
    if (deal.loanRate && deal.loanTerm) {
      const rate = deal.loanRate / 100 / 12
      const term = deal.loanTerm * 12
      
      if (loanAmount > 0 && rate > 0 && term > 0) {
        monthlyPayment = loanAmount * rate * Math.pow(1 + rate, term) / (Math.pow(1 + rate, term) - 1)
      }
      
      console.log('💰 Component calculations (no analysis):')
      console.log('  Deal price:', deal.price)
      console.log('  Down payment:', downPayment)
      console.log('  Calculated loan amount:', loanAmount)
      console.log('  Interest rate:', deal.loanRate, '%')
      console.log('  Loan term:', deal.loanTerm, 'years')
      console.log('  Monthly payment:', monthlyPayment)
    }
  }

  // Get metrics and breakdown from linked analysis
  let metrics = null
  let monthlyBreakdown = null
  let analysisData = null
  
  if (deal.analysis) {
    metrics = deal.analysis.results?.keyMetrics
    monthlyBreakdown = deal.analysis.results?.monthlyBreakdown
    analysisData = deal.analysis.data
    
    if (!metrics && typeof deal.analysis.results === 'string') {
      try {
        const parsedResults = JSON.parse(deal.analysis.results)
        metrics = parsedResults.keyMetrics
        monthlyBreakdown = parsedResults.monthlyBreakdown
      } catch (e) {
        console.error('Failed to parse results:', e)
      }
    }
    
    if (analysisData && typeof deal.analysis.data === 'string') {
      try {
        analysisData = JSON.parse(deal.analysis.data)
      } catch (e) {
        console.error('Failed to parse data:', e)
      }
    }
  }

  const handleSaveStage = async () => {
    setIsSaving(true)
    try {
      await onUpdate({ stage: tempStage })
      setIsEditingStage(false)
    } catch (error) {
      console.error('Failed to update stage:', error)
      alert('Failed to update stage')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveForecast = async () => {
    setIsSaving(true)
    try {
      await onUpdate({ forecastStatus: tempForecast })
      setIsEditingForecast(false)
    } catch (error) {
      console.error('Failed to update forecast:', error)
      alert('Failed to update forecast')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCloseDate = async () => {
    setIsSaving(true)
    try {
      // Fix timezone issue by appending noon time to avoid day shifting
      const newDate = tempCloseDate ? new Date(tempCloseDate + 'T12:00:00') : null
      await onUpdate({ expectedCloseDate: newDate })
      setIsEditingCloseDate(false)
    } catch (error) {
      console.error('Failed to update close date:', error)
      alert('Failed to update close date')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCommission = async () => {
    setIsSaving(true)
    try {
      const calculatedAmount = deal.price * (tempCommissionPercent / 100)
      await onUpdate({ 
        commissionPercent: tempCommissionPercent,
        commissionAmount: calculatedAmount
      })
      setIsEditingCommission(false)
    } catch (error) {
      console.error('Failed to update commission:', error)
      alert('Failed to update commission')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveLoanRate = async () => {
    setIsSaving(true)
    try {
      console.log('💾 Saving loan rate change:')
      console.log('  Deal ID:', deal.dealId)
      console.log('  Old rate:', deal.loanRate)
      console.log('  New rate:', tempLoanRate)
      
      // ✅ FIRST: Update the deal table
      await onUpdate({ loanRate: tempLoanRate })
      console.log('✅ Deal table updated with new loan rate')
      
      // ✅ THEN: If deal has an analysis, update the analysis too
      if (deal.analysis?.id) {
        const response = await fetch(`/api/dealiq/${deal.dealId}/update-analysis`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanRate: tempLoanRate
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || errorData.error || 'Failed to update analysis')
        }
        
        console.log('✅ Analysis updated with new loan rate')
      }
      
      // Refetch to get updated calculations
      await onRefresh()
      setIsEditingLoanRate(false)
    } catch (error) {
      console.error('Failed to update loan rate:', error)
      alert(`Failed to update loan rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveLoanTerm = async () => {
    setIsSaving(true)
    try {
      console.log('💾 Saving loan term change:')
      console.log('  Deal ID:', deal.dealId)
      console.log('  Old term:', deal.loanTerm)
      console.log('  New term:', tempLoanTerm)
      
      // ✅ FIRST: Update the deal table
      await onUpdate({ loanTerm: tempLoanTerm })
      console.log('✅ Deal table updated with new loan term')
      
      // ✅ THEN: If deal has an analysis, update the analysis too
      if (deal.analysis?.id) {
        const response = await fetch(`/api/dealiq/${deal.dealId}/update-analysis`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanTerm: tempLoanTerm
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || errorData.error || 'Failed to update analysis')
        }
        
        console.log('✅ Analysis updated with new loan term')
      }
      
      // Refetch to get updated calculations
      await onRefresh()
      setIsEditingLoanTerm(false)
    } catch (error) {
      console.error('Failed to update loan term:', error)
      alert(`Failed to update loan term: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDownPayment = async () => {
    setIsSaving(true)
    try {
      console.log('💾 Saving down payment change:')
      console.log('  Deal ID:', deal.dealId)
      console.log('  Analysis ID:', deal.analysis?.id)
      console.log('  Old down payment:', downPayment)
      console.log('  New down payment:', tempDownPayment)

      // ✅ FIRST: Update the deal table
      await onUpdate({ downPayment: tempDownPayment })
      console.log('✅ Deal table updated with new down payment')
      
      // ✅ THEN: If deal has an analysis, update the analysis too
      if (deal.analysis?.id) {
        const response = await fetch(`/api/dealiq/${deal.dealId}/update-analysis`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            downPayment: tempDownPayment
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || errorData.error || 'Failed to update analysis')
        }
        
        const result = await response.json()
        console.log('✅ API response:', result)
      }
      
      console.log('🔄 Calling onRefresh to get fresh data...')
      // Trigger parent refresh to get updated data
      await onRefresh()
      
      console.log('✅ Refresh complete, closing editor')
      setIsEditingDownPayment(false)
    } catch (error) {
      console.error('Failed to update down payment:', error)
      alert(`Failed to update down payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // ✨ NEW: Save Expected Purchase Price
  const handleSavePrice = async () => {
    setIsSaving(true)
    try {
      // Update the analysis with new price
      if (!deal.analysis?.id) {
        alert('No property analysis linked to this deal. Please create or link an analysis first.')
        setIsEditingPrice(false)
        setIsSaving(false)
        return
      }

      console.log('💾 Saving expected purchase price change:')
      console.log('  Deal ID:', deal.id)
      console.log('  Analysis ID:', deal.analysis.id)
      console.log('  Old price:', deal.price)
      console.log('  New price:', tempPrice)

      const response = await fetch(`/api/dealiq/${deal.dealId}/update-analysis`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: tempPrice
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to update analysis')
      }

      const result = await response.json()
      console.log('✅ API response:', result)
      
      console.log('🔄 Calling onRefresh to get fresh data...')
      // Trigger parent refresh to get updated analysis data
      await onRefresh()
      
      console.log('✅ Refresh complete, closing editor')
      setIsEditingPrice(false)
    } catch (error) {
      console.error('Failed to update expected purchase price:', error)
      alert(`Failed to update expected purchase price: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // ✨ NEW: Save address information
  const handleSaveAddress = async () => {
    setIsSaving(true)
    try {
      console.log('💾 Saving address:', { tempAddress, tempCity, tempState, tempZipCode })
      
      // Update Deal first
      const dealUpdateResponse = await fetch(`/api/dealiq/${deal.dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: tempAddress,
          city: tempCity,
          state: tempState,
          zipCode: tempZipCode
        })
      })

      if (!dealUpdateResponse.ok) {
        throw new Error('Failed to update deal')
      }

      console.log('✅ Deal updated with new address')
      
      // Also update analysis if linked
      if (deal.analysis?.id) {
        console.log('📊 Updating analysis...')
        const response = await fetch(`/api/dealiq/${deal.dealId}/update-analysis`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: tempAddress,
            city: tempCity,
            state: tempState,
            zipCode: tempZipCode
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to update analysis')
        }
        console.log('✅ Analysis updated')
      }
      
      // Add tiny delay to ensure database commits before refetch
      console.log('⏱️ Waiting for database commit...')
      await new Promise(resolve => setTimeout(resolve, 150))
      
      console.log('🔄 Calling onRefresh to get fresh data...')
      await onRefresh()
      console.log('✅ Refresh complete')
      
      setIsEditingAddress(false)
    } catch (error) {
      console.error('Failed to update address:', error)
      alert('Failed to update address')
    } finally {
      setIsSaving(false)
    }
  }

  // ✨ NEW: Save square feet
  const handleSaveSqft = async () => {
    setIsSaving(true)
    try {
      console.log('💾 Saving square feet:', tempSqft)
      
      const newPricePerSqft = tempSqft > 0 ? deal.price / tempSqft : null
      
      // Update Deal first
      const dealUpdateResponse = await fetch(`/api/dealiq/${deal.dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          squareFeet: tempSqft,
          pricePerSqft: newPricePerSqft
        })
      })

      if (!dealUpdateResponse.ok) {
        throw new Error('Failed to update deal')
      }

      console.log('✅ Deal updated with sqft:', tempSqft)
      
      // Update analysis if linked
      if (deal.analysis?.id) {
        console.log('📊 Updating analysis...')
        const response = await fetch(`/api/dealiq/${deal.dealId}/update-analysis`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertySize: tempSqft
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to update analysis')
        }
        console.log('✅ Analysis updated')
      }
      
      // Add tiny delay to ensure database commits before refetch
      console.log('⏱️ Waiting for database commit...')
      await new Promise(resolve => setTimeout(resolve, 150))
      
      console.log('🔄 Calling onRefresh to get fresh data...')
      await onRefresh()
      console.log('✅ Refresh complete')
      
      setIsEditingSqft(false)
    } catch (error) {
      console.error('Failed to update sqft:', error)
      alert('Failed to update square feet')
    } finally {
      setIsSaving(false)
    }
  }


  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get color-coded pill colors for stages (progression from early to Closed Won)

  // ✅ NEW: Export P&L to CSV
  const exportToCSV = () => {
    if (!plData) return

    const multiplier = isPLYearly ? 12 : 1
    const period = isPLYearly ? 'Yearly' : 'Monthly'

    const csvRows = []
    
    // Header
    csvRows.push('Profit & Loss Statement')
    csvRows.push(`Property: ${deal.address}`)
    csvRows.push(`Deal ID: ${deal.dealId}`)
    csvRows.push(`Period: ${period}`)
    csvRows.push(`Date: ${new Date().toLocaleDateString()}`)
    csvRows.push('') // Empty row
    
    // Column headers
    csvRows.push('Category,Current,Market')
    
    // INCOME
    csvRows.push('INCOME,,')
    csvRows.push(`Rental Income,${plData.current.rentalIncome * multiplier},${plData.market.rentalIncome * multiplier}`)
    csvRows.push(`Other Income,${plData.current.otherIncome * multiplier},${plData.market.otherIncome * multiplier}`)
    csvRows.push(`Total Income,${plData.current.totalIncome * multiplier},${plData.market.totalIncome * multiplier}`)
    csvRows.push('') // Empty row
    
    // OPERATING EXPENSES
    csvRows.push('OPERATING EXPENSES,,')
    plData.current.expenses.forEach((expense: any, index: number) => {
      csvRows.push(`${expense.name},${expense.amount * multiplier},${plData.market.expenses[index].amount * multiplier}`)
    })
    csvRows.push(`Total Expenses,${plData.current.totalExpenses * multiplier},${plData.market.totalExpenses * multiplier}`)
    csvRows.push('') // Empty row
    
    // NET OPERATING INCOME
    csvRows.push(`NET OPERATING INCOME,${plData.current.noi * multiplier},${plData.market.noi * multiplier}`)
    csvRows.push('') // Empty row
    
    // DEBT SERVICE
    csvRows.push('DEBT SERVICE,,')
    csvRows.push(`Mortgage Payment,${plData.current.debtService * multiplier},${plData.market.debtService * multiplier}`)
    csvRows.push('') // Empty row
    
    // CASH FLOW
    csvRows.push(`CASH FLOW,${plData.current.cashFlow * multiplier},${plData.market.cashFlow * multiplier}`)
    csvRows.push('') // Empty row
    
    // KEY METRICS (always annual-based)
    csvRows.push('KEY METRICS,,')
    
    // Cap Rate
    const currentCapRate = plData.current.noi * 12 > 0 
      ? ((plData.current.noi * 12 / deal.price) * 100).toFixed(2) + '%'
      : 'N/A'
    const marketCapRate = plData.market.noi * 12 > 0 
      ? ((plData.market.noi * 12 / deal.price) * 100).toFixed(2) + '%'
      : 'N/A'
    csvRows.push(`Cap Rate,${currentCapRate},${marketCapRate}`)
    
    // Cash-on-Cash Return
    if (downPayment > 0) {
      const currentCoC = ((plData.current.cashFlow * 12 / downPayment) * 100).toFixed(2) + '%'
      const marketCoC = ((plData.market.cashFlow * 12 / downPayment) * 100).toFixed(2) + '%'
      csvRows.push(`Cash-on-Cash,${currentCoC},${marketCoC}`)
    }
    
    // GRM
    const currentGRM = plData.current.rentalIncome * 12 > 0 
      ? (deal.price / (plData.current.rentalIncome * 12)).toFixed(2)
      : 'N/A'
    const marketGRM = plData.market.rentalIncome * 12 > 0 
      ? (deal.price / (plData.market.rentalIncome * 12)).toFixed(2)
      : 'N/A'
    csvRows.push(`GRM,${currentGRM},${marketGRM}`)
    
    // DSCR
    const currentDSCR = plData.current.debtService > 0 
      ? (plData.current.noi / plData.current.debtService).toFixed(2)
      : 'N/A'
    const marketDSCR = plData.market.debtService > 0 
      ? (plData.market.noi / plData.market.debtService).toFixed(2)
      : 'N/A'
    csvRows.push(`DSCR,${currentDSCR},${marketDSCR}`)
    csvRows.push('') // Empty row
    
    // Additional Metrics (single values)
    csvRows.push('ADDITIONAL METRICS,')
    csvRows.push(`Total Investment,${downPayment}`)
    if (deal.units) {
      csvRows.push(`Price per Unit,${deal.price / deal.units}`)
    }
    
    // Create CSV string
    const csvContent = csvRows.join('\n')
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `PL-Statement-Deal-${deal.dealId}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    setShowExportMenu(false)
  }

  // ✅ NEW: Export P&L to PDF
  const exportToPDF = () => {
    if (!plData) return

    const multiplier = isPLYearly ? 12 : 1
    const period = isPLYearly ? 'Yearly' : 'Monthly'

    const doc = new jsPDF()
    let yPosition = 20

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Profit & Loss Statement', 105, yPosition, { align: 'center' })
    
    yPosition += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Property: ${deal.address}`, 105, yPosition, { align: 'center' })
    
    yPosition += 5
    doc.text(`Deal ID: ${deal.dealId}`, 105, yPosition, { align: 'center' })
    
    yPosition += 5
    doc.text(`Period: ${period}`, 105, yPosition, { align: 'center' })
    
    yPosition += 5
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' })
    
    yPosition += 10

    // Column Headers
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Current', 120, yPosition, { align: 'right' })
    doc.text('Market', 170, yPosition, { align: 'right' })
    
    yPosition += 7

    // Helper function to add a line
    const addLine = (label: string, currentValue: number, marketValue: number, isBold = false) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.text(label, 20, yPosition)
      doc.text(formatCurrency(currentValue), 120, yPosition, { align: 'right' })
      doc.text(formatCurrency(marketValue), 170, yPosition, { align: 'right' })
      yPosition += 6
    }

    // Helper function to add a percentage line
    const addPercentLine = (label: string, currentValue: string, marketValue: string) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFont('helvetica', 'normal')
      doc.text(label, 20, yPosition)
      doc.text(currentValue, 120, yPosition, { align: 'right' })
      doc.text(marketValue, 170, yPosition, { align: 'right' })
      yPosition += 6
    }

    // INCOME
    doc.setFont('helvetica', 'bold')
    doc.text('INCOME', 20, yPosition)
    yPosition += 6
    
    addLine('Rental Income:', plData.current.rentalIncome * multiplier, plData.market.rentalIncome * multiplier)
    addLine('Other Income:', plData.current.otherIncome * multiplier, plData.market.otherIncome * multiplier)
    addLine('Total Income:', plData.current.totalIncome * multiplier, plData.market.totalIncome * multiplier, true)
    
    yPosition += 4

    // OPERATING EXPENSES
    doc.setFont('helvetica', 'bold')
    doc.text('OPERATING EXPENSES', 20, yPosition)
    yPosition += 6
    
    plData.current.expenses.forEach((expense: any, index: number) => {
      addLine(`${expense.name}:`, expense.amount * multiplier, plData.market.expenses[index].amount * multiplier)
    })
    addLine('Total Expenses:', plData.current.totalExpenses * multiplier, plData.market.totalExpenses * multiplier, true)
    
    yPosition += 4

    // NET OPERATING INCOME (lighter blue highlight)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(219, 234, 254) // Light blue (blue-100)
    doc.rect(15, yPosition - 4, 180, 8, 'F')
    addLine('NET OPERATING INCOME', plData.current.noi * multiplier, plData.market.noi * multiplier, true)
    
    yPosition += 4

    // DEBT SERVICE
    doc.setFont('helvetica', 'bold')
    doc.text('DEBT SERVICE', 20, yPosition)
    yPosition += 6
    
    addLine('Mortgage Payment:', plData.current.debtService * multiplier, plData.market.debtService * multiplier)
    
    yPosition += 4

    // CASH FLOW (lighter gray highlight)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(243, 244, 246) // Light gray (gray-100)
    doc.rect(15, yPosition - 4, 180, 8, 'F')
    addLine('CASH FLOW', plData.current.cashFlow * multiplier, plData.market.cashFlow * multiplier, true)
    
    yPosition += 8

    // KEY METRICS (always annual-based)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('KEY METRICS', 20, yPosition)
    yPosition += 6
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    
    // Cap Rate
    const currentCapRate = plData.current.noi * 12 > 0 
      ? formatPercentage((plData.current.noi * 12 / deal.price) * 100, 2)
      : 'N/A'
    const marketCapRate = plData.market.noi * 12 > 0 
      ? formatPercentage((plData.market.noi * 12 / deal.price) * 100, 2)
      : 'N/A'
    addPercentLine('• Cap Rate:', currentCapRate, marketCapRate)
    
    // Cash-on-Cash Return (only if down payment exists)
    if (downPayment > 0) {
      const currentCoC = formatPercentage((plData.current.cashFlow * 12 / downPayment) * 100, 2)
      const marketCoC = formatPercentage((plData.market.cashFlow * 12 / downPayment) * 100, 2)
      addPercentLine('• Cash-on-Cash:', currentCoC, marketCoC)
    }
    
    // GRM
    const currentGRM = plData.current.rentalIncome * 12 > 0 
      ? (deal.price / (plData.current.rentalIncome * 12)).toFixed(2)
      : 'N/A'
    const marketGRM = plData.market.rentalIncome * 12 > 0 
      ? (deal.price / (plData.market.rentalIncome * 12)).toFixed(2)
      : 'N/A'
    addPercentLine('• GRM:', currentGRM, marketGRM)
    
    // DSCR
    const currentDSCR = plData.current.debtService > 0 
      ? (plData.current.noi / plData.current.debtService).toFixed(2)
      : 'N/A'
    const marketDSCR = plData.market.debtService > 0 
      ? (plData.market.noi / plData.market.debtService).toFixed(2)
      : 'N/A'
    addPercentLine('• DSCR:', currentDSCR, marketDSCR)

    yPosition += 4

    // Additional metrics that don't vary between current/market
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('ADDITIONAL METRICS', 20, yPosition)
    yPosition += 6
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`• Total Investment: ${formatCurrency(downPayment)}`, 20, yPosition)
    yPosition += 5
    
    if (deal.units) {
      doc.text(`• Price per Unit: ${formatCurrency(deal.price / deal.units)}`, 20, yPosition)
    }

    // Save
    doc.save(`PL-Statement-Deal-${deal.dealId}.pdf`)
    setShowExportMenu(false)
  }

  // Calculate P&L with Current vs Market Rents
  const calculatePL = () => {
    if (!analysisData || !monthlyBreakdown) return null

    const unitMix = analysisData.unitMix || []
    const income = analysisData.income || []
    const expenses = analysisData.expenses || []

    const currentRentalIncome = unitMix.reduce((sum: number, unit: any) => 
      sum + ((unit.currentRent || 0) * (unit.count || 0)), 0
    )
    
    const marketRentalIncome = unitMix.reduce((sum: number, unit: any) => 
      sum + ((unit.marketRent || 0) * (unit.count || 0)), 0
    )

    const otherIncome = income
      .filter((inc: any) => !inc.isCalculated)
      .reduce((sum: number, inc: any) => sum + (inc.amount || 0), 0)

    const totalIncomeCurrent = currentRentalIncome + otherIncome
    const totalIncomeMarket = marketRentalIncome + otherIncome

    const expenseBreakdown = expenses.map((expense: any) => {
      let currentAmount = 0
      let marketAmount = 0

      if (expense.isPercentage) {
        if (expense.percentageOf === 'rent') {
          currentAmount = currentRentalIncome * (expense.amount / 100)
          marketAmount = marketRentalIncome * (expense.amount / 100)
        } else if (expense.percentageOf === 'income') {
          currentAmount = totalIncomeCurrent * (expense.amount / 100)
          marketAmount = totalIncomeMarket * (expense.amount / 100)
        } else if (expense.percentageOf === 'propertyValue') {
          const monthlyAmount = (deal.price * (expense.amount / 100)) / 12
          currentAmount = monthlyAmount
          marketAmount = monthlyAmount
        }
      } else {
        currentAmount = expense.amount
        marketAmount = expense.amount
      }

      return {
        name: expense.name,
        currentAmount,
        marketAmount
      }
    })

    const totalExpensesCurrent = expenseBreakdown.reduce((sum: number, exp: any) => sum + exp.currentAmount, 0)
    const totalExpensesMarket = expenseBreakdown.reduce((sum: number, exp: any) => sum + exp.marketAmount, 0)

    const noiCurrent = totalIncomeCurrent - totalExpensesCurrent
    const noiMarket = totalIncomeMarket - totalExpensesMarket

    // ✅ FIX: Use the recalculated monthlyPayment variable (lines 106-129)
    // instead of stale monthlyBreakdown.mortgagePayment
    const mortgagePayment = monthlyPayment || 0
    
    console.log('📊 P&L using monthly payment:', mortgagePayment, '(from recalculated value)')

    const cashFlowCurrent = noiCurrent - mortgagePayment
    const cashFlowMarket = noiMarket - mortgagePayment

    return {
      current: {
        rentalIncome: currentRentalIncome,
        otherIncome,
        totalIncome: totalIncomeCurrent,
        expenses: expenseBreakdown.map((e: any) => ({ name: e.name, amount: e.currentAmount })),
        totalExpenses: totalExpensesCurrent,
        noi: noiCurrent,
        debtService: mortgagePayment,
        cashFlow: cashFlowCurrent
      },
      market: {
        rentalIncome: marketRentalIncome,
        otherIncome,
        totalIncome: totalIncomeMarket,
        expenses: expenseBreakdown.map((e: any) => ({ name: e.name, amount: e.marketAmount })),
        totalExpenses: totalExpensesMarket,
        noi: noiMarket,
        debtService: mortgagePayment,
        cashFlow: cashFlowMarket
      }
    }
  }

  const plData = calculatePL()

  return (
    <div className="space-y-6">
      {/* Property Information Card */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-bold text-neutral-900">Property Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Address - Now Editable */}
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
              <MapPin className="w-4 h-4" />
              Address
            </div>
            {!isEditingAddress ? (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">{deal.address}</div>
                  {(deal.city || deal.state) && (
                    <div className="text-sm text-neutral-600">
                      {deal.city}{deal.city && deal.state ? ', ' : ''}{deal.state} {deal.zipCode}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setTempAddress(deal.address)
                    setTempCity(deal.city || '')
                    setTempState(deal.state || '')
                    setTempZipCode(deal.zipCode || '')
                    setIsEditingAddress(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors flex-shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={tempAddress}
                    onChange={(e) => setTempAddress(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={tempCity}
                    onChange={(e) => setTempCity(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isSaving}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={tempState}
                    onChange={(e) => setTempState(e.target.value)}
                    className="w-16 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isSaving}
                    maxLength={2}
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={tempZipCode}
                    onChange={(e) => setTempZipCode(e.target.value)}
                    className="w-20 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isSaving}
                    maxLength={10}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveAddress}
                    disabled={isSaving}
                    className="text-success-600 hover:text-success-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingAddress(false)}
                    disabled={isSaving}
                    className="text-error-600 hover:text-error-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Units - Display Only */}
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <Home className="w-4 h-4" />
              Units
            </div>
            <div>
              <div className="font-medium text-neutral-900">
                {deal.units ? `${deal.units} units` : 'Not set'}
              </div>
              {deal.pricePerUnit && (
                <div className="text-sm text-neutral-600">
                  {formatCurrency(deal.pricePerUnit)}/unit
                </div>
              )}
            </div>
          </div>

          {/* Square Feet - Now Editable */}
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
              <Ruler className="w-4 h-4" />
              Square Feet
            </div>
            {!isEditingSqft ? (
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-medium text-neutral-900">
                    {deal.squareFeet ? `${deal.squareFeet.toLocaleString()} sq ft` : 'Not set'}
                  </div>
                  {deal.pricePerSqft && (
                    <div className="text-sm text-neutral-600">
                      {formatCurrency(deal.pricePerSqft)}/sq ft
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setTempSqft(deal.squareFeet || 0)
                    setIsEditingSqft(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors flex-shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={tempSqft}
                  onChange={(e) => setTempSqft(parseInt(e.target.value) || 0)}
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                  placeholder="Square footage"
                />
                <button
                  onClick={handleSaveSqft}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50 flex-shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingSqft(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Expected Purchase Price - Editable (syncs to analysis) */}
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
              <DollarSign className="w-4 h-4" />
              Expected Purchase Price
            </div>
            {!isEditingPrice ? (
              <div className="flex items-center gap-2">
                <div className="font-medium text-neutral-900">{formatCurrency(deal.price)}</div>
                <button
                  onClick={() => {
                    setTempPrice(deal.price)
                    setIsEditingPrice(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors flex-shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                  placeholder="Expected purchase price"
                />
                <button
                  onClick={handleSavePrice}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50 flex-shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingPrice(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Financing Type - Not Editable */}
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <Hash className="w-4 h-4" />
              Financing
            </div>
            <div className="font-medium text-neutral-900 capitalize">
              {deal.financingType || 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Deal Tracking Card */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-neutral-900">Deal Tracking</h3>
          </div>
          <button
            onClick={() => setIsDealTrackingCollapsed(!isDealTrackingCollapsed)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={isDealTrackingCollapsed ? "Expand section" : "Collapse section"}
          >
            {isDealTrackingCollapsed ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
        </div>

        {!isDealTrackingCollapsed && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Stage */}
          <div className="min-w-0">
            <div className="text-sm text-neutral-500 mb-2">Stage</div>
            {!isEditingStage ? (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold truncate max-w-full ${getStageColors(deal.stage).bg} ${getStageColors(deal.stage).text}`}>
                  {getStageLabel(deal.stage)}
                </span>
                <button
                  onClick={() => {
                    setTempStage(deal.stage)
                    setIsEditingStage(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors flex-shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <select
                  value={tempStage}
                  onChange={(e) => setTempStage(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                >
                  {DEAL_STAGES.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveStage}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50 flex-shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingStage(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Forecast */}
          <div className="min-w-0">
            <div className="text-sm text-neutral-500 mb-2">Forecast Status</div>
            {!isEditingForecast ? (
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {getForecastLabel(deal.forecastStatus)}
                </span>
                <button
                  onClick={() => {
                    setTempForecast(deal.forecastStatus)
                    setIsEditingForecast(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={tempForecast}
                  onChange={(e) => setTempForecast(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                >
                  {FORECAST_STATUS.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveForecast}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingForecast(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Expected Close Date */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
              <Calendar className="w-4 h-4" />
              Expected Close
            </div>
            {!isEditingCloseDate ? (
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {formatDate(deal.expectedCloseDate)}
                </span>
                <button
                  onClick={() => {
                    setTempCloseDate(
                      deal.expectedCloseDate 
                        ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
                        : ''
                    )
                    setIsEditingCloseDate(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors flex-shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="date"
                  value={tempCloseDate}
                  onChange={(e) => setTempCloseDate(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveCloseDate}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50 flex-shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingCloseDate(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Created */}
          <div className="min-w-0">
            <div className="text-sm text-neutral-500 mb-2">Created</div>
            <div className="font-medium text-neutral-900">{createdDate}</div>
          </div>
        </div>
        )}
      </div>

      {/* ========================================
          ✨ NEW: Commission Details Card
          ======================================== */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-neutral-900">Commission Details</h3>
          </div>
          <button
            onClick={() => setIsCommissionCollapsed(!isCommissionCollapsed)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={isCommissionCollapsed ? "Expand section" : "Collapse section"}
          >
            {isCommissionCollapsed ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
        </div>

        {!isCommissionCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Commission Percent */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Expected Commission %</div>
            {!isEditingCommission ? (
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {deal.commissionPercent ? `${deal.commissionPercent.toFixed(2)}%` : 'Not set'}
                </span>
                <button
                  onClick={() => {
                    setTempCommissionPercent(deal.commissionPercent || 0)
                    setIsEditingCommission(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tempCommissionPercent}
                  onChange={(e) => setTempCommissionPercent(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveCommission}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingCommission(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Commission Amount */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Expected Commission Amount</div>
            <div className="font-medium text-neutral-900">
              {formatCurrency(commissionAmount)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Auto-calculated from price
            </div>
          </div>
        </div>
        )}
      </div>

      {/* ========================================
          ✨ NEW: Enhanced Financing Details Card
          ======================================== */}
      {deal.financingType === 'financed' && (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">Financing Details</h3>
            </div>
            <button
              onClick={() => setIsFinancingCollapsed(!isFinancingCollapsed)}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label={isFinancingCollapsed ? "Expand section" : "Collapse section"}
            >
              {isFinancingCollapsed ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </button>
          </div>

          {!isFinancingCollapsed && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Expected Purchase Price */}
            <div>
              <div className="text-sm text-neutral-500 mb-1">Expected Purchase Price</div>
              <div className="font-medium text-neutral-900">{formatCurrency(deal.price)}</div>
            </div>

            {/* Down Payment */}
            <div>
              <div className="text-sm text-neutral-500 mb-2">Down Payment</div>
              {!isEditingDownPayment ? (
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium text-neutral-900">{formatCurrency(downPayment)}</div>
                    {downPayment > 0 && (
                      <div className="text-xs text-neutral-500 mt-1">
                        {((downPayment / deal.price) * 100).toFixed(1)}% down
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setTempDownPayment(downPayment)
                      setIsEditingDownPayment(true)
                    }}
                    className="text-neutral-400 hover:text-primary-600 transition-colors flex-shrink-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    max={deal.price}
                    value={tempDownPayment}
                    onChange={(e) => setTempDownPayment(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleSaveDownPayment}
                    disabled={isSaving}
                    className="text-success-600 hover:text-success-700 disabled:opacity-50 flex-shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingDownPayment(false)}
                    disabled={isSaving}
                    className="text-error-600 hover:text-error-700 disabled:opacity-50 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Loan Amount */}
            <div>
              <div className="text-sm text-neutral-500 mb-1">Loan Amount</div>
              <div className="font-medium text-neutral-900">{formatCurrency(loanAmount)}</div>
            </div>

            {/* Interest Rate */}
            <div>
              <div className="text-sm text-neutral-500 mb-2">Interest Rate</div>
              {!isEditingLoanRate ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900">
                    {deal.loanRate ? `${deal.loanRate.toFixed(3)}%` : 'From analysis'}
                  </span>
                  <button
                    onClick={() => {
                      setTempLoanRate(deal.loanRate || 6.5)
                      setIsEditingLoanRate(true)
                    }}
                    className="text-neutral-400 hover:text-primary-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="20"
                    value={tempLoanRate}
                    onChange={(e) => setTempLoanRate(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleSaveLoanRate}
                    disabled={isSaving}
                    className="text-success-600 hover:text-success-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingLoanRate(false)}
                    disabled={isSaving}
                    className="text-error-600 hover:text-error-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Loan Term */}
            <div>
              <div className="text-sm text-neutral-500 mb-2">Loan Term</div>
              {!isEditingLoanTerm ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900">
                    {deal.loanTerm ? `${deal.loanTerm} years` : 'From analysis'}
                  </span>
                  <button
                    onClick={() => {
                      setTempLoanTerm(deal.loanTerm || 30)
                      setIsEditingLoanTerm(true)
                    }}
                    className="text-neutral-400 hover:text-primary-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="40"
                    value={tempLoanTerm}
                    onChange={(e) => setTempLoanTerm(parseInt(e.target.value) || 30)}
                    className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleSaveLoanTerm}
                    disabled={isSaving}
                    className="text-success-600 hover:text-success-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingLoanTerm(false)}
                    disabled={isSaving}
                    className="text-error-600 hover:text-error-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Monthly Payment */}
            <div>
              <div className="text-sm text-neutral-500 mb-1">Monthly Payment</div>
              <div className="font-medium text-neutral-900">{formatCurrency(monthlyPayment)}</div>
              <div className="text-xs text-neutral-500 mt-1">
                Principal + Interest
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* P&L Statement with Current vs Market */}
      {plData && (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">Profit & Loss Statement</h3>
            </div>
            <div className="flex items-center gap-3">
              {/* ✅ NEW: Monthly/Yearly Toggle */}
              <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
                <button
                  onClick={() => setIsPLYearly(false)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    !isPLYearly 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsPLYearly(true)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    isPLYearly 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Yearly
                </button>
              </div>
              {deal.analysis && (
                <a
                  href={`/dashboard?analysisId=${deal.analysis.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                >
                  📊 View Analysis
                </a>
              )}
              {/* ✅ NEW: Export Button with Dropdown */}
              <div className="relative">
                <button
                  ref={exportButtonRef}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-1.5 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Export P&L Statement"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                {/* Export Dropdown Menu */}
                {showExportMenu && (
                  <div
                    ref={exportMenuRef}
                    className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10"
                  >
                    <button
                      onClick={exportToPDF}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download as PDF
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download as CSV
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsPLCollapsed(!isPLCollapsed)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors ml-2"
                aria-label={isPLCollapsed ? "Expand section" : "Collapse section"}
              >
                {isPLCollapsed ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {!isPLCollapsed && (
            <div className="space-y-6">
            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-4 pb-2 border-b border-neutral-200">
              <div></div>
              <div className="text-sm font-semibold text-neutral-600 text-right">Current</div>
              <div className="text-sm font-semibold text-neutral-600 text-right">Market</div>
            </div>

            {/* INCOME */}
            <div>
              <div className="text-sm font-semibold text-neutral-900 mb-3">INCOME</div>
              <div className="space-y-2 ml-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-neutral-700">Rental Income:</div>
                  <div className="text-sm text-neutral-900 text-right font-medium">
                    {formatCurrency(plData.current.rentalIncome * (isPLYearly ? 12 : 1))}
                  </div>
                  <div className="text-sm text-neutral-900 text-right font-medium">
                    {formatCurrency(plData.market.rentalIncome * (isPLYearly ? 12 : 1))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-neutral-700">Other Income:</div>
                  <div className="text-sm text-neutral-900 text-right font-medium">
                    {formatCurrency(plData.current.otherIncome * (isPLYearly ? 12 : 1))}
                  </div>
                  <div className="text-sm text-neutral-900 text-right font-medium">
                    {formatCurrency(plData.market.otherIncome * (isPLYearly ? 12 : 1))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-neutral-100">
                  <div className="text-sm font-semibold text-neutral-900">Total Income:</div>
                  <div className="text-sm font-bold text-neutral-900 text-right">
                    {formatCurrency(plData.current.totalIncome * (isPLYearly ? 12 : 1))}
                  </div>
                  <div className="text-sm font-bold text-neutral-900 text-right">
                    {formatCurrency(plData.market.totalIncome * (isPLYearly ? 12 : 1))}
                  </div>
                </div>
              </div>
            </div>

            {/* OPERATING EXPENSES */}
            <div>
              <div className="text-sm font-semibold text-neutral-900 mb-3">OPERATING EXPENSES</div>
              <div className="space-y-2 ml-4">
                {plData.current.expenses.map((expense: any, index: number) => (
                  <div key={index} className="grid grid-cols-3 gap-4">
                    <div className="text-sm text-neutral-700">{expense.name}:</div>
                    <div className="text-sm text-neutral-900 text-right font-medium">
                      {formatCurrency(expense.amount * (isPLYearly ? 12 : 1))}
                    </div>
                    <div className="text-sm text-neutral-900 text-right font-medium">
                      {formatCurrency(plData.market.expenses[index].amount * (isPLYearly ? 12 : 1))}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-neutral-100">
                  <div className="text-sm font-semibold text-neutral-900">Total Expenses:</div>
                  <div className="text-sm font-bold text-neutral-900 text-right">
                    {formatCurrency(plData.current.totalExpenses * (isPLYearly ? 12 : 1))}
                  </div>
                  <div className="text-sm font-bold text-neutral-900 text-right">
                    {formatCurrency(plData.market.totalExpenses * (isPLYearly ? 12 : 1))}
                  </div>
                </div>
              </div>
            </div>

            {/* NET OPERATING INCOME */}
            <div className="grid grid-cols-3 gap-4 py-3 border-y-2 border-primary-200 bg-primary-50/30">
              <div className="text-sm font-bold text-neutral-900">NET OPERATING INCOME</div>
              <div className="text-sm font-bold text-primary-700 text-right">
                {formatCurrency(plData.current.noi * (isPLYearly ? 12 : 1))}
              </div>
              <div className="text-sm font-bold text-primary-700 text-right">
                {formatCurrency(plData.market.noi * (isPLYearly ? 12 : 1))}
              </div>
            </div>

            {/* DEBT SERVICE */}
            <div>
              <div className="text-sm font-semibold text-neutral-900 mb-3">DEBT SERVICE</div>
              <div className="grid grid-cols-3 gap-4 ml-4">
                <div className="text-sm text-neutral-700">Mortgage Payment:</div>
                <div className="text-sm text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.current.debtService * (isPLYearly ? 12 : 1))}
                </div>
                <div className="text-sm text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.market.debtService * (isPLYearly ? 12 : 1))}
                </div>
              </div>
            </div>

            {/* CASH FLOW */}
            <div className="grid grid-cols-3 gap-4 py-3 border-y-2 border-neutral-300 bg-neutral-50">
              <div className="text-base font-bold text-neutral-900">CASH FLOW</div>
              <div className={`text-base font-bold text-right ${plData.current.cashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(plData.current.cashFlow * (isPLYearly ? 12 : 1))}
              </div>
              <div className={`text-base font-bold text-right ${plData.market.cashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(plData.market.cashFlow * (isPLYearly ? 12 : 1))}
              </div>
            </div>

            {/* KEY METRICS */}
            {metrics && (
              <div className="pt-4 border-t border-neutral-200">
                <div className="text-sm font-semibold text-neutral-900 mb-3">KEY METRICS</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  {/* Cap Rate */}
                  <div className="text-neutral-600">• Cap Rate:</div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.current.noi * 12 > 0 
                      ? formatPercentage((plData.current.noi * 12 / deal.price) * 100, 2)
                      : 'N/A'}
                  </div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.market.noi * 12 > 0 
                      ? formatPercentage((plData.market.noi * 12 / deal.price) * 100, 2)
                      : 'N/A'}
                  </div>
                  
                  {/* Cash-on-Cash Return */}
                  {/* ✅ Use recalculated total investment based on current down payment */}
                  {downPayment > 0 && (
                    <>
                      <div className="text-neutral-600">• Cash-on-Cash:</div>
                      <div className="text-neutral-900 text-right font-medium">
                        {formatPercentage((plData.current.cashFlow * 12 / downPayment) * 100, 2)}
                      </div>
                      <div className="text-neutral-900 text-right font-medium">
                        {formatPercentage((plData.market.cashFlow * 12 / downPayment) * 100, 2)}
                      </div>
                    </>
                  )}
                  
                  {/* GRM */}
                  <div className="text-neutral-600">• GRM:</div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.current.rentalIncome * 12 > 0 
                      ? (deal.price / (plData.current.rentalIncome * 12)).toFixed(2)
                      : 'N/A'}
                  </div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.market.rentalIncome * 12 > 0 
                      ? (deal.price / (plData.market.rentalIncome * 12)).toFixed(2)
                      : 'N/A'}
                  </div>
                  
                  {/* DSCR */}
                  <div className="text-neutral-600">• DSCR:</div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.current.debtService > 0 
                      ? (plData.current.noi / plData.current.debtService).toFixed(2)
                      : 'N/A'}
                  </div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.market.debtService > 0 
                      ? (plData.market.noi / plData.market.debtService).toFixed(2)
                      : 'N/A'}
                  </div>
                </div>
                
                {/* Metrics that don't vary */}
                <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-600">
                  <div className="grid grid-cols-2 gap-2">
                    {/* ✅ Use recalculated down payment instead of stale metrics.totalInvestment */}
                    <div>• Total Investment: <span className="font-medium text-neutral-900">{formatCurrency(downPayment)}</span></div>
                    {deal.units && <div>• Price/Unit: <span className="font-medium text-neutral-900">{formatCurrency(deal.price / deal.units)}</span></div>}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* No Analysis State - Show when deal has no linked analysis */}
      {!deal.analysis && (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-neutral-900">Profit & Loss Statement</h3>
          </div>
          
          <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-primary-600" />
            </div>
            
            <h4 className="text-lg font-semibold text-neutral-900 mb-2">
              No Financial Analysis
            </h4>
            
            <p className="text-neutral-600 mb-4 max-w-md mx-auto">
              This deal doesn't have a profit & loss analysis yet. Create one to see Cap Rate, NOI, Cash Flow, and complete financial metrics.
            </p>
            
            <div className="bg-white rounded-lg p-4 mb-4 max-w-sm mx-auto">
              <p className="text-sm font-medium text-neutral-700 mb-2">Creating an analysis will show:</p>
              <ul className="text-sm text-neutral-600 space-y-1 text-left">
                <li>• Cap Rate & Cash-on-Cash Return</li>
                <li>• Net Operating Income (NOI)</li>
                <li>• Monthly & Annual Cash Flow</li>
                <li>• Gross Rent Multiplier (GRM)</li>
                <li>• Complete income & expense breakdown</li>
              </ul>
            </div>
            
            <a
              href={`/dashboard?fromDeal=${deal.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Receipt className="w-5 h-5" />
              Create Analysis
            </a>
          </div>
        </div>
      )}
    </div>
  )
}