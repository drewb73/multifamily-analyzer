export function Header() {
  return (
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
  )
}