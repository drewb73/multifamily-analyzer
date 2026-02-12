// File Location: src/components/settings/team/TeamMembersCard.tsx
// Component to display and manage team members

'use client';

import { useState } from 'react';
import { Users, UserMinus, AlertCircle, Loader2, Check } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: string;
  status: string;
  joinedAt: string;
  lastLoginAt?: string;
  isCurrentUser?: boolean;
}

interface TeamMembersCardProps {
  members: TeamMember[];
  role: 'owner' | 'member';
  onRefresh: () => void;
}

export function TeamMembersCard({ members, role, onRefresh }: TeamMembersCardProps) {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    setIsRemoving(memberId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove team member');
      }

      setSuccess(`${memberName} has been removed from your workspace`);
      setConfirmRemove(null);
      
      setTimeout(() => {
        setSuccess(null);
        onRefresh();
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsRemoving(null);
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="elevated-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-neutral-800">
            Team Members
          </h2>
        </div>
        <span className="text-sm text-neutral-600">
          {members.length} member{members.length !== 1 ? 's' : ''}
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
        {members.length === 0 ? (
          <div className="text-center py-8 px-4 bg-neutral-50 border border-neutral-200 rounded-lg">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium">No team members yet</p>
            <p className="text-sm text-neutral-500 mt-1">
              {role === 'owner' 
                ? 'Invite team members to get started' 
                : 'You are the only member in this workspace'}
            </p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Avatar */}
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-700">
                        {getInitials(member.name)}
                      </span>
                    </div>
                  )}

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-900 truncate">
                        {member.name}
                      </h3>
                      {member.isCurrentUser && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 truncate">{member.email}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                      <span>Joined {formatDate(member.joinedAt)}</span>
                      {member.lastLoginAt && (
                        <>
                          <span>•</span>
                          <span>Last active {formatDate(member.lastLoginAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions (only for owners) */}
                {role === 'owner' && (
                  <div>
                    {confirmRemove === member.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="text-sm text-error-600 hover:text-error-700 font-medium"
                          disabled={isRemoving === member.id}
                        >
                          {isRemoving === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Confirm'
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="text-sm text-neutral-600 hover:text-neutral-700"
                          disabled={isRemoving === member.id}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(member.id)}
                        className="text-neutral-400 hover:text-error-600 transition-colors p-1.5 rounded hover:bg-error-50"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}