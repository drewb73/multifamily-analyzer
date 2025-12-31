// src/components/settings/SecurityCard.tsx
'use client'

import { useState } from 'react'
import { Shield, Key, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'

export function SecurityCard() {
  const { signOut } = useAuth()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  
  const handleChangePassword = () => {
    // Redirect to Clerk's hosted password change page
    window.location.href = '/user-profile'
  }
  
  const handleForgotPassword = () => {
    // Redirect to Clerk's password reset flow
    window.location.href = '/sign-in?redirect_url=/settings#/forgot-password'
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
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            Change Password
          </button>
        </div>
        
        {/* Divider */}
        <div className="border-t border-neutral-200 my-4" />
        
        {/* Account Recovery */}
        <div>
          <div className="text-sm font-medium text-neutral-700 mb-2">Account Recovery</div>
          <p className="text-xs text-neutral-500 mb-3">
            Forgot your password or need help accessing your account?
          </p>
          <button
            onClick={handleForgotPassword}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Reset Password
          </button>
        </div>
        
        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Security managed by Clerk</p>
              <p>
                Your password and authentication are securely managed by Clerk, our trusted authentication provider. 
                Changes will redirect you to their secure portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}