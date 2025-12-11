import { MainLayout } from '@/components'
import { PropertyAnalysisForm } from '../../components/analysis/PropertyAnalysisForm'

export default function AnalyzePage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-neutral-900 mb-4">
            Property Analysis Tool
          </h1>
          <p className="text-lg text-neutral-600">
            Enter your property details to calculate key investment metrics
          </p>
        </div>
        
        <PropertyAnalysisForm />
      </div>
    </MainLayout>
  )
}