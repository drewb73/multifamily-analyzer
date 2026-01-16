// FILE LOCATION: /src/lib/dealiq-constants.ts
// PURPOSE: Constants for DealIQ CRM system

// ============================================
// DEAL STAGES
// ============================================

export const DEAL_STAGES = [
  {
    id: 'prospecting',
    label: 'Prospecting',
    description: 'Initial property research and lead generation',
    color: 'neutral',
    probability: 10,
    order: 0,
    icon: '🔍'
  },
  {
    id: 'lead_qualification',
    label: 'Lead Qualification',
    description: 'Qualifying the opportunity and initial screening',
    color: 'blue',
    probability: 25,
    order: 1,
    icon: '📋'
  },
  {
    id: 'formal_underwriting',
    label: 'Formal Underwriting/Analysis',
    description: 'Detailed financial analysis and due diligence prep',
    color: 'purple',
    probability: 40,
    order: 2,
    icon: '📊'
  },
  {
    id: 'offer_loi',
    label: 'Offer/LOI',
    description: 'Letter of Intent or formal offer submitted',
    color: 'yellow',
    probability: 60,
    order: 3,
    icon: '📝'
  },
  {
    id: 'negotiation',
    label: 'Negotiation & Terms',
    description: 'Negotiating price, terms, and contract details',
    color: 'orange',
    probability: 75,
    order: 4,
    icon: '🤝'
  },
  {
    id: 'in_contract',
    label: 'In Contract',
    description: 'Under contract, performing due diligence',
    color: 'indigo',
    probability: 90,
    order: 5,
    icon: '📄'
  },
  {
    id: 'closed_won',
    label: 'Closed Won',
    description: 'Deal successfully closed!',
    color: 'success',
    probability: 100,
    order: 6,
    icon: '🎉',
    isFinal: true
  },
  {
    id: 'closed_lost',
    label: 'Closed Cancelled/Lost',
    description: 'Deal cancelled or fell through',
    color: 'error',
    probability: 0,
    order: 7,
    icon: '❌',
    isFinal: true
  },
  {
    id: 'on_hold',
    label: 'On Hold',
    description: 'Paused, revisit later',
    color: 'gray',
    probability: null,
    order: 8,
    icon: '⏸️',
    isParked: true
  },
] as const

// ============================================
// FORECAST STATUS
// ============================================

export const FORECAST_STATUS = [
  { id: 'non_forecastable', label: 'Non Forecastable' },
  { id: 'most_likely', label: 'Most Likely' },
  { id: 'commit', label: 'Commit' },
  { id: 'upside', label: 'Upside' },
] as const

// ============================================
// LOST REASONS
// ============================================

export const LOST_REASONS = [
  // Price-Related
  { id: 'price_too_high', label: 'Price Too High', category: 'Price' },
  { id: 'offer_rejected', label: 'Offer Rejected', category: 'Price' },
  { id: 'couldnt_agree_price', label: "Couldn't Agree on Price", category: 'Price' },
  
  // Financing
  { id: 'financing_fell_through', label: 'Financing Fell Through', category: 'Financing' },
  { id: 'appraisal_low', label: 'Appraisal Came in Low', category: 'Financing' },
  { id: 'loan_denied', label: 'Loan Denied', category: 'Financing' },
  
  // Property Issues
  { id: 'inspection_issues', label: 'Failed Inspection', category: 'Property' },
  { id: 'title_issues', label: 'Title Issues', category: 'Property' },
  { id: 'property_condition', label: 'Poor Property Condition', category: 'Property' },
  { id: 'environmental_issues', label: 'Environmental Issues', category: 'Property' },
  
  // Financial Performance
  { id: 'numbers_dont_work', label: "Numbers Don't Work", category: 'Financials' },
  { id: 'occupancy_low', label: 'Occupancy Too Low', category: 'Financials' },
  { id: 'expenses_high', label: 'Expenses Higher Than Expected', category: 'Financials' },
  
  // Competition
  { id: 'lost_to_competition', label: 'Lost to Another Buyer', category: 'Competition' },
  { id: 'backup_offer', label: 'Backup Offer, Primary Closed', category: 'Competition' },
  
  // Timing/Strategy
  { id: 'timing_not_right', label: 'Timing Not Right', category: 'Timing' },
  { id: 'seller_changed_mind', label: 'Seller Changed Mind', category: 'Timing' },
  { id: 'market_changed', label: 'Market Conditions Changed', category: 'Timing' },
  
  // Other
  { id: 'no_longer_interested', label: 'No Longer Interested', category: 'Other' },
  { id: 'other', label: 'Other (specify in notes)', category: 'Other' },
] as const

