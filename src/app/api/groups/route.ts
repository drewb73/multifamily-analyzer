// FILE: src/app/api/groups/route.ts
// COMPLETE FILE - With workspace sharing

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET /api/groups - List workspace groups
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Get user with workspace info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, isTeamMember: true, teamWorkspaceOwnerId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ Build workspace user IDs
    let userIds = [user.id]
    if (user.isTeamMember && user.teamWorkspaceOwnerId) {
      userIds.push(user.teamWorkspaceOwnerId)
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: user.teamWorkspaceOwnerId },
        select: { memberId: true }
      })
      members.forEach(m => userIds.push(m.memberId))
    } else {
      const members = await prisma.workspaceTeamMember.findMany({
        where: { ownerId: user.id },
        select: { memberId: true }
      })
      members.forEach(m => userIds.push(m.memberId))
    }

    // ✅ Fetch all groups for workspace with analysis count
    const groups = await prisma.analysisGroup.findMany({
      where: {
        userId: { in: userIds },
      },
      include: {
        _count: {
          select: { analyses: true }
        }
      },
      orderBy: {
        sortOrder: 'asc',
      }
    })

    // Transform to include count as a top-level field
    const groupsWithCount = groups.map((group: any) => ({
      id: group.id,
      userId: group.userId,
      name: group.name,
      description: group.description,
      color: group.color,
      icon: group.icon,
      sortOrder: group.sortOrder,
      analysisCount: group._count.analyses,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }))

    return NextResponse.json({ groups: groupsWithCount })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

// POST /api/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Get user with workspace info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { 
        id: true, 
        subscriptionStatus: true,
        isTeamMember: true 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ Check if user is premium OR team member (team members have access)
    const isPremium = user.subscriptionStatus === 'premium' || 
                     user.subscriptionStatus === 'enterprise' || 
                     user.isTeamMember
    
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required to create groups' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, color, icon } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    // Get current max sortOrder to add new group at the end
    const maxSortOrder = await prisma.analysisGroup.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const nextSortOrder = (maxSortOrder?.sortOrder ?? -1) + 1

    // Create group
    const group = await prisma.analysisGroup.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        color: color || '#3B82F6', // Default blue
        icon: icon || 'Folder',
        sortOrder: nextSortOrder,
      },
      include: {
        _count: {
          select: { analyses: true }
        }
      }
    })

    // Transform response
    const groupWithCount = {
      id: group.id,
      userId: group.userId,
      name: group.name,
      description: group.description,
      color: group.color,
      icon: group.icon,
      sortOrder: group.sortOrder,
      analysisCount: (group._count as any).analyses,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }

    return NextResponse.json({ group: groupWithCount }, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}