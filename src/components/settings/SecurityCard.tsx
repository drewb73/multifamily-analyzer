// src/components/settings/SecurityCard.tsx
'use client'

import { useState } from 'react'
import { Shield, Key, Mail, AlertCircle, CheckCircle, ArrowRight, Loader2, Eye, EyeOff, Lock as LockIcon } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export function SecurityCard() {
  const router = useRouter()
  const { user } = useUser()
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleChangePassword = () => {
    // Redirect to custom change password page
    router.push('/dashboard/settings/change-password')
  }
  
  const handleSendResetCode = async () => {
    if (!user?.primaryEmailAddress) {
      setError('No email address found')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Check if email is already verified
      const emailAddress = user.primaryEmailAddress
      
      // Always send a fresh verification code
      await emailAddress.prepareVerification({
        strategy: 'email_code'
      })
      
      setCodeSent(true)
    } catch (error: any) {
      console.error('Error sending reset code:', error)
      setError(error.errors?.[0]?.message || 'Failed to send verification code.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.primaryEmailAddress) return
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Verify the email code first
      const verification = await user.primaryEmailAddress.attemptVerification({
        code: resetCode
      })
      
      // Only proceed if verification was successful
      if (verification.verification.status === 'verified') {
        // Now update the password
        await user.updatePassword({
          newPassword: newPassword,
          signOutOfOtherSessions: true,
        })
        
        setResetSuccess(true)
        
        // Reset form and close after 3 seconds
        setTimeout(() => {
          setShowResetForm(false)
          setCodeSent(false)
          setResetCode('')
          setNewPassword('')
          setConfirmPassword('')
          setResetSuccess(false)
          setError(null)
        }, 3000)
      } else {
        setError('Email verification failed. Please try again.')
      }
    } catch (error: any) {
      console.error('Error resetting password:', error)
      
      if (error.errors?.[0]?.code === 'form_code_incorrect') {
        setError('Incorrect verification code. Please try again.')
      } else if (error.errors?.[0]?.code === 'verification_already_verified') {
        // If already verified, just update the password
        try {
          await user.updatePassword({
            newPassword: newPassword,
            signOutOfOtherSessions: true,
          })
          
          setResetSuccess(true)
          
          setTimeout(() => {
            setShowResetForm(false)
            setCodeSent(false)
            setResetCode('')
            setNewPassword('')
            setConfirmPassword('')
            setResetSuccess(false)
            setError(null)
          }, 3000)
        } catch (pwdError: any) {
          setError(pwdError.errors?.[0]?.message || 'Failed to update password.')
        }
      } else if (error.errors?.[0]?.code === 'form_password_pwned') {
        setError('This password has been found in a data breach. Please choose a different password.')
      } else if (error.errors?.[0]?.message) {
        setError(error.errors[0].message)
      } else {
        setError('Failed to reset password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCancel = () => {
    setShowResetForm(false)
    setCodeSent(false)
    setResetCode('')
    setNewPassword('')
    setConfirmPassword('')
    setResetSuccess(false)
    setError(null)
  }
  
  // Reset success screen
  if (showResetForm && resetSuccess) {
    return (
      <div className="elevated-card p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Password Reset Successfully!
          </h3>
          <p className="text-neutral-600">
            Your password has been updated.
          </p>
        </div>
      </div>
    )
  }
  
  // Code verification and password entry screen
  if (showResetForm && codeSent) {
    return (
      <div className="elevated-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-secondary-600 mr-3" />
            <h2 className="text-xl font-semibold text-neutral-800">
              Reset Password
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            Cancel
          </button>
        </div>
        
        <p className="text-sm text-neutral-600 mb-4">
          Enter the verification code sent to <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
        </p>
        
        <form onSubmit={handleVerifyAndReset} className="space-y-4">
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-error-700">{error}</p>
            </div>
          )}
          
          {/* Verification Code */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
              maxLength={6}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-xl tracking-widest font-mono"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Enter the 6-digit code from your email
            </p>
          </div>
          
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Must be at least 8 characters long
            </p>
          </div>
          
          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || resetCode.length !== 6}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    )
  }
  
  // Initial confirmation screen - auto-shows user's email
  if (showResetForm) {
    return (
      <div className="elevated-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-secondary-600 mr-3" />
            <h2 className="text-xl font-semibold text-neutral-800">
              Reset Password
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            Cancel
          </button>
        </div>
        
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-error-700">{error}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-neutral-600 mb-4">
              We'll send a verification code to:
            </p>
            <div className="p-3 bg-primary-50 rounded-lg border border-primary-200 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-600" />
                <p className="text-sm font-medium text-primary-900">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              This is your account's primary email address
            </p>
          </div>
          
          <button
            onClick={handleSendResetCode}
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Code...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Verification Code
              </>
            )}
          </button>
        </div>
      </div>
    )
  }
  
  // Default security card
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
        
        {/* Reset Password */}
        <div>
          <div className="text-sm font-medium text-neutral-700 mb-2">Reset Password via Email</div>
          <p className="text-xs text-neutral-500 mb-3">
            Reset your password using a verification code
          </p>
          
          <button
            onClick={() => setShowResetForm(true)}
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
              <p className="font-medium mb-1">Secure Authentication</p>
              <p>
                Your security settings are managed with industry-standard encryption. 
                All password changes require verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}