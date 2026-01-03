import { AlertTriangle } from 'lucide-react'

export function AdminMaintenanceBanner() {
  return (
    <div className="bg-error-600 text-white py-3 px-4 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">
          <span className="font-bold">MAINTENANCE MODE ACTIVE:</span> You're seeing this site because you're an admin. Regular users see the maintenance page.
        </p>
      </div>
    </div>
  )
}