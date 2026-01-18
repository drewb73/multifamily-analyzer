// FILE LOCATION: /src/app/api/dealiq/[id]/contacts/route.ts
// PURPOSE: Create and list deal contacts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// POST - Create new contact
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
          : { dealId: dealIdOrMongoId }  // If not valid ObjectId, only search by dealId
        ),
        userId: user.id
      }
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // If setting as primary, unset other primary contacts
    if (body.isPrimary) {
      await prisma.dealContact.updateMany({
        where: { dealId: deal.id },
        data: { isPrimary: false }
      })
    }

    // Create contact
    const contact = await prisma.dealContact.create({
      data: {
        dealId: deal.id,
        name: body.name,
        role: body.role || null,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        isPrimary: body.isPrimary || false
      }
    })

    console.log('✅ Contact created:', contact.id)

    return NextResponse.json({ success: true, contact }, { status: 201 })
  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json({ 
      error: 'Failed to create contact',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}