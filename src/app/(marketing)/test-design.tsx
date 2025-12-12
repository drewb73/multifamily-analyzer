export default function TestDesign() {
  return (
    <div className="min-h-screen gradient-bg p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold text-primary-700 mb-4">
            🏢 Multifamily Property Analyzer
          </h1>
          <p className="text-xl text-neutral-600">
            Professional real estate investment analysis tool
          </p>
        </header>

        {/* Hero Section */}
        <section className="mb-12">
          <div className="elevated-card p-8 text-center">
            <h2 className="text-3xl font-display font-semibold text-neutral-800 mb-4">
              Analyze Any Multifamily Property
            </h2>
            <p className="text-lg text-neutral-600 mb-6 max-w-2xl mx-auto">
              Calculate CAP rates, cash flow, ROI, and more with our comprehensive analysis tool.
            </p>
            <div className="flex justify-center gap-4">
              <button className="btn-primary px-8">Start Analysis</button>
              <button className="btn-secondary px-8">View Demo</button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-12">
          <h2 className="text-3xl font-display font-semibold text-neutral-800 mb-8 text-center">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="elevated-card p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Financial Analysis</h3>
              <p className="text-neutral-600">
                Calculate CAP rates, cash-on-cash returns, NOI, and other key metrics.
              </p>
            </div>
            <div className="elevated-card p-6">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🏘️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Unit Mix Analysis</h3>
              <p className="text-neutral-600">
                Analyze different unit types, rents, and vacancy rates for optimal income.
              </p>
            </div>
            <div className="elevated-card p-6">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Market Comparisons</h3>
              <p className="text-neutral-600">
                Compare current vs. market rents to identify upside potential.
              </p>
            </div>
          </div>
        </section>

        {/* Color System Preview */}
        <section className="mb-12">
          <h2 className="text-3xl font-display font-semibold text-neutral-800 mb-6">
            Design System Colors
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-neutral-700 mb-3">Primary Colors (Blue)</h3>
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={`primary-${shade}`} className="space-y-1">
                    <div className={`h-12 rounded bg-primary-${shade}`} />
                    <p className="text-xs text-center text-neutral-600">P-{shade}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-700 mb-3">Secondary Colors (Teal)</h3>
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={`secondary-${shade}`} className="space-y-1">
                    <div className={`h-12 rounded bg-secondary-${shade}`} />
                    <p className="text-xs text-center text-neutral-600">S-{shade}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}