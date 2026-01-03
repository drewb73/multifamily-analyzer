import { AlertTriangle, Settings } from 'lucide-react'

interface MaintenanceLockProps {
  feature: string
  message?: string
}

export function MaintenanceLock({ 
  feature, 
  message = "This feature is temporarily unavailable while we perform maintenance." 
}: MaintenanceLockProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-12 text-center">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Settings className="w-10 h-10 text-warning-600 animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">
          {feature} Temporarily Unavailable
        </h2>

        {/* Message */}
        <p className="text-neutral-600 mb-6">
          {message}
        </p>

        {/* Info Box */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning-800">
              <p className="font-medium mb-1">Under Maintenance</p>
              <p>
                We're working on improvements to this feature. 
                Please check back soon or contact support if you need immediate assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-6 text-sm text-neutral-500">
          Need help? Email us at{' '}
          <a 
            href="mailto:numexre.spt@gmail.com" 
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            numexre.spt@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}