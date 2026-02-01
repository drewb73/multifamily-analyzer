// FILE LOCATION: /src/components/dealiq/ContactsTab.tsx
// PURPOSE: Contacts tab with table view, custom "Other" role, single primary contact

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
  Star
} from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

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

  // Modal states for confirmations
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)

  const handleAddContact = () => {
    setEditingContact(null)
    setIsModalOpen(true)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setIsModalOpen(true)
  }

  const handleDeleteContact = (contactId: string) => {
    setContactToDelete(contactId)
    setDeleteModalOpen(true)
  }

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return

    setIsDeleting(contactToDelete)
    try {
      const response = await fetch(`/api/dealiq/${dealId}/contacts/${contactToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onUpdate()
        setDeleteModalOpen(false)
        setContactToDelete(null)
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

      {/* Contacts Table */}
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
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Primary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-neutral-50">
                    {/* Primary Star */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePrimary(contact.id, contact.isPrimary)}
                        className={`transition-colors ${
                          contact.isPrimary
                            ? 'text-yellow-500'
                            : 'text-neutral-300 hover:text-yellow-400'
                        }`}
                        title={contact.isPrimary ? 'Remove primary' : 'Set as primary'}
                      >
                        <Star className={`w-5 h-5 ${contact.isPrimary ? 'fill-yellow-500' : ''}`} />
                      </button>
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="font-medium text-neutral-900">
                          {contact.name}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-700">
                        {contact.role || '-'}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sm text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-sm text-neutral-400">-</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-sm text-neutral-700 hover:text-primary-600 flex items-center gap-1"
                        >
                          <Phone className="w-4 h-4" />
                          {contact.phone}
                        </a>
                      ) : (
                        <span className="text-sm text-neutral-400">-</span>
                      )}
                    </td>

                    {/* Company */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.company ? (
                        <div className="text-sm text-neutral-700 flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-neutral-400" />
                          {contact.company}
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditContact(contact)}
                          className="p-1.5 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Edit contact"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          disabled={isDeleting === contact.id}
                          className="p-1.5 text-neutral-600 hover:text-error-600 hover:bg-error-50 rounded transition-colors disabled:opacity-50"
                          title="Delete contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {isModalOpen && (
        <ContactModal
          dealId={dealId}
          contact={editingContact}
          contacts={contacts}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setContactToDelete(null)
        }}
        onConfirm={confirmDeleteContact}
        title="Delete Contact?"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        confirmText="Delete Contact"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting !== null}
      />
    </div>
  )
}

// Contact Modal Component
interface ContactModalProps {
  dealId: string
  contact: Contact | null
  contacts: Contact[]
  onClose: () => void
  onSuccess: () => void
}

function ContactModal({ dealId, contact, contacts, onClose, onSuccess }: ContactModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    role: contact?.role || '',
    customRole: '', // For "Other" custom role
    email: contact?.email || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
    isPrimary: contact?.isPrimary || false
  })

  // Modal state for primary contact confirmation
  const [primaryModalOpen, setPrimaryModalOpen] = useState(false)
  const [primaryModalData, setPrimaryModalData] = useState<{
    existingName: string
    newName: string
  } | null>(null)

  // ✅ "Other" Role Logic:
  // - isCustomRole: true if role value is not in the standard CONTACT_ROLES list
  // - selectedRole: Shows 'Other' in dropdown if it's a custom role, otherwise shows actual role
  // - When 'Other' selected: role='Other', customRole='' → custom input shows
  // - When user types: role=custom text, customRole=custom text → custom input stays visible
  // - On save: sends the custom text as the role value
  const isCustomRole = formData.role && !CONTACT_ROLES.includes(formData.role)
  const selectedRole = isCustomRole ? 'Other' : formData.role

  const handleRoleChange = (value: string) => {
    if (value === 'Other') {
      // ✅ FIX: When "Other" is selected, set role to 'Other' (not empty) so the custom input shows
      setFormData({ ...formData, role: 'Other', customRole: '' })
    } else {
      // Standard role selected
      setFormData({ ...formData, role: value, customRole: '' })
    }
  }

  const handleCustomRoleChange = (value: string) => {
    // ✅ As user types, update both customRole (for display) and role (for saving)
    setFormData({ ...formData, customRole: value, role: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }

    // ✅ VALIDATION: Only one primary contact allowed
    if (formData.isPrimary && !contact?.isPrimary) {
      const existingPrimary = contacts.find(c => c.isPrimary && c.id !== contact?.id)
      if (existingPrimary) {
        setPrimaryModalData({
          existingName: existingPrimary.name,
          newName: formData.name
        })
        setPrimaryModalOpen(true)
        return
      }
    }

    await saveContact()
  }

  const saveContact = async (overrideIsPrimary?: boolean) => {
    setIsSaving(true)
    
    // ✅ FIX: Use override if provided, otherwise use formData
    const isPrimaryValue = overrideIsPrimary !== undefined ? overrideIsPrimary : formData.isPrimary
    
    console.log('💾 saveContact called')
    console.log('  isPrimaryValue:', isPrimaryValue)
    console.log('  formData.isPrimary:', formData.isPrimary)
    console.log('  overrideIsPrimary:', overrideIsPrimary)
    
    try {
      const url = contact
        ? `/api/dealiq/${dealId}/contacts/${contact.id}`
        : `/api/dealiq/${dealId}/contacts`
      
      const method = contact ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role || null,
          email: formData.email || null,
          phone: formData.phone || null,
          company: formData.company || null,
          isPrimary: isPrimaryValue  // ✅ Use the resolved value
        })
      })

      if (response.ok) {
        console.log('✅ Contact saved successfully')
        onSuccess()
      } else {
        const data = await response.json()
        console.error('❌ Save contact failed:', data)
        alert(data.error || 'Failed to save contact')
      }
    } catch (error) {
      console.error('❌ Error saving contact:', error)
      alert('Failed to save contact')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmSwitchPrimary = async () => {
    // ✅ FIX: Add logging to track the flow
    console.log('🔄 confirmSwitchPrimary called - switching primary contact')
    console.log('  Current formData.isPrimary:', formData.isPrimary)
    console.log('  New contact name:', formData.name)
    
    // Close the confirmation modal
    setPrimaryModalOpen(false)
    setPrimaryModalData(null)
    
    // ✅ FIX: Explicitly pass true to ensure this contact becomes primary
    // This avoids any state issues with formData.isPrimary
    await saveContact(true)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
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
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select role...</option>
                {CONTACT_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Custom Role Input (shows when "Other" is selected) */}
            {(selectedRole === 'Other' || isCustomRole) && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Custom Role
                </label>
                <input
                  type="text"
                  value={formData.customRole}
                  onChange={(e) => handleCustomRoleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter custom role..."
                  autoFocus
                />
              </div>
            )}

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
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 mt-0.5"
              />
              <div>
                <label htmlFor="isPrimary" className="text-sm font-medium text-neutral-900 cursor-pointer">
                  Set as primary contact
                </label>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Only one contact can be marked as primary
                </p>
              </div>
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

      {/* Primary Contact Confirmation Modal */}
      <ConfirmModal
        isOpen={primaryModalOpen}
        onClose={() => {
          setPrimaryModalOpen(false)
          setPrimaryModalData(null)
        }}
        onConfirm={confirmSwitchPrimary}
        title="Change Primary Contact?"
        message={primaryModalData ? `${primaryModalData.existingName} is currently the primary contact. Set ${primaryModalData.newName} as primary instead?` : ''}
        confirmText="Yes, Switch Primary"
        cancelText="Cancel"
        variant="warning"
        isLoading={isSaving}
      />
    </>
  )
}