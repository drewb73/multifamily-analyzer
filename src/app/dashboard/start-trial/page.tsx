// src/app/dashboard/start-trial/page.tsx
import { getCurrentDbUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function StartTrialPage() {
  const dbUser = await getCurrentDbUser();
  
  if (!dbUser) {
    redirect('/sign-in');
  }

  // Check if user has already used trial
  if (dbUser.hasUsedTrial) {
    redirect('/pricing');
  }

  // Check if already on trial or premium
  if (dbUser.subscriptionStatus === 'trial' || dbUser.subscriptionStatus === 'premium' || dbUser.subscriptionStatus === 'enterprise') {
    redirect('/dashboard');
  }

  // Start the trial - 72 hours from now
  const trialEndsAt = new Date();
  trialEndsAt.setHours(trialEndsAt.getHours() + 72);

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      subscriptionStatus: 'trial',
      trialEndsAt: trialEndsAt,
      hasUsedTrial: true,
    },
  });

  // Redirect back to dashboard
  redirect('/dashboard');
}
