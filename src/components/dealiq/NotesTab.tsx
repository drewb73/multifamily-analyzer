// FILE LOCATION: /src/components/dealiq/NotesTab.tsx
// PURPOSE: Notes tab with table view showing actual dates (not relative time)

'use client'

import { useState } from 'react'
import { 
  FileText, 
  Edit2, 
  Trash2, 
  Plus,
  X
} from 'lucide-react'

interface Note {
  id: string
  content: string
  userId: string
  user: {
    email: string
    firstName: string | null
    lastName: string | null
  }
  createdAt: Date
  updatedAt: Date
}

interface NotesTabProps {
  dealId: string
  notes: Note[]
  onUpdate: () => void
  currentUserEmail: string
}

export function NotesTab({ dealId, notes, onUpdate, currentUserEmail }: NotesTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleAddNote = () => {
    setEditingNote(null)
    setIsModalOpen(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setIsModalOpen(true)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    setIsDeleting(noteId)
    try {
      const response = await fetch(`/api/dealiq/${dealId}/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onUpdate()
      } else {
        alert('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    } finally {
      setIsDeleting(null)
    }
  }

  // Format date as MM/DD/YYYY
  const formatDate = (date: Date) => {
    const d = new Date(date)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const year = d.getFullYear()
    return `${month}/${day}/${year}`
  }

  // Check if current user owns the note
  const isOwnNote = (note: Note) => note.user.email === currentUserEmail

  // Sort notes by newest first
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">Deal Notes</h3>
          <p className="text-sm text-neutral-600">
            Keep track of conversations, updates, and important information
          </p>
        </div>
        <button
          onClick={handleAddNote}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* Notes Table */}
      {sortedNotes.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-neutral-900 mb-2">No notes yet</h4>
          <p className="text-neutral-600 mb-4">
            Add your first note to start tracking deal activity
          </p>
          <button
            onClick={handleAddNote}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Note
          </button>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-32">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {sortedNotes.map((note) => (
                  <tr key={note.id} className="hover:bg-neutral-50">
                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      <div className="text-sm font-medium text-neutral-900">
                        {formatDate(note.createdAt)}
                      </div>
                      {note.updatedAt.toString() !== note.createdAt.toString() && (
                        <div className="text-xs text-neutral-500 mt-0.5">
                          (edited)
                        </div>
                      )}
                    </td>

                    {/* Note Content */}
                    <td className="px-6 py-4 align-top">
                      <div className="text-sm text-neutral-700 whitespace-pre-wrap break-words">
                        {note.content}
                      </div>
                    </td>

                    {/* Actions - Only show for own notes */}
                    <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                      {isOwnNote(note) && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="p-1.5 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            title="Edit note"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={isDeleting === note.id}
                            className="p-1.5 text-neutral-600 hover:text-error-600 hover:bg-error-50 rounded transition-colors disabled:opacity-50"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {isModalOpen && (
        <NoteModal
          dealId={dealId}
          note={editingNote}
          onClose={() => {
            setIsModalOpen(false)
            setEditingNote(null)
          }}
          onSuccess={() => {
            setIsModalOpen(false)
            setEditingNote(null)
            onUpdate()
          }}
        />
      )}
    </div>
  )
}

// Note Modal Component
interface NoteModalProps {
  dealId: string
  note: Note | null
  onClose: () => void
  onSuccess: () => void
}

function NoteModal({ dealId, note, onClose, onSuccess }: NoteModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [content, setContent] = useState(note?.content || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      alert('Note content is required')
      return
    }

    setIsSaving(true)
    try {
      const url = note
        ? `/api/dealiq/${dealId}/notes/${note.id}`
        : `/api/dealiq/${dealId}/notes`
      
      const method = note ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-neutral-900">
            {note ? 'Edit Note' : 'Add Note'}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Note <span className="text-error-600">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[150px] resize-y"
              placeholder="Add your note here... You can include updates, observations, or important information about the deal."
              required
              autoFocus
            />
            <p className="text-xs text-neutral-500 mt-1">
              {content.length} characters
            </p>
          </div>

          {note && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Editing this note will not change the original date. The date shown will remain {new Date(note.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (note ? 'Update' : 'Add')} Note
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}