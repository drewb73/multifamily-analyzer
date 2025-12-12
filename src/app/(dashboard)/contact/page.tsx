'use client'

import { useState } from 'react'
import { Send, Mail, Phone, Clock } from 'lucide-react'

export default function ContactSupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    to: 'support@propertyanalyzer.com',
    subject: '',
    body: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    alert('Message sent successfully! We\'ll respond within 24 hours.')
    setFormData({
      to: 'support@propertyanalyzer.com',
      subject: '',
      body: ''
    })
    setIsSubmitting(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          Contact Support
        </h1>
        <p className="text-lg text-neutral-600 mt-2">
          Get help with PropertyAnalyzer or provide feedback
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="elevated-card p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* To Field (readonly) */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  To
                </label>
                <div className="flex items-center p-3 border border-neutral-300 rounded-lg bg-neutral-50">
                  <Mail className="h-5 w-5 text-neutral-400 mr-3" />
                  <span className="text-neutral-700">{formData.to}</span>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="input-field"
                  placeholder="How can we help?"
                  required
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                  className="input-field min-h-[200px] resize-y"
                  placeholder="Please describe your issue or question in detail..."
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.subject || !formData.body}
                  className="btn-primary w-full py-3 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          {/* Support Hours */}
          <div className="elevated-card p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-primary-600 mr-3" />
              <h3 className="text-lg font-semibold text-neutral-800">
                Support Hours
              </h3>
            </div>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Monday - Friday:</span>
                <span className="font-medium">9:00 AM - 6:00 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday:</span>
                <span className="font-medium">10:00 AM - 4:00 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday:</span>
                <span className="font-medium">Closed</span>
              </div>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="elevated-card p-6">
            <div className="flex items-center mb-4">
              <Phone className="h-6 w-6 text-secondary-600 mr-3" />
              <h3 className="text-lg font-semibold text-neutral-800">
                Contact Methods
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-neutral-700">Email</div>
                <div className="text-sm text-neutral-600">support@propertyanalyzer.com</div>
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-700">Response Time</div>
                <div className="text-sm text-neutral-600">Within 24 hours</div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="elevated-card p-6 bg-primary-50 border-primary-200">
            <h4 className="font-semibold text-primary-800 mb-3">
              💡 Tips for faster support:
            </h4>
            <ul className="text-sm text-primary-700 space-y-2">
              <li>• Include your property address if relevant</li>
              <li>• Attach screenshots of any issues</li>
              <li>• Specify your browser and device type</li>
              <li>• Check our FAQ first for common questions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}