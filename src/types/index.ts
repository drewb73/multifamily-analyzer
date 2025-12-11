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
}

export interface UnitType {
  id: string;
  type: string; // e.g., "studio", "1bd1bth", "2bd2bth"
  count: number;
  squareFootage: number;
  currentRent: number;
  marketRent: number;
  vacancyRate: number; // as a percentage (0-100)
}

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean; // Fixed typo
  percentageOf: 'income' | 'rent';
}

export interface IncomeCategory {
  id: string;
  name: string;
  amount: number;
  isVariable: boolean;
}

export interface AnalysisInputs { // Fixed typo
  property: PropertyDetails; // Fixed typo
  unitMix: UnitType[];
  expenses: ExpenseCategory[];
  income: IncomeCategory[];
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

// Additional types for the app
export interface User {
  id: string;
  email: string;
  name: string;
  isSubscribed: boolean;
  createdAt: Date;
}

export interface SavedAnalysis {
  id: string;
  userId: string;
  inputs: AnalysisInputs;
  results: AnalysisResults;
  createdAt: Date;
  updatedAt: Date;
}

