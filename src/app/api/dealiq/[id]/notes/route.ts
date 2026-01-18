// FILE LOCATION: /src/app/api/dealiq/[id]/notes/route.ts
// PURPOSE: Create notes for deals

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// POST - Create new note
export async function POST(
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

    const { id: dealIdOrMongoId } = await params
    const body = await request.json()

    // Helper to check if string is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id)

    // Find the deal - only use id field if it's a valid ObjectId
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

    // Create note
    const note = await prisma.dealNote.create({
      data: {
        dealId: deal.id,
        userId: user.id,
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

    console.log('✅ Note created:', note.id)

    return NextResponse.json({ success: true, note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json({ 
      error: 'Failed to create note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}