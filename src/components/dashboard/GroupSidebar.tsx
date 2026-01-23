'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { fetchGroups, deleteGroup, Group } from '@/lib/api/groups'
import { Folder, Plus, Loader2, MoreVertical, Edit2, Trash2, X } from 'lucide-react'
import * as Icons from 'lucide-react'

interface GroupSidebarProps {
  selectedGroupId: string | null
  onGroupSelect: (groupId: string | null) => void
  totalAnalysesCount: number
  ungroupedCount: number
  onCreateGroup: () => void
  onEditGroup: (group: Group) => void
  searchQuery?: string
}

export interface GroupSidebarRef {
  refresh: () => void
}

export const GroupSidebar = forwardRef<GroupSidebarRef, GroupSidebarProps>(
  function GroupSidebar(
    {
      selectedGroupId,
      onGroupSelect,
      totalAnalysesCount,
      ungroupedCount,
      onCreateGroup,
      onEditGroup,
      searchQuery,
    },
    ref
  ) {
    const [groups, setGroups] = useState<Group[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [menuOpenForGroup, setMenuOpenForGroup] = useState<string | null>(null)
    
    // Custom delete confirmation state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
      loadGroups()
    }, [])

    const loadGroups = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetchGroups()
        setGroups(response.groups)
      } catch (err: any) {
        console.error('Error loading groups:', err)
        setError(err.message || 'Failed to load groups')
      } finally {
        setIsLoading(false)
      }
    }

    // ✅ FIX: Expose 'refresh' method to match MobileGroupSelector
    useImperativeHandle(ref, () => ({
      refresh: loadGroups,
    }))

    const handleDeleteClick = (groupId: string, groupName: string) => {
      setGroupToDelete({ id: groupId, name: groupName })
      setDeleteConfirmOpen(true)
    }

    const handleDeleteConfirm = async () => {
      if (!groupToDelete) return

      setIsDeleting(true)
      try {
        await deleteGroup(groupToDelete.id)
        
        // If the deleted group was selected, switch to "All Analyses"
        if (selectedGroupId === groupToDelete.id) {
          onGroupSelect(null)
        }
        
        // Close modal
        setDeleteConfirmOpen(false)
        setGroupToDelete(null)
        
        // Reload page to sync counts everywhere
        window.location.reload()
      } catch (err: any) {
        console.error('Error deleting group:', err)
        alert('Failed to delete group. Please try again.')
      } finally {
        setIsDeleting(false)
      }
    }

    const handleDeleteCancel = () => {
      setDeleteConfirmOpen(false)
      setGroupToDelete(null)
    }

    // Get icon component from lucide-react
    const getIconComponent = (iconName: string | null) => {
      if (!iconName) return Folder
      const IconComponent = (Icons as any)[iconName]
      return IconComponent || Folder
    }

    if (isLoading) {
      return (
        <div className="w-64 bg-white border-r border-neutral-200 p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="w-64 bg-white border-r border-neutral-200 p-4">
          <div className="text-sm text-error-600 py-4">
            {error}
          </div>
          <button
            onClick={loadGroups}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Try Again
          </button>
        </div>
      )
    }

    return (
      <>
        <div className="w-64 bg-white border-r border-neutral-200 flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Groups</h2>
          </div>

          {/* Create Group Button */}
          <div className="p-2 border-b border-neutral-200">
            <button
              onClick={onCreateGroup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 
                       bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                       transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Group
            </button>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* All Analyses */}
            <button
              onClick={() => onGroupSelect(null)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm
                transition-colors mb-1
                ${selectedGroupId === null
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                <span>All Analyses</span>
              </div>
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${selectedGroupId === null
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600'
                }
              `}>
                {totalAnalysesCount}
              </span>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-neutral-200" />

            {/* No Group - Ungrouped analyses */}
            <button
              onClick={() => onGroupSelect('no-group')}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm
                transition-colors mb-1
                ${selectedGroupId === 'no-group'
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-neutral-400" />
                <span>No Group</span>
              </div>
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${selectedGroupId === 'no-group'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600'
                }
              `}>
                {ungroupedCount}
              </span>
            </button>

            {/* Divider */}
            {groups.length > 0 && (
              <div className="my-2 border-t border-neutral-200" />
            )}

            {/* User Groups */}
            {groups.map((group) => {
              const IconComponent = getIconComponent(group.icon)
              const isSelected = selectedGroupId === group.id
              const isMenuOpen = menuOpenForGroup === group.id

              return (
                <div key={group.id} className="relative">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onGroupSelect(group.id)}
                      className={`
                        flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm
                        transition-colors
                        ${isSelected
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-neutral-700 hover:bg-neutral-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <IconComponent
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: group.color || '#3B82F6' }}
                        />
                        <span className="truncate">{group.name}</span>
                      </div>
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2
                        ${isSelected
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-neutral-100 text-neutral-600'
                        }
                      `}>
                        {group.analysisCount}
                      </span>
                    </button>

                    {/* More Menu Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenForGroup(isMenuOpen ? null : group.id)
                      }}
                      className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-neutral-500" />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenForGroup(null)}
                      />
                      
                      {/* Menu */}
                      <div className="absolute right-2 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                        <button
                          onClick={() => {
                            setMenuOpenForGroup(null)
                            onEditGroup(group)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setMenuOpenForGroup(null)
                            handleDeleteClick(group.id, group.name)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-error-600 hover:bg-error-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            {/* Empty State */}
            {groups.length === 0 && (
              <div className="text-center py-8 px-4">
                <Folder className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500 mb-2">No groups yet</p>
                <p className="text-xs text-neutral-400">
                  Create groups to organize your analyses
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Custom Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                <h2 className="text-xl font-semibold text-neutral-900">
                  Delete Group
                </h2>
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-neutral-700 mb-2">
                  Are you sure you want to delete <span className="font-semibold">"{groupToDelete?.name}"</span>?
                </p>
                <p className="text-sm text-neutral-600">
                  Analyses in this group will not be deleted, they'll just become ungrouped.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Group'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
)