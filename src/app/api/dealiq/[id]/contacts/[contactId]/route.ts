// FILE LOCATION: /src/app/api/dealiq/[id]/contacts/[contactId]/route.ts
// PURPOSE: Update and delete individual deal contacts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// PATCH - Update contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, contactId: string }> }
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

    const { id: dealIdOrMongoId, contactId } = await params
    const body = await request.json()

    // Helper to check if string is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id)

    // Find the deal to verify ownership - only use id field if it's a valid ObjectId
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

    // Verify contact belongs to this deal
    const existingContact = await prisma.dealContact.findFirst({
      where: {
        id: contactId,
        dealId: deal.id
      }
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // If setting as primary, unset other primary contacts
    if (body.isPrimary) {
      await prisma.dealContact.updateMany({
        where: { 
          dealId: deal.id,
          id: { not: contactId }
        },
        data: { isPrimary: false }
      })
    }

    // Update contact
    const contact = await prisma.dealContact.update({
      where: { id: contactId },
      data: {
        name: body.name !== undefined ? body.name : existingContact.name,
        role: body.role !== undefined ? body.role : existingContact.role,
        email: body.email !== undefined ? body.email : existingContact.email,
        phone: body.phone !== undefined ? body.phone : existingContact.phone,
        company: body.company !== undefined ? body.company : existingContact.company,
        isPrimary: body.isPrimary !== undefined ? body.isPrimary : existingContact.isPrimary
      }
    })

    console.log('✅ Contact updated:', contact.id)

    return NextResponse.json({ success: true, contact })
  } catch (error) {
    console.error('Update contact error:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

// DELETE - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, contactId: string }> }
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

    const { id: dealIdOrMongoId, contactId } = await params

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

    // Verify contact belongs to this deal
    const existingContact = await prisma.dealContact.findFirst({
      where: {
        id: contactId,
        dealId: deal.id
      }
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Delete contact
    await prisma.dealContact.delete({
      where: { id: contactId }
    })

    console.log('✅ Contact deleted:', contactId)

    return NextResponse.json({ success: true, message: 'Contact deleted' })
  } catch (error) {
    console.error('Delete contact error:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}