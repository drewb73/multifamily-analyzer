import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get active promo modal (public endpoint)
export async function GET() {
  try {
    const now = new Date()
    
    // Get active promo modal
    const promoModal = await prisma.promoModal.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, promoModal })
  } catch (error) {
    console.error('Get active promo modal error:', error)
    return NextResponse.json({ success: true, promoModal: null })
  }
}