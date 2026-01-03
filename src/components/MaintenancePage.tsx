import { Settings, Wrench } from 'lucide-react'

interface MaintenancePageProps {
  message?: string
}

export function MaintenancePage({ message }: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-12 text-center">
          {/* Icon */}
          <div className="w-24 h-24 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <Wrench className="w-12 h-12 text-warning-600" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            We'll Be Right Back
          </h1>

          {/* Message */}
          <p className="text-lg text-neutral-600 mb-8">
            {message || "We're currently performing scheduled maintenance to improve your experience. Please check back shortly."}
          </p>

          {/* Status */}
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Settings className="w-6 h-6 text-warning-600 animate-spin" style={{ animationDuration: '3s' }} />
              <h2 className="text-xl font-semibold text-warning-900">Under Maintenance</h2>
            </div>
            <p className="text-sm text-warning-800">
              Our team is working hard to bring you an even better experience. We appreciate your patience!
            </p>
          </div>

          {/* Contact */}
          <div className="text-sm text-neutral-500">
            <p className="mb-2">Need urgent assistance?</p>
            <a 
              href="mailto:numexre.spt@gmail.com" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              numexre.spt@gmail.com
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-neutral-500">
          PropertyAnalyzer - Professional Multifamily Analysis
        </div>
      </div>
    </div>
  )
}