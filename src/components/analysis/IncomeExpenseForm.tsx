'use client'

import { useState, useEffect } from 'react'
import { IncomeCategory, ExpenseCategory } from '@/types'
import { generateId, formatCurrency } from '@/lib/utils'
import { Card } from '@/components'

interface IncomeExpenseFormProps {
  incomeData: IncomeCategory[]
  expenseData: ExpenseCategory[]
  onUpdate: (income: IncomeCategory[], expenses: ExpenseCategory[]) => void
}

const DEFAULT_EXPENSES: ExpenseCategory[] = [
  { id: '1', name: 'Property Taxes', amount: 0, isPercentage: false, percentageOf: 'income' },
  { id: '2', name: 'Insurance', amount: 0, isPercentage: false, percentageOf: 'income' },
  { id: '3', name: 'Utilities', amount: 0, isPercentage: false, percentageOf: 'income' },
  { id: '4', name: 'Repairs & Maintenance', amount: 5, isPercentage: true, percentageOf: 'income' },
  { id: '5', name: 'Property Management', amount: 8, isPercentage: true, percentageOf: 'income' },
  { id: '6', name: 'Vacancy Reserve', amount: 5, isPercentage: true, percentageOf: 'income' },
  { id: '7', name: 'Capital Expenditures', amount: 5, isPercentage: true, percentageOf: 'income' },
]

const DEFAULT_INCOME: IncomeCategory[] = [
  { id: '1', name: 'Rental Income', amount: 0, isVariable: true },
  { id: '2', name: 'Parking Income', amount: 0, isVariable: false },
  { id: '3', name: 'Laundry Income', amount: 0, isVariable: false },
  { id: '4', name: 'Storage Income', amount: 0, isVariable: false },
  { id: '5', name: 'Other Income', amount: 0, isVariable: false },
]

export function IncomeExpenseForm({ incomeData, expenseData, onUpdate }: IncomeExpenseFormProps) {
  const [expenses, setExpenses] = useState<ExpenseCategory[]>(
    expenseData.length > 0 ? expenseData : DEFAULT_EXPENSES
  )
  const [income, setIncome] = useState<IncomeCategory[]>(
    incomeData.length > 0 ? incomeData : DEFAULT_INCOME
  )

  useEffect(() => {
    onUpdate(income, expenses)
  }, [income, expenses, onUpdate])

  const handleExpenseChange = (id: string, field: keyof ExpenseCategory, value: string | number | boolean) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, [field]: value } : expense
    ))
  }

  const handleIncomeChange = (id: string, field: keyof IncomeCategory, value: string | number | boolean) => {
    setIncome(income.map(inc => 
      inc.id === id ? { ...inc, [field]: value } : inc
    ))
  }

  const addExpense = () => {
    setExpenses([
      ...expenses,
      { id: generateId(), name: '', amount: 0, isPercentage: false, percentageOf: 'income' }
    ])
  }

  const addIncome = () => {
    setIncome([
      ...income,
      { id: generateId(), name: '', amount: 0, isVariable: false }
    ])
  }

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id))
  }

  const removeIncome = (id: string) => {
    setIncome(income.filter(inc => inc.id !== id))
  }

  const calculateTotalExpenses = (monthlyIncome: number) => {
    return expenses.reduce((total, expense) => {
      if (expense.isPercentage) {
        return total + (monthlyIncome * (expense.amount / 100))
      }
      return total + expense.amount
    }, 0)
  }

  const calculateTotalIncome = () => {
    return income.reduce((total, inc) => total + inc.amount, 0)
  }

  const monthlyIncome = calculateTotalIncome()
  const monthlyExpenses = calculateTotalExpenses(monthlyIncome)
  const netOperatingIncome = monthlyIncome - monthlyExpenses

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-6">
          Income & Expenses
        </h2>
        <p className="text-neutral-600 mb-6">
          Enter your projected monthly income and expenses for the property.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {formatCurrency(monthlyIncome)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Monthly Income</div>
          <div className="text-sm text-neutral-600">Gross Operating Income</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-secondary-600 mb-2">
            {formatCurrency(monthlyExpenses)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Monthly Expenses</div>
          <div className="text-sm text-neutral-600">Total Operating Expenses</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-accent-600 mb-2">
            {formatCurrency(netOperatingIncome)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Monthly NOI</div>
          <div className="text-sm text-neutral-600">Net Operating Income</div>
        </Card>
      </div>

      {/* Income Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-neutral-800">Income Sources</h3>
          <button
            onClick={addIncome}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Add Income Source
          </button>
        </div>

        <div className="space-y-4">
          {income.map((inc) => (
            <div key={inc.id} className="grid md:grid-cols-4 gap-4 items-center">
              <div>
                <input
                  type="text"
                  value={inc.name}
                  onChange={(e) => handleIncomeChange(inc.id, 'name', e.target.value)}
                  className="input-field"
                  placeholder="Income source name"
                />
              </div>
              
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500">$</span>
                  </div>
                  <input
                    type="number"
                    value={inc.amount || ''}
                    onChange={(e) => handleIncomeChange(inc.id, 'amount', parseFloat(e.target.value) || 0)}
                    className="input-field pl-7"
                    placeholder="Monthly amount"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={inc.isVariable}
                    onChange={(e) => handleIncomeChange(inc.id, 'isVariable', e.target.checked)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Variable (based on occupancy)</span>
                </label>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => removeIncome(inc.id)}
                  className="text-error-600 hover:text-error-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Expenses Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-neutral-800">Expenses</h3>
          <button
            onClick={addExpense}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Add Expense
          </button>
        </div>

        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="grid md:grid-cols-5 gap-4 items-center">
              <div>
                <input
                  type="text"
                  value={expense.name}
                  onChange={(e) => handleExpenseChange(expense.id, 'name', e.target.value)}
                  className="input-field"
                  placeholder="Expense name"
                />
              </div>
              
              <div>
                <div className="relative">
                  {expense.isPercentage ? (
                    <>
                      <input
                        type="number"
                        value={expense.amount || ''}
                        onChange={(e) => handleExpenseChange(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="input-field pr-8"
                        placeholder="Percentage"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-neutral-500">%</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-neutral-500">$</span>
                      </div>
                      <input
                        type="number"
                        value={expense.amount || ''}
                        onChange={(e) => handleExpenseChange(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="input-field pl-7"
                        placeholder="Monthly amount"
                        min="0"
                      />
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={expense.isPercentage}
                    onChange={(e) => handleExpenseChange(expense.id, 'isPercentage', e.target.checked)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Is Percentage</span>
                </label>
              </div>
              
              <div>
                <select
                  value={expense.percentageOf}
                  onChange={(e) => handleExpenseChange(expense.id, 'percentageOf', e.target.value as 'income' | 'rent')}
                  className="input-field"
                  disabled={!expense.isPercentage}
                >
                  <option value="income">of Income</option>
                  <option value="rent">of Rent</option>
                </select>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => removeExpense(expense.id)}
                  className="text-error-600 hover:text-error-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}