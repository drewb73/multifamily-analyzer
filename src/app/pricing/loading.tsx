// FILE LOCATION: /src/app/pricing/loading.tsx
// PURPOSE: Prevents flash while pricing page loads/hydrates

import { Loader2, Crown } from 'lucide-react'

export default function PricingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Crown className="w-12 h-12 text-primary-600" />
          </div>
        </div>
        
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Loading...
        </h2>
        <p className="text-neutral-600">
          Please wait a moment
        </p>
        
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}