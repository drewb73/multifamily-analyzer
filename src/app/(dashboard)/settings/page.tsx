import { User, Shield, Bell, CreditCard } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          Account Settings
        </h1>
        <p className="text-lg text-neutral-600 mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="elevated-card p-6">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-neutral-800">
              Account Information
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-neutral-500">Account Type</div>
              <div className="font-medium text-neutral-900">Free Trial</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500">Trial Expires</div>
              <div className="font-medium text-neutral-900">72 hours remaining</div>
            </div>
            <button className="btn-primary w-full py-3">
              Upgrade to Premium
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="elevated-card p-6">
          <div className="flex items-center mb-6">
            <Shield className="h-6 w-6 text-secondary-600 mr-3" />
            <h2 className="text-xl font-semibold text-neutral-800">
              Security
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-neutral-500">Password</div>
              <div className="font-medium text-neutral-900">••••••••••</div>
            </div>
            <button className="btn-secondary w-full py-3">
              Change Password
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="elevated-card p-6">
          <div className="flex items-center mb-6">
            <Bell className="h-6 w-6 text-accent-600 mr-3" />
            <h2 className="text-xl font-semibold text-neutral-800">
              Notifications
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Email notifications</span>
              <div className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only" />
                <div className="block bg-neutral-300 w-12 h-6 rounded-full"></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Analysis reminders</span>
              <div className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only" checked />
                <div className="block bg-primary-600 w-12 h-6 rounded-full"></div>
                <div className="dot absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="elevated-card p-6">
          <div className="flex items-center mb-6">
            <CreditCard className="h-6 w-6 text-success-600 mr-3" />
            <h2 className="text-xl font-semibold text-neutral-800">
              Billing
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-neutral-500">Current Plan</div>
              <div className="font-medium text-neutral-900">Free Trial</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500">Next Billing Date</div>
              <div className="font-medium text-neutral-900">After trial ends</div>
            </div>
            <button className="btn-secondary w-full py-3">
              View Billing History
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}