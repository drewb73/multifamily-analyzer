// FILE LOCATION: /src/components/dealiq/ContactsTab.tsx
// PURPOSE: Contacts tab for managing deal contacts (sellers, agents, lenders, etc.)

'use client'

import { useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Edit2, 
  Trash2, 
  Plus,
  X,
  Check,
  Star
} from 'lucide-react'

interface Contact {
  id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  company: string | null
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

interface ContactsTabProps {
  dealId: string
  contacts: Contact[]
  onUpdate: () => void
}

const CONTACT_ROLES = [
  'Seller',
  'Buyer Agent',
  'Listing Agent',
  'Lender / Mortgage Broker',
  'Attorney',
  'Title Company',
  'Inspector',
  'Contractor',
  'Property Manager',
  'Other'
]

export function ContactsTab({ dealId, contacts, onUpdate }: ContactsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleAddContact = () => {
    setEditingContact(null)
    setIsModalOpen(true)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setIsModalOpen(true)
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    setIsDeleting(contactId)
    try {
      const response = await fetch(`/api/dealiq/${dealId}/contacts/${contactId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onUpdate()
      } else {
        alert('Failed to delete contact')
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Failed to delete contact')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleTogglePrimary = async (contactId: string, isPrimary: boolean) => {
    try {
      const response = await fetch(`/api/dealiq/${dealId}/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: !isPrimary })
      })

      if (response.ok) {
        onUpdate()
      } else {
        alert('Failed to update contact')
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      alert('Failed to update contact')
    }
  }

  // Group contacts by role
  const groupedContacts = contacts.reduce((acc, contact) => {
    const role = contact.role || 'Other'
    if (!acc[role]) acc[role] = []
    acc[role].push(contact)
    return acc
  }, {} as Record<string, Contact[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">Deal Contacts</h3>
          <p className="text-sm text-neutral-600">
            Manage contacts associated with this deal
          </p>
        </div>
        <button
          onClick={handleAddContact}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
          <User className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-neutral-900 mb-2">No contacts yet</h4>
          <p className="text-neutral-600 mb-4">
            Add contacts to keep track of everyone involved in this deal
          </p>
          <button
            onClick={handleAddContact}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map(contact => (
            <div
              key={contact.id}
              className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
            >
              {/* Contact Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-neutral-900 truncate">
                        {contact.name}
                      </h4>
                      {contact.isPrimary && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    {contact.role && (
                      <p className="text-sm text-neutral-600">{contact.role}</p>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePrimary(contact.id, contact.isPrimary)}
                    className={`p-1.5 rounded transition-colors ${
                      contact.isPrimary
                        ? 'text-yellow-600 hover:bg-yellow-50'
                        : 'text-neutral-400 hover:bg-neutral-100 hover:text-yellow-600'
                    }`}
                    title={contact.isPrimary ? 'Remove primary' : 'Set as primary'}
                  >
                    <Star className={`w-4 h-4 ${contact.isPrimary ? 'fill-yellow-600' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="p-1.5 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    disabled={isDeleting === contact.id}
                    className="p-1.5 text-neutral-600 hover:text-error-600 hover:bg-error-50 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-2">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-primary-600 hover:underline truncate"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-neutral-700 hover:text-primary-600 truncate"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="text-neutral-700 truncate">{contact.company}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {isModalOpen && (
        <ContactModal
          dealId={dealId}
          contact={editingContact}
          onClose={() => {
            setIsModalOpen(false)
            setEditingContact(null)
          }}
          onSuccess={() => {
            setIsModalOpen(false)
            setEditingContact(null)
            onUpdate()
          }}
        />
      )}
    </div>
  )
}

// Contact Modal Component
interface ContactModalProps {
  dealId: string
  contact: Contact | null
  onClose: () => void
  onSuccess: () => void
}

function ContactModal({ dealId, contact, onClose, onSuccess }: ContactModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    role: contact?.role || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
    isPrimary: contact?.isPrimary || false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }

    setIsSaving(true)
    try {
      const url = contact
        ? `/api/dealiq/${dealId}/contacts/${contact.id}`
        : `/api/dealiq/${dealId}/contacts`
      
      const method = contact ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save contact')
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      alert('Failed to save contact')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-neutral-900">
            {contact ? 'Edit Contact' : 'Add Contact'}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Name <span className="text-error-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="John Smith"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select role...</option>
              {CONTACT_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="ABC Realty"
            />
          </div>

          {/* Primary Contact */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isPrimary" className="text-sm font-medium text-neutral-700">
              Set as primary contact
            </label>
          </div>

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
              {isSaving ? 'Saving...' : (contact ? 'Update' : 'Add')} Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}