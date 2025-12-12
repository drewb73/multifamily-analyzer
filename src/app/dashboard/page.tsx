import { PropertyAnalysisForm } from '@/components/analysis/PropertyAnalysisForm';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          Analyze Property
        </h1>
        <p className="text-lg text-neutral-600 mt-2">
          Enter property details to calculate key investment metrics
        </p>
      </div>
      
      <PropertyAnalysisForm />
    </div>
  )
}