'use client'

import { useState, useEffect } from 'react'
import { UnitType } from '@/types'
import { generateId, formatCurrency } from '@/lib/utils'
import { Card } from '@/components'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface UnitMixFormProps {
  data: UnitType[]
  onUpdate: (data: UnitType[]) => void
  totalUnits: number
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
  totalUnits
}: UnitMixFormProps) {
  const [unitMix, setUnitMix] = useState<UnitType[]>(data)
  const [newUnit, setNewUnit] = useState<Omit<UnitType, 'id'>>({
    type: UNIT_TYPES[0],
    count: 1,
    squareFootage: 800,
    currentRent: 1200,
    marketRent: 1300,
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Calculate pagination
  const unitsPerPage = isMobile ? 5 : 10
  const totalPages = Math.ceil(unitMix.length / unitsPerPage)
  const startIndex = (currentPage - 1) * unitsPerPage
  const endIndex = startIndex + unitsPerPage
  const currentUnits = unitMix.slice(startIndex, endIndex)
  
  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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
      // Go to last page to see newly added unit
      const newTotalPages = Math.ceil((unitMix.length + 1) / unitsPerPage)
      setCurrentPage(newTotalPages)
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

  const calculateUpsidePotential = () => {
    const currentGross = calculateTotalCurrentRent()
    const marketGross = calculateTotalMarketRent()
    return marketGross - currentGross
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

      {/* Unit Mix Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {calculateTotalUnits()}/{totalUnits}
            </div>
            <div className="text-sm text-neutral-600">Units Allocated</div>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <div className="text-2xl font-bold text-secondary-600 mb-1">
              {formatCurrency(calculateTotalCurrentRent())}
            </div>
            <div className="text-sm text-neutral-600">Monthly Gross Current Income</div>
            <div className="text-xs text-neutral-500">
              (before vacancy & expenses)
            </div>
          </div>
          <div className="text-center p-4 bg-neutral-50 rounded-lg">
            <div className="text-2xl font-bold text-neutral-600 mb-1">
              {formatCurrency(calculateTotalMarketRent())}
            </div>
            <div className="text-sm text-neutral-600">Monthly Gross Market Income</div>
            <div className="text-xs text-neutral-500">
              (before vacancy & expenses)
            </div>
          </div>
          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <div className="text-2xl font-bold text-accent-600 mb-1">
              {formatCurrency(calculateUpsidePotential())}
            </div>
            <div className="text-sm text-neutral-600">Monthly Upside Potential</div>
          </div>
        </div>
      </Card>

      {/* Add New Unit Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Add Unit Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Type
            </label>
            <select
              value={newUnit.type}
              onChange={(e) => setNewUnit({...newUnit, type: e.target.value})}
              className="input-field w-full"
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
              className="input-field w-full"
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
              className="input-field w-full"
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
              className="input-field w-full"
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
              className="input-field w-full"
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

      {/* Unit Mix Display - WITH PAGINATION */}
      {unitMix.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">
              Current Unit Mix
              {totalPages > 1 && (
                <span className="ml-2 text-sm font-normal text-neutral-500">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </h3>
            
            {/* Pagination Controls - Top */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-neutral-600 px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          
          {/* CARD LAYOUT - Paginated Units */}
          <div className="space-y-4">
            {currentUnits.map((unit) => {
              const monthlyCurrentGross = unit.currentRent * unit.count
              const monthlyMarketGross = unit.marketRent * unit.count
              
              return (
                <div key={unit.id} className="border border-neutral-200 rounded-lg p-4 bg-white relative">
                  {/* Remove button - top right */}
                  <button
                    onClick={() => handleRemoveUnit(unit.id)}
                    className="absolute top-2 right-2 text-error-600 hover:text-error-800 p-2"
                    aria-label="Remove unit"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Unit Type */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Unit Type
                    </label>
                    <select
                      value={unit.type}
                      onChange={(e) => handleUpdateUnit(unit.id, 'type', e.target.value)}
                      className="input-field text-sm w-full"
                    >
                      {UNIT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Count and Sq Ft - side by side */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">
                        Count
                      </label>
                      <input
                        type="number"
                        value={unit.count}
                        onChange={(e) => handleUpdateUnit(unit.id, 'count', parseInt(e.target.value) || 1)}
                        className="input-field text-sm w-full"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">
                        Sq Ft
                      </label>
                      <input
                        type="number"
                        value={unit.squareFootage}
                        onChange={(e) => handleUpdateUnit(unit.id, 'squareFootage', parseInt(e.target.value) || 0)}
                        className="input-field text-sm w-full"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Current Rent and Market Rent - side by side */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">
                        Current Rent
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <span className="text-neutral-500 text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          value={unit.currentRent}
                          onChange={(e) => handleUpdateUnit(unit.id, 'currentRent', parseInt(e.target.value) || 0)}
                          className="input-field text-sm pl-6 w-full"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">
                        Market Rent
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <span className="text-neutral-500 text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          value={unit.marketRent}
                          onChange={(e) => handleUpdateUnit(unit.id, 'marketRent', parseInt(e.target.value) || 0)}
                          className="input-field text-sm pl-6 w-full"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated values */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-100">
                    <div>
                      <div className="text-xs text-neutral-500">Monthly Gross Current</div>
                      <div className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(monthlyCurrentGross)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Monthly Gross Market</div>
                      <div className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(monthlyMarketGross)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Pagination Controls - Bottom */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Previous
                </button>
                <span className="text-sm text-neutral-600 px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Next
                </button>
              </div>
            )}

            {/* Totals - Always visible */}
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <div className="text-sm font-semibold text-primary-900 mb-3">Totals (Gross)</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-primary-700">Current</div>
                  <div className="text-lg font-bold text-primary-900">
                    {formatCurrency(calculateTotalCurrentRent())}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-primary-700">Market</div>
                  <div className="text-lg font-bold text-primary-900">
                    {formatCurrency(calculateTotalMarketRent())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}