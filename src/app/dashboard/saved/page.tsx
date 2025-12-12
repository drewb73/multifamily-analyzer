import { Lock } from 'lucide-react'

export default function SavedAnalysesPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Saved Analyses
          </h1>
          <Lock className="h-6 w-6 text-warning-500" />
        </div>
        <p className="text-lg text-neutral-600 mt-2">
          Save and access your property analyses (Premium Feature)
        </p>
      </div>
      
      <div className="elevated-card p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning-100 mb-6">
          <Lock className="h-10 w-10 text-warning-600" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-800 mb-3">
          Premium Feature
        </h2>
        <p className="text-neutral-600 mb-6 max-w-md mx-auto">
          Save unlimited property analyses and access them from any device. 
          Upgrade to unlock this feature and more.
        </p>
        <div className="space-y-4">
          <button className="btn-primary px-8 py-3">
            Upgrade to Premium - $4.99/month
          </button>
          <p className="text-sm text-neutral-500">
            Start your 72-hour free trial
          </p>
        </div>
      </div>
    </div>
  )
}