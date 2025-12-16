// src/components/analysis/pdf/TabNavigation.tsx
'use client'

import { PDFTabType } from '@/types/pdf'

interface TabNavigationProps {
  activeTab: PDFTabType
  onTabChange: (tab: PDFTabType) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: PDFTabType; label: string; icon: string }[] = [
    { id: 'sections', label: 'Sections', icon: '📄' },
    { id: 'branding', label: 'Branding', icon: '🎨' }
  ]

  return (
    <div className="flex border-b border-neutral-200">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2
              px-6 py-3
              font-semibold text-sm
              border-b-2 transition-all
              ${isActive
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }
            `}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}