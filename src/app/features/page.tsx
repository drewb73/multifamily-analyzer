// src/app/features/page.tsx
'use client'

import Link from 'next/link'
import { ArrowLeft, Check, X, Sparkles } from 'lucide-react'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Feature Comparison</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-bold text-neutral-900 mb-6">
            Compare Plans & Features
          </h1>
          
          <p className="text-xl text-neutral-600 leading-relaxed">
            See exactly what you get with each plan. From basic property analysis to unlimited professional exports.
          </p>
        </div>

        {/* Features Table */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 border-b border-neutral-200 bg-neutral-50">
              <div className="p-6">
                <h3 className="text-lg font-bold text-neutral-900">Features</h3>
              </div>
              <div className="p-6 text-center border-l border-neutral-200">
                <h3 className="text-lg font-bold text-neutral-900">Free</h3>
                <p className="text-sm text-neutral-600 mt-1">Trial Expired</p>
              </div>
              <div className="p-6 text-center border-l border-neutral-200 bg-primary-50/50">
                <h3 className="text-lg font-bold text-primary-700">Free Trial</h3>
                <p className="text-sm text-primary-600 mt-1">72 Hours</p>
              </div>
              <div className="p-6 text-center border-l border-neutral-200 bg-primary-100/50">
                <h3 className="text-lg font-bold text-primary-700">Premium</h3>
                <p className="text-sm text-primary-600 mt-1">$7/month</p>
              </div>
            </div>

            {/* Account Access */}
            <div className="border-b border-neutral-200 bg-neutral-50/50">
              <div className="p-4 pl-6">
                <h4 className="font-semibold text-neutral-900">Account Access</h4>
              </div>
            </div>

            <FeatureRow
              feature="Dashboard Access"
              free={true}
              trial={true}
              premium={true}
            />

            {/* Core Analysis Features */}
            <div className="border-b border-neutral-200 bg-neutral-50/50">
              <div className="p-4 pl-6">
                <h4 className="font-semibold text-neutral-900">Core Analysis</h4>
              </div>
            </div>

            <FeatureRow
              feature="Property Analysis"
              free={false}
              trial={true}
              premium={true}
            />
            <FeatureRow
              feature="Cash Flow Calculations"
              free={false}
              trial={true}
              premium={true}
            />
            <FeatureRow
              feature="ROI Metrics (Cap Rate, CoC, GRM)"
              free={false}
              trial={true}
              premium={true}
            />
            <FeatureRow
              feature="Operating Expense Analysis"
              free={false}
              trial={true}
              premium={true}
            />

            {/* Data Management */}
            <div className="border-b border-neutral-200 bg-neutral-50/50">
              <div className="p-4 pl-6">
                <h4 className="font-semibold text-neutral-900">Data Management</h4>
              </div>
            </div>

            <FeatureRow
              feature="Save Properties"
              free={false}
              trial={false}
              premium={true}
            />
            <FeatureRow
              feature="Unlimited Saved Properties"
              free={false}
              trial={false}
              premium={true}
            />
            <FeatureRow
              feature="Create Property Groups"
              free={false}
              trial={false}
              premium={true}
            />
            <FeatureRow
              feature="Organize Portfolio"
              free={false}
              trial={false}
              premium={true}
            />

            {/* Export & Reports */}
            <div className="border-b border-neutral-200 bg-neutral-50/50">
              <div className="p-4 pl-6">
                <h4 className="font-semibold text-neutral-900">Export & Reports</h4>
              </div>
            </div>

            <FeatureRow
              feature="Professional PDF Export"
              free={false}
              trial={false}
              premium={true}
            />
            <FeatureRow
              feature="Unlimited PDF Exports"
              free={false}
              trial={false}
              premium={true}
            />
            <FeatureRow
              feature="Client-Ready Reports"
              free={false}
              trial={false}
              premium={true}
            />

            {/* Support & Access */}
            <div className="border-b border-neutral-200 bg-neutral-50/50">
              <div className="p-4 pl-6">
                <h4 className="font-semibold text-neutral-900">Support & Access</h4>
              </div>
            </div>

            <FeatureRow
              feature="Email Support"
              free={true}
              trial={true}
              premium={true}
            />
            <FeatureRow
              feature="Priority Support"
              free={false}
              trial={false}
              premium={true}
            />
            <FeatureRow
              feature="Access to New Features"
              free={false}
              trial={false}
              premium={true}
              highlight={true}
            />

            {/* Usage Limits */}
            <div className="border-b border-neutral-200 bg-neutral-50/50">
              <div className="p-4 pl-6">
                <h4 className="font-semibold text-neutral-900">Usage Limits</h4>
              </div>
            </div>

            <FeatureRow
              feature="Time Limit"
              freeText="Unlimited"
              trialText="72 hours"
              premiumText="Unlimited"
            />
            <FeatureRow
              feature="Analysis Limit"
              freeText="—"
              trialText="Unlimited"
              premiumText="Unlimited"
            />
            <FeatureRow
              feature="Saved Properties"
              freeText="0"
              trialText="0"
              premiumText="Unlimited"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-10 text-white shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Try NumexRE free for 72 hours. No payment required upfront.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/sign-up"
                className="px-8 py-4 bg-white text-primary-700 rounded-lg font-bold hover:bg-primary-50 transition-all shadow-lg"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/pricing"
                className="px-8 py-4 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-400 transition-all border-2 border-white/20"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-neutral-900 mb-2">
                What can I do with the free trial?
              </h3>
              <p className="text-neutral-600">
                The free trial gives you 72 hours to analyze properties and test our calculations. You can't save properties or export PDFs during the trial, but you get full access to our analysis tools.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-neutral-900 mb-2">
                What happens after my trial expires?
              </h3>
              <p className="text-neutral-600">
                After 72 hours, your trial expires and you won't be able to analyze properties anymore. However, you'll still have access to your dashboard and email support. Upgrade to Premium for unlimited access to all features.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-neutral-900 mb-2">
                What are "new features" included with Premium?
              </h3>
              <p className="text-neutral-600">
                Premium members get free access to all new features as they're released. This includes advanced analytics, new report types, and tools that we're constantly adding based on user feedback—at no additional cost.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Feature Row Component
interface FeatureRowProps {
  feature: string
  free?: boolean
  trial?: boolean
  premium?: boolean
  freeText?: string
  trialText?: string
  premiumText?: string
  highlight?: boolean
}

function FeatureRow({ 
  feature, 
  free, 
  trial, 
  premium, 
  freeText, 
  trialText, 
  premiumText,
  highlight = false
}: FeatureRowProps) {
  return (
    <div className={`grid grid-cols-4 border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors ${
      highlight ? 'bg-primary-50/30' : ''
    }`}>
      <div className="p-4 pl-6">
        <p className={`text-neutral-700 ${highlight ? 'font-medium' : ''}`}>
          {feature}
          {highlight && (
            <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              New
            </span>
          )}
        </p>
      </div>
      
      {/* Free Column */}
      <div className="p-4 flex items-center justify-center border-l border-neutral-100">
        {freeText !== undefined ? (
          <span className="text-neutral-600 font-medium">{freeText}</span>
        ) : free ? (
          <Check className="w-5 h-5 text-success-600" />
        ) : (
          <X className="w-5 h-5 text-neutral-400" />
        )}
      </div>
      
      {/* Trial Column */}
      <div className="p-4 flex items-center justify-center border-l border-neutral-100">
        {trialText !== undefined ? (
          <span className="text-primary-600 font-medium">{trialText}</span>
        ) : trial ? (
          <Check className="w-5 h-5 text-primary-600" />
        ) : (
          <X className="w-5 h-5 text-neutral-400" />
        )}
      </div>
      
      {/* Premium Column */}
      <div className="p-4 flex items-center justify-center border-l border-neutral-100">
        {premiumText !== undefined ? (
          <span className="text-primary-700 font-medium">{premiumText}</span>
        ) : premium ? (
          <Check className="w-5 h-5 text-primary-700" />
        ) : (
          <X className="w-5 h-5 text-neutral-400" />
        )}
      </div>
    </div>
  )
}