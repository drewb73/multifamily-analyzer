// COMPLETE FILE - CREATE/EDIT GROUP MODAL WITH DELETE BUTTON
// Location: src/components/dashboard/CreateGroupModal.tsx
// Action: REPLACE ENTIRE FILE
// ✅ Added delete button when editing groups

'use client'

import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import { createGroup, updateGroup, deleteGroup, GROUP_COLORS, GROUP_ICONS } from '@/lib/api/groups'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editGroup?: {
    id: string
    name: string
    description: string | null
    color: string | null
    icon: string | null
  } | null
}

export function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
  editGroup = null,
}: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [selectedIcon, setSelectedIcon] = useState('Folder')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load edit data when modal opens in edit mode
  useEffect(() => {
    if (isOpen && editGroup) {
      setName(editGroup.name)
      setDescription(editGroup.description || '')
      setSelectedColor(editGroup.color || '#3B82F6')
      setSelectedIcon(editGroup.icon || 'Folder')
    } else if (isOpen && !editGroup) {
      // Reset for create mode
      setName('')
      setDescription('')
      setSelectedColor('#3B82F6')
      setSelectedIcon('Folder')
    }
    setError(null)
    setShowDeleteConfirm(false)
  }, [isOpen, editGroup])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Group name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (editGroup) {
        // Update existing group
        await updateGroup(editGroup.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
          icon: selectedIcon,
        })
      } else {
        // Create new group
        await createGroup({
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
          icon: selectedIcon,
        })
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error saving group:', err)
      setError(err.message || 'Failed to save group')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editGroup) return

    setIsDeleting(true)
    setError(null)

    try {
      await deleteGroup(editGroup.id)
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error deleting group:', err)
      setError(err.message || 'Failed to delete group')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent || Icons.Folder
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">
            {editGroup ? 'Edit Group' : 'Create New Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-error-50 text-error-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
              Group Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Downtown Properties"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              maxLength={50}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this group"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {GROUP_COLORS.map((color) => {
                const isSelected = selectedColor === color.value
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`
                      w-full aspect-square rounded-lg transition-all
                      ${isSelected ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110' : 'hover:scale-105'}
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {isSelected && (
                      <svg className="w-6 h-6 mx-auto text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {GROUP_ICONS.map((iconName) => {
                const isSelected = selectedIcon === iconName
                const IconComponent = getIconComponent(iconName)
                
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`
                      aspect-square rounded-lg border-2 transition-all flex items-center justify-center
                      ${isSelected 
                        ? 'border-neutral-900 bg-neutral-50 scale-110' 
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      }
                    `}
                    title={iconName}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: isSelected ? selectedColor : '#6B7280' }}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 mb-2">Preview</p>
            <div className="flex items-center gap-2">
              {(() => {
                const IconComponent = getIconComponent(selectedIcon)
                return <IconComponent className="w-5 h-5" style={{ color: selectedColor }} />
              })()}
              <span className="font-medium text-neutral-900">{name || 'Group Name'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600">
                0
              </span>
            </div>
            {description && (
              <p className="text-sm text-neutral-600 mt-2">{description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isDeleting}
            >
              {isSubmitting 
                ? 'Saving...' 
                : editGroup 
                ? 'Save Changes' 
                : 'Create Group'
              }
            </button>
          </div>

          {/* Delete Button (only in edit mode) */}
          {editGroup && (
            <div className="pt-4 border-t border-neutral-200">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-2 flex items-center justify-center gap-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                  disabled={isSubmitting || isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Group
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600 text-center">
                    Are you sure? Analyses won't be deleted, just ungrouped.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}