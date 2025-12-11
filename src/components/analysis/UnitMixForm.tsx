'use client'

import { useState, useEffect } from 'react'
import { UnitType } from '@/types'
import { generateId, formatCurrency } from '@/lib/utils'
import { Card } from '@/components'

interface UnitMixFormProps {
  data: UnitType[]
  onUpdate: (data: UnitType[]) => void
  totalUnits: number
  overallVacancyRate: number
  onVacancyRateChange: (rate: number) => void
}

const UNIT_TYPES = [
  'Studio',
  '1 Bedroom / 1 Bath',
  '1 Bedroom / 1.5 Bath',
  '2 Bedroom / 1 Bath',
  '2 Bedroom / 1.5 Bath',
  '2 Bedroom / 2 Bath',
  '3 Bedroom / 2 Bath',
  '3 Bedroom / 2.5 Bath',
  '4 Bedroom / 2 Bath',
  '4 Bedroom / 3 Bath',
]

export function UnitMixForm({ 
  data, 
  onUpdate, 
  totalUnits,
  overallVacancyRate,
  onVacancyRateChange 
}: UnitMixFormProps) {
  const [unitMix, setUnitMix] = useState<UnitType[]>(data)
  const [newUnit, setNewUnit] = useState<Omit<UnitType, 'id'>>({
    type: UNIT_TYPES[0],
    count: 1,
    squareFootage: 800,
    currentRent: 1200,
    marketRent: 1300,
  })

  useEffect(() => {
    onUpdate(unitMix)
  }, [unitMix, onUpdate])

  const handleAddUnit = () => {
    const totalCurrentUnits = unitMix.reduce((sum, unit) => sum + unit.count, 0)
    const availableUnits = totalUnits - totalCurrentUnits
    
    if (availableUnits >= newUnit.count) {
      setUnitMix([...unitMix, { ...newUnit, id: generateId() }])
      setNewUnit({
        type: UNIT_TYPES[0],
        count: 1,
        squareFootage: 800,
        currentRent: 1200,
        marketRent: 1300,
      })
    } else {
      alert(`Only ${availableUnits} units available. Adjust your counts.`)
    }
  }

  const handleRemoveUnit = (id: string) => {
    setUnitMix(unitMix.filter(unit => unit.id !== id))
  }

  const handleUpdateUnit = (id: string, field: keyof UnitType, value: string | number) => {
    setUnitMix(unitMix.map(unit => 
      unit.id === id ? { ...unit, [field]: value } : unit
    ))
  }

  const calculateTotalUnits = () => {
    return unitMix.reduce((sum, unit) => sum + unit.count, 0)
  }

  const calculateTotalCurrentRent = () => {
    return unitMix.reduce((sum, unit) => sum + (unit.currentRent * unit.count), 0)
  }

  const calculateTotalMarketRent = () => {
    return unitMix.reduce((sum, unit) => sum + (unit.marketRent * unit.count), 0)
  }

  const calculateNetCurrentIncome = () => {
    const grossCurrent = calculateTotalCurrentRent()
    return grossCurrent * (1 - (overallVacancyRate / 100))
  }

  const calculateNetMarketIncome = () => {
    const grossMarket = calculateTotalMarketRent()
    return grossMarket * (1 - (overallVacancyRate / 100))
  }

  const calculateUpsidePotential = () => {
    const currentNet = calculateNetCurrentIncome()
    const marketNet = calculateNetMarketIncome()
    return marketNet - currentNet
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-6">
          Unit Mix Analysis
        </h2>
        <p className="text-neutral-600 mb-6">
          Define the different unit types in your property with their rents.
          Total units available: <span className="font-semibold">{totalUnits}</span>
        </p>
      </div>

      {/* Vacancy Rate Input */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Overall Vacancy Rate</h3>
        <div className="max-w-md">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="number"
                  value={overallVacancyRate}
                  onChange={(e) => onVacancyRateChange(parseFloat(e.target.value) || 0)}
                  className="input-field pr-8"
                  placeholder="5"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500">%</span>
                </div>
              </div>
              <p className="text-sm text-neutral-500 mt-2">
                This vacancy rate will be applied to the total monthly rent to calculate net income.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Unit Mix Summary */}
      <Card className="p-6">
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {calculateTotalUnits()}/{totalUnits}
            </div>
            <div className="text-sm text-neutral-600">Units Allocated</div>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <div className="text-2xl font-bold text-secondary-600 mb-1">
              {formatCurrency(calculateNetCurrentIncome())}
            </div>
            <div className="text-sm text-neutral-600">Monthly Net Current Income</div>
            <div className="text-xs text-neutral-500">
              (after {overallVacancyRate}% vacancy)
            </div>
          </div>
          <div className="text-center p-4 bg-neutral-50 rounded-lg">
            <div className="text-2xl font-bold text-neutral-600 mb-1">
              {formatCurrency(calculateNetMarketIncome())}
            </div>
            <div className="text-sm text-neutral-600">Monthly Net Market Income</div>
            <div className="text-xs text-neutral-500">
              (after {overallVacancyRate}% vacancy)
            </div>
          </div>
          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <div className="text-2xl font-bold text-accent-600 mb-1">
              {formatCurrency(calculateUpsidePotential())}
            </div>
            <div className="text-sm text-neutral-600">Monthly Upside</div>
          </div>
        </div>
      </Card>

      {/* Add New Unit Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Add Unit Type</h3>
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Type
            </label>
            <select
              value={newUnit.type}
              onChange={(e) => setNewUnit({...newUnit, type: e.target.value})}
              className="input-field"
            >
              {UNIT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Count
            </label>
            <input
              type="number"
              value={newUnit.count}
              onChange={(e) => setNewUnit({...newUnit, count: parseInt(e.target.value) || 1})}
              className="input-field"
              min="1"
              max={totalUnits - calculateTotalUnits()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Sq Ft
            </label>
            <input
              type="number"
              value={newUnit.squareFootage}
              onChange={(e) => setNewUnit({...newUnit, squareFootage: parseInt(e.target.value) || 0})}
              className="input-field"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Current Rent
            </label>
            <input
              type="number"
              value={newUnit.currentRent}
              onChange={(e) => setNewUnit({...newUnit, currentRent: parseInt(e.target.value) || 0})}
              className="input-field"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Market Rent
            </label>
            <input
              type="number"
              value={newUnit.marketRent}
              onChange={(e) => setNewUnit({...newUnit, marketRent: parseInt(e.target.value) || 0})}
              className="input-field"
              min="0"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={handleAddUnit}
            disabled={calculateTotalUnits() >= totalUnits}
            className="btn-primary px-6 py-2"
          >
            Add Unit Type
          </button>
          {calculateTotalUnits() >= totalUnits && (
            <p className="text-sm text-error-600 mt-2">
              All units have been allocated. Remove some units to add more.
            </p>
          )}
        </div>
      </Card>

      {/* Unit Mix Table */}
      {unitMix.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Current Unit Mix</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Unit Type</th>
                  <th>Count</th>
                  <th>Sq Ft</th>
                  <th>Current Rent</th>
                  <th>Market Rent</th>
                  <th>Monthly Current Income</th>
                  <th>Monthly Market Income</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unitMix.map((unit) => {
                  const monthlyCurrentIncome = unit.currentRent * unit.count
                  const monthlyMarketIncome = unit.marketRent * unit.count
                  
                  return (
                    <tr key={unit.id}>
                      <td>
                        <select
                          value={unit.type}
                          onChange={(e) => handleUpdateUnit(unit.id, 'type', e.target.value)}
                          className="input-field text-sm"
                        >
                          {UNIT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={unit.count}
                          onChange={(e) => handleUpdateUnit(unit.id, 'count', parseInt(e.target.value) || 1)}
                          className="input-field text-sm"
                          min="1"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={unit.squareFootage}
                          onChange={(e) => handleUpdateUnit(unit.id, 'squareFootage', parseInt(e.target.value) || 0)}
                          className="input-field text-sm"
                          min="0"
                        />
                      </td>
                      <td>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <span className="text-neutral-500 text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={unit.currentRent}
                            onChange={(e) => handleUpdateUnit(unit.id, 'currentRent', parseInt(e.target.value) || 0)}
                            className="input-field text-sm pl-6"
                            min="0"
                          />
                        </div>
                      </td>
                      <td>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <span className="text-neutral-500 text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={unit.marketRent}
                            onChange={(e) => handleUpdateUnit(unit.id, 'marketRent', parseInt(e.target.value) || 0)}
                            className="input-field text-sm pl-6"
                            min="0"
                          />
                        </div>
                      </td>
                      <td className="font-medium">
                        {formatCurrency(monthlyCurrentIncome)}
                      </td>
                      <td className="font-medium">
                        {formatCurrency(monthlyMarketIncome)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleRemoveUnit(unit.id)}
                          className="text-error-600 hover:text-error-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {/* Total Row */}
                <tr className="bg-neutral-50 font-semibold">
                  <td colSpan={5} className="text-right pr-6">
                    Totals (Gross):
                  </td>
                  <td className="font-bold">
                    {formatCurrency(calculateTotalCurrentRent())}
                  </td>
                  <td className="font-bold">
                    {formatCurrency(calculateTotalMarketRent())}
                  </td>
                  <td></td>
                </tr>
                <tr className="bg-neutral-50 font-semibold border-t border-neutral-200">
                  <td colSpan={5} className="text-right pr-6">
                    Totals (Net after {overallVacancyRate}% vacancy):
                  </td>
                  <td className="font-bold">
                    {formatCurrency(calculateNetCurrentIncome())}
                  </td>
                  <td className="font-bold">
                    {formatCurrency(calculateNetMarketIncome())}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}