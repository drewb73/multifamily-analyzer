export default function Home() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-display font-bold text-primary-600">
                  🏢 PropertyAnalyzer
                </h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <a href="#" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">Home</a>
                  <a href="#" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">Features</a>
                  <a href="#" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">Pricing</a>
                  <a href="#" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">About</a>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-secondary text-sm">Sign In</button>
              <button className="btn-primary text-sm">Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
            <button className="btn-primary px-8 py-4 text-lg">
              Start Analysis
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="elevated-card p-6 text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">$4.99</div>
            <div className="text-lg font-semibold text-neutral-800 mb-2">Unlimited Use</div>
            <p className="text-neutral-600">Designed for investors of all experience levels</p>
          </div>
          <div className="elevated-card p-6 text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">30+</div>
            <div className="text-lg font-semibold text-neutral-800 mb-2">Metrics Calculated</div>
            <p className="text-neutral-600">Comprehensive financial analysis</p>
          </div>
          <div className="elevated-card p-6 text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">PDF Export</div>
            <div className="text-lg font-semibold text-neutral-800 mb-2">Professional Reports</div>
            <p className="text-neutral-600">Export analysis as PDF reports</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-neutral-600">
            <p>© 2025 Multifamily Property Analyzer. All rights reserved.</p>
            <p className="mt-2 text-sm">Built with Next.js, TypeScript, and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}