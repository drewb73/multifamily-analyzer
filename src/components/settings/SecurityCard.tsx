// src/components/settings/SecurityCard.tsx
// Routes to /reset-password (which has current password + email verification)
'use client'

import { Shield, Key, AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SecurityCard() {
  const router = useRouter()
  
  const handleChangePassword = () => {
    router.push('/dashboard/settings/reset-password')
  }
  
  return (
    <div className="elevated-card p-6">
      <div className="flex items-center mb-6">
        <Shield className="h-6 w-6 text-secondary-600 mr-3" />
        <h2 className="text-xl font-semibold text-neutral-800">
          Security
        </h2>
      </div>
      
      <div className="space-y-4">
        {/* Password */}
        <div>
          <div className="text-sm font-medium text-neutral-700 mb-2">Password</div>
          <div className="text-neutral-600 mb-3">••••••••••</div>
          <button
            onClick={handleChangePassword}
            className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            Change Password
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-neutral-500 mt-2">
            Requires current password + email verification
          </p>
        </div>
        
        {/* Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Enhanced Security</p>
              <p>
                For your protection, changing your password requires both your current password and email verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}