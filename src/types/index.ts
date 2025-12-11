// Property analysis types
export interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  purchasePrice: number;
  downPayment: number;
  loanTerm: number; // in years
  interestRate: number;
  propertySize: number; // in square feet
  totalUnits: number;
  isCashPurchase: boolean; // NEW: Track if it's a cash purchase
}

export interface UnitType {
  id: string;
  type: string; // e.g., "studio", "1bd1bth", "2bd2bth"
  count: number;
  squareFootage: number;
  currentRent: number;
  marketRent: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;
  percentageOf: 'income' | 'propertyValue' | 'rent'; // UPDATED: Added 'propertyValue'
}

export interface IncomeCategory {
  id: string;
  name: string;
  amount: number;
  isVariable: boolean;
  isCalculated?: boolean; // NEW: Track if this is auto-calculated
}

export interface AnalysisInputs {
  property: PropertyDetails;
  unitMix: UnitType[];
  expenses: ExpenseCategory[];
  income: IncomeCategory[];
  overallVacancyRate: number; // NEW: Overall vacancy rate
  photos?: File[];
}

export interface AnalysisResults {
  keyMetrics: {
    capRate: number;
    cashOnCashReturn: number;
    netOperatingIncome: number;
    grossRentMultiplier: number;
    debtServiceCoverageRatio: number;
    totalInvestment: number;
    annualCashFlow: number;
    yearsToRecoup: number;
  };
  monthlyBreakdown: {
    grossIncome: number;
    totalExpenses: number;
    netOperatingIncome: number;
    mortgagePayment: number;
    cashFlow: number;
  };
  annualBreakdown: {
    grossIncome: number;
    totalExpenses: number;
    netOperatingIncome: number;
    debtService: number;
    cashFlow: number;
  };
}
