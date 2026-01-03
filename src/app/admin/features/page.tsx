'use client'

import { useEffect, useState } from 'react'
import { 
  Shield, 
  Globe, 
  CreditCard, 
  Users, 
  FileText, 
  Save,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface SystemSettings {
  id: string
  // Application-wide toggles
  maintenanceMode: boolean
  maintenanceMessage: string | null
  signInEnabled: boolean
  signUpEnabled: boolean
  stripeEnabled: boolean
  
  // Feature toggles
  analysisEnabled: boolean
  pdfExportEnabled: boolean
  savedDraftsEnabled: boolean
  accountDeletionEnabled: boolean
  
  updatedAt: string
  updatedBy: string | null
}

export default function AdminFeaturesPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [adminPin, setAdminPin] = useState('')
  const [showPinConfirm, setShowPinConfirm] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Partial<SystemSettings> | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
      } else {
        setError('Failed to load settings')
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setError('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (field: keyof SystemSettings, value: boolean) => {
    if (!settings) return
    
    // Critical toggles require PIN confirmation
    const criticalToggles = ['maintenanceMode', 'signInEnabled', 'signUpEnabled']
    
    if (criticalToggles.includes(field) && value !== settings[field]) {
      // Show PIN confirmation
      setPendingChanges({ [field]: value })
      setShowPinConfirm(true)
    } else {
      // Apply change immediately for non-critical toggles
      setSettings({ ...settings, [field]: value })
    }
  }

  const handleMaintenanceMessageChange = (message: string) => {
    if (!settings) return
    setSettings({ ...settings, maintenanceMessage: message })
  }

  const handleSave = async () => {
    if (!settings) return
    
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      setSettings(data.settings)
      setSuccess('Settings saved successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePinConfirm = async () => {
    if (!adminPin || !pendingChanges || !settings) {
      setError('Admin PIN is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Verify PIN and apply changes
      const response = await fetch('/api/admin/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminPin,
          changes: pendingChanges 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid PIN')
      }

      // Apply pending changes
      setSettings({ ...settings, ...pendingChanges })
      setShowPinConfirm(false)
      setPendingChanges(null)
      setAdminPin('')
      setSuccess('Critical setting updated')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message)
      setAdminPin('')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-error-600 mx-auto mb-4" />
        <p className="text-error-700">Failed to load system settings</p>
        <button onClick={loadSettings} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900">Feature Management</h1>
        <p className="text-neutral-600 mt-1">
          Control application-wide features and maintenance mode
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg text-sm text-error-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg text-sm text-success-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Application-Wide Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Application-Wide Controls</h2>
          </div>

          <div className="space-y-6">
            {/* Maintenance Mode */}
            <div className="border-2 border-error-200 rounded-lg p-4 bg-error-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-error-600" />
                    <h3 className="font-semibold text-neutral-900">Maintenance Mode</h3>
                    {settings.maintenanceMode && (
                      <span className="px-2 py-0.5 bg-error-600 text-white text-xs rounded-full font-medium">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">
                    Blocks entire application for all users except admins. Shows maintenance page.
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.maintenanceMode}
                  onChange={(value) => handleToggle('maintenanceMode', value)}
                  critical
                />
              </div>

              {settings.maintenanceMode && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    value={settings.maintenanceMessage || ''}
                    onChange={(e) => handleMaintenanceMessageChange(e.target.value)}
                    placeholder="We're currently performing maintenance. Please check back soon."
                    className="input-field w-full"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Sign Up */}
            <ToggleRow
              icon={Users}
              title="Sign Up"
              description="Allow new users to create accounts. When disabled, sign-up page shows maintenance message."
              enabled={settings.signUpEnabled}
              onChange={(value) => handleToggle('signUpEnabled', value)}
              critical
            />

            {/* Sign In */}
            <ToggleRow
              icon={Shield}
              title="Sign In"
              description="Allow users to sign in. When disabled, sign-in page shows maintenance message."
              enabled={settings.signInEnabled}
              onChange={(value) => handleToggle('signInEnabled', value)}
              critical
            />

            {/* Stripe Payments */}
            <ToggleRow
              icon={CreditCard}
              title="Stripe Payments"
              description="Allow users to upgrade to premium. When disabled, payment page shows maintenance message."
              enabled={settings.stripeEnabled}
              onChange={(value) => handleToggle('stripeEnabled', value)}
            />
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Feature Toggles</h2>
          </div>

          <div className="space-y-4">
            {/* Analysis Page */}
            <ToggleRow
              icon={FileText}
              title="Analysis Page"
              description="Allow users to create new property analyses. When disabled, shows maintenance lock."
              enabled={settings.analysisEnabled}
              onChange={(value) => handleToggle('analysisEnabled', value)}
            />

            {/* PDF Export */}
            <ToggleRow
              icon={FileText}
              title="PDF Export"
              description="Allow users to export analyses as PDF. When disabled, export button is hidden."
              enabled={settings.pdfExportEnabled}
              onChange={(value) => handleToggle('pdfExportEnabled', value)}
            />

            {/* Saved Drafts */}
            <ToggleRow
              icon={Save}
              title="Saved Analyses"
              description="Allow users to view saved analyses. When disabled, shows maintenance lock."
              enabled={settings.savedDraftsEnabled}
              onChange={(value) => handleToggle('savedDraftsEnabled', value)}
            />

            {/* Account Deletion */}
            <ToggleRow
              icon={Trash2}
              title="Account Deletion"
              description="Allow users to delete their accounts. When disabled, delete button is greyed out."
              enabled={settings.accountDeletionEnabled}
              onChange={(value) => handleToggle('accountDeletionEnabled', value)}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-neutral-600">
            {settings.updatedBy && (
              <p>Last updated by {settings.updatedBy} on {new Date(settings.updatedAt).toLocaleString()}</p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary px-6 py-3 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* PIN Confirmation Modal */}
      {showPinConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-error-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Confirm Critical Change</h3>
                <p className="text-sm text-neutral-600">This change requires admin PIN</p>
              </div>
            </div>

            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-error-700">
                You are about to modify a critical system setting. This may affect all users.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Enter Admin PIN
              </label>
              <input
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="input-field w-full"
                placeholder="Admin PIN"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPinConfirm(false)
                  setPendingChanges(null)
                  setAdminPin('')
                  setError(null)
                }}
                className="flex-1 py-2 px-4 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePinConfirm}
                disabled={isSaving || !adminPin}
                className="flex-1 py-2 px-4 bg-error-600 text-white rounded-lg font-medium hover:bg-error-700 disabled:opacity-50"
              >
                {isSaving ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Toggle Row Component
function ToggleRow({ 
  icon: Icon, 
  title, 
  description, 
  enabled, 
  onChange,
  critical = false
}: { 
  icon: any
  title: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
  critical?: boolean
}) {
  return (
    <div className={`flex items-start justify-between p-4 rounded-lg border-2 ${
      critical ? 'border-error-200 bg-error-50' : 'border-neutral-200'
    }`}>
      <div className="flex items-start gap-3 flex-1">
        <Icon className={`w-5 h-5 mt-0.5 ${critical ? 'text-error-600' : 'text-neutral-600'}`} />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-neutral-900">{title}</h3>
            {critical && enabled && (
              <span className="px-2 py-0.5 bg-error-600 text-white text-xs rounded-full font-medium">
                CRITICAL
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600">{description}</p>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} critical={critical} />
    </div>
  )
}

// Toggle Switch Component
function ToggleSwitch({ 
  enabled, 
  onChange,
  critical = false
}: { 
  enabled: boolean
  onChange: (value: boolean) => void
  critical?: boolean
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        enabled 
          ? critical ? 'bg-error-600 focus:ring-error-500' : 'bg-primary-600 focus:ring-primary-500'
          : 'bg-neutral-200 focus:ring-neutral-500'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}