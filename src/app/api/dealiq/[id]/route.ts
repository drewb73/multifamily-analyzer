// FILE LOCATION: /src/app/api/dealiq/[id]/route.ts
// PURPOSE: Individual deal operations - Get, Update, Delete
// FIXED: Better dealId lookup with logging

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

    console.log('🔍 Looking for deal with ID:', id, 'for user:', user.id)

    // Try to find by dealId first (the 7-digit number users see)
    let deal = await prisma.deal.findFirst({
      where: {
        dealId: id,
        userId: user.id
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

    // If not found by dealId, try by MongoDB ID as fallback
    if (!deal) {
      console.log('❌ Not found by dealId, trying MongoDB ID...')
      deal = await prisma.deal.findFirst({
        where: {
          id: id,
          userId: user.id
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
    }

    if (!deal) {
      console.log('❌ Deal not found with either dealId or MongoDB ID')
      
      // Debug: List all deals for this user
      const userDeals = await prisma.deal.findMany({
        where: { userId: user.id },
        select: { id: true, dealId: true, address: true }
      })
      console.log('📋 User has these deals:', userDeals)
      
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    console.log('✅ Deal found:', deal.dealId)
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

    // Try to find by dealId first (the 7-digit number)
    let deal = await prisma.deal.findFirst({
      where: {
        dealId: id,
        userId: user.id
      }
    })

    // If not found by dealId, try by MongoDB ID as fallback
    if (!deal) {
      console.log('Not found by dealId, trying MongoDB ID...')
      deal = await prisma.deal.findFirst({
        where: {
          id: id,
          userId: user.id
        }
      })
    }

    if (!deal) {
      console.log('❌ Deal not found or user does not own it')
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    console.log('✅ Deal found, deleting...')

    // Delete the deal using MongoDB ID (cascade will delete contacts, notes, changes)
    await prisma.deal.delete({
      where: { id: deal.id }  // Use the MongoDB ID from the found deal
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