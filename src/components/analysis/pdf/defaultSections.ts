// src/components/analysis/pdf/defaultSections.ts

import { PDFSectionConfig } from '@/types/pdf'

export const createDefaultSections = (
  isCashPurchase: boolean,
  hasMarketAnalysis: boolean
): PDFSectionConfig[] => {
  return [
    {
      id: 'property',
      label: 'Property Details',
      description: 'Address, units, purchase price, and property information',
      icon: '🏢',
      required: true,
      enabled: true,
      estimatedPages: 0.25
    },
    {
      id: 'metrics',
      label: 'Key Metrics',
      description: 'Cap rate, cash-on-cash return, annual cash flow, and NOI',
      icon: '📊',
      required: false,
      enabled: true,
      estimatedPages: 0.3
    },
    {
      id: 'income',
      label: 'Income Analysis',
      description: 'Rental income breakdown, vacancy loss, and effective gross income',
      icon: '💰',
      required: false,
      enabled: true,
      estimatedPages: 0.5
    },
    {
      id: 'expenses',
      label: 'Expense Breakdown',
      description: 'Operating expenses, taxes, insurance, and maintenance costs',
      icon: '💸',
      required: false,
      enabled: true,
      estimatedPages: 0.5
    },
    {
      id: 'cashflow',
      label: 'Cash Flow Summary',
      description: 'Monthly and annual cash flow projections',
      icon: '💵',
      required: false,
      enabled: true,
      estimatedPages: 0.3
    },
    {
      id: 'financing',
      label: 'Financing Details',
      description: 'Loan terms, monthly payments, and debt service coverage ratio',
      icon: '🏦',
      required: false,
      enabled: !isCashPurchase, // Auto-disable for cash purchases
      estimatedPages: 0.4,
      condition: !isCashPurchase // Only show if not cash purchase
    },
    {
      id: 'returns',
      label: 'Return Metrics',
      description: 'ROI, internal rate of return, and payback period',
      icon: '📈',
      required: false,
      enabled: true,
      estimatedPages: 0.3
    },
    {
      id: 'market',
      label: 'Market Analysis',
      description: 'Current vs market rent comparison and upside potential',
      icon: '🎯',
      required: false,
      enabled: false, // Disabled by default
      estimatedPages: 0.5,
      condition: hasMarketAnalysis // Only show if market analysis is available
    },
    {
      id: 'sensitivity',
      label: 'Sensitivity Analysis',
      description: 'What-if scenarios and stress testing',
      icon: '🔬',
      required: false,
      enabled: false,
      estimatedPages: 0.5,
      comingSoon: true // Not implemented yet
    }
  ]
}