import { Settings, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface AuthMaintenancePageProps {
  feature: 'Sign Up' | 'Sign In'
}

export function AuthMaintenancePage({ feature }: AuthMaintenancePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-warning-600 animate-spin" style={{ animationDuration: '3s' }} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            {feature} Temporarily Unavailable
          </h1>

          {/* Message */}
          <p className="text-neutral-600 mb-6">
            We're currently performing maintenance on our authentication system.
          </p>

          {/* Info Box */}
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 text-left mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-warning-800">
                <p className="font-medium mb-1">Under Maintenance</p>
                <p>
                  {feature === 'Sign Up' 
                    ? 'New account registrations are temporarily disabled. If you already have an account, you can still sign in.'
                    : 'Sign in is temporarily disabled. Please check back soon.'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {feature === 'Sign Up' && (
              <Link 
                href="/sign-in"
                className="block w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Sign In Instead
              </Link>
            )}
            
            <Link 
              href="/"
              className="block w-full py-3 px-4 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {/* Contact Support */}
          <div className="mt-6 text-sm text-neutral-500">
            Need help? Email{' '}
            <a 
              href="mailto:numexre.spt@gmail.com" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              numexre.spt@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}