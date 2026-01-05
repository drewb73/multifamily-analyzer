// FILE 3 of 8: REPLACE ENTIRE FILE
// Location: src/app/dashboard/start-trial/page.tsx
// Action: REPLACE YOUR ENTIRE start-trial/page.tsx WITH THIS

import { getCurrentDbUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSystemSettings } from '@/lib/settings'
import { StripeMaintenancePage } from '@/components/StripeMaintenancePage'

export default async function StartTrialPage() {
  const dbUser = await getCurrentDbUser()
  
  if (!dbUser) {
    redirect('/sign-in')
  }

  // Check if Stripe is enabled
  const settings = await getSystemSettings()
  
  if (!settings.stripeEnabled) {
    return (
      <StripeMaintenancePage 
        message="Trial signups are temporarily unavailable. Please check back later!" 
        showBackButton={true}
      />
    )
  }

  // Check if user has already used trial
  if (dbUser.hasUsedTrial) {
    redirect('/pricing')
  }

  // Check if already on trial or premium
  if (dbUser.subscriptionStatus === 'trial' || dbUser.subscriptionStatus === 'premium' || dbUser.subscriptionStatus === 'enterprise') {
    redirect('/dashboard')
  }

  // Start the trial - 72 hours from now
  const trialEndsAt = new Date()
  trialEndsAt.setHours(trialEndsAt.getHours() + 72)

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      subscriptionStatus: 'trial',
      trialEndsAt: trialEndsAt,
      hasUsedTrial: true,
    },
  })

  // Redirect back to dashboard
  redirect('/dashboard')
}