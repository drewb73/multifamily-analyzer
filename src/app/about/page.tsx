// src/app/about/page.tsx
'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles, FileText, FolderOpen, Calculator, DollarSign, Mail } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">About NumexRE</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-bold text-neutral-900 mb-6">
            Professional Property Analysis,
            <span className="text-primary-600"> Made Simple</span>
          </h1>
          
          <p className="text-xl text-neutral-600 leading-relaxed">
            Built by a former real estate professional for investors of all levels. 
            NumexRE delivers powerful multifamily property analysis at the price of a venti latte every month.
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-neutral-200">
            <h2 className="text-3xl font-bold text-neutral-900 mb-6">
              Why NumexRE?
            </h2>
            
            <div className="prose prose-lg max-w-none text-neutral-700 space-y-4">
              <p>
                As a former real estate professional, I was frustrated with the complexity and cost of existing property analysis tools. 
                Most solutions either required expensive subscriptions or came with a steep learning curve that slowed down the deal analysis process.
              </p>
              
              <p>
                I built NumexRE to solve this problem. It's a solo development project designed to provide quick, accurate multifamily 
                property analysis with professional-grade exports—without the enterprise price tag or unnecessary complexity.
              </p>

              <p>
                Whether you're a real estate professional, small investor, or managing a medium-sized multifamily portfolio, 
                NumexRE gives you the tools you need to make informed investment decisions.
              </p>
              
              <p className="font-medium text-neutral-900">
                For just $7/month (the price of your favorite coffee), you get unlimited access to tools that typically cost hundreds per month.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Everything You Need to Analyze Deals
            </h2>
            <p className="text-lg text-neutral-600">
              Powerful features designed for investors of all levels
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Quick Analysis
              </h3>
              <p className="text-neutral-600">
                Run comprehensive property analyses in minutes, not hours. Input key metrics and get instant cash flow projections, ROI calculations, and investment returns.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Professional Reports
              </h3>
              <p className="text-neutral-600">
                Generate beautiful, client-ready PDF reports with a single click. Impress investors and partners with professional documentation of your analysis.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <FolderOpen className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Save & Organize
              </h3>
              <p className="text-neutral-600">
                Save unlimited properties and organize them into groups. Keep your portfolio organized in one place and never lose track of potential deals.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                ROI Calculations
              </h3>
              <p className="text-neutral-600">
                Calculate key metrics like Cap Rate, Cash-on-Cash Return, and Gross Rent Multiplier (GRM). Make data-driven investment decisions with confidence.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Highlight */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-center text-white shadow-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-6">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Simple Pricing</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Less Than a Coffee Per Month
            </h2>
            
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              While other platforms charge $50-200/month for similar features, NumexRE gives you unlimited access 
              for just <span className="font-bold text-white">$7/month</span>. No contracts, cancel anytime.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/pricing"
                className="px-8 py-4 bg-white text-primary-700 rounded-lg font-bold hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl"
              >
                View Pricing
              </Link>
              <Link 
                href="/sign-up"
                className="px-8 py-4 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-400 transition-all border-2 border-white/20"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-neutral-600 leading-relaxed mb-8">
              To democratize real estate investment analysis by making professional-grade tools accessible to everyone—
              from first-time investors to seasoned professionals and small to medium multifamily portfolio managers. 
              We believe powerful analysis shouldn't require expensive software or complex spreadsheets.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">$7</div>
                <div className="text-neutral-600">per month</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">∞</div>
                <div className="text-neutral-600">unlimited analyses</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">0</div>
                <div className="text-neutral-600">learning curve</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-neutral-200 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Questions or Feedback?
            </h2>
            
            <p className="text-neutral-600 mb-6">
              NumexRE is constantly evolving based on user feedback. Have a feature request or found a bug? 
              I'd love to hear from you!
            </p>
            
            <a 
              href="mailto:numexre.spt@gmail.com"
              className="inline-flex items-center gap-2 text-xl text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              <Mail className="w-5 h-5" />
              numexre.spt@gmail.com
            </a>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-20">
          <p className="text-neutral-600 mb-6 text-lg">
            Ready to simplify your property analysis?
          </p>
          <Link 
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Sparkles className="w-5 h-5" />
            Start Your Free Trial
          </Link>
          <p className="text-sm text-neutral-500 mt-4">
            No payment required upfront • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}