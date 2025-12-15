import { PropertyDetails, UnitType } from '@/types';

/**
 * Validate Property Details form (Step 1)
 */
export function validatePropertyDetails(data: PropertyDetails): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!data.address || data.address.trim() === '') {
    errors.push('Street address is required');
  }
  
  if (!data.city || data.city.trim() === '') {
    errors.push('City is required');
  }
  
  if (!data.state || data.state.trim() === '') {
    errors.push('State is required');
  }
  
  if (!data.zipCode || data.zipCode.trim() === '') {
    errors.push('ZIP code is required');
  }
  
  if (!data.purchasePrice || data.purchasePrice <= 0) {
    errors.push('Purchase price must be greater than 0');
  }
  
  if (!data.propertySize || data.propertySize <= 0) {
    errors.push('Total square feet must be greater than 0');
  }
  
  if (!data.totalUnits || data.totalUnits < 1) {
    errors.push('Total units must be at least 1');
  }

  // Financed purchase validations
  if (!data.isCashPurchase) {
    if (!data.downPayment || data.downPayment <= 0) {
      errors.push('Down payment is required for financed purchases');
    }
    
    if (data.downPayment > data.purchasePrice) {
      errors.push('Down payment cannot exceed purchase price');
    }
    
    if (!data.loanTerm || data.loanTerm <= 0) {
      errors.push('Loan term is required');
    }
    
    if (!data.interestRate || data.interestRate <= 0) {
      errors.push('Interest rate is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Unit Mix (Step 2)
 */
export function validateUnitMix(unitMix: UnitType[], totalUnits: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!unitMix || unitMix.length === 0) {
    errors.push('Please add at least one unit type');
    return { isValid: false, errors };
  }
  
  const allocatedUnits = unitMix.reduce((sum, unit) => sum + unit.count, 0);
  
  if (allocatedUnits < totalUnits) {
    errors.push(`You have ${totalUnits - allocatedUnits} unallocated units. Please allocate all units before continuing.`);
  }
  
  if (allocatedUnits > totalUnits) {
    errors.push(`You have allocated ${allocatedUnits - totalUnits} more units than available. Please adjust your unit counts.`);
  }
  
  // Validate individual units
  unitMix.forEach((unit, index) => {
    if (unit.count <= 0) {
      errors.push(`Unit type ${index + 1}: Count must be at least 1`);
    }
    if (unit.squareFootage <= 0) {
      errors.push(`Unit type ${index + 1}: Square footage must be greater than 0`);
    }
    if (unit.currentRent < 0) {
      errors.push(`Unit type ${index + 1}: Current rent cannot be negative`);
    }
    if (unit.marketRent < 0) {
      errors.push(`Unit type ${index + 1}: Market rent cannot be negative`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}