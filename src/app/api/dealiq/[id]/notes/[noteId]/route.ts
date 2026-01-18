// FILE LOCATION: /src/app/api/dealiq/[id]/notes/[noteId]/route.ts
// PURPOSE: Update and delete individual deal notes

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// PATCH - Update note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, noteId: string }> }
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

    const { id: dealIdOrMongoId, noteId } = await params
    const body = await request.json()

    // Helper to check if string is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id)

    // Find the deal to verify ownership
    let deal = await prisma.deal.findFirst({
      where: {
        ...(isValidObjectId(dealIdOrMongoId) 
          ? {
              OR: [
                { dealId: dealIdOrMongoId },
                { id: dealIdOrMongoId }
              ]
            }
          : { dealId: dealIdOrMongoId }
        ),
        userId: user.id
      }
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Verify note belongs to this deal and this user
    const existingNote = await prisma.dealNote.findFirst({
      where: {
        id: noteId,
        dealId: deal.id,
        userId: user.id  // Only allow users to edit their own notes
      }
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 })
    }

    // Update note
    const note = await prisma.dealNote.update({
      where: { id: noteId },
      data: {
        content: body.content
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    console.log('✅ Note updated:', note.id)

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Update note error:', error)
    return NextResponse.json({ 
      error: 'Failed to update note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Delete note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, noteId: string }> }
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

    const { id: dealIdOrMongoId, noteId } = await params

    // Helper to check if string is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id)

    // Find the deal to verify ownership
    let deal = await prisma.deal.findFirst({
      where: {
        ...(isValidObjectId(dealIdOrMongoId) 
          ? {
              OR: [
                { dealId: dealIdOrMongoId },
                { id: dealIdOrMongoId }
              ]
            }
          : { dealId: dealIdOrMongoId }
        ),
        userId: user.id
      }
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Verify note belongs to this deal and this user
    const existingNote = await prisma.dealNote.findFirst({
      where: {
        id: noteId,
        dealId: deal.id,
        userId: user.id  // Only allow users to delete their own notes
      }
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 })
    }

    // Delete note
    await prisma.dealNote.delete({
      where: { id: noteId }
    })

    console.log('✅ Note deleted:', noteId)

    return NextResponse.json({ success: true, message: 'Note deleted' })
  } catch (error) {
    console.error('Delete note error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}