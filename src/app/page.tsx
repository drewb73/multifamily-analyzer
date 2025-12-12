import { MainLayout, Button, Card } from '@/components'
import Link from 'next/link'

export default function Home() {
  return (
    <MainLayout>
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-display font-bold text-neutral-900 mb-6">
          Professional
          <span className="text-primary-600"> Multifamily Property</span>
          <br />
          Analysis Made Simple
        </h1>
        <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-10">
          Calculate CAP rates, cash flow, ROI, and other key metrics for any multifamily property.
          Make informed investment decisions with our comprehensive analysis tool.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button className="px-8 py-4 text-lg">
              Go to Dashboard
            </Button>
          </Link>
          <Button variant="secondary" className="px-8 py-4 text-lg">
            View Features
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold text-primary-600 mb-2">72-Hour</div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Free Trial</div>
          <p className="text-neutral-600">Full access for 72 hours, no credit card required</p>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold text-primary-600 mb-2">30+</div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Metrics Calculated</div>
          <p className="text-neutral-600">Comprehensive financial analysis</p>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold text-primary-600 mb-2">PDF Export</div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Professional Reports</div>
          <p className="text-neutral-600">Export analysis as branded PDF reports</p>
        </Card>
      </div>

      {/* Pricing CTA */}
      <div className="mt-20 p-8 rounded-2xl bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-100">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-neutral-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-neutral-600 mb-6">
            Start your 72-hour free trial today. No credit card required.
            After trial, continue for just $4.99/month.
          </p>
          <Link href="/dashboard">
            <Button className="px-8 py-4 text-lg">
              Start Free Trial
            </Button>
          </Link>
          <p className="text-sm text-neutral-500 mt-4">
            Cancel anytime • No hidden fees • Premium support included
          </p>
        </div>
      </div>
    </MainLayout>
  )
}