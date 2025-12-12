import { MainLayout, Button, Card } from '@/components'

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
          <Button className="px-8 py-4 text-lg">
            Start Analysis
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold text-primary-600 mb-2">$0 Trial</div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Free Limited Trial</div>
          <p className="text-neutral-600">Free limited analysis for 72 hours</p>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold text-primary-600 mb-2">30+</div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Metrics Calculated</div>
          <p className="text-neutral-600">Comprehensive financial analysis</p>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold text-primary-600 mb-2">PDF Export</div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Professional Reports</div>
          <p className="text-neutral-600">Export analysis as PDF reports</p>
        </Card>
      </div>
    </MainLayout>
  )
}