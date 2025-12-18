// src/components/analysis/pdf/defaultSections.ts

import { PDFSectionConfig } from '@/types/pdf'

export const createDefaultSections = (
  isCashPurchase: boolean,
  hasMarketAnalysis: boolean
): PDFSectionConfig[] => {
  console.log('Creating sections with:', { isCashPurchase, hasMarketAnalysis }) // Debug log
  
  const sections: PDFSectionConfig[] = [
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
      label: 'Income & Expense Statement',
      description: 'Combined P&L with income, expenses, NOI, and cash flow',
      icon: '📊',
      required: false,
      enabled: true,
      estimatedPages: 0.75
    },
    {
      id: 'expenses',
      label: 'Income & Expense Statement',
      description: '(Combined with Income section - enable Income to show P&L)',
      icon: '📊',
      required: false,
      enabled: false,
      estimatedPages: 0
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
      id: 'returns',
      label: 'Return Metrics',
      description: 'ROI, internal rate of return, and payback period',
      icon: '📈',
      required: false,
      enabled: true,
      estimatedPages: 0.3
    }
  ]

  // Only add financing section if NOT cash purchase
  if (!isCashPurchase) {
    sections.push({
      id: 'financing',
      label: 'Financing Details',
      description: 'Loan terms, monthly payments, and debt service coverage ratio',
      icon: '🏦',
      required: false,
      enabled: true,
      estimatedPages: 0.4
    })
  }

  // Only add market analysis section if available
  if (hasMarketAnalysis) {
    sections.push({
      id: 'market',
      label: 'Market Analysis',
      description: 'Current vs market rent comparison and upside potential',
      icon: '🎯',
      required: false,
      enabled: false, // Disabled by default but available
      estimatedPages: 0.5
    })
  }

  // Always add sensitivity analysis (coming soon)
  sections.push({
    id: 'sensitivity',
    label: 'Sensitivity Analysis',
    description: 'What-if scenarios and stress testing',
    icon: '🔬',
    required: false,
    enabled: false,
    estimatedPages: 0.5,
    comingSoon: true
  })

  return sections
}