// File Location: src/app/dashboard/settings/team/page.tsx
// Team workspace settings page

'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { SeatManagementCard } from '@/components/settings/team/SeatManagementCard';
import { TeamMembersCard } from '@/components/settings/team/TeamMembersCard';
import { InviteTeamMemberCard } from '@/components/settings/team/InviteTeamMemberCard';
import { PendingInvitationsCard } from '@/components/settings/team/PendingInvitationsCard';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface WorkspaceData {
  role: 'owner' | 'member';
  workspace: {
    owner: {
      id: string;
      email: string;
      name: string;
    };
    seats?: {
      purchased: number;
      used: number;
      available: number;
    };
    teamSize: number;
  };
  teamMembers: any[];
  pendingInvitations?: any[];
}

export default function TeamSettingsPage() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaceData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/team/workspace');
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('No workspace found. Purchase seats to create a workspace.');
          return;
        }
        throw new Error('Failed to load workspace data');
      }

      const data = await response.json();
      setWorkspaceData(data);
    } catch (error: any) {
      console.error('Error loading workspace:', error);
      setError('Failed to load workspace data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadWorkspaceData();
    }
  }, [user]);

  const handleRefresh = () => {
    loadWorkspaceData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Team member view
  if (workspaceData?.role === 'member') {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Team Workspace
          </h1>
          <p className="text-lg text-neutral-600 mt-2">
            You are a member of {workspaceData.workspace.owner.name}'s workspace
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="elevated-card p-6">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">
              Workspace Owner
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-neutral-600">Name</p>
                <p className="text-neutral-900 font-medium">
                  {workspaceData.workspace.owner.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Email</p>
                <p className="text-neutral-900">
                  {workspaceData.workspace.owner.email}
                </p>
              </div>
            </div>
          </div>

          <TeamMembersCard
            members={workspaceData.teamMembers}
            role="member"
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    );
  }

  // Workspace owner view
  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Settings
        </Link>
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          Team Workspace
        </h1>
        <p className="text-lg text-neutral-600 mt-2">
          Manage your team members and workspace settings
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-error-900">{error}</p>
            {error.includes('Purchase seats') && (
              <p className="text-sm text-error-700 mt-1">
                Get started by purchasing seats below.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Seat Management */}
        <SeatManagementCard
          seats={workspaceData?.workspace.seats || { purchased: 0, used: 0, available: 0 }}
          onRefresh={handleRefresh}
        />

        {/* Invite Team Member */}
        <InviteTeamMemberCard
          availableSeats={workspaceData?.workspace.seats?.available || 0}
          onInviteSent={handleRefresh}
        />

        {/* Team Members */}
        <TeamMembersCard
          members={workspaceData?.teamMembers || []}
          role="owner"
          onRefresh={handleRefresh}
        />

        {/* Pending Invitations */}
        <PendingInvitationsCard
          invitations={workspaceData?.pendingInvitations || []}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}