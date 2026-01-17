// FILE LOCATION: /src/app/api/dealiq/[id]/route.ts
// PURPOSE: Individual deal operations - Get, Update, Delete
// FIXED: Proper async params handling for Next.js 13+

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET - Get single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // ✨ FIXED: Await params
    const { id } = await params

    // Find deal by MongoDB ID
    const deal = await prisma.deal.findFirst({
      where: {
        id: id,
        userId: user.id // Ensure user owns this deal
      },
      include: {
        analysis: true,
        contacts: true,
        notes: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        changes: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deal })
  } catch (error) {
    console.error('Get deal error:', error)
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 })
  }
}

// DELETE - Delete a deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // ✨ FIXED: Await params
    const { id } = await params

    console.log('🗑️ Attempting to delete deal:', id, 'for user:', user.id)

    // Find deal first to verify ownership
    const deal = await prisma.deal.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!deal) {
      console.log('❌ Deal not found or user does not own it')
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    console.log('✅ Deal found, deleting...')

    // Delete the deal (cascade will delete contacts, notes, changes)
    await prisma.deal.delete({
      where: { id: id }
    })

    console.log('✅ Deal deleted successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Deal deleted successfully' 
    })
  } catch (error) {
    console.error('Delete deal error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete deal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}