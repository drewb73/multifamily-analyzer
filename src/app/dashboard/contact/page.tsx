'use client'

import { Mail, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function ContactSupportPage() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('numexre.spt@gmail.com')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          Contact Support
        </h1>
        <p className="text-lg text-neutral-600 mt-2">
          Get help with your property analysis or provide feedback
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Solo Developer Notice */}
        <div className="elevated-card p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            👋 Solo Developer
          </h3>
          <p className="text-sm text-blue-800">
            This app is currently managed by a solo developer. Please be patient—I'll get to your request as fast as possible!
          </p>
        </div>

        {/* Contact Method */}
        <div className="elevated-card p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-6 w-6 text-primary-600 mr-3" />
            <h3 className="text-lg font-semibold text-neutral-800">
              Contact Method
            </h3>
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-700 mb-2">Email</div>
            <div className="flex items-center gap-3">
              <a 
                href="mailto:numexre.spt@gmail.com"
                className="text-lg text-primary-600 hover:text-primary-700 font-medium"
              >
                numexre.spt@gmail.com
              </a>
              <button
                onClick={copyEmail}
                className="p-2 hover:bg-neutral-100 rounded transition-colors"
                title="Copy email address"
              >
                {copied ? (
                  <CheckCircle className="h-5 w-5 text-success-600" />
                ) : (
                  <Copy className="h-5 w-5 text-neutral-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="elevated-card p-6 bg-primary-50 border-primary-200">
          <h4 className="font-semibold text-primary-800 mb-3">
            💡 Tips for Faster Support
          </h4>
          <ul className="text-sm text-primary-700 space-y-2">
            <li>• <strong>Put in Subject Line</strong> - Report Bug, Feature Request, Billing, Feedback, or Other</li>
            <li>• <strong>Provide Your Email Address</strong> - Include it in your message so I can respond</li>
            <li>• <strong>Include Property Address</strong> - If your issue relates to a specific property</li>
            <li>• <strong>Specify Browser & Device</strong> - Let me know if you're on Desktop, Mobile, etc.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}