'use client'

import { useClerk } from '@clerk/nextjs'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AccountDeletedPage() {
  const { signOut } = useClerk()
  const router = useRouter()

  const handleBackToHome = async () => {
    // Sign out from Clerk
    await signOut()
    // Navigate to home
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-error-600" />
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-4">
          Account Marked for Deletion
        </h1>

        <p className="text-neutral-600 mb-6">
          Your account has been marked for deletion and you no longer have access to the application.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            📅 What Happens Next
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Your data will be kept for <strong>60 days</strong></li>
            <li>• You can contact support to restore your account</li>
            <li>• After 60 days, everything will be permanently deleted</li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-neutral-600">
            Changed your mind? Contact support:
          </p>
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-4">
            <p className="text-sm text-neutral-500 mb-1">Email Support</p>
            <a
              href="mailto:numexre.spt@gmail.com"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              numexre.spt@gmail.com
            </a>
          </div>
          <div className="pt-4">
            <button
              onClick={handleBackToHome}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}