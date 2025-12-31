// src/lib/clerkTheme.ts
// Clerk appearance configuration to match your app theme

export const clerkAppearance = {
  elements: {
    // Root elements
    rootBox: 'w-full',
    card: 'shadow-2xl border border-neutral-200',
    
    // Header
    headerTitle: 'text-2xl font-bold text-neutral-900',
    headerSubtitle: 'text-neutral-600',
    
    // Navigation
    navbar: 'border-b border-neutral-200 bg-neutral-50',
    navbarButton: 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50 data-[active]:text-primary-600 data-[active]:bg-primary-50 data-[active]:border-b-2 data-[active]:border-primary-600',
    navbarMobileMenuButton: 'text-neutral-700',
    
    // Buttons - Primary (your blue theme)
    formButtonPrimary: 'bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-sm',
    
    // Buttons - Secondary
    formButtonReset: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
    
    // Social buttons (Google, etc)
    socialButtonsBlockButton: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
    socialButtonsBlockButtonText: 'text-neutral-700 font-medium',
    
    // Form inputs
    formFieldInput: 'border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20',
    formFieldLabel: 'text-neutral-700 font-medium text-sm',
    formFieldInputShowPasswordButton: 'text-neutral-500 hover:text-neutral-700',
    
    // Form field hints/descriptions
    formFieldHintText: 'text-neutral-500 text-xs',
    formFieldSuccessText: 'text-success-600 text-xs',
    formFieldErrorText: 'text-error-600 text-xs',
    
    // Dividers
    dividerLine: 'bg-neutral-200',
    dividerText: 'text-neutral-500 text-sm',
    
    // Links
    footerActionLink: 'text-primary-600 hover:text-primary-700 font-medium',
    
    // Badges
    badge: 'bg-primary-100 text-primary-700 font-medium',
    
    // Alerts
    alert: 'bg-blue-50 border border-blue-200',
    alertText: 'text-blue-700',
    
    // Modal
    modalBackdrop: 'bg-black/50 backdrop-blur-sm',
    modalContent: 'bg-white rounded-xl shadow-2xl',
    modalCloseButton: 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg',
    
    // Footer - Hide "Secured by Clerk" and development mode badge
    footer: 'hidden',
    footerPages: 'hidden',
    
    // Profile section (hide it)
    profileSection: 'hidden',
    profileSectionPrimaryButton: 'hidden',
    
    // Security section
    accordionTriggerButton: 'hover:bg-neutral-50 text-neutral-700',
    accordionContent: 'bg-neutral-50',
    
    // Phone input
    phoneInputBox: 'border-neutral-300 focus-within:border-primary-500',
    
    // Avatar (hide if not needed)
    avatarBox: 'hidden',
    avatarImage: 'hidden',
    
    // Breadcrumbs
    breadcrumbsItem: 'text-neutral-600',
    breadcrumbsItemDivider: 'text-neutral-400',
    
    // Tags/chips
    tag: 'bg-neutral-100 text-neutral-700',
    
    // Tables (for sessions, etc)
    table: 'border border-neutral-200',
    tableHead: 'bg-neutral-50 text-neutral-700',
    tableCell: 'border-neutral-200 text-neutral-900',
    
    // Form field row
    formFieldRow: 'gap-4',
    
    // Identity preview (email, phone)
    identityPreview: 'border border-neutral-200 hover:border-primary-300',
    identityPreviewText: 'text-neutral-700',
    identityPreviewEditButton: 'text-primary-600 hover:text-primary-700',
  },
  
  layout: {
    // Customize layout
    socialButtonsPlacement: 'bottom' as const,
    socialButtonsVariant: 'blockButton' as const,
    showOptionalFields: false,
  },
  
  variables: {
    // Color variables (using your theme)
    colorPrimary: '#3b82f6', // primary-600 blue
    colorSuccess: '#10b981', // success-600 green
    colorDanger: '#ef4444', // error-600 red
    colorWarning: '#f59e0b', // warning-600 orange
    colorTextOnPrimaryBackground: '#ffffff',
    colorTextSecondary: '#6b7280', // neutral-500
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#1f2937', // neutral-800
    
    // Typography
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    // Border radius (matching your design)
    borderRadius: '0.5rem', // rounded-lg
    
    // Spacing
    spacingUnit: '1rem',
  },
}

// Specific configuration for UserProfile modal to hide profile section
export const userProfileAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    // Specifically hide profile-related elements
    profileSection: 'hidden !important',
    profileSectionContent: 'hidden !important',
    profileSectionPrimaryButton: 'hidden !important',
    
    // Make security the primary/default view
    navbar: 'border-b border-neutral-200 bg-neutral-50',
    page: 'bg-white',
    
    // Ensure footer is hidden (removes "Secured by Clerk" badge)
    footer: 'hidden !important',
    footerPages: 'hidden !important',
    
    // Additional profile elements to hide
    avatarBox: 'hidden !important',
    userButtonPopoverCard: 'shadow-xl border border-neutral-200',
  },
}