// ============================================
// HOLD REASONS
// ============================================

export const HOLD_REASONS = [
  { id: 'waiting_seller', label: 'Waiting on Seller Response' },
  { id: 'waiting_partner', label: 'Waiting on Partner Decision' },
  { id: 'need_more_capital', label: 'Need to Raise More Capital' },
  { id: 'seasonal_hold', label: 'Waiting for Better Season' },
  { id: 'market_timing', label: 'Waiting for Market Conditions' },
  { id: 'other', label: 'Other' },
] as const

// ============================================
// CONTACT ROLES
// ============================================

export const CONTACT_ROLES = [
  'Seller',
  'Buyer Agent',
  'Listing Agent',
  'Lender',
  'Attorney',
  'Property Manager',
  'Inspector',
  'Title Company',
  'Contractor',
  'Accountant',
  'Partner/Investor',
  'Other'
] as const

// ============================================
// FINANCING TYPES
// ============================================

export const FINANCING_TYPES = [
  { id: 'cash', label: 'Cash' },
  { id: 'financed', label: 'Financed' },
] as const

// ============================================
// STAGE COLORS (Tailwind Classes)
// ============================================

export const STAGE_COLORS = {
  prospecting: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-300',
    dot: 'bg-neutral-500'
  },
  lead_qualification: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    dot: 'bg-blue-500'
  },
  formal_underwriting: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    dot: 'bg-purple-500'
  },
  offer_loi: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500'
  },
  negotiation: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    dot: 'bg-orange-500'
  },
  in_contract: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    dot: 'bg-indigo-500'
  },
  closed_won: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    border: 'border-success-300',
    dot: 'bg-success-500'
  },
  closed_lost: {
    bg: 'bg-error-100',
    text: 'text-error-700',
    border: 'border-error-300',
    dot: 'bg-error-500'
  },
  on_hold: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    dot: 'bg-gray-500'
  }
} as const

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get stage by ID
 */
export function getStageById(stageId: string) {
  return DEAL_STAGES.find(stage => stage.id === stageId)
}

/**
 * Get stage label
 */
export function getStageLabel(stageId: string) {
  return getStageById(stageId)?.label || stageId
}

/**
 * Get stage color classes
 */
export function getStageColors(stageId: string) {
  return STAGE_COLORS[stageId as keyof typeof STAGE_COLORS] || STAGE_COLORS.prospecting
}

/**
 * Get lost reason label
 */
export function getLostReasonLabel(reasonId: string) {
  return LOST_REASONS.find(r => r.id === reasonId)?.label || reasonId
}

/**
 * Get hold reason label
 */
export function getHoldReasonLabel(reasonId: string) {
  return HOLD_REASONS.find(r => r.id === reasonId)?.label || reasonId
}

/**
 * Get forecast status label
 */
export function getForecastLabel(statusId: string) {
  return FORECAST_STATUS.find(s => s.id === statusId)?.label || statusId
}

/**
 * Generate random 7-digit deal ID
 */
export function generateDealId(): string {
  return Math.floor(1000000 + Math.random() * 9000000).toString()
}

/**
 * Calculate days in pipeline
 */
export function calculateDaysInPipeline(createdAt: Date): number {
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}