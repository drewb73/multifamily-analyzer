// src/app/api/groups/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET /api/groups/[id] - Get single group
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const params = await context.params

    const group = await prisma.analysisGroup.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        _count: {
          select: { analyses: true }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Transform response
    const groupWithCount = {
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
    }

    return NextResponse.json({ group: groupWithCount })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

// PUT /api/groups/[id] - Update group
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const params = await context.params

    // Check ownership
    const existing = await prisma.analysisGroup.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, color, icon, sortOrder } = body

    // Update only provided fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const group = await prisma.analysisGroup.update({
      where: { id: params.id },
      data: updateData,
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
      analysisCount: group._count.analyses,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }

    return NextResponse.json({ group: groupWithCount })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const params = await context.params

    // Check ownership
    const existing = await prisma.analysisGroup.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Delete group (analyses will become ungrouped due to onDelete: SetNull)
    await prisma.analysisGroup.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}