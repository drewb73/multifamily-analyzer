import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { clearSettingsCache } from '@/lib/settings'

// GET - Fetch system settings
export async function GET() {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    
    // Verify user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authorized'
      }, { status: 403 })
    }

    // Get settings (should only be one record)
    let settings = await prisma.systemSettings.findFirst()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          maintenanceMode: false,
          signInEnabled: true,
          signUpEnabled: true,
          stripeEnabled: true,
          analysisEnabled: true,
          pdfExportEnabled: true,
          savedDraftsEnabled: true,
          accountDeletionEnabled: true,
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      settings
    })
  } catch (error) {
    console.error('Get settings error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH - Update system settings
export async function PATCH(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    
    // Verify user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authorized'
      }, { status: 403 })
    }

    const body = await request.json()

    // Get current settings
    const currentSettings = await prisma.systemSettings.findFirst()

    if (!currentSettings) {
      return NextResponse.json({ 
        success: false,
        error: 'Settings not found'
      }, { status: 404 })
    }

    // Update settings
    const updatedSettings = await prisma.systemSettings.update({
      where: { id: currentSettings.id },
      data: {
        maintenanceMode: body.maintenanceMode,
        maintenanceMessage: body.maintenanceMessage,
        signInEnabled: body.signInEnabled,
        signUpEnabled: body.signUpEnabled,
        stripeEnabled: body.stripeEnabled,
        analysisEnabled: body.analysisEnabled,
        pdfExportEnabled: body.pdfExportEnabled,
        savedDraftsEnabled: body.savedDraftsEnabled,
        accountDeletionEnabled: body.accountDeletionEnabled,
        updatedBy: email
      }
    })

    // Log the change
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'settings_updated',
        details: {
          changes: body,
          timestamp: new Date().toISOString()
        }
      }
    })

    // Clear the cache so changes are reflected immediately
    clearSettingsCache()

    return NextResponse.json({ 
      success: true,
      settings: updatedSettings
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update settings'
    }, { status: 500 })
  }
}