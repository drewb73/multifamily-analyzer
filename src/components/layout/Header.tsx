import Link from 'next/link'

export function Header() {
  return (
    <nav className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-display font-bold text-primary-600 cursor-pointer">
                  🏢 NumexRE
                </h1>
              </Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link href="/" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <Link href="/features" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  Features
                </Link>
                <Link href="/pricing" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  Pricing
                </Link>
                <Link href="/about" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  About
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <button className="btn-secondary text-sm">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}