import Link from 'next/link';
import { Button } from '@/components';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Unlock powerful features to analyze your multifamily investments
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Free
            </h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900 dark:text-white">$0</span>
              <span className="text-slate-600 dark:text-slate-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-slate-400 mr-2">✗</span>
                <span className="text-slate-600 dark:text-slate-400">Property Analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-slate-400 mr-2">✗</span>
                <span className="text-slate-600 dark:text-slate-400">Saved Analyses</span>
              </li>
              <li className="flex items-start">
                <span className="text-slate-400 mr-2">✗</span>
                <span className="text-slate-600 dark:text-slate-400">PDF Export</span>
              </li>
            </ul>
            <Button variant="secondary" className="w-full" disabled>
              Current Plan
            </Button>
          </div>

          {/* Premium Plan - Highlighted */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 border-2 border-primary-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Premium
            </h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900 dark:text-white">$4.99</span>
              <span className="text-slate-600 dark:text-slate-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-slate-900 dark:text-white font-medium">Unlimited Property Analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-slate-900 dark:text-white font-medium">Save Unlimited Analyses</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-slate-900 dark:text-white font-medium">PDF Export</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-slate-900 dark:text-white font-medium">Priority Support</span>
              </li>
            </ul>
            <Button className="w-full">
              Upgrade to Premium
            </Button>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <Link href="/dashboard">
            <Button variant="secondary">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}