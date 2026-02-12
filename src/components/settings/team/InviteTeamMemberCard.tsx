// File Location: src/components/settings/team/InviteTeamMemberCard.tsx
// Component to send team invitations

'use client';

import { useState } from 'react';
import { Mail, Send, AlertCircle, Loader2, Check } from 'lucide-react';

interface InviteTeamMemberCardProps {
  availableSeats: number;
  onInviteSent: () => void;
}

export function InviteTeamMemberCard({ availableSeats, onInviteSent }: InviteTeamMemberCardProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccess(data.message || `Invitation sent to ${formData.email}`);
      setFormData({ email: '', firstName: '', lastName: '' });
      
      setTimeout(() => {
        setSuccess(null);
        onInviteSent();
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSending(false);
    }
  };

  const isFormValid = formData.email && formData.firstName && formData.lastName;

  return (
    <div className="elevated-card p-6">
      <div className="flex items-center mb-6">
        <Mail className="h-6 w-6 text-primary-600 mr-3" />
        <h2 className="text-xl font-semibold text-neutral-800">
          Invite Team Member
        </h2>
      </div>

      {availableSeats === 0 && (
        <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-warning-700">
            No available seats. Purchase more seats to invite team members.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg flex items-start gap-2">
          <Check className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-success-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="colleague@company.com"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSending || availableSeats === 0}
            required
          />
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="John"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSending || availableSeats === 0}
            required
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Doe"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSending || availableSeats === 0}
            required
          />
        </div>

        {/* Available Seats Info */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Available Seats</span>
            <span className={`font-semibold ${availableSeats > 0 ? 'text-success-700' : 'text-error-700'}`}>
              {availableSeats}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isSending || availableSeats === 0}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending Invitation...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Invitation
            </>
          )}
        </button>

        <p className="text-xs text-neutral-500 text-center">
          An email invitation will be sent to the provided address
        </p>
      </form>
    </div>
  );
}