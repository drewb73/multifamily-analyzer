// src/components/analysis/pdf/PDFTemplatePreview.tsx
'use client'

import { PDFSectionConfig, ContactInfo, BrandingColors } from '@/types/pdf'
import { PDFHeader } from './PDFHeader'
import { PDFFooter } from './PDFFooter'
import { PDFPropertyDetails } from './sections/PDFPropertyDetails'
import { PDFKeyMetrics } from './sections/PDFKeyMetrics'
import { PDFIncomeExpensePL } from './sections/PDFIncomeExpensePL'
import { PDFCashFlowSummary } from './sections/PDFCashFlowSummary'
import { PDFFinancingDetails } from './sections/PDFFinancingDetails'
import { PDFReturnMetrics } from './sections/PDFReturnMetrics'
import { PDFMarketAnalysis } from './sections/PDFMarketAnalysis'

interface PDFTemplatePreviewProps {
  propertyName: string
  sections: PDFSectionConfig[]
  contactInfo: ContactInfo
  colors: BrandingColors
  includeCharts: boolean
  includeNotes: boolean
  blackAndWhite: boolean
  estimatedPages: number
  // Analysis data
  inputs?: any
  results?: any
}

export function PDFTemplatePreview({
  propertyName,
  sections,
  contactInfo,
  colors,
  includeCharts,
  includeNotes,
  blackAndWhite,
  estimatedPages,
  inputs,
  results
}: PDFTemplatePreviewProps) {
  const enabledSections = sections.filter(s => s.enabled)
  const showInHeader = contactInfo.position === 'header' || contactInfo.position === 'both'
  const showInFooter = contactInfo.position === 'footer' || contactInfo.position === 'both'
  const accentColor = blackAndWhite ? '#6B7280' : colors.accentColor

  // Wrapper for page break control
  const SectionWrapper = ({ children, id }: { children: React.ReactNode; id: string }) => (
    <div data-section-id={id} className="pdf-section-wrapper">
      {children}
    </div>
  )

  // Render section component based on ID
  const renderSection = (section: PDFSectionConfig) => {
    // If no data provided, show placeholder
    if (!inputs || !results) {
      return (
        <SectionWrapper key={section.id} id={section.id}>
          <div 
            className="border-l-4 pl-4 py-2"
            style={{ borderColor: accentColor }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{section.icon}</span>
              <h3 className="font-semibold text-neutral-900">{section.label}</h3>
            </div>
            <p className="text-sm text-neutral-600">{section.description}</p>
            {includeCharts && section.id !== 'property' && (
              <div className="mt-2 text-xs text-neutral-500 italic">
                + Charts and graphs
              </div>
            )}
          </div>
        </SectionWrapper>
      )
    }

    // Render actual components with data
    switch (section.id) {
      case 'property':
        return (
          <SectionWrapper key={section.id} id="property">
            <PDFPropertyDetails
              data={inputs.property}
              accentColor={accentColor}
            />
          </SectionWrapper>
        )

      case 'metrics':
        return (
          <SectionWrapper key={section.id} id="metrics">
            <PDFKeyMetrics
              data={results.keyMetrics}
              accentColor={accentColor}
              isCashPurchase={inputs.property.isCashPurchase}
            />
          </SectionWrapper>
        )

      case 'income':
      case 'expenses':
        // Combined P&L Statement
        const otherIncome = inputs.income?.filter((inc: any) => !inc.isCalculated) || []
        const vacancyExpense = inputs.expenses?.find((exp: any) => 
          exp.name.toLowerCase().includes('vacancy')
        )
        const vacancyRate = vacancyExpense?.isPercentage ? vacancyExpense.amount : inputs.overallVacancyRate || 0
        
        const monthlyRentalIncome = inputs.unitMix.reduce((sum: any, unit: any) => 
          sum + (unit.currentRent * unit.count), 0
        )

        // Only render once - skip if expenses is enabled and income already rendered
        const alreadyRendered = section.id === 'expenses' && 
          enabledSections.some(s => s.id === 'income' && s.enabled)
        
        if (alreadyRendered) return null

        return (
          <SectionWrapper key="income-expense-pl" id="income-expense">
            <PDFIncomeExpensePL
              unitMix={inputs.unitMix}
              otherIncome={otherIncome}
              vacancyRate={vacancyRate}
              grossIncome={results.annualBreakdown.grossIncome}
              effectiveGrossIncome={results.annualBreakdown.grossIncome * (1 - vacancyRate / 100)}
              expenses={inputs.expenses}
              totalMonthlyExpenses={results.monthlyBreakdown.totalExpenses}
              totalAnnualExpenses={results.annualBreakdown.totalExpenses}
              purchasePrice={inputs.property.purchasePrice}
              monthlyGrossIncome={results.monthlyBreakdown.grossIncome}
              monthlyRentalIncome={monthlyRentalIncome}
              netOperatingIncome={results.annualBreakdown.netOperatingIncome}
              debtService={results.annualBreakdown.debtService || 0}
              cashFlow={results.annualBreakdown.cashFlow || 0}
              isCashPurchase={inputs.property.isCashPurchase}
              accentColor={accentColor}
            />
          </SectionWrapper>
        )

      case 'cashflow':
        return (
          <SectionWrapper key={section.id} id="cashflow">
            <PDFCashFlowSummary
              data={{
                monthlyGrossIncome: results.monthlyBreakdown.grossIncome,
                monthlyExpenses: results.monthlyBreakdown.totalExpenses,
                monthlyNOI: results.monthlyBreakdown.netOperatingIncome,
                monthlyMortgage: results.monthlyBreakdown.mortgagePayment,
                monthlyCashFlow: results.monthlyBreakdown.cashFlow,
                annualGrossIncome: results.annualBreakdown.grossIncome,
                annualExpenses: results.annualBreakdown.totalExpenses,
                annualNOI: results.annualBreakdown.netOperatingIncome,
                annualDebtService: results.annualBreakdown.debtService,
                annualCashFlow: results.annualBreakdown.cashFlow
              }}
              accentColor={accentColor}
              isCashPurchase={inputs.property.isCashPurchase}
            />
          </SectionWrapper>
        )

      case 'financing':
        if (inputs.property.isCashPurchase) return null
        
        const loanAmount = inputs.property.purchasePrice - inputs.property.downPayment
        const monthlyRate = inputs.property.interestRate / 100 / 12
        const numPayments = inputs.property.loanTerm * 12
        const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                              (Math.pow(1 + monthlyRate, numPayments) - 1)
        const totalInterest = (monthlyPayment * numPayments) - loanAmount
        
        return (
          <SectionWrapper key={section.id} id="financing">
            <PDFFinancingDetails
              data={{
                purchasePrice: inputs.property.purchasePrice,
                downPayment: inputs.property.downPayment,
                loanAmount,
                interestRate: inputs.property.interestRate,
                loanTerm: inputs.property.loanTerm,
                monthlyPayment,
                totalInterest,
                debtServiceCoverageRatio: results.keyMetrics.debtServiceCoverageRatio
              }}
              accentColor={accentColor}
            />
          </SectionWrapper>
        )

      case 'returns':
        return (
          <SectionWrapper key={section.id} id="returns">
            <PDFReturnMetrics
              data={{
                capRate: results.keyMetrics.capRate,
                cashOnCashReturn: results.keyMetrics.cashOnCashReturn,
                annualCashFlow: results.keyMetrics.annualCashFlow,
                totalInvestment: results.keyMetrics.totalInvestment,
                netOperatingIncome: results.keyMetrics.netOperatingIncome,
                purchasePrice: inputs.property.purchasePrice
              }}
              accentColor={accentColor}
              isCashPurchase={inputs.property.isCashPurchase}
            />
          </SectionWrapper>
        )

      case 'market':
        const currentGrossIncome = inputs.unitMix.reduce((sum: number, unit: any) => 
          sum + (unit.currentRent * unit.count * 12), 0
        )
        const marketGrossIncome = inputs.unitMix.reduce((sum: number, unit: any) => 
          sum + (unit.marketRent * unit.count * 12), 0
        )
        
        return (
          <SectionWrapper key={section.id} id="market">
            <PDFMarketAnalysis
              unitMix={inputs.unitMix}
              currentGrossIncome={currentGrossIncome}
              marketGrossIncome={marketGrossIncome}
              accentColor={accentColor}
            />
          </SectionWrapper>
        )

      case 'sensitivity':
        // Coming soon placeholder
        return (
          <SectionWrapper key={section.id} id="sensitivity">
            <div 
              className="border-l-4 pl-4 py-2 bg-yellow-50"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{section.icon}</span>
                <h3 className="font-semibold text-neutral-900">{section.label}</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-neutral-600">{section.description}</p>
            </div>
          </SectionWrapper>
        )

      default:
        return null
    }
  }

  return (
    <div className="pdf-template-preview bg-white shadow-xl overflow-hidden" style={{ borderRadius: 0 }}>
      <PDFHeader
        propertyName={propertyName}
        contactInfo={contactInfo}
        colors={colors}
        blackAndWhite={blackAndWhite}
      />

      <div className="p-8 space-y-8 min-h-[400px]">

        {enabledSections.length > 0 ? (
          enabledSections.map(section => renderSection(section))
        ) : (
          <div className="text-center py-8 text-neutral-400">
            <p>No sections selected</p>
            <p className="text-sm mt-2">
              Select sections from the "Sections" tab
            </p>
          </div>
        )}

        {blackAndWhite && (
          <div className="mt-6 p-3 bg-neutral-100 rounded-lg border border-neutral-200">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <span>🖨️</span>
              <span className="font-medium">
                Black & White Mode - Optimized for printing
              </span>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-neutral-200">
          <div className="text-center text-sm text-neutral-600">
            <p>
              <span className="font-semibold text-neutral-900">
                {estimatedPages}
              </span>
              {' '}
              {estimatedPages === 1 ? 'page' : 'pages'} estimated
            </p>
            <p className="text-xs mt-1">
              {enabledSections.length} section{enabledSections.length !== 1 ? 's' : ''} included
            </p>
          </div>
        </div>
      </div>

      <PDFFooter
        contactInfo={contactInfo}
        colors={colors}
        blackAndWhite={blackAndWhite}
        pageNumber={1}
      />
    </div>
  )
}