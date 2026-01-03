import { NextResponse } from 'next/server'
import { getSystemSettings } from '@/lib/settings'

// GET - Fetch system settings (public endpoint)
export async function GET() {
  try {
    const settings = await getSystemSettings()
    
    // Only return the settings users need to see
    // Don't expose internal admin fields
    return NextResponse.json({ 
      success: true,
      settings: {
        accountDeletionEnabled: settings.accountDeletionEnabled,
        pdfExportEnabled: settings.pdfExportEnabled,
        analysisEnabled: settings.analysisEnabled,
        savedDraftsEnabled: settings.savedDraftsEnabled,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        signUpEnabled: settings.signUpEnabled,
        dashboardEnabled: settings.dashboardEnabled,
        stripeEnabled: settings.stripeEnabled
      }
    })
  } catch (error) {
    console.error('Get system settings error:', error)
    // Return defaults on error - don't break the app
    return NextResponse.json({ 
      success: true,
      settings: {
        accountDeletionEnabled: true,
        pdfExportEnabled: true,
        analysisEnabled: true,
        savedDraftsEnabled: true,
        maintenanceMode: false,
        maintenanceMessage: null,
        signUpEnabled: true,
        dashboardEnabled: true,
        stripeEnabled: true
      }
    })
  }
}