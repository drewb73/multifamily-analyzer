// src/components/settings/SecurityCard.tsx
'use client'

import { useState } from 'react'
import { Shield, Key, Mail, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { useUser, useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export function SecurityCard() {
  const router = useRouter()
  const { user } = useUser()
  const { signIn } = useSignIn()
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  
  const handleChangePassword = () => {
    // Redirect to custom change password page
    router.push('/dashboard/settings/change-password')
  }
  
  const handleResetPassword = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setResetError('No email address found')
      return
    }
    
    setIsResettingPassword(true)
    setResetError(null)
    setResetEmailSent(false)
    
    try {
      // Create a sign-in attempt with the user's email for password reset
      if (signIn) {
        // First, create the sign-in with the email
        const si = await signIn.create({
          identifier: user.primaryEmailAddress.emailAddress,
        })
        
        // Then prepare the reset password flow with emailAddressId
        await si.prepareFirstFactor({
          strategy: 'reset_password_email_code',
          emailAddressId: user.primaryEmailAddress.id,
        })
        
        setResetEmailSent(true)
        
        // Reset the success message after 5 seconds
        setTimeout(() => {
          setResetEmailSent(false)
        }, 5000)
      } else {
        throw new Error('Sign-in session not available')
      }
    } catch (error: any) {
      console.error('Error sending reset email:', error)
      
      // Handle common errors
      if (error.errors?.[0]?.code === 'form_identifier_not_found') {
        setResetError('Email address not found. Please check your email.')
      } else if (error.errors?.[0]?.message) {
        setResetError(error.errors[0].message)
      } else {
        setResetError('Failed to send reset email. Please try again.')
      }
    } finally {
      setIsResettingPassword(false)
    }
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
            Update your password securely
          </p>
        </div>
        
        {/* Divider */}
        <div className="border-t border-neutral-200 my-4" />
        
        {/* Account Recovery */}
        <div>
          <div className="text-sm font-medium text-neutral-700 mb-2">Send Password Reset Email</div>
          <p className="text-xs text-neutral-500 mb-3">
            We'll send a password reset link to {user?.primaryEmailAddress?.emailAddress}
          </p>
          
          {/* Success Message */}
          {resetEmailSent && (
            <div className="mb-3 p-3 bg-success-50 border border-success-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-success-700">
                <p className="font-medium">Reset email sent!</p>
                <p className="mt-1">Check your inbox for a link to reset your password.</p>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {resetError && (
            <div className="mb-3 p-3 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-xs text-error-700">{resetError}</p>
            </div>
          )}
          
          <button
            onClick={handleResetPassword}
            disabled={isResettingPassword || resetEmailSent}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-4 h-4" />
            {isResettingPassword ? 'Sending...' : resetEmailSent ? 'Email Sent!' : 'Send Reset Email'}
          </button>
        </div>
        
        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Secure Authentication</p>
              <p>
                Your security settings are managed with industry-standard encryption. 
                All password changes require verification of your current password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}