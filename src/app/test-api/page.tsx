// src/app/test-api/page.tsx
'use client'

import { useState } from 'react'

export default function TestAPIPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testGetAnalyses = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analyses')
      const data = await response.json()
      setResult({ endpoint: 'GET /api/analyses', status: response.status, data })
    } catch (error: any) {
      setResult({ endpoint: 'GET /api/analyses', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testCreateAnalysis = async () => {
    setLoading(true)
    try {
      const testAnalysis = {
        name: 'Test Analysis',
        data: {
          property: {
            address: '123 Test St',
            city: 'Sacramento',
            state: 'CA',
            zipCode: '95823',
            purchasePrice: 1000000,
            totalUnits: 10,
            propertySize: 8000,
            isCashPurchase: false,
            downPayment: 250000,
            loanTerm: 30,
            interestRate: 6.5,
          },
          unitMix: [],
          expenses: [],
          income: [],
        },
        results: {
          keyMetrics: {
            capRate: 0.065,
            cashOnCashReturn: 0.08,
            netOperatingIncome: 65000,
            grossRentMultiplier: 10,
            debtServiceCoverageRatio: 1.25,
            totalInvestment: 250000,
            annualCashFlow: 20000,
          },
          monthlyBreakdown: {
            grossIncome: 8000,
            totalExpenses: 3000,
            netOperatingIncome: 5417,
            mortgagePayment: 3750,
            cashFlow: 1667,
          },
          annualBreakdown: {
            grossIncome: 96000,
            totalExpenses: 36000,
            netOperatingIncome: 65000,
            debtService: 45000,
            cashFlow: 20000,
          },
        },
        notes: 'This is a test analysis',
      }

      const response = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAnalysis),
      })
      const data = await response.json()
      setResult({ endpoint: 'POST /api/analyses', status: response.status, data })
    } catch (error: any) {
      setResult({ endpoint: 'POST /api/analyses', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Route Testing</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Endpoints</h2>
          
          <div className="space-y-4">
            <button
              onClick={testGetAnalyses}
              disabled={loading}
              className="btn-primary px-6 py-3 w-full"
            >
              {loading ? 'Testing...' : 'Test GET /api/analyses'}
            </button>

            <button
              onClick={testCreateAnalysis}
              disabled={loading}
              className="btn-secondary px-6 py-3 w-full"
            >
              {loading ? 'Testing...' : 'Test POST /api/analyses (Create)'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <div className="mb-2">
              <span className="font-semibold">Endpoint:</span> {result.endpoint}
            </div>
            {result.status && (
              <div className="mb-2">
                <span className="font-semibold">Status:</span>{' '}
                <span
                  className={
                    result.status === 200 || result.status === 201
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {result.status}
                </span>
              </div>
            )}
            <div>
              <span className="font-semibold">Response:</span>
              <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto max-h-96 text-sm">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Make sure you're signed in</li>
            <li>Set yourself to <strong>Premium</strong> in MongoDB to test POST</li>
            <li>Click "Test GET" to fetch analyses (should return empty array)</li>
            <li>Click "Test POST" to create an analysis (Premium only)</li>
            <li>Click "Test GET" again to see the created analysis</li>
          </ol>
        </div>
      </div>
    </div>
  )
}