// FILE LOCATION: /src/app/api/nreadr/settings/route.ts
// FIXED: Added dealiqEnabled field support

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { clearSettingsCache } from '@/lib/settings'

// GET - Fetch current settings
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true, email: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get settings
    let settings = await prisma.systemSettings.findFirst()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          maintenanceMode: false,
          dashboardEnabled: true,
          signUpEnabled: true,
          stripeEnabled: true,
          analysisEnabled: true,
          pdfExportEnabled: true,
          savedDraftsEnabled: true,
          accountDeletionEnabled: true,
          dealiqEnabled: false, // ← ADDED
        }
      })
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PATCH - Update settings
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true, email: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()

    // Get current settings
    const currentSettings = await prisma.systemSettings.findFirst()
    
    if (!currentSettings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    // Update settings
    const updatedSettings = await prisma.systemSettings.update({
      where: { id: currentSettings.id },
      data: {
        maintenanceMode: body.maintenanceMode,
        maintenanceMessage: body.maintenanceMessage,
        dashboardEnabled: body.dashboardEnabled,
        signUpEnabled: body.signUpEnabled,
        stripeEnabled: body.stripeEnabled,
        analysisEnabled: body.analysisEnabled,
        pdfExportEnabled: body.pdfExportEnabled,
        savedDraftsEnabled: body.savedDraftsEnabled,
        accountDeletionEnabled: body.accountDeletionEnabled,
        dealiqEnabled: body.dealiqEnabled, // ← ADDED
        updatedBy: user.email
      }
    })

    // Log the change
    await prisma.adminLog.create({
      data: {
        adminEmail: user.email || 'unknown',
        action: 'settings_updated',
        details: {
          changes: body
        }
      }
    })

    // Clear the settings cache
    clearSettingsCache()

    return NextResponse.json({ success: true, settings: updatedSettings })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}