'use client'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="border-t border-neutral-200 bg-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-neutral-600">
          <p>© {currentYear} NumexRE. All rights reserved.</p>
          <p className="mt-2 text-sm">Built with Next.js, TypeScript, and Tailwind CSS by NumexRE</p>
        </div>
      </div>
    </footer>
  )
}