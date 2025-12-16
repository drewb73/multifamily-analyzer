// src/components/dashboard/GroupDropdown.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Folder, Check } from 'lucide-react'
import * as Icons from 'lucide-react'
import { fetchGroups, Group } from '@/lib/api/groups'
import { updateAnalysis } from '@/lib/api/analyses'

interface GroupDropdownProps {
  analysisId: string
  currentGroupId: string | null
  currentGroupName?: string
  onGroupChanged: () => void
}

export function GroupDropdown({
  analysisId,
  currentGroupId,
  currentGroupName,
  onGroupChanged,
}: GroupDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadGroups()
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadGroups = async () => {
    setIsLoading(true)
    try {
      const response = await fetchGroups()
      setGroups(response.groups)
    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGroupSelect = async (groupId: string | null) => {
    if (groupId === currentGroupId) {
      setIsOpen(false)
      return
    }

    setIsUpdating(true)
    try {
      await updateAnalysis(analysisId, { groupId })
      onGroupChanged()
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating group:', error)
      alert('Failed to update group. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return Folder
    const IconComponent = (Icons as any)[iconName]
    return IconComponent || Folder
  }

  const displayText = currentGroupName || 'No Group'
  const isInNoGroup = !currentGroupId

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm
          transition-colors
          ${isUpdating 
            ? 'bg-neutral-100 cursor-not-allowed' 
            : 'bg-white hover:bg-neutral-50 border-neutral-300'
          }
        `}
      >
        <Folder className="w-4 h-4 text-neutral-500" />
        <span className="text-neutral-700">
          {isUpdating ? 'Updating...' : displayText}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-neutral-500">Loading groups...</div>
          ) : (
            <>
              {/* No Group Option */}
              <button
                onClick={() => handleGroupSelect(null)}
                className={`
                  w-full px-3 py-2 text-left text-sm flex items-center gap-2
                  hover:bg-neutral-50 transition-colors
                  ${isInNoGroup ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'}
                `}
              >
                <Folder className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">No Group</span>
                {isInNoGroup && <Check className="w-4 h-4 text-primary-600" />}
              </button>

              {/* Divider */}
              {groups.length > 0 && (
                <div className="my-1 border-t border-neutral-200" />
              )}

              {/* Group Options */}
              {groups.map((group) => {
                const IconComponent = getIconComponent(group.icon)
                const isSelected = currentGroupId === group.id

                return (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelect(group.id)}
                    className={`
                      w-full px-3 py-2 text-left text-sm flex items-center gap-2
                      hover:bg-neutral-50 transition-colors
                      ${isSelected ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'}
                    `}
                  >
                    <IconComponent
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: group.color || '#3B82F6' }}
                    />
                    <span className="flex-1 truncate">{group.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />}
                  </button>
                )
              })}

              {/* Empty State */}
              {groups.length === 0 && (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-neutral-500 mb-2">No groups yet</p>
                  <p className="text-xs text-neutral-400">Create a group to organize your analyses</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}