// src/components/settings/ProfileCard.tsx
'use client'

import { useState } from 'react'
import { User, AlertCircle, Loader2 } from 'lucide-react'

interface ProfileData {
  displayName: string
  email: string
  company: string
}

interface ProfileCardProps {
  initialData: ProfileData
  onSave: (data: ProfileData) => Promise<void>
}

export function ProfileCard({ initialData, onSave }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileData>(initialData)
  const [error, setError] = useState<string | null>(null)
  
  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    
    try {
      await onSave(formData)
      setIsEditing(false)
    } catch (error: any) {
      console.error('Failed to save profile:', error)
      setError(error.errors?.[0]?.message || 'Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleCancel = () => {
    setFormData(initialData)
    setIsEditing(false)
    setError(null)
  }
  
  return (
    <div className="elevated-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <User className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-neutral-800">
            Profile
          </h2>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-error-700">{error}</p>
          </div>
        )}
        
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Display Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Your name"
            />
          ) : (
            <div className="text-neutral-900">{formData.displayName || 'Not set'}</div>
          )}
        </div>
        
        {/* Email - Read Only */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Email Address
          </label>
          <div className="text-neutral-900">{formData.email}</div>
        </div>
        
        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Company Name <span className="text-neutral-400">(Optional)</span>
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Your company"
            />
          ) : (
            <div className="text-neutral-900">{formData.company || 'Not set'}</div>
          )}
        </div>
        
        {/* Action Buttons - Only show when editing */}
        {isEditing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}