// File Location: src/components/settings/team/PendingInvitationsCard.tsx
// Component to manage pending invitations

'use client';

import { useState } from 'react';
import { Clock, RefreshCw, X, AlertCircle, Loader2, Check, Mail } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  name: string;
  status: string;
  sentAt: string;
  expiresAt: string;
  daysRemaining: number;
}

interface PendingInvitationsCardProps {
  invitations: Invitation[];
  onRefresh: () => void;
}

export function PendingInvitationsCard({ invitations, onRefresh }: PendingInvitationsCardProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'resend' | 'cancel' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResendInvitation = async (invitationId: string) => {
    setIsProcessing(invitationId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/team/invitations/${invitationId}/resend`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation');
      }

      setSuccess(data.message || 'Invitation resent successfully');
      setConfirmAction(null);
      
      setTimeout(() => {
        setSuccess(null);
        onRefresh();
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setIsProcessing(invitationId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/team/invitations/${invitationId}/rescind`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invitation');
      }

      setSuccess(data.message || 'Invitation cancelled successfully');
      setConfirmAction(null);
      
      setTimeout(() => {
        setSuccess(null);
        onRefresh();
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_signup':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'pending_premium_cancel':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-700">
            <AlertCircle className="w-3 h-3 mr-1" />
            Action Required
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700">
            <Check className="w-3 h-3 mr-1" />
            Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
            Declined
          </span>
        );
      case 'rescinded':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
            Cancelled
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  const isPending = (status: string) => {
    return ['pending', 'pending_signup', 'pending_premium_cancel'].includes(status);
  };

  const pendingInvitations = invitations.filter(inv => isPending(inv.status));

  return (
    <div className="elevated-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Mail className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-neutral-800">
            Pending Invitations
          </h2>
        </div>
        <span className="text-sm text-neutral-600">
          {pendingInvitations.length}
        </span>
      </div>

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

      <div className="space-y-3">
        {pendingInvitations.length === 0 ? (
          <div className="text-center py-8 px-4 bg-neutral-50 border border-neutral-200 rounded-lg">
            <Mail className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium">No pending invitations</p>
            <p className="text-sm text-neutral-500 mt-1">
              Invitations you send will appear here
            </p>
          </div>
        ) : (
          pendingInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-neutral-900 truncate">
                      {invitation.name}
                    </h3>
                    {getStatusBadge(invitation.status)}
                  </div>
                  <p className="text-sm text-neutral-600 truncate mb-2">
                    {invitation.email}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span>Sent {formatDate(invitation.sentAt)}</span>
                    <span>•</span>
                    {invitation.daysRemaining > 0 ? (
                      <span className="text-warning-600 font-medium">
                        Expires in {invitation.daysRemaining} day{invitation.daysRemaining !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-error-600 font-medium">Expired</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {confirmAction?.id === invitation.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (confirmAction.action === 'resend') {
                            handleResendInvitation(invitation.id);
                          } else {
                            handleCancelInvitation(invitation.id);
                          }
                        }}
                        className="text-sm text-error-600 hover:text-error-700 font-medium whitespace-nowrap"
                        disabled={isProcessing === invitation.id}
                      >
                        {isProcessing === invitation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Confirm'
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="text-sm text-neutral-600 hover:text-neutral-700"
                        disabled={isProcessing === invitation.id}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setConfirmAction({ id: invitation.id, action: 'resend' })}
                        className="text-neutral-400 hover:text-primary-600 transition-colors p-1.5 rounded hover:bg-primary-50"
                        title="Resend invitation"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmAction({ id: invitation.id, action: 'cancel' })}
                        className="text-neutral-400 hover:text-error-600 transition-colors p-1.5 rounded hover:bg-error-50"
                        title="Cancel invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}