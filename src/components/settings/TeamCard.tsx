// FILE LOCATION: src/components/settings/TeamCard.tsx
// COMPLETE FILE - Replace entire file
// FIXED: Now shows for ALL premium users, not just those with existing teams

'use client'

import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'

interface TeamCardProps {
  isTeamMember: boolean
  isWorkspaceOwner: boolean
}

export function TeamCard({ isTeamMember, isWorkspaceOwner }: TeamCardProps) {
  // ✅ REMOVED: Don't hide the card! Show it for ALL premium users
  // This allows premium users to discover the team feature even if they haven't invited anyone yet

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Team Workspace</h2>
          <p className="text-sm text-neutral-600">
            {isWorkspaceOwner 
              ? 'Manage your team' 
              : isTeamMember 
                ? 'View team members' 
                : 'Collaborate with your team'}
          </p>
        </div>
      </div>

      <p className="text-sm text-neutral-600 mb-4">
        {isWorkspaceOwner 
          ? 'Invite team members, manage seats, and view your workspace settings.'
          : isTeamMember
            ? 'You are part of a team workspace with shared access to deals and analyses.'
            : 'Invite team members to collaborate on deals and property analyses. Share access to your workspace.'}
      </p>

      <Link
        href="/dashboard/settings/team"
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        {isWorkspaceOwner 
          ? 'Manage Team' 
          : isTeamMember 
            ? 'View Team' 
            : 'Set Up Team'}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}